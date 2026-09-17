import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { UnitResponse } from '@/src/features/properties/api/unit.api';
import { useAppTheme } from '@/src/theme/ThemeContext';

// ── Modal shell ──────────────────────────────────────────────────────────────
function ModalShell({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {children}
      </View>
    </Modal>
  );
}

// ── Footer row shared by all modals ──────────────────────────────────────────
function ModalFooter({
  onCancel, onSubmit, submitLabel, submitIcon, submitColors, disabled,
}: {
  onCancel: () => void; onSubmit: () => void; submitLabel: string;
  submitIcon: string; submitColors: [string, string]; disabled?: boolean;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
        <Text style={[styles.cancelBtnText, { color: theme.Colors.onSurface }]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSubmit} disabled={disabled} style={styles.submitBtn}>
        <View style={[styles.submitBtnInner, { backgroundColor: submitColors[0] || theme.Colors.primary }]}>
          <MaterialIcons name={submitIcon as any} size={18} color="#ffffff" />
          <Text style={styles.submitBtnText}>{submitLabel}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── 1. Book Room Modal ───────────────────────────────────────────────────────
export function BookRoomModal({
  visible, onClose, availableUnits,
  bookingUnitId, setBookingUnitId,
  bookingTenantName, setBookingTenantName,
  bookingTenantPhone, setBookingTenantPhone,
  bookingTenantEmail, setBookingTenantEmail,
  bookingTokenAmount, setBookingTokenAmount,
  bookingExpectedMoveIn, setBookingExpectedMoveIn,
  onSubmit,
}: {
  visible: boolean; onClose: () => void; availableUnits: UnitResponse[];
  bookingUnitId: string; setBookingUnitId: (v: string) => void;
  bookingTenantName: string; setBookingTenantName: (v: string) => void;
  bookingTenantPhone: string; setBookingTenantPhone: (v: string) => void;
  bookingTenantEmail: string; setBookingTenantEmail: (v: string) => void;
  bookingTokenAmount: string; setBookingTokenAmount: (v: string) => void;
  bookingExpectedMoveIn: string; setBookingExpectedMoveIn: (v: string) => void;
  onSubmit: () => void;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.4)';
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>NEW RESERVATION</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Book Room / Bed</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Select Available Unit *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: theme.Spacing.sm }}>
              {availableUnits.map((u) => {
                const sel = bookingUnitId === u.id;
                return (
                  <TouchableOpacity
                    key={u.id} onPress={() => setBookingUnitId(u.id)}
                    style={[styles.chip, sel && { borderColor: theme.Colors.primary, backgroundColor: `${theme.Colors.primary}12` }]}
                  >
                    <MaterialIcons name="meeting-room" size={14} color={sel ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
                    <Text style={[styles.chipText, { color: sel ? theme.Colors.primary : theme.Colors.onSurfaceVariant }]}>Unit {u.unitNumber}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Prospective Tenant Name *</Text>
          <TextInput value={bookingTenantName} onChangeText={setBookingTenantName} placeholder="e.g. Jordan Mitchell" placeholderTextColor={placeholderColor} style={styles.input} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Phone Number *</Text>
              <TextInput value={bookingTenantPhone} onChangeText={setBookingTenantPhone} placeholder="9876543210" placeholderTextColor={placeholderColor} keyboardType="phone-pad" style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Token Amount (₹) *</Text>
              <TextInput value={bookingTokenAmount} onChangeText={setBookingTokenAmount} placeholder="5000" placeholderTextColor={placeholderColor} keyboardType="numeric" style={styles.input} />
            </View>
          </View>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Expected Move-In Date (YYYY-MM-DD) *</Text>
          <TextInput value={bookingExpectedMoveIn} onChangeText={setBookingExpectedMoveIn} placeholder="2026-09-01" placeholderTextColor={placeholderColor} style={styles.input} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Email Address (Optional)</Text>
          <TextInput value={bookingTenantEmail} onChangeText={setBookingTenantEmail} placeholder="tenant@example.com" placeholderTextColor={placeholderColor} keyboardType="email-address" style={styles.input} />
        </ScrollView>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Confirm Booking" submitIcon="check" submitColors={[theme.Colors.primary, theme.Colors.secondary]} />
      </View>
    </ModalShell>
  );
}

// ── 2. Serve Notice Modal ────────────────────────────────────────────────────
export function ServeNoticeModal({ visible, onClose, noticeMoveOutDate, setNoticeMoveOutDate, onSubmit }: {
  visible: boolean; onClose: () => void; noticeMoveOutDate: string; setNoticeMoveOutDate: (v: string) => void; onSubmit: () => void;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.4)';
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 440 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.error }]}>MOVE-OUT NOTICE</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Serve Move-Out Notice</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Expected Vacate Date (YYYY-MM-DD) *</Text>
          <TextInput value={noticeMoveOutDate} onChangeText={setNoticeMoveOutDate} placeholder="2026-09-30" placeholderTextColor={placeholderColor} style={styles.input} />
        </View>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Serve Notice" submitIcon="warning" submitColors={[theme.Colors.error, theme.Colors.errorContainer]} />
      </View>
    </ModalShell>
  );
}

// ── 3. Cash Token Modal ──────────────────────────────────────────────────────
export function CashTokenModal({ visible, onClose, cashAmount, setCashAmount, cashNote, setCashNote, onSubmit }: {
  visible: boolean; onClose: () => void; cashAmount: string; setCashAmount: (v: string) => void; cashNote: string; setCashNote: (v: string) => void; onSubmit: () => void;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.4)';
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 440 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>TOKEN COLLECTION</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Record Cash Payment</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Amount Collected (₹) *</Text>
          <TextInput value={cashAmount} onChangeText={setCashAmount} placeholder="5000" placeholderTextColor={placeholderColor} keyboardType="numeric" style={styles.input} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Receipt / Payment Notes</Text>
          <TextInput value={cashNote} onChangeText={setCashNote} placeholder="Handed in person / receipt #123" placeholderTextColor={placeholderColor} style={styles.input} />
        </View>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Record Payment" submitIcon="payments" submitColors={[theme.Colors.primary, theme.Colors.secondary]} />
      </View>
    </ModalShell>
  );
}

// ── 4. Convert Booking to Lease Modal ───────────────────────────────────────
export function ConvertToLeaseModal({ visible, onClose, convMonthlyRentAmount, setConvMonthlyRentAmount, convSecurityDeposit, setConvSecurityDeposit, onSubmit }: {
  visible: boolean; onClose: () => void;
  convMonthlyRentAmount: string; setConvMonthlyRentAmount: (v: string) => void;
  convSecurityDeposit: string; setConvSecurityDeposit: (v: string) => void;
  onSubmit: () => void;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.4)';
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 480 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>LEASE ACTIVATION</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Convert Booking to Active Lease</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Monthly Rent Amount (₹) *</Text>
          <TextInput value={convMonthlyRentAmount} onChangeText={setConvMonthlyRentAmount} placeholder="25000" placeholderTextColor={placeholderColor} keyboardType="numeric" style={styles.input} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Security Deposit (₹) *</Text>
          <TextInput value={convSecurityDeposit} onChangeText={setConvSecurityDeposit} placeholder="50000" placeholderTextColor={placeholderColor} keyboardType="numeric" style={styles.input} />
        </View>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Activate Lease" submitIcon="how-to-reg" submitColors={[theme.Colors.primary, theme.Colors.secondary]} />
      </View>
    </ModalShell>
  );
}

// ── 5. Edit Lease Terms Modal ────────────────────────────────────────────────
export function EditLeaseTermsModal({ visible, onClose, editingLease, editRentAmount, setEditRentAmount, editSecurityDeposit, setEditSecurityDeposit, onSubmit, isSaving }: {
  visible: boolean; onClose: () => void; editingLease: LeaseResponse | null;
  editRentAmount: string; setEditRentAmount: (v: string) => void;
  editSecurityDeposit: string; setEditSecurityDeposit: (v: string) => void;
  onSubmit: () => void; isSaving: boolean;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.4)';
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 440 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>LEASE TERMS</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Edit Rent & Deposit</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          {editingLease && (
            <View style={{ marginBottom: 14, padding: 12, backgroundColor: `${theme.Colors.primary}12`, borderRadius: 12, borderWidth: 1, borderColor: `${theme.Colors.primary}30` }}>
              <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.primary }}>
                Unit {editingLease.unitNumber} • {editingLease.tenantName || 'Tenant'}
              </Text>
              {editingLease.tenantPhone ? <Text style={{ fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 }}>{editingLease.tenantPhone}</Text> : null}
            </View>
          )}
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Monthly Rent Amount (₹) *</Text>
          <TextInput value={editRentAmount} onChangeText={setEditRentAmount} placeholder="e.g. 15000" placeholderTextColor={placeholderColor} keyboardType="numeric" style={styles.input} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Security Deposit (₹) *</Text>
          <TextInput value={editSecurityDeposit} onChangeText={setEditSecurityDeposit} placeholder="e.g. 30000" placeholderTextColor={placeholderColor} keyboardType="numeric" style={styles.input} />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: theme.Colors.onSurface }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmit} disabled={isSaving} style={styles.submitBtn}>
            <View style={[styles.submitBtnInner, { backgroundColor: theme.Colors.primary }]}>
              {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                <>
                  <MaterialIcons name="check" size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Save Terms</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ModalShell>
  );
}

// ── 6. Reject Tour Request Modal ─────────────────────────────────────────────
export const TOUR_REJECTION_NOTE_MAX = 500;

export function RejectTourModal({ visible, onClose, prospectName, visitLabel, onSubmit, isSubmitting }: {
  visible: boolean; onClose: () => void;
  prospectName: string; visitLabel: string;
  onSubmit: (note: string | null) => void; isSubmitting: boolean;
}) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [note, setNote] = React.useState('');

  // Every rejection starts with an empty note
  React.useEffect(() => {
    if (visible) setNote('');
  }, [visible]);

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 480 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: theme.Colors.error }]}>TOUR REQUEST</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Decline visit request</Text>
            <Text style={[styles.subtitle, { color: theme.Colors.onSurfaceVariant }]}>
              {prospectName} · {visitLabel}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <MaterialIcons name="close" size={theme.IconSizes.md} color={theme.Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Note for the prospect (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. That room is booked for the week — please pick another date."
            placeholderTextColor={theme.Colors.onSurfaceVariant}
            maxLength={TOUR_REJECTION_NOTE_MAX}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.multilineInput]}
            accessibilityLabel="Rejection note"
          />
          <Text style={[styles.helperText, { color: theme.Colors.onSurfaceVariant }]}>
            {note.length}/{TOUR_REJECTION_NOTE_MAX} · Shown to the prospect on their request status.
          </Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={isSubmitting}>
            <Text style={[styles.cancelBtnText, { color: theme.Colors.onSurface }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSubmit(note.trim() ? note.trim() : null)}
            disabled={isSubmitting}
            style={styles.submitBtn}
            accessibilityRole="button"
            accessibilityLabel="Reject request"
          >
            <View style={[styles.submitBtnInner, { backgroundColor: theme.Colors.error }]}>
              {isSubmitting ? <ActivityIndicator size="small" color={theme.Colors.onError} /> : (
                <>
                  <MaterialIcons name="close" size={theme.IconSizes.md} color={theme.Colors.onError} />
                  <Text style={[styles.submitBtnText, { color: theme.Colors.onError }]}>Reject Request</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ModalShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.Colors.modalOverlayBackground || theme.Colors.scrim || 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.outline,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  kicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', letterSpacing: 0.2, marginBottom: 2 },
  title: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600' },
  subtitle: { fontSize: theme.Typography.bodySmall.fontSize, marginTop: theme.Spacing.xs },
  closeBtn: { padding: theme.Spacing.xs },
  body: { paddingHorizontal: 20, paddingBottom: theme.Spacing.sm, maxHeight: 420 },
  label: { fontSize: theme.Typography.labelMedium.fontSize, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    marginBottom: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : theme.Colors.outlineVariant,
    color: theme.Colors.onSurface,
  },
  multilineInput: { minHeight: 104, fontWeight: '400', marginBottom: theme.Spacing.xs },
  helperText: { fontSize: theme.Typography.labelSmall.fontSize, marginBottom: theme.Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: theme.Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : theme.Colors.outlineVariant,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : theme.Colors.surfaceContainerLowest,
  },
  chipText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.Spacing.md,
    paddingTop: theme.Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : theme.Colors.outlineVariant,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : theme.Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : theme.Colors.surfaceContainerLow,
  },
  cancelBtnText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700' },
  submitBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.Spacing.sm, paddingVertical: 12 },
  submitBtnText: { color: '#ffffff', fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },
});
