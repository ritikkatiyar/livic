import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useExpenseConfiguration } from '@/src/features/finance/hooks/useExpenseConfiguration';
import { createStyles } from './ExpenseConfigurationScreen.styles';

import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';

// Sub-components
import { ExpenseConfigCard } from '../components/billing/ExpenseConfigCard';
import { ConfirmModal } from '../components/billing/ConfirmModal';

export default function ExpenseConfigurationScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { handleScroll } = useScrollNav();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const validParamId = (paramPropertyId && paramPropertyId !== 'null' && paramPropertyId !== 'undefined') ? paramPropertyId : null;
  const propertyId = selectedPropertyId || validParamId || null;
  const { showToast } = useToast();

  const {
    charges,
    isLoading,
    refetch,
    deactivateConfig,
    reactivateConfig,
    deleteConfig,
  } = useExpenseConfiguration(propertyId, token);

  useFocusEffect(
    React.useCallback(() => {
      if (propertyId && token) {
        refetch();
      }
    }, [refetch, propertyId, token])
  );

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        onConfirm();
      }
    });
  };

  const handleDeactivate = (id: string) => {
    requestConfirmation(
      "Deactivate Charge?",
      "Deactivating this configuration will prevent compiling future invoices. Active worksheets will not be affected.",
      async () => {
        try {
          await deactivateConfig(id);
          showToast("Charge configuration deactivated", "success");
        } catch (e: any) {
          showToast(e.message || "Failed to deactivate charge.", "error");
        }
      }
    );
  };

  const handleReactivate = (id: string) => {
    requestConfirmation(
      "Reactivate Charge?",
      "This will resume invoice generation triggers and ledger mappings for this category.",
      async () => {
        try {
          await reactivateConfig(id);
          showToast("Charge configuration reactivated!", "success");
        } catch (e: any) {
          showToast(e.message || "Failed to reactivate charge.", "error");
        }
      }
    );
  };

  const handleDeletePermanently = (id: string) => {
    requestConfirmation(
      "Delete Permanently?",
      "This action cannot be undone. All active worksheets, meter records & drafts using this charge configuration will be permanently deleted.",
      async () => {
        try {
          await deleteConfig(id);
          showToast("Charge configuration permanently deleted.", "success");
        } catch (e: any) {
          showToast(e.message || "Failed to delete configuration.", "error");
        }
      }
    );
  };

  const handleConfigureExpense = () => {
    if (!propertyId) {
      showToast("Please select a property from the top navigation bar first", "info");
      return;
    }
    router.push(`/create-expense?propertyId=${propertyId}`);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderContent = () => {
    if (!properties || properties.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="business" size={36} color={theme.Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Property Created Yet</Text>
          <Text style={styles.emptySubtitle}>
            Setup your property profile and floor layout to activate expense configuration panels.
          </Text>
          <TouchableOpacity 
            style={styles.createPropertyButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/properties/create')}
          >
            <View style={styles.createPropertyGradient}>
              <MaterialIcons name="add" size={24} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.createPropertyText}>CREATE FIRST PROPERTY</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    if (!propertyId) {
      return (
        <PropertyRequiredBanner
          title="Select Property for Expense Setup"
          description="Select a property below to view, configure, and manage its utility and maintenance charges."
          icon="receipt-long"
          properties={properties}
          selectedPropertyId={propertyId}
          onSelectProperty={setSelectedPropertyId}
        />
      );
    }

    if (isLoading && charges.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      );
    }

    if (charges.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="receipt-long" size={36} color={theme.Colors.onSurfaceVariant} />
          </View>
          <Text style={styles.emptyTitle}>No charges found.</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your overheads by adding your first charge category.
          </Text>
          
          <TouchableOpacity 
            style={styles.createPropertyButton} 
            activeOpacity={0.8}
            onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
          >
            <View style={styles.createPropertyGradient}>
              <MaterialIcons name="add" size={24} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.createPropertyText}>CREATE CHARGE</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={isDesktop ? styles.gridContainer : styles.listContainer}>
        {charges.map(charge => (
          <ExpenseConfigCard
            key={charge.id}
            charge={charge}
            propertyId={propertyId}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDeletePermanently}
            isDesktop={isDesktop}
            isDark={isDark}
          />
        ))}
      </View>
    );
  };

  const renderDesktopShell = () => (
    <View style={[styles.desktopShell, { flex: 1 }]}>
      <View style={styles.desktopMain}>


        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            <View style={styles.desktopHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => router.push('/expenses')}
                  style={{ marginRight: 14, padding: 8, borderRadius: 12, backgroundColor: theme.Colors.glassFill, borderWidth: 1, borderColor: theme.Colors.glassStroke }}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
                </TouchableOpacity>
                <View style={styles.largeTitleContainer}>
                  <Text style={styles.titleLineDesktop}>Billing Configurations</Text>
                  <Text style={styles.subtitleDesktop}>Manage ledger entries, metered utilities, penalty strategies & tax groups</Text>
                </View>
              </View>

              <ActionButton
                label="CONFIGURE EXPENSE"
                icon="add"
                iconPosition="right"
                variant="primary"
                size="md"
                onPress={handleConfigureExpense}
              />
            </View>

            {renderContent()}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderMobileShell = () => (
    <View style={[styles.gradient, { flex: 1 }]}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.titleContainer}>
            <Text style={styles.kicker}>FINANCE CONFIGURATION</Text>
            <View style={styles.titleActionRow}>
              <Text style={styles.screenTitle}>Billing Configurations</Text>
              <TouchableOpacity 
                style={styles.headerCreateTouch}
                onPress={handleConfigureExpense}
                activeOpacity={0.8}
              >
                <View style={styles.headerCreateInner}>
                  <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.headerCreateText}>ADD</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.screenSubtitle}>Configure ledger charge codes, utility scales and automation thresholds</Text>
          </View>

          {renderContent()}

          {!isDesktop && charges.length > 0 && !isLoading && (
            <TouchableOpacity 
              style={styles.dashedButton} 
              activeOpacity={0.7}
              onPress={handleConfigureExpense}
            >
              <View style={styles.dashedIconCircle}>
                 <MaterialIcons name="add" size={24} color={theme.Colors.primary} />
              </View>
              <Text style={styles.dashedButtonText}>Create New Expense</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <PageShell 
      scrollable={false}
      edges={isDesktop ? ['top'] : []}
    >
      {isDesktop ? renderDesktopShell() : renderMobileShell()}

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </PageShell>
  );
}

