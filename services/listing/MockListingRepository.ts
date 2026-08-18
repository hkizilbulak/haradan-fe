import { ApiError } from '@/services/http';
import { addMockListingFromDraft } from '@/services/my-listings/mockListingStore';
import type {
  ListingDraft,
  ListingPackage,
  PublishListingResult,
} from '@/types/listing';
import type { IListingRepository } from './ListingRepository';
import { LISTING_PACKAGES } from './listingPackages';
import { mapDraftToCreateAdvert } from './mapDraftToRequest';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockListingRepository implements IListingRepository {
  getCachedPackages(): ListingPackage[] | null {
    return LISTING_PACKAGES;
  }

  async getPackages(): Promise<ListingPackage[]> {
    await wait(80);
    return LISTING_PACKAGES;
  }

  async publish(
    draft: ListingDraft,
    _accessToken: string
  ): Promise<PublishListingResult> {
    await wait(280);
    const payload = mapDraftToCreateAdvert(draft);
    if (!payload.title?.trim() || !payload.categoryId) {
      throw new ApiError('Eksik ilan bilgisi.', 400, 'VALIDATION_ERROR');
    }
    return addMockListingFromDraft(draft);
  }
}
