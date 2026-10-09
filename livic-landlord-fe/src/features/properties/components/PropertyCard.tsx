import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/src/theme/ThemeContext';
import Building3DView from '@/src/features/properties/components/Building3DView';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { PopoverMenu, anchorFromPress, type MenuAnchor } from '@/src/components/common/inputs/PopoverMenu';
import { OccupancyStrip } from '@/src/features/properties/components/OccupancyStrip';
import { usePortfolioOccupancy } from '@/src/features/properties/hooks/usePortfolioOccupancy';
import type { PropertyResponse } from '@/src/types/property';
import { getBlocks, BlockResponse } from '@/src/features/properties/api/block.api';
import { withAlpha } from '@/src/theme/colorUtils';

interface PropertyCardProps {
  item: PropertyResponse;
  isDesktop: boolean;
  accessToken: string | null;
  resetRotationTrigger: number;
  handleFloorClick: (propertyId: string, floorNum: number) => void;
  triggerReset: (propertyId: string) => void;
  handleDeleteProperty: (propertyId: string, propertyName: string) => void;
  togglePropertyActive: (id: string, active: boolean) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setSelectedPropertyForBroadcast: (property: PropertyResponse) => void;
  /**
   * Mobile only: mount the interactive 3D building. The Home pager passes true just for the
   * visible page; mounting many 3D views at once made scrolling janky.
   */
  show3D?: boolean;
}

export function PropertyCard({
  item,
  isDesktop,
  accessToken,
  resetRotationTrigger,
  handleFloorClick,
  triggerReset,
  handleDeleteProperty,
  togglePropertyActive,
  showToast,
  setSelectedPropertyForBroadcast,
  show3D = false,
}: PropertyCardProps) {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { data: blocks = [] } = useQuery<BlockResponse[]>({
    queryKey: ['property-blocks', item.id],
    queryFn: () => getBlocks(item.id, accessToken || ''),
    enabled: Boolean(item.id && accessToken),
    staleTime: 1000 * 60 * 5,
  });

  const hasMultipleBlocks = blocks.length > 1;
  const totalBlocks = Math.max(blocks.length, 1);
  const displayFloors = blocks[0]?.totalFloors ?? '-';

  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const activeBlockId = selectedBlockId || (blocks.length > 0 ? blocks[0].id : null);
  const [menuAnchor, setMenuAnchor] = React.useState<MenuAnchor | null>(null);
  // Shared across all cards: one request for the whole portfolio
  const { data: occupancyByProperty, isLoading: isOccupancyLoading } = usePortfolioOccupancy();

  const handleToggleActive = async () => {
    try {
      const nextState = item.isActive === false;
      await togglePropertyActive(item.id, nextState);
      showToast(nextState ? `Property "${item.name}" activated!` : `Property "${item.name}" deactivated!`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to toggle status', 'error');
    }
  };

  if (isDesktop) {
    return (
      <View style={[styles.propertyCard, styles.propertyCardDesktop]}>
        <View style={styles.desktopCardRow}>
          {/* Left Side: 3D Building Preview */}
          <View style={styles.desktopCardLeft}>
            <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerDesktop, item.isActive === false && { opacity: 0.65 }]}>
              <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {accessToken && (
                  <Building3DView 
                    propertyId={item.id} 
                    token={accessToken} 
                    blockId={activeBlockId}
                    onFloorClick={(floorNum) => handleFloorClick(item.id, floorNum)} 
                    resetRotationTrigger={resetRotationTrigger}
                    maxContainerHeight={232}
                  />
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.resetButtonOverlay}
                onPress={() => triggerReset(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="3d-rotation" size={18} color={theme.Colors.primary} />
              </TouchableOpacity>
              
              <View style={[styles.statusPillOverlay, item.isActive === false && { backgroundColor: withAlpha(theme.Colors.error, 0.25) }]}>
                <Text style={[styles.statusPillText, item.isActive === false && { color: theme.Colors.error }]}>
                  {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                </Text>
              </View>

              {hasMultipleBlocks && (
                <View style={styles.blockSwitcherOverlay}>
                  {blocks.map((block) => {
                    const isSelected = block.id === activeBlockId;
                    return (
                      <TouchableOpacity
                        key={block.id}
                        style={[
                          styles.blockPill,
                          isSelected && styles.blockPillActive,
                        ]}
                        onPress={() => setSelectedBlockId(block.id)}
                        activeOpacity={0.75}
                      >
                        <MaterialIcons
                          name="domain"
                          size={11}
                          color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
                        />
                        <Text
                          style={[
                            styles.blockPillText,
                            isSelected && styles.blockPillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {block.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity 
                style={styles.deleteButtonOverlay}
                onPress={() => handleDeleteProperty(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="delete-outline" size={20} color={theme.Colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Side: Property Details & Actions */}
          <View style={styles.desktopCardRight}>
            <View>
              <Text style={styles.propertyName}>{item.name}</Text>
              <View style={styles.addressContainer}>
                <MaterialIcons name="location-on" size={14} color={theme.Colors.onSurfaceVariant} />
                <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
              </View>
            </View>

            <View style={styles.desktopMetricsContainer}>
              <View style={styles.desktopMetricRow}>
                <Text style={styles.propertyMetricLabel}>STATUS</Text>
                <Text style={[styles.desktopMetricValue, styles.propertyMetricAccent]}>READY</Text>
              </View>
              {hasMultipleBlocks ? (
                <View style={styles.desktopMetricRow}>
                  <Text style={styles.propertyMetricLabel}>BLOCKS</Text>
                  <Text style={[styles.desktopMetricValue, { fontWeight: '700' }]}>{totalBlocks} Blocks</Text>
                </View>
              ) : (
                <View style={styles.desktopMetricRow}>
                  <Text style={styles.propertyMetricLabel}>FLOORS</Text>
                  <Text style={styles.desktopMetricValue}>{displayFloors} Floors</Text>
                </View>
              )}
              <View style={styles.desktopMetricRow}>
                <Text style={styles.propertyMetricLabel}>PROPERTY LIFE CYCLE</Text>
                <TouchableOpacity
                  onPress={handleToggleActive}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.desktopMetricValue, { color: item.isActive === false ? theme.Colors.error : theme.Colors.primary, fontWeight: '600' }]}>
                    {item.isActive === false ? 'DEACTIVATED' : 'ACTIVE'}
                  </Text>
                  <MaterialIcons 
                    name={item.isActive === false ? "toggle-off" : "toggle-on"} 
                    size={32} 
                    color={item.isActive === false ? theme.Colors.outlineVariant : theme.Colors.primary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.desktopCardActions}>
              <ActionButton
                label={hasMultipleBlocks ? "Blocks & Floors" : "Floors & Units"}
                icon={hasMultipleBlocks ? "domain" : "layers"}
                iconPosition="right"
                variant="primary"
                size="md"
                onPress={() => router.push(`/properties/${item.id}/floors`)}
              />
              <ActionButton
                label="Manage"
                icon="settings"
                variant="outline"
                size="md"
                onPress={() => router.push(`/properties/${item.id}`)}
              />
              <ActionButton
                label="Broadcast Notice"
                icon="campaign"
                variant="secondary"
                size="md"
                onPress={() => setSelectedPropertyForBroadcast(item)}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.propertyCard, styles.propertyCardMobile, item.isActive === false && { opacity: 0.85 }]}>
      <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerMobile, item.isActive === false && { opacity: 0.65 }]}>
        <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {show3D && accessToken ? (
            <Building3DView
              propertyId={item.id}
              token={accessToken}
              blockId={activeBlockId}
              onFloorClick={(floorNum) => handleFloorClick(item.id, floorNum)}
              resetRotationTrigger={resetRotationTrigger}
              maxContainerHeight={170}
              // The occupancy strip below the name doubles as the key, so don't cover the building
              hideLegend
            />
          ) : (
            <MaterialIcons name="apartment" size={40} color={theme.Colors.primary} style={{ opacity: 0.35 }} />
          )}
        </View>

        {show3D && (
          <TouchableOpacity
            style={styles.resetButtonOverlay}
            onPress={() => triggerReset(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel="Reset 3D view"
          >
            <MaterialIcons name="3d-rotation" size={18} color={theme.Colors.primary} />
          </TouchableOpacity>
        )}

        {show3D && hasMultipleBlocks && (
          <View style={styles.blockSwitcherOverlay}>
            {blocks.map((block) => {
              const isSelected = block.id === activeBlockId;
              return (
                <TouchableOpacity
                  key={block.id}
                  style={[styles.blockPill, isSelected && styles.blockPillActive]}
                  onPress={() => setSelectedBlockId(block.id)}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="domain" size={11} color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant} />
                  <Text style={[styles.blockPillText, isSelected && styles.blockPillTextActive]} numberOfLines={1}>
                    {block.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.mobileHeaderRow}>
        <View style={styles.mobileHeaderText}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={14} color={theme.Colors.onSurfaceVariant} />
            <Text style={[styles.propertyAddress, { flexShrink: 1 }]}>
              {item.address}, {item.city}
            </Text>
          </View>
          <Text style={styles.mobileMeta}>
            {hasMultipleBlocks ? `${totalBlocks} blocks` : `${displayFloors} floors`}
            {item.isActive === false && <Text style={{ color: theme.Colors.error }}>  ·  Inactive</Text>}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={(e) => setMenuAnchor(anchorFromPress(e))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`More actions for ${item.name}`}
        >
          <MaterialIcons name="more-vert" size={22} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: theme.Spacing.md }}>
        <OccupancyStrip occupancy={occupancyByProperty?.[item.id]} isLoading={isOccupancyLoading} />
      </View>

      <View style={{ marginTop: theme.Spacing.md }}>
        <ActionButton
          label={hasMultipleBlocks ? "Blocks & Floors" : "Floors & Units"}
          icon={hasMultipleBlocks ? "domain" : "layers"}
          iconPosition="right"
          variant="primary"
          size="md"
          fullWidth
          onPress={() => router.push(`/properties/${item.id}/floors`)}
        />
      </View>

      <PopoverMenu
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        items={[
          { key: 'manage', label: 'Property settings', icon: 'settings', onPress: () => router.push(`/properties/${item.id}`) },
          { key: 'broadcast', label: 'Broadcast notice', icon: 'campaign', onPress: () => setSelectedPropertyForBroadcast(item) },
          {
            key: 'toggle',
            label: item.isActive === false ? 'Activate property' : 'Deactivate property',
            icon: item.isActive === false ? 'toggle-on' : 'toggle-off',
            onPress: handleToggleActive,
          },
          { key: 'delete', label: 'Delete property', icon: 'delete-outline', destructive: true, onPress: () => handleDeleteProperty(item.id, item.name) },
        ]}
      />
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  propertyCard: {
    borderRadius: theme.Rounded.xl,
    padding: theme.Spacing.lg,
    overflow: 'visible',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
    zIndex: 1,
  },
  cardBlurBackground: {
    display: 'none',
  },
  propertyCardDesktop: {
    minHeight: 280,
  },
  desktopCardRow: {
    flexDirection: 'row',
    gap: theme.Spacing.lg,
  },
  desktopCardLeft: {
    width: 280,
  },
  desktopCardRight: {
    flex: 1,
    justifyContent: 'space-between',
    gap: theme.Spacing.md,
  },
  // Neutral backdrop: a teal backdrop made the teal (occupied) units disappear into it
  buildingPreviewContainer: {
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  buildingPreviewContainerDesktop: {
    height: 232,
    width: '100%',
    overflow: 'hidden',
  },
  propertyCardMobile: {
    padding: theme.Spacing.md,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
  },
  mobileHeaderText: {
    flex: 1,
    gap: theme.Spacing.xs,
  },
  mobileMeta: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  buildingPreviewContainerMobile: {
    height: 170,
    width: '100%',
    overflow: 'hidden',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    padding: theme.Spacing.sm,
    borderRadius: 10,
    zIndex: 10,
  },
  statusPillOverlay: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: theme.Colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  statusPillText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  blockSwitcherOverlay: {
    position: 'absolute',
    right: 12,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? theme.Colors.surfaceContainerLowest : theme.Colors.surfaceContainerLowest,
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    zIndex: 15,
  },
  blockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  blockPillActive: {
    backgroundColor: theme.Colors.primaryContainer,
    ...theme.Shadows.low,
  },
  blockPillText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  blockPillTextActive: {
    color: theme.Colors.onPrimaryContainer,
    fontWeight: '700',
  },
  deleteButtonOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    padding: theme.Spacing.sm,
    borderRadius: 10,
    zIndex: 10,
  },
  propertyName: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  propertyAddress: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  desktopMetricsContainer: {
    gap: 10,
  },
  desktopMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: theme.Spacing.md,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    overflow: 'hidden',
  },
  propertyMetricLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  desktopMetricValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
  },
  propertyMetricAccent: {
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  desktopCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  manageButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  manageButtonWrapperDesktop: {
    flex: 1.2,
  },
  manageButtonWrapperMobile: {
    marginTop: theme.Spacing.md,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  manageButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  broadcastButtonWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.Colors.primaryContainer,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  broadcastButtonWrapperDesktop: {
    flex: 1,
  },
  broadcastButtonWrapperMobile: {
    marginTop: 10,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12.5,
  },
  broadcastButtonText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
