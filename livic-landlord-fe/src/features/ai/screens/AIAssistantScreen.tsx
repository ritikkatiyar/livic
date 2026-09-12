import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { getJobStatus, runAICommand } from '@/src/features/ai/api/ai.api';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { Theme } from '@/src/theme/Theme';
import { logger } from '@/src/utils/logger';
import { createStyles } from './AIAssistantScreen.styles';

type AIAssistantScreenProps = {
  token: string;
};

export type AttachedFile = {
  id: string;
  name: string;
  uri: string;
  type: 'image' | 'file';
  mimeType?: string;
  size?: number;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  attachments?: AttachedFile[];
};

const QUICK_COMMANDS = [
  { icon: 'add-business', label: 'Create Property', prompt: 'Create a property named Sunrise PG in Bengaluru near the metro' },
  { icon: 'help-outline', label: 'Property Checklist', prompt: 'What details do you need before creating a new property?' },
  { icon: 'grid-view', label: 'Plan Units', prompt: 'Help me plan units for a 5 floor PG with 4 rooms per floor' },
  { icon: 'payments', label: 'Billing Summary', prompt: 'Summarize overdue rent cycles and draft invoices for this month' },
];

export default function AIAssistantScreen({ token }: AIAssistantScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const scrollViewRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your AI Property Assistant. I can help manage properties, automate rent billing worksheets, structure floor unit plans, and draft communications. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  // Auto scroll to latest message
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isSending]);

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Chat history cleared. What would you like to work on next?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setAttachedFiles([]);
  };

  const handlePickAttachment = useCallback(async () => {
    if (Platform.OS === 'web') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx';
      fileInput.multiple = true;
      fileInput.onchange = (e: any) => {
        const files = Array.from(e.target.files || []) as File[];
        if (!files.length) return;
        const newAttachments: AttachedFile[] = files.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          name: file.name,
          uri: URL.createObjectURL(file),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          mimeType: file.type,
          size: file.size,
        }));
        setAttachedFiles((prev) => [...prev, ...newAttachments].slice(0, 5));
      };
      fileInput.click();
    } else {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: 5,
          quality: 0.8,
        });
        if (!result.canceled && result.assets) {
          const newAttachments: AttachedFile[] = result.assets.map((asset) => ({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            name: asset.fileName || 'photo.jpg',
            uri: asset.uri,
            type: 'image',
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize,
          }));
          setAttachedFiles((prev) => [...prev, ...newAttachments].slice(0, 5));
        }
      } catch (err) {
        logger.error('Failed to pick file:', err);
      }
    }
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      const currentAttachments = [...attachedFiles];
      if ((!trimmedText && currentAttachments.length === 0) || isSending) return;

      const messageContent = trimmedText || (
        currentAttachments.length > 0
          ? `[Attached: ${currentAttachments.map((f) => f.name).join(', ')}] Please analyze the attached document.`
          : ''
      );

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        role: 'user',
        text: messageContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      };

      setMessages((current) => [...current, userMessage]);
      setInput('');
      setAttachedFiles([]);
      setIsSending(true);

      try {
        const response = await runAICommand({ message: messageContent }, token);

        if (response.jobId && response.status === 'PENDING') {
          const jobId = response.jobId;
          let pollCount = 0;
          const maxPolls = 40;

          const poll = async (): Promise<string> => {
            return new Promise((resolve, reject) => {
              const interval = setInterval(async () => {
                pollCount++;
                if (pollCount > maxPolls) {
                  clearInterval(interval);
                  reject(new Error('AI command execution timed out. Please try again.'));
                  return;
                }

                try {
                  const jobStatus = await getJobStatus(jobId, token);
                  if (jobStatus.status === 'COMPLETED') {
                    clearInterval(interval);
                    resolve(jobStatus.response || 'Command completed successfully.');
                  } else if (jobStatus.status === 'FAILED') {
                    clearInterval(interval);
                    reject(new Error(jobStatus.errorMessage || 'AI execution failed.'));
                  }
                } catch (pollErr) {
                  logger.warn('AI polling transient error:', pollErr);
                }
              }, 1500);
            });
          };

          const resultText = await poll();
          setMessages((current) => [
            ...current,
            {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              text: resultText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setMessages((current) => [
            ...current,
            {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              text: response.message || 'I received the command, but no response was returned.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (error: any) {
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-error`,
            role: 'assistant',
            text: error?.message || 'AI request failed. Check backend service configuration.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, token]
  );

  return (
    <PageShell
      scrollable={false}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >

      {/* Main AI Workspace Card */}
      <View style={[styles.chatWorkspace, isDesktop && styles.chatWorkspaceDesktop]}>
        {/* Workspace Header */}
        <View style={styles.workspaceHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.aiOrbIcon, { backgroundColor: theme.Colors.primary }]}
            >
              <MaterialIcons name="auto-awesome" size={20} color={theme.Colors.surfaceContainerLowest} />
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.workspaceTitle}>AI Command Desk</Text>
                <View style={styles.modelBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.modelBadgeText}>Gemini 1.5 Pro</Text>
                </View>
              </View>
              <Text style={styles.workspaceSubtitle}>
                Autonomous assistant for property setups, lease worksheets, and unit management
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleClearChat}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="refresh" size={18} color={theme.Colors.onSurfaceVariant} />
              <Text style={styles.headerBtnText}>Clear Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Command Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>QUICK PROMPTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {QUICK_COMMANDS.map((cmd, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => sendMessage(cmd.prompt)}
                disabled={isSending}
                activeOpacity={0.75}
                style={styles.suggestionChip}
              >
                <MaterialIcons name={cmd.icon as any} size={16} color={theme.Colors.primary} />
                <Text style={styles.suggestionChipText}>{cmd.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Message Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.assistantAvatar}>
                  <MaterialIcons name="auto-awesome" size={16} color={theme.Colors.primary} />
                </View>
              )}

              <View
                style={[
                  styles.bubbleWrapper,
                  message.role === 'user' && { alignItems: 'flex-end' },
                ]}
              >
                {message.role === 'user' ? (
                  <View
                    style={[styles.bubble, styles.userBubble, { backgroundColor: theme.Colors.primary }]}
                  >
                    {message.attachments && message.attachments.length > 0 && (
                      <View style={styles.bubbleAttachmentsRow}>
                        {message.attachments.map((att) => (
                          att.type === 'image' ? (
                            <Image
                              key={att.id}
                              source={{ uri: att.uri }}
                              style={styles.bubbleImageAttachment}
                              resizeMode="cover"
                            />
                          ) : (
                            <View key={att.id} style={styles.bubbleFileAttachment}>
                              <MaterialIcons name="insert-drive-file" size={16} color={theme.Colors.surfaceContainerLowest} />
                              <Text style={styles.bubbleFileName} numberOfLines={1}>
                                {att.name}
                              </Text>
                            </View>
                          )
                        ))}
                      </View>
                    )}
                    <Text style={styles.userMessageText}>{message.text}</Text>
                  </View>
                ) : (
                  <View style={[styles.bubble, styles.assistantBubble]}>
                    <Text style={styles.assistantMessageText}>{message.text}</Text>
                  </View>
                )}

                {message.timestamp && (
                  <Text style={styles.timestampText}>{message.timestamp}</Text>
                )}
              </View>
            </View>
          ))}

          {isSending && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View style={styles.assistantAvatar}>
                <MaterialIcons name="auto-awesome" size={16} color={theme.Colors.primary} />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={theme.Colors.primary} />
                <Text style={styles.loadingText}>Processing command with Gemini 1.5 Pro...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Dock */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={{ width: '100%' }}
        >
          <View style={[styles.inputDock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            {/* Attachment Preview Chips */}
            {attachedFiles.length > 0 && (
              <View style={styles.attachmentsPreviewRow}>
                {attachedFiles.map((file) => (
                  <View key={file.id} style={styles.attachmentChip}>
                    {file.type === 'image' ? (
                      <Image source={{ uri: file.uri }} style={styles.attachmentThumb} resizeMode="cover" />
                    ) : (
                      <MaterialIcons name="insert-drive-file" size={16} color={theme.Colors.primary} />
                    )}
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(file.id)}
                      style={styles.attachmentRemoveBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="Remove file"
                    >
                      <MaterialIcons name="close" size={12} color={theme.Colors.onSurface} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputBox}>
              <TouchableOpacity
                onPress={handlePickAttachment}
                activeOpacity={0.7}
                style={styles.attachButton}
                accessibilityLabel="Attach file or image"
              >
                <MaterialIcons name="attach-file" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder={attachedFiles.length > 0 ? "Add instructions for attached file(s)..." : "Ask AI to execute a task, create a property, or analyze worksheets..."}
                placeholderTextColor="#7d8b8e"
                multiline
                maxLength={1000}
                editable={!isSending}
                onSubmitEditing={() => {
                  if (Platform.OS === 'web') {
                    sendMessage(input);
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => sendMessage(input)}
                disabled={(!input.trim() && attachedFiles.length === 0) || isSending}
                activeOpacity={0.8}
                style={styles.sendButton}
              >
                {(!input.trim() && attachedFiles.length === 0) || isSending ? (
                  <View style={styles.sendIconDisabled}>
                    <MaterialIcons name="arrow-upward" size={20} color={theme.Colors.onSurfaceVariant} />
                  </View>
                ) : (
                  <View
                    style={[styles.sendIconActive, { backgroundColor: theme.Colors.primary }]}
                  >
                    <MaterialIcons name="arrow-upward" size={20} color={theme.Colors.surfaceContainerLowest} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputHintRow}>
              <Text style={styles.inputHint}>Press Enter to execute • Gemini 1.5 Pro Autonomous Agent</Text>
              <Text style={styles.charCount}>{input.length}/1000</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </PageShell>
  );
}

