/** Görüntülenme sayısı — 847 · 1,2 bin · 1,4 Mn */
export function formatViewCount(count: number | null | undefined): string {
  if (count == null || count < 0) return '0';
  if (count < 1000) return count.toLocaleString('tr-TR');
  if (count < 1_000_000) {
    const value = count / 1000;
    const label = value >= 10 ? value.toFixed(0) : value.toFixed(1).replace('.', ',');
    return `${label.replace(/,0$/, '')} bin`;
  }
  const value = count / 1_000_000;
  const label = value >= 10 ? value.toFixed(0) : value.toFixed(1).replace('.', ',');
  return `${label.replace(/,0$/, '')} Mn`;
}
