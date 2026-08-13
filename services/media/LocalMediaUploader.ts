import type { IMediaUploader, LocalImageFile, UploadedMedia } from './MediaUploader';

/** Geliştirme — dosyayı sunucuya göndermez, yerel URI döner. */
export class LocalMediaUploader implements IMediaUploader {
  async upload(file: LocalImageFile, _accessToken: string): Promise<UploadedMedia> {
    const assetId = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return { assetId, publicUrl: file.uri };
  }
}
