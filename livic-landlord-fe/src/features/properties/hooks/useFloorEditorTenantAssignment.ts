import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';
import { searchUserByPhone, UserSearchResponse } from '@/src/features/auth/api/user.api';
import { createLease } from '@/src/features/tenant/api/lease.api';
import { UnitResponse, saveFloorLayout, occupantFromLease, type Occupant } from '@/src/features/properties/api/unit.api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface UnitBlock {
  id: string;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  members?: Occupant[];
  type?: string;
}

interface UseFloorEditorTenantAssignmentProps {
  selectedBlock: UnitBlock | null;
  blocks: UnitBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<UnitBlock[]>>;
  setSelectedUnitId: React.Dispatch<React.SetStateAction<string | null>>;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  propertyId: string;
  floorNumber: number;
  buildingBlockId?: string | null;
  userToken: string;
  sheetScrollRef: React.RefObject<any>;
  setParentScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useFloorEditorTenantAssignment({
  selectedBlock,
  blocks,
  setBlocks,
  setSelectedUnitId,
  updateUnitDetails,
  propertyId,
  floorNumber,
  buildingBlockId,
  userToken,
  sheetScrollRef,
  setParentScrollEnabled,
}: UseFloorEditorTenantAssignmentProps) {
  const [tenantPhoneSearch, setTenantPhoneSearch] = useState('');
  const [tenantSearchResult, setTenantSearchResult] = useState<UserSearchResponse | null>(null);
  const [tenantSearchLoading, setTenantSearchLoading] = useState(false);
  const [tenantAssigning, setTenantAssigning] = useState(false);
  const [tenantSearchError, setTenantSearchError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<UserSearchResponse[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  // Suggestions search debouncer
  useEffect(() => {
    const query = tenantPhoneSearch.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await searchUserByPhone(query, propertyId, userToken);
        setSuggestions(results || []);
      } catch (error) {
        logger.error('Error fetching suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tenantPhoneSearch, propertyId, userToken]);

  // Handle auto-scroll to view suggestions
  useEffect(() => {
    if (suggestions.length > 0 && sheetScrollRef.current) {
      setTimeout(() => {
        sheetScrollRef.current?.scrollTo({ y: 155, animated: true });
      }, 50);
    }
  }, [suggestions, sheetScrollRef]);

  const resetTenantAssignmentForm = () => {
    setTenantPhoneSearch('');
    setTenantSearchResult(null);
    setTenantSearchError(null);
    setSuggestions([]);
    setRentAmount('');
    setSecurityDeposit('');
    setParentScrollEnabled(true);
  };

  const handleSearchTenant = async () => {
    const phone = tenantPhoneSearch.trim();
    if (!phone) {
      setTenantSearchError('Enter a phone number to search.');
      return;
    }

    if (!selectedBlock) return;

    if (!selectedBlock.capacity || selectedBlock.capacity <= 0) {
      setTenantSearchError('Please define unit capacity first.');
      return;
    }
    if (!UUID_PATTERN.test(selectedBlock.id)) {
      setTenantSearchError('Save the floor layout before assigning tenants.');
      return;
    }

    setTenantSearchLoading(true);
    setTenantSearchError(null);
    setTenantSearchResult(null);
    try {
      const users = await searchUserByPhone(phone, propertyId, userToken);
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

      // 1) Auto-save the floor layout first
      const savePayload = blocks.map(b => ({
        unitNumber: b.unitNumber,
        gridX: b.gridX,
        gridY: b.gridY,
        gridWidth: b.gridWidth,
        gridHeight: b.gridHeight,
        type: b.type || 'ONE_BHK',
        capacity: b.id === selectedBlock.id ? capacity : (b.capacity || 2),
        facing: 'NORTH'
      }));

      const savedUnits = await saveFloorLayout(propertyId, floorNumber, userToken, savePayload, buildingBlockId);

      const savedUnit = savedUnits.find(u => 
        (u.gridX === selectedBlock.gridX && u.gridY === selectedBlock.gridY) ||
        u.unitNumber === selectedBlock.unitNumber
      );
      if (!savedUnit) {
        logger.error('[Assign Tenant] Could not find saved unit in response!', {
          selectedUnitNumber: selectedBlock.unitNumber,
          selectedCoords: { x: selectedBlock.gridX, y: selectedBlock.gridY },
          savedUnits: savedUnits.map(u => ({ number: u.unitNumber, x: u.gridX, y: u.gridY }))
        });
      }
      const realUnitId = savedUnit ? savedUnit.id : selectedBlock.id;

      // Update blocks state to update the id to realUnitId and select it
      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, id: realUnitId } : b));
      setSelectedUnitId(realUnitId);

      // 2) Now create the lease
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userId: targetUser.id,
        unitId: realUnitId,
        monthlyRentAmount: leaseRentAmount,
        securityDeposit: depositAmount,
        splitStrategy: 'FULL_UNIT' as const,
        moveInDate: today,
        status: 'Active' as const,
      };

      const lease = await createLease(payload, userToken);

      updateUnitDetails(realUnitId, {
        tenants: [...(selectedBlock.tenants || []), targetUser.fullName],
        tenantUserId: targetUser.id,
        tenantPhone: targetUser.phoneNumber,
        activeLeaseId: lease.id,
        status: 'OCCUPIED',
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

  return {
    tenantPhoneSearch,
    setTenantPhoneSearch,
    tenantSearchResult,
    setTenantSearchResult,
    tenantSearchLoading,
    tenantAssigning,
    tenantSearchError,
    setTenantSearchError,
    suggestions,
    setSuggestions,
    suggestionsLoading,
    rentAmount,
    setRentAmount,
    securityDeposit,
    setSecurityDeposit,
    resetTenantAssignmentForm,
    handleSearchTenant,
    handleAssignTenant,
  };
}
