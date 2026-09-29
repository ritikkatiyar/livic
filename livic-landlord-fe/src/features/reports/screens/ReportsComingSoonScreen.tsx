import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { Theme } from '@/src/theme/Theme';
import { withAlpha } from '@/src/theme/colorUtils';

export default function ReportsComingSoonScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();
  const router = useRouter();

  return (
    <PageShell contentContainerStyle={styles.container}>

      <View style={styles.centerContainer}>
        <GlassCard style={styles.glassCard}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="assessment" size={48} color={theme.Colors.primary} />
          </View>
          <Text style={styles.title}>Reports Coming Soon</Text>
          <Text style={styles.subtitle}>
            We are working hard to bring you comprehensive reporting and deep analytics features. Stay tuned!
          </Text>
          <ActionButton
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backBtn}
          />
        </GlassCard>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.Spacing.containerPadding,
  },
  glassCard: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    padding: Theme.Spacing.containerPadding * 1.5,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: withAlpha(theme.Colors.primary, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.Spacing.stackLg,
  },
  title: {
    ...theme.Typography.headlineXl,
    color: theme.Colors.onBackground,
    textAlign: 'center',
    marginBottom: Theme.Spacing.stackSm,
  },
  subtitle: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.outline,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Theme.Spacing.stackLg,
  },
  backBtn: {
    width: '100%',
    maxWidth: 200,
  },
});

