import React, { useEffect, useState } from 'react';
import { Alert, Clipboard } from 'react-native';
import {
  getMemberships,
  updateMembership,
  toggleMembershipActive,
  removeMembership,
  transferOwnership,
  MembershipResponse,
} from '@/src/features/properties/api/membership.api';
import {
  generateJoinCode,
  getPropertyJoinCodes,
  JoinCodeResponse,
} from '@/src/features/properties/api/rolePermission.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';

export type ActiveTab = 'members' | 'invites' | 'preferences';

export function useSettings(paramPropertyId: string | null) {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId } = useGlobalPropertySelection();
  const propertyId = paramPropertyId || selectedPropertyId || null;
  const { accessToken, context } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('members');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [members, setMembers] = useState<MembershipResponse[]>([]);
  const [invites, setInvites] = useState<JoinCodeResponse[]>([]);
  const [currentMember, setCurrentMember] = useState<MembershipResponse | null>(null);

  // Edit Permissions Modal State
  const [selectedMember, setSelectedMember] = useState<MembershipResponse | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Edit Member Details Modal State
  const [editDetailsMember, setEditDetailsMember] = useState<MembershipResponse | null>(null);
  const [editMemberTitle, setEditMemberTitle] = useState('');
  const [editMemberAccessType, setEditMemberAccessType] = useState<'FULL_ACCESS' | 'CUSTOM_ACCESS'>('CUSTOM_ACCESS');
  const [savingMemberDetails, setSavingMemberDetails] = useState(false);

  // Generate Invite Modal State
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteAccessType, setInviteAccessType] = useState<'FULL_ACCESS' | 'CUSTOM_ACCESS'>('CUSTOM_ACCESS');
  const [invitePerms, setInvitePerms] = useState<string[]>([]);
  const [inviteMaxUses, setInviteMaxUses] = useState('1');
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    if (propertiesLoading) return;
    if (!properties || properties.length === 0 || !propertyId || !accessToken) {
      setMembers([]);
      setInvites([]);
      setCurrentMember(null);
      setLoading(false);
      return;
    }
    loadData();
  }, [propertyId, accessToken, properties, propertiesLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedMembers, fetchedInvites] = await Promise.all([
        getMemberships(accessToken!, propertyId as string),
        getPropertyJoinCodes(accessToken!, propertyId as string),
      ]);

      setMembers(fetchedMembers || []);
      setInvites(fetchedInvites || []);

      const myManaged = context?.managedProperties.find((m) => m.propertyId === propertyId);
      if (myManaged) {
        const found = (fetchedMembers || []).find((m) => m.title === myManaged.title || m.accessType === myManaged.accessType);
        if (found) {
          setCurrentMember(found);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const isFullAccessUser = () => {
    if (!currentMember) {
      const myManaged = context?.managedProperties.find((m) => m.propertyId === propertyId);
      return myManaged?.accessType === 'FULL_ACCESS';
    }
    return currentMember.accessType === 'FULL_ACCESS';
  };

  const canModifyMember = (_targetMember: MembershipResponse) => {
    return isFullAccessUser();
  };

  const canDelegatePermission = (_permissionCode: string) => {
    return isFullAccessUser();
  };

  const handleToggleMemberActive = async (member: MembershipResponse, value: boolean) => {
    try {
      await toggleMembershipActive(accessToken!, propertyId as string, member.id, value);
      showToast(`Member ${member.fullName} ${value ? 'enabled' : 'disabled'}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member status', 'error');
    }
  };

  const handleOpenEditPermissions = (member: MembershipResponse) => {
    setSelectedMember(member);
    setEditingPermissions([...(member.permissionCodes || [])]);
  };

  const handleOpenEditDetails = (member: MembershipResponse) => {
    setEditDetailsMember(member);
    setEditMemberTitle(member.title);
    setEditMemberAccessType(member.accessType);
  };

  const handleSaveMemberDetails = async () => {
    if (!editDetailsMember) return;
    if (!editMemberTitle.trim()) {
      showToast('Title cannot be empty', 'error');
      return;
    }

    try {
      setSavingMemberDetails(true);
      await updateMembership(accessToken!, propertyId as string, editDetailsMember.id, {
        title: editMemberTitle.trim(),
        accessType: editMemberAccessType,
      });
      setEditDetailsMember(null);
      loadData();
      showToast('Member details updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update member details', 'error');
    } finally {
      setSavingMemberDetails(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedMember) return;
    try {
      setSavingPermissions(true);
      await updateMembership(accessToken!, propertyId as string, selectedMember.id, {
        permissionCodes: editingPermissions,
      });
      setSelectedMember(null);
      loadData();
      showToast('Permissions updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update permissions', 'error');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleRemoveMember = async (member: MembershipResponse) => {
    try {
      await removeMembership(accessToken!, propertyId as string, member.id);
      loadData();
      showToast('Member removed successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleGenerateInvite = async () => {
    if (!inviteTitle.trim()) {
      showToast('Please enter an invite role/title', 'error');
      return;
    }
    const maxUses = parseInt(inviteMaxUses, 10);
    if (isNaN(maxUses) || maxUses <= 0) {
      showToast('Max uses must be at least 1', 'error');
      return;
    }

    try {
      setGeneratingInvite(true);
      const codeRes = await generateJoinCode(accessToken!, propertyId as string, {
        title: inviteTitle.trim(),
        accessType: inviteAccessType,
        permissionCodes: inviteAccessType === 'FULL_ACCESS' ? [] : invitePerms,
        maxUses,
      });
      setInviteModalVisible(false);
      setInviteTitle('');
      setInviteAccessType('CUSTOM_ACCESS');
      setInvitePerms([]);
      setInviteMaxUses('1');
      loadData();
      showToast(`Invite code generated: ${codeRes.code}`, 'success');
      Clipboard.setString(codeRes.code);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate code', 'error');
    } finally {
      setGeneratingInvite(false);
    }
  };

  return {
    properties,
    propertiesLoading,
    propertyId,
    activeTab,
    setActiveTab,
    loading,
    members,
    invites,
    currentMember,
    selectedMember,
    setSelectedMember,
    editingPermissions,
    savingPermissions,
    editDetailsMember,
    setEditDetailsMember,
    editMemberTitle,
    setEditMemberTitle,
    editMemberAccessType,
    setEditMemberAccessType,
    savingMemberDetails,
    inviteModalVisible,
    setInviteModalVisible,
    inviteTitle,
    setInviteTitle,
    inviteAccessType,
    setInviteAccessType,
    invitePerms,
    setInvitePerms,
    inviteMaxUses,
    setInviteMaxUses,
    generatingInvite,
    canModifyMember,
    canDelegatePermission,
    handleToggleMemberActive,
    handleOpenEditPermissions,
    handleOpenEditDetails,
    handleSaveMemberDetails,
    setEditingPermissions,
    handleSavePermissions,
    handleRemoveMember,
    handleGenerateInvite,
    refresh: loadData,
  };
}
