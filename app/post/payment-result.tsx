import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getValidAccessToken } from '@/services/auth';
import {
  listingRepository,
  setListingWizardState,
} from '@/services/listing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { parseAdvertId } from '@/types/advertId';
import { Typography } from '@/constants/Typography';

/**
 * PayTR merchant_ok_url / merchant_fail_url landing.
 * Polls charge status until SUCCEEDED (submit happens server-side on notify).
 */
export default function PaymentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    status?: string;
    advertId?: string;
    merchantOid?: string;
  }>();
  const { isLoggedIn } = useAuthSession();
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const errorColor = useThemeColor('error');
  const [message, setMessage] = useState('Ödeme sonucu kontrol ediliyor…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const advertId = parseAdvertId(params.advertId);
    const merchantOid = String(params.merchantOid ?? '');
    const statusParam = String(params.status ?? '');

    async function run() {
      if (advertId == null || !merchantOid) {
        setFailed(true);
        setMessage('Ödeme sonucu doğrulanamadı.');
        return;
      }
      if (statusParam === 'fail') {
        setFailed(true);
        setMessage('Ödeme tamamlanamadı. Paket adımından tekrar deneyebilirsiniz.');
        setListingWizardState((prev) => ({
          ...prev,
          step: 'package',
          paytrIframeUrl: null,
          paytrMerchantOid: null,
        }));
        return;
      }
      if (!isLoggedIn) {
        router.replace(`/auth/login?next=/post/payment-result?status=ok&advertId=${advertId}&merchantOid=${merchantOid}`);
        return;
      }
      if (!listingRepository.getPaytrChargeStatus) {
        setListingWizardState((prev) => ({
          ...prev,
          submittedDraftId: advertId,
          submittedStatus: 'PENDING_REVIEW',
          step: 'review',
        }));
        router.replace('/post');
        return;
      }

      const token = await getValidAccessToken();
      if (!token) {
        router.replace('/auth/login?next=/post');
        return;
      }

      for (let i = 0; i < 40; i += 1) {
        if (cancelled) return;
        try {
          const charge = await listingRepository.getPaytrChargeStatus!(
            advertId,
            merchantOid,
            token
          );
          if (charge.status === 'SUCCEEDED') {
            setListingWizardState((prev) => ({
              ...prev,
              submittedDraftId: advertId,
              submittedStatus: 'PENDING_REVIEW',
              paytrMerchantOid: merchantOid,
              paytrIframeUrl: null,
              step: 'review',
            }));
            router.replace('/post');
            return;
          }
          if (charge.status === 'FAILED' || charge.status === 'CANCELLED') {
            setFailed(true);
            setMessage('Ödeme başarısız. Lütfen tekrar deneyin.');
            setListingWizardState((prev) => ({
              ...prev,
              step: 'package',
              paytrIframeUrl: null,
              paytrMerchantOid: null,
            }));
            return;
          }
          setMessage('Ödeme onaylanıyor, lütfen bekleyin…');
        } catch {
          setMessage('Ödeme durumu sorgulanıyor…');
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) {
        setFailed(true);
        setMessage(
          'Ödeme onayı henüz alınamadı. Biraz sonra İlanlarım sayfasını kontrol edin.'
        );
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    params.advertId,
    params.merchantOid,
    params.status,
    isLoggedIn,
    router,
  ]);

  return (
    <View style={styles.wrap}>
      {!failed ? <ActivityIndicator /> : null}
      <Text style={[styles.msg, { color: failed ? errorColor : text }]}>
        {message}
      </Text>
      {failed ? (
        <Text
          style={{ color: muted, marginTop: 12 }}
          onPress={() => router.replace('/post')}
        >
          İlan verme ekranına dön
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  msg: { ...Typography.body, textAlign: 'center', lineHeight: 22 },
});
