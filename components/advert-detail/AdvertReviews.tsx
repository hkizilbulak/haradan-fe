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
import { useAuthSession } from '@/hooks/useAuthSession';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { AdvertComment, AdvertDetail, AdvertReview } from '@/types';
import { toast } from '@/components/ui';
import { CommentModal } from './CommentModal';
import { DeleteCommentModal } from './DeleteCommentModal';

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
  previewCount = 10,
}: AdvertReviewsProps) {
  const router = useRouter();
  const { session } = useAuthSession();
  const currentUserId = session?.user.id ?? null;
  const [showAll, setShowAll] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const textSecondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const surface = useThemeColor('surface');
  const warning = useThemeColor('warning');
  const primary = useThemeColor('primary');
  const errorColor = useThemeColor('error');

  const {
    comments,
    totalCount,
    isLoading,
    isSubmitting,
    postComment,
    deleteComment,
  } = useAdvertComments(detail.id);

  const handleOpenCommentModal = useCallback(() => {
    if (!accessToken) {
      toast.warning('Yorum yapabilmek için lütfen giriş yapınız.', 'Oturum Gerekli');
      router.push(`/auth/login?next=/advert/${detail.id}`);
      return;
    }
    setModalVisible(true);
  }, [accessToken, router, detail.id]);

  const handleSubmitComment = useCallback(
    async (content: string, rating?: number | null) => {
      if (!accessToken) return;
      try {
        await postComment(content, accessToken, rating);
        toast.success('Yorumunuz başarıyla gönderildi.');
      } catch (err: any) {
        toast.error(err?.message || 'Yorum gönderilemedi.', 'Hata');
      }
    },
    [accessToken, postComment]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!accessToken || !targetDeleteId) return;

    setIsDeleting(true);
    try {
      await deleteComment(targetDeleteId, accessToken);
      toast.success('Yorum silindi.');
      setTargetDeleteId(null);
    } catch (err: any) {
      const msg = err?.message || 'Yorum silinemedi.';
      toast.error(msg, 'Hata');
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, targetDeleteId, deleteComment]);

  // Calculate rating stats from live comments if advert detail doesn't have rating
  const { effectiveRating, effectiveReviewCount, ratingBreakdown } = useMemo(() => {
    const ratedComments = comments.filter(
      (c) => typeof c.rating === 'number' && c.rating >= 1 && c.rating <= 5
    );

    if (detail.rating && detail.rating > 0) {
      return {
        effectiveRating: detail.rating,
        effectiveReviewCount: detail.reviewCount || (detail.ratingBreakdown || []).reduce((s, r) => s + r.count, 0),
        ratingBreakdown: detail.ratingBreakdown || [],
      };
    }

    if (ratedComments.length > 0) {
      const sum = ratedComments.reduce((acc, c) => acc + (c.rating ?? 0), 0);
      const avg = sum / ratedComments.length;
      const breakdown: { stars: 1 | 2 | 3 | 4 | 5; count: number }[] = [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
      ];
      for (const c of ratedComments) {
        const s = Math.min(5, Math.max(1, Math.round(c.rating || 0))) as 1 | 2 | 3 | 4 | 5;
        const found = breakdown.find((b) => b.stars === s);
        if (found) found.count++;
      }
      return {
        effectiveRating: avg,
        effectiveReviewCount: ratedComments.length,
        ratingBreakdown: breakdown,
      };
    }

    return {
      effectiveRating: 0,
      effectiveReviewCount: 0,
      ratingBreakdown: [],
    };
  }, [comments, detail.rating, detail.reviewCount, detail.ratingBreakdown]);

  const totalReviews = useMemo(
    () => ratingBreakdown.reduce((s, r) => s + r.count, 0) || effectiveReviewCount || 1,
    [ratingBreakdown, effectiveReviewCount]
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
          accessibilityLabel="Yorum ve puan yaz"
        >
          <Ionicons name="create-outline" size={15} color={text} />
          <Text style={[styles.leaveText, { color: text }]}>Yorum ve Puan Yaz</Text>
        </Pressable>
      </View>

      {/* Değerlendirme Puan Özeti (Var ise) */}
      {effectiveRating > 0 ? (
        <View style={styles.summaryRow}>
          <View style={[styles.scoreBox, { backgroundColor: background }]}>
            <Text style={[styles.score, { color: text }]}>
              {effectiveRating.toFixed(1)}
            </Text>
            <RatingStars value={effectiveRating} size={14} />
            <Text style={[styles.scoreMeta, { color: textMuted }]}>
              {effectiveReviewCount} değerlendirme
            </Text>
          </View>

          {ratingBreakdown && ratingBreakdown.length > 0 ? (
            <View style={styles.bars}>
              {ratingBreakdown.map((row) => (
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
          <ActivityIndicator color={primary} />
          <Text style={[styles.loadingText, { color: textMuted }]}>
            Yorumlar yükleniyor...
          </Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: border }]}>
          <Ionicons name="chatbubbles-outline" size={32} color={textMuted} />
          <Text style={[styles.emptyTitle, { color: text }]}>Henüz yorum yapılmamış</Text>
          <Text style={[styles.emptyDesc, { color: textMuted }]}>
            Bu ilan hakkında soru sormak veya puan/düşüncenizi paylaşmak için ilk yorumu yazabilirsiniz.
          </Text>
          <Pressable
            onPress={handleOpenCommentModal}
            style={[styles.emptyBtn, { backgroundColor: primary }]}
          >
            <Text style={styles.emptyBtnText}>İlk Yorum ve Puanı Yaz</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleComments.map((cmt) => (
            <CommentCard
              key={cmt.id}
              comment={cmt}
              currentUserId={currentUserId}
              onDelete={() => setTargetDeleteId(cmt.id)}
              text={text}
              textMuted={textMuted}
              border={border}
              errorColor={errorColor}
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
          style={[styles.seeAllBtn, { borderColor: border, backgroundColor: surface }]}
          accessibilityRole="button"
          accessibilityLabel={
            showAll ? 'Daha az göster' : 'Tüm yorumları gör'
          }
        >
          <Text style={[styles.seeAllText, { color: text }]}>
            {showAll
              ? 'Daha az yorum göster'
              : `Tüm yorumları gör (${comments.length})`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={primary}
          />
        </Pressable>
      ) : null}

      <CommentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmitting}
      />

      <DeleteCommentModal
        visible={Boolean(targetDeleteId)}
        onClose={() => !isDeleting && setTargetDeleteId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </View>
  );
});

function CommentCard({
  comment,
  currentUserId,
  onDelete,
  text,
  textMuted,
  border,
  errorColor,
}: {
  comment: AdvertComment;
  currentUserId?: string | null;
  onDelete?: () => void;
  text: string;
  textMuted: string;
  border: string;
  errorColor: string;
}) {
  const isMine = Boolean(currentUserId && comment.userId === currentUserId);

  return (
    <View style={[styles.review, { borderBottomColor: border }]}>
      <View style={styles.reviewHead}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'K'}
            </Text>
          </View>
          <Text style={[styles.author, { color: text }]}>
            {comment.authorName} {isMine ? '(Siz)' : ''}
          </Text>
        </View>
        <View style={styles.headRightRow}>
          <Text style={[styles.date, { color: textMuted }]}>
            {formatDate(comment.createdAt)}
          </Text>
          {isMine && onDelete ? (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && styles.deleteBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Yorumumu sil"
            >
              <Ionicons name="trash-outline" size={13} color={errorColor} />
              <Text style={[styles.deleteBtnText, { color: errorColor }]}>Sil</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {comment.rating ? (
        <RatingStars value={comment.rating} size={13} />
      ) : null}
      {comment.content && comment.content.trim() ? (
        <Text style={[styles.body, { color: text }]}>{comment.content}</Text>
      ) : null}
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
  wrap: { gap: Spacing.lg, marginTop: Spacing.xl, paddingBottom: Spacing.xl },
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
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.input,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  headRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(243, 71, 112, 0.08)',
  },
  deleteBtnActive: {
    backgroundColor: 'rgba(243, 71, 112, 0.18)',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
