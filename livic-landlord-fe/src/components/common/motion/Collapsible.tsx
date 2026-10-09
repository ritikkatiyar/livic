import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Motion, useReducedMotion } from '@/src/theme/motion';

interface CollapsibleProps {
  expanded: boolean;
  children: React.ReactNode;
}

/**
 * Opens and closes its content by animating its height. Like `{expanded && children}`, the content is only
 * mounted while open (and while closing), so a long list of collapsed sections stays cheap.
 */
export function Collapsible({ expanded, children }: CollapsibleProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [isMounted, setIsMounted] = useState(expanded);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (expanded) setIsMounted(true);
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: reduceMotion ? 0 : Motion.duration.normal,
      easing: Motion.easeOut,
      // Height is a layout property, which the native driver can't animate
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !expanded) setIsMounted(false);
    });
  }, [expanded, progress, reduceMotion]);

  if (!isMounted) return null;

  return (
    <Animated.View
      style={[
        styles.clip,
        {
          height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }),
          opacity: progress,
        },
      ]}
      pointerEvents={expanded ? 'auto' : 'none'}
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
    >
      {/* Laid out at full height out of flow, so the clip knows how tall to open */}
      <View style={styles.content} onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
