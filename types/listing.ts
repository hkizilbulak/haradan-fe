import type { HorseGender } from './advertDetail';
import type { Money } from './money';

/** 5 adımlı ilan verme süreci (ödeme dahil). */
export type ListingWizardStep = 'type' | 'details' | 'package' | 'payment' | 'review';

export type ListingTypeSelection = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  parentSlug: string | null;
};

export type ListingBreedSelection = {
  id: string;
  slug: string;
  label: string;
};

/** HORSE-01 HorseSelectionItem + UI alanları. */
export type TjkHorseSummary = {
  horseId: string;
  tjkNumber: string;
  registeredName: string;
  birthYear: number | null;
  gender: HorseGender | null;
  breed: string;
  coatColor: string;
  sireName?: string | null;
  damName?: string | null;
};

export type TjkHorseProfile = TjkHorseSummary & {
  birthDate: string;
  age: number;
  heightCm: number | null;
  sire: string;
  dam: string;
  damsire: string;
  owners: string[];
  breeder: string;
  trainer: string;
  handicap: number | null;
};

export type ListingMediaSlot = {
  localId: string;
  uri: string;
  mimeType: string;
  fileName: string;
  isCover: boolean;
  assetId: string | null;
};

export type ListingDraftDetails = {
  title: string;
  description: string;
  priceTl: string;
  provinceId: string | null;
  districtId: string | null;
  address: string;
  gender: HorseGender | null;
  birthDate: string;
  age: string;
  coatColor: string;
  heightCm: string;
  sire: string;
  dam: string;
  damsire: string;
  registeredName: string;
  /** BE horse UUID (HORSE-02). */
  horseId: string | null;
  tjkNumber: string | null;
  tjkSkipped: boolean;
  ownersText: string;
  breeder: string;
  trainer: string;
  phoneCountryIso: string;
  sellerPhone: string;
};

/** BE PackageCode — kapalı enum değil. */
export type ListingPackageCode = string;

export type ListingPackageFeature = {
  id: string;
  label: string;
  icon: string;
  included: boolean;
};

export type ListingPackage = {
  code: ListingPackageCode;
  name: string;
  tagline: string;
  price: Money;
  durationDays: number;
  highlighted: boolean;
  features: ListingPackageFeature[];
};

export type ListingDraft = {
  type: ListingTypeSelection | null;
  breed: ListingBreedSelection | null;
  details: ListingDraftDetails;
  media: ListingMediaSlot[];
  packageCode: ListingPackageCode | null;
};

/** OpenAPI: CreateAdvertDraftRequest */
export type CreateAdvertDraftRequest = {
  categoryId?: string | null;
  districtId?: string | null;
  address?: string | null;
  horseId?: string | null;
  title?: string | null;
  description?: string | null;
  price?: Money | null;
};

/** OpenAPI: OwnerAdvertResponse (özet) */
export type OwnerAdvertResponse = {
  id: string;
  status: string;
  version: number;
  mediaVersion: number;
  categoryId: string | null;
  districtId: string | null;
  provinceId?: string | null;
  address?: string | null;
  horseId: string | null;
  title: string | null;
  description: string | null;
  price: Money | null;
  properties: Record<string, unknown>;
  media?: {
    assetId: string;
    displayOrder: number;
    isCover: boolean;
    lifecycleStatus: string;
  }[];
  publishedAt?: string | null;
  updatedAt?: string;
};

export type PublishListingResult = {
  advertId: string;
  status: string;
};

export const MAX_LISTING_IMAGES = 5;
