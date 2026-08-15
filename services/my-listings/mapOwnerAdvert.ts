import { pickDeliverableCover } from '@/services/media/pickDeliverableCover';
import { mediaDeliveryUrl } from '@/services/media/publicUrl';
import type { Money, MyListingCard, PublicMediaItem } from '@/types';
import { toMyListingTab } from './statusTabs';

export type OwnerMediaRelationDto = {
  assetId: string;
  displayOrder: number;
  isCover: boolean;
  lifecycleStatus: string;
};

/** BE OwnerAdvertResponse (+ provinceId / updatedAt enrichment). */
export type OwnerAdvertDto = {
  id: string;
  status: string;
  version: number;
  mediaVersion: number;
  categoryId: string | null;
  districtId: string | null;
  provinceId?: string | null;
  horseId: string | null;
  title: string | null;
  description: string | null;
  price: Money | null;
  properties: Record<string, unknown>;
  media?: OwnerMediaRelationDto[];
  publishedAt?: string | null;
  deletedAt?: string | null;
  updatedAt?: string;
};

export type OwnerAdvertListDto = {
  items: OwnerAdvertDto[];
  hasMore: boolean;
  nextCursor?: string | null;
};

function pickCover(
  media: OwnerMediaRelationDto[] | undefined,
  apiBase: string
): PublicMediaItem | null {
  const cover = pickDeliverableCover(media);
  if (!cover) return null;
  return {
    assetId: cover.assetId,
    displayOrder: cover.displayOrder,
    isCover: true,
    // DETAIL variants are produced with every master; HOMEPAGE may lag.
    publicUrl: mediaDeliveryUrl(cover.assetId, 'DETAIL', apiBase),
    usage: 'cover',
  };
}

/**
 * Owner DTO → İlanlarım kartı (CatalogProductCard uyumlu).
 */
export function mapOwnerAdvertToCard(
  dto: OwnerAdvertDto,
  opts: { apiBase: string; sellerId: string }
): MyListingCard {
  const publishedAt =
    dto.publishedAt ?? dto.updatedAt ?? new Date(0).toISOString();
  const updatedAt = dto.updatedAt ?? publishedAt;
  return {
    id: dto.id,
    title: (dto.title ?? '').trim() || 'Başlıksız ilan',
    publishedAt,
    price: dto.price,
    categoryId: dto.categoryId ?? '',
    districtId: dto.districtId ?? '',
    provinceId: dto.provinceId ?? '',
    horseId: dto.horseId,
    cover: pickCover(dto.media, opts.apiBase),
    isFavorite: false,
    packageCode: null,
    packageDisplayName: null,
    packageBadgeText: null,
    isUrgent: false,
    urgentActivatedAt: null,
    rating: 0,
    reviewCount: 0,
    viewCount: 0,
    oldPrice: null,
    available: null,
    brand: null,
    status: toMyListingTab(dto.status),
    sellerId: opts.sellerId,
    updatedAt,
    soldAt: dto.status === 'SOLD' ? updatedAt : null,
  };
}
