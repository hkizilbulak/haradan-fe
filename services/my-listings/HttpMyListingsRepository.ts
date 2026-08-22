import { HttpClient, ApiError } from '@/services/http';
import { catalogRepository, type ICatalogRepository } from '@/services/catalog';
import { getAuthSession } from '@/services/auth/sessionStore';
import { applyTjkProfile } from '@/hooks/useListingWizard';
import { HttpTjkRepository } from '@/services/tjk/HttpTjkRepository';
import type { ITjkRepository } from '@/services/tjk/TjkRepository';
import type {
  MyListingCard,
  MyListingListResponse,
  MyListingStatus,
  UpdateListingRequest,
} from '@/types';
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

    const merged = new Map<string, MyListingCard>();
    for (const page of pages) {
      for (const item of page.items ?? []) {
        const card = mapOwnerAdvertToCard(item, {
          apiBase: this.baseUrl,
          sellerId,
        });
        merged.set(card.id, card);
      }
    }

    const items = [...merged.values()].sort((a, b) =>
      a.updatedAt < b.updatedAt ? 1 : -1
    );
    return { items };
  }

  async getEditDraft(
    id: string,
    accessToken: string
  ): Promise<MyListingEditPayload> {
    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}`,
      { method: 'GET', accessToken }
    );
    const tree = await this.catalog.getCategoryTree();
    const draft = mapOwnerToListingDraft(dto, tree, this.baseUrl);
    if (dto.horseId) {
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
    };
  }

  async update(
    id: string,
    payload: UpdateListingRequest,
    accessToken: string
  ): Promise<MyListingCard> {
    const body: Record<string, unknown> = {
      expectedVersion: payload.expectedVersion,
      title: payload.title,
      description: payload.description,
    };
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
      `/v1/me/adverts/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        accessToken,
        body: JSON.stringify(body),
      }
    );

    if (payload.draft) {
      const props = buildDraftProperties(payload.draft);
      if (Object.keys(props).length > 0) {
        try {
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
        } catch {
          // Unseeded dynamic properties are ignored gracefully without blocking update
        }
      }
    }

    const sellerId = getAuthSession()?.user.id ?? '';
    return mapOwnerAdvertToCard(dto, {
      apiBase: this.baseUrl,
      sellerId,
    });
  }

  async removeDraft(
    id: string,
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
    id: string,
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
}
