import { HttpClient, ApiError } from '@/services/http';
import { catalogRepository, type ICatalogRepository } from '@/services/catalog';
import { getAuthSession } from '@/services/auth/sessionStore';
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

  constructor(
    private readonly baseUrl: string,
    catalog: ICatalogRepository = catalogRepository
  ) {
    this.http = new HttpClient(baseUrl);
    this.catalog = catalog;
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
    return {
      draft: mapOwnerToListingDraft(dto, tree, this.baseUrl),
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

    const dto = await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        accessToken,
        body: JSON.stringify(body),
      }
    );

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
    if (id.startsWith('adv-') || id.startsWith('mock-')) {
      const { removeMockDraftFromStore, removeMockVersionFromStore } = await import(
        './mockListingStore'
      );
      removeMockDraftFromStore(id);
      removeMockVersionFromStore(id);
      return;
    }
    const q = new URLSearchParams({
      expectedVersion: String(expectedVersion),
    });
    await this.http.request<OwnerAdvertDto>(
      `/v1/me/adverts/${encodeURIComponent(id)}?${q.toString()}`,
      { method: 'DELETE', accessToken }
    );
  }
}
