import { composeInternationalPhone } from '@/services/phone';
import type { ListingDraft, UpdateListingRequest } from '@/types';

function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function mapDraftToUpdate(draft: ListingDraft): UpdateListingRequest {
  const priceTl = parseTlInput(draft.details.priceTl);
  return {
    title: draft.details.title.trim(),
    description: draft.details.description.trim(),
    priceAmountMinor: priceTl != null ? Math.round(priceTl * 100) : null,
    provinceId: draft.details.provinceId ?? '',
    sellerPhone:
      composeInternationalPhone(
        draft.details.phoneCountryIso || 'TR',
        draft.details.sellerPhone
      ) ?? (draft.details.sellerPhone.trim() || null),
    draft,
  };
}
