import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { formatDateTime } from '@/src/utils/formatters';
import { TourRequestResponse } from '../api/tourRequest.api';
import { createTourRequestStyles } from './TourRequestsPanel.styles';

type TourRequestCardProps = {
  tour: TourRequestResponse;
  isDesktop: boolean;
  onApprove: (leadId: string) => void;
  onReject: (leadId: string) => void;
  isApproving: boolean;
  /** Disables actions while another decision is in flight. */
  actionsDisabled: boolean;
};

/** Pending tours are shown as "PENDING"; other statuses keep their backend name. */
export function tourStatusLabel(status: TourRequestResponse['status']): string {
  return status === 'NEW' ? 'PENDING' : status;
}

export function formatVisitSlot(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function TourRequestCard({ tour, isDesktop, onApprove, onReject, isApproving, actionsDisabled }: TourRequestCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createTourRequestStyles(theme), [theme]);

  const initials = (tour.prospectName || 'P').trim().substring(0, 2).toUpperCase();
  const isPending = tour.status === 'NEW';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.prospectName} numberOfLines={1}>{tour.prospectName}</Text>
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactChip}
                onPress={() => Linking.openURL(`tel:${tour.prospectPhone}`)}
                accessibilityRole="link"
                accessibilityLabel={`Call ${tour.prospectName} at ${tour.prospectPhone}`}
              >
                <MaterialIcons name="call" size={theme.IconSizes.xs} color={theme.Colors.primary} />
                <Text style={styles.contactText}>{tour.prospectPhone}</Text>
              </TouchableOpacity>
              {tour.prospectEmail ? (
                <TouchableOpacity
                  style={styles.contactChip}
                  onPress={() => Linking.openURL(`mailto:${tour.prospectEmail}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`Email ${tour.prospectName}`}
                >
                  <MaterialIcons name="mail-outline" size={theme.IconSizes.xs} color={theme.Colors.primary} />
                  <Text style={styles.contactText} numberOfLines={1}>{tour.prospectEmail}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
        <StatusPill status={tourStatusLabel(tour.status)} />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>VISIT</Text>
          <Text style={styles.detailValue}>{formatVisitSlot(tour.preferredSlot)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>UNIT</Text>
          <Text style={styles.detailValue}>{tour.unitNumber ? `Unit ${tour.unitNumber}` : '—'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>REQUESTED</Text>
          <Text style={styles.detailValue}>{formatDateTime(tour.createdAt)}</Text>
        </View>
      </View>

      {tour.outsideVisitingHours ? (
        <View style={styles.warningBox} accessibilityRole="alert">
          <MaterialIcons name="schedule" size={theme.IconSizes.sm} color={theme.Colors.onTertiaryContainer} />
          <Text style={styles.warningText}>
            Outside your current visiting hours. Approve it if the visit still works for you, or decline with a note.
          </Text>
        </View>
      ) : null}

      {tour.status === 'REJECTED' && tour.decisionNote ? (
        <View style={styles.noteBox}>
          <MaterialIcons name="sticky-note-2" size={theme.IconSizes.sm} color={theme.Colors.onErrorContainer} />
          <Text style={styles.noteText}>{tour.decisionNote}</Text>
        </View>
      ) : null}

      {isPending ? (
        <View style={[styles.actionsRow, isDesktop && styles.actionsRowDesktop]}>
          <View style={isDesktop ? undefined : styles.actionItemMobile}>
            <ActionButton
              label="Reject"
              icon="close"
              variant="danger"
              size="sm"
              fullWidth={!isDesktop}
              disabled={actionsDisabled}
              onPress={() => onReject(tour.id)}
            />
          </View>
          <View style={isDesktop ? undefined : styles.actionItemMobile}>
            <ActionButton
              label="Approve"
              icon="check"
              variant="primary"
              size="sm"
              fullWidth={!isDesktop}
              loading={isApproving}
              disabled={actionsDisabled}
              onPress={() => onApprove(tour.id)}
            />
          </View>
        </View>
      ) : tour.decidedAt ? (
        <Text style={styles.footerText}>Decided {formatDateTime(tour.decidedAt)}</Text>
      ) : null}
    </GlassCard>
  );
}
