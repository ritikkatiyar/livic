import { StyleSheet } from 'react-native';
import { Theme} from '@/src/theme/Theme';

export const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  titleContainer: { marginBottom: theme.Spacing.xl },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  // — Mobile Header —
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  compactTitleText: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  mobileLargeTitle: {
    marginBottom: theme.Spacing.lg,
  },
  titleLine: {
    fontSize: theme.Typography.headlineXl.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
    lineHeight: 46,
    letterSpacing: -1,
  },
  mobileSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.sm,
    fontWeight: '500',
    lineHeight: 20,
  },

  // — Quick Stats Hero —
  statsHero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    marginBottom: theme.Spacing.lg,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  statValue: {
    fontSize: theme.Typography.headlineMd.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  statWarning: {
    color: theme.Colors.tertiary,
  },
  statLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 104, 117, 0.12)',
  },
  statsSubtitle: {
    textAlign: 'center',
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // — Workflow Label —
  workflowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.Spacing.md,
  },
  workflowLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 104, 117, 0.15)',
  },
  workflowLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },

  // — Menu Items —
  listContainer: {
    gap: 0,
  },
  listItem: {
    width: '100%',
    marginBottom: 2,
  },
  menuCard: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: theme.Spacing.md,
    gap: 14,
  },
  stepBadgeWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.surfaceContainerLowest,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: 3,
  },
  menuDesc: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorDot: {
    alignSelf: 'center',
    marginBottom: -6,
    marginTop: -4,
    zIndex: 10,
    opacity: 0.6,
  },

  // — Tip Card —
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLow,
    paddingVertical: 12,
    paddingHorizontal: theme.Spacing.md,
    marginTop: theme.Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Desktop
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.lg,
  },
  gridItem: {
    width: '48%',
    minWidth: 300,
  },
});
