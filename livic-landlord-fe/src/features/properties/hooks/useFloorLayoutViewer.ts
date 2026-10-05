import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getFloorLayout, occupantFromLease, tenantsOf, Occupant } from '@/src/features/properties/api/unit.api';
import { createLease, terminateLease } from '@/src/features/tenant/api/lease.api';
import { searchUserByPhone, UserSearchResponse } from '@/src/features/auth/api/user.api';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';

export interface UnitBlock {
  id: string; 
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  status?: 'VACANT' | 'OCCUPIED';
  capacity?: number;
  members?: Occupant[];
  tenantUserId?: string;
  tenantPhone?: string | null;
  activeLeaseId?: string;
  type?: string;
}

const normalizeUnitType = (typeVal: string | undefined): string => {
  if (!typeVal) return 'ONE_BHK';
  const upperVal = typeVal.toUpperCase();
  if (['ONE_BHK', 'TWO_BHK', 'STUDIO', 'SINGLE_UNIT', 'SHARED_UNIT'].includes(upperVal)) {
    return upperVal;
  }
  if (typeVal === '1 BHK') return 'ONE_BHK';
  if (typeVal === '2 BHK') return 'TWO_BHK';
  if (typeVal === 'Studio Apartment') return 'STUDIO';
  if (typeVal === 'Single Unit') return 'SINGLE_UNIT';
  if (typeVal === 'Shared Unit') return 'SHARED_UNIT';
  return 'ONE_BHK';
};

interface UseFloorLayoutViewerProps {
  visible: boolean;
  propertyId: string;
  floorNumber: number;
  token: string;
}

export function useFloorLayoutViewer({ visible, propertyId, floorNumber, token }: UseFloorLayoutViewerProps) {
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Tenant configuration & search states
  const [tenantPhoneSearch, setTenantPhoneSearch] = useState('');
  const [tenantSearchResult, setTenantSearchResult] = useState<UserSearchResponse | null>(null);
  const [tenantSearchLoading, setTenantSearchLoading] = useState(false);
  const [tenantAssigning, setTenantAssigning] = useState(false);
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [tenantSearchError, setTenantSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UserSearchResponse[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);

  const resetTenantAssignmentForm = useCallback(() => {
    setTenantPhoneSearch('');
    setTenantSearchResult(null);
    setTenantSearchError(null);
    setSuggestions([]);
    setRentAmount('');
    setSecurityDeposit('');
    setParentScrollEnabled(true);
  }, []);

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    try {
      const units = await getFloorLayout(propertyId, floorNumber, token);
      const mappedBlocks: UnitBlock[] = units.map(u => {
        const members = u.members || [];
        const primaryTenant = tenantsOf(members)[0] || null;
        const primaryRent = primaryTenant?.agreement?.monthlyAmount;
        return {
          id: u.id,
          gridX: u.gridX,
          gridY: u.gridY,
          gridWidth: u.gridWidth,
          gridHeight: u.gridHeight,
          unitNumber: u.unitNumber,
          rent: primaryRent != null ? Math.round(primaryRent * u.capacity).toString() : undefined,
          tenants: members.map(m => m.name).filter(Boolean) as string[],
          status: members.length > 0 ? 'OCCUPIED' : 'VACANT',
          capacity: u.capacity,
          members,
          tenantUserId: primaryTenant?.userId ?? undefined,
          tenantPhone: primaryTenant?.phone ?? undefined,
          activeLeaseId: primaryTenant?.agreement?.id ?? undefined,
          type: normalizeUnitType(u.type),
        };
      });
      setBlocks(mappedBlocks);
    } catch (error) {
      logger.warn('Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, floorNumber, token]);

  useEffect(() => {
    if (visible && propertyId && token) {
      fetchLayout();
    } else {
      setBlocks([]);
      setSelectedUnitId(null);
      resetTenantAssignmentForm();
    }
  }, [visible, propertyId, floorNumber, token, fetchLayout, resetTenantAssignmentForm]);

  // Debounce user search suggestions
  useEffect(() => {
    const query = tenantPhoneSearch.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await searchUserByPhone(query, propertyId, token);
        setSuggestions(results || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tenantPhoneSearch, propertyId, token]);

  const updateUnitDetails = (id: string, updates: Partial<UnitBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleSearchTenant = async () => {
    const phone = tenantPhoneSearch.trim();
    if (!phone) {
      setTenantSearchError('Enter a phone number to search.');
      return;
    }

    const selectedBlock = blocks.find(b => b.id === selectedUnitId);
    if (!selectedBlock) return;

    if (!selectedBlock.capacity || selectedBlock.capacity <= 0) {
      setTenantSearchError('Unit capacity must be at least 1.');
      return;
    }

    setTenantSearchLoading(true);
    setTenantSearchError(null);
    setTenantSearchResult(null);
    try {
      const users = await searchUserByPhone(phone, propertyId, token);
      if (!users || users.length === 0) {
        setTenantSearchError('Tenant not found with this number.');
        return;
      }
      const exactMatch = users.find(u => u.phoneNumber === phone) || users[0];
      setTenantSearchResult(exactMatch);
      setTenantPhoneSearch(exactMatch.phoneNumber || '');
      setSuggestions([]);
    } catch (error: any) {
      logger.error('[Search Tenant Error]', error);
      setTenantSearchError(formatErrorMessage(error));
    } finally {
      setTenantSearchLoading(false);
    }
  };

  const handleAssignTenant = async (userToAssign?: UserSearchResponse | any) => {
    const selectedBlock = blocks.find(b => b.id === selectedUnitId);
    const targetUser = (userToAssign && userToAssign.id) ? userToAssign : tenantSearchResult;
    if (!selectedBlock || !targetUser) return;

    const totalDeposit = Number(securityDeposit || '0');
    const totalRent = Number(rentAmount || '0');

    setTenantAssigning(true);
    setTenantSearchError(null);
    try {
      const capacity = selectedBlock.capacity || 1;
      const depositAmount = Math.round(totalDeposit / capacity);
      const leaseRentAmount = Math.round(totalRent / capacity);

      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userId: targetUser.id,
        unitId: selectedBlock.id,
        monthlyRentAmount: leaseRentAmount,
        securityDeposit: depositAmount,
        splitStrategy: 'FULL_UNIT' as const,
        moveInDate: today,
        status: 'Active' as const,
      };

      const lease = await createLease(payload, token);

      updateUnitDetails(selectedBlock.id, {
        tenants: [...(selectedBlock.tenants || []), targetUser.fullName],
        tenantUserId: targetUser.id,
        tenantPhone: targetUser.phoneNumber,
        activeLeaseId: lease.id,
        status: 'OCCUPIED',
        rent: totalRent.toString(),
        members: [
          ...(selectedBlock.members || []),
          occupantFromLease(lease, targetUser.fullName, targetUser.phoneNumber),
        ]
      });

      const assignedName = targetUser.fullName;
      resetTenantAssignmentForm();
      Alert.alert('Success', `${assignedName} has been assigned to Unit ${selectedBlock.unitNumber}.`);
    } catch (error: any) {
      logger.error('[Assign Tenant Error]', error);
      setTenantSearchError(formatErrorMessage(error));
    } finally {
      setTenantAssigning(false);
    }
  };

  const handleRemoveTenant = async (leaseId: string, tenantName?: string | null) => {
    const selectedBlock = blocks.find(b => b.id === selectedUnitId);
    if (!selectedBlock) return;
    const displayName = tenantName || 'this tenant';

    Alert.alert(
      'Remove Tenant',
      `Are you sure you want to remove ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await terminateLease(leaseId, token);

              const remaining = (selectedBlock.members || []).filter(m => m.agreement?.id !== leaseId);
              const nextTenant = tenantsOf(remaining)[0];
              const nextRent = nextTenant?.agreement?.monthlyAmount;

              updateUnitDetails(selectedBlock.id, {
                tenants: remaining.map(m => m.name).filter(Boolean) as string[],
                members: remaining,
                activeLeaseId: nextTenant?.agreement?.id ?? undefined,
                tenantUserId: nextTenant?.userId ?? undefined,
                tenantPhone: nextTenant?.phone ?? undefined,
                rent: nextRent != null ? Math.round(nextRent * (selectedBlock.capacity || 1)).toString() : undefined,
                status: remaining.length > 0 ? 'OCCUPIED' : 'VACANT',
              });

              Alert.alert('Removed', `${displayName} has been removed from Unit ${selectedBlock.unitNumber}.`);
            } catch (error: any) {
              logger.error('[Remove Tenant Error]', error);
              Alert.alert('Error', formatErrorMessage(error));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return {
    blocks,
    loading,
    selectedUnitId,
    setSelectedUnitId,
    tenantPhoneSearch,
    setTenantPhoneSearch,
    tenantSearchResult,
    setTenantSearchResult,
    tenantSearchLoading,
    rentAmount,
    setRentAmount,
    securityDeposit,
    setSecurityDeposit,
    tenantSearchError,
    tenantAssigning,
    setSuggestions,
    suggestions,
    suggestionsLoading,
    parentScrollEnabled,
    setParentScrollEnabled,
    resetTenantAssignmentForm,
    updateUnitDetails,
    handleSearchTenant,
    handleAssignTenant,
    handleRemoveTenant,
    fetchLayout,
  };
}
