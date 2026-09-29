import React from 'react';
import { Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { Skeleton } from '@/src/components/common/feedback/Skeleton';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { ChannelChoice, MessageChannel, UpdateTourMessageSettingsRequest } from '../../api/tourMessageSettings.api';
import { useTourMessageSettings } from '../../hooks/useTourMessageSettings';
import { createVisitingHoursStyles } from './VisitingHours.styles';

type MessageType = keyof UpdateTourMessageSettingsRequest;

const MESSAGES: { type: MessageType; title: string; detail: string }[] = [
  { type: 'decision', title: 'Visit approved or declined', detail: 'Sent when you respond to a request.' },
  { type: 'reminder', title: 'Visit reminder', detail: 'Sent 2 hours before an approved visit.' },
];

const CHANNELS: { channel: MessageChannel; key: keyof ChannelChoice; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { channel: 'SMS', key: 'sms', label: 'SMS', icon: 'sms' },
  { channel: 'WHATSAPP', key: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
];

/** Lets the landlord choose SMS, WhatsApp, both or neither for each message visitors get about their tour. */
export function VisitorMessagesCard({ propertyId }: { propertyId: string }) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createVisitingHoursStyles(theme), [theme]);
  const { settings, isLoading, error, save, isSaving } = useTourMessageSettings(propertyId);
  const [edits, setEdits] = React.useState<UpdateTourMessageSettingsRequest | null>(null);

  const available = new Set(settings?.availableChannels ?? []);
  // A channel that isn't set up is always off: the server refuses to turn it on
  const onlyAvailable = (choice: ChannelChoice): ChannelChoice => ({
    sms: choice.sms && available.has('SMS'),
    whatsapp: choice.whatsapp && available.has('WHATSAPP'),
  });
  const saved = settings ? { decision: onlyAvailable(settings.decision), reminder: onlyAvailable(settings.reminder) } : null;
  const draft = edits ?? saved;
  const isDirty = Boolean(edits && saved && JSON.stringify(edits) !== JSON.stringify(saved));

  const toggle = (type: MessageType, key: keyof ChannelChoice, on: boolean) => {
    // Functional update so quick successive toggles all land
    setEdits((prev) => {
      const base = prev ?? saved;
      return base ? { ...base, [type]: { ...base[type], [key]: on } } : prev;
    });
  };

  const handleSave = async () => {
    if (!edits) return;
    try {
      await save(edits);
      setEdits(null);
    } catch {
      // The hook shows the server's message; keep the choice so it can be adjusted
    }
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons name="forum" size={theme.IconSizes.md} color={theme.Colors.primary} />
          <Text style={styles.cardTitle}>Messages to visitors</Text>
        </View>
      </View>
      <Text style={styles.cardHint}>
        Choose how visitors hear about their tour. WhatsApp only reaches visitors who opted in when they booked.
      </Text>

      {error && !settings ? (
        <Text style={styles.fieldError}>Couldn&apos;t load message settings. {error.message}</Text>
      ) : isLoading || !draft ? (
        <Skeleton height={160} borderRadius={theme.Rounded.md} />
      ) : (
        <>
          {MESSAGES.map(({ type, title, detail }, index) => {
            const choice = draft[type];
            const silent = !CHANNELS.some(({ channel, key }) => choice[key] && available.has(channel));
            return (
              <View key={type} style={[styles.dayRow, index === 0 && styles.dayRowFirst]}>
                <View>
                  <Text style={styles.messageTitle}>{title}</Text>
                  <Text style={styles.dayMeta}>{silent ? 'Visitors won’t be messaged' : detail}</Text>
                </View>
                {CHANNELS.map(({ channel, key, label, icon }) => {
                  const isAvailable = available.has(channel);
                  return (
                    <View key={channel} style={styles.channelRow}>
                      <View style={styles.channelLabelRow}>
                        <MaterialIcons name={icon} size={theme.IconSizes.sm} color={theme.Colors.onSurfaceVariant} />
                        <View>
                          <Text style={styles.channelLabel}>{label}</Text>
                          {!isAvailable ? <Text style={styles.ruleHelp}>Not set up for your account yet</Text> : null}
                        </View>
                      </View>
                      <Switch
                        value={choice[key]}
                        disabled={!isAvailable || isSaving}
                        onValueChange={(on) => toggle(type, key, on)}
                        trackColor={{ false: theme.Colors.surfaceContainerHighest, true: theme.Colors.primary }}
                        thumbColor={theme.Colors.surfaceContainerLowest}
                        accessibilityLabel={`${title}: send by ${label}`}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
          <ActionButton
            label={isDirty ? 'Save messages' : 'Messages saved'}
            icon={isDirty ? 'check' : 'check-circle'}
            variant="primary"
            size="md"
            fullWidth
            loading={isSaving}
            disabled={!isDirty || isSaving}
            onPress={handleSave}
          />
        </>
      )}
    </GlassCard>
  );
}
