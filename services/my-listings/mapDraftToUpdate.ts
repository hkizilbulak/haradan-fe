import { mapDraftToRequest } from '@/services/listing';
import type { ListingDraft, UpdateListingRequest } from '@/types';

export function mapDraftToUpdate(draft: ListingDraft): UpdateListingRequest {
  const withPackage =
    draft.packageCode != null
      ? draft
      : { ...draft, packageCode: 'STANDARD' as const };
  const created = mapDraftToRequest(withPackage);
  return {
    title: created.title,
    description: created.description,
    priceAmountMinor: created.price?.amountMinor ?? null,
    provinceId: created.provinceId,
    sellerPhone: created.sellerPhone,
    draft,
  };
}
