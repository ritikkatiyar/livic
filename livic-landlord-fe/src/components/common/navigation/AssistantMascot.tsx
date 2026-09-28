import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export type MascotMood = 'idle' | 'watching' | 'happy';

const ROOF_DEG = 32;
const ROOF_COS = Math.cos((ROOF_DEG * Math.PI) / 180);
const ROOF_SIN = Math.sin((ROOF_DEG * Math.PI) / 180);

interface AssistantMascotProps {
  /** Diameter of the face in px; every feature scales from this. */
  size: number;
  /** Face background. */
  color: string;
  /** Eyes, roof and smile. */
  featureColor?: string;
  mood?: MascotMood;
}

/**
 * "Livi", the assistant's face: a little house (roof brow, eyes, smile) that blinks,
 * glances around while idle, looks down while the user scrolls and squints when happy.
 */
export function AssistantMascot({ size, color, featureColor = '#ffffff', mood = 'idle' }: AssistantMascotProps) {
  const blink = useRef(new Animated.Value(1)).current; // eye scaleY
  const glanceX = useRef(new Animated.Value(0)).current;
  const lookY = useRef(new Animated.Value(0)).current;
  const squint = useRef(new Animated.Value(0)).current; // 0 open, 1 happy squint

  // Blink at slightly random intervals so it feels alive, not metronomic.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.1, duration: 70, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]).start(scheduleBlink);
      }, 2500 + Math.random() * 3000);
    };
    scheduleBlink();
    return () => clearTimeout(timer);
  }, [blink]);

  // Occasional sideways glance while idle.
  useEffect(() => {
    if (mood !== 'idle') {
      glanceX.stopAnimation();
      Animated.timing(glanceX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const scheduleGlance = () => {
      timer = setTimeout(() => {
        const dir = Math.random() > 0.5 ? 1 : -1;
        Animated.sequence([
          Animated.timing(glanceX, { toValue: dir * size * 0.05, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(glanceX, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(scheduleGlance);
      }, 4000 + Math.random() * 4000);
    };
    scheduleGlance();
    return () => clearTimeout(timer);
  }, [mood, glanceX, size]);

  useEffect(() => {
    Animated.spring(lookY, { toValue: mood === 'watching' ? size * 0.05 : 0, friction: 6, useNativeDriver: true }).start();
    Animated.spring(squint, { toValue: mood === 'happy' ? 1 : 0, friction: 5, useNativeDriver: true }).start();
  }, [mood, lookY, squint, size]);

  const eyeW = size * 0.13;
  const eyeH = size * 0.18;
  const roofBar = size * 0.34;
  const stroke = Math.max(2, size * 0.05);
  const smileW = size * 0.24;

  const eyeScaleY = Animated.multiply(blink, squint.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }));
  const eyesTransform = [{ translateX: glanceX }, { translateY: lookY }, { scaleY: eyeScaleY }];

  return (
    <View style={[styles.face, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      {/* Roof brow: two bars rotated about their centres so their inner ends meet at the peak */}
      {[-1, 1].map((side) => (
        <View
          key={side}
          style={{
            position: 'absolute',
            top: size * 0.14 + roofBar * ROOF_SIN / 2 - stroke / 2,
            left: size / 2 + side * (roofBar * ROOF_COS / 2) - roofBar / 2,
            width: roofBar,
            height: stroke,
            borderRadius: stroke,
            backgroundColor: featureColor,
            transform: [{ rotate: `${side * ROOF_DEG}deg` }],
          }}
        />
      ))}

      {/* Eyes */}
      <View style={[styles.eyesRow, { top: size * 0.4, gap: size * 0.16 }]}>
        {[0, 1].map((i) => (
          <Animated.View
            key={i}
            style={{ width: eyeW, height: eyeH, borderRadius: eyeW / 2, backgroundColor: featureColor, transform: eyesTransform }}
          />
        ))}
      </View>

      {/* Cheeks */}
      <View style={[styles.cheek, { width: size * 0.12, height: size * 0.07, borderRadius: size, top: size * 0.62, left: size * 0.17 }]} />
      <View style={[styles.cheek, { width: size * 0.12, height: size * 0.07, borderRadius: size, top: size * 0.62, right: size * 0.17 }]} />

      {/* Smile */}
      <Animated.View
        style={{
          position: 'absolute',
          top: size * 0.62,
          width: smileW,
          height: smileW / 2,
          borderWidth: stroke,
          borderTopWidth: 0,
          borderColor: featureColor,
          borderBottomLeftRadius: smileW / 2,
          borderBottomRightRadius: smileW / 2,
          transform: [{ scale: squint.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  eyesRow: {
    position: 'absolute',
    flexDirection: 'row',
  },
  cheek: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 160, 160, 0.55)',
  },
});
