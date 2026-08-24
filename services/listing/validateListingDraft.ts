import {
  HORSE_LISTING_GROUP_SLUGS,
  HORSE_LISTING_LEAF_SLUGS,
} from '@/constants/listingCatalog';
import {
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '@/constants/Paytr';
import { isValidNationalPhone } from '@/services/phone';
import type { CategoryPropertyPublic } from '@/types';
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
    | 'sellerPhone',
    string
  >
> & Record<string, string | undefined>;

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

export function detailsErrors(
  draft: ListingDraft,
  categoryProperties?: CategoryPropertyPublic[]
): ListingFieldErrors {
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

  // Dinamik kategori property'leri üzerinden zorunlu alan kontrolü
  if (categoryProperties && categoryProperties.length > 0) {
    const props = draft.details.properties || {};
    for (const prop of categoryProperties) {
      if (!prop.isRequired) continue;
      const value = props[prop.code];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && !value.trim());
      if (isEmpty) {
        (e as Record<string, string>)[prop.code] = `${prop.title} zorunludur.`;
      }
    }
  }

  return e;
}

export function detailsStepComplete(draft: ListingDraft): boolean {
  return Object.keys(detailsErrors(draft)).length === 0;
}

export function packageStepComplete(draft: ListingDraft): boolean {
  if (!isListingPackageStepEnabled()) return true;
  return draft.packageCode != null && draft.packageCode.trim() !== '';
}

export function canEnterStep(
  draft: ListingDraft,
  target: ListingWizardStep
): boolean {
  if (target === 'type') return true;
  if (target === 'details') return typeStepComplete(draft);
  if (target === 'package') {
    if (!isListingPackageStepEnabled()) return false;
    return typeStepComplete(draft) && detailsStepComplete(draft);
  }
  if (target === 'payment') {
    if (!isPaytrCheckoutEnabled()) return false;
    return (
      typeStepComplete(draft) &&
      detailsStepComplete(draft) &&
      packageStepComplete(draft)
    );
  }
  if (target === 'review') {
    return (
      typeStepComplete(draft) &&
      detailsStepComplete(draft) &&
      packageStepComplete(draft)
    );
  }
  return false;
}
