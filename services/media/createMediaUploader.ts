import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IMediaUploader } from './MediaUploader';
import { HttpMediaUploader } from './HttpMediaUploader';
import { LocalMediaUploader } from './LocalMediaUploader';

export function createMediaUploader(): IMediaUploader {
  if (process.env.EXPO_PUBLIC_USE_MOCK_MEDIA === '1') {
    return new LocalMediaUploader();
  }
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return new HttpMediaUploader(baseUrl);
}

export const mediaUploader: IMediaUploader = createMediaUploader();
