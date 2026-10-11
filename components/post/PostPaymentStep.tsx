import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@/utils/formatMoney';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getActiveBankAccounts, type BankAccount } from '@/services/payment/BankAccountService';
import { isPaytrCheckoutEnabled } from '@/constants/Paytr';
import type { CouponValidationResult } from '@/types/coupon';

function formatIban(iban: string): string {
  const clean = (iban || '').replace(/\s+/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

type PostPaymentStepProps = {
  iframeUrl: string | null;
  packageName?: string | null;
  packagePriceMinor?: number | null;
  amountMinor?: number | null;
  currencyCode?: string | null;
  appliedCoupon?: CouponValidationResult | null;
  campaignDiscountMinor?: number | null;
  campaignName?: string | null;
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
  packagePriceMinor,
  amountMinor,
  currencyCode = 'TRY',
  appliedCoupon,
  campaignDiscountMinor,
  campaignName,
  error,
  onRetry,
  onSuccessClick,
  draftAdvertId,
  paymentMethod,
  onChangePaymentMethod,
  onTransferConfirm,
}: PostPaymentStepProps) {
  const { isDark } = useAppTheme();
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const basePriceMinor =
    packagePriceMinor != null && packagePriceMinor > 0
      ? packagePriceMinor
      : (amountMinor ?? 0);

  const coupon = appliedCoupon?.coupon;
  const couponCode = coupon?.code;
  const couponDiscountMinor = appliedCoupon?.valid
    ? typeof appliedCoupon.discountAmountMinor === 'number' &&
      !isNaN(appliedCoupon.discountAmountMinor)
      ? appliedCoupon.discountAmountMinor
      : Math.max(0, basePriceMinor - (amountMinor ?? 0))
    : 0;

  const totalDiscountMinor = Math.max(0, basePriceMinor - (amountMinor ?? 0));
  const remainingDiscountMinor = Math.max(
    0,
    totalDiscountMinor -
      (couponDiscountMinor > 0 ? couponDiscountMinor : 0) -
      (campaignDiscountMinor ?? 0)
  );

  const amountLabel =
    amountMinor != null && amountMinor > 0
      ? formatMoney({ amountMinor, currency: currencyCode || 'TRY' })
      : null;

  const copyToClipboard = async (str: string, key: string) => {
    await Clipboard.setStringAsync(str);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const paytrEnabled = isPaytrCheckoutEnabled();

  return (
    <View style={styles.wrap}>
      {/* Başlık */}
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 4 · Ödeme</Text>
        <Text style={[styles.title, { color: text }]}>
          {isFreeWithCoupon ? 'İlanınız Onaylandı' : 'Ödeme Bilgileri'}
        </Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {isFreeWithCoupon
            ? 'Kuponunuz sayesinde bu paket için herhangi bir ücret ödemeniz gerekmemektedir.'
            : 'Ödemenizi güvenle tamamlayın.'}
        </Text>
      </View>

      {/* 100% Free Coupon Card */}
      {isFreeWithCoupon ? (
        <View style={[styles.freeSuccessCard, { backgroundColor: successLight, borderColor: success }]}>
          <Ionicons name="checkmark-circle" size={44} color={success} />
          <Text style={[styles.freeSuccessTitle, { color: text }]}>
            %100 Kupon İndirimi Uygulandı!
          </Text>
          <Text style={[styles.freeSuccessDesc, { color: secondary }]}>
            {packageName ? `${packageName} paketi ` : ''}ücretsiz tanımlandı ve ilanınız incelemeye gönderildi.
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

      {/* Sipariş Özeti */}
      {(packageName || amountLabel) && !isFreeWithCoupon && (
        <View style={[styles.summaryBox, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.summaryTitle, { color: text }]}>Sipariş Özeti</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: secondary }]}>Seçilen Paket</Text>
            <Text style={[styles.summaryVal, { color: text }]}>{packageName || 'İlan paketi'}</Text>
          </View>

          {basePriceMinor > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondary }]}>Paket Fiyatı</Text>
              <Text style={[styles.summaryVal, { color: text }]}>
                {formatMoney({ amountMinor: basePriceMinor, currency: currencyCode || 'TRY' })}
              </Text>
            </View>
          ) : null}

          {campaignDiscountMinor != null && campaignDiscountMinor > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: success }]}>
                Kampanya İndirimi {campaignName ? `(${campaignName})` : ''}
              </Text>
              <Text style={[styles.summaryVal, { color: success }]}>
                -{formatMoney({ amountMinor: campaignDiscountMinor, currency: currencyCode || 'TRY' })}
              </Text>
            </View>
          ) : null}

          {couponDiscountMinor > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: success }]}>
                Kupon İndirimi {couponCode ? `(${couponCode})` : ''}
              </Text>
              <Text style={[styles.summaryVal, { color: success }]}>
                -{formatMoney({ amountMinor: couponDiscountMinor, currency: currencyCode || 'TRY' })}
              </Text>
            </View>
          ) : null}

          {remainingDiscountMinor > 0 && !campaignDiscountMinor ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: success }]}>İndirim Tutarı</Text>
              <Text style={[styles.summaryVal, { color: success }]}>
                -{formatMoney({ amountMinor: remainingDiscountMinor, currency: currencyCode || 'TRY' })}
              </Text>
            </View>
          ) : null}

          <View style={[styles.summaryDivider, { backgroundColor: border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalLabel, { color: text }]}>Toplam Ödenecek</Text>
            <Text style={[styles.summaryTotalVal, { color: success }]}>
              {amountMinor === 0 ? 'ÜCRETSİZ' : amountLabel ?? '₺0'}
            </Text>
          </View>
        </View>
      )}

      {/* Ödeme Yöntemi Seçimi (Sadece birden fazla ödeme seçeneği aktifse gösterilir) */}
      {!isFreeWithCoupon && paytrEnabled && (
        <View style={styles.methodSection}>
          <Text style={[styles.methodSectionTitle, { color: text }]}>Ödeme Yöntemi</Text>
          <View style={styles.methodToggle}>
            <Pressable
              style={[
                styles.methodTab,
                { borderColor: border },
                paymentMethod === 'CC' && { backgroundColor: primary, borderColor: primary },
              ]}
              onPress={() => onChangePaymentMethod('CC')}
              accessibilityRole="button"
            >
              <Ionicons
                name="card-outline"
                size={18}
                color={paymentMethod === 'CC' ? '#ffffff' : text}
              />
              <Text
                style={[
                  styles.methodTabText,
                  { color: paymentMethod === 'CC' ? '#ffffff' : text },
                ]}
              >
                Online Ödeme
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.methodTab,
                { borderColor: border },
                paymentMethod === 'TRANSFER' && { backgroundColor: primary, borderColor: primary },
              ]}
              onPress={() => onChangePaymentMethod('TRANSFER')}
              accessibilityRole="button"
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={paymentMethod === 'TRANSFER' ? '#ffffff' : text}
              />
              <Text
                style={[
                  styles.methodTabText,
                  { color: paymentMethod === 'TRANSFER' ? '#ffffff' : text },
                ]}
              >
                Havale / EFT
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Hata Mesajı */}
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
        <Text style={{ color: muted, marginVertical: 8 }}>Ödeme ekranı hazırlanıyor…</Text>
      ) : null}

      {/* PayTR iframe */}
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
            Ödeme sayfası tarayıcınızda açıldı. İşlem bitince bu uygulamaya yönlendirileceksiniz.
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

      {/* Havale / EFT Bölümü */}
      {paymentMethod === 'TRANSFER' && !isFreeWithCoupon && (
        <View style={styles.transferSection}>
          {/* Sade Bilgilendirme Notu */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe',
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? '#e2e8f0' : '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                Aşağıdaki hesaplardan birine{' '}
                <Text style={{ fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
                  {amountLabel}
                </Text>{' '}
                gönderiniz.
              </Text>
              {draftAdvertId ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: 13 }}>
                    Açıklama alanına:{' '}
                    <Text style={{ fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
                      {draftAdvertId}
                    </Text>
                  </Text>
                  <Pressable
                    onPress={() => copyToClipboard(draftAdvertId, 'refCode')}
                    style={styles.miniCopyBtn}
                  >
                    <Text style={{ color: primary, fontSize: 11, fontWeight: '600' }}>
                      {copiedKey === 'refCode' ? '✓ Kopyalandı' : 'Kopyala'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {/* Banka Kartları */}
          {loadingBanks ? (
            <ActivityIndicator size="small" color={primary} style={{ marginVertical: Spacing.lg }} />
          ) : bankAccounts.length === 0 ? (
            <Text style={{ color: muted, textAlign: 'center', marginVertical: Spacing.md }}>
              Kayıtlı banka hesabı bulunamadı.
            </Text>
          ) : (
            <View style={styles.banksList}>
              {bankAccounts.map((acc) => {
                const isCopied = copiedKey === `iban-${acc.id}`;
                const formatted = formatIban(acc.iban);

                return (
                  <View
                    key={acc.id}
                    style={[styles.bankCard, { borderColor: border, backgroundColor: surface }]}
                  >
                    <View style={styles.bankTopRow}>
                      <Text style={[styles.bankName, { color: text }]}>{acc.bank_name}</Text>
                      <Text style={[styles.bankHolder, { color: secondary }]}>{acc.account_holder}</Text>
                    </View>

                    <View
                      style={[
                        styles.ibanBox,
                        {
                          backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                          borderColor: border,
                        },
                      ]}
                    >
                      <Text style={[styles.ibanText, { color: text }]} numberOfLines={1} selectable>
                        {formatted}
                      </Text>
                      <Pressable
                        onPress={() => copyToClipboard(acc.iban.replace(/\s+/g, ''), `iban-${acc.id}`)}
                        style={styles.copyBtn}
                      >
                        <Ionicons
                          name={isCopied ? 'checkmark' : 'copy-outline'}
                          size={15}
                          color={isCopied ? success : primary}
                        />
                        <Text style={[styles.copyBtnText, { color: isCopied ? success : primary }]}>
                          {isCopied ? 'Kopyalandı' : 'Kopyala'}
                        </Text>
                      </Pressable>
                    </View>

                    {(acc.branch_name || acc.account_number) && (
                      <View style={styles.branchRow}>
                        {acc.branch_name && (
                          <Text style={[styles.branchText, { color: muted }]}>
                            Şube: {acc.branch_name}
                          </Text>
                        )}
                        {acc.account_number && (
                          <Text style={[styles.branchText, { color: muted }]}>
                            Hesap No: {acc.account_number}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Onay Butonu */}
          <Pressable
            onPress={onTransferConfirm}
            style={[styles.continueBtn, { backgroundColor: primary }]}
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
  intro: { gap: 4 },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  lead: { ...Typography.body, lineHeight: 20 },

  // Sipariş Özeti
  summaryBox: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
  },
  summaryTitle: {
    ...Typography.h4,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 14,
    flex: 1,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  summaryTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },

  // Ödeme Yöntemi
  methodSection: {
    gap: 8,
    marginTop: Spacing.xs,
  },
  methodSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  methodToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  methodTabText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Havale / EFT
  transferSection: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  miniCopyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  banksList: {
    gap: 10,
  },
  bankCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: 10,
  },
  bankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
  },
  bankHolder: {
    fontSize: 13,
  },
  ibanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  ibanText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  branchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  branchText: {
    fontSize: 12,
  },

  // Buton
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.card,
    marginTop: Spacing.xs,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Free kupon
  freeSuccessCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  freeSuccessTitle: {
    ...Typography.h3,
    fontWeight: '700',
    textAlign: 'center',
  },
  freeSuccessDesc: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Hata & iframe
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
});
