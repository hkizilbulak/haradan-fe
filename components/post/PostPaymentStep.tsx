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

type PostPaymentStepProps = {
  iframeUrl: string | null;
  packageName?: string | null;
  amountMinor?: number | null;
  currencyCode?: string | null;
  error?: string | null;
  onRetry?: () => void;
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
  error,
  onRetry,
}: PostPaymentStepProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const errorColor = useThemeColor('error');
  const success = useThemeColor('success');

  useEffect(() => {
    if (Platform.OS === 'web' || !iframeUrl) return;
    void Linking.openURL(iframeUrl);
  }, [iframeUrl]);

  const amountLabel =
    amountMinor != null && amountMinor > 0
      ? formatMoney({ amountMinor, currency: currencyCode || 'TRY' })
      : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 4 · Ödeme</Text>
        <Text style={[styles.title, { color: text }]}>Ödeme Sayfası</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          Güvenli ödeme PayTR altyapısı ile alınır. Ödeme tamamlanınca ilanınız
          otomatik olarak incelemeye gönderilir.
        </Text>
      </View>

      {(packageName || amountLabel) && (
        <View style={[styles.summary, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: muted }]}>Paket</Text>
            <Text style={[styles.summaryValue, { color: text }]}>
              {packageName || 'İlan paketi'}
            </Text>
          </View>
          {amountLabel ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: muted }]}>Tutar</Text>
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

      {!iframeUrl && !error ? (
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
});
