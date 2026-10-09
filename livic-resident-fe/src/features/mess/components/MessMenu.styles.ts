import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/src/theme/ThemeContext';
import type { DietType } from '../api/messMenu.api';

/** Veg, egg and non-veg marks use the success, tertiary and error tokens so they read in both themes. */
export const dietColor = (theme: AppTheme, diet: DietType): string =>
  diet === 'VEG' ? theme.Colors.success : diet === 'EGG' ? theme.Colors.tertiary : theme.Colors.error;

export const createMessMenuStyles = (theme: AppTheme, isDark: boolean) => StyleSheet.create({
  // Screen
  scrollContent: {
    paddingHorizontal: theme.Spacing.containerPadding,
    paddingBottom: theme.Spacing.xxl,
    gap: theme.Spacing.lg,
  },
  scrollContentDesktop: {
    paddingTop: theme.Spacing.lg,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {
    gap: theme.Spacing.xs,
  },
  kicker: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onBackground,
  },
  subtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  dayChips: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  skeletonStack: {
    gap: theme.Spacing.md,
  },

  // Cards
  card: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: theme.Rounded.xl,
    padding: theme.Spacing.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: theme.Surface.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: theme.Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  cardSub: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.Spacing.xs,
    paddingVertical: theme.Spacing.xs,
  },
  linkText: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
  },

  // Day
  dayTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
    padding: theme.Spacing.md,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.tertiaryContainer,
  },
  noteText: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onTertiaryContainer,
  },
  meals: {
    gap: theme.Spacing.md,
  },

  // Meal
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
    color: theme.Colors.onBackground,
  },
  mealTime: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onBackground,
  },
  emptyText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },

  // Diet mark
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
});
