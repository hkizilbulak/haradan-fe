import { HttpClient } from '@/services/http';
import { mediaUploader } from '@/services/media/createMediaUploader';
import type { IMediaUploader } from '@/services/media/MediaUploader';
import type {
  ListingDraft,
  ListingPackage,
  OwnerAdvertResponse,
  PublishListingResult,
} from '@/types/listing';
import type { IListingRepository } from './ListingRepository';
import { mapDraftToCreateAdvert } from './mapDraftToRequest';
import {
  mapPublicPackage,
  type PublicPackageListResponse,
} from './mapPackage';

type AdvertMediaCollectionResponse = {
  advertId: string;
  mediaVersion: number;
};

/** ADVERT-OWNER-01/07 + PACKAGE-PUBLIC-01 + MEDIA-04 */
export class HttpListingRepository implements IListingRepository {
  private readonly http: HttpClient;
  private cached: ListingPackage[] | null = null;
  private readonly media: IMediaUploader;

  constructor(baseUrl: string, media: IMediaUploader = mediaUploader) {
    this.http = new HttpClient(baseUrl);
    this.media = media;
  }

  getCachedPackages(): ListingPackage[] | null {
    return this.cached;
  }

  async getPackages(): Promise<ListingPackage[]> {
    const res = await this.http.request<PublicPackageListResponse>(
      '/v1/packages',
      { method: 'GET' }
    );
    this.cached = (res.items ?? []).map(mapPublicPackage);
    return this.cached;
  }

  async publish(
    draft: ListingDraft,
    accessToken: string
  ): Promise<PublishListingResult> {
    const uploaded = await Promise.all(
      draft.media.map(async (slot) => {
        if (slot.assetId) return slot;
        const res = await this.media.upload(
          {
            uri: slot.uri,
            mimeType: slot.mimeType,
            fileName: slot.fileName,
          },
          accessToken
        );
        return { ...slot, assetId: res.assetId };
      })
    );

    const created = await this.http.request<OwnerAdvertResponse>(
      '/v1/me/adverts',
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify(mapDraftToCreateAdvert(draft)),
      }
    );

    let mediaVersion = created.mediaVersion;
    const ordered = [
      ...uploaded.filter((m) => m.isCover),
      ...uploaded.filter((m) => !m.isCover),
    ];
    const coverSlot = uploaded.find((m) => m.isCover) ?? uploaded[0];
    let coverAssetId: string | null = coverSlot?.assetId ?? null;
    for (let i = 0; i < ordered.length; i += 1) {
      const slot = ordered[i];
      if (!slot.assetId) continue;
      const attached = await this.http.request<AdvertMediaCollectionResponse>(
        `/v1/me/adverts/${created.id}/media`,
        {
          method: 'POST',
          accessToken,
          body: JSON.stringify({
            assetId: slot.assetId,
            expectedMediaVersion: mediaVersion,
            displayOrder: i,
          }),
        }
      );
      mediaVersion = attached.mediaVersion;
    }
    if (coverAssetId) {
      const covered = await this.http.request<AdvertMediaCollectionResponse>(
        `/v1/me/adverts/${created.id}/media/cover`,
        {
          method: 'PUT',
          accessToken,
          body: JSON.stringify({
            assetId: coverAssetId,
            expectedMediaVersion: mediaVersion,
          }),
        }
      );
      mediaVersion = covered.mediaVersion;
    }

    const packageCode = draft.packageCode?.trim();
    if (packageCode) {
      await this.http.request(`/v1/me/adverts/${created.id}/package`, {
        method: 'PUT',
        accessToken,
        body: JSON.stringify({ packageCode }),
      });
    }

    const submitted = await this.http.request<OwnerAdvertResponse>(
      `/v1/me/adverts/${created.id}/submit`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion: created.version }),
      }
    );

    return { advertId: submitted.id, status: submitted.status };
  }
}
