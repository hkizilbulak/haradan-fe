/** OpenAPI: BannerPlacement */
export type BannerPlacement =
  | 'HOMEPAGE'
  | 'HOMEPAGE_HERO'
  | 'HOMEPAGE_PROMO'
  | 'LISTING_DETAIL'
  | 'SEARCH';

/** OpenAPI: ActiveBannerItem */
export type ActiveBannerItem = {
  id: string;
  placement: BannerPlacement;
  title?: string | null;
  altText?: string | null;
  targetUrl?: string | null;
  sortOrder: number;
  imageUrl: string;
};

/** OpenAPI: ActiveBannerListResponse */
export type ActiveBannerListResponse = {
  items: ActiveBannerItem[];
};
