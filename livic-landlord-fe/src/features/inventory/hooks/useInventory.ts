import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import {
  getPropertyInventory,
  getInventoryStats,
  getLeaseAssignments,
  getVerificationChecklist,
  type InventoryItemDTO,
  type AssignmentItemDTO,
  type VerificationItemDTO,
} from '../api/inventory.api';
import {
  type InventoryCondition,
  type InventoryStatus,
  type InventoryItem,
  type AssignmentItem,
  type VerificationItem,
} from '../mockInventoryData';
import { formatCurrency, formatCompactCurrency } from '@/src/utils/formatters';

export type InventoryTab = 'registry' | 'moveIn' | 'moveOut';

export function useInventory() {
  const params = useLocalSearchParams<{ tab?: string; leaseId?: string; propertyId?: string }>();
  const { accessToken } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();

  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeLeaseId = params.leaseId;
  const initialTab: InventoryTab =
    params.tab === 'moveIn' || params.tab === 'moveOut' ? params.tab : 'registry';

  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [query, setQuery] = useState('');
  const [serviceOnly, setServiceOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rawItems, setRawItems] = useState<InventoryItem[]>([]);
  const [assignmentItems, setAssignmentItems] = useState<AssignmentItem[]>([]);
  const [verificationItemsList, setVerificationItemsList] = useState<VerificationItem[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Assets', value: '0', helper: 'Total tracked assets', icon: 'trending-up' as const },
    { label: 'Maintenance Due', value: '00', helper: 'High priority items', icon: 'warning' as const },
    { label: 'Unassigned', value: '0', helper: 'Ready for move-in', icon: 'inventory-2' as const },
    { label: 'Valuation', value: 'Rs. 0', helper: 'Replacement cost', icon: 'calculate' as const },
  ]);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);

    try {
      let mapped: InventoryItem[] = [];
      if (selectedPropertyId) {
        const itemsRes = await getPropertyInventory(selectedPropertyId, accessToken).catch(() => []);
        mapped = (itemsRes || []).map((dto: InventoryItemDTO) => ({
          id: dto.id,
          name: dto.name,
          category: dto.category,
          location: dto.location || 'Shared',
          serial: dto.serial || '',
          condition: dto.condition as InventoryCondition,
          status: dto.status as InventoryStatus,
          nextService: dto.nextService || '',
          value: formatCurrency(Number(dto.value) || 0),
          shared: dto.shared,
          icon: (dto.icon || 'inventory-2') as InventoryItem['icon'],
          image: dto.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
          notes: dto.notes || '',
        }));
      } else if (properties.length > 0) {
        const allItemPromises = properties.map((p) => getPropertyInventory(p.id, accessToken).catch(() => []));
        const results = await Promise.all(allItemPromises);
        const combined = results.flat();
        mapped = combined.map((dto: InventoryItemDTO) => ({
          id: dto.id,
          name: dto.name,
          category: dto.category,
          location: dto.location || 'Shared',
          serial: dto.serial || '',
          condition: dto.condition as InventoryCondition,
          status: dto.status as InventoryStatus,
          nextService: dto.nextService || '',
          value: formatCurrency(Number(dto.value) || 0),
          shared: dto.shared,
          icon: (dto.icon || 'inventory-2') as InventoryItem['icon'],
          image: dto.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
          notes: dto.notes || '',
        }));
      }

      setRawItems(mapped);
      const totalVal = mapped.reduce((acc, curr) => {
        const valNum = parseFloat(String(curr.value).replace(/[^0-9.]/g, '')) || 0;
        return acc + valNum;
      }, 0);
      setStats([
        { label: 'Total Assets', value: String(mapped.length), helper: 'Total tracked assets', icon: 'trending-up' as const },
        { label: 'Maintenance Due', value: String(mapped.filter((i) => i.status === 'Service Due' || i.condition === 'Damaged').length), helper: 'Requires inspection', icon: 'warning' as const },
        { label: 'Unassigned', value: String(mapped.filter((i) => i.shared).length), helper: 'Ready for move-in', icon: 'inventory-2' as const },
        { label: 'Valuation', value: formatCompactCurrency(totalVal), helper: 'Replacement cost', icon: 'calculate' as const },
      ]);

      if (activeLeaseId) {
        const [assignmentsRes, checklistRes] = await Promise.allSettled([
          getLeaseAssignments(activeLeaseId, accessToken),
          getVerificationChecklist(activeLeaseId, accessToken),
        ]);

        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value) {
          const mappedAssigns: AssignmentItem[] = assignmentsRes.value.map((dto: AssignmentItemDTO) => ({
            id: dto.id,
            name: dto.name,
            category: dto.category,
            location: dto.location,
            serial: dto.serial,
            condition: dto.condition as InventoryCondition,
            status: dto.status as InventoryStatus,
            nextService: dto.nextService || '',
            value: formatCurrency(dto.value),
            shared: dto.shared,
            icon: (dto.icon || 'inventory-2') as InventoryItem['icon'],
            image: dto.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
            notes: dto.notes || '',
            assignmentStatus: dto.assignmentStatus as AssignmentItem['assignmentStatus'],
            assignmentCondition: dto.assignmentCondition as InventoryCondition,
            photoCount: dto.photoCount,
          }));
          setAssignmentItems(mappedAssigns);
        }

        if (checklistRes.status === 'fulfilled' && checklistRes.value) {
          const mappedVerify: VerificationItem[] = checklistRes.value.map((dto: VerificationItemDTO) => ({
            id: dto.id,
            name: dto.name,
            area: dto.area,
            icon: (dto.icon || 'inventory-2') as VerificationItem['icon'],
            moveInCondition: dto.moveInCondition as InventoryCondition,
            returnCondition: dto.returnCondition as InventoryCondition,
            damageDescription: dto.damageDescription || '',
            deduction: Number(dto.deduction) || 0,
            status: dto.status as VerificationItem['status'],
            moveInPhoto: dto.moveInPhoto || '',
            returnPhoto: dto.returnPhoto || '',
          }));
          setVerificationItemsList(mappedVerify);
        }
      }
    } catch (err) {
      console.warn('[useInventory] Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedPropertyId, activeLeaseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(
    () =>
      [...rawItems]
        .filter((item) => {
          const matchQ = `${item.name} ${item.location} ${item.category} ${item.serial}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
          return matchQ && (!serviceOnly || item.status === 'Service Due');
        })
        .sort((a, b) =>
          (a.location || '').localeCompare(b.location || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        ),
    [rawItems, query, serviceOnly]
  );

  const totalDeductions = verificationItemsList.reduce((s, i) => s + (i.deduction || 0), 0);
  const securityDeposit = 30000;
  const netRefund = Math.max(0, securityDeposit - totalDeductions);

  return {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    serviceOnly,
    setServiceOnly,
    filteredItems,
    rawItems,
    assignmentItems,
    verificationItems: verificationItemsList,
    stats,
    totalDeductions,
    securityDeposit,
    netRefund,
    leaseId: activeLeaseId,
    propertyId: selectedPropertyId,
    properties,
    setSelectedPropertyId,
    loading: loading || propertiesLoading,
    refresh: loadData,
    isAddModalOpen,
    setIsAddModalOpen,
    accessToken,
  };
}
