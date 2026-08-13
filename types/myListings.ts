import type { CatalogProductCard } from './catalog';
import type { ListingDraft } from './listing';

export type MyListingStatus = 'published' | 'draft' | 'sold';

export type MyListingCard = CatalogProductCard & {
  status: MyListingStatus;
  sellerId: string;
  updatedAt: string;
  soldAt?: string | null;
};

export type MyListingListResponse = {
  items: MyListingCard[];
};

export type UpdateListingRequest = {
  title: string;
  description: string;
  priceAmountMinor: number | null;
  provinceId: string;
  sellerPhone: string | null;
  draft: ListingDraft;
};
