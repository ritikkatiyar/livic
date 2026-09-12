import React from 'react';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { MembershipResponse } from '@/src/features/properties/api/membership.api';
import { JoinCodeResponse } from '@/src/features/properties/api/rolePermission.api';
import { ActiveTab } from '@/src/features/settings/hooks/useSettings';

type ThemeLike = any;
type StylesLike = Record<string, any>;

type SettingsHeroProps = {
  activeTab: ActiveTab;
  isOwner: boolean;
  onGenerateInvitePress: () => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function SettingsHero({
  activeTab,
  isOwner,
  onGenerateInvitePress,
  styles,
  theme,
}: SettingsHeroProps) {
  return (
    <View style={styles.heroSection}>
      <View>
        <Text style={styles.heroTitle}>Team & System Hub</Text>
        <Text style={styles.heroSubtitle}>
          Configure member access permissions, staff onboarding keys, automated invoices & preferences
        </Text>
      </View>

      {isOwner && (
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={onGenerateInvitePress}
            activeOpacity={0.8}
          >
            <View
              style={styles.actionPillGradient}
            >
              <MaterialIcons
                name="vpn-key"
                size={18}
                color={theme.Colors.surfaceContainerLowest}
              />
              <Text style={styles.actionPillText}>GENERATE INVITE</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type SettingsHubGridProps = {
  activeTab: ActiveTab;
  membersCount: number;
  invitesCount: number;
  onTabChange: (tab: ActiveTab) => void;
  onBillingPress: () => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function SettingsHubGrid({
  activeTab,
  membersCount,
  invitesCount,
  onTabChange,
  onBillingPress,
  styles,
  theme,
}: SettingsHubGridProps) {
  return (
    <View style={styles.hubGrid}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onTabChange('members')} style={styles.hubCardTouch}>
        <GlassCard style={[styles.hubCard, activeTab === 'members' && styles.hubCardActive]}>
          <View style={styles.hubCardHeader}>
            <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(0, 104, 117, 0.12)' }]}>
              <MaterialIcons name="people" size={24} color={theme.Colors.primary} />
            </View>
            <View style={styles.hubBadge}>
              <Text style={[styles.hubBadgeText, { color: theme.Colors.primary }]}>{membersCount} Members</Text>
            </View>
          </View>
          <Text style={styles.hubCardTitle}>Staff & Permissions</Text>
          <Text style={styles.hubCardDesc}>Member titles, access tiers & permission matrix.</Text>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={() => onTabChange('invites')} style={styles.hubCardTouch}>
        <GlassCard style={[styles.hubCard, activeTab === 'invites' && styles.hubCardActive]}>
          <View style={styles.hubCardHeader}>
            <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(0, 104, 117, 0.12)' }]}>
              <MaterialIcons name="vpn-key" size={24} color={theme.Colors.primary} />
            </View>
            <View style={styles.hubBadge}>
              <Text style={[styles.hubBadgeText, { color: theme.Colors.primary }]}>{invitesCount} Codes</Text>
            </View>
          </View>
          <Text style={styles.hubCardTitle}>Staff Join Keys</Text>
          <Text style={styles.hubCardDesc}>Direct onboarding keys for managers & caretakers.</Text>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={() => onTabChange('preferences')} style={styles.hubCardTouch}>
        <GlassCard style={[styles.hubCard, activeTab === 'preferences' && styles.hubCardActive]}>
          <View style={styles.hubCardHeader}>
            <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(91, 94, 207, 0.12)' }]}>
              <MaterialIcons name="tune" size={24} color={theme.Colors.secondary} />
            </View>
            <View style={styles.hubBadge}>
              <Text style={[styles.hubBadgeText, { color: theme.Colors.secondary }]}>Preferences</Text>
            </View>
          </View>
          <Text style={styles.hubCardTitle}>System Preferences</Text>
          <Text style={styles.hubCardDesc}>App appearance & interface display mode.</Text>
        </GlassCard>
      </TouchableOpacity>
    </View>
  );
}

type SettingsTabContentProps = {
  activeTab: ActiveTab;
  invites: JoinCodeResponse[];
  loading: boolean;
  mode: 'system' | 'light' | 'dark';
  members: MembershipResponse[];
  canModifyMember: (member: MembershipResponse) => boolean;
  handleOpenEditPermissions: (member: MembershipResponse) => void;
  handleOpenEditDetails?: (member: MembershipResponse) => void;
  handleToggleMemberActive: (member: MembershipResponse, value: boolean) => void;
  handleRemoveMember: (member: MembershipResponse) => void;
  setMode: (mode: 'system' | 'light' | 'dark') => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function SettingsTabContent({
  activeTab,
  invites,
  loading,
  mode,
  members,
  canModifyMember,
  handleOpenEditPermissions,
  handleOpenEditDetails,
  handleToggleMemberActive,
  handleRemoveMember,
  setMode,
  showToast,
  styles,
  theme,
}: SettingsTabContentProps) {
  const { user } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
        <Text style={styles.loadingSub}>Loading system preferences...</Text>
      </View>
    );
  }

  if (activeTab === 'members') {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Property Team Members</Text>
            <Text style={styles.sectionSub}>Configure access level, permissions, and member status</Text>
          </View>
        </View>

        <View style={styles.rolesGrid}>
          {members.map((item) => {
            const isFullAccess = item.accessType === 'FULL_ACCESS';
            const canEdit = canModifyMember(item);

            return (
              <GlassCard key={item.id} style={styles.roleCard}>
                <View style={styles.roleCardTop}>
                  <View style={styles.roleTitleGroup}>
                    <View style={styles.roleNameRow}>
                      <Text style={styles.roleName} numberOfLines={1} ellipsizeMode="tail">
                        {item.fullName || item.title}
                      </Text>
                      {canEdit && handleOpenEditDetails && (
                        <TouchableOpacity
                          onPress={() => handleOpenEditDetails(item)}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="edit" size={16} color={theme.Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.roleDesc} numberOfLines={1} ellipsizeMode="tail">
                      {item.email || item.title}
                    </Text>
                    <View style={styles.roleBadgeRow}>
                      <View style={isFullAccess ? styles.systemRolePill : styles.customRolePill}>
                        <Text
                          style={isFullAccess ? styles.systemRolePillText : styles.customRolePillText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.title} ({isFullAccess ? 'Full Access' : 'Custom Access'})
                        </Text>
                      </View>
                    </View>
                  </View>
                  {!isFullAccess && (
                    <Switch
                      value={item.isActive}
                      onValueChange={(val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleToggleMemberActive(item, val);
                      }}
                      disabled={!canEdit}
                      trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
                      thumbColor={item.isActive ? '#00d4ff' : '#9ca3af'}
                    />
                  )}
                </View>

                <View style={styles.roleCardBottom}>
                  <View style={styles.permCountTag}>
                    <MaterialIcons name="shield" size={14} color={theme.Colors.primary} />
                    <Text style={styles.permCountText}>
                      {isFullAccess ? 'All Permissions' : `${item.permissionCodes?.length || 0} Permissions`}
                    </Text>
                  </View>

                  {!isFullAccess && (
                    <TouchableOpacity
                      style={[styles.configureBtn, !canEdit && styles.configureBtnDisabled]}
                      disabled={!canEdit}
                      onPress={() => handleOpenEditPermissions(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.configureBtnText, !canEdit && styles.configureBtnTextDisabled]}>
                        {canEdit ? 'Configure Matrix' : 'View Only'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            );
          })}
        </View>
      </View>
    );
  }

  if (activeTab === 'invites') {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Active Staff Join Codes</Text>
            <Text style={styles.sectionSub}>Direct onboarding tokens for team members</Text>
          </View>
        </View>

        {invites.length > 0 ? (
          <View style={styles.invitesGrid}>
            {invites.map((item) => {
              const expiresDate = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never';
              return (
                <GlassCard key={item.id} style={styles.inviteCard}>
                  <View style={styles.inviteCardHeader}>
                    <View style={styles.codeCapsule}>
                      <MaterialIcons name="key" size={16} color={theme.Colors.primary} />
                      <Text style={styles.inviteCode}>{item.code}</Text>
                    </View>
                    <StatusPill status={item.isActive ? 'ACTIVE' : 'EXPIRED'} />
                  </View>

                  <View style={styles.inviteMetaRow}>
                    <View style={styles.inviteMetaCol}>
                      <Text style={styles.inviteMetaLabel}>TARGET TITLE</Text>
                      <Text style={styles.inviteMetaVal}>{item.title}</Text>
                    </View>
                    <View style={styles.inviteMetaCol}>
                      <Text style={styles.inviteMetaLabel}>ACCESS TIER</Text>
                      <Text style={styles.inviteMetaVal}>{item.accessType}</Text>
                    </View>
                    <View style={styles.inviteMetaCol}>
                      <Text style={styles.inviteMetaLabel}>USES COUNT</Text>
                      <Text style={styles.inviteMetaVal}>
                        {item.usesCount} / {item.maxUses}
                      </Text>
                    </View>
                    <View style={styles.inviteMetaCol}>
                      <Text style={styles.inviteMetaLabel}>EXPIRES</Text>
                      <Text style={styles.inviteMetaVal}>{expiresDate}</Text>
                    </View>
                  </View>

                  {item.isActive && (
                    <TouchableOpacity
                      style={styles.copyKeyBtn}
                      onPress={() => {
                        Clipboard.setString(item.code);
                        showToast('Invitation code copied to clipboard!', 'success');
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="content-copy" size={16} color={theme.Colors.primary} />
                      <Text style={styles.copyKeyBtnText}>Copy Invitation Code</Text>
                    </TouchableOpacity>
                  )}
                </GlassCard>
              );
            })}
          </View>
        ) : (
          <EmptyState
            title="No Invite Codes Active"
            description="Generate a join code to onboard managers or staff to this property."
            iconName="vpn-key"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>System Preferences</Text>
          <Text style={styles.sectionSub}>Configure app appearance and interface settings</Text>
        </View>
      </View>

      <View style={styles.prefGrid}>
        <GlassCard style={styles.prefCard}>
          <View style={styles.prefCardHeader}>
            <MaterialIcons name="palette" size={22} color={theme.Colors.primary} />
            <Text style={styles.prefCardTitle}>Appearance & Theme Mode</Text>
          </View>
          <View style={styles.prefItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefItemName}>App Theme Preference</Text>
              <Text style={styles.prefItemDesc}>Switch between Light, Dark, or System auto-detect</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {(['system', 'light', 'dark'] as const).map((themeOption) => {
              const isSelected = mode === themeOption;
              return (
                <TouchableOpacity
                  key={themeOption}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isSelected ? theme.Colors.primary : 'rgba(0, 104, 117, 0.2)',
                    backgroundColor: isSelected ? 'rgba(0, 104, 117, 0.12)' : 'transparent',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  onPress={() => setMode(themeOption)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={
                      themeOption === 'system'
                        ? 'settings-brightness'
                        : themeOption === 'dark'
                        ? 'dark-mode'
                        : 'light-mode'
                    }
                    size={18}
                    color={isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                  />
                  <Text
                    style={{
                      fontSize: theme.Typography.bodySmall.fontSize,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      color: isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant,
                    }}
                  >
                    {themeOption}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        <GlassCard style={[styles.prefCard, { marginTop: 16 }]}>
          <View style={styles.prefCardHeader}>
            <MaterialIcons name="person" size={22} color={theme.Colors.primary} />
            <Text style={styles.prefCardTitle}>Account Profile</Text>
          </View>
          <View style={styles.prefItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefItemName}>{user?.fullName || 'Active Landlord'}</Text>
              <Text style={styles.prefItemDesc}>{user?.email || 'Authenticated User'}</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}
