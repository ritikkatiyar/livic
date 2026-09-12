import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getMemberships, removeMembership, transferOwnership, MembershipResponse } from '@/src/features/properties/api/membership.api';
import { generateJoinCode, JoinCodeResponse } from '@/src/features/properties/api/rolePermission.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { formatErrorMessage } from '@/src/utils/errors';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { ResponsiveHeader } from '@/src/components/common/layout/ResponsiveHeader';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { ConfirmDialog } from '@/src/components/common/feedback/ConfirmDialog';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

interface Props {
  propertyId: string;
}

export default function MembershipManagementScreen({ propertyId }: Props) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { accessToken } = useAuth();
  const { handleScroll } = useScrollNav();
  
  const [memberships, setMemberships] = useState<MembershipResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteAccessType, setInviteAccessType] = useState<'FULL_ACCESS' | 'CUSTOM_ACCESS'>('CUSTOM_ACCESS');
  const [inviteMaxUses, setInviteMaxUses] = useState('1');
  const [generatingInvite, setGeneratingInvite] = useState(false);

  // ConfirmDialog states
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [membershipToRemove, setMembershipToRemove] = useState<MembershipResponse | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [transferDialogVisible, setTransferDialogVisible] = useState(false);
  const [membershipToTransfer, setMembershipToTransfer] = useState<MembershipResponse | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const membershipsData = await getMemberships(accessToken, propertyId);
      setMemberships(membershipsData);
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!accessToken || !inviteTitle.trim()) return;
    try {
      setGeneratingInvite(true);
      const maxUses = parseInt(inviteMaxUses, 10) || 1;
      const res = await generateJoinCode(accessToken, propertyId, {
        title: inviteTitle.trim(),
        accessType: inviteAccessType,
        maxUses,
      });
      setInviteModalVisible(false);
      setInviteTitle('');
      setInviteAccessType('CUSTOM_ACCESS');
      setInviteMaxUses('1');
      Alert.alert('Join Code Generated', `Share this code with your team member: ${res.code}`);
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setGeneratingInvite(false);
    }
  };

  const triggerRemoveRole = (membership: MembershipResponse) => {
    setMembershipToRemove(membership);
    setRemoveDialogVisible(true);
  };

  const executeRemoveRole = async () => {
    if (!accessToken || !membershipToRemove) return;
    try {
      setIsRemoving(true);
      await removeMembership(accessToken, propertyId, membershipToRemove.id);
      setRemoveDialogVisible(false);
      setMembershipToRemove(null);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setIsRemoving(false);
    }
  };

  const triggerTransferOwnership = (membership: MembershipResponse) => {
    setMembershipToTransfer(membership);
    setTransferDialogVisible(true);
  };

  const executeTransferOwnership = async () => {
    if (!accessToken || !membershipToTransfer) return;
    try {
      setIsTransferring(true);
      await transferOwnership(accessToken, propertyId, { toUserId: membershipToTransfer.userId });
      setTransferDialogVisible(false);
      setMembershipToTransfer(null);
      loadData();
      Alert.alert('Success', 'Ownership transferred successfully');
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setIsTransferring(false);
    }
  };

  const renderMembershipItem = ({ item }: { item: MembershipResponse }) => {
    const isOwner = item.accessType === 'FULL_ACCESS';

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.fullName || 'Unnamed User'}</Text>
          <Text style={styles.email}>{item.email || 'No email provided'}</Text>
          <StatusPill
            status={item.title || 'Member'}
            style={styles.pillOverride}
          />
        </View>

        <View style={styles.cardActions}>
          {!isOwner && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => triggerTransferOwnership(item)}
                accessibilityLabel="Transfer Ownership"
              >
                <MaterialIcons name="swap-horiz" size={20} color={theme.Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => triggerRemoveRole(item)}
                accessibilityLabel="Remove Member"
              >
                <MaterialIcons name="delete-outline" size={20} color={theme.Colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </GlassCard>
    );
  };

  return (
    <PageShell onScroll={handleScroll}>
      <ResponsiveHeader
        title="Team & Staff"
        onBack={() => router.back()}
        rightAction={
          <ActionButton
            title="Invite Staff"
            onPress={() => setInviteModalVisible(true)}
          />
        }
      />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={memberships}
            keyExtractor={(item) => item.id}
            renderItem={renderMembershipItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No team members assigned yet</Text>
            }
          />
        )}
      </View>

      {/* Remove Confirmation */}
      <ConfirmDialog
        visible={removeDialogVisible}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${membershipToRemove?.fullName || ''} from this property?`}
        onConfirm={executeRemoveRole}
        onCancel={() => {
          setRemoveDialogVisible(false);
          setMembershipToRemove(null);
        }}
        confirmText="Remove"
        loading={isRemoving}
      />

      {/* Transfer Ownership confirmation */}
      <ConfirmDialog
        visible={transferDialogVisible}
        title="Transfer Ownership"
        message={`Transfer ownership to ${membershipToTransfer?.fullName || ''}?`}
        onConfirm={executeTransferOwnership}
        onCancel={() => {
          setTransferDialogVisible(false);
          setMembershipToTransfer(null);
        }}
        confirmText="Transfer"
        loading={isTransferring}
      />

      {/* Generate Invite Modal */}
      <Modal visible={inviteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Staff Member</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Staff Title / Role</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. Manager, Caretaker, Supervisor"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={inviteTitle}
              onChangeText={setInviteTitle}
            />

            <Text style={[styles.label, { marginTop: theme.Spacing.md }]}>Access Level</Text>
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, inviteAccessType === 'CUSTOM_ACCESS' && styles.roleOptionActive]}
                onPress={() => setInviteAccessType('CUSTOM_ACCESS')}
              >
                <Text style={[styles.roleOptionText, inviteAccessType === 'CUSTOM_ACCESS' && styles.roleOptionTextActive]}>
                  Custom Access
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, inviteAccessType === 'FULL_ACCESS' && styles.roleOptionActive]}
                onPress={() => setInviteAccessType('FULL_ACCESS')}
              >
                <Text style={[styles.roleOptionText, inviteAccessType === 'FULL_ACCESS' && styles.roleOptionTextActive]}>
                  Full Access
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: theme.Spacing.md }]}>Max Uses</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="1"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={inviteMaxUses}
              onChangeText={setInviteMaxUses}
              keyboardType="number-pad"
            />

            <ActionButton
              title="Generate Join Code"
              onPress={handleGenerateInvite}
              loading={generatingInvite}
              style={styles.assignBtn}
            />
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  addBtn: { padding: theme.Spacing.xs },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: theme.Spacing.containerPadding,
  },
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.Spacing.md,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  email: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  pillOverride: {
    marginTop: theme.Spacing.sm,
  },
  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  actionBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainer,
  },
  emptyText: { textAlign: 'center', color: theme.Colors.onSurfaceVariant, marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.Spacing.lg,
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  label: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', marginBottom: theme.Spacing.sm, color: theme.Colors.onSurfaceVariant },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.Typography.bodyLarge.fontSize,
    height: 48,
    color: theme.Colors.onSurface,
  },
  roleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleOption: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 22,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionActive: {
    borderColor: theme.Colors.primary,
    backgroundColor: theme.Colors.primaryContainer,
  },
  roleOptionText: { fontWeight: '600', color: theme.Colors.onSurfaceVariant },
  roleOptionTextActive: { color: theme.Colors.primary },
  assignBtn: {
    marginTop: theme.Spacing.lg,
  },
});
