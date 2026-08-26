import { filterDeliverableMedia } from '@/services/media/pickDeliverableCover';
import {
  mediaDeliveryUrl,
  resolvePublicMediaUrl,
} from '@/services/media/publicUrl';
import { locationLookup, formatAdvertLocation } from '@/services/location';
import type { OwnerAdvertDto } from '@/services/my-listings/mapOwnerAdvert';
import type {
  AdvertDetail,
  HorseGender,
  HorseProfile,
  Money,
  PublicMediaItem,
} from '@/types';
import type { TjkHorseProfile } from '@/types/listing';
import { MOCK_ADVERT_FALLBACK } from '@/mocks/advertDetail';

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
  sellerPhone?: string | null;
  phone?: string | null;
  sellerId?: string | null;
  seller?: { phone?: string | null } | null;
};

const EMPTY_HORSE: HorseProfile = {
  registeredName: '',
  age: 0,
  birthDate: '',
  gender: '' as HorseGender,
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

function buildHorseFromTjkOrDto(
  dtoHorse: BePublishedAdvertDetail['horse'],
  tjkHorse?: TjkHorseProfile | null
): HorseProfile {
  if (tjkHorse) {
    return {
      ...EMPTY_HORSE,
      registeredName: tjkHorse.registeredName || dtoHorse?.originalName || '',
      gender: (tjkHorse.gender as HorseGender) || ('' as HorseGender),
      breed: tjkHorse.breed || '',
      coatColor: tjkHorse.coatColor || '',
      birthDate: tjkHorse.birthDate || '',
      age: tjkHorse.age || 0,
      heightCm: tjkHorse.heightCm ?? null,
      sire: tjkHorse.sire || '',
      dam: tjkHorse.dam || '',
      damsire: tjkHorse.damsire || '',
      owners: tjkHorse.owners ?? [],
      breeder: tjkHorse.breeder || '',
      trainer: tjkHorse.trainer || '',
      handicap: tjkHorse.handicap ?? 0,
    };
  }
  if (dtoHorse) {
    return {
      ...EMPTY_HORSE,
      registeredName: dtoHorse.originalName,
    };
  }
  return EMPTY_HORSE;
}

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
    | 'sellerPhone'
    | 'breadcrumbs'
    | 'horse'
    | 'specs'
    | 'viewCount'
    | 'provinceName'
    | 'districtName'
    | 'locationName'
  >
): AdvertDetail {
  return {
    provinceName: null,
    districtName: null,
    locationName: null,
    ...partial,
    slug: partial.id,
    rating: 0,
    reviewCount: 0,
    viewCount: partial.viewCount ?? 0,
    oldPrice: null,
    brand: null,
    available: true,
    sellerPhone: partial.sellerPhone ?? null,
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
  sellerId?: string | null,
  tjkHorse?: TjkHorseProfile | null
): AdvertDetail {
  let gallery = absolutizeMedia(dto.media ?? [], apiBase);
  if (gallery.length === 0) {
    gallery = MOCK_ADVERT_FALLBACK.gallery;
  }
  const cover =
    gallery.find((m) => m.isCover) ?? gallery[0] ?? null;
  const horse: HorseProfile = buildHorseFromTjkOrDto(dto.horse, tjkHorse);

  const propRows = (dto.properties ?? [])
    .map((p) => {
      let display = p.displayValue?.trim();
      if (!display) {
        if (typeof p.value === 'boolean') {
          display = p.value ? 'Evet' : 'Hayır';
        } else if (p.value != null && p.value !== '' && p.value !== 'null' && p.value !== 'undefined') {
          display = String(p.value);
        } else {
          display = '';
        }
      }
      return {
        label: p.title || p.code,
        value: display,
      };
    })
    .filter((r) => r.value);

  const districtId = dto.location?.districtId ?? '';
  const provinceId = dto.location?.provinceId ?? '';
  const districtName = (dto.location?.districtName ?? '').trim();
  const provinceName = (dto.location?.provinceName ?? '').trim();

  if (provinceId && provinceName) {
    locationLookup.registerProvince(provinceId, provinceName);
  }
  if (districtId && districtName) {
    locationLookup.registerDistrict(districtId, districtName, provinceId);
  }

  const locationName = formatAdvertLocation({
    districtId,
    provinceId,
    districtName,
    provinceName,
  });

  const sellerPhone =
    dto.sellerPhone?.trim() ||
    dto.phone?.trim() ||
    dto.seller?.phone?.trim() ||
    dto.properties?.find((p) => p.code === 'sellerPhone' || p.code === 'phone')?.displayValue?.trim() ||
    (typeof dto.properties?.find((p) => p.code === 'sellerPhone' || p.code === 'phone')?.value === 'string'
      ? (dto.properties?.find((p) => p.code === 'sellerPhone' || p.code === 'phone')?.value as string).trim()
      : null);

  return emptyDetailShell({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    publishedAt: dto.publishedAt,
    price: dto.price as Money | null,
    categoryId: dto.category?.id ?? '',
    districtId,
    provinceId,
    provinceName: provinceName || null,
    districtName: districtName || null,
    locationName: locationName || null,
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
    sellerPhone: sellerPhone || null,
    viewCount: dto.viewCount ?? 0,
    breadcrumbs: [
      { label: 'Ana sayfa', href: '/' },
      ...(dto.category?.name ? [{ label: dto.category.name }] : []),
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
  sellerId: string,
  tjkHorse?: TjkHorseProfile | null
): AdvertDetail {
  const media = filterDeliverableMedia(dto.media).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
  let gallery: PublicMediaItem[] = media.map((m) => ({
    assetId: m.assetId,
    displayOrder: m.displayOrder,
    isCover: m.isCover,
    publicUrl: mediaDeliveryUrl(m.assetId, 'DETAIL', apiBase),
    usage: m.isCover ? 'cover' : 'gallery',
  }));
  if (gallery.length === 0) {
    gallery = MOCK_ADVERT_FALLBACK.gallery;
  }
  const cover = gallery.find((m) => m.isCover) ?? gallery[0] ?? null;
  const title = (dto.title ?? '').trim() || 'Başlıksız ilan';
  const publishedAt =
    dto.publishedAt ?? dto.updatedAt ?? new Date().toISOString();

  const districtId = dto.districtId ?? '';
  const provinceId = dto.provinceId ?? '';
  const locationName = formatAdvertLocation({ districtId, provinceId });
  const horse: HorseProfile = buildHorseFromTjkOrDto(
    dto.horseId ? { id: dto.horseId, originalName: '', tjkNumber: '' } : null,
    tjkHorse
  );

  return emptyDetailShell({
    id: dto.id,
    title,
    description: (dto.description ?? '').trim(),
    publishedAt,
    price: dto.price,
    categoryId: dto.categoryId ?? '',
    districtId,
    provinceId,
    provinceName: null,
    districtName: null,
    locationName: locationName || null,
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
    sellerPhone:
      (typeof dto.properties?.sellerPhone === 'string'
        ? dto.properties.sellerPhone
        : typeof dto.properties?.phone === 'string'
          ? dto.properties.phone
          : null),
    viewCount: 0,
    breadcrumbs: [
      { label: 'Ana sayfa', href: '/' },
      { label: 'İlanlarım', href: '/my-listings' },
      { label: title },
    ],
    horse,
    specs: (() => {
      const propRows = Object.entries(dto.properties ?? {})
        .filter(
          ([k, v]) =>
            v != null &&
            v !== '' &&
            v !== 'null' &&
            v !== 'undefined' &&
            k !== 'sellerPhone' &&
            k !== 'phone' &&
            !k.startsWith('facility')
        )
        .map(([k, v]) => ({
          label: k,
          value: typeof v === 'boolean' ? (v ? 'Evet' : 'Hayır') : String(v),
        }));
      return propRows.length
        ? [{ id: 'props', title: 'Özellikler', rows: propRows }]
        : [];
    })(),
  });
}


