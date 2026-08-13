import React, { memo, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from '@/components/product/RatingStars';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertDetail, AdvertReview } from '@/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AdvertReviewsProps = {
  detail: AdvertDetail;
  previewCount?: number;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export const AdvertReviews = memo(function AdvertReviews({
  detail,
  previewCount = 2,
}: AdvertReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const warning = useThemeColor('warning');
  const header = useThemeColor('header');
  const success = useThemeColor('success');

  const total = useMemo(
    () => detail.ratingBreakdown.reduce((s, r) => s + r.count, 0) || 1,
    [detail.ratingBreakdown]
  );

  const visible = showAll
    ? detail.reviews
    : detail.reviews.slice(0, previewCount);

  const hasMore = detail.reviews.length > previewCount;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: text }]}>Değerlendirmeler</Text>
        <Pressable style={[styles.leaveBtn, { borderColor: border }]}>
          <Ionicons name="create-outline" size={14} color={text} />
          <Text style={[styles.leaveText, { color: text }]}>Yorum yaz</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.scoreBox, { backgroundColor: background }]}>
          <Text style={[styles.score, { color: text }]}>
            {detail.rating.toFixed(1)}
          </Text>
          <RatingStars value={detail.rating} size={14} />
          <Text style={[styles.scoreMeta, { color: textMuted }]}>
            {detail.reviewCount || total} değerlendirme
          </Text>
        </View>

        <View style={styles.bars}>
          {detail.ratingBreakdown.map((row) => (
            <View key={row.stars} style={styles.barRow}>
              <Text style={[styles.barLabel, { color: textMuted }]}>
                {row.stars}
              </Text>
              <Ionicons name="star" size={11} color={warning} />
              <View style={[styles.barTrack, { backgroundColor: border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: warning,
                      width: `${Math.round((row.count / total) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barCount, { color: textMuted }]}>
                {row.count}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.list}>
        {visible.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            text={text}
            textMuted={textMuted}
            border={border}
            success={success}
          />
        ))}
      </View>

      {hasMore ? (
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowAll((v) => !v);
          }}
          style={styles.seeAll}
          accessibilityRole="button"
          accessibilityLabel={
            showAll ? 'Daha az göster' : 'Tüm değerlendirmeleri gör'
          }
        >
          <Text style={[styles.seeAllText, { color: header }]}>
            {showAll
              ? 'Daha az göster'
              : `Tüm değerlendirmeleri gör (${detail.reviews.length})`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-forward'}
            size={14}
            color={header}
          />
        </Pressable>
      ) : null}
    </View>
  );
});

function ReviewCard({
  review,
  text,
  textMuted,
  border,
  success,
}: {
  review: AdvertReview;
  text: string;
  textMuted: string;
  border: string;
  success: string;
}) {
  return (
    <View style={[styles.review, { borderBottomColor: border }]}>
      <View style={styles.reviewHead}>
        <View style={styles.authorRow}>
          <Text style={[styles.author, { color: text }]}>{review.author}</Text>
          {review.verified ? (
            <Ionicons name="checkmark-circle" size={14} color={success} />
          ) : null}
        </View>
        <Text style={[styles.date, { color: textMuted }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>
      <RatingStars value={review.rating} size={12} />
      <Text style={[styles.body, { color: text }]}>{review.body}</Text>
      <Text style={[styles.pros, { color: text }]}>
        Artılar: <Text style={{ fontWeight: '400' }}>{review.pros}</Text>
      </Text>
      <Text style={[styles.pros, { color: text }]}>
        Eksiler: <Text style={{ fontWeight: '400' }}>{review.cons}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg, marginTop: Spacing.xl },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveText: { fontSize: 12, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  scoreBox: {
    width: 140,
    borderRadius: Radius.card,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  score: { fontSize: 36, fontWeight: '700' },
  scoreMeta: { fontSize: 11, textAlign: 'center' },
  bars: { flex: 1, minWidth: 200, gap: 8, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 12, fontSize: 12, fontWeight: '600' },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  barCount: { width: 24, fontSize: 11, textAlign: 'right' },
  list: { gap: 4 },
  review: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  author: { fontWeight: '700', fontSize: 14 },
  date: { fontSize: 12 },
  body: { fontSize: 14, lineHeight: 21 },
  pros: { fontSize: 13, fontWeight: '700' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '600' },
});
