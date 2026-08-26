import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonPulse } from '@/components/ui/Skeleton';
import {
  HOME_DESKTOP_BREAKPOINT,
  mobileDetailScrollInset,
} from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';
import { useSafeInsets } from '@/hooks/useSafeInsets';

type AdvertDetailSkeletonProps = {
  variant?: 'default' | 'mobile';
};

export function AdvertDetailSkeleton({
  variant = 'default',
}: AdvertDetailSkeletonProps) {
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;
  const isMobile = variant === 'mobile' || !isWide;
  const safeInsets = useSafeInsets();
  const mobileScrollPad = mobileDetailScrollInset(safeInsets.bottom);

  if (isMobile) {
    const galleryH = Math.min(Math.round(width * 0.78), 420);
    return (
      <SkeletonPulse>
        <Skeleton width="100%" height={galleryH} borderRadius={0} />
        <View style={styles.mobilePad}>
          <Skeleton width={100} height={10} borderRadius={5} />
          <Skeleton
            width="92%"
            height={24}
            borderRadius={8}
            style={{ marginTop: 12 }}
          />
          <Skeleton
            width={140}
            height={28}
            borderRadius={8}
            style={{ marginTop: 12 }}
          />
          <Skeleton
            width="60%"
            height={12}
            borderRadius={6}
            style={{ marginTop: 10 }}
          />
          <Skeleton
            width="100%"
            height={36}
            borderRadius={8}
            style={{ marginTop: 20 }}
          />
          <Skeleton
            width="100%"
            height={120}
            borderRadius={12}
            style={{ marginTop: 24 }}
          />
          <Skeleton
            width="100%"
            height={200}
            borderRadius={12}
            style={{ marginTop: 24 }}
          />
        </View>
        <View style={{ height: mobileScrollPad }} />
      </SkeletonPulse>
    );
  }

  return (
    <SkeletonPulse>
      <Skeleton width={220} height={12} borderRadius={6} />
      <Skeleton width="70%" height={28} borderRadius={8} style={{ marginTop: 12 }} />
      <Skeleton width="40%" height={14} borderRadius={6} style={{ marginTop: 16 }} />

      <View style={[styles.hero, !isWide && styles.heroMobile]}>
        <View style={styles.gallery}>
          <Skeleton width="100%" height={isWide ? 420 : 300} borderRadius={16} />
          <View style={styles.thumbs}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width={72} height={72} borderRadius={12} />
            ))}
          </View>
        </View>
        <View style={styles.buy}>
          <Skeleton width={120} height={12} borderRadius={6} />
          <View style={styles.opts}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width={72} height={40} borderRadius={8} />
            ))}
          </View>
          <Skeleton width={160} height={28} borderRadius={8} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={44} borderRadius={8} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={120} borderRadius={12} style={{ marginTop: 16 }} />
        </View>
      </View>

      <Skeleton width="100%" height={220} borderRadius={16} style={{ marginTop: 32 }} />
      <Skeleton width={200} height={24} borderRadius={8} style={{ marginTop: 32 }} />
      <Skeleton width="100%" height={160} borderRadius={12} style={{ marginTop: 16 }} />
    </SkeletonPulse>
  );
}

const styles = StyleSheet.create({
  mobilePad: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
  },
  heroMobile: { flexDirection: 'column' },
  gallery: { flex: 1.15, gap: 12 },
  thumbs: { flexDirection: 'row', gap: 10 },
  buy: { flex: 0.85, gap: 10 },
  opts: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
