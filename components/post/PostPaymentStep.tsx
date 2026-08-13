import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostIyzicoSheet } from './PostIyzicoSheet';
import { formatMoney } from '@/utils/formatMoney';
import { openWhatsApp, WHATSAPP_GREEN } from '@/utils/contactLinks';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { paymentCheckout } from '@/services/payment';
import type { ListingPaymentInstructions } from '@/types/listing';
import type { OnlineCheckoutResult, PaymentMethod } from '@/types/payment';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostPaymentStepProps = {
  payment: ListingPaymentInstructions | null;
  loading?: boolean;
  draftId?: string | null;
  accessToken?: string | null;
};

function paymentMessage(p: ListingPaymentInstructions): string {
  return `Merhaba, Haradan.com üzerinden "${p.listingTitle}" ilanını ${p.packageName} paketi (${formatMoney(p.amount)}) ile yayınlamak için havale / EFT ile ödeme yapmak istiyorum. Referans: ${p.referenceCode}`;
}

export function PostPaymentStep({
  payment,
  loading,
  draftId,
  accessToken,
}: PostPaymentStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const success = useThemeColor('success');
  const { online } = usePaymentMethods();
  const [copied, setCopied] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [iyzicoOpen, setIyzicoOpen] = useState(false);
  const [iyzicoLoading, setIyzicoLoading] = useState(false);
  const [iyzicoResult, setIyzicoResult] = useState<OnlineCheckoutResult | null>(null);
  const [iyzicoError, setIyzicoError] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null);

  const copyIban = async () => {
    if (!payment) return;
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(payment.iban.replace(/\s/g, ''));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const payWhatsApp = () => {
    if (!payment) return;
    setShowTransfer(true);
    void openWhatsApp(payment.whatsappPhone, paymentMessage(payment));
  };

  const startOnline = async (method: PaymentMethod) => {
    setActiveMethod(method);
    setIyzicoOpen(true);
    setIyzicoError(null);
    setIyzicoResult(null);
    if (!draftId || !accessToken || !payment) {
      setIyzicoError('Ödeme için oturum gerekli.');
      return;
    }
    setIyzicoLoading(true);
    try {
      const result = await paymentCheckout.startOnline(
        {
          draftId,
          methodCode: method.code,
          amountMinor: payment.amount.amountMinor,
          currency: payment.amount.currency,
        },
        accessToken
      );
      setIyzicoResult(result);
    } catch (err) {
      setIyzicoError(err instanceof Error ? err.message : 'Ödeme başlatılamadı.');
    } finally {
      setIyzicoLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>Adım 4 · Ödeme</Text>
        <Text style={[styles.title, { color: text }]}>Ödemeyi tamamla</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          Online ödeyin veya havale ile bildirin.
        </Text>
      </View>

      {loading || !payment ? (
        <View style={[styles.summary, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.lead, { color: secondary }]}>
            Ödeme bilgileri hazırlanıyor…
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.summary, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.summaryLabel, { color: muted }]}>Ödenecek</Text>
            <Text style={[styles.amount, { color: text }]}>
              {formatMoney(payment.amount)}
            </Text>
            <Text style={[styles.summaryMeta, { color: secondary }]}>
              {payment.packageName} · {payment.listingTitle}
            </Text>
          </View>

          <View style={styles.online}>
            <Text style={[styles.onlineLabel, { color: muted }]}>Online ödeme</Text>
            <View style={styles.onlineRow}>
              {online.map((method) => (
                <Pressable
                  key={method.code}
                  onPress={() => void startOnline(method)}
                  accessibilityRole="button"
                  accessibilityLabel={method.label}
                  style={({ pressed }) => [
                    styles.onlineCard,
                    {
                      backgroundColor: surface,
                      borderColor: border,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: header }]}>
                    <Ionicons
                      name={method.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color="#fff"
                    />
                  </View>
                  <Text style={[styles.onlineName, { color: text }]}>{method.label}</Text>
                  <Text style={[styles.onlineDesc, { color: secondary }]}>
                    {method.description}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.iyzicoMark, { color: muted }]}>iyzico güvencesiyle</Text>
          </View>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: border }]} />
            <Text style={[styles.or, { color: muted }]}>veya</Text>
            <View style={[styles.orLine, { backgroundColor: border }]} />
          </View>

          <Pressable
            onPress={payWhatsApp}
            accessibilityRole="button"
            accessibilityLabel="Havale ile öde"
            style={({ pressed }) => [
              styles.wa,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.waLabel}>Havale ile öde</Text>
          </Pressable>

          {showTransfer ? (
            <View style={[styles.bank, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.bankHead}>
                <Ionicons name="checkmark-circle" size={18} color={success} />
                <Text style={[styles.bankTitle, { color: text }]}>Havale bilgileri</Text>
              </View>
              <Text style={[styles.rowLabel, { color: muted }]}>Banka</Text>
              <Text style={[styles.rowValue, { color: text }]}>{payment.bankName}</Text>
              <Text style={[styles.rowLabel, { color: muted }]}>Hesap adı</Text>
              <Text style={[styles.rowValue, { color: text }]}>
                {payment.accountHolder}
              </Text>
              <Text style={[styles.rowLabel, { color: muted }]}>IBAN</Text>
              <Pressable onPress={copyIban} style={styles.ibanRow}>
                <Text style={[styles.iban, { color: text }]}>{payment.iban}</Text>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={header}
                />
              </Pressable>
              <Text style={[styles.rowLabel, { color: muted }]}>Referans</Text>
              <Text style={[styles.rowValue, { color: text }]}>
                {payment.referenceCode}
              </Text>
            </View>
          ) : null}
        </>
      )}

      <PostIyzicoSheet
        visible={iyzicoOpen}
        method={activeMethod}
        loading={iyzicoLoading}
        result={iyzicoResult}
        error={iyzicoError}
        onClose={() => setIyzicoOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  intro: { gap: 6, alignItems: 'center' },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2, textAlign: 'center' },
  lead: { ...Typography.body, textAlign: 'center' },
  summary: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  amount: { ...Typography.h1 },
  summaryMeta: { ...Typography.small, textAlign: 'center' },
  online: { alignItems: 'center', gap: Spacing.sm },
  onlineLabel: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  onlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  onlineCard: {
    flexGrow: 1,
    flexBasis: 160,
    maxWidth: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineName: { ...Typography.small, fontWeight: '700' },
  onlineDesc: { ...Typography.caption, textAlign: 'center' },
  iyzicoMark: { ...Typography.caption, letterSpacing: 0.4 },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { ...Typography.caption, fontWeight: '600' },
  wa: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: WHATSAPP_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 24px rgba(37, 211, 102, 0.28)',
        cursor: 'pointer' as const,
      },
      default: {},
    }),
  },
  waLabel: {
    ...Typography.small,
    fontWeight: '700',
    color: '#fff',
  },
  bank: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: 4,
  },
  bankHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bankTitle: { ...Typography.small, fontWeight: '700' },
  rowLabel: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: Spacing.sm,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rowValue: { ...Typography.body, fontWeight: '600' },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  iban: { ...Typography.h5, flex: 1 },
});
