import type { Money } from './money';
import type { PublicMediaItem } from './media';
import type { CatalogProductCard } from './catalog';
import type { PublishedAdvertCard } from './advert';

export type AdvertDetailTab = 'general' | 'details' | 'reviews';

export type AdvertSpecRow = {
  label: string;
  value: string;
  hint?: string;
};

export type AdvertSpecGroup = {
  id: string;
  title: string;
  rows: AdvertSpecRow[];
};

export type AdvertShippingOption = {
  id: string;
  service: string;
  timing: string;
  cost: string;
};

export type AdvertBundleItem = {
  id: string;
  title: string;
  price: Money;
  oldPrice: Money | null;
  discountLabel: string | null;
  coverUrl: string;
  selectedByDefault: boolean;
};

export type AdvertReview = {
  id: string;
  author: string;
  verified: boolean;
  createdAt: string;
  rating: number;
  meta: string;
  body: string;
  pros: string;
  cons: string;
  helpful: number;
  notHelpful: number;
};

export type AdvertRatingBreakdown = {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
};

export type HorseGender = 'Erkek' | 'Dişi' | 'İğdiş';

export type HorsePlaceStats = {
  starts: number;
  first: number;
  second: number;
  third: number;
  fourth: number;
  fifth: number;
};

export type HorseYearlyPerformance = {
  year: number;
  stats: HorsePlaceStats;
  earnings: Money;
};

export type HorseRaceRecord = {
  id: string;
  date: string;
  venue: string;
  distance: string;
  surface: 'Kum' | 'Çim' | 'Sentetik';
  finishTime: string;
  place: number;
  jockey: string;
  videoUrl?: string | null;
};

export type HorseOffspring = {
  id: string;
  name: string;
  birthYear: number;
  performanceSummary: string;
  earnings: Money | null;
};

/** At profili — kimlik, orijin, kişiler, performans, yarış, üreme. */
export type HorseProfile = {
  registeredName: string;
  age: number;
  birthDate: string;
  gender: HorseGender;
  coatColor: string;
  heightCm: number | null;
  breed: string;
  sire: string;
  dam: string;
  damsire: string;
  owners: string[];
  breeder: string;
  trainer: string;
  career: HorsePlaceStats;
  yearly: HorseYearlyPerformance[];
  careerEarnings: Money;
  handicap: number;
  races: HorseRaceRecord[];
  offspring: HorseOffspring[] | null;
};

/**
 * İlan detay aggregate — BE detay endpoint’i gelince mapper ile doldurulur.
 */
export type AdvertDetail = PublishedAdvertCard & {
  slug: string;
  description: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  oldPrice: Money | null;
  brand: string | null;
  available: boolean;
  /** Satıcı telefonu — ara / WhatsApp. */
  sellerPhone: string | null;
  /** Satıcı kullanıcı id — sahiplik (düzenle) için. */
  sellerId?: string | null;
  gallery: PublicMediaItem[];
  breadcrumbs: { label: string; href?: string }[];
  horse: HorseProfile;
  shipping: AdvertShippingOption[];
  warranties: { id: string; title: string; body: string }[];
  specs: AdvertSpecGroup[];
  bundleTitle: string;
  bundleItems: AdvertBundleItem[];
  reviews: AdvertReview[];
  ratingBreakdown: AdvertRatingBreakdown[];
  viewed: CatalogProductCard[];
  related: CatalogProductCard[];
};
