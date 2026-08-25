import { composeInternationalPhone } from '@/services/phone';
import type { CreateAdvertDraftRequest, ListingDraft } from '@/types/listing';
import type { Money } from '@/types/money';



function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function tlToMinor(tl: number): number {
  return Math.round(tl * 100);
}

export function buildDraftProperties(draft: ListingDraft): Record<string, unknown> {
  const d = draft.details;
  const props: Record<string, unknown> = {};
  if (d.properties) {
    for (const [k, v] of Object.entries(d.properties)) {
      if (v !== undefined && v !== null && v !== '') {
        if (typeof v === 'boolean' || typeof v === 'number') {
          props[k] = v;
        } else if (typeof v === 'string') {
          const trimmed = v.trim();
          if (trimmed !== '') {
            props[k] = trimmed;
          }
        } else {
          props[k] = v;
        }
      }
    }
  }
  if (d.sellerPhone?.trim()) {
    const fullPhone =
      composeInternationalPhone(
        d.phoneCountryIso || 'TR',
        d.sellerPhone
      ) ?? d.sellerPhone.trim();
    props.sellerPhone = fullPhone;
    props.phone = fullPhone;
  }
  return props;
}

const isUUID = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

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
  if (draft.details.districtId && isUUID(draft.details.districtId)) {
    body.districtId = draft.details.districtId;
  }
  if (draft.details.address?.trim()) {
    body.address = draft.details.address.trim();
  }
  if (draft.details.horseId && isUUID(draft.details.horseId)) {
    body.horseId = draft.details.horseId;
  }
  if (price) body.price = price;
  return body;
}
