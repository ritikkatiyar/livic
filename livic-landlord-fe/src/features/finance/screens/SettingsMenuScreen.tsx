import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { createStyles } from './SettingsMenuScreen.styles';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';

export default function SettingsMenuScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { handleScroll } = useScrollNav();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties, isLoading } = useProperties();
  const { showToast } = useToast();
  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const validParamId = (paramPropertyId && paramPropertyId !== 'null' && paramPropertyId !== 'undefined') ? paramPropertyId : null;
  const propertyId = selectedPropertyId || validParamId || null;

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);

  const querySuffix = propertyId ? `?propertyId=${propertyId}` : '';
  const { canRoute } = usePermissions();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const menuItems = [
    {
      id: 'charge-config',
      title: 'Charge Configuration',
      description: 'Set up rents, utilities & billing logic',
      icon: 'receipt-long',
      route: `/expenses/charge-config${querySuffix}`,
      gradientColors: [theme.Colors.primary, '#06b6d4'] as const,
      accentColor: theme.Colors.primary,
      bg: 'rgba(0, 104, 117, 0.1)',
    },
    {
      id: 'meter-readings',
      title: 'Meter Readings',
      description: 'Record monthly utility meter readings',
      icon: 'speed',
      // Placeholder segment keeps the route matchable for permissions; navigation requires a selected property.
      route: `/properties/${propertyId || 'select'}/meter-readings`,
      gradientColors: [theme.Colors.tertiary, '#f59e0b'] as const,
      accentColor: theme.Colors.tertiary,
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      id: 'worksheets',
      title: 'Billing Worksheets',
      description: 'Input meter readings & variable charges',
      icon: 'edit-document',
      route: `/expenses/billing-worksheet${querySuffix}`,
      gradientColors: [theme.Colors.secondary, '#7c3aed'] as const,
      accentColor: theme.Colors.secondary,
      bg: 'rgba(79, 70, 229, 0.1)',
    },
    {
      id: 'rent-roll',
      title: 'Generate Rent Roll',
      description: 'Publish monthly invoices to tenants',
      icon: 'point-of-sale',
      route: `/expenses/rent-roll${querySuffix}`,
      gradientColors: [theme.Colors.primary, '#10b981'] as const,
      accentColor: theme.Colors.primary,
      bg: 'rgba(5, 150, 105, 0.1)',
    },
    {
      id: 'ledger',
      title: 'Finance Ledger',
      description: 'Audit trail of all transactions',
      icon: 'account-balance',
      route: `/expenses/ledger${querySuffix}`,
      gradientColors: ['#0d9488', '#14b8a6'] as const,
      accentColor: '#0d9488',
      bg: 'rgba(13, 148, 136, 0.1)',
    },
  ]
    .filter((item) => canRoute(item.route))
    .map((item, index) => ({ ...item, step: index + 1 }));

  const openMenuItem = (route: string) => {
    if (properties.length === 0) {
      showToast('Please create a property first to access finance features.', 'error');
      router.push('/properties/create');
      return;
    }
    if (route.includes('/select/')) {
      showToast('Select a property first.', 'error');
      return;
    }
    router.push(route as any);
  };

  const renderMobileContent = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Workflow Label */}
      <View style={styles.workflowLabelRow}>
        <View style={styles.workflowLine} />
        <Text style={styles.workflowLabel}>BILLING PIPELINE</Text>
        <View style={styles.workflowLine} />
      </View>

      {/* Menu Items */}
      <View style={styles.listContainer}>
        {menuItems.map((item, index) => (
          <Animated.View
            key={item.id}
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24 + index * 8, 0],
                }),
              }],
            }}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => openMenuItem(item.route)}
              style={[styles.listItem, properties.length === 0 && { opacity: 0.6 }]}
            >
              <View style={styles.menuCard}>
                {/* Left accent stripe */}
                <View
                  style={[styles.cardStripe, { backgroundColor: item.gradientColors[0] || theme.Colors.primary }]}
                />
                <View style={styles.cardContent}>
                  {/* Step badge */}
                  <View style={styles.stepBadgeWrapper}>
                    <View
                      style={[styles.stepBadge, { backgroundColor: item.gradientColors[0] || theme.Colors.primary }]}
                    >
                      <Text style={styles.stepNumber}>{item.step}</Text>
                    </View>
                    {/* Icon below badge */}
                    <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                      <MaterialIcons name={item.icon as any} size={22} color={item.accentColor} />
                    </View>
                  </View>

                  {/* Text */}
                  <View style={styles.textContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDesc}>{item.description}</Text>
                  </View>

                  {/* Chevron */}
                  <View style={[styles.chevronWrapper, { backgroundColor: item.bg }]}>
                    <MaterialIcons name="chevron-right" size={20} color={item.accentColor} />
                  </View>
                </View>

                {/* Connector dot to next step */}
                {index < menuItems.length - 1 && (
                  <View style={styles.connectorDot}>
                    <MaterialIcons name="arrow-downward" size={12} color={theme.Colors.outline} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Bottom note */}
      {menuItems.length > 1 && (
        <View style={styles.tipCard}>
          <MaterialIcons name="lightbulb-outline" size={16} color={theme.Colors.primary} />
          <Text style={styles.tipText}>
            Follow steps 1 → {menuItems.length} for a complete billing cycle each month.
          </Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <PageShell scrollable edges={isDesktop ? ['top'] : []}>
      {isDesktop && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: theme.Colors.primary, letterSpacing: 0.2, marginBottom: 4 }}>
            Financial Management
          </Text>
          <Text style={[{ ...theme.Typography.headlineLg, color: theme.Colors.onBackground }]}>
            Finance & Billing
          </Text>
          <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 4 }}>
            Manage rents, recurring charges, billing worksheets, and financial ledgers.
          </Text>
        </View>
      )}

      {!propertyId && (
        <PropertyRequiredBanner
          title="Select Active Property"
          description="Choose a property below to scope your billing worksheets, rent roll, charges, and ledger."
          icon="account-balance"
          properties={properties}
          selectedPropertyId={propertyId}
          onSelectProperty={setSelectedPropertyId}
          onClose={() => setBannerDismissed(true)}
          style={{ marginBottom: theme.Spacing.lg }}
        />
      )}

      {/* Finance tools are property-scoped: keep them hidden while the property picker is showing. */}
      {!propertyId && !bannerDismissed ? null : isDesktop ? (
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => openMenuItem(item.route)}
              style={[styles.gridItem, properties.length === 0 && { opacity: 0.6 }]}
            >
              <GlassCard style={{ padding: 20 }}>
                <View style={styles.cardContent}>
                  <View style={[styles.iconWrapper, { backgroundColor: theme.Colors.glassFill }]}>
                    <MaterialIcons name={item.icon as any} size={28} color={theme.Colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDesc}>{item.description}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        renderMobileContent()
      )}
    </PageShell>
  );
}

