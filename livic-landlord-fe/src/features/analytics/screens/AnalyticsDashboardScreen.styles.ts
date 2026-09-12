import { StyleSheet } from 'react-native';

export const createStyles = (theme: any, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    scrollContent: {
      gap: 24,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    scrollContentDesktop: {
      paddingTop: 28,
      paddingHorizontal: 36,
      paddingBottom: 48,
      maxWidth: 1400,
      alignSelf: 'center',
      width: '100%',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 14,
    },
    titleBlock: {
      flex: 1,
      minWidth: 260,
    },
    screenTitle: {
      fontSize: isDesktop ? 28 : 22,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: isDesktop ? 14 : 12,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 4,
    },
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: 22,
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    exportBtnText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: 0.2,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      width: '100%',
    },
    twoColumnSection: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: 20,
      width: '100%',
      alignItems: 'stretch',
    },
    trajectoryCol: {
      flex: isDesktop ? 1.65 : 1,
    },
    eventsCol: {
      flex: isDesktop ? 1 : 1,
    },
    breakdownSection: {
      gap: 20,
      width: '100%',
    },
    sectionCard: {
      borderRadius: 24,
      overflow: 'hidden',
    },
    sectionCardContent: {
      padding: isDesktop ? 24 : 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 8,
    },
    sectionTitle: {
      fontSize: theme.Typography.bodyLarge.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: -0.2,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.Colors.outlineVariant,
    },
    tableHeaderCell: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.Colors.outlineVariant,
    },
    tableCellName: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    tableCellSub: {
      fontSize: theme.Typography.labelSmall.fontSize,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    tableCellText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.onSurface,
      fontWeight: '500',
    },
    yieldBadge: {
      backgroundColor: `${theme.Colors.primary}15`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    yieldBadgeText: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '600',
      color: theme.Colors.primary,
    },
    mobileCardList: {
      gap: 12,
    },
    mobileCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      gap: 10,
    },
    mobileCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mobileCardTitle: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    mobileCardSub: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.onSurfaceVariant,
    },
    progressBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.Colors.surfaceContainerHigh || 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginTop: 6,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
  });
