import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/src/theme/ThemeContext';
import type { DietType } from '../api/messMenu.api';

/** Veg, egg and non-veg marks use the success, tertiary and error tokens so they read in both themes. */
export const dietColor = (theme: AppTheme, diet: DietType) =>
  diet === 'VEG' ? theme.Colors.success : diet === 'EGG' ? theme.Colors.tertiary : theme.Colors.error;

export const createMessMenuStyles = (theme: AppTheme) => StyleSheet.create({
  // Screen
  content: {
    gap: theme.Spacing.md,
  },
  contentDesktop: {
    paddingTop: theme.Spacing.lg,
    paddingHorizontal: theme.Spacing.xl,
    paddingBottom: theme.Spacing.xxl,
    width: '100%',
    maxWidth: 1080,
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
  mobileSave: {
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.sm,
  },
  skeletonStack: {
    gap: theme.Spacing.md,
  },
  readOnlyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.primaryContainer,
  },
  readOnlyText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    lineHeight: theme.Typography.bodyMedium.lineHeight,
    color: theme.Colors.onPrimaryContainer,
  },

  // Cards
  card: {
    borderRadius: theme.Rounded.xl,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.Spacing.sm,
    marginBottom: theme.Spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  cardHint: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.md,
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

  // On/off switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.Rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.primaryContainer,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },

  // Day chips
  dayChips: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },

  // Day editor
  dayHeader: {
    gap: theme.Spacing.xs,
    marginTop: theme.Spacing.md,
    marginBottom: theme.Spacing.sm,
  },
  dayTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  fieldLabel: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  inputError: {
    borderColor: theme.Colors.error,
  },
  noteInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.tertiaryContainer,
  },
  noteBannerText: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onTertiaryContainer,
  },
  fieldError: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.error,
  },
  meals: {
    gap: theme.Spacing.md,
    marginTop: theme.Spacing.md,
  },

  // Meal card
  mealCard: {
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  mealHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: theme.Spacing.sm,
    rowGap: 2,
  },
  mealName: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  mealTime: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  emptyText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  addInput: {
    flex: 1,
    minWidth: 0,
  },

  // Dish row
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  itemName: {
    flexGrow: 1,
    flexBasis: 180,
    minWidth: 0,
  },
  itemNameText: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  readOnlyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: theme.Rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },

  // Diet marks
  dietPicker: {
    flexDirection: 'row',
    gap: theme.Spacing.xs,
  },
  dietChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  dietChipText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  dietMark: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  dietMarkDot: {
    width: 5,
    height: 5,
    borderRadius: theme.Rounded.full,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.md,
    backgroundColor: theme.Colors.modalOverlayBackground,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: theme.Rounded.xl,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    padding: theme.Spacing.lg,
    gap: theme.Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.Spacing.md,
  },
  modalTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  modalBody: {
    gap: theme.Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
  },

  // Meals editor rows
  slotRow: {
    gap: theme.Spacing.sm,
    paddingTop: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outlineVariant,
  },
  slotRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  slotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  slotTimes: {
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

  // Copy day
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    paddingVertical: theme.Spacing.sm,
  },
  dayOptionText: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurface,
  },
  quickPicks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
  },
});
