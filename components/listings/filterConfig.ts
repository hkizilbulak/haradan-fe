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

export function isHorseCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'satilik-atlar' ||
    s === 'cat-satilik-atlar' ||
    s.includes('satilik') ||
    s.includes('yaris-ati') ||
    s.includes('yaris') ||
    s.includes('yarış') ||
    s.includes('kisrak') ||
    s.includes('kısrak') ||
    s.includes('damizlik') ||
    s.includes('damızlık') ||
    s.includes('aygir') ||
    s.includes('aygır') ||
    s.includes('binek') ||
    s.includes('binek-ati') ||
    s.includes('pony') ||
    s.includes('midilli') ||
    s.includes('tay') ||
    s.includes('konkur')
  ) && !s.includes('asim') && !s.includes('aşım');
}

export function isPansiyonCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'pansiyon-haralar' ||
    s === 'cat-pansiyon' ||
    s.includes('pansiyon') ||
    s.includes('hara')
  );
}

export function isTransportCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'at-nakliyesi' ||
    s === 'cat-nakliye' ||
    s.includes('nakliye') ||
    s.includes('tasima') ||
    s.includes('taşıma') ||
    s.includes('transport')
  );
}

export function isFarrierCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'nalbantlar' ||
    s === 'cat-nalbant' ||
    s.includes('nalbant') ||
    s.includes('farrier')
  );
}

export function isStudCategory(slug: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s === 'asim-hizmetleri' ||
    s === 'arap-aygir' ||
    s === 'ingiliz-aygir' ||
    s === 'cat-asim' ||
    s === 'cat-arap-aygir' ||
    s === 'cat-ingiliz-aygir' ||
    s.includes('aygir') ||
    s.includes('aygır') ||
    s.includes('asim') ||
    s.includes('aşım')
  );
}

