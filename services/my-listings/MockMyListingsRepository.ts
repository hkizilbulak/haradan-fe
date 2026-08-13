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
import type { IMyListingsRepository } from './MyListingsRepository';
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

  async getEditDraft(id: string, _accessToken: string): Promise<ListingDraft> {
    await wait(180);
    const card = this.items.find((item) => item.id === id);
    if (!card) {
      throw new ApiError('İlan bulunamadı.', 404, 'NOT_FOUND');
    }
    const cached = this.drafts.get(id);
    if (cached) return cached;
    const detail = getMockAdvertDetail(id);
    const draft = mapAdvertToListingDraft(detail, card, MOCK_CATEGORIES);
    this.drafts.set(id, draft);
    return draft;
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
    const cover = payload.draft.media.find((m) => m.isCover) ?? payload.draft.media[0];
    const next: MyListingCard = {
      ...this.items[index],
      title: payload.title,
      price:
        payload.priceAmountMinor != null
          ? { amountMinor: payload.priceAmountMinor, currency: 'TRY' }
          : this.items[index].price,
      provinceId: payload.provinceId,
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
    };
    this.items[index] = next;
    this.drafts.set(id, payload.draft);
    return next;
  }
}
