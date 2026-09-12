import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';

export interface DropdownOption {
  label: string;
  value: string;
}

interface GlassDropdownProps {
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export interface GlassDropdownRef {
  open: () => void;
  close: () => void;
}

const GlassDropdown = forwardRef<GlassDropdownRef, GlassDropdownProps>(
  ({ options, value, onChange, placeholder = 'Select an option', icon }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<any>(null);
    const { isDesktop } = useResponsive();
    const { theme, isDark } = useAppTheme();
    const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const selectedOption = options.find(o => o.value === value);

    const handleOpen = () => {
      triggerRef.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const windowHeight = Dimensions.get('window').height;
        const dropdownHeight = 250; // Max height threshold for options menu
        const spaceBelow = windowHeight - (pageY + height);
        
        let topPosition = pageY + height + 8;
        // If there isn't enough space below, and enough space exists above, flip the direction
        if (spaceBelow < dropdownHeight && pageY > dropdownHeight) {
          topPosition = pageY - dropdownHeight - 8;
        }

        setDropdownCoords({
          top: topPosition, 
          left: pageX,
          width: width,
        });
        setIsOpen(true);
      });
    };

    useImperativeHandle(ref, () => ({
      open: handleOpen,
      close: () => setIsOpen(false),
    }));

    const handleSelect = (val: string) => {
      onChange(val);
      setIsOpen(false);
    };

    return (
      <>
        <TouchableOpacity 
          ref={triggerRef}
          activeOpacity={0.7} 
          style={styles.dropdownTrigger}
          onPress={handleOpen}
        >
          <View style={styles.triggerContent}>
            {icon && <MaterialIcons name={icon} size={20} color={theme.Colors.primary} style={{ marginRight: theme.Spacing.sm }} />}
            <Text 
              numberOfLines={1} 
              style={[styles.triggerText, !selectedOption && styles.placeholderText, { flex: 1 }]}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
          </View>
          <MaterialIcons name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>

        <Modal
          visible={isOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
            <View 
              style={[
                styles.dropdownMenu, 
                { 
                  top: dropdownCoords.top, 
                  left: dropdownCoords.left, 
                  width: dropdownCoords.width 
                }
              ]}
            >
              <Pressable style={{ width: '100%' }}>
                <View style={styles.blurContainer}>
                  <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                  >
                    {options.map((option, idx) => {
                      const isSelected = option.value === value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.optionItem,
                            idx < options.length - 1 && styles.optionBorder
                          ]}
                          onPress={() => handleSelect(option.value)}
                        >
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {option.label}
                          </Text>
                          {isSelected && (
                            <MaterialIcons name="check" size={20} color={theme.Colors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }
);

GlassDropdown.displayName = 'GlassDropdown';

export default GlassDropdown;

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 12,
    width: '100%',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triggerText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  placeholderText: {
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    maxHeight: 350,
    shadowColor: theme.Colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  scrollView: {
    maxHeight: 350,
  },
  scrollContent: {
    paddingVertical: theme.Spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.Spacing.md,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  optionText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  optionTextSelected: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
});
