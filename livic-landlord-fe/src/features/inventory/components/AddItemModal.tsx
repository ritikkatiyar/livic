import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createInventoryItem, type CreateInventoryItemPayload } from '../api/inventory.api';
import { uploadAndConfirmMedia } from '@/src/features/storage/api/media.api';

interface AddItemModalProps {
  visible: boolean;
  propertyId: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'APPLIANCES', label: 'Appliances', icon: 'kitchen' },
  { id: 'FURNITURE', label: 'Furniture', icon: 'chair' },
  { id: 'HVAC', label: 'HVAC', icon: 'ac-unit' },
  { id: 'LAUNDRY', label: 'Laundry', icon: 'local-laundry-service' },
  { id: 'ELECTRONICS', label: 'Electronics', icon: 'tv' },
  { id: 'FIXTURES', label: 'Fixtures', icon: 'layers' },
  { id: 'SAFETY', label: 'Safety', icon: 'security' },
  { id: 'OTHER', label: 'Other', icon: 'inventory-2' },
];

export function AddItemModal({
  visible,
  propertyId,
  token,
  onClose,
  onSuccess,
}: AddItemModalProps) {
  const { theme, isDark } = useAppTheme();

  const CONDITIONS = React.useMemo(() => [
    { id: 'EXCELLENT', label: 'Excellent', color: theme.Colors.primary },
    { id: 'GOOD', label: 'Good', color: theme.Colors.primary },
    { id: 'FAIR', label: 'Fair', color: theme.Colors.tertiary },
    { id: 'DAMAGED', label: 'Damaged', color: theme.Colors.error },
  ], [theme]);
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('APPLIANCES');
  const [scope, setScope] = useState<'PROPERTY_SHARED' | 'UNIT_PRIVATE'>('UNIT_PRIVATE');
  const [condition, setCondition] = useState('EXCELLENT');
  const [status, setStatus] = useState('AVAILABLE');
  const [serialNumber, setSerialNumber] = useState('');
  const [replacementValue, setReplacementValue] = useState('');
  const [notes, setNotes] = useState('');
  
  // Photo states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const handlePickPhoto = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setSelectedFile(file);
          setPreviewUri(URL.createObjectURL(file));
        }
      };
      input.click();
    } else {
      Alert.alert('Upload', 'Image picking on native devices will use camera/gallery.');
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUri(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    const val = parseFloat(replacementValue.replace(/[^0-9.]/g, ''));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Required', 'Please enter a valid replacement value');
      return;
    }

    setLoading(true);
    setLoadingStep('Saving item record...');
    try {
      const payload: CreateInventoryItemPayload = {
        propertyId,
        name: name.trim(),
        category,
        scope,
        currentCondition: condition,
        status: scope === 'PROPERTY_SHARED' ? 'SHARED' : status,
        serialNumber: serialNumber.trim() || undefined,
        replacementValue: val,
        notes: notes.trim() || undefined,
      };

      const createdItem = await createInventoryItem(payload, token);

      // Upload photo to Cloudinary if attached
      if (selectedFile && createdItem?.id) {
        setLoadingStep('Uploading asset photo to Cloudinary...');
        await uploadAndConfirmMedia(
          selectedFile,
          {
            ownerModule: 'INVENTORY',
            referenceId: createdItem.id,
            fileType: 'IMAGE',
            caption: 'asset',
          },
          token
        );
      }

      Alert.alert('Success', 'Inventory item & photo registered successfully');
      setName('');
      setSerialNumber('');
      setReplacementValue('');
      setNotes('');
      setSelectedFile(null);
      setPreviewUri(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create inventory item');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalKicker}>INVENTORY</Text>
              <Text style={styles.modalTitle}>Add New Item</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Photo Upload Box */}
            <Text style={styles.label}>Asset Photo / Invoice</Text>
            {previewUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  <View style={styles.previewMeta}>
                    <MaterialIcons name="image" size={16} color={theme.Colors.surfaceContainerLowest} />
                    <Text style={styles.previewFileName} numberOfLines={1}>
                      {selectedFile?.name || 'Selected photo'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto}>
                    <MaterialIcons name="delete" size={16} color={theme.Colors.surfaceContainerLowest} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadDropzone} activeOpacity={0.8} onPress={handlePickPhoto}>
                <View style={styles.uploadIconCircle}>
                  <MaterialIcons name="cloud-upload" size={24} color={theme.Colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Click to upload asset photo</Text>
                <Text style={styles.uploadSubtitle}>PNG, JPG or WebP · Uploads directly to Cloudinary CDN</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Samsung Bespoke Refrigerator"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={14}
                      color={isSelected ? theme.Colors.primary : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Scope / Placement</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, scope === 'UNIT_PRIVATE' && styles.toggleBtnActive]}
                onPress={() => { setScope('UNIT_PRIVATE'); setStatus('AVAILABLE'); }}
              >
                <MaterialIcons name="meeting-room" size={16} color={scope === 'UNIT_PRIVATE' ? theme.Colors.primary : '#6b7280'} />
                <Text style={[styles.toggleText, scope === 'UNIT_PRIVATE' && styles.toggleTextActive]}>Private Unit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, scope === 'PROPERTY_SHARED' && styles.toggleBtnActive]}
                onPress={() => { setScope('PROPERTY_SHARED'); setStatus('SHARED'); }}
              >
                <MaterialIcons name="apartment" size={16} color={scope === 'PROPERTY_SHARED' ? theme.Colors.primary : '#6b7280'} />
                <Text style={[styles.toggleText, scope === 'PROPERTY_SHARED' && styles.toggleTextActive]}>Shared Property</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Initial Condition</Text>
            <View style={styles.chipRow}>
              {CONDITIONS.map((cond) => {
                const isSelected = condition === cond.id;
                return (
                  <TouchableOpacity
                    key={cond.id}
                    onPress={() => setCondition(cond.id)}
                    style={[
                      styles.chip,
                      isSelected && { borderColor: cond.color, backgroundColor: `${cond.color}15` },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: cond.color }]} />
                    <Text style={[styles.chipText, isSelected && { color: cond.color, fontWeight: '600' }]}>
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder="e.g. SAM-8231-90X"
                  placeholderTextColor={theme.Colors.onSurfaceVariant}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Replacement Value (₹) *</Text>
                <TextInput
                  value={replacementValue}
                  onChangeText={setReplacementValue}
                  placeholder="e.g. 86000"
                  placeholderTextColor={theme.Colors.onSurfaceVariant}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Warranty info, compressor details, etc."
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitBtn}>
              <View style={styles.submitBtnInner}>
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.Spacing.sm }}>
                    <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                    <Text style={styles.submitBtnText}>{loadingStep || 'Saving...'}</Text>
                  </View>
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color={theme.Colors.surfaceContainerLowest} />
                    <Text style={styles.submitBtnText}>Save Item</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: theme.Surface.card,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.lg,
    paddingTop: 20,
    paddingBottom: theme.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.outlineVariant,
  },
  modalKicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '600', color: theme.Colors.primary, letterSpacing: 1 },
  modalTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface, marginTop: 2 },
  closeBtn: { padding: theme.Spacing.sm, borderRadius: 20, backgroundColor: theme.Colors.surfaceContainer },
  modalBody: { paddingHorizontal: theme.Spacing.lg, paddingVertical: theme.Spacing.md },
  label: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '700', color: theme.Colors.onSurface, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.Spacing.sm, marginTop: theme.Spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: theme.Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  chipSelected: { borderColor: theme.Colors.primary, backgroundColor: 'rgba(0,104,117,0.08)' },
  chipText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', color: theme.Colors.onSurfaceVariant },
  chipTextSelected: { color: theme.Colors.primary, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: theme.Spacing.xs },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  toggleBtnActive: { borderColor: theme.Colors.primary, backgroundColor: 'rgba(0,104,117,0.08)' },
  toggleText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '600', color: theme.Colors.onSurfaceVariant },
  toggleTextActive: { color: theme.Colors.primary, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  twoCol: { flexDirection: 'row', gap: 12 },

  // Photo Dropzone Styles
  uploadDropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    gap: 6,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,104,117,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  uploadTitle: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface },
  uploadSubtitle: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant },

  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 140,
    position: 'relative',
    backgroundColor: 'black',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: theme.Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  previewFileName: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '700' },
  removePhotoBtn: { padding: theme.Spacing.xs, backgroundColor: theme.Colors.error, borderRadius: 8 },

  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outlineVariant,
    backgroundColor: theme.Colors.surfaceContainerLow,
  },
  cancelBtn: { paddingHorizontal: theme.Spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant },
  submitBtn: { borderRadius: 12, overflow: 'hidden' },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.Colors.primary,
  },
  submitBtnText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '600', color: theme.Colors.surfaceContainerLowest },
});
