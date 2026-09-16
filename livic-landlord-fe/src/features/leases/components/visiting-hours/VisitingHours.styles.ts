import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/src/theme/ThemeContext';

export const createVisitingHoursStyles = (theme: AppTheme) => StyleSheet.create({
  // Screen
  content: {
    gap: theme.Spacing.md,
  },
  contentDesktop: {
    paddingTop: theme.Spacing.lg,
    paddingHorizontal: theme.Spacing.xl,
    paddingBottom: theme.Spacing.xxl,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: theme.Spacing.xs,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: theme.Spacing.xs,
  },
  backLinkText: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.primary,
  },
  kicker: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: theme.Colors.primary,
  },
  title: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onSurface,
  },
  subtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  unsavedText: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.tertiary,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.primaryContainer,
  },
  noticeText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    lineHeight: theme.Typography.bodyMedium.lineHeight,
    color: theme.Colors.onPrimaryContainer,
  },
  columns: {
    gap: theme.Spacing.md,
  },
  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.lg,
  },
  mainColumn: {
    gap: theme.Spacing.md,
  },
  mainColumnDesktop: {
    flex: 3,
    minWidth: 0,
  },
  sideColumn: {
    gap: theme.Spacing.md,
  },
  sideColumnDesktop: {
    flex: 2,
    minWidth: 0,
  },
  mobileSave: {
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.sm,
  },
  skeletonStack: {
    gap: theme.Spacing.md,
  },

  // Cards
  card: {
    borderRadius: theme.Rounded.xl,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  cardHint: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginBottom: theme.Spacing.md,
  },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    paddingVertical: theme.Spacing.xs,
  },
  textLinkLabel: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.primary,
  },

  // Weekly hours
  dayRow: {
    paddingVertical: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outlineVariant,
    gap: theme.Spacing.sm,
  },
  dayRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  dayRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.Spacing.sm,
  },
  dayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  dayName: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    minWidth: 96,
  },
  dayMeta: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  closedText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  timeField: {
    flex: 1,
    minWidth: 0,
  },
  toText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: theme.Rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  fieldError: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.error,
  },

  // Booking rules
  ruleGroup: {
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.md,
  },
  ruleLabel: {
    fontSize: theme.Typography.labelLarge.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurface,
  },
  ruleHelp: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  segmented: {
    flexDirection: 'row',
    padding: theme.Spacing.xs,
    gap: theme.Spacing.xs,
    borderRadius: theme.Rounded.md,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.Rounded.sm,
  },
  segmentActive: {
    backgroundColor: theme.Colors.primary,
  },
  segmentText: {
    fontSize: theme.Typography.labelLarge.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: theme.Colors.onPrimary,
    fontWeight: '600',
  },
  rulesGrid: {
    gap: theme.Spacing.md,
  },
  rulesGridWide: {
    flexDirection: 'row',
  },
  rulesGridItem: {
    flex: 1,
    minWidth: 0,
  },
  timezoneText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },

  // Blocked dates
  dateStrip: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  dateChip: {
    width: 64,
    alignItems: 'center',
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.Rounded.md,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    gap: 2,
  },
  dateChipActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  dateChipBlocked: {
    backgroundColor: theme.Colors.errorContainer,
    borderColor: theme.Colors.errorContainer,
  },
  dateChipSmall: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  dateChipDay: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  dateChipTextActive: {
    color: theme.Colors.onPrimary,
  },
  dateChipTextBlocked: {
    color: theme.Colors.onErrorContainer,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  blockForm: {
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.lg,
    backgroundColor: theme.Colors.surfaceContainerLow,
    marginBottom: theme.Spacing.md,
  },
  blockList: {
    gap: theme.Spacing.sm,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    padding: theme.Spacing.sm,
    paddingLeft: theme.Spacing.md,
    borderRadius: theme.Rounded.md,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  blockItemText: {
    flex: 1,
    gap: 2,
  },
  blockItemTitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  blockItemMeta: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  emptyText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },

  // Preview
  previewDay: {
    paddingVertical: theme.Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outlineVariant,
    gap: theme.Spacing.xs,
  },
  previewDayFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  previewDayLabel: {
    fontSize: theme.Typography.labelLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  slotChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.xs,
  },
  slotChip: {
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.Rounded.sm,
    backgroundColor: theme.Colors.primaryContainer,
  },
  slotChipFull: {
    backgroundColor: theme.Colors.tertiaryContainer,
  },
  slotChipUnavailable: {
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  slotChipText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.onPrimaryContainer,
  },
  slotChipTextFull: {
    color: theme.Colors.onTertiaryContainer,
  },
  slotChipTextUnavailable: {
    color: theme.Colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.sm,
  },

  // Tours tab banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  bannerStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.Rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.primaryContainer,
  },
  bannerBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
    minWidth: 0,
  },
  bannerText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: theme.Typography.labelLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  bannerSummary: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
});
