import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { MembershipResponse } from '@/src/features/properties/api/membership.api';

export const ALL_PERMISSIONS = [
  { code: 'PROPERTY_VIEW', name: 'View Property', description: 'Can view property details and announcements', category: 'Property' },
  { code: 'PROPERTY_EDIT', name: 'Edit Property', description: 'Can edit property details, structures, and layouts', category: 'Property' },
  { code: 'PROPERTY_DELETE', name: 'Delete Property', description: 'Can permanently delete the property', category: 'Property' },
  { code: 'LEASE_CREATE', name: 'Create Leases', description: 'Can create and configure leases for units', category: 'Leases' },
  { code: 'LEASE_UPDATE', name: 'Update Leases', description: 'Can update, renew, or terminate active leases', category: 'Leases' },
  { code: 'LEASE_VIEW', name: 'View Leases', description: 'Can view all tenant leases on the property', category: 'Leases' },
  { code: 'EXPENSE_CREATE', name: 'Create Expenses', description: 'Can record property expenses and utility splits', category: 'Expenses' },
  { code: 'EXPENSE_APPROVE', name: 'Approve Expenses', description: 'Can approve and publish expenses to tenants', category: 'Expenses' },
  { code: 'PAYMENT_VIEW', name: 'View Payments', description: 'Can view rent and invoice payment history', category: 'Payments' },
  { code: 'ANNOUNCEMENT_CREATE', name: 'Broadcast Notices', description: 'Can post notice board announcements to tenants', category: 'Announcements' },
  { code: 'MANAGE_STAFF', name: 'Manage Staff', description: 'Can manage other staff access and invite codes', category: 'Staff' },
];

type ThemeLike = any;
type StylesLike = Record<string, any>;

type PermissionsMatrixModalProps = {
  editingPermissions: string[];
  savingPermissions: boolean;
  selectedMember: MembershipResponse | null;
  canDelegatePermission: (permissionCode: string) => boolean;
  handleSavePermissions: () => void;
  handleTogglePermission: (code: string) => void;
  setSelectedMember: (member: MembershipResponse | null) => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function PermissionsMatrixModal({
  editingPermissions,
  savingPermissions,
  selectedMember,
  canDelegatePermission,
  handleSavePermissions,
  handleTogglePermission,
  setSelectedMember,
  styles,
  theme,
}: PermissionsMatrixModalProps) {
  return (
    <Modal visible={selectedMember !== null} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedMember?.fullName || selectedMember?.title}</Text>
              <Text style={styles.modalSub}>Configure assigned permissions</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedMember(null)} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {Object.entries(
              ALL_PERMISSIONS.reduce((acc, curr) => {
                if (!acc[curr.category]) acc[curr.category] = [];
                acc[curr.category].push(curr);
                return acc;
              }, {} as Record<string, typeof ALL_PERMISSIONS>)
            ).map(([category, items]) => (
              <View key={category} style={styles.categoryBlock}>
                <Text style={styles.categoryHeading}>{category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}</Text>
                {items.map((item) => {
                  const isChecked = editingPermissions.includes(item.code);
                  const isDelegatable = canDelegatePermission(item.code);

                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.permCheckRow, !isDelegatable && styles.permCheckRowDisabled]}
                      onPress={() => handleTogglePermission(item.code)}
                      disabled={!isDelegatable}
                      activeOpacity={0.7}
                    >
                      <View style={styles.permCheckInfo}>
                        <Text style={[styles.permCheckName, !isDelegatable && styles.permCheckNameDisabled]}>
                          {item.name}
                        </Text>
                        <Text style={styles.permCheckDesc}>{item.description}</Text>
                      </View>
                      <View
                        style={[
                          styles.permCheckbox,
                          isChecked && styles.permCheckboxChecked,
                          !isDelegatable && styles.permCheckboxDisabled,
                        ]}
                      >
                        {isChecked && (
                          <MaterialIcons
                            name="check"
                            size={16}
                            color={theme.Colors.surfaceContainerLowest}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setSelectedMember(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSavePermissions}
              disabled={savingPermissions}
              activeOpacity={0.8}
            >
              <View
                style={styles.modalBtnGradient}
              >
                {savingPermissions ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Text style={styles.modalBtnText}>SAVE CHANGES</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type EditMemberDetailsModalProps = {
  editDetailsMember: MembershipResponse | null;
  editMemberTitle: string;
  editMemberAccessType: 'FULL_ACCESS' | 'CUSTOM_ACCESS';
  savingMemberDetails: boolean;
  handleSaveMemberDetails: () => void;
  setEditDetailsMember: (member: MembershipResponse | null) => void;
  setEditMemberTitle: (title: string) => void;
  setEditMemberAccessType: (accessType: 'FULL_ACCESS' | 'CUSTOM_ACCESS') => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function EditMemberDetailsModal({
  editDetailsMember,
  editMemberTitle,
  editMemberAccessType,
  savingMemberDetails,
  handleSaveMemberDetails,
  setEditDetailsMember,
  setEditMemberTitle,
  setEditMemberAccessType,
  styles,
  theme,
}: EditMemberDetailsModalProps) {
  return (
    <Modal visible={editDetailsMember !== null} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: 420 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Member Role & Access</Text>
              <Text style={styles.modalSub}>{editDetailsMember?.fullName || 'Configure access'}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditDetailsMember(null)} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24 }}>
            <Text style={styles.inputLabel}>TITLE / ROLE NAME</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editMemberTitle}
              onChangeText={setEditMemberTitle}
              placeholder="e.g. Property Manager, Caretaker"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>ACCESS LEVEL</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.roleSelectChip, editMemberAccessType === 'CUSTOM_ACCESS' && styles.roleSelectChipActive]}
                onPress={() => setEditMemberAccessType('CUSTOM_ACCESS')}
              >
                <Text style={[styles.roleSelectChipText, editMemberAccessType === 'CUSTOM_ACCESS' && styles.roleSelectChipTextActive]}>
                  Custom Access
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleSelectChip, editMemberAccessType === 'FULL_ACCESS' && styles.roleSelectChipActive]}
                onPress={() => setEditMemberAccessType('FULL_ACCESS')}
              >
                <Text style={[styles.roleSelectChipText, editMemberAccessType === 'FULL_ACCESS' && styles.roleSelectChipTextActive]}>
                  Full Access (Admin)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: 24 }]}
              onPress={handleSaveMemberDetails}
              disabled={savingMemberDetails}
              activeOpacity={0.8}
            >
              <View
                style={styles.modalBtnGradient}
              >
                {savingMemberDetails ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Text style={styles.modalBtnText}>SAVE CHANGES</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type GenerateInviteCodeModalProps = {
  generatingInvite: boolean;
  inviteTitle: string;
  inviteAccessType: 'FULL_ACCESS' | 'CUSTOM_ACCESS';
  invitePerms: string[];
  inviteMaxUses: string;
  inviteModalVisible: boolean;
  handleGenerateInvite: () => void;
  handleToggleInvitePerm: (permCode: string) => void;
  setInviteTitle: (title: string) => void;
  setInviteAccessType: (accessType: 'FULL_ACCESS' | 'CUSTOM_ACCESS') => void;
  setInviteMaxUses: (maxUses: string) => void;
  setInviteModalVisible: (visible: boolean) => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function GenerateInviteCodeModal({
  generatingInvite,
  inviteTitle,
  inviteAccessType,
  invitePerms,
  inviteMaxUses,
  inviteModalVisible,
  handleGenerateInvite,
  handleToggleInvitePerm,
  setInviteTitle,
  setInviteAccessType,
  setInviteMaxUses,
  setInviteModalVisible,
  styles,
  theme,
}: GenerateInviteCodeModalProps) {
  return (
    <Modal visible={inviteModalVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: 600 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Generate Staff Join Code</Text>
              <Text style={styles.modalSub}>Create a code with direct permissions</Text>
            </View>
            <TouchableOpacity onPress={() => setInviteModalVisible(false)} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text style={styles.inputLabel}>STAFF TITLE / ROLE</Text>
            <TextInput
              style={styles.modalTextInput}
              value={inviteTitle}
              onChangeText={setInviteTitle}
              placeholder="e.g. Manager, Caretaker, Supervisor"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>ACCESS LEVEL</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.roleSelectChip, inviteAccessType === 'CUSTOM_ACCESS' && styles.roleSelectChipActive]}
                onPress={() => setInviteAccessType('CUSTOM_ACCESS')}
              >
                <Text style={[styles.roleSelectChipText, inviteAccessType === 'CUSTOM_ACCESS' && styles.roleSelectChipTextActive]}>
                  Custom Access
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleSelectChip, inviteAccessType === 'FULL_ACCESS' && styles.roleSelectChipActive]}
                onPress={() => setInviteAccessType('FULL_ACCESS')}
              >
                <Text style={[styles.roleSelectChipText, inviteAccessType === 'FULL_ACCESS' && styles.roleSelectChipTextActive]}>
                  Full Access
                </Text>
              </TouchableOpacity>
            </View>

            {inviteAccessType === 'CUSTOM_ACCESS' && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>ATTACH PERMISSIONS</Text>
                <View style={{ gap: 8, marginTop: 6 }}>
                  {ALL_PERMISSIONS.map((p) => {
                    const isChecked = invitePerms.includes(p.code);
                    return (
                      <TouchableOpacity
                        key={p.code}
                        style={styles.permCheckRow}
                        onPress={() => handleToggleInvitePerm(p.code)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.permCheckInfo}>
                          <Text style={styles.permCheckName}>{p.name}</Text>
                          <Text style={styles.permCheckDesc}>{p.description}</Text>
                        </View>
                        <View style={[styles.permCheckbox, isChecked && styles.permCheckboxChecked]}>
                          {isChecked && <MaterialIcons name="check" size={16} color={theme.Colors.surfaceContainerLowest} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>MAX USES</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="number-pad"
              value={inviteMaxUses}
              onChangeText={setInviteMaxUses}
              placeholder="1"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
            />

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: 24 }]}
              onPress={handleGenerateInvite}
              disabled={generatingInvite || !inviteTitle.trim()}
              activeOpacity={0.8}
            >
              <View
                style={styles.modalBtnGradient}
              >
                {generatingInvite ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Text style={styles.modalBtnText}>GENERATE & COPY CODE</Text>
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
