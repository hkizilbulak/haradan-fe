import type { HorseGender } from './advertDetail';
import type { Money } from './money';

/** 4 adımlı ilan verme süreci. */
export type ListingWizardStep = 'type' | 'details' | 'package' | 'payment';

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

export type TjkHorseSummary = {
  tjkId: string;
  registeredName: string;
  birthYear: number;
  gender: HorseGender;
  breed: string;
  coatColor: string;
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
  handicap: number;
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
  gender: HorseGender | null;
  birthDate: string;
  age: string;
  coatColor: string;
  heightCm: string;
  sire: string;
  dam: string;
  damsire: string;
  registeredName: string;
  tjkId: string | null;
  tjkSkipped: boolean;
  ownersText: string;
  breeder: string;
  trainer: string;
  /** ISO 3166-1 alpha-2 — TR, DE… */
  phoneCountryIso: string;
  sellerPhone: string;
};

export type ListingPackageCode = 'STANDARD' | 'PREMIUM' | 'ULTIMATE';

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

export type CreateListingHorsePayload = {
  tjkId: string | null;
  registeredName: string;
  breed: string | null;
  gender: HorseGender | null;
  birthDate: string | null;
  age: number | null;
  coatColor: string | null;
  heightCm: number | null;
  sire: string | null;
  dam: string | null;
  damsire: string | null;
  owners: string[];
  breeder: string | null;
  trainer: string | null;
};

/** POST /v1/listings/drafts */
export type CreateListingRequest = {
  categoryId: string;
  breedSlug: string | null;
  title: string;
  description: string;
  price: Money | null;
  provinceId: string;
  sellerPhone: string | null;
  horse: CreateListingHorsePayload | null;
  mediaAssetIds: string[];
  coverAssetId: string;
  packageCode: ListingPackageCode;
};

export type ListingDraftStatus = 'PENDING_PAYMENT' | 'PUBLISHED';

export type CreateListingResponse = {
  draftId: string;
  status: ListingDraftStatus;
};

/** GET /v1/listings/drafts/:id/payment */
export type ListingPaymentInstructions = {
  draftId: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  referenceCode: string;
  whatsappPhone: string;
  amount: Money;
  packageName: string;
  listingTitle: string;
};

export const MAX_LISTING_IMAGES = 5;
