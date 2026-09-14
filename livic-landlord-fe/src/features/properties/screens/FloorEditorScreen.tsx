import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  Keyboard,
  ScrollView as RNScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PageShell } from '@/src/components/common/layout/PageShell';
import Animated, { 
  FadeInUp, 
  FadeOutDown,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { useResponsive } from '@/src/hooks/useResponsive';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';

import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';
import { getFloorLayout, UnitResponse } from '@/src/features/properties/api/unit.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAppTheme } from '@/src/theme/ThemeContext';

import { useFloorEditorDrawing, UnitBlock, ToolType } from '@/src/features/properties/hooks/useFloorEditorDrawing';
import { useFloorEditorGestures } from '@/src/features/properties/hooks/useFloorEditorGestures';
import { useFloorEditorTenantAssignment } from '@/src/features/properties/hooks/useFloorEditorTenantAssignment';
import { EditorGrid } from '@/src/features/properties/components/floor-editor/EditorGrid';
import { EditorToolbar } from '@/src/features/properties/components/floor-editor/EditorToolbar';
import { TypeSelectionModal } from '@/src/features/properties/components/floor-editor/TypeSelectionModal';
import { useFloorEditorLayoutApi } from '@/src/features/properties/hooks/useFloorEditorLayoutApi';
import { FloorEditorDetailCard } from '@/src/features/properties/components/floor-editor/FloorEditorDetailCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { ContextualStepGuideBar } from '@/src/features/onboarding/components/ContextualStepGuideBar';
import { createStyles } from './FloorEditorScreen.styles';

const GRID_SIZE_X = 10;
const GRID_SIZE_Y = 15;
const CELL_SIZE = 60;

interface FloorEditorScreenProps {
  propertyId: string;
  floorNumber: number;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
}

export default function FloorEditorScreen({
  propertyId,
  floorNumber,
  userToken,
  onBack,
  onSave
}: FloorEditorScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [typeSelectionModalVisible, setTypeSelectionModalVisible] = useState(false);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [pendingBlockNum, setPendingBlockNum] = useState<string>('');
  const { isDesktop } = useResponsive();

  const {
    activeTool,
    setActiveTool,
    blocks,
    setBlocks,
    nextUnitIndex,
    setNextUnitIndex,
    selectedUnitId,
    setSelectedUnitId,
    currentDrawBlock,
    parentScrollEnabled,
    setParentScrollEnabled,
    keyboardHeight,
    showRightArrow,
    handleScroll,
    handleScrollLayout,
    handleScrollContentSizeChange,
    handleDrawStart,
    handleDrawUpdate,
    handleDrawEnd,
    updateUnitDetails,
    handleClearAll,
    handleBlockPress: hookHandleBlockPress,
  } = useFloorEditorDrawing({
    floorNumber,
    setTypeSelectionModalVisible,
    setPendingBlockId,
    setPendingBlockNum,
  });

  const sheetScrollRef = useRef<RNScrollView | null>(null);
  const desktopGridWrapperRef = useRef<any>(null);
  const mobileGridWrapperRef = useRef<any>(null);

  const gridWidth = GRID_SIZE_X * CELL_SIZE;
  const gridHeight = GRID_SIZE_Y * CELL_SIZE;

  const selectedBlock = blocks.find(b => b.id === selectedUnitId) || null;

  // API Layout hook (loading/saving layout)
  const {
    loading,
    saving,
    handleSave,
    handleRemoveTenant
  } = useFloorEditorLayoutApi({
    propertyId,
    floorNumber,
    userToken,
    onSave,
    blocks,
    setBlocks,
    setNextUnitIndex,
    updateUnitDetails,
  });

  // Custom hook: Gestures and animations handling
  const {
    activeGesture,
    animatedGridStyle,
    scale,
  } = useFloorEditorGestures({
    activeTool,
    handleDrawStart,
    handleDrawUpdate,
    handleDrawEnd,
    desktopGridWrapperRef,
    mobileGridWrapperRef,
    loading,
    saving,
    isDesktop,
  });



  const onRemoveTenant = (leaseId: string, tenantName?: string | null) => 
    handleRemoveTenant(selectedBlock, () => setSelectedUnitId(null), leaseId, tenantName);

  // Custom hook: Tenant Assignments handling
  const tenantAssignProps = useFloorEditorTenantAssignment({
    selectedBlock,
    blocks,
    setBlocks,
    setSelectedUnitId,
    updateUnitDetails,
    propertyId,
    floorNumber,
    userToken,
    sheetScrollRef,
    setParentScrollEnabled,
  });

  const handleBlockPress = (blockIndex: number) => {
    hookHandleBlockPress(blockIndex, tenantAssignProps.resetTenantAssignmentForm);
  };


  if (isDesktop) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.desktopShell}>
          {/* Main Workspace */}
          <View style={styles.desktopMain}>


            <View style={[styles.flex, styles.desktopContent]}>
              <View style={[styles.flex, styles.desktopInner]}>
                
                <View style={styles.desktopHeaderRow}>
                  <TouchableOpacity
                    onPress={onBack}
                    style={{ marginRight: 14, padding: 8, borderRadius: 12, backgroundColor: theme.Colors.glassFill, borderWidth: 1, borderColor: theme.Colors.glassStroke }}
                    activeOpacity={0.75}
                  >
                    <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.largeTitleContainer}>
                    <Text style={styles.titleLineDesktop}>Edit Floor {floorNumber} Layout</Text>
                  </View>

                  <ActionButton
                    variant="primary"
                    label="Save Layout"
                    icon="check"
                    iconPosition="right"
                    onPress={handleSave}
                    loading={saving}
                  />
                </View>
                
                <ContextualStepGuideBar stepId="ADD_UNITS" />

                {/* Main Split Layout */}
                <View style={styles.desktopMainContent}>
                  
                  {/* Left Column: Drawing/Grid Canvas */}
                  <View style={styles.desktopCanvasColumn}>
                    <GestureDetector gesture={activeGesture}>
                      <View ref={desktopGridWrapperRef} style={styles.desktopGridWrapper}>
                        {saving ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.Colors.primary} />
                            <Text style={styles.loadingText}>Saving Layout...</Text>
                          </View>
                        ) : loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.Colors.primary} />
                            <Text style={styles.loadingText}>Loading Layout...</Text>
                          </View>
                        ) : (
                          <>
                            <View style={styles.canvasContainer}>
                              <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                                <EditorGrid
                                  blocks={blocks}
                                  selectedUnitId={selectedUnitId}
                                  activeTool={activeTool}
                                  currentDrawBlock={currentDrawBlock}
                                  handleBlockPress={handleBlockPress}
                                />
                              </Animated.View>
                            </View>

                            <EditorToolbar
                              activeTool={activeTool}
                              setActiveTool={setActiveTool}
                              handleClearAll={handleClearAll}
                              isDesktop={true}
                            />
                          </>
                        )}
                      </View>
                    </GestureDetector>
                  </View>

                  {/* Right Column: Selection Details */}
                  <View style={styles.desktopSidebarColumn}>
                    <View style={{ flex: 1 }}>
                      {selectedBlock ? (
                        <View style={[styles.desktopCard, { flex: 1 }]}>
                          <RNScrollView 
                            ref={sheetScrollRef}
                            scrollEnabled={parentScrollEnabled}
                            contentContainerStyle={styles.sheetContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                          >
                            <FloorEditorDetailCard
                              selectedBlock={selectedBlock}
                              floorNumber={floorNumber}
                              parentScrollEnabled={parentScrollEnabled}
                              setParentScrollEnabled={setParentScrollEnabled}
                              updateUnitDetails={updateUnitDetails}
                              onRemoveTenant={onRemoveTenant}
                              onClose={() => {
                                setSelectedUnitId(null);
                                tenantAssignProps.resetTenantAssignmentForm();
                              }}
                              tenantAssignProps={tenantAssignProps}
                              propertyId={propertyId}
                              userToken={userToken}
                            />
                          </RNScrollView>
                        </View>
                      ) : (
                        <View style={[styles.desktopCard, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.Spacing.xl }]}>
                          <MaterialIcons name="info-outline" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: theme.Spacing.md }} />
                          <Text style={{ fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '700', color: theme.Colors.onSurface, textAlign: 'center', marginBottom: theme.Spacing.sm }}>No Unit Selected</Text>
                          <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 }}>
                            Select any unit block in the grid layout to configure unit capacity and assign tenants.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

              </View>
            </View>
          </View>
        </View>

        <TypeSelectionModal
          visible={typeSelectionModalVisible}
          pendingBlockId={pendingBlockId}
          pendingBlockNum={pendingBlockNum}
          onClose={() => {
            setTypeSelectionModalVisible(false);
            setPendingBlockId(null);
          }}
          updateUnitDetails={updateUnitDetails}
          setBlocks={setBlocks}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageShell
        scrollable={false}
        edges={['top', 'bottom']}
        header={
          <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <View style={styles.titleContainer}>
                <Text style={styles.titleLine}>Edit Floor {floorNumber}</Text>
                <Text style={styles.titleLine}>Layout</Text>
              </View>
            </View>
            
            <ActionButton
              variant="primary"
              label="Save"
              icon="check"
              iconPosition="right"
              onPress={handleSave}
              loading={saving}
            />
          </View>
        }
      >
        <View style={styles.contentContainer}>
          <EditorToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            handleClearAll={handleClearAll}
            isDesktop={false}
            showRightArrow={showRightArrow}
            handleScroll={handleScroll}
            handleScrollLayout={handleScrollLayout}
            handleScrollContentSizeChange={handleScrollContentSizeChange}
          />

          <GestureDetector gesture={activeGesture}>
            <View ref={mobileGridWrapperRef} style={styles.gridWrapper}>
              {saving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.Colors.primary} />
                  <Text style={styles.loadingText}>Saving Layout...</Text>
                </View>
              ) : loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.Colors.primary} />
                  <Text style={styles.loadingText}>Loading Layout...</Text>
                </View>
              ) : (
                <View style={styles.canvasContainer}>
                  <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                    <EditorGrid
                      blocks={blocks}
                      selectedUnitId={selectedUnitId}
                      activeTool={activeTool}
                      currentDrawBlock={currentDrawBlock}
                      handleBlockPress={handleBlockPress}
                    />
                  </Animated.View>
                </View>
              )}
            </View>
          </GestureDetector>
        </View>

        {selectedBlock && (
          <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, overflow: 'hidden' }]}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.Colors.scrim || 'rgba(0, 0, 0, 0.4)' }]} />

            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                setSelectedUnitId(null);
                tenantAssignProps.resetTenantAssignmentForm();
              }}
            />
          </View>
        )}

        {selectedBlock && (() => {
          const bottomPosition = keyboardHeight > 0 ? keyboardHeight + 16 : 80;
          return (
            <Animated.View 
              entering={FadeInUp}
              exiting={FadeOutDown}
              style={[styles.detailSheetWrapper, { bottom: bottomPosition }]}
            >
              <View style={styles.detailSheet}>
                <RNScrollView 
                  ref={sheetScrollRef}
                  scrollEnabled={parentScrollEnabled}
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <FloorEditorDetailCard
                    selectedBlock={selectedBlock}
                    floorNumber={floorNumber}
                    parentScrollEnabled={parentScrollEnabled}
                    setParentScrollEnabled={setParentScrollEnabled}
                    updateUnitDetails={updateUnitDetails}
                    onRemoveTenant={onRemoveTenant}
                    onClose={() => {
                      setSelectedUnitId(null);
                      tenantAssignProps.resetTenantAssignmentForm();
                    }}
                    tenantAssignProps={tenantAssignProps}
                    propertyId={propertyId}
                    userToken={userToken}
                  />
                </RNScrollView>
              </View>
            </Animated.View>
          );
        })()}
      </PageShell>

      <TypeSelectionModal
        visible={typeSelectionModalVisible}
        pendingBlockId={pendingBlockId}
        pendingBlockNum={pendingBlockNum}
        onClose={() => {
          setTypeSelectionModalVisible(false);
          setPendingBlockId(null);
        }}
        updateUnitDetails={updateUnitDetails}
        setBlocks={setBlocks}
      />
    </GestureHandlerRootView>
  );
}

