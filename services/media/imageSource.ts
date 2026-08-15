import type { ImageSource } from 'expo-image';

/**
 * Ham URL asla auth’suz img src yapılmamalı (yayın dışı 404).
 * Kart/galeri bileşenleri Bearer + (web) blob kullanır.
 */
export function mediaImageSource(
  uri: string | null | undefined,
  accessToken?: string | null
): ImageSource | string | null {
  if (!uri) return null;
  const token = accessToken?.trim();
  if (!token) return uri;
  return {
    uri,
    headers: { Authorization: `Bearer ${token}` },
  };
}
