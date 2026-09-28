import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';

export default function AdminScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  
  return (
    <PageShell contentContainerStyle={styles.container}>
      <Text style={styles.text}>Admin Panel</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.Typography.headlineSmall.fontSize,
    fontWeight: 'bold',
    color: theme.Colors.primary,
  },
  subtext: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 8,
  },
});
