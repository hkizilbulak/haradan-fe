import type {
  ListingDraft,
  MyListingCard,
  MyListingListResponse,
  MyListingStatus,
  UpdateListingRequest,
} from '@/types';

export type MyListingEditPayload = {
  draft: ListingDraft;
  version: number;
  mediaVersion: number;
};

/**
 * Satıcının kendi ilanları.
 * GET    /v1/me/adverts?status=
 * GET    /v1/me/adverts/:id
 * PATCH  /v1/me/adverts/:id
 * DELETE /v1/me/adverts/:id?expectedVersion=
 * POST   /v1/me/adverts/:id/sold  (ADVERT-OWNER-10)
 */
export interface IMyListingsRepository {
  list(
    status: MyListingStatus,
    accessToken: string
  ): Promise<MyListingListResponse>;
  getEditDraft(id: string, accessToken: string): Promise<MyListingEditPayload>;
  update(
    id: string,
    payload: UpdateListingRequest,
    accessToken: string
  ): Promise<MyListingCard>;
  removeDraft(
    id: string,
    expectedVersion: number,
    accessToken: string
  ): Promise<void>;
  markSold(
    id: string,
    expectedVersion: number,
    accessToken: string
  ): Promise<MyListingCard>;
}
