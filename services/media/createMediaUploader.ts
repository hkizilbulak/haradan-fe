import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IMediaUploader } from './MediaUploader';
import { HttpMediaUploader } from './HttpMediaUploader';
import { LocalMediaUploader } from './LocalMediaUploader';

export function createMediaUploader(): IMediaUploader {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_MEDIA)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpMediaUploader(baseUrl);
  }
  return new LocalMediaUploader();
}

export const mediaUploader: IMediaUploader = createMediaUploader();
