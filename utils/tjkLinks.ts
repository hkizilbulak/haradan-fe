import { resolveApiBaseUrl } from '../services/http/apiConfig';

/**
 * Utility functions for generating direct TJK links and opening official horse profile pages.
 */

const atIdCache = new Map<string, string>();

/**
 * Normalizes horse names by removing years, country codes, and coat suffixes.
 */
export function cleanHorseName(rawName: string | null | undefined): string | null {
  if (!rawName || rawName.trim() === '' || rawName.trim() === '-') return null;

  // 1. Remove parenthesized/bracketed tokens e.g. "(USA)", "(1995)", "[TUR]"
  let cleanName = rawName.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();

  // 2. Remove coat/don abbreviations at the end of the horse name (e.g. " d a", " k a", " al", " doru")
  const coatEndRegex = /\s+(k\s*a|k\s*k|d\s*a|d\s*k|a\s*a|a\s*k|y\s*a|y\s*k|d\s*ö|b\s*a|kır|doru|al|yağız)$/i;
  cleanName = cleanName.replace(coatEndRegex, '').trim();

  if (!cleanName || cleanName === '-') return null;
  return cleanName;
}

/**
 * Generates the official TJK horse detail page URL using the horse's official AtId.
 * e.g. https://www.tjk.org/TR/YarisSever/Query/ConnectedPage/AtKosuBilgileri?1=1&QueryParameter_AtId=99137
 */
export function getTjkHorseDetailUrl(atId: string | number | null | undefined): string | null {
  if (atId == null) return null;
  const cleanId = String(atId).trim();
  if (!cleanId || cleanId === '-') return null;
  return `https://www.tjk.org/TR/YarisSever/Query/ConnectedPage/AtKosuBilgileri?1=1&QueryParameter_AtId=${encodeURIComponent(cleanId)}`;
}

/**
 * Returns direct TJK horse detail URL if atId is provided or rawNameOrId is numeric;
 * otherwise builds the official TJK horse name search query URL as fallback.
 */
export function getTjkHorseUrl(
  rawNameOrId: string | null | undefined,
  atId?: string | number | null
): string | null {
  if (atId != null && String(atId).trim() !== '' && String(atId).trim() !== '-') {
    return getTjkHorseDetailUrl(atId);
  }

  if (!rawNameOrId || rawNameOrId.trim() === '' || rawNameOrId.trim() === '-') return null;
  const trimmed = rawNameOrId.trim();

  // If identifier is directly an AtId (numeric)
  if (/^\d+$/.test(trimmed)) {
    return getTjkHorseDetailUrl(trimmed);
  }

  const cleanName = cleanHorseName(trimmed);
  if (!cleanName) return null;

  // Official TJK Query/Page/Atlar endpoint for horse name lookup fallback.
  // QueryParameter_OLDUFLG=on is REQUIRED so TJK includes deceased horses (e.g. pedigree ancestors).
  return `https://www.tjk.org/TR/YarisSever/Query/Page/Atlar?1=1&QueryParameter_AtIsmi=${encodeURIComponent(cleanName)}&QueryParameter_OLDUFLG=on`;
}

/**
 * Tries to resolve a horse's official TJK AtId.
 * First checks in-memory cache, then calls /v1/tjk/resolve?name=... on the backend.
 */
export async function resolveTjkHorseAtId(rawName: string | null | undefined): Promise<string | null> {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  if (!trimmed || trimmed === '-') return null;
  if (/^\d+$/.test(trimmed)) return trimmed;

  const cleanName = cleanHorseName(trimmed);
  if (!cleanName) return null;

  const cacheKey = cleanName.toLowerCase();
  if (atIdCache.has(cacheKey)) {
    return atIdCache.get(cacheKey) || null;
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) return null;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), 5000);
    const res = await fetch(`${apiBase}/v1/tjk/resolve?name=${encodeURIComponent(cleanName)}`, {
      signal: controller?.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.atId) {
        atIdCache.set(cacheKey, String(data.atId));
        return String(data.atId);
      }
    }
  } catch {
    // Network or abort error, ignore
  }

  return null;
}

/**
 * Opens the official TJK horse detail page (AtKosuBilgileri?QueryParameter_AtId=...)
 * resolving the AtId directly via the backend redirect service or memory cache.
 */
export async function openTjkHorseSearch(
  rawNameOrId: string | null | undefined,
  atId?: string | number | null
): Promise<void> {
  if (!rawNameOrId && !atId) return;

  const cleanName = cleanHorseName(rawNameOrId);
  const isDirectId = atId != null || (rawNameOrId != null && /^\d+$/.test(rawNameOrId.trim()));

  try {
    const { Linking, Platform } = require('react-native');
    const apiBase = resolveApiBaseUrl();

    // 1. If we already have AtId, open direct TJK horse detail page immediately
    if (isDirectId) {
      const directUrl = getTjkHorseDetailUrl(atId || rawNameOrId);
      if (directUrl) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(directUrl, '_blank', 'noopener,noreferrer');
        } else {
          await Linking.openURL(directUrl);
        }
        return;
      }
    }

    // 2. If cached in memory
    const cachedId = cleanName ? atIdCache.get(cleanName.toLowerCase()) : null;
    if (cachedId) {
      const directUrl = getTjkHorseDetailUrl(cachedId);
      if (directUrl) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(directUrl, '_blank', 'noopener,noreferrer');
        } else {
          await Linking.openURL(directUrl);
        }
        return;
      }
    }

    // 3. Seamless backend redirect (fast live TJK resolution + HTTP 302 to AtKosuBilgileri)
    if (apiBase && cleanName) {
      const redirectUrl = `${apiBase}/v1/tjk/redirect?name=${encodeURIComponent(cleanName)}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        await Linking.openURL(redirectUrl);
      }
      return;
    }

    // 4. Fallback if backend is unavailable
    const fallbackUrl = getTjkHorseUrl(rawNameOrId);
    if (fallbackUrl) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } else {
        await Linking.openURL(fallbackUrl);
      }
    }
  } catch {
    // ignore navigation error
  }
}

