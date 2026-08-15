import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { ImageSource } from 'expo-image';
import { mediaImageSource } from '@/services/media/imageSource';
import { resolveMediaDisplayUri } from '@/services/media/resolveMediaDisplayUri';

/**
 * Medya görseli kaynağı.
 * - Auth yok → public URL (yayınlanmış ilanlar)
 * - Auth + web → Bearer ile blob (yayın dışı 404 olmasın)
 * - Auth + native → { uri, headers }
 *
 * Auth varken ham URL asla img src olmaz (yüklenene kadar null).
 */
export function useMediaImageSource(
  uri: string | null | undefined,
  accessToken?: string | null
): ImageSource | string | null {
  const wantsAuth = Boolean(accessToken?.trim() && uri?.trim());
  const [source, setSource] = useState<ImageSource | string | null>(() => {
    if (!uri?.trim()) return null;
    if (!wantsAuth) return uri;
    if (Platform.OS !== 'web') {
      return mediaImageSource(uri, accessToken);
    }
    return null;
  });

  useEffect(() => {
    let cancelled = false;
    const trimmed = uri?.trim() ?? '';

    if (!trimmed) {
      setSource(null);
      return;
    }

    const token = accessToken?.trim() ?? '';
    if (!token) {
      setSource(trimmed);
      return;
    }

    if (Platform.OS !== 'web') {
      setSource(mediaImageSource(trimmed, token));
      return;
    }

    setSource(null);
    void (async () => {
      const resolved = await resolveMediaDisplayUri(trimmed, token);
      if (!cancelled) setSource(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, accessToken]);

  return source;
}
