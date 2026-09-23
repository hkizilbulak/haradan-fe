import { HttpClient } from '@/services/http';
import { mediaUploader } from '@/services/media/createMediaUploader';
import type { IMediaUploader } from '@/services/media/MediaUploader';
import type {
  ListingDraft,
  ListingMediaSlot,
  ListingPackage,
  OwnerAdvertResponse,
  PublishListingResult,
} from '@/types/listing';
import type { PaytrChargeStatus, PaytrCheckoutResult } from '@/types/paytr';
import type { AdvertId } from '@/types/advertId';
import type { PublicCoupon, PublicCampaign, CouponValidationResult } from '@/types/coupon';
import type { IListingRepository } from './ListingRepository';
import { buildDraftProperties, mapDraftToCreateAdvert } from './mapDraftToRequest';
import { locationLookup } from '@/services/location';
import {
  mapPublicPackage,
  type PublicPackageListResponse,
} from './mapPackage';

type AdvertMediaCollectionResponse = {
  advertId: AdvertId;
  mediaVersion: number;
};

export type DraftPersistResult = {
  advertId: AdvertId;
  version: number;
  mediaVersion: number;
  status: string;
};

type MediaPipeline = {
  advertId: AdvertId;
  promise: Promise<{ version: number; mediaVersion: number }>;
};

const PACKAGES_TTL_MS = 10 * 60 * 1000;

/**
 * Phased listing persist:
 * 1) persistDraftShell — create/update + properties (details → package)
 * 2) background media upload+attach while user picks a package
 * 3) finalizePublish / PayTR — await media, then package (+ submit | checkout)
 */
export class HttpListingRepository implements IListingRepository {
  private readonly http: HttpClient;
  private cached: ListingPackage[] | null = null;
  private packagesFetchedAt = 0;
  private packagesInflight: Promise<ListingPackage[]> | null = null;
  private readonly media: IMediaUploader;
  private mediaPipeline: MediaPipeline | null = null;

  constructor(baseUrl: string, media: IMediaUploader = mediaUploader) {
    this.http = new HttpClient(baseUrl);
    this.media = media;
  }

  getCachedPackages(): ListingPackage[] | null {
    return this.cached;
  }

  async getPackages(): Promise<ListingPackage[]> {
    const now = Date.now();
    if (
      this.cached &&
      this.cached.length > 0 &&
      this.packagesFetchedAt > 0 &&
      now - this.packagesFetchedAt < PACKAGES_TTL_MS
    ) {
      return this.cached;
    }
    if (this.packagesInflight) {
      return this.packagesInflight;
    }
    this.packagesInflight = this.fetchPackages().finally(() => {
      this.packagesInflight = null;
    });
    return this.packagesInflight;
  }

  private async fetchPackages(): Promise<ListingPackage[]> {
    const res = await this.http.request<PublicPackageListResponse>(
      '/v1/packages',
      { method: 'GET' }
    );
    this.cached = (res.items ?? []).map(mapPublicPackage);
    this.packagesFetchedAt = Date.now();
    return this.cached;
  }

  /**
   * Details → package: create/update draft shell + properties, then kick off
   * media uploads in the background (does not wait for uploads to finish).
   */
  async persistDraftShell(
    draft: ListingDraft,
    accessToken: string
  ): Promise<DraftPersistResult> {
    const isNewAdvert = !draft.advertId;
    const shell = await this.upsertDraftShell(draft, accessToken);
    this.startMediaPipeline(draft, accessToken, shell, isNewAdvert);
    return shell;
  }

  /** Wait for in-flight media pipeline for this advert (no-op if none). */
  async awaitMediaPipeline(advertId: AdvertId): Promise<{
    version: number;
    mediaVersion: number;
  } | null> {
    if (!this.mediaPipeline || this.mediaPipeline.advertId !== advertId) {
      return null;
    }
    return this.mediaPipeline.promise;
  }

  /**
   * Full createDraft for callers that need media finished (tests / legacy).
   * Prefer persistDraftShell + awaitMediaPipeline in the wizard.
   */
  async createDraft(
    draft: ListingDraft,
    accessToken: string
  ): Promise<DraftPersistResult> {
    const shell = await this.persistDraftShell(draft, accessToken);
    const media = await this.awaitMediaPipeline(shell.advertId);
    return {
      ...shell,
      version: media?.version ?? shell.version,
      mediaVersion: media?.mediaVersion ?? shell.mediaVersion,
    };
  }

  async startPaytrCheckout(
    advertId: AdvertId,
    packageCode: string,
    accessToken: string,
    couponCode?: string
  ): Promise<PaytrCheckoutResult> {
    await this.awaitMediaPipeline(advertId);
    return this.http.request<PaytrCheckoutResult>(
      `/v1/me/adverts/${advertId}/paytr/checkout`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({
          packageCode,
          ...(couponCode ? { couponCode } : {}),
        }),
      }
    );
  }

  async validateCoupon(
    code: string,
    spendAmountMinor: number,
    packageCode?: string,
    accessToken?: string
  ): Promise<CouponValidationResult> {
    return this.http.request<CouponValidationResult>(
      '/v1/coupons/validate',
      {
        method: 'POST',
        ...(accessToken ? { accessToken } : {}),
        body: JSON.stringify({
          code,
          spendAmountMinor,
          ...(packageCode ? { packageCode } : {}),
        }),
      }
    );
  }

  async getActiveCoupons(): Promise<PublicCoupon[]> {
    const res = await this.http.request<{ items: PublicCoupon[] }>(
      '/v1/coupons/active',
      { method: 'GET' }
    );
    return res.items ?? [];
  }

  async getActiveCampaigns(): Promise<PublicCampaign[]> {
    const res = await this.http.request<{ items: PublicCampaign[] }>(
      '/v1/campaigns',
      { method: 'GET' }
    );
    return res.items ?? [];
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
   * Package CTA (no PayTR): await media → assign package → submit.
   * Draft shell should already exist from persistDraftShell.
   */
  async publish(
    draft: ListingDraft,
    accessToken: string,
    backendStatus?: string | null
  ): Promise<PublishListingResult> {
    let advertId = draft.advertId;
    let version = draft.serverVersion ?? 1;
    let currentStatus = backendStatus;

    if (!advertId) {
      const created = await this.createDraft(draft, accessToken);
      advertId = created.advertId;
      version = created.version;
      currentStatus = created.status;
    } else {
      const media = await this.awaitMediaPipeline(advertId);
      if (media) {
        version = media.version;
        if (!currentStatus) {
          currentStatus = 'DRAFT';
        }
      } else if (!currentStatus) {
        try {
          const serverAdvert = await this.http.request<OwnerAdvertResponse>(
            `/v1/me/adverts/${advertId}`,
            { method: 'GET', accessToken }
          );
          if (serverAdvert?.status) {
            currentStatus = serverAdvert.status;
            version = serverAdvert.version;
          }
        } catch {
          // best-effort fallback
        }
      }

      if (currentStatus && currentStatus !== 'DRAFT' && currentStatus !== 'CHANGES_REQUESTED') {
        version = draft.serverVersion ?? version;
      } else if (!media) {
        // Pipeline missing (reload) — sync media now.
        const synced = await this.syncMediaNow(draft, accessToken, {
          advertId,
          version: draft.serverVersion ?? version,
          mediaVersion: draft.mediaVersion ?? 1,
          status: currentStatus ?? 'DRAFT',
        }, false);
        version = synced.version;
      }
    }

    const packageCode = draft.packageCode?.trim();
    if (packageCode) {
      await this.http.request(`/v1/me/adverts/${advertId}/package`, {
        method: 'PUT',
        accessToken,
        body: JSON.stringify({ packageCode }),
      });
    }

    const submitted = await this.http.request<OwnerAdvertResponse>(
      `/v1/me/adverts/${advertId}/submit`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion: version }),
      }
    );
    return { advertId: submitted.id, status: submitted.status };
  }

  // --- internals ---

  private async upsertDraftShell(
    draft: ListingDraft,
    accessToken: string
  ): Promise<DraftPersistResult> {
    if (draft.details.provinceId) {
      const resolvedProv = locationLookup.resolveProvinceUuid?.(draft.details.provinceId);
      if (resolvedProv && resolvedProv !== draft.details.provinceId) {
        draft.details.provinceId = resolvedProv;
      }
    }
    if (draft.details.districtId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.details.districtId)) {
      const provId = draft.details.provinceId;
      if (provId) {
        try {
          const dists = await locationLookup.listDistricts(provId);
          const legacyName = locationLookup.getDistrictName(draft.details.districtId);
          const matched = dists.find(
            (d) =>
              d.name.toLowerCase() === legacyName.toLowerCase() ||
              (legacyName.toLowerCase().includes('merkez') && d.name.toLowerCase().includes('merkez'))
          );
          if (matched) {
            draft.details.districtId = matched.id;
          }
        } catch {}
      }
    }

    const createBody = mapDraftToCreateAdvert(draft);
    let created: OwnerAdvertResponse;

    if (draft.advertId) {
      // Update existing draft — no title-search round trip.
      created = await this.http.request<OwnerAdvertResponse>(
        `/v1/me/adverts/${draft.advertId}`,
        {
          method: 'PATCH',
          accessToken,
          body: JSON.stringify({
            expectedVersion: draft.serverVersion ?? 1,
            title: createBody.title ?? null,
            description: createBody.description ?? null,
            address: createBody.address ?? 'Merkez',
            districtId: createBody.districtId ?? null,
            horseId: createBody.horseId ?? null,
            price: createBody.price ?? null,
          }),
        }
      );

      if (
        draft.type?.categoryId &&
        created.categoryId &&
        draft.type.categoryId !== created.categoryId
      ) {
        created = await this.http.request<OwnerAdvertResponse>(
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
      }
    } else {
      created = await this.http.request<OwnerAdvertResponse>(
        '/v1/me/adverts',
        {
          method: 'POST',
          accessToken,
          body: JSON.stringify(createBody),
        }
      );
    }

    let version = created.version;
    const props = buildDraftProperties(draft);
    if (Object.keys(props).length > 0) {
      const propRes = await this.http.request<OwnerAdvertResponse>(
        `/v1/me/adverts/${created.id}/properties`,
        {
          method: 'PUT',
          accessToken,
          body: JSON.stringify({
            expectedVersion: version,
            properties: props,
          }),
        }
      );
      version = propRes.version;
    }

    return {
      advertId: created.id,
      version,
      mediaVersion: created.mediaVersion,
      status: created.status,
    };
  }

  private startMediaPipeline(
    draft: ListingDraft,
    accessToken: string,
    shell: DraftPersistResult,
    isNewAdvert = false
  ): void {
    const advertId = shell.advertId;
    const promise = this.syncMediaNow(draft, accessToken, shell, isNewAdvert).finally(() => {
      if (this.mediaPipeline?.advertId === advertId) {
        // keep resolved promise for awaiters; replace only on new start
      }
    });
    this.mediaPipeline = { advertId, promise };
  }

  private async syncMediaNow(
    draft: ListingDraft,
    accessToken: string,
    shell: DraftPersistResult,
    isNewAdvert = false
  ): Promise<{ version: number; mediaVersion: number }> {
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
        slot.assetId = res.assetId;
        return { ...slot, assetId: res.assetId } satisfies ListingMediaSlot;
      })
    );

    let mediaVersion = shell.mediaVersion;
    let existingMediaOnServer: { assetId: string; displayOrder: number; isCover: boolean; lifecycleStatus?: string }[] = [];

    if (!isNewAdvert) {
      try {
        const serverAdvert = await this.http.request<OwnerAdvertResponse>(
          `/v1/me/adverts/${shell.advertId}`,
          {
            method: 'GET',
            accessToken,
          }
        );
        if (Array.isArray(serverAdvert.media)) {
          existingMediaOnServer = serverAdvert.media;
        }
        if (typeof serverAdvert.mediaVersion === 'number') {
          mediaVersion = serverAdvert.mediaVersion;
        }
      } catch {
        // best-effort
      }
    }

    const desiredAssetIds = new Set(
      uploaded.map((m) => m.assetId).filter((id): id is string => Boolean(id))
    );
    const serverAssetIds = new Set(
      existingMediaOnServer.map((m) => m.assetId).filter((id): id is string => Boolean(id))
    );

    // Detach any server media not in current desired draft media
    for (const existing of existingMediaOnServer) {
      if (!desiredAssetIds.has(existing.assetId)) {
        try {
          const res = await this.http.request<AdvertMediaCollectionResponse>(
            `/v1/me/adverts/${shell.advertId}/media/${encodeURIComponent(existing.assetId)}?expectedMediaVersion=${mediaVersion}`,
            {
              method: 'DELETE',
              accessToken,
            }
          );
          if (res && typeof res.mediaVersion === 'number') {
            mediaVersion = res.mediaVersion;
          }
        } catch {
          // best-effort
        }
      }
    }

    const ordered = [
      ...uploaded.filter((m) => m.isCover),
      ...uploaded.filter((m) => !m.isCover),
    ];
    const coverSlot = uploaded.find((m) => m.isCover) ?? uploaded[0];
    const coverIsFirst =
      Boolean(coverSlot?.assetId) && ordered[0]?.assetId === coverSlot?.assetId;

    for (const slot of ordered) {
      if (!slot.assetId || serverAssetIds.has(slot.assetId)) continue;
      const attached = await this.http.request<AdvertMediaCollectionResponse>(
        `/v1/me/adverts/${shell.advertId}/media`,
        {
          method: 'POST',
          accessToken,
          body: JSON.stringify({
            assetId: slot.assetId,
            expectedMediaVersion: mediaVersion,
          }),
        }
      );
      mediaVersion = attached.mediaVersion;
      serverAssetIds.add(slot.assetId);
    }

    if (coverSlot?.assetId && (!coverIsFirst || existingMediaOnServer.length > 0)) {
      const currentCover = existingMediaOnServer.find((m) => m.isCover);
      if (currentCover?.assetId !== coverSlot.assetId) {
        try {
          const covered = await this.http.request<AdvertMediaCollectionResponse>(
            `/v1/me/adverts/${shell.advertId}/media/cover`,
            {
              method: 'PUT',
              accessToken,
              body: JSON.stringify({
                assetId: coverSlot.assetId,
                expectedMediaVersion: mediaVersion,
              }),
            }
          );
          mediaVersion = covered.mediaVersion;
        } catch {
          // best-effort
        }
      }
    }

    return { version: shell.version, mediaVersion };
  }
}
