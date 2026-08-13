import React, { createContext, useContext, useEffect, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  type ViewStyle,
  View,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

const PulseContext = createContext<Animated.Value | null>(null);

/** Tek native-driver pulse — sayfadaki tüm skeleton kutuları bunu paylaşır. */
export function SkeletonPulse({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0.52)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 860,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.48,
          duration: 860,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return <PulseContext.Provider value={anim}>{children}</PulseContext.Provider>;
}

type SkeletonProps = {
  width: DimensionValue;
  height?: number;
  borderRadius?: number;
  aspectRatio?: number;
  style?: ViewStyle;
};

/** Shimmer dikdörtgen — `SkeletonPulse` içinde kullan. */
export function Skeleton({
  width,
  height = 16,
  borderRadius = 8,
  aspectRatio,
  style,
}: SkeletonProps) {
  const pulse = useContext(PulseContext);
  const base = useThemeColor('skeleton');

  const box = (
    <View
      style={[
        {
          width,
          height: aspectRatio ? undefined : height,
          aspectRatio,
          borderRadius,
          backgroundColor: base,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );

  if (!pulse) return box;

  return <Animated.View style={{ opacity: pulse }}>{box}</Animated.View>;
}
