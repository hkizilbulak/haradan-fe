import React, { useEffect } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@/utils/formatMoney';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

import type { CouponValidationResult } from '@/types/coupon';

type PostPaymentStepProps = {
  iframeUrl: string | null;
  packageName?: string | null;
  amountMinor?: number | null;
  currencyCode?: string | null;
  appliedCoupon?: CouponValidationResult | null;
  error?: string | null;
  onRetry?: () => void;
  onSuccessClick?: () => void;
};

/**
 * PayTR iframe checkout — mirrors legacy post-ad/payment step.
 * Web: embeds hosted PayTR page. Native: opens system browser.
 */
export function PostPaymentStep({
  iframeUrl,
  packageName,
  amountMinor,
  currencyCode = 'TRY',
  appliedCoupon,
  error,
  onRetry,
  onSuccessClick,
}: PostPaymentStepProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const primary = useThemeColor('primary');
  const errorColor = useThemeColor('error');
  const success = useThemeColor('success');
  const successLight = useThemeColor('successLight');

  useEffect(() => {
    if (Platform.OS === 'web' || !iframeUrl) return;
    void Linking.openURL(iframeUrl);
  }, [iframeUrl]);

  const isFreeWithCoupon = amountMinor === 0;

  const amountLabel =
    amountMinor != null && amountMinor > 0
      ? formatMoney({ amountMinor, currency: currencyCode || 'TRY' })
      : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 4 · Ödeme</Text>
        <Text style={[styles.title, { color: text }]}>
          {isFreeWithCoupon ? 'İlanınız Onaylandı' : 'Ödeme Sayfası'}
        </Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {isFreeWithCoupon
            ? 'Kuponunuz sayesinde bu paket için herhangi bir ücret ödemeniz gerekmemektedir.'
            : 'Güvenli ödeme PayTR altyapısı ile alınır. Ödeme tamamlanınca ilanınız otomatik olarak incelemeye gönderilir.'}
        </Text>
      </View>

      {/* 100% Free Coupon Card */}
      {isFreeWithCoupon ? (
        <View style={[styles.freeSuccessCard, { backgroundColor: successLight, borderColor: success }]}>
          <Ionicons name="checkmark-circle" size={48} color={success} />
          <Text style={[styles.freeSuccessTitle, { color: text }]}>
            %100 Kupon İndirimi Uygulandı!
          </Text>
          <Text style={[styles.freeSuccessDesc, { color: secondary }]}>
            {packageName ? `${packageName} paketi ` : ''}ücretsiz olarak hesabınıza tanımlandı ve ilanınız incelemeye gönderildi.
          </Text>
          {onSuccessClick ? (
            <Pressable
              onPress={onSuccessClick}
              style={[styles.continueBtn, { backgroundColor: primary }]}
              accessibilityRole="button"
            >
              <Text style={styles.continueBtnText}>İlan Özetime Git</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {(packageName || amountLabel) && !isFreeWithCoupon && (
        <View style={[styles.summary, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: muted }]}>Paket</Text>
            <Text style={[styles.summaryValue, { color: text }]}>
              {packageName || 'İlan paketi'}
            </Text>
          </View>
          {appliedCoupon?.valid && appliedCoupon.coupon ? (
            <View style={styles.summaryRow}>
              <View style={styles.couponBadgeRow}>
                <Ionicons name="ticket" size={15} color={success} />
                <Text style={[styles.summaryLabel, { color: success, fontWeight: '600' }]}>
                  Kupon İndirimi ({appliedCoupon.coupon.code})
                </Text>
              </View>
              <Text style={[styles.summaryDiscountValue, { color: success }]}>
                -{formatMoney({ amountMinor: appliedCoupon.discountAmountMinor, currency: currencyCode || 'TRY' })}
              </Text>
            </View>
          ) : null}
          {amountLabel ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: muted }]}>Ödenecek Tutar</Text>
              <Text style={[styles.summaryAmount, { color: text }]}>
                {amountLabel}
              </Text>
            </View>
          ) : null}
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark" size={16} color={success} />
            <Text style={[styles.secureText, { color: secondary }]}>
              256-bit SSL · Kart bilgileriniz PayTR’da işlenir
            </Text>
          </View>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} accessibilityRole="button">
              <Text style={[styles.retry, { color: text }]}>Tekrar dene</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!iframeUrl && !error && !isFreeWithCoupon ? (
        <Text style={{ color: muted }}>Ödeme ekranı hazırlanıyor…</Text>
      ) : null}

      {iframeUrl && Platform.OS === 'web' ? (
        <View style={[styles.frame, { borderColor: border }]}>
          {typeof document !== 'undefined' ? (
            <iframe
              src={iframeUrl}
              id="paytriframe"
              title="PayTR ödeme"
              frameBorder={0}
              scrolling="no"
              style={{
                width: '100%',
                minHeight: 720,
                border: 0,
              }}
            />
          ) : null}
        </View>
      ) : null}

      {iframeUrl && Platform.OS !== 'web' ? (
        <View style={[styles.nativeHint, { borderColor: border, backgroundColor: surface }]}>
          <Ionicons name="open-outline" size={20} color={text} />
          <Text style={{ color: muted, flex: 1, lineHeight: 20 }}>
            Ödeme sayfası tarayıcınızda açıldı. İşlem bitince bu uygulamaya
            yönlendirileceksiniz.
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(iframeUrl)}
            accessibilityRole="button"
            accessibilityLabel="Ödeme sayfasını tekrar aç"
          >
            <Text style={{ color: text, fontWeight: '700' }}>Aç</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md, paddingBottom: 24 },
  intro: { gap: 6 },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  lead: { ...Typography.body, lineHeight: 22 },
  summary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: { ...Typography.body },
  summaryValue: { ...Typography.body, fontWeight: '600' },
  summaryAmount: { fontSize: 18, fontWeight: '700' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  secureText: { fontSize: 12, lineHeight: 16, flex: 1 },
  errorBox: { gap: 8 },
  error: { ...Typography.body, fontWeight: '600' },
  retry: { fontWeight: '700', textDecorationLine: 'underline' },
  frame: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.card,
    overflow: 'hidden',
    minHeight: 720,
  },
  nativeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.card,
    padding: Spacing.md,
  },
  couponBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDiscountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  freeSuccessCard: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  freeSuccessTitle: {
    ...Typography.h2,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  freeSuccessDesc: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 22,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  continueBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
