import { HttpClient } from '@/services/http';
import { mediaUploader } from '@/services/media/createMediaUploader';
import type { IMediaUploader } from '@/services/media/MediaUploader';
import type {
  ListingDraft,
  ListingPackage,
  OwnerAdvertResponse,
  PublishListingResult,
} from '@/types/listing';
import type { PaytrChargeStatus, PaytrCheckoutResult } from '@/types/paytr';
import type { AdvertId } from '@/types/advertId';
import type { IListingRepository } from './ListingRepository';
import { buildDraftProperties, mapDraftToCreateAdvert } from './mapDraftToRequest';
import {
  mapPublicPackage,
  type PublicPackageListResponse,
} from './mapPackage';

type AdvertMediaCollectionResponse = {
  advertId: AdvertId;
  mediaVersion: number;
};

/** ADVERT-OWNER + PACKAGE-PUBLIC + MEDIA + PayTR checkout */
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

  /** Creates or updates draft + media only (no package assign, no submit). */
  async createDraft(
    draft: ListingDraft,
    accessToken: string
  ): Promise<{ advertId: AdvertId; version: number; status: string }> {
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

    let created: OwnerAdvertResponse | null = null;

    // 1. If draft already has an advertId, fetch and update it
    if (draft.advertId) {
      try {
        created = await this.http.request<OwnerAdvertResponse>(
          `/v1/me/adverts/${encodeURIComponent(String(draft.advertId))}`,
          { method: 'GET', accessToken }
        );
      } catch {
        created = null;
      }
    }

    // 2. If no valid advertId, check if an in-progress draft already exists with the same title
    if (!created && draft.details.title.trim()) {
      try {
        const list = await this.http.request<{ items: OwnerAdvertResponse[] }>(
          `/v1/me/adverts?status=DRAFT&limit=50`,
          { method: 'GET', accessToken }
        );
        const normTitle = draft.details.title.trim().toLowerCase();
        const match = (list.items || []).find(
          (it) => (it.title || '').trim().toLowerCase() === normTitle
        );
        if (match) {
          created = match;
          draft.advertId = match.id;
        }
      } catch {}
    }

    // 3. If still no draft, create a new one
    if (!created) {
      created = await this.http.request<OwnerAdvertResponse>(
        '/v1/me/adverts',
        {
          method: 'POST',
          accessToken,
          body: JSON.stringify(mapDraftToCreateAdvert(draft)),
        }
      );
      draft.advertId = created.id;
    } else {
      // If category changed, update category
      if (draft.type?.categoryId && created.categoryId !== draft.type.categoryId) {
        try {
          const catRes = await this.http.request<OwnerAdvertResponse>(
            `/v1/me/adverts/${created.id}/category`,
            {
              method: 'PUT',
              accessToken,
              body: JSON.stringify({
                expectedVersion: created.version,
                categoryId: draft.type.categoryId,
              }),
            }
          );
          if (catRes?.version) created.version = catRes.version;
        } catch {}
      }

      // Update core details
      try {
        const rawDigits = draft.details.priceTl.replace(/\D/g, '');
        const parsedPrice = rawDigits ? Number(rawDigits) : null;
        const patchBody: Record<string, unknown> = {
          expectedVersion: created.version,
          title: draft.details.title.trim() || null,
          description: draft.details.description.trim() || null,
          address: draft.details.address?.trim() || 'Merkez',
          districtId: draft.details.districtId || null,
          horseId: draft.details.horseId || null,
          price: parsedPrice != null ? { amountMinor: Math.round(parsedPrice * 100), currency: 'TRY' } : null,
        };
        const patchRes = await this.http.request<OwnerAdvertResponse>(
          `/v1/me/adverts/${created.id}`,
          {
            method: 'PATCH',
            accessToken,
            body: JSON.stringify(patchBody),
          }
        );
        if (patchRes?.version) created.version = patchRes.version;
      } catch {}
    }

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

    let currentVersion = created.version;

    const address = draft.details.address?.trim() || 'Merkez';
    if (created.address !== address) {
      try {
        const patchRes = await this.http.request<OwnerAdvertResponse>(
          `/v1/me/adverts/${created.id}`,
          {
            method: 'PATCH',
            accessToken,
            body: JSON.stringify({
              expectedVersion: currentVersion,
              address,
            }),
          }
        );
        if (patchRes?.version) {
          currentVersion = patchRes.version;
        }
      } catch {}
    }

    const props = buildDraftProperties(draft);
    if (Object.keys(props).length > 0) {
      const propRes = await this.http.request<OwnerAdvertResponse>(
        `/v1/me/adverts/${created.id}/properties`,
        {
          method: 'PUT',
          accessToken,
          body: JSON.stringify({
            expectedVersion: currentVersion,
            properties: props,
          }),
        }
      );
      if (propRes?.version) {
        currentVersion = propRes.version;
      }
    }

    return {
      advertId: created.id,
      version: currentVersion,
      status: created.status,
    };
  }

  async startPaytrCheckout(
    advertId: AdvertId,
    packageCode: string,
    accessToken: string
  ): Promise<PaytrCheckoutResult> {
    return this.http.request<PaytrCheckoutResult>(
      `/v1/me/adverts/${advertId}/paytr/checkout`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ packageCode }),
      }
    );
  }

  async getPaytrChargeStatus(
    advertId: AdvertId,
    merchantOid: string,
    accessToken: string
  ): Promise<PaytrChargeStatus> {
    return this.http.request<PaytrChargeStatus>(
      `/v1/me/adverts/${advertId}/paytr/charges/${encodeURIComponent(merchantOid)}`,
      { method: 'GET', accessToken }
    );
  }

  /**
   * Legacy path used by mocks / tests: create + assign package + submit.
   * Live HTTP wizard uses createDraft + PayTR instead.
   */
  async publish(
    draft: ListingDraft,
    accessToken: string
  ): Promise<PublishListingResult> {
    const created = await this.createDraft(draft, accessToken);
    draft.advertId = created.advertId;
    const packageCode = draft.packageCode?.trim();
    if (packageCode) {
      await this.http.request(`/v1/me/adverts/${created.advertId}/package`, {
        method: 'PUT',
        accessToken,
        body: JSON.stringify({ packageCode }),
      });
    }
    const submitted = await this.http.request<OwnerAdvertResponse>(
      `/v1/me/adverts/${created.advertId}/submit`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion: created.version }),
      }
    );
    return { advertId: submitted.id, status: submitted.status };
  }
}
