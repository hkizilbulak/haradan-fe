import type { Money } from './money';
import type { PublicMediaItem } from './media';

/** OpenAPI: PackageCode */
export type PackageCode = string;

/**
 * OpenAPI: PublishedAdvertCard
 * GET /v1/homepage/new-adverts | /v1/homepage/showcase | /v1/adverts
 */
export type PublishedAdvertCard = {
  id: string;
  title: string;
  publishedAt: string;
  price: Money | null;
  categoryId: string;
  districtId: string;
  provinceId: string;
  horseId?: string | null;
  cover: PublicMediaItem | null;
  isFavorite: boolean | null;
  packageCode?: PackageCode | null;
  packageDisplayName?: string | null;
  packageBadgeText?: string | null;
  isUrgent: boolean;
  urgentActivatedAt?: string | null;
  isFeatured?: boolean;
  featuredUntil?: string | null;
};

/** OpenAPI: PublishedAdvertSearchResponse */
export type PublishedAdvertSearchResponse = {
  items: PublishedAdvertCard[];
  nextCursor?: string | null;
  hasMore: boolean;
};
