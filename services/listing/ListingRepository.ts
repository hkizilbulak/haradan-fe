import type {
  CreateListingRequest,
  CreateListingResponse,
  ListingPackage,
  ListingPaymentInstructions,
} from '@/types/listing';

/**
 * İlan taslağı + paketler + ödeme talimatı.
 * GET  /v1/listing-packages
 * POST /v1/listings/drafts
 * GET  /v1/listings/drafts/:id/payment
 */
export interface IListingRepository {
  getPackages(): Promise<ListingPackage[]>;
  getCachedPackages(): ListingPackage[] | null;
  createDraft(
    payload: CreateListingRequest,
    accessToken: string
  ): Promise<CreateListingResponse>;
  getPaymentInstructions(
    draftId: string,
    accessToken: string
  ): Promise<ListingPaymentInstructions>;
}
