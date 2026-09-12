import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { usePathname } from 'expo-router';
import { runAICommand, getJobStatus } from '@/src/features/ai/api/ai.api';
import { createStyles } from './FloatingAIAssistant.styles';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const EXAMPLES = [
  'Generate rent roll for this month',
  'Send billing notification to all defaulters',
  'Help me plan units for a 5 floor PG with 4 rooms per floor',
];

export default function FloatingAIAssistant() {
  const { isDesktop } = useResponsive();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { accessToken } = useAuth();
  const { theme, isDark } = useAppTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tell me what you want to do in Tenant Living. I can guide and perform tasks for you!',
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  
  // Animations
  const animValue = useRef(new Animated.Value(0)).current; // 0: closed, 1: open
  const bubbleScale = useRef(new Animated.Value(1)).current; // For bounce effect

  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isOpen ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  // Keyboard height listener for mobile keyboard compensation
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pathname = usePathname();

  if (isDesktop || !accessToken || pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const handleOpen = () => {
    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending || !accessToken) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const response = await runAICommand({ message: text }, accessToken);
      let assistantMsgText = '';

      if (response.status === 'COMPLETED') {
        assistantMsgText = response.message || 'Task completed successfully.';
      } else if (response.status === 'RUNNING' || response.status === 'QUEUED' || response.jobId) {
        assistantMsgText = response.message || 'Your request is processing in the background. I will update you soon.';
        if (response.jobId) {
          pollJobStatus(response.jobId);
        }
      } else {
        assistantMsgText = response.message || 'An error occurred during execution.';
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: assistantMsgText
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: err.message || 'Failed to connect to AI Service.'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    if (!accessToken) return;
    const interval = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId, accessToken);
        if (job.status === 'COMPLETED') {
          clearInterval(interval);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            text: `Background Task Completed: ${job.response || 'Execution successful.'}`
          }]);
        } else if (job.status === 'FAILED') {
          clearInterval(interval);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            text: `Background Task Failed: ${job.errorMessage || 'Failed to execute.'}`
          }]);
        }
      } catch (e) {
        console.error('AI job status check failed', e);
      }
    }, 3000);
  };

  // Interpolations for open sheet layout
  const cardWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [56, windowWidth * 0.92],
  });

  const cardMaxHeight = keyboardHeight > 0 
    ? Math.min(360, windowHeight * 0.42) 
    : Math.min(520, windowHeight * 0.65);

  const cardHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [56, cardMaxHeight],
  });

  const cardBorderRadius = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 24],
  });

  const cardRight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, (windowWidth * 0.08) / 2],
  });

  // Calculate bottom offset to float AI trigger cleanly above bottom navigation bar
  const defaultClosedBottom = Platform.OS === 'ios' ? 112 : 92;
  const cardBottom = keyboardHeight > 0 
    ? keyboardHeight + 10 
    : animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [defaultClosedBottom, 20],
      });

  const contentOpacity = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0, 1],
  });

  const triggerOpacity = animValue.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [1, 0, 0],
  });

  return (
    <>
      {/* Translucent Backdrop when open */}
      {isOpen && (
        <Pressable 
          style={styles.backdrop} 
          onPress={handleClose} 
        />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: cardBorderRadius,
            right: cardRight,
            bottom: cardBottom,
          },
        ]}
      >
        {/* 1. Closed State Floating Bubble Trigger */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: triggerOpacity, pointerEvents: isOpen ? 'none' : 'auto' },
          ]}
        >
          <TouchableOpacity
            style={styles.bubbleTrigger}
            onPress={handleOpen}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open AI Assistant"
          >
            <Animated.View style={{ transform: [{ scale: bubbleScale }] }}>
              <View
                style={[styles.bubbleGradient, { backgroundColor: theme.Colors.primary }]}
              >
                <MaterialIcons name="chat" size={24} color="#ffffff" />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* 2. Open State AI Desk Sheet */}
        <Animated.View
          style={[
            styles.chatContent,
            { opacity: contentOpacity, pointerEvents: isOpen ? 'auto' : 'none' },
          ]}
        >
          {/* Header with Drag / Minimize Bar */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.dragBarWrapper} 
              activeOpacity={0.6}
              onPress={handleClose}
            >
              <View style={styles.dragBar} />
            </TouchableOpacity>

            <View style={styles.headerTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.headerIconWrapper}>
                  <MaterialIcons name="chat" size={16} color={theme.Colors.primary} />
                </View>
                <Text style={styles.headerTitle}>AI Assistant</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close AI Assistant"
              >
                <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            {/* Scrollable Message History */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {/* Example Queries */}
              <View style={styles.examplesWrapper}>
                <Text style={styles.examplesHeader}>Try asking:</Text>
                {EXAMPLES.map((ex) => (
                  <TouchableOpacity
                    key={ex}
                    style={styles.examplePill}
                    onPress={() => sendMessage(ex)}
                    disabled={isSending}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="bolt" size={14} color={theme.Colors.primary} />
                    <Text style={styles.exampleText} numberOfLines={1}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Bubbles */}
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgWrapper,
                    msg.role === 'user' ? styles.msgUser : styles.msgAssistant,
                  ]}
                >
                  <View
                    style={[
                      styles.msgBubble,
                      msg.role === 'user'
                        ? [styles.bubbleUser, { backgroundColor: theme.Colors.primary, borderColor: theme.Colors.primary }]
                        : styles.bubbleAssistant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        msg.role === 'user'
                          ? [styles.textUser, { color: theme.Colors.onPrimary }]
                          : [styles.textAssistant, { color: theme.Colors.onSurface }],
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}

              {isSending && (
                <View style={[styles.msgWrapper, styles.msgAssistant]}>
                  <View style={[styles.msgBubble, styles.bubbleAssistant, styles.loadingBubble]}>
                    <ActivityIndicator size="small" color={theme.Colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.Colors.onSurfaceVariant }]}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Chat Footer Input */}
            <View style={styles.inputBar}>
              <TextInput
                style={[styles.input, { borderColor: `${theme.Colors.primary}33`, color: theme.Colors.onSurface }]}
                placeholder="Ask AI to help..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={1000}
                editable={!isSending}
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                }}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => sendMessage(input)}
                disabled={isSending || !input.trim()}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <View
                  style={[styles.sendGradient, { backgroundColor: theme.Colors.primary }]}
                >
                  <MaterialIcons name="send" size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </>
  );
}
