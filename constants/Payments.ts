/**
 * Havale / WhatsApp ödeme — BE veya env ile değiştirilir.
 * EXPO_PUBLIC_PAYMENTS_WHATSAPP: 90XXXXXXXXXX
 */
export const PAYMENTS_WHATSAPP =
  process.env.EXPO_PUBLIC_PAYMENTS_WHATSAPP?.replace(/\D/g, '') ||
  '905551112233';

export const PAYMENTS_BANK = {
  bankName: 'Türkiye İş Bankası',
  accountHolder: 'Haradan Yazılım A.Ş.',
  iban: 'TR12 ACCT-000009 0000 00',
} as const;
