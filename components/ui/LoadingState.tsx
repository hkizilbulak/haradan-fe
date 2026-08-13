import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Skeleton, SkeletonPulse } from './Skeleton';

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
      <Skeleton width="100%" height={180} borderRadius={12} />
      <View style={styles.cardBody}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
        <View style={styles.cardFooter}>
          <Skeleton width={80} height={20} borderRadius={10} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

export type LoadingVariant =
  | 'cards'
  | 'rows'
  | 'detail';

interface LoadingStateProps {
  variant?: LoadingVariant;
  count?: number;
}

/**
 * Bekleme ekranı — sayfa içeriği yüklenirken gösterilir.
 */
export function LoadingState({
  variant = 'cards',
  count = 3,
}: LoadingStateProps) {
  const bg = useThemeColor('background');

  return (
    <SkeletonPulse>
      {variant === 'cards' ? (
        <View style={[styles.container, { backgroundColor: bg }]}>
          {Array.from({ length: count }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </View>
      ) : variant === 'rows' ? (
        <View style={[styles.container, { backgroundColor: bg }]}>
          {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={styles.row}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.rowLines}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.container, { backgroundColor: bg }]}>
          <Skeleton width="100%" height={260} borderRadius={0} />
          <View style={styles.detailBody}>
            <Skeleton width="80%" height={22} />
            <Skeleton width="50%" height={18} style={{ marginTop: 10 }} />
            <Skeleton width="100%" height={14} style={{ marginTop: 20 }} />
            <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
            <Skeleton width="75%" height={14} style={{ marginTop: 8 }} />
          </View>
        </View>
      )}
    </SkeletonPulse>
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
