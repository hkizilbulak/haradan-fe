import { ApiError } from '@/services/http';
import { addMockListingFromDraft } from '@/services/my-listings/mockListingStore';
import type {
  ListingDraft,
  ListingPackage,
  PublishListingResult,
} from '@/types/listing';
import type { AdvertId } from '@/types/advertId';
import type { IListingRepository } from './ListingRepository';
import type { DraftPersistResult } from './HttpListingRepository';
import { LISTING_PACKAGES } from './listingPackages';
import { mapDraftToCreateAdvert } from './mapDraftToRequest';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockListingRepository implements IListingRepository {
  private mediaPipeline: {
    advertId: AdvertId;
    promise: Promise<{ version: number; mediaVersion: number }>;
  } | null = null;
  private nextId = 9000;

  getCachedPackages(): ListingPackage[] | null {
    return LISTING_PACKAGES;
  }

  async getPackages(): Promise<ListingPackage[]> {
    await wait(80);
    return LISTING_PACKAGES;
  }

  async persistDraftShell(
    draft: ListingDraft,
    _accessToken: string
  ): Promise<DraftPersistResult> {
    await wait(60);
    const payload = mapDraftToCreateAdvert(draft);
    if (!payload.title?.trim() || !payload.categoryId) {
      throw new ApiError('Eksik ilan bilgisi.', 400, 'VALIDATION_ERROR');
    }
    const advertId = draft.advertId ?? (this.nextId++ as AdvertId);
    const shell: DraftPersistResult = {
      advertId,
      version: draft.serverVersion ?? 1,
      mediaVersion: draft.mediaVersion ?? 1,
      status: 'DRAFT',
    };
    this.mediaPipeline = {
      advertId,
      promise: (async () => {
        await wait(120);
        return {
          version: shell.version,
          mediaVersion: shell.mediaVersion + Math.max(1, draft.media.length),
        };
      })(),
    };
    return shell;
  }

  async awaitMediaPipeline(
    advertId: AdvertId
  ): Promise<{ version: number; mediaVersion: number } | null> {
    if (!this.mediaPipeline || this.mediaPipeline.advertId !== advertId) {
      return null;
    }
    return this.mediaPipeline.promise;
  }

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

  async publish(
    draft: ListingDraft,
    accessToken: string
  ): Promise<PublishListingResult> {
    let advertId = draft.advertId;
    if (!advertId) {
      const created = await this.createDraft(draft, accessToken);
      advertId = created.advertId;
    } else {
      await this.awaitMediaPipeline(advertId);
    }
    await wait(80);
    return addMockListingFromDraft({ ...draft, advertId });
  }
}
