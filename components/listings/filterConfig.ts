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
