import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import { useAppTheme } from '@/src/theme/ThemeContext';
import Building3DView from '@/src/features/properties/components/Building3DView';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import type { PropertyResponse } from '@/src/types/property';

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
  setSelectedPropertyForBroadcast
}: PropertyCardProps) {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
              
              <View style={[styles.statusPillOverlay, item.isActive === false && { backgroundColor: 'rgba(186, 26, 26, 0.25)' }]}>
                <Text style={[styles.statusPillText, item.isActive === false && { color: theme.Colors.error }]}>
                  {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                </Text>
              </View>

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
              <View style={styles.desktopMetricRow}>
                <Text style={styles.propertyMetricLabel}>FLOORS</Text>
                <Text style={styles.desktopMetricValue}>{item.totalFloors ?? '-'}</Text>
              </View>
              <View style={styles.desktopMetricRow}>
                <Text style={styles.propertyMetricLabel}>PROPERTY LIFE CYCLE</Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const nextState = item.isActive === false;
                      await togglePropertyActive(item.id, nextState);
                      showToast(nextState ? `Property "${item.name}" activated!` : `Property "${item.name}" deactivated!`, 'success');
                    } catch (error: any) {
                      showToast(error.message || 'Failed to toggle status', 'error');
                    }
                  }}
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
                label="MANAGE"
                icon="arrow-forward"
                iconPosition="right"
                variant="primary"
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
    <View style={[styles.propertyCard, item.isActive === false && { opacity: 0.85 }]}>
      <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerMobile, item.isActive === false && { opacity: 0.65 }]}>
        <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {accessToken && (
            <Building3DView 
              propertyId={item.id} 
              token={accessToken} 
              onFloorClick={(floorNum) => handleFloorClick(item.id, floorNum)} 
              resetRotationTrigger={resetRotationTrigger}
              maxContainerHeight={180}
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
        
        <View style={[styles.statusPillOverlay, item.isActive === false && { backgroundColor: 'rgba(186, 26, 26, 0.25)' }]}>
          <Text style={[styles.statusPillText, item.isActive === false && { color: theme.Colors.error }]}>
            {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.deleteButtonOverlay, { right: 60 }]}
          onPress={async () => {
            try {
              const nextState = item.isActive === false;
              await togglePropertyActive(item.id, nextState);
              showToast(nextState ? `Property "${item.name}" activated!` : `Property "${item.name}" deactivated!`, 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to toggle status', 'error');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons 
            name={item.isActive === false ? "toggle-off" : "toggle-on"} 
            size={30} 
            color={item.isActive === false ? theme.Colors.outlineVariant : theme.Colors.primary} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteButtonOverlay}
          onPress={() => handleDeleteProperty(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="delete-outline" size={20} color={theme.Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.propertyHeaderRow, styles.propertyHeaderRowMobile]}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={14} color={theme.Colors.onSurfaceVariant} />
            <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.propertyMetrics, styles.propertyMetricsMobile]}>
        <View style={styles.propertyMetric}>
          <Text style={styles.propertyMetricLabel}>FLOORS</Text>
          <Text style={styles.propertyMetricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {item.totalFloors ?? '-'}
          </Text>
        </View>
        <View style={styles.propertyMetric}>
          <Text style={styles.propertyMetricLabel}>STATUS</Text>
          <Text style={[styles.propertyMetricValue, styles.propertyMetricAccent]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            READY
          </Text>
        </View>
      </View>
      
      <View style={{ gap: 10, marginTop: 14 }}>
        <ActionButton
          label="Manage Property"
          icon="arrow-forward"
          iconPosition="right"
          variant="primary"
          size="md"
          fullWidth
          onPress={() => router.push(`/properties/${item.id}`)}
        />
        <ActionButton
          label="Broadcast Notice"
          icon="campaign"
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => setSelectedPropertyForBroadcast(item)}
        />
      </View>
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
    shadowColor: 'black',
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
  buildingPreviewContainer: {
    backgroundColor: theme.Colors.primaryContainer,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  buildingPreviewContainerDesktop: {
    height: 232,
    width: '100%',
    overflow: 'hidden',
  },
  buildingPreviewContainerMobile: {
    height: 180,
    width: '100%',
    overflow: 'hidden',
  },
  resetButtonOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: theme.Surface.card,
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
  deleteButtonOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: theme.Surface.card,
    padding: theme.Spacing.sm,
    borderRadius: 10,
    zIndex: 10,
  },
  propertyInfo: {
    gap: theme.Spacing.xs,
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
  propertyHeaderRow: {
    marginTop: theme.Spacing.md,
  },
  propertyHeaderRowMobile: {},
  propertyMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  propertyMetricsMobile: {},
  propertyMetric: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    alignItems: 'center',
    overflow: 'hidden',
  },
  propertyMetricValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onBackground,
    marginTop: theme.Spacing.xs,
  },
});
