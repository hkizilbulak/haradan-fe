import { filterDeliverableMedia } from '@/services/media/pickDeliverableCover';
import {
  mediaDeliveryUrl,
  resolvePublicMediaUrl,
} from '@/services/media/publicUrl';
import type { OwnerAdvertDto } from '@/services/my-listings/mapOwnerAdvert';
import type {
  AdvertDetail,
  HorseProfile,
  Money,
  PublicMediaItem,
} from '@/types';

type BeMoney = { amountMinor: number; currency: string } | null;

type BePublicMedia = {
  assetId: string;
  displayOrder: number;
  isCover: boolean;
  publicUrl: string;
  usage?: string | null;
};

export type BePublishedAdvertDetail = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  price: BeMoney;
  category: { id: string; name: string; slug: string };
  location: {
    districtId: string;
    districtName: string;
    provinceId: string;
    provinceName: string;
  };
  horse: {
    id: string;
    originalName: string;
    tjkNumber: string;
  } | null;
  media: BePublicMedia[];
  properties: {
    code: string;
    title: string;
    value: unknown;
    displayValue?: string | null;
  }[];
  isFavorite: boolean | null;
  packageCode?: string | null;
  packageDisplayName?: string | null;
  packageBadgeText?: string | null;
  isUrgent: boolean;
  urgentActivatedAt?: string | null;
  viewCount?: number;
};

const EMPTY_HORSE: HorseProfile = {
  registeredName: '',
  age: 0,
  birthDate: '',
  gender: 'Erkek',
  coatColor: '',
  heightCm: null,
  breed: '',
  sire: '',
  dam: '',
  damsire: '',
  owners: [],
  breeder: '',
  trainer: '',
  career: { starts: 0, first: 0, second: 0, third: 0, fourth: 0, fifth: 0 },
  yearly: [],
  careerEarnings: { amountMinor: 0, currency: 'TRY' },
  handicap: 0,
  races: [],
  offspring: null,
};

function absolutizeMedia(
  items: BePublicMedia[],
  apiBase: string
): PublicMediaItem[] {
  return items
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((m) => ({
      assetId: m.assetId,
      displayOrder: m.displayOrder,
      isCover: m.isCover,
      publicUrl: resolvePublicMediaUrl(m.publicUrl, apiBase),
      usage: m.usage,
    }));
}

function emptyDetailShell(
  partial: Pick<
    AdvertDetail,
    | 'id'
    | 'title'
    | 'description'
    | 'publishedAt'
    | 'price'
    | 'categoryId'
    | 'districtId'
    | 'provinceId'
    | 'horseId'
    | 'cover'
    | 'gallery'
    | 'isFavorite'
    | 'packageCode'
    | 'packageDisplayName'
    | 'packageBadgeText'
    | 'isUrgent'
    | 'urgentActivatedAt'
    | 'sellerId'
    | 'breadcrumbs'
    | 'horse'
    | 'specs'
    | 'viewCount'
  >
): AdvertDetail {
  return {
    ...partial,
    slug: partial.id,
    rating: 0,
    reviewCount: 0,
    viewCount: partial.viewCount ?? 0,
    oldPrice: null,
    brand: null,
    available: true,
    sellerPhone: null,
    shipping: [],
    warranties: [],
    bundleTitle: '',
    bundleItems: [],
    reviews: [],
    ratingBreakdown: [],
    viewed: [],
    related: [],
  };
}

export function mapPublishedDetailToAdvert(
  dto: BePublishedAdvertDetail,
  apiBase: string,
  sellerId?: string | null
): AdvertDetail {
  const gallery = absolutizeMedia(dto.media ?? [], apiBase);
  const cover =
    gallery.find((m) => m.isCover) ?? gallery[0] ?? null;
  const horse: HorseProfile = dto.horse
    ? {
        ...EMPTY_HORSE,
        registeredName: dto.horse.originalName,
      }
    : EMPTY_HORSE;

  const propRows = (dto.properties ?? [])
    .map((p) => ({
      label: p.title,
      value:
        p.displayValue?.trim() ||
        (p.value == null ? '' : String(p.value)),
    }))
    .filter((r) => r.value);

  return emptyDetailShell({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    publishedAt: dto.publishedAt,
    price: dto.price as Money | null,
    categoryId: dto.category.id,
    districtId: dto.location.districtId,
    provinceId: dto.location.provinceId,
    horseId: dto.horse?.id ?? null,
    cover,
    gallery,
    isFavorite: dto.isFavorite,
    packageCode: dto.packageCode ?? null,
    packageDisplayName: dto.packageDisplayName ?? null,
    packageBadgeText: dto.packageBadgeText ?? null,
    isUrgent: dto.isUrgent,
    urgentActivatedAt: dto.urgentActivatedAt ?? null,
    sellerId: sellerId ?? null,
    viewCount: dto.viewCount ?? 0,
    breadcrumbs: [
      { label: 'Ana sayfa', href: '/' },
      { label: dto.category.name },
      { label: dto.title },
    ],
    horse,
    specs: propRows.length
      ? [{ id: 'props', title: 'Özellikler', rows: propRows }]
      : [],
  });
}

export function mapOwnerToAdvertDetail(
  dto: OwnerAdvertDto,
  apiBase: string,
  sellerId: string
): AdvertDetail {
  const media = filterDeliverableMedia(dto.media).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
  const gallery: PublicMediaItem[] = media.map((m) => ({
    assetId: m.assetId,
    displayOrder: m.displayOrder,
    isCover: m.isCover,
    publicUrl: mediaDeliveryUrl(m.assetId, 'DETAIL', apiBase),
    usage: m.isCover ? 'cover' : 'gallery',
  }));
  const cover = gallery.find((m) => m.isCover) ?? gallery[0] ?? null;
  const title = (dto.title ?? '').trim() || 'Başlıksız ilan';
  const publishedAt =
    dto.publishedAt ?? dto.updatedAt ?? new Date().toISOString();

  return emptyDetailShell({
    id: dto.id,
    title,
    description: (dto.description ?? '').trim(),
    publishedAt,
    price: dto.price,
    categoryId: dto.categoryId ?? '',
    districtId: dto.districtId ?? '',
    provinceId: dto.provinceId ?? '',
    horseId: dto.horseId,
    cover,
    gallery,
    isFavorite: false,
    packageCode: null,
    packageDisplayName: null,
    packageBadgeText: null,
    isUrgent: false,
    urgentActivatedAt: null,
    sellerId,
    viewCount: 0,
    breadcrumbs: [
      { label: 'Ana sayfa', href: '/' },
      { label: 'İlanlarım', href: '/my-listings' },
      { label: title },
    ],
    horse: EMPTY_HORSE,
    specs: [],
  });
}
