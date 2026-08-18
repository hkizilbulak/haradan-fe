import type { CatalogProductCard } from './catalog';
import type { ListingDraft } from './listing';

export type MyListingStatus =
  | 'published'
  | 'pending'
  | 'rejected'
  | 'draft'
  | 'sold';

export type MyListingCard = CatalogProductCard & {
  status: MyListingStatus;
  /** BE AdvertStatus — taslak silme yalnızca DRAFT. */
  backendStatus: string;
  version: number;
  sellerId: string;
  updatedAt: string;
  soldAt?: string | null;
};

export type MyListingListResponse = {
  items: MyListingCard[];
};

export type UpdateListingRequest = {
  expectedVersion: number;
  title: string;
  description: string;
  priceAmountMinor: number | null;
  provinceId: string;
  districtId: string | null;
  horseId: string | null;
  sellerPhone: string | null;
  draft: ListingDraft;
};
