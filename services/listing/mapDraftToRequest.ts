import type { ListingDraft } from '@/types/listing';
import type { Money } from '@/types/money';
import type { CreateAdvertDraftRequest } from '@/types/listing';

function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function tlToMinor(tl: number): number {
  return Math.round(tl * 100);
}

export function mapDraftToCreateAdvert(
  draft: ListingDraft
): CreateAdvertDraftRequest {
  if (!draft.type) throw new Error('Kategori seçilmedi.');
  const priceTl = parseTlInput(draft.details.priceTl);
  const price: Money | null =
    priceTl != null
      ? { amountMinor: tlToMinor(priceTl), currency: 'TRY' }
      : null;
  const body: CreateAdvertDraftRequest = {
    categoryId: draft.type.categoryId,
    title: draft.details.title.trim(),
    description: draft.details.description.trim(),
  };
  if (draft.details.districtId) body.districtId = draft.details.districtId;
  if (draft.details.address.trim()) body.address = draft.details.address.trim();
  if (draft.details.horseId) body.horseId = draft.details.horseId;
  if (price) body.price = price;
  return body;
}
