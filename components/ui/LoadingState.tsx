import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SkeletonBoxProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** Tek bir shimmer dikdörtgen */
function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const base = useThemeColor('skeleton');
  const highlight = useThemeColor('skeletonHighlight');

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [base, highlight],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bgColor },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Hazır iskelet kartı – ilanlar gibi liste öğeleri için
// ---------------------------------------------------------------------------
function ListingCardSkeleton() {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: surface, borderColor: border },
      ]}
    >
      <SkeletonBox width="100%" height={180} borderRadius={12} />
      <View style={styles.cardBody}>
        <SkeletonBox width="70%" height={16} />
        <SkeletonBox width="40%" height={14} style={{ marginTop: 8 }} />
        <View style={styles.cardFooter}>
          <SkeletonBox width={80} height={20} borderRadius={10} />
          <SkeletonBox width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------

export type LoadingVariant =
  | 'cards'   // ilan listesi gibi kart skeleton
  | 'rows'    // profil alanları gibi satır skeleton
  | 'detail'; // tek içerik detay skeleton

interface LoadingStateProps {
  variant?: LoadingVariant;
  count?: number;
}

/**
 * Bekleme ekranı — sayfa içeriği yüklenirken gösterilir.
 *
 * @example
 * // İlan listesi yükleniyor
 * <LoadingState variant="cards" count={3} />
 */
export function LoadingState({
  variant = 'cards',
  count = 3,
}: LoadingStateProps) {
  const bg = useThemeColor('background');

  if (variant === 'cards') {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        {Array.from({ length: count }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (variant === 'rows') {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.row}>
            <SkeletonBox width={40} height={40} borderRadius={20} />
            <View style={styles.rowLines}>
              <SkeletonBox width="60%" height={14} />
              <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // detail
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SkeletonBox width="100%" height={260} borderRadius={0} />
      <View style={styles.detailBody}>
        <SkeletonBox width="80%" height={22} />
        <SkeletonBox width="50%" height={18} style={{ marginTop: 10 }} />
        <SkeletonBox width="100%" height={14} style={{ marginTop: 20 }} />
        <SkeletonBox width="90%" height={14} style={{ marginTop: 8 }} />
        <SkeletonBox width="75%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  rowLines: {
    flex: 1,
    gap: 4,
  },
  detailBody: {
    padding: 16,
    gap: 4,
  },
});
