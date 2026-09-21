import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { useAuthOptional } from '@/src/features/auth/context/AuthProvider';
import { getBlocks, BlockResponse } from '@/src/features/properties/api/block.api';
import { FilterPill } from './FilterPill';

export interface BlockFilterPillsProps {
  propertyId: string | null | undefined;
  selectedBlockId: string | null;
  onSelectBlockId: (blockId: string | null) => void;
  allLabel?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
  token?: string | null;
}

/**
 * Renders a horizontal row of block selection pills (e.g. [All Blocks | Tower A | Tower B]).
 *
 * Adheres to the progressive disclosure standard:
 * If the property has 1 or 0 blocks (single-building / default "Main" block),
 * this component automatically returns null to eliminate visual clutter.
 */
export function BlockFilterPills({
  propertyId,
  selectedBlockId,
  onSelectBlockId,
  allLabel = 'All Blocks',
  style,
  size = 'sm',
  token,
}: BlockFilterPillsProps) {
  const auth = useAuthOptional();
  const accessToken = token ?? auth?.accessToken;
  const [blocks, setBlocks] = useState<BlockResponse[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!propertyId || !accessToken) {
      setBlocks([]);
      return;
    }

    getBlocks(propertyId, accessToken)
      .then((data) => {
        if (isMounted) {
          setBlocks(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) setBlocks([]);
      });

    return () => {
      isMounted = false;
    };
  }, [propertyId, accessToken]);

  // Progressive disclosure: hide block filters if there's only 1 or 0 blocks
  if (blocks.length <= 1) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterPill
          label={allLabel}
          active={selectedBlockId === null}
          onPress={() => onSelectBlockId(null)}
          size={size}
          icon="domain"
        />
        {blocks.map((block) => (
          <FilterPill
            key={block.id}
            label={block.name}
            active={selectedBlockId === block.id}
            onPress={() => onSelectBlockId(block.id)}
            size={size}
            icon="location-city"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default BlockFilterPills;
