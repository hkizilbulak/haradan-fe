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
  const trimmed = uri?.trim() ?? '';
  const [source, setSource] = useState<ImageSource | string | null>(() => {
    if (!trimmed) return null;
    if (Platform.OS !== 'web' && accessToken?.trim()) {
      return mediaImageSource(trimmed, accessToken);
    }
    return trimmed;
  });

  useEffect(() => {
    let cancelled = false;

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

    void (async () => {
      try {
        const resolved = await resolveMediaDisplayUri(trimmed, token);
        if (!cancelled && resolved) setSource(resolved);
      } catch {
        if (!cancelled) setSource(trimmed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed, accessToken]);

  return source;
}
