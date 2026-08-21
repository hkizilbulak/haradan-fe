import {
  HORSE_LISTING_GROUP_SLUGS,
  HORSE_LISTING_LEAF_SLUGS,
} from '@/constants/listingCatalog';
import { isValidNationalPhone } from '@/services/phone';
import type {
  ListingDraft,
  ListingTypeSelection,
  ListingWizardStep,
} from '@/types/listing';

function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export type ListingFieldErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'priceTl'
    | 'provinceId'
    | 'districtId'
    | 'address'
    | 'registeredName'
    | 'gender'
    | 'media'
    | 'sellerPhone'
    | 'facility'
    | 'companyName'
    | 'studHorseName'
    | 'studBreed'
    | 'studAge'
    | 'studCoatColor'
    | 'studSire'
    | 'studDam'
    | 'studDamsire',
    string
  >
>;

export function isPansiyonListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.categorySlug === 'pansiyon-haralar' ||
    type.categoryId === 'cat-pansiyon'
  );
}

export function isTransportListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.categorySlug === 'at-nakliyesi' ||
    type.categoryId === 'cat-nakliye'
  );
}

export function isFarrierListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.categorySlug === 'nalbantlar' ||
    type.categoryId === 'cat-nalbant'
  );
}

export function isStudServiceListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.parentSlug === 'asim-hizmetleri' ||
    type.categorySlug === 'asim-hizmetleri' ||
    type.categorySlug === 'arap-aygir' ||
    type.categorySlug === 'ingiliz-aygir' ||
    type.categoryId === 'cat-asim' ||
    type.categoryId === 'cat-arap-aygir' ||
    type.categoryId === 'cat-ingiliz-aygir'
  );
}

export function isSaleHorseListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.parentSlug === 'satilik-atlar' ||
    type.categorySlug === 'satilik-yaris-ati' ||
    type.categorySlug === 'satilik-kisrak' ||
    type.categorySlug === 'satilik-aygir' ||
    type.categorySlug === 'satilik-binek-ati' ||
    type.categorySlug === 'satilik-pony'
  );
}

export function isHorseListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  if (type.parentSlug && HORSE_LISTING_GROUP_SLUGS.has(type.parentSlug)) {
    return true;
  }
  return HORSE_LISTING_LEAF_SLUGS.has(type.categorySlug);
}

export function typeStepComplete(draft: ListingDraft): boolean {
  return draft.type != null;
}

export function detailsErrors(draft: ListingDraft): ListingFieldErrors {
  const e: ListingFieldErrors = {};
  const d = draft.details;
  if (!d.title.trim()) e.title = 'Başlık gerekli.';
  const price = parseTlInput(d.priceTl);
  if (price == null || price <= 0) e.priceTl = 'Geçerli bir fiyat girin.';
  if (!d.provinceId) e.provinceId = 'İl seçin.';
  if (!d.districtId) e.districtId = 'İlçe seçin.';
  if (!d.address.trim() || d.address.trim().length < 5) {
    e.address = 'Açık adres zorunludur (en az 5 karakter).';
  }
  if (!isValidNationalPhone(d.phoneCountryIso || 'TR', d.sellerPhone)) {
    e.sellerPhone = 'Geçerli bir telefon girin.';
  }
  if (!draft.media || draft.media.length === 0) {
    e.media = 'En az bir görsel eklemelisiniz.';
  }

  // Kategoriye özel zorunlu alanlar
  if (isPansiyonListing(draft.type)) {
    const hasAnyFacility = Boolean(
      d.facilityGrassPaddock ||
      d.facilitySandPaddock ||
      d.facilityStallionPaddock ||
      d.facilityVeterinarian ||
      d.facilityFarrier ||
      d.facilityFoalingBarn ||
      d.facilityTrainingTrack?.trim()
    );
    if (!hasAnyFacility) {
      e.facility = 'En az bir tesis veya hizmet özelliği seçmelisiniz.';
    }
  } else if (isTransportListing(draft.type)) {
    if (!d.companyName?.trim()) {
      e.companyName = 'Firma adı zorunludur.';
    }
  } else if (isStudServiceListing(draft.type)) {
    const hasName = Boolean(d.registeredName?.trim() || d.studHorseName?.trim());
    if (!hasName) {
      e.studHorseName = 'Aygır adı zorunludur.';
      e.registeredName = 'Aygır adı zorunludur.';
    }
    if (!d.studBreed?.trim()) {
      e.studBreed = 'At ırkı seçimi zorunludur.';
    }
    const hasAge = Boolean(d.studAge?.trim() || d.age?.trim());
    if (!hasAge) {
      e.studAge = 'Yaş bilgisi zorunludur.';
    }
    const hasColor = Boolean(d.studCoatColor?.trim() || d.coatColor?.trim());
    if (!hasColor) {
      e.studCoatColor = 'Donu (renk) seçimi zorunludur.';
    }
    const hasSire = Boolean(d.studSire?.trim() || d.sire?.trim());
    if (!hasSire) {
      e.studSire = 'Baba (Sire) adı zorunludur.';
    }
    const hasDam = Boolean(d.studDam?.trim() || d.dam?.trim());
    if (!hasDam) {
      e.studDam = 'Anne (Dam) adı zorunludur.';
    }
    const hasDamsire = Boolean(d.studDamsire?.trim() || d.damsire?.trim());
    if (!hasDamsire) {
      e.studDamsire = 'Annesinin babası zorunludur.';
    }
  } else if (isSaleHorseListing(draft.type)) {
    if (!d.registeredName.trim()) e.registeredName = 'Atın adı gerekli.';
    if (!d.gender) e.gender = 'Cinsiyet seçin.';
  } else if (isHorseListing(draft.type)) {
    if (!d.registeredName.trim()) e.registeredName = 'Atın adı gerekli.';
    if (!d.gender) e.gender = 'Cinsiyet seçin.';
  }

  return e;
}

export function detailsStepComplete(draft: ListingDraft): boolean {
  return Object.keys(detailsErrors(draft)).length === 0;
}

export function packageStepComplete(draft: ListingDraft): boolean {
  return draft.packageCode != null && draft.packageCode.trim() !== '';
}

export function canEnterStep(
  draft: ListingDraft,
  target: ListingWizardStep
): boolean {
  if (target === 'type') return true;
  if (target === 'details') return typeStepComplete(draft);
  if (target === 'package') return typeStepComplete(draft) && detailsStepComplete(draft);
  if (target === 'payment' || target === 'review') {
    return typeStepComplete(draft) && detailsStepComplete(draft) && packageStepComplete(draft);
  }
  return false;
}
