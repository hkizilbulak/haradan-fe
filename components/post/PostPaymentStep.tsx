import React, { useEffect } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostPaymentStepProps = {
  iframeUrl: string | null;
  error?: string | null;
};

/**
 * PayTR iframe checkout. On web embeds the hosted page; on native opens
 * the same URL in the system browser (PayTR redirects back to FE ok/fail URL).
 */
export function PostPaymentStep({ iframeUrl, error }: PostPaymentStepProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const errorColor = useThemeColor('error');

  useEffect(() => {
    if (Platform.OS === 'web' || !iframeUrl) return;
    void Linking.openURL(iframeUrl);
  }, [iframeUrl]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: text }]}>Ödeme</Text>
      <Text style={[styles.sub, { color: muted }]}>
        Güvenli ödeme PayTR altyapısı ile alınır. Ödeme tamamlanınca ilanınız
        otomatik olarak incelemeye gönderilir.
      </Text>
      {error ? (
        <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
      ) : null}
      {!iframeUrl ? (
        <Text style={{ color: muted }}>Ödeme ekranı hazırlanıyor…</Text>
      ) : Platform.OS === 'web' ? (
        <View style={[styles.frame, { borderColor: border }]}>
          {typeof document !== 'undefined' ? (
            <iframe
              src={iframeUrl}
              id="paytriframe"
              title="PayTR ödeme"
              style={{
                width: '100%',
                minHeight: 720,
                border: 0,
              }}
            />
          ) : null}
        </View>
      ) : (
        <Text style={{ color: muted, marginTop: 12 }}>
          Ödeme sayfası tarayıcınızda açıldı. İşlem bitince bu ekrana
          yönlendirileceksiniz.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  sub: { ...Typography.body, lineHeight: 22 },
  error: { ...Typography.body, fontWeight: '600' },
  frame: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 720,
  },
});
