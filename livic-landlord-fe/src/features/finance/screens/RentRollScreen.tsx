import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatCard } from '@/src/components/common/display/StatCard';
import { SectionHeader } from '@/src/components/common/display/SectionHeader';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';
import { BlockFilterPills } from '@/src/components/common/inputs/BlockFilterPills';
import { useRentRoll } from '@/src/features/finance/hooks/useRentRoll';
import type { RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { createStyles } from './RentRollScreen.styles';

// Sub-components
import { PreFlightChecklistCard } from '../components/billing/PreFlightChecklistCard';
import { RecordCashModal } from '../components/billing/RecordCashModal';
import { RentRollInvoiceList } from '../components/billing/RentRollInvoiceList';
import { PublishInvoicesModal } from '../components/billing/PublishInvoicesModal';

export default function RentRollScreen({ token: propToken }: { token?: string | null } = {}) {
  const { accessToken } = useAuth();
  const token = propToken || accessToken;
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { selectedPropertyId, setSelectedPropertyId, selectedBlockId, setSelectedBlockId } = useGlobalPropertySelection();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const validParamId = (paramPropertyId && paramPropertyId !== 'null' && paramPropertyId !== 'undefined') ? paramPropertyId : null;
  const propertyId = selectedPropertyId || validParamId || null;
  const { showToast } = useToast();

  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };
  
  const [dueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const [page, setPage] = useState<number>(0);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [billingMonth, propertyId, selectedBlockId, debouncedSearchQuery]);

  // Custom hook wrapping react-query queries and mutations
  const {
    rentCyclesData,
    checklist,
    isLoading,
    generateRentCycle,
    isGenerating,
    publishRentCycles,
    isPublishing,
    publishSingleInvoice,
    unpublishRentCycles,
    isUnpublishing,
    recordCashPayment,
    isRecordingCash,
  } = useRentRoll(propertyId, billingMonth, debouncedSearchQuery, page, pageSize, token, selectedBlockId);

  const [selectedInvoice, setSelectedInvoice] = useState<RentCycleResponse | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashNote, setCashNote] = useState<string>('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  const handleOpenCashModal = (invoice: RentCycleResponse) => {
    setSelectedInvoice(invoice);
    setCashAmount(invoice.totalAmount.toString());
    setCashNote('Cash received by property manager');
    setShowCashModal(true);
    setReceiptSuccess(false);
  };

  const handleConfirmCashPayment = async () => {
    if (!token || !selectedInvoice) return;
    const amountNum = parseFloat(cashAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid cash amount.", "error");
      return;
    }
    try {
      await recordCashPayment({ id: selectedInvoice.id, amount: amountNum, note: cashNote });
      setReceiptSuccess(true);
      showToast("Cash payment recorded successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to record cash payment.", "error");
    }
  };

  const handleGenerate = async () => {
    if (!token || !propertyId) return;
    try {
      const res = await generateRentCycle(dueDate);
      const total = res.succeeded.length + res.failed.length;
      if (res.failed.length === 0) {
        showToast(`All ${res.succeeded.length} rent cycles generated successfully!`, "success");
      } else {
        const failedDetails = res.failed.map(f => `Unit ${f.unitNumber || 'N/A'}: ${f.reason}`).join('\n');
        Alert.alert(
          'Generation Completed with Failures',
          `${res.succeeded.length} of ${total} rent cycles generated successfully, ${res.failed.length} failed.\n\nFailures:\n${failedDetails}`,
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      showToast(e.message || "Failed to generate rent cycle.", "error");
    }
  };

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [targetSingleInvoice, setTargetSingleInvoice] = useState<RentCycleResponse | null>(null);

  const openPublishBatchModal = () => {
    setTargetSingleInvoice(null);
    setShowPublishModal(true);
  };

  const openPublishSingleModal = (invoice: RentCycleResponse) => {
    setTargetSingleInvoice(invoice);
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (!token) return;
    if (targetSingleInvoice) {
      try {
        await publishSingleInvoice(targetSingleInvoice.id);
        showToast("Invoice published & tenant notified via push, email, and WhatsApp!", "success");
        setShowPublishModal(false);
        setTargetSingleInvoice(null);
      } catch (e: any) {
        showToast(e.message || "Failed to publish invoice.", "error");
      }
    } else {
      if (!propertyId) return;
      try {
        const res = await publishRentCycles();
        setShowPublishModal(false);
        const total = res.succeeded.length + res.failed.length;
        if (res.failed.length === 0) {
          showToast(`All ${res.succeeded.length} invoices published & tenants notified!`, "success");
        } else {
          const failedDetails = res.failed.map(f => `Unit ${f.unitNumber || 'N/A'}: ${f.reason}`).join('\n');
          Alert.alert(
            'Publishing Completed with Failures',
            `${res.succeeded.length} of ${total} invoices published successfully, ${res.failed.length} failed.\n\nFailures:\n${failedDetails}`,
            [{ text: 'OK' }]
          );
        }
      } catch (e: any) {
        showToast(e.message || "Failed to publish invoices.", "error");
      }
    }
  };

  const handleUnpublish = async () => {
    if (!token || !propertyId) return;
    try {
      const res = await unpublishRentCycles();
      const total = res.succeeded.length + res.failed.length;
      if (res.failed.length === 0) {
        showToast("Invoices reverted to draft successfully!", "success");
      } else {
        const failedDetails = res.failed.map(f => `Unit ${f.unitNumber || 'N/A'}: ${f.reason}`).join('\n');
        Alert.alert(
          'Revert Completed with Failures',
          `${res.succeeded.length} of ${total} invoices reverted successfully, ${res.failed.length} failed.\n\nFailures:\n${failedDetails}`,
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      showToast(e.message || "Failed to unpublish invoices.", "error");
    }
  };

  const invoices = rentCyclesData?.content || [];
  const totalRevenue = rentCyclesData?.totalExpectedRevenue || 0;
  const publishedCount = rentCyclesData?.publishedCount || 0;
  const pendingCount = rentCyclesData?.pendingDraftsCount || 0;
  const totalPages = rentCyclesData?.totalPages || 0;
  const totalElements = rentCyclesData?.totalElements || 0;
  const hasGenerated = invoices.length > 0 || publishedCount > 0 || pendingCount > 0;

  const renderContent = () => {
    if (!properties || properties.length === 0) {
      return (
        <View style={{ flex: 1, padding: theme.Spacing.lg, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ padding: theme.Spacing.xl, borderRadius: theme.Rounded.xl, alignItems: 'center', maxWidth: 500, width: '100%', backgroundColor: theme.Colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.Colors.outline }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.Colors.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.md }}>
              <MaterialIcons name="business" size={32} color={theme.Colors.primary} />
            </View>
            <Text style={{ fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface, marginBottom: theme.Spacing.sm, textAlign: 'center' }}>No Property Created Yet</Text>
            <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', marginBottom: theme.Spacing.lg, lineHeight: 20 }}>
              Generating rent rolls and invoices requires an active property. Create your first property to start running rent cycles.
            </Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.Spacing.lg, paddingVertical: 14, gap: theme.Spacing.sm, backgroundColor: theme.Colors.primary, borderRadius: theme.Rounded.lg }}
              onPress={() => router.push('/properties/create')}
            >
              <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
              <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700' }}>Create First Property</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!propertyId) {
      return (
        <PropertyRequiredBanner
          title="Select Property for Rent Roll"
          description="Rent cycles, invoicing, and billing worksheets are compiled per property. Select a property to continue."
          icon="receipt-long"
          properties={properties}
          selectedPropertyId={propertyId}
          onSelectProperty={setSelectedPropertyId}
        />
      );
    }

    if (isLoading && invoices.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.inner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 280 }}>
            {isDesktop && (
              <TouchableOpacity
                onPress={() => router.push('/expenses')}
                style={{ marginRight: 14, padding: 8, borderRadius: 12, backgroundColor: theme.Colors.glassFill, borderWidth: 1, borderColor: theme.Colors.glassStroke }}
                activeOpacity={0.75}
              >
                <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: theme.Typography.headlineMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface, }}>Rent Roll & Invoices</Text>
              <Text style={{ fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, }}>Generate draft invoices, publish monthly cycles & track collection status</Text>
            </View>
          </View>

          <View style={styles.selectorContainer}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBadge}>
              <MaterialIcons name="chevron-left" size={20} color={theme.Colors.primary} />
            </TouchableOpacity>
            <View style={styles.monthBadge}>
              <MaterialIcons name="calendar-today" size={16} color={theme.Colors.primary} />
              <Text style={styles.monthBadgeText}>
                {new Date(billingMonth + "-02").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBadge}>
              <MaterialIcons name="chevron-right" size={20} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {!propertyId ? (
          <PropertyRequiredBanner
            title="Select Property to Generate Draft"
            description="Select a property below to run pre-flight checks and compile a draft billing worksheet."
            icon="fact-check"
            properties={properties}
            selectedPropertyId={propertyId}
            onSelectProperty={setSelectedPropertyId}
          />
        ) : !hasGenerated ? (
          <PreFlightChecklistCard
            checklist={checklist}
            billingMonth={billingMonth}
            isGenerating={isGenerating}
            isDesktop={isDesktop}
            onGenerate={handleGenerate}
          />
        ) : (
          <View style={styles.resultsContainer}>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Expected Revenue</Text>
              <Text style={styles.summaryAmount}>₹ {totalRevenue.toFixed(2)}</Text>
              
              <View style={styles.summaryStatusRow}>
                <StatCard
                  label="Published"
                  value={publishedCount}
                  loading={isLoading}
                  trend="Tenant App notified"
                  trendType="positive"
                  iconName="check-circle"
                  iconColor={theme.Colors.tertiary}
                  valueColor={theme.Colors.tertiary}
                  style={styles.miniStat}
                />
                <StatCard
                  label="Pending Drafts"
                  value={pendingCount}
                  loading={isLoading}
                  trend="Awaiting publish"
                  trendType="neutral"
                  iconName="hourglass-empty"
                  iconColor={theme.Colors.primary}
                  valueColor={theme.Colors.primary}
                  style={styles.miniStat}
                />
                <StatCard
                  label="Utility Meters"
                  value={checklist ? `${checklist.meterReadingsEntered}/${checklist.meterReadingsExpected}` : 'Complete'}
                  loading={isLoading}
                  trend={checklist && checklist.meterReadingsEntered < checklist.meterReadingsExpected ? 'Readings missing' : 'All meters logged'}
                  trendType={checklist && checklist.meterReadingsEntered < checklist.meterReadingsExpected ? 'neutral' : 'positive'}
                  iconName="electric-bolt"
                  iconColor={theme.Colors.secondary}
                  valueColor={theme.Colors.secondary}
                  style={styles.miniStat}
                />
              </View>

              {!hasGenerated && (
                <View style={styles.actionGroup}>
                  <ActionButton
                    title="GENERATE DRAFT INVOICES"
                    onPress={handleGenerate}
                    loading={isGenerating}
                    style={styles.publishBtn}
                  />
                </View>
              )}

              {pendingCount > 0 && (
                <View style={styles.actionGroup}>
                  <ActionButton
                    title={publishedCount > 0 ? 'PUBLISH TO REMAINING TENANTS' : 'PUBLISH TO TENANTS'}
                    onPress={openPublishBatchModal}
                    loading={isPublishing}
                    style={styles.publishBtn}
                  />

                  <ActionButton
                    title="RE-GENERATE DRAFT INVOICES"
                    onPress={handleGenerate}
                    loading={isGenerating}
                    variant="outline"
                    style={styles.reGenerateBtn}
                  />
                </View>
              )}

              {publishedCount > 0 && (
                <ActionButton
                  title="REVERT TO DRAFT (UNPUBLISH)"
                  onPress={handleUnpublish}
                  loading={isUnpublishing}
                  variant="danger"
                  style={[styles.publishBtn, { marginTop: pendingCount > 0 ? 12 : 0 }]}
                />
              )}
            </GlassCard>

            {/* Multi-Block Filter Pills */}
            <BlockFilterPills
              propertyId={propertyId}
              selectedBlockId={selectedBlockId}
              onSelectBlockId={setSelectedBlockId}
            />

            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Unit, Tenant name, or Phone..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.Colors.primary} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </View>

            <RentRollInvoiceList
              invoices={invoices}
              debouncedSearchQuery={debouncedSearchQuery}
              onClearSearch={() => setSearchQuery('')}
              onPublishSingle={openPublishSingleModal}
              onOpenCashModal={handleOpenCashModal}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />

            {isLoading && <ActivityIndicator color={theme.Colors.primary} style={{ marginVertical: 14 }} />}
          </View>
        )}

        <RecordCashModal
          visible={showCashModal}
          selectedInvoice={selectedInvoice}
          cashAmount={cashAmount}
          cashNote={cashNote}
          isRecording={isRecordingCash}
          receiptSuccess={receiptSuccess}
          setCashAmount={setCashAmount}
          setCashNote={setCashNote}
          onClose={() => setShowCashModal(false)}
          onConfirm={handleConfirmCashPayment}
        />

        <PublishInvoicesModal
          visible={showPublishModal}
          count={targetSingleInvoice ? 1 : pendingCount}
          totalAmount={targetSingleInvoice ? targetSingleInvoice.totalAmount : undefined}
          billingMonth={billingMonth}
          isPublishing={isPublishing}
          onCancel={() => {
            setShowPublishModal(false);
            setTargetSingleInvoice(null);
          }}
          onConfirm={handleConfirmPublish}
        />
      </View>
    );
  };

  const renderDesktopShell = () => (
    <View style={{ flex: 1, backgroundColor: theme.Colors.background }}>
      <View style={{ flex: 1, width: '100%' }}>

        <ScrollView contentContainerStyle={styles.desktopScroll} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );

  if (isDesktop) {
    return renderDesktopShell();
  }

  return (
    <PageShell 
      scrollable 
      onEndReached={() => {
        if (!isLoading && page + 1 < totalPages) {
          setPage(page + 1);
        }
      }}
      edges={[]} 
      contentContainerStyle={isDesktop ? styles.desktopScroll : styles.mobileScroll}
    >
      {renderContent()}
    </PageShell>
  );
}


