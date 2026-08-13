import { isValidNationalPhone } from '@/services/phone';
import type { ListingDraft, ListingWizardStep } from '@/types/listing';

function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export type ListingFieldErrors = Partial<
  Record<'title' | 'description' | 'priceTl' | 'provinceId' | 'registeredName' | 'gender' | 'media' | 'sellerPhone', string>
>;

export function isHorseListing(categorySlug: string | null | undefined): boolean {
  if (!categorySlug) return false;
  return (
    categorySlug.includes('satilik') ||
    categorySlug.includes('yaris') ||
    categorySlug.includes('kisrak') ||
    categorySlug.includes('aygir') ||
    categorySlug.includes('binek') ||
    categorySlug.includes('pony') ||
    categorySlug.includes('asim')
  );
}

export function typeStepComplete(draft: ListingDraft): boolean {
  return draft.type != null;
}

export function detailsErrors(draft: ListingDraft): ListingFieldErrors {
  const e: ListingFieldErrors = {};
  const d = draft.details;
  if (!d.title.trim()) e.title = 'Başlık gerekli.';
  if (!d.description.trim() || d.description.trim().length < 20) {
    e.description = 'En az 20 karakterlik açıklama yazın.';
  }
  const price = parseTlInput(d.priceTl);
  if (price == null || price <= 0) e.priceTl = 'Geçerli bir fiyat girin.';
  if (!d.provinceId) e.provinceId = 'İl seçin.';
  if (!isValidNationalPhone(d.phoneCountryIso || 'TR', d.sellerPhone)) {
    e.sellerPhone = 'Geçerli bir telefon girin.';
  }
  if (draft.media.length < 1) e.media = 'En az bir görsel ekleyin.';
  if (!draft.media.some((m) => m.isCover) && draft.media.length > 0) {
    e.media = 'Kapak görseli seçin.';
  }
  if (isHorseListing(draft.type?.categorySlug)) {
    if (!d.registeredName.trim()) e.registeredName = 'Atın adı gerekli.';
    if (!d.gender) e.gender = 'Cinsiyet seçin.';
  }
  return e;
}

export function detailsStepComplete(draft: ListingDraft): boolean {
  return Object.keys(detailsErrors(draft)).length === 0;
}

export function packageStepComplete(draft: ListingDraft): boolean {
  return draft.packageCode != null;
}

export function canEnterStep(
  draft: ListingDraft,
  target: ListingWizardStep
): boolean {
  if (target === 'type') return true;
  if (target === 'details') return typeStepComplete(draft);
  if (target === 'package') return typeStepComplete(draft) && detailsStepComplete(draft);
  return (
    typeStepComplete(draft) &&
    detailsStepComplete(draft) &&
    packageStepComplete(draft)
  );
}
