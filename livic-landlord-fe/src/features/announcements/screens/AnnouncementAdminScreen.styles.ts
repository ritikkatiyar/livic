import { StyleSheet } from 'react-native';

export const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    inner: {
      width: '100%',
      maxWidth: 1280,
      alignSelf: 'center',
    },
    headerSection: {
      marginBottom: 24,
    },
    kicker: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.primary,
      letterSpacing: 0.2,
      marginBottom: 4,
    },
    pageTitle: {
      ...theme.Typography.headlineLg,
      color: theme.Colors.onBackground,
    },
    pageSubtitle: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 4,
      maxWidth: 680,
      lineHeight: 20,
    },
    grid: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },
    gridStacked: {
      flexDirection: 'column',
      gap: 20,
    },
    composerColumn: {
      flex: 1,
      minWidth: 0,
      width: '100%',
    },
    historyColumn: {
      flex: 1.15,
      minWidth: 0,
      width: '100%',
    },
    mobileToggleBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.Colors.glassFill,
      borderWidth: 1,
      borderColor: theme.Colors.glassStroke,
      marginBottom: 16,
    },
    mobileSubtitle: {
      color: theme.Colors.onSurfaceVariant,
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
    },
    toggleHistoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 104, 117, 0.10)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 104, 117, 0.25)',
    },
    toggleHistoryText: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.primary,
    },
  });
