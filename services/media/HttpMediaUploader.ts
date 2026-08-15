import { ApiError, HttpClient } from '@/services/http';
import type { IMediaUploader, LocalImageFile, UploadedMedia } from './MediaUploader';

type InitiateMediaUploadResponse = {
  assetId: string;
  upload: {
    method: 'PUT';
    url: string;
    expiresAt: string;
    headers?: Record<string, string>;
  };
  constraints: {
    allowedContentTypes: string[];
    maxByteSize: number;
    requiredHeaders: string[];
  };
};

function preferBackendProxy(): boolean {
  // Browser / Expo web: direct B2 PUT hits storage CORS. Prefer same-origin BE.
  return typeof document !== 'undefined';
}

/** MEDIA-01/02 — initiate → bytes → confirm.
 * Web: same-origin BE proxy (avoids B2 CORS).
 * Native: presigned PUT to storage, BE proxy fallback.
 */
export class HttpMediaUploader implements IMediaUploader {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async upload(file: LocalImageFile, accessToken: string): Promise<UploadedMedia> {
    const blob = await readFileBlob(file);
    const declaredContentType = normalizeContentType(
      file.mimeType || blob.type || 'image/jpeg'
    );
    const initiated = await this.http.request<InitiateMediaUploadResponse>(
      '/v1/media/uploads',
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({
          declaredContentType,
          declaredByteSize: blob.size,
        }),
      }
    );

    if (preferBackendProxy()) {
      await this.putViaBackend(initiated.assetId, blob, declaredContentType, accessToken);
    } else {
      try {
        await this.putViaPresigned(initiated, blob, declaredContentType);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UPLOAD_NETWORK') {
          await this.putViaBackend(
            initiated.assetId,
            blob,
            declaredContentType,
            accessToken
          );
        } else {
          throw err;
        }
      }
    }

    await this.http.request(`/v1/media/assets/${initiated.assetId}/confirm`, {
      method: 'POST',
      accessToken,
    });
    return { assetId: initiated.assetId, publicUrl: file.uri };
  }

  private async putViaBackend(
    assetId: string,
    blob: Blob,
    contentType: string,
    accessToken: string
  ): Promise<void> {
    await this.http.request(`/v1/media/assets/${assetId}/content`, {
      method: 'PUT',
      accessToken,
      body: blob,
      headers: { 'Content-Type': contentType },
    });
  }

  private async putViaPresigned(
    initiated: InitiateMediaUploadResponse,
    blob: Blob,
    declaredContentType: string
  ): Promise<void> {
    const putHeaders: Record<string, string> = {
      ...(initiated.upload.headers ?? {}),
    };
    if (!hasHeader(putHeaders, 'Content-Type')) {
      putHeaders['Content-Type'] = declaredContentType;
    }
    let putRes: Response;
    try {
      putRes = await fetch(initiated.upload.url, {
        method: initiated.upload.method,
        headers: putHeaders,
        body: blob,
        credentials: 'omit',
        mode: 'cors',
      });
    } catch {
      throw new ApiError(
        'Görsel deposuna ulaşılamadı. Yükleme iznini kontrol edin.',
        0,
        'UPLOAD_NETWORK'
      );
    }
    if (!putRes.ok) {
      throw new ApiError('Görsel yüklenemedi.', putRes.status, 'UPLOAD_FAILED');
    }
  }
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const needle = name.toLowerCase();
  return Object.keys(headers).some((k) => k.toLowerCase() === needle);
}

function normalizeContentType(raw: string): string {
  const value = raw.toLowerCase().split(';')[0]?.trim() ?? 'image/jpeg';
  if (value === 'image/jpg') return 'image/jpeg';
  return value;
}

async function readFileBlob(file: LocalImageFile): Promise<Blob> {
  const res = await fetch(file.uri);
  return res.blob();
}
