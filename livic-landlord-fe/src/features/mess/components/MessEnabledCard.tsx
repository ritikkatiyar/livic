import React from 'react';
import { Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createMessMenuStyles } from './MessMenu.styles';

type MessEnabledCardProps = {
  enabled: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
};

/** Whether residents see the menu in the Livic Resident app. */
export function MessEnabledCard({ enabled, disabled, onChange }: MessEnabledCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.switchRow}>
        <View style={styles.switchIcon}>
          <MaterialIcons name={enabled ? 'visibility' : 'visibility-off'} size={theme.IconSizes.md} color={theme.Colors.primary} />
        </View>
        <View style={styles.switchText}>
          <Text style={styles.cardTitle}>Show menu to residents</Text>
          <Text style={styles.cardHint}>
            {enabled
              ? "Residents see this week's menu and today's meals in their app."
              : "Residents can't see the menu while this is off. You can still prepare it."}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ false: theme.Colors.surfaceContainerHighest, true: theme.Colors.primary }}
          thumbColor={theme.Colors.surfaceContainerLowest}
          accessibilityLabel="Show menu to residents"
        />
      </View>
    </GlassCard>
  );
}
