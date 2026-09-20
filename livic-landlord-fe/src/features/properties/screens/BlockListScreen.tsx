import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { formatErrorMessage } from '@/src/utils/errors';
import { getProperty } from '@/src/features/properties/api/property.api';
import {
  BlockResponse,
  createBlock,
  deleteBlock,
  getBlocks,
  updateBlock,
} from '@/src/features/properties/api/block.api';
import { useFocusEffect } from 'expo-router';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { createStyles } from './FloorListOverviewScreen.styles';

interface BlockListScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onOpenBlock: (block: BlockResponse) => void;
}

/**
 * The blocks inside one property.
 *
 * Landlords only reach this once a property has more than one, so a single-building
 * property never has to think about blocks. Adding the second one is the moment the
 * default "Main" block needs a real name, which is why that rename is prompted here.
 */
export default function BlockListScreen({
  propertyId,
  userToken,
  onBack,
  onOpenBlock,
}: BlockListScreenProps) {
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [propertyName, setPropertyName] = useState('Loading...');
  const [blocks, setBlocks] = useState<BlockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFloors, setNewFloors] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const load = useCallback(async () => {
    try {
      const [property, blockData] = await Promise.all([
        getProperty(propertyId, userToken),
        getBlocks(propertyId, userToken),
      ]);
      setPropertyName(property.name);
      setBlocks(blockData);
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [propertyId, userToken]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startRename = (block: BlockResponse) => {
    setRenamingId(block.id);
    setRenameValue(block.name);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Name needed', 'Give this block a name, like "Tower B".');
      return;
    }
    const floors = newFloors ? parseInt(newFloors, 10) : undefined;
    if (newFloors && (!floors || floors < 1)) {
      Alert.alert('Floors', 'Enter how many floors this block has, or leave it blank.');
      return;
    }

    // Captured before the reload, so we can offer to rename the original block.
    const stale = blocks.find((b) => b.isDefault && b.name === 'Main');

    setSaving(true);
    try {
      await createBlock(propertyId, { name, totalFloors: floors ?? null }, userToken);
      setNewName('');
      setNewFloors('');
      await load();

      // A property with two blocks should not be left with one still called "Main".
      if (stale) {
        Alert.alert(
          'Name the other block',
          'Your first block is still called "Main". Give it a real name so the two are easy to tell apart.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Rename', onPress: () => startRename(stale) },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (block: BlockResponse) => {
    const name = renameValue.trim();
    if (!name) {
      return;
    }
    setSaving(true);
    try {
      await updateBlock(propertyId, block.id, { name, totalFloors: block.totalFloors }, userToken);
      setRenamingId(null);
      await load();
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (block: BlockResponse) => {
    if (block.unitCount > 0) {
      Alert.alert(
        `Remove ${block.name}?`,
        `This block still has ${block.unitCount} unit${block.unitCount === 1 ? '' : 's'}. Remove them first.`
      );
      return;
    }
    Alert.alert(`Remove ${block.name}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBlock(propertyId, block.id, userToken);
            await load();
          } catch (error: any) {
            Alert.alert('Error', formatErrorMessage(error));
          }
        },
      },
    ]);
  };

  const renderBlockList = () => (
    <View style={styles.floorsList}>
      {blocks.map((block) => (
        <View key={block.id} style={styles.floorCard}>
          {renamingId === block.id ? (
            <View style={styles.quickCreateRow}>
              <TextInput
                style={[styles.quickCreateInput, { flex: 1 }]}
                value={renameValue}
                onChangeText={setRenameValue}
                autoFocus
                placeholder="Block name"
                placeholderTextColor={theme.Colors.onSurfaceVariant}
              />
              <TouchableOpacity
                style={styles.quickGenerateButton}
                onPress={() => handleRename(block)}
                disabled={saving}
              >
                <Text style={styles.quickGenerateButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRenamingId(null)} style={{ paddingHorizontal: 8 }}>
                <MaterialIcons name="close" size={22} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.floorCardHeader}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => onOpenBlock(block)}
                accessibilityRole="button"
              >
                <Text style={styles.floorTitle}>{block.name}</Text>
                <Text style={styles.unitCountText}>
                  {block.unitCount} unit{block.unitCount === 1 ? '' : 's'}
                  {block.totalFloors ? ` · ${block.totalFloors} floors` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startRename(block)} style={{ paddingHorizontal: 8 }}>
                <MaterialIcons name="edit" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(block)} style={{ paddingHorizontal: 8 }}>
                <MaterialIcons name="delete-outline" size={20} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
              <MaterialIcons name="chevron-right" size={22} color={theme.Colors.onSurfaceVariant} />
            </View>
          )}
        </View>
      ))}

      <View style={styles.quickCreateSection}>
        <Text style={styles.quickCreateTitle}>Add a block</Text>
        <View style={styles.quickCreateRow}>
          <TextInput
            style={[styles.quickCreateInput, { flex: 2 }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Tower B"
            placeholderTextColor={theme.Colors.onSurfaceVariant}
          />
          <TextInput
            style={[styles.quickCreateInput, { width: 80 }]}
            value={newFloors}
            onChangeText={setNewFloors}
            placeholder="Floors"
            placeholderTextColor={theme.Colors.onSurfaceVariant}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.quickGenerateButton} onPress={handleAdd} disabled={saving}>
            <Text style={styles.quickGenerateButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <PageShell scrollable={true}>
        <View style={styles.desktopInner}>
          <View style={styles.desktopHeaderRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButtonBadge} activeOpacity={0.75}>
              <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.titleLineDesktop}>Blocks</Text>
                <View style={styles.propertyBadge}>
                  <View style={styles.propertyIconWrapper}>
                    <MaterialIcons name="business" size={14} color={theme.Colors.surfaceContainerLowest} />
                  </View>
                  <Text style={styles.propertyNameLabel}>{propertyName}</Text>
                </View>
              </View>
              <Text style={styles.subtitleDesktop}>Manage blocks, floor counts and physical structures</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            renderBlockList()
          )}
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell
      scrollable={true}
      header={
        <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.Colors.outline, backgroundColor: theme.Colors.background }}>
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
            <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
          </TouchableOpacity>
          <Text style={{ fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '600', color: theme.Colors.onSurface }}>Blocks</Text>
        </View>
      }
    >
      <View style={styles.largeTitleContainer}>
        <View style={styles.propertyBadge}>
          <View style={styles.propertyIconWrapper}>
            <MaterialIcons name="business" size={14} color={theme.Colors.surfaceContainerLowest} />
          </View>
          <Text style={styles.propertyNameLabel}>{propertyName}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        renderBlockList()
      )}
    </PageShell>
  );
}
