import React, { useState, useRef, useEffect } from 'react';
import { useReducedMotion } from '@/src/theme/motion';
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
  BackHandler,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { runAICommand } from '@/src/features/ai/api/ai.api';
import { createStyles } from './FloatingAIAssistant.styles';
import { NAV_SCROLL_IGNORE, useScrollNav } from './ScrollContext';
import { useAIScreenContext } from '@/src/features/ai/hooks/useAIScreenContext';
import { AssistantMascot, MascotMood } from './AssistantMascot';
import { ASSISTANT_SIZE, assistantDockBottom, assistantDockRight, useLiviInTopBar } from './bottomDock';
import { onOpenAssistantRequest } from './assistantEvents';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function FloatingAIAssistant() {
  const { isDesktop, isTablet } = useResponsive();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { accessToken } = useAuth();
  const { theme, isDark } = useAppTheme();
  const { subscribeNavHidden, setOverlayOpen } = useScrollNav();
  const insets = useSafeAreaInsets();
  const { context: screenContext, suggestions, label: contextLabel } = useAIScreenContext();
  const brandGradient = [theme.Colors.primary, theme.Colors.primary] as const;

  const [isOpen, setIsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // On narrow screens and with large text, Livi lives in the top bar and only the chat card shows here
  const liviInTopBar = useLiviInTopBar();
  const openRequestRef = useRef<() => void>(() => {});
  useEffect(() => onOpenAssistantRequest(() => openRequestRef.current()), []);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi, I'm Livi! I can see which screen you're on, so just ask about it — or tell me what you want to set up.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  
  // Animations
  const reduceMotion = useReducedMotion();
  const animValue = useRef(new Animated.Value(0)).current; // 0: closed, 1: open
  const bubbleScale = useRef(new Animated.Value(1)).current; // For bounce effect
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  const mascotMood: MascotMood = isGreeting ? 'happy' : isNavHidden ? 'watching' : 'idle';

  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  // Livi stays in the corner beside the bar; while the bar hides on scroll it looks down at the page
  useEffect(() => subscribeNavHidden(setIsNavHidden), [subscribeNavHidden]);

  useEffect(() => {
    // With reduced motion the chat card appears in place rather than growing out of the bubble
    if (reduceMotion) {
      animValue.setValue(isOpen ? 1 : 0);
      return;
    }
    Animated.spring(animValue, {
      toValue: isOpen ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [isOpen, reduceMotion]);

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

  // While the chat is open the tab bar steps aside, so it never shows under or beside the card
  useEffect(() => {
    setOverlayOpen(isOpen);
  }, [isOpen, setOverlayOpen]);

  // Android back closes the chat instead of navigating the screen behind it
  useEffect(() => {
    if (!isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [isOpen]);

  // Rendered by the app shell only, so there is no route to check: it is simply absent
  // on full-screen routes such as the AI desk and the auth screens.
  if (isDesktop || !accessToken) {
    return null;
  }

  const handleOpen = () => {
    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
    // Let Livi squint happily for a beat before the sheet expands over it
    setIsGreeting(true);
    setTimeout(() => setIsOpen(true), 220);
    setTimeout(() => setIsGreeting(false), 700);
  };

  openRequestRef.current = handleOpen;

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
      // The service answers in one call now, so there is no job to poll.
      const response = await runAICommand({ message: text, context: screenContext }, accessToken);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.message || 'An error occurred during execution.'
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

  // Interpolations for open sheet layout
  const cardWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [ASSISTANT_SIZE, windowWidth * 0.92],
  });

  const cardMaxHeight = keyboardHeight > 0
    ? Math.min(360, windowHeight * 0.42)
    : Math.min(520, windowHeight * 0.65);

  const cardHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [ASSISTANT_SIZE, cardMaxHeight],
  });

  const cardBorderRadius = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [ASSISTANT_SIZE / 2, 24],
  });

  // Closed, Livi sits in the bottom bar's row, beside the pill
  const cardRight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [assistantDockRight(windowWidth, isTablet), (windowWidth * 0.08) / 2],
  });

  const cardBottom = keyboardHeight > 0
    ? keyboardHeight + 10
    : animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [assistantDockBottom(insets.bottom), 20],
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
        // @ts-ignore react-native-web forwards dataSet to data-* attributes
        dataSet={{ navScroll: NAV_SCROLL_IGNORE }}
        style={[
          styles.container,
          // Closed, Livi is an outlined button so the selected tab stays the only solid teal in the bar
          !isOpen && styles.bubbleRing,
          // While typing elsewhere, Livi's bubble gets out of the keyboard's way
          !isOpen && keyboardHeight > 0 && styles.hiddenForKeyboard,
          !isOpen && liviInTopBar && styles.hiddenForKeyboard,
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
            accessibilityLabel="Ask Livi, AI assistant"
          >
            <Animated.View style={{ transform: [{ scale: bubbleScale }] }}>
              <AssistantMascot
                size={ASSISTANT_SIZE - 4}
                color={theme.Colors.surfaceContainerHigh}
                featureColor={theme.Colors.primary}
                mood={mascotMood}
              />
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
                <AssistantMascot size={28} color={theme.Colors.primary} mood={isSending ? 'watching' : 'idle'} />
                <Text style={styles.headerTitle}>Livi · AI Assistant</Text>
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

            {/* What the assistant knows about the current screen */}
            <View style={styles.contextChip} accessibilityLabel={`Assistant context: ${contextLabel}`}>
              <MaterialIcons name="visibility" size={14} color={theme.Colors.primary} />
              <Text style={styles.contextChipText}>Viewing: {contextLabel}</Text>
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
                {suggestions.map((ex) => (
                  <TouchableOpacity
                    key={ex}
                    style={styles.examplePill}
                    onPress={() => sendMessage(ex)}
                    disabled={isSending}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="bolt" size={14} color={theme.Colors.primary} />
                    <Text style={styles.exampleText}>{ex}</Text>
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
                placeholder="Ask Livi…"
                placeholderTextColor={theme.Colors.placeholder}
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
                  <MaterialIcons name="send" size={16} color={theme.Colors.onPrimary} />
                </View>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </>
  );
}
