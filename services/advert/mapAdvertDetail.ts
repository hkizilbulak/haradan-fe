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
import { parseAdvertId, type AdvertId } from '@/types/advertId';

function normalizeAdvertId(id: AdvertId | string): AdvertId {
  return typeof id === 'number' ? id : (parseAdvertId(id) ?? 0);
}

type BeMoney = { amountMinor: number; currency: string } | null;

type BePublicMedia = {
  assetId: string;
  displayOrder: number;
  isCover: boolean;
  publicUrl: string;
  usage?: string | null;
};

export type BePublishedAdvertDetail = {
  id: AdvertId | string;
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

function buildPropertiesMap(
  props: BePublishedAdvertDetail['properties'] | Record<string, unknown> | undefined | null
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!props) return result;

  if (Array.isArray(props)) {
    for (const p of props) {
      if (!p) continue;
      const val = p.displayValue?.trim() || p.value;
      if (val !== undefined && val !== null && val !== '') {
        result[p.code] = val;
        if (p.title) {
          result[p.title] = val;
        }
      }
    }
  } else if (typeof props === 'object') {
    for (const [k, v] of Object.entries(props)) {
      if (v !== undefined && v !== null && v !== '') {
        result[k] = v;
      }
    }
  }

  return result;
}

function getPropValue(
  map: Record<string, unknown>,
  keys: string[]
): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[-_\s\(\)]/g, '');
  const targetNorms = keys.map(norm);

  for (const [k, v] of Object.entries(map)) {
    const kNorm = norm(k);
    if (targetNorms.includes(kNorm)) {
      if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır';
      if (v != null && String(v).trim() !== '' && String(v) !== 'null' && String(v) !== 'undefined') {
        return String(v).trim();
      }
    }
  }
  return undefined;
}

function buildHorseFromTjkOrDto(
  dtoHorse: BePublishedAdvertDetail['horse'],
  tjkHorse?: TjkHorseProfile | null,
  propMap: Record<string, unknown> = {},
  isHorseCategory: boolean = true
): HorseProfile {
  if (!isHorseCategory && !dtoHorse && !tjkHorse) {
    return EMPTY_HORSE;
  }
  const baseHorse: HorseProfile = tjkHorse
    ? {
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
        tjkNumber: tjkHorse.tjkNumber || dtoHorse?.tjkNumber || '',
        pedigree: tjkHorse.pedigree ?? [],
        siblings: tjkHorse.siblings ?? [],
        statistics: tjkHorse.statistics ?? [],
        detailProfile: tjkHorse.detailProfile ?? null,
      }
    : dtoHorse
    ? {
        ...EMPTY_HORSE,
        registeredName: dtoHorse.originalName,
        tjkNumber: dtoHorse.tjkNumber || '',
      }
    : { ...EMPTY_HORSE };

  // Enrich missing / empty fields from manual category properties
  const sire =
    baseHorse.sire ||
    getPropValue(propMap, ['SIRE', 'studSire', 'baba', 'babasire', 'babaadi']) ||
    '';
  const dam =
    baseHorse.dam ||
    getPropValue(propMap, ['DAM', 'studDam', 'anne', 'annedam', 'anneadi']) ||
    '';
  const damsire =
    baseHorse.damsire ||
    getPropValue(propMap, [
      'DAMSIRE',
      'studDamSire',
      'studDamsire',
      'annesininbabasi',
      'kisrakbabasi',
      'anneninbabasidamsire',
      'anneninbabasi',
    ]) ||
    '';
  const breed =
    baseHorse.breed ||
    getPropValue(propMap, ['HORSE_BREED', 'STALLION_BREED', 'breed', 'studBreed', 'atirki', 'irk']) ||
    '';
  const coatColor =
    baseHorse.coatColor ||
    getPropValue(propMap, ['COAT_COLOR', 'studCoatColor', 'coatColor', 'donu', 'don', 'donurenk']) ||
    '';
  const gender =
    baseHorse.gender ||
    (getPropValue(propMap, ['HORSE_GENDER', 'gender', 'cinsiyet']) as HorseGender) ||
    ('' as HorseGender);

  const rawAge =
    baseHorse.age != null && baseHorse.age !== 0 && baseHorse.age !== ''
      ? baseHorse.age
      : getPropValue(propMap, ['HORSE_AGE', 'STALLION_AGE', 'age', 'studAge', 'yas', 'yaş']);
  const parseSafeHorseAge = (raw: unknown): number | string => {
    if (raw == null || raw === '') return 0;
    if (typeof raw === 'number') return raw;
    const str = String(raw).trim();
    if (str.includes('-') || str.includes('arası') || str.includes('üzeri') || str.includes('+')) {
      return str;
    }
    const parsed = parseFloat(str.replace(',', '.'));
    if (!isNaN(parsed)) return parsed;
    return str;
  };
  const age = parseSafeHorseAge(rawAge);

  const registeredName =
    baseHorse.registeredName ||
    getPropValue(propMap, ['REGISTERED_NAME', 'HORSE_NAME', 'studHorseName', 'studHorse', 'atadi', 'aygiradi']) ||
    '';
  const heightCmRaw =
    baseHorse.heightCm ??
    getPropValue(propMap, ['HEIGHT_CM', 'heightCm', 'cidago']);
  const heightCm = heightCmRaw ? parseInt(String(heightCmRaw), 10) : null;
  const birthDate =
    baseHorse.birthDate ||
    getPropValue(propMap, ['BIRTH_DATE', 'birthDate', 'dogumtarihi']) ||
    '';
  const breeder =
    baseHorse.breeder ||
    getPropValue(propMap, ['BREEDER', 'breeder', 'yetistirici']) ||
    '';
  const trainer =
    baseHorse.trainer ||
    getPropValue(propMap, ['TRAINER', 'trainer', 'antrenor']) ||
    '';

  return {
    ...baseHorse,
    sire,
    dam,
    damsire,
    breed,
    coatColor,
    gender,
    age,
    registeredName,
    heightCm: isNaN(Number(heightCm)) ? null : heightCm,
    birthDate,
    breeder,
    trainer,
  };
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
  > & {
    properties?: Record<string, unknown>;
    rawProperties?: Record<string, unknown>;
  }
): AdvertDetail {
  return {
    provinceName: null,
    districtName: null,
    locationName: null,
    ...partial,
    properties: partial.properties ?? {},
    rawProperties: partial.rawProperties ?? partial.properties ?? {},
    slug: String(partial.id),
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
  const propMap = buildPropertiesMap(dto.properties);
  const gallery = absolutizeMedia(dto.media ?? [], apiBase);
  const cover =
    gallery.find((m) => m.isCover) ?? gallery[0] ?? null;
  const catText = `${dto.category?.name || ''} ${dto.category?.slug || ''} ${(dto as any).categoryId || ''}`.toLowerCase();
  const isNonHorse =
    catText.includes('nalbant') ||
    catText.includes('pansiyon') ||
    catText.includes('nakliye') ||
    catText.includes('transport');
  const horse: HorseProfile = buildHorseFromTjkOrDto(dto.horse, tjkHorse, propMap, !isNonHorse);

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
    id: normalizeAdvertId(dto.id),
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

  const districtId = dto.districtId ?? '';
  const provinceId = dto.provinceId ?? '';
  const locationName = formatAdvertLocation({ districtId, provinceId });
  const propMap = buildPropertiesMap(dto.properties);
  const catText = `${dto.categoryId || ''}`.toLowerCase();
  const isNonHorse =
    catText.includes('nalbant') ||
    catText.includes('pansiyon') ||
    catText.includes('nakliye') ||
    catText.includes('transport');
  const horse: HorseProfile = buildHorseFromTjkOrDto(
    dto.horseId ? { id: dto.horseId, originalName: '', tjkNumber: '' } : null,
    tjkHorse,
    propMap,
    !isNonHorse
  );

  return emptyDetailShell({
    id: normalizeAdvertId(dto.id),
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
    properties: propMap,
    rawProperties: propMap,
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


