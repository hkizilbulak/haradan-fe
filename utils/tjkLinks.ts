/**
 * Utility functions for generating direct TJK links and opening official horse profile pages.
 */

/**
 * Normalizes horse names by removing years, country codes, and coat suffixes,
 * and builds the official TJK horse racing & pedigree query URL.
 */
export function getTjkHorseUrl(rawName: string | null | undefined): string | null {
  if (!rawName || rawName.trim() === '' || rawName.trim() === '-') return null;

  // 1. Remove parenthesized/bracketed tokens e.g. "(USA)", "(1995)", "[TUR]"
  let cleanName = rawName.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();

  // 2. Remove coat/don abbreviations at the end of the horse name (e.g. " d a", " k a", " al", " doru")
  const coatEndRegex = /\s+(k\s*a|k\s*k|d\s*a|d\s*k|a\s*a|a\s*k|y\s*a|y\s*k|d\s*ö|b\s*a|kır|doru|al|yağız)$/i;
  cleanName = cleanName.replace(coatEndRegex, '').trim();

  if (!cleanName || cleanName === '-') return null;

  // Official TJK Query/Page/Atlar endpoint for horse name lookup
  return `https://www.tjk.org/TR/YarisSever/Query/Page/Atlar?1=1&QueryParameter_AtIsmi=${encodeURIComponent(cleanName)}`;
}

/**
 * Opens the official TJK horse racing & pedigree page in browser/app.
 */
export async function openTjkHorseSearch(rawName: string | null | undefined): Promise<void> {
  const directUrl = getTjkHorseUrl(rawName);
  if (!directUrl) return;

  try {
    const { Linking, Platform } = require('react-native');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(directUrl);
  } catch {
    // ignore navigation error
  }
}
