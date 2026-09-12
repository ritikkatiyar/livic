import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import GlassDropdown, { DropdownOption } from '@/src/components/common/inputs/GlassDropdown';
import { useRouter } from 'expo-router';

export interface PropertySelectorProps {
  properties: Array<{ id: string; name: string }>;
  selectedPropertyId?: string | null;
  onSelectProperty: (propertyId: string) => void;
  label?: string;
  style?: ViewStyle;
  allowAll?: boolean;
}

export function PropertySelector({
  properties,
  selectedPropertyId,
  onSelectProperty,
  label,
  style,
  allowAll = false,
}: PropertySelectorProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();

  const options: DropdownOption[] = [];
  if (allowAll) {
    options.push({ label: 'All Properties', value: '' });
  }
  (properties || []).forEach((p) => {
    options.push({ label: p.name, value: p.id });
  });

  if (options.length === 0) {
    options.push({ label: '+ Create Property', value: 'create_new_prop' });
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.dropdownWrap}>
        <GlassDropdown
          options={options}
          value={selectedPropertyId || null}
          onChange={(val) => {
            if (val === 'create_new_prop') {
              router.push('/properties/create');
            } else {
              onSelectProperty(val);
            }
          }}
          placeholder="Select Property"
          icon="business"
        />
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  label: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
    letterSpacing: 0.2,
  },
  dropdownWrap: {
    minWidth: 200,
    maxWidth: 280,
  },
});
