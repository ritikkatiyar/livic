import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type RentRollHeaderProps = {
  hasGenerated: boolean;
  isGenerating: boolean;
  checklist: any;
  handleGenerate: () => void;
  pendingCount: number;
  isPublishing: boolean;
  handlePublish: () => void;
  isUnpublishing: boolean;
  handleUnpublish: () => void;
  router: any;
  insets: any;
  isDark: boolean;
  theme: any;
  styles: any;
};

export function RentRollHeader({
  hasGenerated,
  isGenerating,
  checklist,
  handleGenerate,
  pendingCount,
  isPublishing,
  handlePublish,
  isUnpublishing,
  handleUnpublish,
  router,
  insets,
  isDark,
  theme,
  styles,
}: RentRollHeaderProps) {
  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 56 + insets.top, backgroundColor: theme.Colors.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: theme.Colors.outline }]}>
      <View style={styles.headerContent}>
        <View style={styles.titleWrapper}>
          <Text style={styles.compactTitleText}>Rent Roll</Text>
        </View>
        
        {!hasGenerated ? (
          <TouchableOpacity 
            style={[styles.headerGradientTouch, (isGenerating || !!(checklist && !checklist.isReady)) && { opacity: 0.5 }]}
            onPress={handleGenerate}
            disabled={isGenerating || !!(checklist && !checklist.isReady)}
            activeOpacity={0.8}
          >
            <View
              style={[styles.headerGradientInner, { backgroundColor: theme.Colors.primary, borderRadius: 8 }]}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <MaterialIcons name="flash-on" size={15} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.headerGradientText}>GENERATE</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        ) : pendingCount > 0 ? (
          <TouchableOpacity 
            style={[styles.headerGradientTouch, isPublishing && { opacity: 0.5 }]}
            onPress={handlePublish}
            disabled={isPublishing}
            activeOpacity={0.8}
          >
            <View
              style={[styles.headerGradientInner, { backgroundColor: theme.Colors.primary, borderRadius: 8 }]}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <MaterialIcons name="send" size={14} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.headerGradientText}>PUBLISH</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.headerGradientTouch, isUnpublishing && { opacity: 0.5 }]}
            onPress={handleUnpublish}
            disabled={isUnpublishing}
            activeOpacity={0.8}
          >
            <View
              style={[styles.headerGradientInner, { backgroundColor: theme.Colors.error, borderRadius: 8 }]}
            >
              {isUnpublishing ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <Text style={styles.headerGradientText}>UNPUBLISH</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
