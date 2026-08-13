import { HttpClient } from '@/services/http';
import type { IMediaUploader, LocalImageFile, UploadedMedia } from './MediaUploader';

/** POST /v1/media (multipart) — EXPO_PUBLIC_USE_HTTP_MEDIA=1 */
export class HttpMediaUploader implements IMediaUploader {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async upload(file: LocalImageFile, accessToken: string): Promise<UploadedMedia> {
    const form = new FormData();
    if (file.uri.startsWith('blob:') || file.uri.startsWith('data:')) {
      const blob = await fetch(file.uri).then((r) => r.blob());
      form.append('file', blob, file.fileName);
    } else {
      form.append('file', {
        uri: file.uri,
        name: file.fileName,
        type: file.mimeType,
      } as unknown as Blob);
    }
    return this.http.request<UploadedMedia>('/v1/media', {
      method: 'POST',
      body: form,
      accessToken,
    });
  }
}
