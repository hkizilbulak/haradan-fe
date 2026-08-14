import { resolveApiBaseUrl } from '@/services/http';
import type { IMediaUploader } from './MediaUploader';
import { HttpMediaUploader } from './HttpMediaUploader';
import { LocalMediaUploader } from './LocalMediaUploader';

/**
 * Varsayılan: yerel.
 * HTTP: EXPO_PUBLIC_USE_HTTP_MEDIA=1 ve EXPO_PUBLIC_API_URL.
 */
export function createMediaUploader(): IMediaUploader {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_MEDIA === '1';
  const baseUrl = resolveApiBaseUrl();
  if (useHttp && baseUrl) {
    return new HttpMediaUploader(baseUrl);
  }
  return new LocalMediaUploader();
}

export const mediaUploader: IMediaUploader = createMediaUploader();
