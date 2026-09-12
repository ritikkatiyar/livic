import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

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
  activeLeases?: any[];
  type?: string;
}

interface TypeSelectionModalProps {
  visible: boolean;
  pendingBlockId: string | null;
  pendingBlockNum: string;
  onClose: () => void;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  setBlocks: React.Dispatch<React.SetStateAction<UnitBlock[]>>;
}

export function TypeSelectionModal({
  visible,
  pendingBlockId,
  pendingBlockNum,
  onClose,
  updateUnitDetails,
  setBlocks,
}: TypeSelectionModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const handleSelectOption = (value: string) => {
    if (pendingBlockId) {
      let cap = 2;
      if (value === 'ONE_BHK') cap = 2;
      else if (value === 'TWO_BHK') cap = 4;
      else if (value === 'STUDIO') cap = 1;
      else if (value === 'SINGLE_UNIT') cap = 1;
      else if (value === 'SHARED_UNIT') cap = 2;

      updateUnitDetails(pendingBlockId, { type: value, capacity: cap });
    }
    onClose();
  };

  const handleDiscard = () => {
    if (pendingBlockId) {
      setBlocks(prev => prev.filter(b => b.id !== pendingBlockId));
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDiscard}
    >
      <View style={styles.modalOverlay}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.Colors.modalOverlayBackground || theme.Colors.scrim || 'rgba(0,0,0,0.5)' }]} />
        <View style={styles.typeModalContent}>
          <Text style={styles.typeModalTitle}>Configure New Unit</Text>
          <Text style={styles.typeModalSubtitle}>Select type for Unit {pendingBlockNum}</Text>
          
          <View style={styles.typeGrid}>
            {UNIT_TYPE_OPTIONS.map((option) => {
              let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
              let desc = '';
              if (option.value === 'ONE_BHK') { iconName = 'looks-one'; desc = '1 Bedroom'; }
              else if (option.value === 'TWO_BHK') { iconName = 'looks-two'; desc = '2 Bedrooms'; }
              else if (option.value === 'STUDIO') { iconName = 'room-service'; desc = 'Single Studio'; }
              else if (option.value === 'SINGLE_UNIT') { iconName = 'person'; desc = 'Single Co-living'; }
              else if (option.value === 'SHARED_UNIT') { iconName = 'people'; desc = 'Shared Co-living'; }

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.typeCard}
                  activeOpacity={0.8}
                  onPress={() => handleSelectOption(option.value)}
                >
                  <View style={styles.typeCardIconWrapper}>
                    <MaterialIcons name={iconName} size={28} color={theme.Colors.primary} />
                  </View>
                  <Text style={styles.typeCardLabel}>{option.label}</Text>
                  <Text style={styles.typeCardDesc}>{desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity
            style={[styles.typeCancelButton, { backgroundColor: 'rgba(229, 57, 53, 0.08)' }]}
            onPress={handleDiscard}
          >
            <Text style={[styles.typeCancelText, { color: theme.Colors.error }]}>Discard Unit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.lg,
  },
  typeModalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: theme.Rounded.xl,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    padding: theme.Spacing.lg,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  typeModalTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    marginBottom: theme.Spacing.xs,
  },
  typeModalSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 20,
  },
  typeGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  typeCard: {
    width: '47%',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: theme.Rounded.lg,
    padding: 14,
    alignItems: 'center',
  },
  typeCardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeCardLabel: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  typeCardDesc: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  typeCancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCancelText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
