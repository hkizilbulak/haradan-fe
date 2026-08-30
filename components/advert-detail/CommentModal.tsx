import React, { memo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';

type CommentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, rating?: number | null) => Promise<void>;
  isSubmitting: boolean;
};

const RATING_LABELS: Record<number, string> = {
  1: 'Çok Kötü (1/5)',
  2: 'Kötü (2/5)',
  3: 'Orta (3/5)',
  4: 'İyi (4/5)',
  5: 'Mükemmel (5/5)',
};

export const CommentModal = memo(function CommentModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: CommentModalProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const background = useThemeColor('background');
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const warning = useThemeColor('warning');

  const handleClose = () => {
    setContent('');
    setRating(null);
    setErrorMessage(null);
    onClose();
  };

  const handlePublish = async () => {
    const trimmed = content.trim();
    if (!trimmed && rating === null) {
      setErrorMessage('Lütfen bir yorum yazınız veya puan veriniz.');
      return;
    }
    if (trimmed.length > 1000) {
      setErrorMessage('Yorum en fazla 1000 karakter olabilir.');
      return;
    }

    setErrorMessage(null);
    try {
      await onSubmit(trimmed, rating);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Yorum gönderilirken bir hata oluştu.';
      setErrorMessage(msg);
    }
  };

  const handleStarPress = (starIndex: number) => {
    // If clicking same star again, toggle off
    if (rating === starIndex) {
      setRating(null);
    } else {
      setRating(starIndex);
    }
    if (errorMessage) setErrorMessage(null);
  };

  const canSubmit = Boolean(content.trim() || rating !== null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: background, borderColor: border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: text }]}>İlana Yorum ve Puan Yaz</Text>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={text} />
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: textMuted }]}>
            Yorumunuz ve puanınız admin onayından sonra yayınlanacaktır. Lütfen nezaket kurallarına dikkat ediniz.
          </Text>

          {/* Yıldız Puanlama Bölümü */}
          <View style={[styles.ratingBox, { borderColor: border, backgroundColor: background }]}>
            <Text style={[styles.ratingLabel, { color: text }]}>Puanınız (İsteğe Bağlı):</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (rating ?? 0) >= star;
                return (
                  <Pressable
                    key={star}
                    onPress={() => handleStarPress(star)}
                    hitSlop={6}
                    style={styles.starTouch}
                    accessibilityRole="button"
                    accessibilityLabel={`${star} Yıldız`}
                  >
                    <Ionicons
                      name={filled ? 'star' : 'star-outline'}
                      size={28}
                      color={filled ? warning : textMuted}
                    />
                  </Pressable>
                );
              })}
              {rating !== null ? (
                <Text style={[styles.ratingText, { color: warning }]}>
                  {RATING_LABELS[rating]}
                </Text>
              ) : (
                <Text style={[styles.ratingHint, { color: textMuted }]}>
                  Seçmek için dokunun
                </Text>
              )}
            </View>
          </View>

          {errorMessage ? (
            <View style={[styles.errorBox, { borderColor: errorColor }]}>
              <Ionicons name="alert-circle" size={16} color={errorColor} style={{ marginRight: 6 }} />
              <Text style={[styles.errorText, { color: errorColor }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <TextInput
            style={[
              styles.input,
              { color: text, borderColor: border, backgroundColor: background },
            ]}
            placeholder="İlan hakkındaki düşüncelerinizi buraya yazabilirsiniz (isteğe bağlı)..."
            placeholderTextColor={textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            value={content}
            onChangeText={(txt) => {
              setContent(txt);
              if (errorMessage) setErrorMessage(null);
            }}
          />

          <View style={styles.footer}>
            <Text style={[styles.counter, { color: textMuted }]}>
              {content.trim().length} / 1000
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleClose}
                disabled={isSubmitting}
                style={[styles.cancelBtn, { borderColor: border }]}
              >
                <Text style={[styles.cancelText, { color: text }]}>Vazgeç</Text>
              </Pressable>

              <Pressable
                onPress={handlePublish}
                disabled={isSubmitting || !canSubmit}
                style={[
                  styles.submitBtn,
                  { backgroundColor: primary, opacity: isSubmitting || !canSubmit ? 0.6 : 1 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitText}>Yayınla</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  ratingBox: {
    padding: Spacing.sm,
    borderRadius: Radius.input,
    borderWidth: 1,
    gap: 6,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  starTouch: {
    padding: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  ratingHint: {
    fontSize: 12,
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: Radius.input,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.input,
    padding: Spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  counter: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: Radius.input,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.input,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

