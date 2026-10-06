import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ToastAndroid
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@/utils/formatMoney';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getActiveBankAccounts, BankAccount } from '@/services/payment/BankAccountService';
import { isPaytrCheckoutEnabled } from '@/constants/Paytr';
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
  draftAdvertId?: string | null;
  paymentMethod: 'CC' | 'TRANSFER';
  onChangePaymentMethod: (method: 'CC' | 'TRANSFER') => void;
  onTransferConfirm: () => void;
};

export function PostPaymentStep({
  iframeUrl,
  packageName,
  amountMinor,
  currencyCode = 'TRY',
  appliedCoupon,
  error,
  onRetry,
  onSuccessClick,
  draftAdvertId,
  paymentMethod,
  onChangePaymentMethod,
  onTransferConfirm,
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

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !iframeUrl) return;
    if (paymentMethod === 'CC') {
        void Linking.openURL(iframeUrl);
    }
  }, [iframeUrl, paymentMethod]);

  useEffect(() => {
    if (paymentMethod === 'TRANSFER') {
        setLoadingBanks(true);
        getActiveBankAccounts()
          .then(setBankAccounts)
          .catch(() => {})
          .finally(() => setLoadingBanks(false));
    }
  }, [paymentMethod]);

  const isFreeWithCoupon = amountMinor === 0;

  const amountLabel =
    amountMinor != null && amountMinor > 0
      ? formatMoney({ amountMinor, currency: currencyCode || 'TRY' })
      : null;

  const copyToClipboard = async (str: string, label: string) => {
    await Clipboard.setStringAsync(str);
    if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} kopyalandı!`, ToastAndroid.SHORT);
    } else if (Platform.OS === 'web') {
        // basic alert for web or custom toast could be added, standard alert for now
        window.alert(`${label} kopyalandı: ${str}`);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 4 · Ödeme</Text>
        <Text style={[styles.title, { color: text }]}>
          {isFreeWithCoupon ? 'İlanınız Onaylandı' : 'Ödeme Seçenekleri'}
        </Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {isFreeWithCoupon
            ? 'Kuponunuz sayesinde bu paket için herhangi bir ücret ödemeniz gerekmemektedir.'
            : 'Güvenli ödeme PayTR altyapısı ile kredi kartıyla ödeyebilir veya havale/EFT yapabilirsiniz.'}
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
        </View>
      )}

      {!isFreeWithCoupon && (
        <View style={styles.methodToggle}>
            {isPaytrCheckoutEnabled() && (
              <Pressable 
                style={[
                  styles.methodBtn, 
                  { borderColor: border }, 
                  paymentMethod === 'CC' && { backgroundColor: primary, borderColor: primary }
                ]}
                onPress={() => onChangePaymentMethod('CC')}
              >
                  <Ionicons name="card" size={20} color={paymentMethod === 'CC' ? '#fff' : text} />
                  <Text style={[styles.methodBtnText, { color: paymentMethod === 'CC' ? '#fff' : text }]}>Online Ödeme</Text>
              </Pressable>
            )}
            <Pressable 
              style={[
                styles.methodBtn, 
                { borderColor: border }, 
                paymentMethod === 'TRANSFER' && { backgroundColor: primary, borderColor: primary }
              ]}
              onPress={() => onChangePaymentMethod('TRANSFER')}
            >
                <Ionicons name="business" size={20} color={paymentMethod === 'TRANSFER' ? '#fff' : text} />
                <Text style={[styles.methodBtnText, { color: paymentMethod === 'TRANSFER' ? '#fff' : text }]}>Havale / EFT</Text>
            </Pressable>
        </View>
      )}

      {error && paymentMethod === 'CC' ? (
        <View style={styles.errorBox}>
          <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} accessibilityRole="button">
              <Text style={[styles.retry, { color: text }]}>Tekrar dene</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!iframeUrl && !error && !isFreeWithCoupon && paymentMethod === 'CC' ? (
        <Text style={{ color: muted }}>Ödeme ekranı hazırlanıyor…</Text>
      ) : null}

      {iframeUrl && Platform.OS === 'web' && paymentMethod === 'CC' ? (
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

      {iframeUrl && Platform.OS !== 'web' && paymentMethod === 'CC' ? (
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

      {paymentMethod === 'TRANSFER' && !isFreeWithCoupon && (
          <View style={styles.transferWrap}>
              <View style={[styles.transferInfoAlert, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
                  <Ionicons name="information-circle" size={24} color="#4f46e5" />
                  <Text style={{ flex: 1, color: '#3730a3', fontSize: 13, lineHeight: 18 }}>
                    Aşağıdaki hesaplardan birine <Text style={{ fontWeight: '700' }}>{amountLabel}</Text> tutarında ödeme yapınız. Lütfen ödeme açıklama alanına <Text style={{ fontWeight: 'bold' }}>{draftAdvertId}</Text> kodunu yazmayı unutmayınız. Ödemeniz onaylandıktan sonra ilanınız yayınlanacaktır.
                  </Text>
              </View>

              {loadingBanks ? (
                  <ActivityIndicator size="small" color={primary} style={{ marginVertical: Spacing.xl }} />
              ) : bankAccounts.length === 0 ? (
                  <Text style={{ color: muted, textAlign: 'center', marginVertical: Spacing.xl }}>
                      Kayıtlı banka hesabı bulunamadı.
                  </Text>
              ) : (
                  bankAccounts.map(acc => (
                      <View key={acc.id} style={[styles.bankCard, { borderColor: border, backgroundColor: surface }]}>
                          <View style={{ marginBottom: 12 }}>
                              <Text style={[styles.bankName, { color: text }]}>{acc.bank_name}</Text>
                              <Text style={[styles.bankHolder, { color: secondary }]}>{acc.account_holder}</Text>
                          </View>
                          <View style={styles.ibanRow}>
                              <Text style={[styles.ibanText, { color: text }]}>{acc.iban}</Text>
                              <Pressable onPress={() => copyToClipboard(acc.iban, 'IBAN')} style={styles.copyBtn}>
                                  <Ionicons name="copy-outline" size={16} color={primary} />
                                  <Text style={{ color: primary, fontSize: 12, fontWeight: '600' }}>Kopyala</Text>
                              </Pressable>
                          </View>
                          {acc.branch_name || acc.account_number ? (
                              <View style={styles.branchRow}>
                                  {acc.branch_name && <Text style={{ color: muted, fontSize: 12 }}>Şube: {acc.branch_name}</Text>}
                                  {acc.account_number && <Text style={{ color: muted, fontSize: 12 }}>Hesap No: {acc.account_number}</Text>}
                              </View>
                          ) : null}
                      </View>
                  ))
              )}

              <Pressable
                onPress={onTransferConfirm}
                style={[styles.continueBtn, { backgroundColor: primary, alignSelf: 'stretch', justifyContent: 'center' }]}
                accessibilityRole="button"
              >
                <Text style={styles.continueBtnText}>Ödemeyi Yaptım / Devam Et</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </Pressable>
          </View>
      )}

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
  methodToggle: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
  },
  methodBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderWidth: 1,
      borderRadius: Radius.card,
  },
  methodBtnText: {
      fontWeight: '600',
      fontSize: 15,
  },
  transferWrap: {
      gap: Spacing.md,
      marginTop: Spacing.sm,
  },
  transferInfoAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: Spacing.md,
      borderWidth: 1,
      borderRadius: Radius.card,
  },
  bankCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: Radius.card,
      padding: Spacing.md,
  },
  bankName: {
      fontSize: 16,
      fontWeight: '700',
  },
  bankHolder: {
      fontSize: 14,
      marginTop: 2,
  },
  ibanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0,0,0,0.03)',
      padding: Spacing.sm,
      borderRadius: 8,
  },
  ibanText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontWeight: '600',
      fontSize: 14,
      letterSpacing: 0.5,
  },
  copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
  },
  branchRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.sm,
      paddingHorizontal: 4,
  },
  errorBox: { gap: 8, marginTop: Spacing.sm },
  error: { ...Typography.body, fontWeight: '600' },
  retry: { fontWeight: '700', textDecorationLine: 'underline' },
  frame: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.card,
    overflow: 'hidden',
    minHeight: 720,
    marginTop: Spacing.sm,
  },
  nativeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginTop: Spacing.sm,
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
