import type {
  ListingDraft,
  ListingPackage,
  PublishListingResult,
} from '@/types/listing';

/**
 * İlan taslağı + paketler.
 * GET  /v1/packages
 * POST /v1/me/adverts
 * POST /v1/me/adverts/{id}/submit
 */
export interface IListingRepository {
  getPackages(): Promise<ListingPackage[]>;
  getCachedPackages(): ListingPackage[] | null;
  publish(
    draft: ListingDraft,
    accessToken: string
  ): Promise<PublishListingResult>;
}
