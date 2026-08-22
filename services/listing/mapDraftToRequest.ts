import { composeInternationalPhone } from '@/services/phone';
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

export function buildDraftProperties(draft: ListingDraft): Record<string, unknown> {
  const d = draft.details;
  const props: Record<string, unknown> = {};
  if (d.properties) {
    for (const [k, v] of Object.entries(d.properties)) {
      if (v !== undefined && v !== null && v !== '') {
        props[k] = v;
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
  if (d.facilityGrassPaddock) props.facilityGrassPaddock = true;
  if (d.facilitySandPaddock) props.facilitySandPaddock = true;
  if (d.facilityStallionPaddock) props.facilityStallionPaddock = true;
  if (d.facilityTrainingTrack?.trim()) props.facilityTrainingTrack = d.facilityTrainingTrack.trim();
  if (d.facilityVeterinarian) props.facilityVeterinarian = true;
  if (d.facilityFarrier) props.facilityFarrier = true;
  if (d.facilityFoalingBarn) props.facilityFoalingBarn = true;

  if (d.companyName?.trim()) props.companyName = d.companyName.trim();
  if (d.websiteUrl?.trim()) props.websiteUrl = d.websiteUrl.trim();

  if (d.studBreed?.trim()) props.studBreed = d.studBreed.trim();
  if (d.studAge?.trim()) props.studAge = d.studAge.trim();
  if (d.studCoatColor?.trim()) props.studCoatColor = d.studCoatColor.trim();
  if (d.studHorseName?.trim()) props.studHorseName = d.studHorseName.trim();
  if (d.studSire?.trim()) props.studSire = d.studSire.trim();
  if (d.studDam?.trim()) props.studDam = d.studDam.trim();
  if (d.studDamsire?.trim()) props.studDamsire = d.studDamsire.trim();

  return props;
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
