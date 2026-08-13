import type { Money } from '@/types';

/**
 * amountMinor → görünen fiyat.
 * USD → $340.99; TRY → ₺1.850.000
 */
export function formatMoney(price: Money | null | undefined): string {
  if (!price) return 'Fiyat sorulur';
  const major = price.amountMinor / 100;
  const locale = price.currency === 'USD' ? 'en-US' : 'tr-TR';
  const hasCents = price.amountMinor % 100 !== 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: price.currency,
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    }).format(major);
  } catch {
    return `${major.toLocaleString(locale)} ${price.currency}`;
  }
}
