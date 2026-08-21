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
    | 'sellerPhone',
    string
  >
>;

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
  if (isHorseListing(draft.type)) {
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
