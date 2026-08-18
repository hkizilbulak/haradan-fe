import { resolvePublicMediaUrl } from '@/services/media/publicUrl';
import type {
  CatalogProductCard,
  PublishedAdvertCard,
  PublicMediaItem,
} from '@/types';

type BePublishedCard = {
  id: string;
  title: string;
  publishedAt: string;
  price: { amountMinor: number; currency: string } | null;
  categoryId: string;
  districtId: string;
  provinceId: string;
  horseId?: string | null;
  cover: {
    assetId: string;
    displayOrder: number;
    isCover: boolean;
    publicUrl: string;
    usage?: string | null;
  } | null;
  isFavorite: boolean | null;
  packageCode?: string | null;
  packageDisplayName?: string | null;
  packageBadgeText?: string | null;
  isUrgent: boolean;
  urgentActivatedAt?: string | null;
  isFeatured?: boolean;
  featuredUntil?: string | null;
  viewCount?: number;
};

function mapCover(
  cover: BePublishedCard['cover'],
  apiBase: string
): PublicMediaItem | null {
  if (!cover) return null;
  return {
    assetId: cover.assetId,
    displayOrder: cover.displayOrder,
    isCover: cover.isCover,
    publicUrl: resolvePublicMediaUrl(cover.publicUrl, apiBase),
    usage: cover.usage,
  };
}

/** BE PublishedAdvertCard → UI CatalogProductCard. */
export function mapPublishedCardToCatalog(
  card: BePublishedCard | PublishedAdvertCard,
  apiBase: string
): CatalogProductCard {
  return {
    id: card.id,
    title: card.title,
    publishedAt: card.publishedAt,
    price: card.price,
    categoryId: card.categoryId,
    districtId: card.districtId,
    provinceId: card.provinceId,
    horseId: card.horseId ?? null,
    cover: mapCover(card.cover as BePublishedCard['cover'], apiBase),
    isFavorite: card.isFavorite,
    packageCode: card.packageCode ?? null,
    packageDisplayName: card.packageDisplayName ?? null,
    packageBadgeText: card.packageBadgeText ?? null,
    isUrgent: card.isUrgent,
    urgentActivatedAt: card.urgentActivatedAt ?? null,
    isFeatured: Boolean(card.isFeatured),
    featuredUntil: card.featuredUntil ?? null,
    rating: 0,
    reviewCount: 0,
    viewCount: card.viewCount ?? 0,
    oldPrice: null,
    available: null,
    brand: null,
  };
}

export type { BePublishedCard };
