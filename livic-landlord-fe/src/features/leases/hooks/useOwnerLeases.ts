import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import {
  listActiveLeasesByProperty,
  createLease,
  updateLeaseTerms,
  LeaseResponse,
} from '@/src/features/tenant/api/lease.api';
import {
  createUnitBooking,
  listUnitBookings,
  forfeitUnitBooking,
  refundUnitBooking,
  initiateTokenOnlinePayment,
  recordTokenCashPayment,
  getVacatingUnits,
  serveLeaseNotice,
  UnitBookingResponse,
} from '@/src/features/leases/api/unitBooking.api';
import { getAllFloorsLayout, UnitResponse } from '@/src/features/properties/api/unit.api';
import { useLocalSearchParams } from 'expo-router';

export type LeasesTab = 'leases' | 'bookings' | 'tours' | 'vacancies';
const LEASES_TABS: LeasesTab[] = ['leases', 'bookings', 'tours', 'vacancies'];

export function useOwnerLeases() {
  const { accessToken } = useAuth();
  const { properties, isLoading: isPropsLoading } = useProperties();
  const { showToast } = useToast();

  const { selectedPropertyId, setSelectedPropertyId, selectedBlockId, setSelectedBlockId } = useGlobalPropertySelection();
  // Deep links (e.g. /leases?tab=tours from a notification) open the requested tab
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<LeasesTab>(
    LEASES_TABS.includes(tabParam as LeasesTab) ? (tabParam as LeasesTab) : 'leases'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [leases, setLeases] = useState<LeaseResponse[]>([]);
  const [bookings, setBookings] = useState<UnitBookingResponse[]>([]);
  const [vacatingUnits, setVacatingUnits] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<UnitResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentLeasesPage, setCurrentLeasesPage] = useState(0);
  const [totalLeasesElements, setTotalLeasesElements] = useState(0);
  const [totalLeasesPages, setTotalLeasesPages] = useState(0);

  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
  const [isCashModalVisible, setIsCashModalVisible] = useState(false);
  const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
  const [isEditTermsModalVisible, setIsEditTermsModalVisible] = useState(false);

  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [editingLease, setEditingLease] = useState<LeaseResponse | null>(null);

  const [noticeMoveOutDate, setNoticeMoveOutDate] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [bookingUnitId, setBookingUnitId] = useState('');
  const [bookingTenantName, setBookingTenantName] = useState('');
  const [bookingTenantPhone, setBookingTenantPhone] = useState('');
  const [bookingTenantEmail, setBookingTenantEmail] = useState('');
  const [bookingTokenAmount, setBookingTokenAmount] = useState('');
  const [bookingExpectedMoveIn, setBookingExpectedMoveIn] = useState('');
  const [convMonthlyRentAmount, setConvMonthlyRentAmount] = useState('');
  const [convSecurityDeposit, setConvSecurityDeposit] = useState('');
  const [convSplitStrategy, setConvSplitStrategy] = useState<'FULL_UNIT' | 'PER_OCCUPANT' | 'CUSTOM'>('FULL_UNIT');
  const [editRentAmount, setEditRentAmount] = useState('');
  const [editSecurityDeposit, setEditSecurityDeposit] = useState('');
  const [isSavingTerms, setIsSavingTerms] = useState(false);

  const loadScreenData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoadingData(true);
      setCurrentLeasesPage(0);
      const [leasesRes, bookingsData, vacatingData, allUnits] = await Promise.all([
        listActiveLeasesByProperty(selectedPropertyId, accessToken, 0, 20, selectedBlockId),
        listUnitBookings(accessToken),
        selectedPropertyId ? getVacatingUnits(selectedPropertyId, accessToken) : Promise.resolve([]),
        selectedPropertyId ? getAllFloorsLayout(selectedPropertyId, accessToken).catch(() => []) : Promise.resolve([]),
      ]);
      setLeases(leasesRes.content || []);
      setTotalLeasesElements(leasesRes.totalElements || 0);
      setTotalLeasesPages(leasesRes.totalPages || 0);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setVacatingUnits(Array.isArray(vacatingData) ? vacatingData : []);
      setAvailableUnits(Array.isArray(allUnits) ? allUnits : []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to sync data with the server', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [accessToken, selectedPropertyId, selectedBlockId, showToast]);

  useEffect(() => {
    loadScreenData();
  }, [loadScreenData]);

  const handleLoadMoreLeases = useCallback(async () => {
    if (activeTab !== 'leases' || isLoadingData || isFetchingMore || !accessToken) return;
    if (currentLeasesPage + 1 >= totalLeasesPages) return;

    const nextPage = currentLeasesPage + 1;
    try {
      setIsFetchingMore(true);
      const leasesRes = await listActiveLeasesByProperty(selectedPropertyId, accessToken, nextPage, 20, selectedBlockId);
      const newItems = leasesRes.content || [];
      setLeases(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const unique = newItems.filter(l => !existingIds.has(l.id));
        return [...prev, ...unique];
      });
      setCurrentLeasesPage(nextPage);
      setTotalLeasesElements(leasesRes.totalElements || 0);
      setTotalLeasesPages(leasesRes.totalPages || 0);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load more leases', 'error');
    } finally {
      setIsFetchingMore(false);
    }
  }, [activeTab, isLoadingData, isFetchingMore, currentLeasesPage, totalLeasesPages, selectedPropertyId, selectedBlockId, accessToken, showToast]);

  const handleServeNotice = async () => {
    if (!selectedLeaseId || !noticeMoveOutDate.trim() || !accessToken) {
      showToast('Please specify a valid move-out date.', 'error'); return;
    }
    try {
      await serveLeaseNotice(selectedLeaseId, noticeMoveOutDate, accessToken);
      showToast('Notice served successfully.', 'success');
      setIsNoticeModalVisible(false); setSelectedLeaseId(null); setNoticeMoveOutDate('');
      loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to serve notice.', 'error'); }
  };

  const handleCreateBooking = async () => {
    if (!bookingUnitId || !bookingTenantName.trim() || !bookingTenantPhone.trim() || !bookingTokenAmount || !bookingExpectedMoveIn || !selectedPropertyId || !accessToken) {
      showToast('Please fill out all mandatory fields.', 'error'); return;
    }
    try {
      await createUnitBooking({
        unitId: bookingUnitId, propertyId: selectedPropertyId,
        prospectiveTenantName: bookingTenantName, prospectiveTenantPhone: bookingTenantPhone,
        prospectiveTenantEmail: bookingTenantEmail.trim() || null,
        tokenAmount: parseFloat(bookingTokenAmount), expectedMoveInDate: bookingExpectedMoveIn,
      }, accessToken);
      showToast('Room/Bed booked successfully.', 'success');
      setIsBookingModalVisible(false);
      setBookingUnitId(''); setBookingTenantName(''); setBookingTenantPhone('');
      setBookingTenantEmail(''); setBookingTokenAmount(''); setBookingExpectedMoveIn('');
      loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to create booking.', 'error'); }
  };

  const handleRecordCashToken = async () => {
    if (!selectedBookingId || !cashAmount || !accessToken) {
      showToast('Please enter the token cash amount.', 'error'); return;
    }
    try {
      await recordTokenCashPayment(selectedBookingId, parseFloat(cashAmount), cashNote, accessToken);
      showToast('Token cash payment recorded successfully.', 'success');
      setIsCashModalVisible(false); setSelectedBookingId(null); setCashAmount(''); setCashNote('');
      loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to record payment.', 'error'); }
  };

  const handleOnlineTokenPayment = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await initiateTokenOnlinePayment(bookingId, accessToken);
      showToast('Online token payment link initiated.', 'success');
      loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to initiate online payment.', 'error'); }
  };

  const handleForfeitBooking = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await forfeitUnitBooking(bookingId, accessToken);
      showToast('Booking token forfeited.', 'success'); loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to forfeit token.', 'error'); }
  };

  const handleRefundBooking = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await refundUnitBooking(bookingId, accessToken);
      showToast('Booking token refunded.', 'success'); loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to refund token.', 'error'); }
  };

  const handleConvertBookingToLease = async () => {
    if (!selectedBookingId || !convSecurityDeposit || !convMonthlyRentAmount || !accessToken) {
      showToast('Please specify the monthly rent and security deposit amounts.', 'error'); return;
    }
    const booking = bookings.find((b) => b.id === selectedBookingId);
    if (!booking) return;
    try {
      await createLease({
        unitId: booking.unitId, monthlyRentAmount: parseFloat(convMonthlyRentAmount),
        securityDeposit: parseFloat(convSecurityDeposit), splitStrategy: convSplitStrategy,
        moveInDate: booking.expectedMoveInDate, bookingId: booking.id,
      }, accessToken);
      showToast('Converted prospective tenant to active lease!', 'success');
      setIsConversionModalVisible(false); setSelectedBookingId(null);
      setConvSecurityDeposit(''); setConvMonthlyRentAmount('');
      loadScreenData();
    } catch (err: any) { showToast(err?.message || 'Failed to convert to active lease.', 'error'); }
  };

  const handleOpenEditTerms = (lease: LeaseResponse) => {
    setEditingLease(lease);
    setEditRentAmount(lease.monthlyRentAmount != null ? lease.monthlyRentAmount.toString() : '');
    setEditSecurityDeposit(lease.securityDeposit != null ? lease.securityDeposit.toString() : '0');
    setIsEditTermsModalVisible(true);
  };

  const handleSaveTerms = async () => {
    if (!editingLease || !accessToken) return;
    const rentNum = parseFloat(editRentAmount);
    const depNum = parseFloat(editSecurityDeposit);
    if (isNaN(rentNum) || rentNum < 0) { showToast('Please enter a valid monthly rent amount', 'error'); return; }
    if (isNaN(depNum) || depNum < 0) { showToast('Please enter a valid security deposit', 'error'); return; }
    try {
      setIsSavingTerms(true);
      const updated = await updateLeaseTerms(editingLease.id, { monthlyRentAmount: rentNum, securityDeposit: depNum }, accessToken);
      setLeases(prev => prev.map(l => l.id === updated.id ? { ...l, monthlyRentAmount: updated.monthlyRentAmount, securityDeposit: updated.securityDeposit } : l));
      showToast('Lease terms updated successfully', 'success');
      setIsEditTermsModalVisible(false); setEditingLease(null);
    } catch (err: any) { showToast(err?.message || 'Failed to update lease terms', 'error');
    } finally { setIsSavingTerms(false); }
  };

  const filteredLeases = useMemo(() => {
    if (!Array.isArray(leases)) return [];
    return leases
      .filter((l) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (l.unitNumber && l.unitNumber.toLowerCase().includes(q)) ||
          (l.tenantName && l.tenantName.toLowerCase().includes(q)) ||
          (l.tenantPhone && l.tenantPhone.toLowerCase().includes(q)) ||
          (l.status && l.status.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [leases, searchQuery]);

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (b.unitNumber && b.unitNumber.toLowerCase().includes(q)) ||
          (b.prospectiveTenantName && b.prospectiveTenantName.toLowerCase().includes(q)) ||
          (b.prospectiveTenantPhone && b.prospectiveTenantPhone.toLowerCase().includes(q)) ||
          (b.status && b.status.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [bookings, searchQuery]);

  return {
    properties, isPropsLoading, selectedPropertyId, setSelectedPropertyId,
    selectedBlockId, setSelectedBlockId,
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    leases, bookings, vacatingUnits, availableUnits, isLoadingData,
    isFetchingMore, hasMoreLeases: currentLeasesPage + 1 < totalLeasesPages,
    handleLoadMoreLeases, loadScreenData,
    filteredLeases, filteredBookings,
    currentLeasesPage, setCurrentLeasesPage, totalLeasesElements, totalLeasesPages,
    isBookingModalVisible, setIsBookingModalVisible,
    isNoticeModalVisible, setIsNoticeModalVisible,
    isCashModalVisible, setIsCashModalVisible,
    isConversionModalVisible, setIsConversionModalVisible,
    isEditTermsModalVisible, setIsEditTermsModalVisible,
    selectedLeaseId, setSelectedLeaseId,
    selectedBookingId, setSelectedBookingId,
    editingLease,
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
    convSplitStrategy, setConvSplitStrategy,
    editRentAmount, setEditRentAmount,
    editSecurityDeposit, setEditSecurityDeposit,
    isSavingTerms,
    handleServeNotice, handleCreateBooking, handleRecordCashToken,
    handleOnlineTokenPayment, handleForfeitBooking, handleRefundBooking,
    handleConvertBookingToLease, handleOpenEditTerms, handleSaveTerms,
  };
}
