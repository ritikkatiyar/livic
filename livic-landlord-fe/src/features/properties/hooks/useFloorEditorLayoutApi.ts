import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getFloorLayout, saveFloorLayout, tenantsOf } from '@/src/features/properties/api/unit.api';
import { terminateLease } from '@/src/features/tenant/api/lease.api';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';
import type { Occupant } from '@/src/features/properties/api/unit.api';

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

interface UseFloorEditorLayoutApiProps {
  propertyId: string;
  floorNumber: number;
  /** The building this floor is in; "blocks" here already means drawn rectangles. */
  buildingBlockId?: string | null;
  userToken: string;
  onSave: () => void;
  blocks: UnitBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<UnitBlock[]>>;
  setNextUnitIndex: React.Dispatch<React.SetStateAction<number>>;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
}

export function useFloorEditorLayoutApi({
  propertyId,
  floorNumber,
  buildingBlockId,
  userToken,
  onSave,
  blocks,
  setBlocks,
  setNextUnitIndex,
  updateUnitDetails,
}: UseFloorEditorLayoutApiProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const units = await getFloorLayout(propertyId, floorNumber, userToken, buildingBlockId);
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
          activeLeaseId: primaryTenant?.agreement?.id ?? undefined,
          tenantUserId: primaryTenant?.userId ?? undefined,
          tenantPhone: primaryTenant?.phone ?? undefined,
          status: members.length > 0 ? 'OCCUPIED' : 'VACANT',
          capacity: u.capacity,
          members,
          type: normalizeUnitType(u.type),
        };
      });
      setBlocks(mappedBlocks);

      let maxIndex = 0;
      const prefix = floorNumber.toString();
      units.forEach(u => {
        if (u.unitNumber.startsWith(prefix)) {
          const suffix = u.unitNumber.substring(prefix.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxIndex) {
            maxIndex = num;
          }
        }
      });
      setNextUnitIndex(maxIndex + 1);
    } catch (error: any) {
      logger.warn('No existing layout or error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (blocks.length === 0) {
      Alert.alert('Save Layout', 'Please draw at least one unit before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = blocks.map(b => ({
        unitNumber: b.unitNumber,
        gridX: b.gridX,
        gridY: b.gridY,
        gridWidth: b.gridWidth,
        gridHeight: b.gridHeight,
        type: b.type || 'ONE_BHK',
        capacity: b.capacity || 2,
        facing: 'NORTH'
      }));

      await saveFloorLayout(propertyId, floorNumber, userToken, payload, buildingBlockId);

      onSave();
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTenant = async (selectedBlock: UnitBlock | null, callbackAfterRemove: () => void, leaseId: string, tenantName?: string | null) => {
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
              await terminateLease(leaseId, userToken);

              const remaining = (selectedBlock.members || []).filter(m => m.agreement?.id !== leaseId);
              const nextTenant = tenantsOf(remaining)[0];

              updateUnitDetails(selectedBlock.id, {
                tenants: remaining.map(m => m.name).filter(Boolean) as string[],
                members: remaining,
                activeLeaseId: nextTenant?.agreement?.id ?? undefined,
                tenantUserId: nextTenant?.userId ?? undefined,
                tenantPhone: nextTenant?.phone ?? undefined,
                rent: nextTenant?.agreement?.monthlyAmount?.toString() ?? undefined,
                status: remaining.length > 0 ? 'OCCUPIED' : 'VACANT',
              });

              Alert.alert('Removed', `${displayName} has been removed from Unit ${selectedBlock.unitNumber}.`);
              callbackAfterRemove();
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

  useEffect(() => {
    fetchLayout();
  }, [propertyId, floorNumber, buildingBlockId]);

  return {
    loading,
    saving,
    fetchLayout,
    handleSave,
    handleRemoveTenant,
  };
}
