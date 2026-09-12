import { StyleSheet } from 'react-native';

export const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.45)',
      zIndex: 99998,
    },
    container: {
      position: 'absolute',
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      backgroundColor: theme.Colors.surfaceContainerLowest,
      overflow: 'hidden',
      shadowColor: theme.Colors.shadowColor || '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 99999,
    },
    bubbleTrigger: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleGradient: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatContent: {
      flex: 1,
    },
    header: {
      paddingTop: theme.Spacing.sm,
      paddingHorizontal: theme.Spacing.md,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.Colors.outlineVariant,
    },
    dragBarWrapper: {
      alignSelf: 'center',
      width: 60,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dragBar: {
      width: 38,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: 'rgba(0, 104, 117, 0.25)',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.Spacing.xs,
    },
    headerIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 104, 117, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: theme.Typography.titleSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    closeBtn: {
      padding: 6,
    },
    messagesList: {
      flex: 1,
    },
    messagesContainer: {
      padding: theme.Spacing.md,
      gap: 12,
    },
    examplesWrapper: {
      gap: theme.Spacing.sm,
      marginBottom: theme.Spacing.sm,
    },
    examplesHeader: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 0.2,
    },
    examplePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      borderRadius: 14,
      paddingVertical: theme.Spacing.sm,
      paddingHorizontal: 12,
      gap: 6,
    },
    exampleText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.primary,
      fontWeight: '600',
      flex: 1,
    },
    msgWrapper: {
      flexDirection: 'row',
      width: '100%',
    },
    msgUser: {
      justifyContent: 'flex-end',
    },
    msgAssistant: {
      justifyContent: 'flex-start',
    },
    msgBubble: {
      maxWidth: '85%',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
    },
    bubbleUser: {
      borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderColor: theme.Colors.outlineVariant,
      borderBottomLeftRadius: 4,
    },
    msgText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      lineHeight: 19,
    },
    textUser: {
      fontWeight: '600',
    },
    textAssistant: {
      fontWeight: '500',
    },
    loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.sm,
    },
    loadingText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: theme.Colors.outlineVariant,
      gap: 10,
      backgroundColor: theme.Colors.surfaceContainerLowest,
    },
    input: {
      flex: 1,
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: theme.Spacing.sm,
      fontSize: theme.Typography.bodyMedium.fontSize,
      maxHeight: 80,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
    },
    sendGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
