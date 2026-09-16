import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/src/theme/ThemeContext';

export const createTourRequestStyles = (theme: AppTheme) => StyleSheet.create({
  panel: {
    gap: theme.Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
  },
  list: {
    gap: theme.Spacing.md,
  },
  card: {
    borderRadius: theme.Rounded.xl,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.Spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.Rounded.full,
    backgroundColor: theme.Colors.secondaryContainer,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.Typography.labelLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSecondaryContainer,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  prospectName: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.sm,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: theme.Rounded.sm,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    maxWidth: '100%',
  },
  contactText: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '500',
    color: theme.Colors.primary,
    flexShrink: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
  },
  detailItem: {
    flex: 1,
    minWidth: 120,
    padding: theme.Spacing.sm,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    gap: theme.Spacing.xs,
  },
  detailLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  noteBox: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
    padding: theme.Spacing.sm,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.errorContainer,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
    padding: theme.Spacing.sm,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.tertiaryContainer,
  },
  warningText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onTertiaryContainer,
  },
  noteText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onErrorContainer,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
  },
  actionsRowDesktop: {
    justifyContent: 'flex-end',
  },
  actionItemMobile: {
    flex: 1,
  },
  footerText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.sm,
  },
  skeletonCard: {
    borderRadius: theme.Rounded.xl,
  },
});
