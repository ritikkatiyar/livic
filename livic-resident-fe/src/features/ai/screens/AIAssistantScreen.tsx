import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { getJobStatus, runAICommand } from '@/src/features/ai/api/ai.api';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { logger } from '@/src/utils/logger';
import { createStyles } from './AIAssistantScreen.styles';

type AIAssistantScreenProps = {
  token: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const EXAMPLES = [
  'Create a property named Sunrise PG in Bengaluru near the metro',
  'What details do you need before creating a new property?',
  'Help me plan units for a 5 floor PG with 4 rooms per floor',
];

export default function AIAssistantScreen({ token }: AIAssistantScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'Hello! I am your Livic AI Concierge. Ask me anything about your tenancy, lease agreement, maintenance requests, or building policies.',
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  const animateClose = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: 600,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  // PanResponder to enable smooth drag-to-dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const pollJobStatus = async (jobId: string, assistantMsgId: string) => {
    const maxAttempts = 30;
    const intervalMs = 2000;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const job = await getJobStatus(jobId, token);
        if (job.status === 'COMPLETED') {
          clearInterval(interval);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: job.response || (job as any).result?.message || 'Operation executed successfully.' }
                : msg
            )
          );
          setIsSending(false);
        } else if (job.status === 'FAILED') {
          clearInterval(interval);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: job.errorMessage || (job as any).error || 'Failed to process AI command.' }
                : msg
            )
          );
          setIsSending(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: 'AI processing timed out. Please review active tasks later.' }
                : msg
            )
          );
          setIsSending(false);
        }
      } catch (err: any) {
        clearInterval(interval);
        logger.error('[AIAssistantScreen] Polling error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, text: 'Network disturbance while awaiting AI response.' }
              : msg
          )
        );
        setIsSending(false);
      }
    }, intervalMs);
  };

  const sendMessage = React.useCallback(async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isSending) return;

    setInput('');
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: query },
      { id: assistantMsgId, role: 'assistant', text: 'Thinking...' },
    ]);
    setIsSending(true);

    try {
      const response = await runAICommand({ message: query }, token);
      if (response?.jobId) {
        pollJobStatus(response.jobId, assistantMsgId);
      } else if (response?.message) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: response.message } : msg
          )
        );
        setIsSending(false);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: 'Command processed.' } : msg
          )
        );
        setIsSending(false);
      }
    } catch (err: any) {
      logger.error('[AIAssistantScreen] Send error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: 'Unable to communicate with AI Assistant. Try again later.' }
            : msg
        )
      );
      setIsSending(false);
    }
  }, [input, isSending, token]);

  return (
    <View style={styles.outerWrapper}>
      {isDesktop && (
        <DesktopNavBar 
          hideTabs={true}
          title="AI Command"
          onBack={() => router.back()}
          backText="Back"
        />
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        {/* Backdrop overlay listener to collapse panel when tapping anywhere outside */}
        <Pressable 
          style={styles.backdropOverlay} 
          onPress={animateClose} 
        />

        <Animated.View 
          style={[
            styles.dialogueContainer,
            isDesktop && styles.dialogueContainerDesktop,
            { 
              transform: [{ translateY }],
              paddingBottom: isDesktop ? 0 : Math.max(insets.bottom, 8) 
            }
          ]}
          pointerEvents="auto"
        >
          <View style={styles.glassCard}>
            {/* Drag Handle Container with PanResponder */}
            <View {...panResponder.panHandlers} style={styles.dragHandleZone}>
              <View style={styles.dragBar} />
            </View>

            {/* Header */}
            <View style={styles.dialogueHeader}>
              <View style={styles.headerTitleGroup}>
                <View
                  style={[styles.aiOrbIcon, { backgroundColor: theme.Colors.primary }]}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={theme.Colors.surfaceContainerLowest} />
                </View>
                <View>
                  <Text style={styles.dialogueTitle}>AI Command Desk</Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.onlineText}>Gemini 1.5 Pro</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Message Stream */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageStream}
              contentContainerStyle={styles.messageStreamContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Quick Command Suggestions */}
              <View style={styles.suggestionBlock}>
                <Text style={styles.suggestionTitle}>QUICK COMMANDS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.Spacing.sm }}>
                  {EXAMPLES.map((example) => (
                    <TouchableOpacity
                      key={example}
                      onPress={() => sendMessage(example)}
                      disabled={isSending}
                      activeOpacity={0.75}
                      style={styles.chipButton}
                    >
                      <MaterialIcons name="bolt" size={14} color={theme.Colors.primary} />
                      <Text style={styles.chipText}>{example}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Chat Messages */}
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.msgRow,
                    message.role === 'user' ? styles.msgRowUser : styles.msgRowAssistant,
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={styles.assistantAvatar}>
                      <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
                    </View>
                  )}

                  {message.role === 'user' ? (
                    <View
                      style={[styles.bubble, styles.userBubble, { backgroundColor: theme.Colors.primary }]}
                    >
                      <Text style={styles.userText}>{message.text}</Text>
                    </View>
                  ) : (
                    <View style={[styles.bubble, styles.assistantBubble]}>
                      <Text style={styles.assistantText}>{message.text}</Text>
                    </View>
                  )}
                </View>
              ))}

              {isSending && (
                <View style={[styles.msgRow, styles.msgRowAssistant]}>
                  <View style={styles.assistantAvatar}>
                    <MaterialIcons name="auto-awesome" size={14} color={theme.Colors.primary} />
                  </View>
                  <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color={theme.Colors.primary} />
                    <Text style={styles.loadingText}>Analyzing command...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={[styles.dialogueFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask AI to execute a task..."
                  placeholderTextColor="#7d8b8e"
                  multiline
                  maxLength={1000}
                  editable={!isSending}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />
                <TouchableOpacity
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || isSending}
                  activeOpacity={0.8}
                  style={styles.sendButtonWrapper}
                >
                  {(!input.trim() || isSending) ? (
                    <View style={styles.sendButtonDisabled}>
                      <MaterialIcons name="arrow-upward" size={18} color="rgba(0, 104, 117, 0.3)" />
                    </View>
                  ) : (
                    <View
                      style={[styles.sendButtonActive, { backgroundColor: theme.Colors.primary }]}
                    >
                      <MaterialIcons name="arrow-upward" size={18} color={theme.Colors.surfaceContainerLowest} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
