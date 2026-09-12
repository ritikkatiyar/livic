import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/src/theme/ThemeContext';
import {
  OwnerModule,
  MediaAssetDTO,
  getMediaAssets,
  deleteMediaAsset,
  uploadAndConfirmMedia,
} from '@/src/features/storage/api/media.api';

export interface StagedMediaItem {
  id: string;
  uri: string;
  file?: any;
  name?: string;
  type?: string;
}

export interface MediaUploadGridProps {
  ownerModule: OwnerModule;
  referenceId?: string; // If provided, fetches and deletes/uploads directly
  userToken: string;
  stagedFiles?: StagedMediaItem[];
  onStagedFilesChange?: (files: StagedMediaItem[]) => void;
  maxFiles?: number;
  label?: string;
  helperText?: string;
  caption?: string;
  filterCaption?: string;
  onUploadSuccess?: (asset: MediaAssetDTO) => void;
  onDeleteSuccess?: (assetId: string) => void;
}

export function MediaUploadGrid({
  ownerModule,
  referenceId,
  userToken,
  stagedFiles = [],
  onStagedFilesChange,
  maxFiles = 10,
  label = 'Property Photos',
  helperText = 'Upload high-resolution exterior, lobby, or room photos.',
  caption,
  filterCaption,
  onUploadSuccess,
  onDeleteSuccess,
}: MediaUploadGridProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [remoteAssets, setRemoteAssets] = useState<MediaAssetDTO[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  // Fetch existing assets if referenceId is available
  const fetchAssets = useCallback(async () => {
    if (!referenceId || !userToken) return;
    setLoadingAssets(true);
    try {
      const data = await getMediaAssets(ownerModule, referenceId, userToken);
      if (filterCaption) {
        setRemoteAssets((data || []).filter((a) => a.caption === filterCaption));
      } else {
        setRemoteAssets(data || []);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingAssets(false);
    }
  }, [ownerModule, referenceId, userToken, filterCaption]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const processSelectedAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (referenceId) {
      setUploading(true);
      for (const asset of assets) {
        try {
          const uploaded = await uploadAndConfirmMedia(
            asset,
            {
              ownerModule,
              referenceId,
              fileType: 'IMAGE',
              caption: caption || filterCaption,
            },
            userToken
          );
          setRemoteAssets((prev) => [...prev, uploaded]);
          onUploadSuccess?.(uploaded);
        } catch (err: any) {
          Alert.alert('Upload Error', err?.message || 'Failed to upload photo.');
        }
      }
      setUploading(false);
    } else {
      const newStaged: StagedMediaItem[] = assets.map((asset) => ({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        uri: asset.uri,
        file: (asset as any).file,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      }));
      onStagedFilesChange?.([...stagedFiles, ...newStaged]);
    }
  };

  const handleTakePhoto = async () => {
    setPickerModalVisible(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow access to your camera to take photos.'
        );
        return;
      }

      const totalCurrent = remoteAssets.length + stagedFiles.length;
      if (totalCurrent >= maxFiles) {
        Alert.alert('Limit Reached', `You can upload up to ${maxFiles} photos.`);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;
      await processSelectedAssets(result.assets);
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Failed to capture photo with camera.');
    }
  };

  const handlePickFromLibrary = async () => {
    setPickerModalVisible(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to select photos.'
        );
        return;
      }

      const totalCurrent = remoteAssets.length + stagedFiles.length;
      const remainingLimit = Math.max(0, maxFiles - totalCurrent);
      if (remainingLimit <= 0) {
        Alert.alert('Limit Reached', `You can upload up to ${maxFiles} photos.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingLimit,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;
      await processSelectedAssets(result.assets);
    } catch (err: any) {
      Alert.alert('Image Picker Error', err?.message || 'Failed to select photos.');
    }
  };

  const handleDeleteRemote = async (asset: MediaAssetDTO) => {
    try {
      setDeletingId(asset.id);
      await deleteMediaAsset(asset.id, userToken);
      setRemoteAssets((prev) => prev.filter((a) => a.id !== asset.id));
      onDeleteSuccess?.(asset.id);
    } catch (err: any) {
      Alert.alert('Delete Error', err?.message || 'Failed to delete photo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveStaged = (id: string) => {
    onStagedFilesChange?.(stagedFiles.filter((item) => item.id !== id));
  };

  const totalCount = remoteAssets.length + stagedFiles.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        </View>
        <Text style={styles.counterText}>
          {totalCount} / {maxFiles}
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Remote assets */}
        {remoteAssets.map((asset) => {
          const isDeleting = deletingId === asset.id;
          return (
            <View key={asset.id} style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: asset.url }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleDeleteRemote(asset)}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Delete photo"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialIcons name="close" size={14} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Staged pending assets */}
        {stagedFiles.map((item) => (
          <View key={item.id} style={styles.thumbnailWrapper}>
            <Image
              source={{ uri: item.uri }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.stagedBadge}>
              <Text style={styles.stagedBadgeText}>Pending</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => handleRemoveStaged(item.id)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <MaterialIcons name="close" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add photo tile */}
        {totalCount < maxFiles && (
          <TouchableOpacity
            style={styles.addTile}
            activeOpacity={0.7}
            onPress={() => setPickerModalVisible(true)}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            {uploading ? (
              <ActivityIndicator size="small" color={theme.Colors.primary} />
            ) : (
              <>
                <View style={styles.addIconCircle}>
                  <MaterialIcons name="add-a-photo" size={22} color={theme.Colors.primary} />
                </View>
                <Text style={styles.addTileText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loadingAssets && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading existing photos...</Text>
        </View>
      )}

      {/* Contextual Camera vs Gallery Upload Sheet */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setPickerModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload Photo</Text>
            <Text style={styles.modalSubtitle}>Take a live photo or choose from your device library</Text>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalOptionButton}
                activeOpacity={0.75}
                onPress={handleTakePhoto}
              >
                <View style={[styles.modalOptionIconCircle, { backgroundColor: `${theme.Colors.primary}18` }]}>
                  <MaterialIcons name="photo-camera" size={22} color={theme.Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionLabel}>Take Photo</Text>
                  <Text style={styles.modalOptionDesc}>Use device camera directly</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOptionButton}
                activeOpacity={0.75}
                onPress={handlePickFromLibrary}
              >
                <View style={[styles.modalOptionIconCircle, { backgroundColor: `${theme.Colors.secondary}18` }]}>
                  <MaterialIcons name="photo-library" size={22} color={theme.Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionLabel}>Choose from Library</Text>
                  <Text style={styles.modalOptionDesc}>Pick from device gallery</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              activeOpacity={0.7}
              onPress={() => setPickerModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginVertical: theme.Spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.Spacing.sm,
      gap: theme.Spacing.sm,
    },
    label: {
      fontSize: theme.Typography.titleSmall?.fontSize || 14,
      fontWeight: '600',
      color: theme.Colors.onSurface,
      letterSpacing: 0.2,
    },
    helperText: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    counterText: {
      fontSize: theme.Typography.labelSmall?.fontSize || 11,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
      backgroundColor: theme.Colors.surfaceContainerLow,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.Rounded.full,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: theme.Spacing.xs,
    },
    thumbnailWrapper: {
      width: 96,
      height: 96,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    deleteButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    stagedBadge: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      backgroundColor: theme.Colors.secondaryContainer,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    stagedBadgeText: {
      fontSize: 9,
      fontWeight: '600',
      color: theme.Colors.onSecondaryContainer,
    },
    addTile: {
      width: 96,
      height: 96,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.Colors.outlineVariant,
      backgroundColor: theme.Colors.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    addIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.Colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addTileText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.Colors.primary,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: theme.Spacing.sm,
    },
    loadingText: {
      fontSize: 12,
      color: theme.Colors.onSurfaceVariant,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,15,25,0.4)',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.Colors.surfaceContainerLowest,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      shadowColor: theme.Colors.shadowColor || '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontSize: theme.Typography.titleMedium?.fontSize || 16,
      fontWeight: '700',
      color: theme.Colors.onSurface,
      letterSpacing: 0.2,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: theme.Typography.bodySmall?.fontSize || 12,
      color: theme.Colors.onSurfaceVariant,
      marginBottom: 16,
    },
    modalButtonsContainer: {
      gap: 10,
      marginBottom: 14,
    },
    modalOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.Colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.Colors.outlineVariant,
      gap: 12,
      minHeight: 44,
    },
    modalOptionIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOptionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.Colors.onSurface,
    },
    modalOptionDesc: {
      fontSize: 11,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    modalCancelButton: {
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      minHeight: 44,
    },
    modalCancelText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
    },
  });
