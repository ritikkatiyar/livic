import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { formatCurrency, formatCompactCurrency } from '@/src/utils/formatters';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { StatCard } from '@/src/components/common/display/StatCard';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { useResponsive } from '@/src/hooks/useResponsive';
import { createStyles } from './OwnerLeasesScreen.styles';
import { useOwnerLeases } from '../hooks/useOwnerLeases';
import {
  BookRoomModal, ServeNoticeModal, CashTokenModal,
  ConvertToLeaseModal, EditLeaseTermsModal,
} from '../components/LeaseModals';
import { LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { UnitBookingResponse } from '@/src/features/leases/api/unitBooking.api';
import { useRouter } from 'expo-router';
import { ContextualStepGuideBar } from '@/src/features/onboarding/components/ContextualStepGuideBar';
import { useAdminTutorial } from '@/src/features/onboarding/context/AdminTutorialContext';

export default function OwnerLeasesScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();

  const data = useOwnerLeases();
  const {
    properties, selectedPropertyId, setSelectedPropertyId,
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    filteredLeases, filteredBookings, vacatingUnits, availableUnits,
    isLoadingData, isFetchingMore, hasMoreLeases, handleLoadMoreLeases,
    totalLeasesElements,
    isBookingModalVisible, setIsBookingModalVisible,
    isNoticeModalVisible, setIsNoticeModalVisible,
    isCashModalVisible, setIsCashModalVisible,
    isConversionModalVisible, setIsConversionModalVisible,
    isEditTermsModalVisible, setIsEditTermsModalVisible,
    setSelectedBookingId,
    setSelectedLeaseId,
    editingLease, isSavingTerms,
    noticeMoveOutDate, setNoticeMoveOutDate,
    cashAmount, setCashAmount, cashNote, setCashNote,
    bookingUnitId, setBookingUnitId,
    bookingTenantName, setBookingTenantName,
    bookingTenantPhone, setBookingTenantPhone,
    bookingTenantEmail, setBookingTenantEmail,
    bookingTokenAmount, setBookingTokenAmount,
    bookingExpectedMoveIn, setBookingExpectedMoveIn,
    convMonthlyRentAmount, setConvMonthlyRentAmount,
    convSecurityDeposit, setConvSecurityDeposit,
    editRentAmount, setEditRentAmount,
    editSecurityDeposit, setEditSecurityDeposit,
    handleServeNotice, handleCreateBooking, handleRecordCashToken,
    handleOnlineTokenPayment, handleForfeitBooking, handleRefundBooking,
    handleConvertBookingToLease, handleOpenEditTerms, handleSaveTerms,
  } = data;

  const { autoDetectProgress } = useAdminTutorial();

  React.useEffect(() => {
    autoDetectProgress({
      bookingCount: filteredBookings.length,
      leaseCount: filteredLeases.length,
    });
  }, [filteredBookings.length, filteredLeases.length, autoDetectProgress]);

  const STAT_COLORS = React.useMemo(() => [
    theme.Colors.primary, theme.Colors.error, theme.Colors.secondary, theme.Colors.tertiary,
  ], [theme]);

  const noticeCount = filteredLeases.filter((l) => Boolean(l.moveOutDate)).length;
  const pendingBookingsCount = filteredBookings.filter((b) => b.status === 'BOOKED').length;
  const activeLeasesDisplayCount = totalLeasesElements > 0 ? totalLeasesElements : filteredLeases.length;
  const currentPropertyName = properties.find(p => p.id === selectedPropertyId)?.name || 'All Properties';

  const totalUnitsInScope = properties.filter(p => !selectedPropertyId || p.id === selectedPropertyId).reduce((acc, p) => acc + (p.totalUnits || 0), 0);
  const occupiedUnitsInScope = properties.filter(p => !selectedPropertyId || p.id === selectedPropertyId).reduce((acc, p) => acc + (p.occupiedUnits || 0), 0);
  const availableUnitsCount = Math.max(0, totalUnitsInScope - occupiedUnitsInScope);

  const stats = [
    { label: 'Active Leases', value: String(activeLeasesDisplayCount), helper: 'Occupied tenancies', icon: 'vpn-key' as const },
    { label: 'Notices Served', value: String(noticeCount).padStart(2, '0'), helper: 'Vacating soon', icon: 'door-sliding' as const },
    { label: 'Pending Bookings', value: String(pendingBookingsCount).padStart(2, '0'), helper: 'Tokens received', icon: 'bookmark' as const },
    { label: 'Available Units', value: String(availableUnitsCount).padStart(2, '0'), helper: 'Ready to market', icon: 'meeting-room' as const },
  ];
  const TABS = [
    { id: 'leases' as const, label: 'Active Leases', icon: 'description' as const, count: activeLeasesDisplayCount },
    { id: 'bookings' as const, label: 'Pending Bookings', icon: 'bookmark' as const, count: pendingBookingsCount },
    { id: 'vacancies' as const, label: 'Vacating & Notices', icon: 'door-sliding' as const, count: vacatingUnits.length },
  ];

  const openInventory = (lease: LeaseResponse) => {
    const tab = lease.moveOutDate ? 'moveOut' : 'moveIn';
    router.push(`/inventory?tab=${tab}&leaseId=${lease.id}`);
  };

  return (
    <PageShell
      scrollable={true}
      edges={isDesktop ? ['top'] : []}
      onScroll={handleScroll}
      onEndReached={handleLoadMoreLeases}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >

          {/* Header */}
          <View style={styles.desktopHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>TENANCY MANAGEMENT</Text>
              <Text style={styles.title}>Leases & Bookings</Text>
              <Text style={styles.subtitle}>Manage active tenancies, notice periods, unit bookings, and move-in/out inventory.</Text>
            </View>
            <View style={styles.headerActions}>
              <ActionButton
                label="Book Room"
                icon="bookmark-add"
                variant="primary"
                size="md"
                onPress={() => setIsBookingModalVisible(true)}
              />
            </View>
          </View>

          <ContextualStepGuideBar stepId="ADD_TENANT" />
          <ContextualStepGuideBar stepId="CREATE_LEASE" />

          {/* Stats */}
          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            {stats.map((stat, i) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                helperText={stat.helper}
                iconName={stat.icon as any}
                iconColor={STAT_COLORS[i % STAT_COLORS.length]}
                style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
              />
            ))}
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            style={styles.tabsScrollView}
          >
            {TABS.map((t) => (
              <FilterPill
                key={t.id}
                label={t.label}
                icon={t.icon}
                count={t.count}
                active={activeTab === t.id}
                onPress={() => setActiveTab(t.id)}
              />
            ))}
          </ScrollView>

          {/* Search */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              placeholder="Search by tenant name, unit number, phone, status..."
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={searchQuery} onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Main Content Area */}
          <View style={styles.tabContentContainer}>
            {isLoadingData && filteredLeases.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.Colors.primary} />
                <Text style={styles.loadingText}>Syncing lease records...</Text>
              </View>
            ) : activeTab === 'leases' ? (
              <LeasesTab
                filteredLeases={filteredLeases}
                isDark={isDark}
                isDesktop={isDesktop}
                styles={styles}
                theme={theme}
                isFetchingMore={isFetchingMore}
                hasMore={hasMoreLeases}
                onEditTerms={handleOpenEditTerms}
                onInventory={openInventory}
                onServeNotice={(id: string) => { setSelectedLeaseId(id); setIsNoticeModalVisible(true); }}
              />
            ) : activeTab === 'bookings' ? (
              <BookingsTab
                filteredBookings={filteredBookings}
                isDark={isDark}
                isDesktop={isDesktop}
                styles={styles}
                theme={theme}
                onCashToken={(id: string) => { setSelectedBookingId(id); setIsCashModalVisible(true); }}
                onOnlinePay={handleOnlineTokenPayment}
                onConvert={(id: string) => { setSelectedBookingId(id); setIsConversionModalVisible(true); }}
                onForfeit={handleForfeitBooking}
                onRefund={handleRefundBooking}
              />
            ) : (
              <VacanciesTab
                vacatingUnits={vacatingUnits}
                isDark={isDark}
                isDesktop={isDesktop}
                styles={styles}
                theme={theme}
                currentPropertyName={currentPropertyName}
              />
            )}
          </View>
 

      {/* Modals */}
      <BookRoomModal
        visible={isBookingModalVisible} onClose={() => setIsBookingModalVisible(false)}
        availableUnits={availableUnits}
        bookingUnitId={bookingUnitId} setBookingUnitId={setBookingUnitId}
        bookingTenantName={bookingTenantName} setBookingTenantName={setBookingTenantName}
        bookingTenantPhone={bookingTenantPhone} setBookingTenantPhone={setBookingTenantPhone}
        bookingTenantEmail={bookingTenantEmail} setBookingTenantEmail={setBookingTenantEmail}
        bookingTokenAmount={bookingTokenAmount} setBookingTokenAmount={setBookingTokenAmount}
        bookingExpectedMoveIn={bookingExpectedMoveIn} setBookingExpectedMoveIn={setBookingExpectedMoveIn}
        onSubmit={handleCreateBooking}
      />
      <ServeNoticeModal
        visible={isNoticeModalVisible} onClose={() => setIsNoticeModalVisible(false)}
        noticeMoveOutDate={noticeMoveOutDate} setNoticeMoveOutDate={setNoticeMoveOutDate}
        onSubmit={handleServeNotice}
      />
      <CashTokenModal
        visible={isCashModalVisible} onClose={() => setIsCashModalVisible(false)}
        cashAmount={cashAmount} setCashAmount={setCashAmount}
        cashNote={cashNote} setCashNote={setCashNote}
        onSubmit={handleRecordCashToken}
      />
      <ConvertToLeaseModal
        visible={isConversionModalVisible} onClose={() => setIsConversionModalVisible(false)}
        convMonthlyRentAmount={convMonthlyRentAmount} setConvMonthlyRentAmount={setConvMonthlyRentAmount}
        convSecurityDeposit={convSecurityDeposit} setConvSecurityDeposit={setConvSecurityDeposit}
        onSubmit={handleConvertBookingToLease}
      />
      <EditLeaseTermsModal
        visible={isEditTermsModalVisible} onClose={() => setIsEditTermsModalVisible(false)}
        editingLease={editingLease}
        editRentAmount={editRentAmount} setEditRentAmount={setEditRentAmount}
        editSecurityDeposit={editSecurityDeposit} setEditSecurityDeposit={setEditSecurityDeposit}
        onSubmit={handleSaveTerms} isSaving={isSavingTerms}
      />
    </PageShell>
  );
}

// ── Private sub-components (kept in same file to avoid over-splitting) ────────

function LeasesTab({
  filteredLeases,
  isDark,
  isDesktop,
  styles,
  theme,
  isFetchingMore,
  hasMore,
  onEditTerms,
  onInventory,
  onServeNotice,
}: any) {
  if (filteredLeases.length === 0) {
    return (
      <EmptyState
        iconName="vpn-key"
        title="No Active Leases"
        description="Book rooms or convert bookings to generate tenancy contracts for this property."
      />
    );
  }
  return (
    <View style={styles.listContainer}>
      {filteredLeases.map((l: LeaseResponse) => {
        const hasNotice = Boolean(l.moveOutDate);
        return (
          <GlassCard key={l.id} style={[styles.leaseCard, hasNotice && styles.leaseCardAlert]}>
            {/* Header Row: Tenant identity on left, Status Badge on right */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.tenantAvatarCircle}>
                  <Text style={styles.tenantAvatarText}>{(l.tenantName || 'T').substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.tenantTextContainer}>
                  <Text style={styles.tenantName} numberOfLines={1}>{l.tenantName || 'Active Tenant'}</Text>
                  <Text style={styles.tenantContact} numberOfLines={1}>{l.tenantPhone || 'No contact specified'}</Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                <StatusPill status={hasNotice ? 'ENDING_SOON' : l.status || 'ACTIVE'} />
              </View>
            </View>

            {/* Sub-row: Unit & Property Scope Badge */}
            <View style={styles.propertyUnitRow}>
              <View style={styles.unitBadge}>
                <MaterialIcons name="meeting-room" size={13} color={theme.Colors.primary} />
                <Text style={styles.unitBadgeText} numberOfLines={1}>
                  {l.propertyName ? `${l.propertyName} · ` : ''}Unit {l.unitNumber || '—'}
                </Text>
              </View>
            </View>

            {/* Notice Alert Banner if move-out scheduled */}
            {hasNotice && (
              <View style={styles.noticeAlertBar}>
                <MaterialIcons name="warning-amber" size={16} color={theme.Colors.error} />
                <Text style={styles.noticeAlertText}>
                  Notice Served · Vacating on {l.moveOutDate}
                </Text>
              </View>
            )}

            {/* Financial Details Row */}
            <View style={styles.leaseDetailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>MONTHLY RENT</Text>
                <Text style={styles.detailValue}>{formatCurrency(l.monthlyRentAmount)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>SECURITY DEPOSIT</Text>
                <Text style={styles.detailValue}>{formatCurrency(l.securityDeposit ?? 0)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>MOVE-IN</Text>
                <Text style={styles.detailValueSecondary}>{l.moveInDate || '—'}</Text>
              </View>
              {l.moveOutDate && (
                <View style={[styles.detailItem, { borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                  <Text style={[styles.detailLabel, { color: theme.Colors.error }]}>EXPECTED VACATE</Text>
                  <Text style={[styles.detailValueSecondary, { color: theme.Colors.error, fontWeight: '600' }]}>{l.moveOutDate}</Text>
                </View>
              )}
            </View>

            {/* Responsive Actions: Clean stacked/grid rows on mobile, horizontal row on desktop */}
            {!isDesktop ? (
              <View style={styles.mobileActionsContainer}>
                <View style={styles.cardFooterMobile}>
                  <Text style={styles.leaseIdText}>ID: #{l.id?.substring(0, 8)}</Text>
                </View>
                <View style={styles.mobileActionsRow}>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Edit Terms"
                      icon="edit"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onPress={() => onEditTerms(l)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Inventory"
                      icon="inventory-2"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onPress={() => onInventory(l)}
                    />
                  </View>
                </View>
                {!l.moveOutDate && (
                  <ActionButton
                    label="Serve Notice"
                    icon="warning"
                    variant="danger"
                    size="sm"
                    fullWidth
                    onPress={() => onServeNotice(l.id)}
                  />
                )}
              </View>
            ) : (
              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Text style={styles.leaseIdText}>ID: #{l.id?.substring(0, 8)}</Text>
                </View>
                <View style={styles.leaseActionsRow}>
                  <ActionButton
                    label="Edit Terms"
                    icon="edit"
                    variant="outline"
                    size="sm"
                    onPress={() => onEditTerms(l)}
                  />
                  <ActionButton
                    label="Inventory"
                    icon="inventory-2"
                    variant="outline"
                    size="sm"
                    onPress={() => onInventory(l)}
                  />
                  {!l.moveOutDate && (
                    <ActionButton
                      label="Serve Notice"
                      icon="warning"
                      variant="danger"
                      size="sm"
                      onPress={() => onServeNotice(l.id)}
                    />
                  )}
                </View>
              </View>
            )}
          </GlassCard>
        );
      })}

      {isFetchingMore && (
        <View style={styles.loadingMoreBox}>
          <ActivityIndicator size="small" color={theme.Colors.primary} />
          <Text style={styles.loadingMoreText}>Loading more leases...</Text>
        </View>
      )}

      {!isFetchingMore && hasMore && (
        <View style={styles.scrollHintBox}>
          <Text style={styles.scrollHintText}>Scroll down to load more leases...</Text>
        </View>
      )}
    </View>
  );
}

function BookingsTab({ filteredBookings, isDark, isDesktop, styles, theme, onCashToken, onOnlinePay, onConvert, onForfeit, onRefund }: any) {
  if (filteredBookings.length === 0) {
    return (
      <EmptyState
        iconName="bookmark-border"
        title="No Pending Bookings"
        description="Click 'Book Room' above to reserve rooms for prospective tenants."
      />
    );
  }
  return (
    <View style={styles.listContainer}>
      {filteredBookings.map((b: UnitBookingResponse) => (
        <GlassCard key={b.id} style={styles.leaseCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.tenantAvatarCircle, { backgroundColor: 'rgba(79,70,229,0.1)' }]}>
                <Text style={[styles.tenantAvatarText, { color: theme.Colors.secondary }]}>{(b.prospectiveTenantName || 'P').substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.tenantTextContainer}>
                <Text style={styles.tenantName} numberOfLines={1}>{b.prospectiveTenantName}</Text>
                <Text style={styles.tenantContact} numberOfLines={1}>{b.prospectiveTenantPhone}{b.prospectiveTenantEmail ? ` · ${b.prospectiveTenantEmail}` : ''}</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <StatusPill status={b.status} />
            </View>
          </View>

          <View style={styles.propertyUnitRow}>
            <View style={styles.unitBadge}>
              <MaterialIcons name="meeting-room" size={13} color={theme.Colors.primary} />
              <Text style={styles.unitBadgeText} numberOfLines={1}>Unit {b.unitNumber || '—'}</Text>
            </View>
          </View>

          <View style={styles.leaseDetailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TOKEN AMOUNT</Text>
              <Text style={styles.detailValue}>{formatCurrency(b.tokenAmount)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>EXPECTED MOVE-IN</Text>
              <Text style={styles.detailValueSecondary}>{b.expectedMoveInDate || '—'}</Text>
            </View>
          </View>

          {!isDesktop ? (
            <View style={styles.mobileActionsContainer}>
              <View style={styles.cardFooterMobile}>
                <Text style={styles.leaseIdText}>Booking #{b.id?.substring(0, 8)}</Text>
              </View>
              {b.status === 'BOOKED' && !b.paymentTransactionId && (
                <View style={styles.mobileActionsRow}>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Cash Token"
                      icon="payments"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onPress={() => onCashToken(b.id)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Online Pay"
                      icon="link"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onPress={() => onOnlinePay(b.id)}
                    />
                  </View>
                </View>
              )}
              {b.status === 'BOOKED' && (
                <ActionButton
                  label="Convert to Lease"
                  icon="check-circle"
                  variant="primary"
                  size="sm"
                  fullWidth
                  onPress={() => onConvert(b.id)}
                />
              )}
              {b.status === 'BOOKED' && (
                <View style={styles.mobileActionsRow}>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Forfeit"
                      icon="cancel"
                      variant="danger"
                      size="sm"
                      fullWidth
                      onPress={() => onForfeit(b.id)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ActionButton
                      label="Refund"
                      icon="replay"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onPress={() => onRefund(b.id)}
                    />
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.cardFooter}>
              <View style={styles.footerLeft}>
                <Text style={styles.leaseIdText}>Booking #{b.id?.substring(0, 8)}</Text>
              </View>
              <View style={styles.leaseActionsRow}>
                {b.status === 'BOOKED' && !b.paymentTransactionId && (
                  <>
                    <ActionButton
                      label="Cash Token"
                      icon="payments"
                      variant="outline"
                      size="sm"
                      onPress={() => onCashToken(b.id)}
                    />
                    <ActionButton
                      label="Online Pay"
                      icon="link"
                      variant="outline"
                      size="sm"
                      onPress={() => onOnlinePay(b.id)}
                    />
                  </>
                )}
                {b.status === 'BOOKED' && (
                  <ActionButton
                    label="Convert to Lease"
                    icon="check-circle"
                    variant="primary"
                    size="sm"
                    onPress={() => onConvert(b.id)}
                  />
                )}
                {b.status === 'BOOKED' && (
                  <>
                    <ActionButton
                      label="Forfeit"
                      icon="cancel"
                      variant="danger"
                      size="sm"
                      onPress={() => onForfeit(b.id)}
                    />
                    <ActionButton
                      label="Refund"
                      icon="replay"
                      variant="outline"
                      size="sm"
                      onPress={() => onRefund(b.id)}
                    />
                  </>
                )}
              </View>
            </View>
          )}
        </GlassCard>
      ))}
    </View>
  );
}

function VacanciesTab({ vacatingUnits, isDark, styles, theme, currentPropertyName }: any) {
  if (vacatingUnits.length === 0) {
    return (
      <EmptyState
        iconName="door-sliding"
        title="No Vacancies or Notices"
        description="No tenants have served move-out notice for this property."
      />
    );
  }
  return (
    <View style={styles.listContainer}>
      {vacatingUnits.map((v: any, i: number) => (
        <GlassCard key={v.id || i} style={[styles.leaseCard, styles.leaseCardAlert]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.tenantAvatarCircle, { backgroundColor: 'rgba(186,26,26,0.1)' }]}>
                <MaterialIcons name="door-sliding" size={22} color={theme.Colors.error} />
              </View>
              <View style={styles.tenantTextContainer}>
                <Text style={styles.tenantName}>Unit {v.unitNumber || v.name}</Text>
                <Text style={styles.tenantContact}>{v.propertyName || currentPropertyName}</Text>
              </View>
            </View>
            <StatusPill status="ENDING_SOON" />
          </View>
          <View style={styles.noticeAlertBar}>
            <MaterialIcons name="warning-amber" size={16} color={theme.Colors.error} />
            <Text style={styles.noticeAlertText}>
              Move-Out Scheduled: {v.expectedVacateDate || 'Notice Active'}
            </Text>
          </View>
        </GlassCard>
      ))}
    </View>
  );
}
