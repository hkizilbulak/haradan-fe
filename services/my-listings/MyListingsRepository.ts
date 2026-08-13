import type {
  ListingDraft,
  MyListingCard,
  MyListingListResponse,
  MyListingStatus,
  UpdateListingRequest,
} from '@/types';

/**
 * Satıcının kendi ilanları.
 * GET   /v1/me/listings?status=
 * GET   /v1/me/listings/:id/edit
 * PATCH /v1/me/listings/:id
 */
export interface IMyListingsRepository {
  list(
    status: MyListingStatus,
    accessToken: string
  ): Promise<MyListingListResponse>;
  getEditDraft(id: string, accessToken: string): Promise<ListingDraft>;
  update(
    id: string,
    payload: UpdateListingRequest,
    accessToken: string
  ): Promise<MyListingCard>;
}
