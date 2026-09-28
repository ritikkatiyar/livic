import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { withAlpha } from '@/src/theme/colorUtils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, page === 0 && styles.disabledButton]}
        disabled={page === 0}
        onPress={() => onPageChange(page - 1)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="chevron-left" size={20} color={page === 0 ? theme.Colors.onSurfaceVariant + '60' : theme.Colors.onSurface} />
      </TouchableOpacity>

      <Text style={styles.text}>
        Page <Text style={styles.boldText}>{page + 1}</Text> of <Text style={styles.boldText}>{totalPages}</Text>
      </Text>

      <TouchableOpacity
        style={[styles.button, page >= totalPages - 1 && styles.disabledButton]}
        disabled={page >= totalPages - 1}
        onPress={() => onPageChange(page + 1)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="chevron-right" size={20} color={page >= totalPages - 1 ? theme.Colors.onSurfaceVariant + '60' : theme.Colors.onSurface} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? withAlpha(theme.Colors.onSurface, 0.05) : withAlpha(theme.Colors.onSurface, 0.03),
    borderWidth: 1,
    borderColor: isDark ? withAlpha(theme.Colors.onSurface, 0.1) : withAlpha(theme.Colors.onSurface, 0.05),
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  text: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  boldText: {
    fontWeight: '700',
  },
});
