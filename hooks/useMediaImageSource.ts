import type { ImageSource } from 'expo-image';

/**
 * Medya görseli kaynağı — doğrudan public URL döner.
 */
export function useMediaImageSource(
  uri: string | null | undefined,
  _accessToken?: string | null
): ImageSource | string | null {
  const trimmed = uri?.trim();
  return trimmed || null;
}

