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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(items: MyListingCard[]): MyListingCard[] {
  return items.map((item) => ({ ...item }));
}

export class MockMyListingsRepository implements IMyListingsRepository {
  private items: MyListingCard[] = clone(MOCK_MY_LISTINGS);
  private drafts = new Map<string, ListingDraft>();
  private versions = new Map<string, number>();

  async list(
    status: MyListingStatus,
    _accessToken: string
  ): Promise<MyListingListResponse> {
    await wait(220);
    return {
      items: this.items
        .filter((item) => item.status === status)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    };
  }

  async getEditDraft(
    id: string,
    _accessToken: string
  ): Promise<MyListingEditPayload> {
    await wait(180);
    const card = this.items.find((item) => item.id === id);
    if (!card) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const cached = this.drafts.get(id);
    if (cached) {
      return {
        draft: cached,
        version: this.versions.get(id) ?? 1,
        mediaVersion: 1,
      };
    }
    const detail = getMockAdvertDetail(id);
    const draft = mapAdvertToListingDraft(detail, card, MOCK_CATEGORIES);
    this.drafts.set(id, draft);
    this.versions.set(id, 1);
    return { draft, version: 1, mediaVersion: 1 };
  }

  async update(
    id: string,
    payload: UpdateListingRequest,
    _accessToken: string
  ): Promise<MyListingCard> {
    await wait(280);
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const currentVersion = this.versions.get(id) ?? 1;
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
      ...this.items[index],
      title: payload.title,
      price:
        payload.priceAmountMinor != null
          ? { amountMinor: payload.priceAmountMinor, currency: 'TRY' }
          : this.items[index].price,
      provinceId: payload.provinceId,
      districtId: payload.districtId ?? this.items[index].districtId,
      cover: cover
        ? {
            assetId: cover.assetId ?? cover.localId,
            displayOrder: 0,
            isCover: true,
            publicUrl: cover.uri,
            usage: 'cover',
          }
        : this.items[index].cover,
      updatedAt: new Date().toISOString(),
      version: currentVersion + 1,
    };
    this.items[index] = next;
    this.drafts.set(id, payload.draft);
    this.versions.set(id, currentVersion + 1);
    return next;
  }

  async removeDraft(
    id: string,
    expectedVersion: number,
    _accessToken: string
  ): Promise<void> {
    await wait(180);
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const current = this.items[index];
    const currentVersion = this.versions.get(id) ?? current.version ?? 1;
    if (expectedVersion !== currentVersion) {
      throw new ApiError(
        'İlan başka bir yerden güncellendi; sayfayı yenileyin.',
        409,
        'STALE_VERSION'
      );
    }
    this.items.splice(index, 1);
    this.drafts.delete(id);
    this.versions.delete(id);
  }
}
