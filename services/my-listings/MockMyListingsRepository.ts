import { MOCK_CATEGORIES } from '@/mocks/homepage';
import { getMockAdvertDetail } from '@/mocks/advertDetail';
import { MOCK_MY_LISTINGS } from '@/mocks/myListings';
import { ApiError } from '@/services/http';
import type {
  ListingDraft,
  MyListingCard,
  MyListingListResponse,
  MyListingStatus,
  UpdateListingRequest,
} from '@/types';
import type {
  IMyListingsRepository,
  MyListingEditPayload,
} from './MyListingsRepository';
import { mapAdvertToListingDraft } from './mapAdvertToListingDraft';
import {
  getOrCreateMockDraft,
  isBrowserStore,
  readMockDrafts,
  readMockItems,
  readMockVersions,
  removeMockDraftFromStore,
  removeMockVersionFromStore,
  writeMockDraft,
  writeMockItems,
  writeMockVersion,
} from './mockListingStore';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(items: MyListingCard[]): MyListingCard[] {
  return items.map((item) => ({ ...item }));
}

export class MockMyListingsRepository implements IMyListingsRepository {
  private instanceItems: MyListingCard[] = clone(MOCK_MY_LISTINGS);
  private instanceDrafts = new Map<string, ListingDraft>();
  private instanceVersions = new Map<string, number>();

  private getItems(): MyListingCard[] {
    return isBrowserStore ? readMockItems() : this.instanceItems;
  }

  private setItems(items: MyListingCard[]): void {
    this.instanceItems = items;
    if (isBrowserStore) {
      writeMockItems(items);
    }
  }

  private getDraft(id: string, card: MyListingCard): ListingDraft {
    if (isBrowserStore) {
      return getOrCreateMockDraft(id, card);
    }
    const cached = this.instanceDrafts.get(id);
    if (cached) return cached;
    const detail = getMockAdvertDetail(id);
    const draft = mapAdvertToListingDraft(detail, card, MOCK_CATEGORIES);
    this.instanceDrafts.set(id, draft);
    this.instanceVersions.set(id, 1);
    return draft;
  }

  private saveDraft(id: string, draft: ListingDraft, version: number): void {
    this.instanceDrafts.set(id, draft);
    this.instanceVersions.set(id, version);
    if (isBrowserStore) {
      writeMockDraft(id, draft);
      writeMockVersion(id, version);
    }
  }

  private getVersion(id: string, fallback: number): number {
    if (isBrowserStore) {
      const versions = readMockVersions();
      return versions[id] ?? fallback;
    }
    return this.instanceVersions.get(id) ?? fallback;
  }

  private removeDraftFromStorage(id: string): void {
    this.instanceDrafts.delete(id);
    this.instanceVersions.delete(id);
    if (isBrowserStore) {
      removeMockDraftFromStore(id);
      removeMockVersionFromStore(id);
    }
  }

  async list(
    status: MyListingStatus,
    _accessToken: string
  ): Promise<MyListingListResponse> {
    await wait(220);
    const items = this.getItems();
    return {
      items: items
        .filter((item) => item.status === status)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    };
  }

  async getEditDraft(
    id: string,
    _accessToken: string
  ): Promise<MyListingEditPayload> {
    await wait(180);
    const items = this.getItems();
    const card = items.find((item) => item.id === id);
    if (!card) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const draft = this.getDraft(id, card);
    const version = this.getVersion(id, card.version ?? 1);
    return { draft, version, mediaVersion: 1 };
  }

  async update(
    id: string,
    payload: UpdateListingRequest,
    _accessToken: string
  ): Promise<MyListingCard> {
    await wait(280);
    const items = [...this.getItems()];
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const currentVersion = this.getVersion(id, items[index].version ?? 1);
    if (payload.expectedVersion !== currentVersion) {
      throw new ApiError(
        'İlan başka bir yerden güncellendi; sayfayı yenileyin.',
        409,
        'STALE_VERSION'
      );
    }
    const cover =
      payload.draft.media.find((m) => m.isCover) ?? payload.draft.media[0];
    const next: MyListingCard = {
      ...items[index],
      title: payload.title,
      price:
        payload.priceAmountMinor != null
          ? { amountMinor: payload.priceAmountMinor, currency: 'TRY' }
          : items[index].price,
      provinceId: payload.provinceId,
      districtId: payload.districtId ?? items[index].districtId,
      cover: cover
        ? {
            assetId: cover.assetId ?? cover.localId,
            displayOrder: 0,
            isCover: true,
            publicUrl: cover.uri,
            usage: 'cover',
          }
        : items[index].cover,
      updatedAt: new Date().toISOString(),
      version: currentVersion + 1,
    };
    items[index] = next;
    this.setItems(items);
    this.saveDraft(id, payload.draft, currentVersion + 1);
    return next;
  }

  async removeDraft(
    id: string,
    expectedVersion: number,
    _accessToken: string
  ): Promise<void> {
    await wait(180);
    const items = [...this.getItems()];
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const currentVersion = this.getVersion(id, items[index].version ?? 1);
    if (expectedVersion !== currentVersion) {
      throw new ApiError(
        'İlan başka bir yerden güncellendi; sayfayı yenileyin.',
        409,
        'STALE_VERSION'
      );
    }
    items.splice(index, 1);
    this.setItems(items);
    this.removeDraftFromStorage(id);
  }
}
