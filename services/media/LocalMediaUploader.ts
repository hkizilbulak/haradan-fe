import type { IMediaUploader, LocalImageFile, UploadedMedia } from './MediaUploader';

/** Geliştirme — dosyayı sunucuya göndermez, yerel URI döner. */
export class LocalMediaUploader implements IMediaUploader {
  async upload(file: LocalImageFile, _accessToken: string): Promise<UploadedMedia> {
    const assetId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padStart(12, '0');
    return { assetId, publicUrl: file.uri };
  }
}
