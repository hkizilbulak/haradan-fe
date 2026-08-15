import type {
  ActiveBannerItem,
  BlogVideoItem,
  BrandItem,
  CatalogProductCard,
  CategoryTreeNode,
  HomepageData,
} from '@/types';

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * HTTP 200 doğrulanmış Unsplash at görselleri.
 * Kırık / 404 ID kullanma — kartlar boş kalır.
 */
const H = {
  race: 'photo-1553284965-83fd3e82fa5a',
  mare: 'photo-1598974357801-cbca100e65d3',
  field: 'photo-1450101499163-c8848c66ca85',
  portrait: 'photo-1493962853295-0fd70327578a',
  herd: 'photo-1463595373836-6e0b0a8ee322',
  mist: 'photo-1767305902522-07326c564a83',
  prairie: 'photo-1769251847366-6b49e30d31e2',
  sunset: 'photo-1755001244508-58fcc65797ec',
  foal: 'photo-1731838618093-7ed3508d2fcd',
  stable: 'photo-1766524872796-ff2a543004bb',
  farm: 'photo-1516467508483-a7212febe31a',
  dark: 'photo-1475518112798-86ae358241eb',
  close: 'photo-1544967082-d9d25d867d66',
  pasture: 'photo-1500485035595-cbe6f645feb1',
  brown: 'photo-1625047509168-a7026f36de04',
  white: 'photo-1615811361523-6bd03d7748e7',
  jump: 'photo-1605559424843-9e4c228bf1c2',
  arena: 'photo-1598133894008-61f7fdb8cc3a',
} as const;

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

/** TRY kuruş — 1.850.000 ₺ → 185_000_000 */
const tryPrice = (tl: number) => ({
  amountMinor: Math.round(tl * 100),
  currency: 'TRY' as const,
});

function cover(url: string, assetId: string) {
  return {
    assetId,
    displayOrder: 0,
    isCover: true,
    publicUrl: url,
    usage: 'cover' as const,
  };
}

function product(
  partial: Omit<
    CatalogProductCard,
    'districtId' | 'provinceId' | 'horseId' | 'isUrgent' | 'cover' | 'viewCount'
  > & {
    coverUrl: string;
    assetId: string;
    isUrgent?: boolean;
    isFeatured?: boolean;
    districtId?: string;
    provinceId?: string;
    viewCount?: number;
    horseId?: string | null;
  }
): CatalogProductCard {
  const {
    coverUrl,
    assetId,
    isUrgent = false,
    isFeatured = false,
    viewCount,
    horseId = null,
    ...rest
  } = partial;
  return {
    districtId: partial.districtId ?? 'dist-34-sil',
    provinceId: partial.provinceId ?? 'prov-34',
    horseId,
    isUrgent,
    isFeatured,
    cover: cover(coverUrl, assetId),
    packageCode: null,
    packageDisplayName: null,
    packageBadgeText: null,
    urgentActivatedAt: isUrgent ? hoursAgo(2) : null,
    featuredUntil: isFeatured ? daysAgo(-7) : null,
    viewCount: viewCount ?? seededViewCount(partial.id),
    ...rest,
  };
}

function seededViewCount(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 180 + (hash % 12400);
}

export const MOCK_BANNERS: ActiveBannerItem[] = [
  {
    id: 'ban-1',
    placement: 'HOMEPAGE',
    title: 'Satılık yarış atları',
    altText: 'Hipodrom hazırlığı',
    targetUrl: '/categories/satilik-yaris-ati',
    sortOrder: 1,
    imageUrl: img(H.race, 1200),
  },
  {
    id: 'ban-2',
    placement: 'HOMEPAGE',
    title: 'Seçkin kısrak ilanları',
    altText: 'Bu haftanın fırsatları',
    targetUrl: '/categories/satilik-kisrak',
    sortOrder: 2,
    imageUrl: img(H.mare, 1200),
  },
  {
    id: 'ban-3',
    placement: 'HOMEPAGE',
    title: 'Aşım hizmetleri',
    altText: 'Arap ve İngiliz aygırlar',
    targetUrl: '/categories/asim-hizmetleri',
    sortOrder: 3,
    imageUrl: img(H.prairie, 1200),
  },
];

export const MOCK_CATEGORIES: CategoryTreeNode[] = [
  {
    id: 'cat-satilik-atlar',
    slug: 'satilik-atlar',
    name: 'Satılık Atlar',
    children: [
      {
        id: 'cat-yaris-ati',
        slug: 'satilik-yaris-ati',
        name: 'Satılık Yarış Atı',
        children: [],
      },
      {
        id: 'cat-kisrak',
        slug: 'satilik-kisrak',
        name: 'Satılık Kısrak',
        children: [],
      },
      {
        id: 'cat-aygir',
        slug: 'satilik-aygir',
        name: 'Satılık Aygır',
        children: [],
      },
      {
        id: 'cat-binek',
        slug: 'satilik-binek-ati',
        name: 'Satılık Binek Atı',
        children: [],
      },
      {
        id: 'cat-pony',
        slug: 'satilik-pony',
        name: 'Satılık Pony',
        children: [],
      },
    ],
  },
  {
    id: 'cat-at-hizmetleri',
    slug: 'at-hizmetleri',
    name: 'At Hizmetleri',
    children: [
      {
        id: 'cat-pansiyon',
        slug: 'pansiyon-haralar',
        name: 'Pansiyon Haralar',
        children: [],
      },
      {
        id: 'cat-nakliye',
        slug: 'at-nakliyesi',
        name: 'At Nakliyesi',
        children: [],
      },
      {
        id: 'cat-nalbant',
        slug: 'nalbantlar',
        name: 'Nalbantlar',
        children: [],
      },
    ],
  },
  {
    id: 'cat-asim',
    slug: 'asim-hizmetleri',
    name: 'Aşım Hizmetleri',
    children: [
      {
        id: 'cat-arap-aygir',
        slug: 'arap-aygir',
        name: 'Arap Aygır',
        children: [],
      },
      {
        id: 'cat-ingiliz-aygir',
        slug: 'ingiliz-aygir',
        name: 'İngiliz Aygır',
        children: [],
      },
    ],
  },
  {
    id: 'cat-ekipman',
    slug: 'ekipman-malzemeler',
    name: 'Ekipman & Malzemeler',
    children: [],
  },
  {
    id: 'cat-ahir',
    slug: 'ahir-tesisler',
    name: 'Ahır & Tesisler',
    children: [],
  },
];

const PRODUCTS: CatalogProductCard[] = [
  product({
    id: 'adv-001',
    title: '3 yaş İngiliz yarış aygırı — Veliefendi hazır',
    publishedAt: hoursAgo(2),
    price: tryPrice(2_850_000),
    oldPrice: tryPrice(3_200_000),
    categoryId: 'cat-yaris-ati',
    coverUrl: img(H.race),
    assetId: 'a1',
    isFavorite: false,
    rating: 4.8,
    reviewCount: 0,
    available: 1,
    brand: 'Thoroughbred',
    isUrgent: true,
    horseId: 'horse-001',
    packageBadgeText: 'ACİL',
    districtId: 'dist-34-sil',
    provinceId: 'prov-34',
  }),
  product({
    id: 'adv-002',
    title: 'Safkan Arap kısrak, 5 yaş — doğum belgesi tam',
    publishedAt: hoursAgo(5),
    price: tryPrice(1_650_000),
    oldPrice: null,
    categoryId: 'cat-kisrak',
    coverUrl: img(H.mare),
    assetId: 'a2',
    isFavorite: false,
    rating: 4.9,
    reviewCount: 0,
    available: 1,
    brand: 'Arabian',
    isUrgent: true,
    horseId: 'horse-002',
    districtId: 'dist-34-cek',
    provinceId: 'prov-34',
  }),
  product({
    id: 'adv-003',
    title: 'Binek Haflinger, sakin mizaç — binicilik okulu uygun',
    publishedAt: hoursAgo(8),
    price: tryPrice(420_000),
    oldPrice: tryPrice(480_000),
    categoryId: 'cat-binek',
    coverUrl: img(H.brown),
    assetId: 'a3',
    isFavorite: false,
    rating: 4.7,
    reviewCount: 0,
    available: 1,
    brand: 'Haflinger',
    isUrgent: true,
    horseId: 'horse-003',
    provinceId: 'prov-06',
    districtId: 'dist-06-cub',
  }),
  product({
    id: 'adv-004',
    title: 'İngiliz aygır, 7 yaş — aşım sezonu müsait',
    publishedAt: daysAgo(1),
    price: tryPrice(4_200_000),
    oldPrice: null,
    categoryId: 'cat-aygir',
    coverUrl: img(H.dark),
    assetId: 'a4',
    isFavorite: null,
    rating: 5,
    reviewCount: 0,
    available: 1,
    brand: 'Thoroughbred',
    packageBadgeText: 'Öne çıkan',
    isUrgent: true,
    horseId: 'horse-004',
    provinceId: 'prov-35',
    districtId: 'dist-35-tor',
  }),
  product({
    id: 'adv-005',
    title: 'Pony Shetland, 4 yaş — çocuk biniciliği',
    publishedAt: daysAgo(1),
    price: tryPrice(185_000),
    oldPrice: null,
    categoryId: 'cat-pony',
    coverUrl: img(H.foal),
    assetId: 'a5',
    isFavorite: false,
    rating: 4.6,
    reviewCount: 0,
    available: 1,
    brand: 'Shetland',
    isUrgent: true,
    horseId: 'horse-005',
    provinceId: 'prov-16',
    districtId: 'dist-16-nil',
  }),
  product({
    id: 'adv-006',
    title: 'Arap aygır aşım — 2026 sezonu rezervasyon',
    publishedAt: daysAgo(2),
    price: tryPrice(95_000),
    oldPrice: tryPrice(120_000),
    categoryId: 'cat-arap-aygir',
    coverUrl: img(H.sunset),
    assetId: 'a6',
    isFavorite: false,
    rating: 4.8,
    reviewCount: 0,
    available: 8,
    brand: 'Arabian',
    isUrgent: true,
    horseId: 'horse-006',
    provinceId: 'prov-07',
    districtId: 'dist-07-kas',
  }),
  product({
    id: 'adv-007',
    title: 'Dressaj Warmblood, 9 yaş — orta seviye',
    publishedAt: daysAgo(2),
    price: tryPrice(980_000),
    oldPrice: null,
    categoryId: 'cat-binek',
    coverUrl: img(H.arena),
    assetId: 'a7',
    isFavorite: false,
    rating: 4.5,
    reviewCount: 0,
    available: 1,
    brand: 'Warmblood',
    isUrgent: true,
    horseId: 'horse-007',
    provinceId: 'prov-42',
    districtId: 'dist-42-sel',
  }),
  product({
    id: 'adv-008',
    title: 'Silivri pansiyon hara — günlük / aylık bakım',
    publishedAt: daysAgo(3),
    price: tryPrice(18_500),
    oldPrice: null,
    categoryId: 'cat-pansiyon',
    coverUrl: img(H.stable),
    assetId: 'a8',
    isFavorite: false,
    rating: 4.4,
    reviewCount: 0,
    available: null,
    brand: null,
    horseId: null,
  }),
  product({
    id: 'adv-009',
    title: 'İngiliz kısrak, 6 yaş — damızlık uygun',
    publishedAt: daysAgo(1),
    price: tryPrice(1_250_000),
    oldPrice: tryPrice(1_450_000),
    categoryId: 'cat-kisrak',
    coverUrl: img(H.white),
    assetId: 'a9',
    isFavorite: false,
    rating: 4.7,
    reviewCount: 0,
    available: 1,
    brand: 'Thoroughbred',
    horseId: 'horse-009',
    provinceId: 'prov-06',
    districtId: 'dist-06-cub',
  }),
  product({
    id: 'adv-010',
    title: 'At nakliyesi — İstanbul / Anadolu hattı',
    publishedAt: daysAgo(2),
    price: tryPrice(12_000),
    oldPrice: null,
    categoryId: 'cat-nakliye',
    coverUrl: img(H.farm),
    assetId: 'a10',
    isFavorite: false,
    rating: 4.3,
    reviewCount: 0,
    available: null,
    brand: null,
    horseId: null,
    provinceId: 'prov-34',
    districtId: 'dist-34-cek',
  }),
  product({
    id: 'adv-011',
    title: 'Safkan Arap aygır, 8 yaş — şecere belgeli',
    publishedAt: daysAgo(2),
    price: tryPrice(3_750_000),
    oldPrice: tryPrice(4_100_000),
    categoryId: 'cat-aygir',
    coverUrl: img(H.mist),
    assetId: 'a11',
    isFavorite: false,
    rating: 4.9,
    reviewCount: 0,
    available: 1,
    brand: 'Arabian',
    horseId: 'horse-011',
    provinceId: 'prov-35',
    districtId: 'dist-35-tor',
  }),
  product({
    id: 'adv-012',
    title: 'Jumping pony, 5 yaş — yarışmaya hazır',
    publishedAt: daysAgo(3),
    price: tryPrice(265_000),
    oldPrice: null,
    categoryId: 'cat-pony',
    coverUrl: img(H.jump),
    assetId: 'a12',
    isFavorite: false,
    rating: 4.6,
    reviewCount: 0,
    available: 1,
    brand: 'Pony',
    horseId: 'horse-012',
    provinceId: 'prov-16',
    districtId: 'dist-16-nil',
  }),
];

/** Katalog listesi — ilanlar sayfası / arama. */
export const MOCK_CATALOG_PRODUCTS = PRODUCTS;

/** Ekipman / yem markaları — at sektörü. */
export const MOCK_BRANDS: BrandItem[] = [
  { id: 'b-prestige', name: 'Prestige', logoUrl: img(H.race, 200) },
  { id: 'b-stubben', name: 'Stübben', logoUrl: img(H.prairie, 200) },
  { id: 'b-kentucky', name: 'Kentucky', logoUrl: img(H.brown, 200) },
  { id: 'b-cavalor', name: 'Cavalor', logoUrl: img(H.field, 200) },
  { id: 'b-veredus', name: 'Veredus', logoUrl: img(H.arena, 200) },
  { id: 'b-passier', name: 'Passier', logoUrl: img(H.mare, 200) },
  { id: 'b-equiline', name: 'Equiline', logoUrl: img(H.portrait, 200) },
  { id: 'b-antares', name: 'Antarès', logoUrl: img(H.herd, 200) },
];

export const MOCK_BLOG: BlogVideoItem[] = [
  {
    id: 'v1',
    title: 'Yarış atı alırken dikkat edilmesi gereken 5 nokta',
    duration: '6:16',
    tag: 'Rehber',
    coverUrl: img(H.race, 400),
  },
  {
    id: 'v2',
    title: 'Kısrak bakımı: mevsim geçişinde beslenme ve nalbant takvimi',
    duration: '10:20',
    tag: 'Bakım',
    coverUrl: img(H.mare, 400),
  },
  {
    id: 'v3',
    title: 'Aşım sezonu: Arap ve İngiliz aygır seçiminde nelere bakılır',
    duration: '8:40',
    tag: 'Piyasa',
    coverUrl: img(H.prairie, 400),
  },
];

export const MOCK_HOMEPAGE: HomepageData = {
  banners: MOCK_BANNERS,
  categories: MOCK_CATEGORIES,
  showcase: {
    seed: 'mock-seed-2026-08',
    items: PRODUCTS.slice(0, 6),
  },
  newAdverts: PRODUCTS.slice(0, 8),
  trending: [
    { ...PRODUCTS[0], isFeatured: true },
    { ...PRODUCTS[1], isFeatured: true },
    { ...PRODUCTS[2], isFeatured: true },
    { ...PRODUCTS[3], isFeatured: true },
    { ...PRODUCTS[4], isFeatured: true },
    { ...PRODUCTS[11], isFeatured: true },
    { ...PRODUCTS[5], isFeatured: true },
    { ...PRODUCTS[6], isFeatured: true },
  ],
  specialOffers: [
    PRODUCTS[8],
    PRODUCTS[2],
    PRODUCTS[9],
    PRODUCTS[10],
    PRODUCTS[0],
    PRODUCTS[1],
    PRODUCTS[3],
    PRODUCTS[4],
    PRODUCTS[5],
    PRODUCTS[6],
    PRODUCTS[7],
    PRODUCTS[11],
  ],
  urgentAdverts: PRODUCTS.filter((p) => p.isUrgent),
  macPromo: {
    title: 'Pansiyon hara',
    subtitle: 'Profesyonel bakım ve eğitim',
    ctaLabel: 'İlanları gör',
    imageUrl: img(H.stable, 900),
    backgroundUrl: img(H.race, 900),
  },
  salePromo: {
    discountLabel: '%15',
    title: 'AŞIM SEZONU KAMPANYASI',
    code: 'ASIM15',
    imageUrl: img(H.close, 900),
  },
  brands: MOCK_BRANDS,
  blogVideos: MOCK_BLOG,
};
