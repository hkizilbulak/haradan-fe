/** BE hrd_adverts.id — BIGINT auto-increment. */
export type AdvertId = number;

export function advertKey(id: AdvertId): string {
  return String(id);
}

export function formatAdvertId(id: AdvertId | null | undefined): string {
  if (id == null || !Number.isFinite(id)) return '';
  return String(Math.trunc(id));
}

export function parseAdvertId(value: string | number | null | undefined): AdvertId | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
