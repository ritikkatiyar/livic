import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/src/hooks/useResponsive';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK', icon: 'home', desc: 'Standard single bedroom apartment' },
  { label: '2 BHK', value: 'TWO_BHK', icon: 'domain', desc: 'Spacious two bedroom apartment' },
  { label: 'Studio Apartment', value: 'STUDIO', icon: 'apartment', desc: 'Compact modern open-plan space' },
  { label: 'Single Unit', value: 'SINGLE_UNIT', icon: 'single-bed', desc: 'Traditional single room unit' },
  { label: 'Shared Unit', value: 'SHARED_UNIT', icon: 'people', desc: 'Co-living space with shared amenities' },
];

interface UnitTypeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectedValue: string;
}

export default function UnitTypeSelectionModal({
  visible,
  onClose,
  onSelect,
  selectedValue,
}: UnitTypeSelectionModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.modalContainer, isWide ? styles.desktopModal : styles.mobileModal]}>
          <View style={styles.blurContainer}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Select Default Unit Type</Text>
                <Text style={styles.subtitle}>Choose the layout style to generate for all floors.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={22} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.grid}>
                {UNIT_TYPE_OPTIONS.map((item) => {
                  const isSelected = selectedValue === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.8}
                      style={[
                        styles.card,
                        isSelected && styles.cardSelected,
                      ]}
                      onPress={() => onSelect(item.value)}
                    >
                      <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                        <MaterialIcons
                          name={item.icon as any}
                          size={24}
                          color={isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                          {item.label}
                        </Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <MaterialIcons name="check" size={12} color={theme.Colors.surfaceContainerLowest} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
                <Text style={styles.confirmBtnText}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.Colors.modalOverlayBackground || theme.Colors.scrim || 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: theme.Rounded.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  desktopModal: {
    width: '100%',
    maxWidth: 600,
  },
  mobileModal: {
    width: '100%',
  },
  blurContainer: {
    width: '100%',
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outline,
  },
  title: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  subtitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
    fontWeight: '500',
  },
  closeButton: {
    padding: theme.Spacing.xs,
    borderRadius: 100,
    backgroundColor: theme.Colors.surfaceContainerHigh,
  },
  scrollContent: {
    padding: theme.Spacing.lg,
  },
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    borderRadius: theme.Rounded.lg,
    padding: theme.Spacing.md,
    position: 'relative',
  },
  cardSelected: {
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.surfaceContainerHighest,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.Spacing.md,
  },
  iconWrapperSelected: {
    backgroundColor: theme.Colors.primaryContainer,
  },
  cardInfo: {
    flex: 1,
    paddingRight: theme.Spacing.md,
  },
  cardLabel: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  cardLabelSelected: {
    color: theme.Colors.primary,
  },
  cardDesc: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 3,
    lineHeight: 14,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outline,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerHigh,
  },
  cancelBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.surfaceContainerLowest,
  },
});
