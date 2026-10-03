import { useState, useRef, useEffect } from 'react';
import { Alert, Keyboard, Platform } from 'react-native';
import type { Occupant } from '@/src/features/properties/api/unit.api';

export type ToolType = 'PAN' | 'ADD' | 'ERASE';

export interface UnitBlock {
  id: string; 
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  members?: Occupant[];
  type?: string;
}

interface UseFloorEditorDrawingProps {
  floorNumber: number;
  setTypeSelectionModalVisible: (visible: boolean) => void;
  setPendingBlockId: (id: string | null) => void;
  setPendingBlockNum: (num: string) => void;
}

export function useFloorEditorDrawing({
  floorNumber,
  setTypeSelectionModalVisible,
  setPendingBlockId,
  setPendingBlockNum,
}: UseFloorEditorDrawingProps) {
  const [activeTool, setActiveTool] = useState<ToolType>('PAN');
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [nextUnitIndex, setNextUnitIndex] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [currentDrawBlock, setCurrentDrawBlock] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const drawBlockRef = useRef<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Scroll Indicator Dynamic Visibility Refs & State
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContentWidth = useRef(0);
  const scrollLayoutWidth = useRef(0);

  const updateArrowVisibility = (scrollX: number) => {
    const canScroll = scrollContentWidth.current > scrollLayoutWidth.current;
    const isAtEnd = scrollX + scrollLayoutWidth.current >= scrollContentWidth.current - 15;
    setShowRightArrow(canScroll && !isAtEnd);
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    scrollLayoutWidth.current = event.nativeEvent.layoutMeasurement.width;
    scrollContentWidth.current = event.nativeEvent.contentSize.width;
    updateArrowVisibility(scrollX);
  };

  const handleScrollLayout = (event: any) => {
    scrollLayoutWidth.current = event.nativeEvent.layout.width;
    updateArrowVisibility(0);
  };

  const handleScrollContentSizeChange = (w: number) => {
    scrollContentWidth.current = w;
    updateArrowVisibility(0);
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleDrawStart = (x: number, y: number) => {
    const b = { startX: x, startY: y, endX: x, endY: y };
    drawBlockRef.current = b;
    setCurrentDrawBlock(b);
  };

  const handleDrawUpdate = (x: number, y: number) => {
    if (drawBlockRef.current) {
      const b = { ...drawBlockRef.current, endX: x, endY: y };
      drawBlockRef.current = b;
      setCurrentDrawBlock(b);
    }
  };

  const handleDrawEnd = () => {
    const b = drawBlockRef.current;
    if (b) {
      const minX = Math.min(b.startX, b.endX);
      const minY = Math.min(b.startY, b.endY);
      const w = Math.abs(b.startX - b.endX) + 1;
      const h = Math.abs(b.startY - b.endY) + 1;

      setBlocks(prevBlocks => {
        const overlap = prevBlocks.some(block => 
          minX < block.gridX + block.gridWidth &&
          minX + w > block.gridX &&
          minY < block.gridY + block.gridHeight &&
          minY + h > block.gridY
        );

        if (overlap) {
          Alert.alert('Overlap', 'Units cannot overlap. Please draw in an empty space.');
          return prevBlocks;
        }

        const currentNextIndex = nextUnitIndex; 
        const newUnitNum = `${floorNumber}${(currentNextIndex).toString().padStart(2, '0')}`;
        const newBlockId = `${minX}-${minY}-${Date.now()}`;
        const newBlock: UnitBlock = {
          id: newBlockId,
          gridX: minX,
          gridY: minY,
          gridWidth: w,
          gridHeight: h,
          unitNumber: newUnitNum,
          capacity: 2,
          type: 'ONE_BHK'
        };

        setPendingBlockId(newBlockId);
        setPendingBlockNum(newUnitNum);
        setTypeSelectionModalVisible(true);

        setNextUnitIndex(prev => prev + 1);
        return [...prevBlocks, newBlock];
      });

      drawBlockRef.current = null;
      setCurrentDrawBlock(null);
    }
  };

  const updateUnitDetails = (id: string, updates: Partial<UnitBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to remove all units? This cannot be undone until saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => { setBlocks([]); setNextUnitIndex(1); } }
    ]);
  };

  const handleBlockPress = (blockIndex: number, onSelect?: () => void) => {
    const block = blocks[blockIndex];
    if (activeTool === 'ERASE') {
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex, 1);
      setBlocks(newBlocks);
    } else if (activeTool === 'PAN') {
      setSelectedUnitId(block.id);
      onSelect?.();
    }
  };

  return {
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
    handleBlockPress,
  };
}
