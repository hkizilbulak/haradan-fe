import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { copyToClipboard } from '@/utils/copyToClipboard';
import { formatMoney } from '@/utils/formatMoney';
import { useAdvertLocation } from '@/services/location';
import type { AdvertDetail } from '@/types';

type AdvertShareModalProps = {
  visible: boolean;
  onClose: () => void;
  detail: AdvertDetail;
};

export function AdvertShareModal({
  visible,
  onClose,
  detail,
}: AdvertShareModalProps) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const textMuted = useThemeColor('textMuted');
  const primary = useThemeColor('primary');
  const location = useAdvertLocation(detail);

  const [copied, setCopied] = useState(false);
  const [instagramFeedback, setInstagramFeedback] = useState(false);

  const thumbUrl = detail.cover?.publicUrl || detail.gallery?.[0]?.publicUrl || null;

  useEffect(() => {
    if (!visible) {
      setCopied(false);
      setInstagramFeedback(false);
    }
  }, [visible]);

  // Construct absolute advert share URL
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/advert/${detail.id}`;
    }
    return `https://haradan.com/advert/${detail.id}`;
  }, [detail.id]);

  const shareText = useMemo(() => {
    const priceText = detail.price ? ` - ${formatMoney(detail.price)}` : '';
    return `${detail.title}${priceText} | Haradan`;
  }, [detail.title, detail.price]);

  // Handle Copy to Clipboard
  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareUrl]);

  // 1. WhatsApp Share
  const handleShareWhatsApp = useCallback(async () => {
    const textMsg = `${shareText}\n${shareUrl}`;
    const encoded = encodeURIComponent(textMsg);
    const webUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    const appUrl = `whatsapp://send?text=${encoded}`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      const can = await Linking.canOpenURL(appUrl);
      if (can) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  }, [shareText, shareUrl]);

  // 2. Facebook Share
  const handleShareFacebook = useCallback(async () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(fbUrl, '_blank', 'width=620,height=520,noopener,noreferrer');
      }
      return;
    }
    try {
      await Linking.openURL(fbUrl);
    } catch {
      // ignore
    }
  }, [shareUrl]);

  // 3. Twitter / X Share
  const handleShareTwitter = useCallback(async () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(twUrl, '_blank', 'width=620,height=520,noopener,noreferrer');
      }
      return;
    }
    try {
      await Linking.openURL(twUrl);
    } catch {
      // ignore
    }
  }, [shareText, shareUrl]);

  // 4. Instagram Share
  const handleShareInstagram = useCallback(async () => {
    await copyToClipboard(shareUrl);
    setInstagramFeedback(true);
    setTimeout(() => setInstagramFeedback(false), 4500);

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      const can = await Linking.canOpenURL('instagram://app');
      if (can) {
        await Linking.openURL('instagram://app');
      } else {
        await Linking.openURL('https://www.instagram.com');
      }
    } catch {
      await Linking.openURL('https://www.instagram.com');
    }
  }, [shareUrl]);

  // 5. Native Share (Cihazın Yerel Paylaşımı)
  const handleNativeShare = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: detail.title,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch {
          return;
        }
      }
    }

    try {
      await Share.share({
        title: detail.title,
        message: `${shareText}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // ignore
    }
  }, [detail.title, shareText, shareUrl]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Backdrop dismiss pressable */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: surface, borderColor: border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: text }]}>Paylaş</Text>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: `${textMuted}14` },
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
              ]}
            >
              <Ionicons name="close" size={17} color={text} />
            </Pressable>
          </View>

          {/* Tek Satır İlan Kartı */}
          <View style={[styles.previewCard, { borderColor: border, backgroundColor: `${textMuted}0A` }]}>
            {thumbUrl ? (
              <Image source={{ uri: thumbUrl }} style={styles.previewThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.previewThumbFallback, { backgroundColor: `${primary}18` }]}>
                <Ionicons name="image-outline" size={22} color={primary} />
              </View>
            )}
            <View style={styles.previewInfo}>
              <Text style={[styles.previewTitle, { color: text }]} numberOfLines={1}>
                {detail.title}
              </Text>
              <View style={styles.previewMetaRow}>
                {detail.price ? (
                  <Text style={[styles.previewPrice, { color: primary }]}>
                    {formatMoney(detail.price)}
                  </Text>
                ) : null}
                {location && location !== '-' && location.trim() !== '' ? (
                  <View style={styles.previewLocationRow}>
                    <Ionicons name="location-sharp" size={12} color={textMuted} />
                    <Text style={[styles.previewLocationText, { color: textMuted }]} numberOfLines={1}>
                      {location}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Instagram Feedback Banner (Zarif & Kompakt) */}
          {instagramFeedback ? (
            <View style={styles.feedbackBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.feedbackText}>
                Bağlantı kopyalandı. Instagram açılıyor...
              </Text>
            </View>
          ) : null}

          {/* Social Channels Row — Zarif Dairesel Butonlar (Kare yerine) */}
          <View style={styles.socialRow}>
            {/* WhatsApp */}
            <Pressable
              onPress={handleShareWhatsApp}
              accessibilityRole="button"
              accessibilityLabel="WhatsApp ile paylaş"
              style={({ pressed }) => [
                styles.circleItem,
                pressed && styles.circleItemPressed,
              ]}
            >
              <View style={[styles.circleIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
              </View>
              <Text style={[styles.circleLabel, { color: text }]}>WhatsApp</Text>
            </Pressable>

            {/* Facebook */}
            <Pressable
              onPress={handleShareFacebook}
              accessibilityRole="button"
              accessibilityLabel="Facebook'ta paylaş"
              style={({ pressed }) => [
                styles.circleItem,
                pressed && styles.circleItemPressed,
              ]}
            >
              <View style={[styles.circleIcon, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={24} color="#ffffff" />
              </View>
              <Text style={[styles.circleLabel, { color: text }]}>Facebook</Text>
            </Pressable>

            {/* Twitter / X */}
            <Pressable
              onPress={handleShareTwitter}
              accessibilityRole="button"
              accessibilityLabel="X'te paylaş"
              style={({ pressed }) => [
                styles.circleItem,
                pressed && styles.circleItemPressed,
              ]}
            >
              <View style={[styles.circleIcon, { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }]}>
                <Ionicons name="logo-twitter" size={21} color="#ffffff" />
              </View>
              <Text style={[styles.circleLabel, { color: text }]}>X</Text>
            </Pressable>

            {/* Instagram */}
            <Pressable
              onPress={handleShareInstagram}
              accessibilityRole="button"
              accessibilityLabel="Instagram'da paylaş"
              style={({ pressed }) => [
                styles.circleItem,
                pressed && styles.circleItemPressed,
              ]}
            >
              <View style={[styles.circleIcon, { backgroundColor: '#E1306C' }]}>
                <Ionicons name="logo-instagram" size={23} color="#ffffff" />
              </View>
              <Text style={[styles.circleLabel, { color: text }]}>Instagram</Text>
            </Pressable>

            {/* Diğer (Native OS) */}
            <Pressable
              onPress={handleNativeShare}
              accessibilityRole="button"
              accessibilityLabel="Diğer paylaşım seçenekleri"
              style={({ pressed }) => [
                styles.circleItem,
                pressed && styles.circleItemPressed,
              ]}
            >
              <View style={[styles.circleIcon, { backgroundColor: `${textMuted}20`, borderColor: border, borderWidth: 1 }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={text} />
              </View>
              <Text style={[styles.circleLabel, { color: text }]}>Diğer</Text>
            </Pressable>
          </View>

          {/* Ayraç */}
          <View style={[styles.divider, { backgroundColor: border }]} />

          {/* Bağlantıyı Kopyala — Minimalist Kapsül */}
          <View style={[styles.copyBar, { backgroundColor: `${textMuted}0E`, borderColor: border }]}>
            <Ionicons name="link-outline" size={16} color={textMuted} style={{ marginLeft: 12 }} />
            <Text style={[styles.copyUrlText, { color: textSecondary }]} numberOfLines={1}>
              {shareUrl}
            </Text>
            <Pressable
              onPress={handleCopyLink}
              accessibilityRole="button"
              accessibilityLabel="Bağlantıyı Kopyala"
              style={({ pressed }) => [
                styles.copyBtn,
                copied ? styles.copyBtnSuccess : { backgroundColor: `${primary}18`, borderColor: `${primary}35` },
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={14}
                color={copied ? '#ffffff' : primary}
              />
              <Text style={[styles.copyBtnText, { color: copied ? '#ffffff' : primary }]}>
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(6px)',
      } as any,
      default: {},
    }),
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  previewThumbFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  previewLocationText: {
    fontSize: 11.5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  circleItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 150ms ease, opacity 150ms ease',
      } as any,
      default: {},
    }),
  },
  circleItemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  circleLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  copyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    paddingRight: 4,
  },
  copyUrlText: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 150ms ease',
      } as any,
      default: {},
    }),
  },
  copyBtnSuccess: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
