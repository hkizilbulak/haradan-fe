import { Platform } from 'react-native';
import { getValidAccessToken } from '@/services/auth/tokenRefresh';

type CacheEntry = { objectUrl: string; token: string };

const objectUrlCache = new Map<string, CacheEntry>();

function revokeCached(uri: string): void {
  const prev = objectUrlCache.get(uri);
  if (!prev) return;
  objectUrlCache.delete(uri);
  try {
    URL.revokeObjectURL(prev.objectUrl);
  } catch {
    /* ignore */
  }
}

/**
 * Auth gerektiren (yayın dışı) medya için web’de blob URL üretir.
 * Ham `/v1/media/...` asla `<img src>` yapılmaz — anon 404’e düşmesin.
 */
export async function resolveMediaDisplayUri(
  uri: string,
  accessToken?: string | null
): Promise<string | null> {
  const trimmed = uri?.trim();
  if (!trimmed) return null;

  const prefersAuth = Boolean(accessToken?.trim());
  if (!prefersAuth) return trimmed;

  // Native Image headers destekler; blob şart değil.
  if (Platform.OS !== 'web') return trimmed;

  let token = (await getValidAccessToken()) ?? accessToken?.trim() ?? null;
  if (!token) return trimmed;

  const cached = objectUrlCache.get(trimmed);
  if (cached?.token === token) return cached.objectUrl;

  const fetchOnce = async (bearer: string) =>
    fetch(trimmed, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store',
      redirect: 'follow',
    });

  try {
    let res = await fetchOnce(token);
    if (res.status === 401 || res.status === 403) {
      const refreshed = await getValidAccessToken();
      if (refreshed && refreshed !== token) {
        token = refreshed;
        res = await fetchOnce(token);
      }
    }
    if (!res.ok) {
      if (res.status >= 500) {
        return trimmed;
      }
      const publicRes = await fetch(trimmed, { cache: 'no-store' });
      if (publicRes.ok) {
        const blob = await publicRes.blob();
        if (blob.size) {
          revokeCached(trimmed);
          const objectUrl = URL.createObjectURL(blob);
          objectUrlCache.set(trimmed, { objectUrl, token });
          return objectUrl;
        }
      }
      return trimmed;
    }

    const blob = await res.blob();
    if (!blob.size) return trimmed;

    revokeCached(trimmed);
    const objectUrl = URL.createObjectURL(blob);
    objectUrlCache.set(trimmed, { objectUrl, token });
    return objectUrl;
  } catch {
    return trimmed;
  }
}

/** Test / HMR temizliği. */
export function clearMediaDisplayUriCache(): void {
  for (const uri of [...objectUrlCache.keys()]) {
    revokeCached(uri);
  }
}
