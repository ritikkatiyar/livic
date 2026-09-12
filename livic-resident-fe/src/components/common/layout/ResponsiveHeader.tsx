import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';

interface ResponsiveHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ResponsiveHeader({
  title,
  onBack,
  rightAction,
}: ResponsiveHeaderProps) {
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {isDesktop && onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={theme.Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.Spacing.unit,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 104, 117, 0.08)',
    backgroundColor: 'transparent',
    marginBottom: theme.Spacing.stackMd,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: theme.Spacing.stackSm,
    padding: theme.Spacing.unit,
    borderRadius: theme.Rounded.full,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
  },
  title: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onBackground,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
