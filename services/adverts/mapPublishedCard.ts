import { resolvePublicMediaUrl } from '@/services/media/publicUrl';
import { formatAdvertLocation } from '@/services/location';
import type {
  CatalogProductCard,
  PublishedAdvertCard,
  PublicMediaItem,
} from '@/types';
import type { AdvertId } from '@/types/advertId';
import { parseAdvertId } from '@/types/advertId';

type BePublishedCard = {
  id: AdvertId | string;
  title: string;
  publishedAt: string;
  price: { amountMinor: number; currency: string } | null;
  categoryId: string;
  districtId: string;
  provinceId: string;
  districtName?: string | null;
  provinceName?: string | null;
  locationName?: string | null;
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
  const districtId = card.districtId ?? '';
  const provinceId = card.provinceId ?? '';
  const districtName = card.districtName ?? null;
  const provinceName = card.provinceName ?? null;
  const locationName =
    card.locationName ??
    formatAdvertLocation({
      districtId,
      provinceId,
      districtName,
      provinceName,
    }) ??
    null;

  const cardProps = (card as any).properties ?? null;

  return {
    id: typeof card.id === 'number' ? card.id : (parseAdvertId(card.id) ?? 0),
    title: card.title,
    publishedAt: card.publishedAt,
    price: card.price,
    categoryId: card.categoryId,
    districtId,
    provinceId,
    districtName,
    provinceName,
    locationName,
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
    properties: cardProps ?? {},
  };


}

export type { BePublishedCard };
