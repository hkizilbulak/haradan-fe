import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RatingStars } from '@/components/product/RatingStars';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useAdvertComments } from '@/hooks/useAdvertComments';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertComment, AdvertDetail, AdvertReview } from '@/types';
import { CommentModal } from './CommentModal';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AdvertReviewsProps = {
  detail: AdvertDetail;
  accessToken?: string | null;
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
  accessToken,
  previewCount = 3,
}: AdvertReviewsProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const warning = useThemeColor('warning');
  const header = useThemeColor('header');

  const {
    comments,
    totalCount,
    isLoading,
    isSubmitting,
    postComment,
  } = useAdvertComments(detail.id);

  const handleOpenCommentModal = useCallback(() => {
    if (!accessToken) {
      if (Platform.OS === 'web') {
        if (window.confirm('Yorum yapabilmek için giriş yapmalısınız. Giriş sayfasına yönlendirilsin mi?')) {
          router.push('/auth/login');
        }
      } else {
        Alert.alert(
          'Oturum Gerekli',
          'Yorum yapabilmek için lütfen giriş yapınız.',
          [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Giriş Yap', onPress: () => router.push('/auth/login') },
          ]
        );
      }
      return;
    }
    setModalVisible(true);
  }, [accessToken, router]);

  const handleSubmitComment = useCallback(
    async (content: string) => {
      if (!accessToken) return;
      await postComment(content, accessToken);
    },
    [accessToken, postComment]
  );

  const totalReviews = useMemo(
    () => (detail.ratingBreakdown || []).reduce((s, r) => s + r.count, 0) || 1,
    [detail.ratingBreakdown]
  );

  const visibleComments = showAll ? comments : comments.slice(0, previewCount);
  const hasMoreComments = comments.length > previewCount;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: text }]}>Yorumlar ve Değerlendirmeler</Text>
          {totalCount > 0 ? (
            <View style={[styles.countBadge, { backgroundColor: border }]}>
              <Text style={[styles.countText, { color: text }]}>{totalCount}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={handleOpenCommentModal}
          style={[styles.leaveBtn, { borderColor: border, backgroundColor: background }]}
          accessibilityRole="button"
          accessibilityLabel="Yorum yaz"
        >
          <Ionicons name="create-outline" size={15} color={text} />
          <Text style={[styles.leaveText, { color: text }]}>Yorum yaz</Text>
        </Pressable>
      </View>

      {/* Değerlendirme Puan Özeti (Var ise) */}
      {detail.rating ? (
        <View style={styles.summaryRow}>
          <View style={[styles.scoreBox, { backgroundColor: background }]}>
            <Text style={[styles.score, { color: text }]}>
              {detail.rating.toFixed(1)}
            </Text>
            <RatingStars value={detail.rating} size={14} />
            <Text style={[styles.scoreMeta, { color: textMuted }]}>
              {detail.reviewCount || totalReviews} değerlendirme
            </Text>
          </View>

          {detail.ratingBreakdown && detail.ratingBreakdown.length > 0 ? (
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
                          width: `${Math.round((row.count / totalReviews) * 100)}%`,
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
          ) : null}
        </View>
      ) : null}

      {/* Canlı Yorum Listesi */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: text }]}>Kullanıcı Yorumları</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={header} />
          <Text style={[styles.loadingText, { color: textMuted }]}>
            Yorumlar yükleniyor...
          </Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: border }]}>
          <Ionicons name="chatbubbles-outline" size={32} color={textMuted} />
          <Text style={[styles.emptyTitle, { color: text }]}>Henüz yorum yapılmamış</Text>
          <Text style={[styles.emptyDesc, { color: textMuted }]}>
            Bu ilan hakkında soru sormak veya düşüncənizi paylaşmak için ilk yorumu yazabilirsiniz.
          </Text>
          <Pressable
            onPress={handleOpenCommentModal}
            style={[styles.emptyBtn, { backgroundColor: header }]}
          >
            <Text style={styles.emptyBtnText}>İlk Yorumu Yaz</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleComments.map((cmt) => (
            <CommentCard
              key={cmt.id}
              comment={cmt}
              text={text}
              textMuted={textMuted}
              border={border}
            />
          ))}

          {/* Statik/Örnek İncelemeler var ise alt kısımda listele */}
          {detail.reviews && detail.reviews.length > 0 ? (
            detail.reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                text={text}
                textMuted={textMuted}
                border={border}
              />
            ))
          ) : null}
        </View>
      )}

      {hasMoreComments ? (
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowAll((v) => !v);
          }}
          style={styles.seeAll}
          accessibilityRole="button"
          accessibilityLabel={
            showAll ? 'Daha az göster' : 'Tüm yorumları gör'
          }
        >
          <Text style={[styles.seeAllText, { color: header }]}>
            {showAll
              ? 'Daha az göster'
              : `Tüm yorumları gör (${comments.length})`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-forward'}
            size={14}
            color={header}
          />
        </Pressable>
      ) : null}

      <CommentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmitting}
      />
    </View>
  );
});

function CommentCard({
  comment,
  text,
  textMuted,
  border,
}: {
  comment: AdvertComment;
  text: string;
  textMuted: string;
  border: string;
}) {
  return (
    <View style={[styles.review, { borderBottomColor: border }]}>
      <View style={styles.reviewHead}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'K'}
            </Text>
          </View>
          <Text style={[styles.author, { color: text }]}>{comment.authorName}</Text>
        </View>
        <Text style={[styles.date, { color: textMuted }]}>
          {formatDate(comment.createdAt)}
        </Text>
      </View>
      <Text style={[styles.body, { color: text }]}>{comment.content}</Text>
    </View>
  );
}

function ReviewCard({
  review,
  text,
  textMuted,
  border,
}: {
  review: AdvertReview;
  text: string;
  textMuted: string;
  border: string;
}) {
  return (
    <View style={[styles.review, { borderBottomColor: border }]}>
      <View style={styles.reviewHead}>
        <View style={styles.authorRow}>
          <Text style={[styles.author, { color: text }]}>{review.author}</Text>
        </View>
        <Text style={[styles.date, { color: textMuted }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>
      {review.rating ? <RatingStars value={review.rating} size={12} /> : null}
      <Text style={[styles.body, { color: text }]}>{review.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg, marginTop: Spacing.xl },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  countText: { fontSize: 12, fontWeight: '700' },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  leaveText: { fontSize: 13, fontWeight: '600' },
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
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.input,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
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
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  author: { fontWeight: '700', fontSize: 14 },
  date: { fontSize: 12 },
  body: { fontSize: 14, lineHeight: 21 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: Spacing.xs },
  seeAllText: { fontSize: 13, fontWeight: '600' },
});
