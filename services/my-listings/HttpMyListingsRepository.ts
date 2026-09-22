import { advertRepository } from '@/services/advert';
import { HttpClient, ApiError } from '@/services/http';
import { catalogRepository, type ICatalogRepository } from '@/services/catalog';
import { getAuthSession } from '@/services/auth/sessionStore';
import { applyTjkProfile } from '@/hooks/useListingWizard';
import { HttpTjkRepository } from '@/services/tjk/HttpTjkRepository';
import type { ITjkRepository } from '@/services/tjk/TjkRepository';
import { HttpMediaUploader } from '@/services/media/HttpMediaUploader';
import type {
  MyListingCard,
  MyListingListResponse,
  MyListingStatus,
  UpdateListingRequest,
} from '@/types'
import type { AdvertId } from '@/types/advertId';
import type {
  IMyListingsRepository,
  MyListingEditPayload,
} from './MyListingsRepository';
import { buildDraftProperties } from '@/services/listing/mapDraftToRequest';
import {
  mapOwnerAdvertToCard,
  type OwnerAdvertDto,
  type OwnerAdvertListDto,
} from './mapOwnerAdvert';
import { mapOwnerToListingDraft } from './mapOwnerToListingDraft';
import { backendStatusesForTab } from './statusTabs';

/** ADVERT-OWNER-02/03/04/09 — GET/PATCH/DELETE /v1/me/adverts */
export class HttpMyListingsRepository implements IMyListingsRepository {
  private readonly http: HttpClient;
  private readonly catalog: ICatalogRepository;
  private readonly tjkRepo: ITjkRepository;

  constructor(
    private readonly baseUrl: string,
    catalog: ICatalogRepository = catalogRepository,
    tjkRepo?: ITjkRepository
  ) {
    this.http = new HttpClient(baseUrl);
    this.catalog = catalog;
    this.tjkRepo = tjkRepo ?? new HttpTjkRepository(baseUrl);
  }

  async list(
    status: MyListingStatus,
    accessToken: string
  ): Promise<MyListingListResponse> {
    const sellerId = getAuthSession()?.user.id ?? '';
    const statuses = backendStatusesForTab(status);
    const pages = await Promise.all(
      statuses.map((beStatus) =>
        this.http.request<OwnerAdvertListDto>(
          `/v1/me/adverts?status=${encodeURIComponent(beStatus)}&limit=100`,
          { method: 'GET', accessToken }
        )
      )
    );

    const merged = new Map<AdvertId, MyListingCard>();
    for (const page of pages) {
      for (const item of page.items ?? []) {
        const card = mapOwnerAdvertToCard(item, {
          apiBase: this.baseUrl,
          sellerId,
        });
        merged.set(card.id, card);
      }
    }

    // Collect horseIds that need enrichment
    const horseIdsToFetch = new Set<string>();
    for (const item of merged.values()) {
      if (item.horseId) {
        const props = item.properties || {};
        const hasColor = Boolean(props.COAT_COLOR || props.coatColor || props['Donu (Renk)']);
        const hasAge = Boolean(props.HORSE_AGE || props.age || props['Yaş']);
        const hasBreed = Boolean(props.HORSE_BREED || props.breed || props['At Irkı']);
        const hasGender = Boolean(props.HORSE_GENDER || props.gender || props['Cinsiyet']);
        if (!hasColor || !hasAge || !hasBreed || !hasGender) {
          horseIdsToFetch.add(item.horseId);
        }
      }
    }

    if (horseIdsToFetch.size > 0) {
      await Promise.allSettled(
        Array.from(horseIdsToFetch).map(async (hId) => {
          try {
            const h = await this.tjkRepo.getById(hId);
            if (h) {
              for (const item of merged.values()) {
                if (item.horseId === hId) {
                  const props = item.properties ? { ...item.properties } : {};
                  if (!props.COAT_COLOR && !props.coatColor && h.coatColor) {
                    props.COAT_COLOR = h.coatColor;
                    props.coatColor = h.coatColor;
                  }
                  if (!props.HORSE_BREED && !props.breed && h.breed) {
                    props.HORSE_BREED = h.breed;
                    props.breed = h.breed;
                  }
                  if (!props.HORSE_GENDER && !props.gender && h.gender) {
                    props.HORSE_GENDER = h.gender;
                    props.gender = h.gender;
                  }
                  if (
                    (props.HORSE_AGE == null || props.HORSE_AGE === 0) &&
                    (props.age == null || props.age === 0) &&
                    h.age
                  ) {
                    props.HORSE_AGE = h.age;
                    props.age = h.age;
                  }
                  if (!item.brand && h.breed) {
                    item.brand = h.breed;
                  }
                  item.properties = props;
                }
              }
            }
          } catch {
            /* ignore */
          }
        })
      );
    }

    const items = [...merged.values()].sort((a, b) =>
      a.updatedAt < b.updatedAt ? 1 : -1
    );
    return { items };
  }

  async getEditDraft(
    id: AdvertId,
    accessToken: string
  ): Promise<MyListingEditPayload> {
    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(String(id))}`,
      { method: 'GET', accessToken }
    );
    const tree = await this.catalog.getCategoryTree();
    const draft = mapOwnerToListingDraft(dto, tree, this.baseUrl);
    const propsCount = Object.keys(dto.properties || {}).length;
    if (dto.horseId && propsCount === 0) {
      try {
        const horse = await this.tjkRepo.getById(dto.horseId);
        if (horse) {
          draft.details = applyTjkProfile(draft.details, horse);
        }
      } catch {
        // ignore
      }
    }
    return {
      draft,
      version: dto.version,
      mediaVersion: dto.mediaVersion,
      backendStatus: dto.status,
      rejectionReason:
        (dto as any).rejectionReason ??
        (dto as any).suspensionReason ??
        (dto.properties as any)?.rejectionReason ??
        (dto.properties as any)?.rejection_reason ??
        (dto.properties as any)?.suspensionReason ??
        (dto.properties as any)?.suspension_reason ??
        (dto.properties as any)?.rejectReason ??
        null,
    };
  }

  async update(
    id: AdvertId,
    payload: UpdateListingRequest,
    accessToken: string
  ): Promise<MyListingCard> {
    const body: Record<string, unknown> = {
      expectedVersion: payload.expectedVersion,
      title: payload.title,
      description: payload.description,
    };
    if (payload.provinceId) body.provinceId = payload.provinceId;
    if (payload.address !== undefined) body.address = payload.address;
    if (payload.districtId) body.districtId = payload.districtId;
    if (payload.horseId) body.horseId = payload.horseId;
    if (payload.priceAmountMinor != null) {
      body.price = {
        amountMinor: payload.priceAmountMinor,
        currency: 'TRY',
      };
    } else {
      body.price = null;
    }

    let dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(String(id))}`,
      {
        method: 'PATCH',
        accessToken,
        body: JSON.stringify(body),
      }
    );

    if (payload.draft) {
      const props = buildDraftProperties(payload.draft);
      if (Object.keys(props).length > 0) {
        dto = await this.http.request<OwnerAdvertDto>(
          `/v1/me/adverts/${encodeURIComponent(id)}/properties`,
          {
            method: 'PUT',
            accessToken,
            body: JSON.stringify({
              expectedVersion: dto.version,
              properties: props,
            }),
          }
        );
      }

      // Medya değişikliklerini senkronize et (yeni eklenenler, silinenler, kapak görseli)
      if (Array.isArray(payload.draft.media) && payload.draft.media.length > 0) {
        let mediaVer = dto.mediaVersion ?? 1;
        const currentAssetIds = new Set(
          payload.draft.media
            .map((s) => s.assetId)
            .filter((x): x is string => Boolean(x))
        );

        // Silinen görselleri sunucudan kaldır
        if (Array.isArray(dto.media)) {
          for (const existing of dto.media) {
            if (!currentAssetIds.has(existing.assetId)) {
              try {
                const res = await this.http.request<{ mediaVersion: number }>(
                  `/v1/me/adverts/${encodeURIComponent(String(id))}/media/${encodeURIComponent(existing.assetId)}?expectedMediaVersion=${mediaVer}`,
                  {
                    method: 'DELETE',
                    accessToken,
                  }
                );
                if (res && typeof res.mediaVersion === 'number') {
                  mediaVer = res.mediaVersion;
                }
              } catch {
                // yoksay
              }
            }
          }
        }

        // Yeni eklenen yerel görselleri yükle ve ilana bağla
        let uploader: HttpMediaUploader | null = null;
        for (const slot of payload.draft.media) {
          if (!slot.assetId && slot.uri) {
            if (!uploader) uploader = new HttpMediaUploader(this.baseUrl);
            try {
              const uploaded = await uploader.upload(
                {
                  uri: slot.uri,
                  mimeType: slot.mimeType,
                  fileName: slot.fileName,
                },
                accessToken
              );
              slot.assetId = uploaded.assetId;
              const res = await this.http.request<{ mediaVersion: number }>(
                `/v1/me/adverts/${encodeURIComponent(String(id))}/media`,
                {
                  method: 'POST',
                  accessToken,
                  body: JSON.stringify({
                    assetId: uploaded.assetId,
                    expectedMediaVersion: mediaVer,
                  }),
                }
              );
              if (res && typeof res.mediaVersion === 'number') {
                mediaVer = res.mediaVersion;
              }
            } catch {
              // yoksay
            }
          }
        }

        // Kapak görselini güncelle
        const coverSlot = payload.draft.media.find((m) => m.isCover);
        if (coverSlot?.assetId) {
          try {
            const res = await this.http.request<{ mediaVersion: number }>(
              `/v1/me/adverts/${encodeURIComponent(String(id))}/media/cover`,
              {
                method: 'PUT',
                accessToken,
                body: JSON.stringify({
                  assetId: coverSlot.assetId,
                  expectedMediaVersion: mediaVer,
                }),
              }
            );
            if (res && typeof res.mediaVersion === 'number') {
              mediaVer = res.mediaVersion;
            }
          } catch {
            // yoksay
          }
        }
      }
    }

    advertRepository.invalidate(id);

    const sellerId = getAuthSession()?.user.id ?? '';
    return mapOwnerAdvertToCard(dto, {
      apiBase: this.baseUrl,
      sellerId,
    });
  }


  async removeDraft(
    id: AdvertId,
    expectedVersion: number,
    accessToken: string
  ): Promise<void> {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new ApiError('İlan sürümü geçersiz.', 400, 'VALIDATION_ERROR');
    }
    const q = new URLSearchParams({
      expectedVersion: String(expectedVersion),
    });
    await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}?${q.toString()}`,
      { method: 'DELETE', accessToken }
    );
  }

  async markSold(
    id: AdvertId,
    expectedVersion: number,
    accessToken: string
  ): Promise<MyListingCard> {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new ApiError('İlan sürümü geçersiz.', 400, 'VALIDATION_ERROR');
    }
    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}/sold`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion }),
      }
    );
    const sellerId = getAuthSession()?.user.id ?? '';
    return mapOwnerAdvertToCard(dto, { apiBase: this.baseUrl, sellerId });
  }

  async archive(
    id: AdvertId,
    expectedVersion: number,
    accessToken: string
  ): Promise<MyListingCard> {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new ApiError('İlan sürümü geçersiz.', 400, 'VALIDATION_ERROR');
    }
    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}/archive`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion }),
      }
    );
    advertRepository.invalidate(id);
    const sellerId = getAuthSession()?.user.id ?? '';
    return mapOwnerAdvertToCard(dto, { apiBase: this.baseUrl, sellerId });
  }

  async publish(
    id: AdvertId,
    expectedVersion: number,
    accessToken: string
  ): Promise<MyListingCard> {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new ApiError('İlan sürümü geçersiz.', 400, 'VALIDATION_ERROR');
    }
    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}/publish`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion }),
      }
    );
    advertRepository.invalidate(id);
    const sellerId = getAuthSession()?.user.id ?? '';
    return mapOwnerAdvertToCard(dto, { apiBase: this.baseUrl, sellerId });
  }

  async resubmit(
    id: AdvertId,
    expectedVersion: number,
    accessToken: string
  ): Promise<MyListingCard> {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new ApiError('İlan sürümü geçersiz.', 400, 'VALIDATION_ERROR');
    }
    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(String(id))}/resubmit`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ expectedVersion }),
      }
    );
    advertRepository.invalidate(id);
    const sellerId = getAuthSession()?.user.id ?? '';
    return mapOwnerAdvertToCard(dto, { apiBase: this.baseUrl, sellerId });
  }
}
