import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SkeletonCardGrid } from '@/src/components/common/feedback/Skeleton';

import { ActiveLeaseSummary, getMyContext } from '@/src/features/auth/api/me.api';
import { getAnnouncements, markAnnouncementRead, Announcement } from '@/src/features/announcements/api/announcement.api';
import { useResponsive } from '@/src/hooks/useResponsive';
import { Theme } from '@/src/theme/Theme';
import { useAppTheme } from '@/src/theme/ThemeContext';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

interface TenantHomeScreenProps {
  token: string;
  onLogout: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

export default function TenantHomeScreen({ token, onLogout }: TenantHomeScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const [lease, setLease] = useState<ActiveLeaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);
  const router = useRouter();

  const loadAnnouncements = () => {
    getAnnouncements(token)
      .then((data: Announcement[]) => setAnnouncements(data))
      .catch((err: any) => console.error('[Announcements]', err));
  };

  useEffect(() => {
    let isMounted = true;
    getMyContext(token)
      .then((context) => {
        if (isMounted) setLease(context.activeLeases[0] || null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [token]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAnnouncementRead(token, id).then(() => {
      setAnnouncements((prev: Announcement[]) => prev.map(ann => ann.id === id ? { ...ann, read: true } : ann));
      if (selectedNotice?.id === id) setSelectedNotice((prev: Announcement | null) => prev ? { ...prev, read: true } : null);
    });
  };

  const criticalUnread = announcements.filter(a => a.severity === 'CRITICAL' && !a.read);

  const activePropertyName = lease?.propertyName || "Assigned Property";
  const activeUnitNumber = lease?.unitNumber ? `Unit ${lease.unitNumber}` : "Active Lease";
  const activeRent = lease?.rentAmount ? `₹${lease.rentAmount.toLocaleString()}` : "Contact Manager";
  const activeDueDate = (lease as any)?.dueDate || (lease as any)?.nextDueDate || "1st of month";
  const activeStatus = lease?.status || "ACTIVE";

  return (
    <PageShell
      scrollable={!loading}
      header={isDesktop ? <DesktopNavBar title="Resident Dashboard" activeTab="Home" /> : null}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >

      {loading ? (
        <View style={{ paddingVertical: theme.Spacing.xl, paddingHorizontal: theme.Spacing.md }}>
          <SkeletonCardGrid count={2} />
        </View>
      ) : (
        <>
            {/* Greeting Header */}
            <View style={styles.greetingHeader}>
              <View>
                {!isDesktop && <Text style={styles.kicker}>TENANT HUB</Text>}
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.greetingSub}>Welcome back to your resident workspace</Text>
              </View>
            </View>

            {/* Critical Unread Announcement Alerts */}
            {criticalUnread.map((ann) => (
              <View key={ann.id} style={styles.criticalBanner}>
                <View style={styles.criticalBannerLeft}>
                  <MaterialIcons name="error" size={22} color="#ffffff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.criticalTitle}>{ann.title}</Text>
                    <Text style={styles.criticalText} numberOfLines={2}>{ann.content}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.criticalDismissBtn} onPress={() => handleMarkAsRead(ann.id)}>
                  <Text style={styles.criticalDismissText}>Acknowledge</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Active Property Glass Card */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="apartment" size={30} color={theme.Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyName}>{activePropertyName}</Text>
                  <Text style={styles.unitInfo}>{activeUnitNumber} • Active Lease</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{activeStatus}</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Monthly Rent</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{activeRent}</Text>
                    <Text style={styles.statSubLabel}>/month</Text>
                  </View>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Next Due Date</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{activeDueDate}</Text>
                </View>
              </View>

              {/* Primary Pay Action */}
              <TouchableOpacity
                style={styles.primaryPayBtn}
                onPress={() => router.push('/tenant-payments')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="payments" size={20} color="#ffffff" />
                <Text style={styles.primaryPayBtnText}>Pay Rent • {activeRent}</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {/* Quick Actions Bar */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/tenant-payments')} activeOpacity={0.8} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                  <MaterialIcons name="history" size={16} color={theme.Colors.primary} />
                  <Text style={styles.quickActionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/tenant-property')} activeOpacity={0.8} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                  <MaterialIcons name="description" size={16} color={theme.Colors.primary} />
                  <Text style={styles.quickActionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>My Lease</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/tenant-maintenance')} activeOpacity={0.8} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                  <MaterialIcons name="build" size={16} color={theme.Colors.primary} />
                  <Text style={styles.quickActionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Maintenance</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Maintenance Action Strip */}
            <TouchableOpacity onPress={() => router.push('/tenant-maintenance')} activeOpacity={0.88}>
              <View
                style={[styles.actionStrip, { backgroundColor: theme.Colors.primary }]}
              >
                <View style={styles.actionStripLeft}>
                  <View style={styles.actionStripIcon}>
                    <MaterialIcons name="electric-bolt" size={24} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.actionStripTitle}>Log Maintenance Request</Text>
                    <Text style={styles.actionStripSub}>Report plumbing, electrical, or structural issues instantly</Text>
                  </View>
                </View>
                <View style={styles.actionStripBtn}>
                  <Text style={[styles.actionStripBtnText, { color: theme.Colors.primary }]}>Log Issue</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Notice Board Section */}
            <View style={styles.glassCard}>
              <View style={styles.noticeHeaderRow}>
                <View>
                  <Text style={styles.noticeSectionTitle}>Landlord Notice Board</Text>
                  <Text style={styles.noticeSectionSub}>Official updates and building broadcasts</Text>
                </View>
                <MaterialIcons name="campaign" size={24} color={theme.Colors.primary} />
              </View>

              {announcements.length === 0 ? (
                <View style={styles.emptyNoticeBox}>
                  <View style={styles.emptyNoticeIconWrapper}>
                    <MaterialIcons name="notifications-none" size={32} color={theme.Colors.primary} />
                  </View>
                  <Text style={styles.emptyNoticeText}>No recent notices from your landlord</Text>
                  <Text style={styles.emptyNoticeSub}>All community updates will appear here.</Text>
                </View>
              ) : (
                announcements.map((ann) => (
                  <TouchableOpacity 
                    key={ann.id} 
                    style={[styles.noticeItem, ann.read ? styles.noticeItemRead : styles.noticeItemUnread]}
                    onPress={() => setSelectedNotice(ann)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.noticeItemHeader}>
                      <View style={[styles.noticeBadge, { backgroundColor: getCategoryColor(ann.category, theme) }]}>
                        <Text style={styles.noticeBadgeText}>{ann.category}</Text>
                      </View>
                      {!ann.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.noticeTitle}>{ann.title}</Text>
                    <Text style={styles.noticeSummary} numberOfLines={2}>{ann.content}</Text>
                    <Text style={styles.noticeDate}>
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
        </>
      )}

        {/* Notice Modal Detail Viewer */}
        {selectedNotice && (
          <Modal transparent visible={true} animationType="fade" onRequestClose={() => setSelectedNotice(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={[styles.noticeBadge, { backgroundColor: getCategoryColor(selectedNotice.category, theme) }]}>
                    <Text style={styles.noticeBadgeText}>{selectedNotice.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { handleMarkAsRead(selectedNotice.id); setSelectedNotice(null); }}>
                    <MaterialIcons name="close" size={24} color={theme.Colors.onBackground} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedNotice.title}</Text>
                <Text style={styles.modalMeta}>Posted by {selectedNotice.creatorName || 'Property Management'} • {new Date(selectedNotice.createdAt).toLocaleDateString()}</Text>
                <ScrollView style={{ maxHeight: 260 }}>
                  <Text style={styles.modalBody}>{selectedNotice.content}</Text>
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => { handleMarkAsRead(selectedNotice.id); setSelectedNotice(null); }}
                >
                  <Text style={styles.modalCloseBtnText}>Acknowledge & Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
    </PageShell>
  );
}

function getCategoryColor(cat: string, theme: any) {
  switch (cat) {
    case 'EMERGENCY': return '#ba1a1a';
    case 'MAINTENANCE': return '#e28743';
    case 'BILLING': return theme.Colors.primary;
    case 'EVENT': return '#7b2cbf';
    default: return theme.Colors.outline;
  }
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  scrollContentDesktop: { paddingTop: theme.Spacing.xl, paddingHorizontal: theme.Spacing.xl },
  mobileScrollPadding: { paddingTop: theme.Spacing.xl * 2.2 },
  greetingHeader: { marginBottom: theme.Spacing.xs },
  kicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: theme.Colors.primary, letterSpacing: 0.8, marginBottom: theme.Spacing.xs },
  greetingText: { ...theme.Typography.headlineMd, color: theme.Colors.onBackground },
  greetingSub: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },

  glassCard: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden'
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: theme.Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  propertyName: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground },
  unitInfo: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { backgroundColor: theme.Colors.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { color: theme.Colors.primary, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', letterSpacing: 0.4 },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 18, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '47%', backgroundColor: theme.Colors.surfaceContainerLow, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  statLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '500', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.2, marginBottom: 4 },
  statSubLabel: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, marginLeft: 2 },
  statValue: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600', color: theme.Colors.primary, letterSpacing: -0.3 },

  primaryPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.primary,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryPayBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  quickActionsRow: { flexDirection: 'row', gap: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.Colors.outlineVariant, flexWrap: 'wrap' },
  quickActionBtn: { flex: 1, minWidth: 85, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.Colors.surfaceContainerLow, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.Colors.outlineVariant },
  quickActionText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', color: theme.Colors.primary },

  actionStrip: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 3 },
  actionStripLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  actionStripIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', alignItems: 'center', justifyContent: 'center' },
  actionStripTitle: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600', color: '#ffffff' },
  actionStripSub: { fontSize: theme.Typography.bodyMedium.fontSize, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  actionStripBtn: { backgroundColor: '#ffffff', paddingHorizontal: theme.Spacing.md, paddingVertical: 10, borderRadius: 14 },
  actionStripBtnText: { color: theme.Colors.primary, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },

  noticeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.Spacing.md },
  noticeSectionTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground },
  noticeSectionSub: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  emptyNoticeBox: { alignItems: 'center', paddingVertical: theme.Spacing.xl, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.Colors.outlineVariant, borderStyle: 'dashed', backgroundColor: theme.Colors.surfaceContainerLow },
  emptyNoticeIconWrapper: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyNoticeText: { fontSize: theme.Typography.bodyLarge.fontSize, color: theme.Colors.onBackground, fontWeight: '600' },
  emptyNoticeSub: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.xs },

  noticeItem: { padding: theme.Spacing.md, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  noticeItemRead: { backgroundColor: theme.Colors.surfaceContainerLow, borderColor: theme.Colors.outlineVariant },
  noticeItemUnread: { backgroundColor: theme.Colors.surfaceContainerLowest, borderColor: theme.Colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  noticeItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.Spacing.sm },
  noticeBadge: { paddingHorizontal: theme.Spacing.sm, paddingVertical: theme.Spacing.xs, borderRadius: 6 },
  noticeBadgeText: { color: '#ffffff', fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', letterSpacing: 0.3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.Colors.primary },
  noticeTitle: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground, marginBottom: theme.Spacing.xs },
  noticeSummary: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: 20 },
  noticeDate: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.outline, marginTop: theme.Spacing.sm, textAlign: 'right' },

  criticalBanner: { backgroundColor: theme.Colors.error, borderRadius: 20, padding: theme.Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  criticalBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  criticalTitle: { color: '#ffffff', fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600' },
  criticalText: { color: 'rgba(255, 255, 255, 0.95)', fontSize: theme.Typography.bodyMedium.fontSize, marginTop: 2 },
  criticalDismissBtn: { backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 14, paddingVertical: theme.Spacing.sm, borderRadius: 10 },
  criticalDismissText: { color: '#ffffff', fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.Colors.surfaceContainerLowest, borderRadius: 24, padding: theme.Spacing.lg, borderWidth: 1, borderColor: theme.Colors.outlineVariant, shadowColor: 'black', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.Spacing.md },
  modalTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onBackground, marginBottom: 6 },
  modalMeta: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginBottom: theme.Spacing.md },
  modalBody: { fontSize: theme.Typography.bodyLarge.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: 24 },
  modalCloseBtn: { backgroundColor: theme.Colors.primary, marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalCloseBtnText: { color: theme.Colors.onPrimary, fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '600' }
});


