import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getPermissionCatalog } from '@/src/features/properties/api/permissionCatalog.api';
import { useAppTheme } from '@/src/theme/ThemeContext';

type PermissionPickerProps = {
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
};

const MODULE_LABELS: Record<string, string> = {
  PROPERTY: 'Property',
  LEASES: 'Leases',
  FINANCE: 'Finance',
  INVENTORY: 'Inventory',
  ISSUES: 'Issues & Escalations',
  ANNOUNCEMENTS: 'Announcements',
  INSIGHTS: 'Analytics & Reports',
  STAFF: 'Staff',
};

/** A MANAGE/CREATE/UPDATE/EDIT/DELETE code is useless without the screen, so it pulls in the module's VIEW code. */
function viewCodeFor(code: string): string | null {
  const match = code.match(/^(.*)_(MANAGE|CREATE|UPDATE|EDIT|DELETE)$/);
  return match ? `${match[1]}_VIEW` : null;
}

export function PermissionPicker({ selected, onChange, disabled = false }: PermissionPickerProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { accessToken } = useAuth();
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['permissionCatalog'],
    queryFn: () => getPermissionCatalog(accessToken),
    enabled: !!accessToken,
    staleTime: Infinity,
  });

  if (isLoading || !catalog) {
    return <ActivityIndicator color={theme.Colors.primary} style={{ marginVertical: 16 }} />;
  }

  const allCodes = new Set(catalog.flatMap((m) => m.features.map((f) => f.code)));

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
      return;
    }
    const viewCode = viewCodeFor(code);
    const additions = viewCode && allCodes.has(viewCode) && !selected.includes(viewCode) ? [code, viewCode] : [code];
    onChange([...selected, ...additions]);
  };

  const toggleModule = (codes: string[]) => {
    const allOn = codes.every((c) => selected.includes(c));
    onChange(allOn
      ? selected.filter((c) => !codes.includes(c))
      : [...selected, ...codes.filter((c) => !selected.includes(c))]);
  };

  return (
    <View>
      {catalog.map(({ module, features }) => {
        const codes = features.map((f) => f.code);
        const grantedCount = codes.filter((c) => selected.includes(c)).length;
        const moduleLabel = MODULE_LABELS[module] ?? module;

        return (
          <View key={module} style={styles.moduleBlock}>
            <TouchableOpacity
              style={styles.moduleHeader}
              onPress={() => toggleModule(codes)}
              disabled={disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${moduleLabel} module`}
            >
              <Text style={styles.moduleHeading}>{moduleLabel}</Text>
              <Text style={styles.moduleMeta}>
                {grantedCount === 0 ? 'Hidden · Select all' : `${grantedCount}/${codes.length} · ${grantedCount === codes.length ? 'Clear all' : 'Select all'}`}
              </Text>
            </TouchableOpacity>

            {features.map((feature) => {
              const isChecked = selected.includes(feature.code);
              return (
                <TouchableOpacity
                  key={feature.code}
                  style={[styles.row, disabled && styles.rowDisabled]}
                  onPress={() => toggle(feature.code)}
                  disabled={disabled}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked, disabled }}
                  accessibilityLabel={feature.label}
                >
                  <View style={styles.info}>
                    <Text style={styles.name}>{feature.label}</Text>
                    <Text style={styles.desc}>{feature.description}</Text>
                  </View>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <MaterialIcons name="check" size={16} color={theme.Colors.surfaceContainerLowest} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  moduleBlock: {
    marginBottom: 20,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    minHeight: 32,
  },
  moduleHeading: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  moduleMeta: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  desc: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
});
