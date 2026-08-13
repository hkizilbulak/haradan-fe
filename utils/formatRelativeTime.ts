const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ISO date-time → göreli Türkçe etiket. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diff = Math.max(0, now - then);

  if (diff < MINUTE) return 'Az önce';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} dk önce`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} sa önce`;
  }
  const d = Math.floor(diff / DAY);
  if (d === 1) return 'Dün';
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}
