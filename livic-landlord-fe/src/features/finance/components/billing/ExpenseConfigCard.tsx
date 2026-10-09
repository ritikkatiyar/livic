import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PopoverMenu, anchorFromPress, type MenuAnchor } from '@/src/components/common/inputs/PopoverMenu';
import type { ChargeConfigResponse } from '@/src/features/finance/api/charge.api';
import { withAlpha } from '@/src/theme/colorUtils';

interface ExpenseConfigCardProps {
  charge: ChargeConfigResponse;
  propertyId: string | null;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
  isDesktop: boolean;
  isDark: boolean;
}

export function ExpenseConfigCard({
  charge,
  propertyId,
  onDeactivate,
  onReactivate,
  onDelete,
  isDesktop,
  isDark,
}: ExpenseConfigCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = React.useState<MenuAnchor | null>(null);
  const openEditor = () => router.push(`/create-expense?propertyId=${propertyId}&chargeId=${charge.id}`);

  const getIconData = (name: string) => {
    const n = name.toLowerCase();

    if (n.includes('rent')) {
      return { name: 'vpn-key', bg: withAlpha(theme.Colors.success, 0.12), color: theme.Colors.tertiary };
    }
    if (n.includes('electricity') || n.includes('power')) {
      return { name: 'flash-on', bg: withAlpha(theme.Colors.tertiary, 0.12), color: theme.Colors.tertiary };
    }
    if (n.includes('water') || n.includes('sewage') || n.includes('utility')) {
      return { name: 'opacity', bg: withAlpha(theme.Colors.primary, 0.12), color: theme.Colors.secondary };
    }
    if (n.includes('internet') || n.includes('wifi') || n.includes('network')) {
      return { name: 'router', bg: withAlpha(theme.Colors.secondary, 0.12), color: theme.Colors.secondary };
    }
    if (n.includes('maintenance') || n.includes('cleaning') || n.includes('service')) {
      return { name: 'build', bg: withAlpha(theme.Colors.error, 0.12), color: theme.Colors.error };
    }
    return { name: 'receipt', bg: withAlpha(theme.Colors.onSurfaceVariant, 0.12), color: theme.Colors.onSurfaceVariant };
  };

  const formatEnum = (str: string) => {
    if (!str) return '';
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const iconObj = getIconData(charge.chargeName);

  return (
    <View 
      style={[
        isDesktop ? styles.gridCardWrapper : styles.listCardWrapper,
        !charge.isActive && { opacity: 0.7 }
      ]}
    >
      <GlassCard style={[styles.glassCardInner, isDesktop && styles.glassCardDesktop]}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={openEditor}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: iconObj.bg }]}>
              <MaterialIcons name={iconObj.name as any} size={24} color={iconObj.color} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{charge.chargeName}</Text>
              <Text style={styles.cardSub}>
                {formatEnum(charge.calculationStrategy)} • {formatEnum(charge.billingFrequency)}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, { backgroundColor: charge.isActive ? withAlpha(theme.Colors.primary, 0.15) : withAlpha(theme.Colors.error, 0.15) }]}>
                 <Text style={[styles.badgeText, { color: charge.isActive ? theme.Colors.primary : theme.Colors.error }]}>
                   {charge.isActive ? 'ACTIVE' : 'INACTIVE'}
                 </Text>
              </View>
              {charge.baseRate != null ? (
                <View style={styles.amountContainer}>
                  <Text style={styles.amountBold}>₹{charge.baseRate}</Text>
                  {charge.calculationStrategy === 'METERED' ? (
                    <Text style={styles.amountSuffix}>/ {charge.unitType || 'unit'}</Text>
                  ) : (
                    <Text style={styles.amountSuffix}>/ mo</Text>
                  )}
                </View>
              ) : null}
            </View>
          </View>

        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.taxBadge}>
              <MaterialIcons 
                name={charge.applySalesTax ? 'check-circle' : 'cancel'} 
                size={14} 
                color={charge.applySalesTax ? theme.Colors.primary : theme.Colors.onSurfaceVariant} 
              />
              <Text style={styles.taxText}>
                {charge.applySalesTax ? 'Sales Tax Included' : 'No Sales Tax'}
              </Text>
            </View>
            {charge.lateFeePercentage != null && charge.lateFeePercentage > 0 ? (
              <View style={styles.lateFeeBadge}>
                <MaterialIcons name="warning" size={14} color={theme.Colors.tertiary} />
                <Text style={styles.lateFeeText}>{charge.lateFeePercentage}% Late Fee</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footerRightContainer}>
            {/* Phones tuck the actions into a menu, as property cards do; a red pill per card is too loud */}
            {!isDesktop ? (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={(e) => setMenuAnchor(anchorFromPress(e))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`More actions for ${charge.chargeName}`}
              >
                <MaterialIcons name="more-vert" size={22} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            ) : (
            <View style={{ flexDirection: 'row', gap: theme.Spacing.sm, alignItems: 'center' }}>
                {charge.isActive ? (
                  <ActionButton
                    label="Deactivate"
                    icon="remove-circle-outline"
                    variant="danger"
                    size="sm"
                    onPress={() => onDeactivate(charge.id)}
                  />
                ) : (
                  <>
                    <ActionButton
                      label="Reactivate"
                      icon="restore"
                      variant="outline"
                      size="sm"
                      onPress={() => onReactivate(charge.id)}
                    />
                    <ActionButton
                      label="Delete"
                      icon="delete-outline"
                      variant="danger"
                      size="sm"
                      onPress={() => onDelete(charge.id)}
                    />
                  </>
                )}
            </View>
            )}
          </View>
        </View>
      </GlassCard>

      <PopoverMenu
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        items={[
          { key: 'edit', label: 'Edit charge', icon: 'edit', onPress: openEditor },
          ...(charge.isActive
            ? [{ key: 'deactivate', label: 'Deactivate charge', icon: 'remove-circle-outline' as const, destructive: true, onPress: () => onDeactivate(charge.id) }]
            : [
                { key: 'reactivate', label: 'Reactivate charge', icon: 'restore' as const, onPress: () => onReactivate(charge.id) },
                { key: 'delete', label: 'Delete charge', icon: 'delete-outline' as const, destructive: true, onPress: () => onDelete(charge.id) },
              ]),
        ]}
      />
    </View>
  );
}

const createStyles = (theme: any, isDesktop: boolean) => StyleSheet.create({
  gridCardWrapper: {
    width: '48%',
    marginBottom: 20,
  },
  listCardWrapper: {
    width: '100%',
    marginBottom: theme.Spacing.md,
  },
  expenseCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.Spacing.md,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  cardSub: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingVertical: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.sm,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountBold: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  amountSuffix: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginLeft: 2,
    fontWeight: '600',
  },
  // Wraps on narrow cards so the action drops below the badges instead of leaving the card
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: withAlpha(theme.Colors.onSurface, 0.05),
    paddingTop: theme.Spacing.md,
    minHeight: 44,
  },
  footerRightContainer: {
    minHeight: 32,
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // GlassCard pads its own content
  glassCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  glassCardDesktop: {
    minHeight: 175,
  },
  footerLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    flexShrink: 1,
  },
  taxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taxText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  lateFeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lateFeeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.tertiary,
    fontWeight: '700',
  },
});
