/** Fiyat — kullanıcı TL girer; karşılaştırma amountMinor (kuruş). */

export function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function formatTlInput(n: number | null): string {
  if (n == null) return '';
  return n.toLocaleString('tr-TR');
}

export function parseProvinceParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeProvinceParam(ids: string[]): string | null {
  if (ids.length === 0) return null;
  return ids.join(',');
}

export function parseTlParam(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export function tlToMinor(tl: number): number {
  return Math.round(tl * 100);
}

export function matchesPrice(
  amountMinor: number,
  minTl: number | null,
  maxTl: number | null
): boolean {
  if (minTl != null && amountMinor < tlToMinor(minTl)) return false;
  if (maxTl != null && amountMinor > tlToMinor(maxTl)) return false;
  return true;
}

export function priceHint(minTl: number | null, maxTl: number | null): string | null {
  if (minTl == null && maxTl == null) return null;
  if (minTl != null && maxTl != null) {
    return `${formatTlInput(minTl)} – ${formatTlInput(maxTl)} ₺`;
  }
  if (minTl != null) return `${formatTlInput(minTl)} ₺+`;
  return `${formatTlInput(maxTl)} ₺’ye kadar`;
}

export type ListingPeriodFilter = '24h' | '3d' | '7d' | '30d';

export const PERIOD_OPTIONS: { id: ListingPeriodFilter; label: string; hours: number }[] = [
  { id: '24h', label: 'Son 24 saat', hours: 24 },
  { id: '3d', label: 'Son 3 gün', hours: 72 },
  { id: '7d', label: 'Son 7 gün', hours: 168 },
  { id: '30d', label: 'Son 30 gün', hours: 720 },
];

export function parseArrayParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeArrayParam(items: string[]): string | null {
  if (!items || items.length === 0) return null;
  return items.join(',');
}

export function matchesDatePeriod(
  publishedAt: string | null | undefined,
  period: ListingPeriodFilter | string | null | undefined
): boolean {
  if (!period) return true;
  if (!publishedAt) return false;
  const opt = PERIOD_OPTIONS.find((p) => p.id === period);
  if (!opt) return true;
  const pubTime = new Date(publishedAt).getTime();
  if (Number.isNaN(pubTime)) return true;
  const cutoff = Date.now() - opt.hours * 3600 * 1000;
  return pubTime >= cutoff;
}

export function periodLabel(period: string | null | undefined): string | null {
  if (!period) return null;
  return PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? null;
}
