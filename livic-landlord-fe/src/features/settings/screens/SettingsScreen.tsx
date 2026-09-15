import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createStyles } from './SettingsScreen.styles';
import { useSettings } from '../hooks/useSettings';
import { SettingsHero, SettingsHubGrid, SettingsTabContent } from '../components/SettingsSections';
import {
  PermissionsMatrixModal,
  EditMemberDetailsModal,
  GenerateInviteCodeModal,
} from '../components/SettingsModals';

export default function SettingsScreen() {
  const { theme, isDark, mode, setMode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();

  const settings = useSettings(paramPropertyId || null);

  const handleBillingPress = () => {
    router.push('/settings?tab=billing' as any);
  };

  const handleGenerateInvitePress = () => {
    settings.setInviteModalVisible(true);
  };

  const isOwner = Boolean(settings.propertyId) && settings.currentMember?.accessType === 'FULL_ACCESS';
  const [pickerDismissed, setPickerDismissed] = React.useState(false);
  const needsProperty = !settings.propertyId && settings.activeTab !== 'preferences';
  const showPropertyPicker = needsProperty && !pickerDismissed;

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {/* Hero Section */}
      <SettingsHero
        activeTab={settings.activeTab}
        isOwner={isOwner}
        onGenerateInvitePress={handleGenerateInvitePress}
        styles={styles}
        theme={theme}
      />

      {/* Hub Grid Selector — hidden while the property picker is showing; closing the picker brings it back. */}
      {!showPropertyPicker && (
        <SettingsHubGrid
          activeTab={settings.activeTab}
          membersCount={settings.members.length}
          invitesCount={settings.invites.length}
          onTabChange={settings.setActiveTab}
          onBillingPress={handleBillingPress}
          styles={styles}
          theme={theme}
        />
      )}

      {/* Main Tab Content */}
      {needsProperty ? (
        <PropertyRequiredBanner
          title="Select Property for Staff & Permissions"
          description="Manage property team members, manager roles, custom access permissions, and join codes by selecting a property below."
          icon="admin-panel-settings"
          properties={settings.properties}
          selectedPropertyId={settings.propertyId}
          onClose={() => setPickerDismissed(true)}
        />
      ) : (
        <SettingsTabContent
          activeTab={settings.activeTab}
          invites={settings.invites}
          loading={settings.loading}
          mode={mode}
          members={settings.members}
          canModifyMember={settings.canModifyMember}
          handleOpenEditPermissions={settings.handleOpenEditPermissions}
          handleOpenEditDetails={settings.handleOpenEditDetails}
          handleToggleMemberActive={settings.handleToggleMemberActive}
          handleRemoveMember={settings.handleRemoveMember}
          setMode={setMode}
          showToast={() => {}}
          styles={styles}
          theme={theme}
        />
      )}

      {/* Modals */}
      <PermissionsMatrixModal
        editingPermissions={settings.editingPermissions}
        savingPermissions={settings.savingPermissions}
        selectedMember={settings.selectedMember}
        canEditPermissions={settings.canDelegatePermission('')}
        handleSavePermissions={settings.handleSavePermissions}
        setEditingPermissions={settings.setEditingPermissions}
        setSelectedMember={settings.setSelectedMember}
        styles={styles}
        theme={theme}
      />

      <EditMemberDetailsModal
        editDetailsMember={settings.editDetailsMember}
        editMemberTitle={settings.editMemberTitle}
        editMemberAccessType={settings.editMemberAccessType}
        savingMemberDetails={settings.savingMemberDetails}
        handleSaveMemberDetails={settings.handleSaveMemberDetails}
        setEditDetailsMember={settings.setEditDetailsMember}
        setEditMemberTitle={settings.setEditMemberTitle}
        setEditMemberAccessType={settings.setEditMemberAccessType}
        styles={styles}
        theme={theme}
      />

      <GenerateInviteCodeModal
        generatingInvite={settings.generatingInvite}
        inviteTitle={settings.inviteTitle}
        inviteAccessType={settings.inviteAccessType}
        invitePerms={settings.invitePerms}
        inviteMaxUses={settings.inviteMaxUses}
        inviteModalVisible={settings.inviteModalVisible}
        handleGenerateInvite={settings.handleGenerateInvite}
        setInvitePerms={settings.setInvitePerms}
        setInviteTitle={settings.setInviteTitle}
        setInviteAccessType={settings.setInviteAccessType}
        setInviteMaxUses={settings.setInviteMaxUses}
        setInviteModalVisible={settings.setInviteModalVisible}
        styles={styles}
        theme={theme}
      />
    </PageShell>
  );
}
