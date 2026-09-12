import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import { useResponsive } from '@/src/hooks/useResponsive';
import {
  IssueResponse,
  getIssueDetails,
  addCommentToIssue,
  updateIssueStatus,
  escalateIssue
} from '../api/issues.api';
import { createStyles } from './IssueDetailModal.styles';

interface IssueDetailModalProps {
  visible: boolean;
  issueId: string | null;
  token: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function IssueDetailModal({
  visible,
  issueId,
  token,
  onClose,
  onUpdate
}: IssueDetailModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Escalation prompt
  const [showEscalatePrompt, setShowEscalatePrompt] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  // Status transition loading
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const fetchIssueDetails = async () => {
    if (!issueId || !token) return;
    try {
      setIsLoading(true);
      const data = await getIssueDetails(issueId, token);
      setIssue(data);
    } catch (err) {
      console.error('Error fetching issue details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible && issueId) {
      fetchIssueDetails();
      // Reset forms
      setCommentText('');
      setEscalateReason('');
      setShowEscalatePrompt(false);
    } else {
      setIssue(null);
    }
  }, [visible, issueId]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !issueId || !token) return;
    try {
      setIsSubmittingComment(true);
      const updated = await addCommentToIssue(issueId, commentText.trim(), token);
      setIssue(updated);
      setCommentText('');
      onUpdate();
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!issueId || !token) return;
    try {
      setIsChangingStatus(true);
      const comment = `Landlord updated status to ${newStatus}`;
      const updated = await updateIssueStatus(issueId, newStatus, token, comment);
      setIssue(updated);
      onUpdate();
    } catch (err) {
      console.error('Error changing status:', err);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim() || !issueId || !token) return;
    try {
      setIsEscalating(true);
      const updated = await escalateIssue(issueId, escalateReason.trim(), token);
      setIssue(updated);
      setEscalateReason('');
      setShowEscalatePrompt(false);
      onUpdate();
    } catch (err) {
      console.error('Error escalating issue:', err);
    } finally {
      setIsEscalating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#fee2e2', text: '#ef4444' };
      case 'HIGH':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'STANDARD':
        return { bg: '#e0f2fe', text: '#0284c7' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const getStatusColor = (status: string, escStatus?: string) => {
    if (escStatus === 'ESCALATED') {
      return { bg: '#fee2e2', text: '#ef4444', label: 'ESCALATED' };
    }
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: '#d1fae5', text: theme.Colors.primary, label: status };
      case 'IN_PROGRESS':
        return { bg: '#fef3c7', text: '#d97706', label: 'IN PROGRESS' };
      default:
        return { bg: '#e0f2fe', text: '#0284c7', label: 'OPEN' };
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATION':
        return <MaterialIcons name="add-circle" size={18} color={theme.Colors.primary} />;
      case 'STATUS_CHANGE':
        return <MaterialIcons name="swap-horiz" size={18} color="#d97706" />;
      case 'ESCALATION':
        return <MaterialIcons name="report-problem" size={18} color={theme.Colors.error} />;
      default:
        return <MaterialIcons name="comment" size={18} color={theme.Colors.onSurfaceVariant} />;
    }
  };

  const formatTimelineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.Colors.modalOverlayBackground || theme.Colors.scrim || 'rgba(0,0,0,0.5)' }]} />
        
        <View style={[styles.modalContent, isDesktop && styles.desktopModal]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.ticketNum}>{issue?.ticketNumber || 'Loading...'}</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {issue?.title || 'Ticket Details'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {isLoading && !issue ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Badges row */}
              {issue && (
                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getStatusColor(issue.status, issue.escalationStatus).bg }
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: getStatusColor(issue.status, issue.escalationStatus).text }
                      ]}
                    >
                      {getStatusColor(issue.status, issue.escalationStatus).label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getPriorityColor(issue.priority).bg }
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: getPriorityColor(issue.priority).text }]}>
                      {issue.priority}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.55)' }]}>
                    <Text style={[styles.badgeText, { color: theme.Colors.primary }]}>{issue.category}</Text>
                  </View>
                </View>
              )}

              {/* Description card */}
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{issue?.description}</Text>
                
                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Assigned Agent</Text>
                    <Text style={styles.metaValue}>{issue?.assignedContactName || 'N/A'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Date Reported</Text>
                    <Text style={styles.metaValue}>
                      {issue?.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Actions */}
              {issue && issue.status !== 'CLOSED' && (
                <View style={styles.actionsContainer}>
                  <Text style={styles.sectionTitle}>Manage Ticket</Text>
                  
                  {isChangingStatus ? (
                    <ActivityIndicator size="small" color={theme.Colors.primary} />
                  ) : (
                    <View style={styles.actionButtonsRow}>
                      {issue.status === 'OPEN' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnInProg]}
                          onPress={() => handleStatusChange('IN_PROGRESS')}
                        >
                          <Text style={styles.actionBtnText}>Accept Ticket</Text>
                        </TouchableOpacity>
                      )}
                      {issue.status !== 'RESOLVED' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnResolve]}
                          onPress={() => handleStatusChange('RESOLVED')}
                        >
                          <Text style={styles.actionBtnText}>Resolve Ticket</Text>
                        </TouchableOpacity>
                      )}
                      {issue.escalationStatus !== 'ESCALATED' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnEscalate]}
                          onPress={() => setShowEscalatePrompt(true)}
                        >
                          <Text style={styles.actionBtnText}>Escalate</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Escalate reason entry */}
                  {showEscalatePrompt && (
                    <View style={styles.escalateInputContainer}>
                      <TextInput
                        style={styles.escalateInput}
                        placeholder="Reason for escalation..."
                        placeholderTextColor={theme.Colors.onSurfaceVariant}
                        value={escalateReason}
                        onChangeText={setEscalateReason}
                      />
                      <View style={styles.escalateActionButtons}>
                        <TouchableOpacity
                          onPress={() => setShowEscalatePrompt(false)}
                          style={styles.cancelBtn}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleEscalate}
                          disabled={isEscalating}
                          style={styles.confirmEscalateBtn}
                        >
                          {isEscalating ? (
                            <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                          ) : (
                            <Text style={styles.confirmEscalateText}>Confirm</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Timeline list */}
              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>Activity Log</Text>
                {issue?.timeline && issue.timeline.length > 0 ? (
                  issue.timeline.map((item, idx) => (
                    <View key={item.id || idx} style={styles.timelineItem}>
                      <View style={styles.timelineLineWrapper}>
                        <View style={styles.timelineDot}>{getTimelineIcon(item.entryType)}</View>
                        {idx < issue.timeline.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.authorName}>{item.authorName || 'System'}</Text>
                          <Text style={styles.timelineDate}>{formatTimelineDate(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.timelineBody}>{item.content}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyTimelineText}>No activities logged yet.</Text>
                )}
              </View>
            </ScrollView>
          )}

          {/* Comment box */}
          {issue && (
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a reply..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={handlePostComment}
                disabled={isSubmittingComment || !commentText.trim()}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Ionicons name="send" size={18} color={theme.Colors.surfaceContainerLowest} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
