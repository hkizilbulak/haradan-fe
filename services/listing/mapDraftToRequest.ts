import { composeInternationalPhone } from '@/services/phone';
import type { ListingDraft } from '@/types/listing';
import type { Money } from '@/types/money';
import type { CreateAdvertDraftRequest } from '@/types/listing';
import CATALOG_DATA from '@/data/catalog.json';

import {
  isFarrierListing,
  isPansiyonListing,
  isStudServiceListing,
  isTransportListing,
} from './validateListingDraft';

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

  // 1. Direct properties from dynamic form state (canonical property.code)
  if (d.properties) {
    for (const [k, v] of Object.entries(d.properties)) {
      if (v === undefined || v === null || v === '' || v === 'undefined' || v === 'null') {
        continue;
      }
      if (typeof v === 'boolean') {
        props[k] = v;
      } else if (typeof v === 'number') {
        if (!isNaN(v)) {
          props[k] = v;
        }
      } else if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null') {
          props[k] = trimmed;
        }
      } else {
        props[k] = v;
      }
    }
  }

  // 2. Canonical mapping for Pansiyon facilities if present on details
  if (d.facilityGrassPaddock != null && d.facilityGrassPaddock !== false) props.grassPaddock = Boolean(d.facilityGrassPaddock);
  if (d.facilitySandPaddock != null && d.facilitySandPaddock !== false) props.sandPaddock = Boolean(d.facilitySandPaddock);
  if (d.facilityStallionPaddock != null && d.facilityStallionPaddock !== false) props.stallionPaddock = Boolean(d.facilityStallionPaddock);
  if (d.facilityTrainingTrack?.trim()) props.trainingTrack = d.facilityTrainingTrack.trim();
  if (d.facilityVeterinarian != null && d.facilityVeterinarian !== false) props.vet = Boolean(d.facilityVeterinarian);
  if (d.facilityFarrier != null && d.facilityFarrier !== false) props.farrier = Boolean(d.facilityFarrier);
  if (d.facilityFoalingBarn != null && d.facilityFoalingBarn !== false) props.foalingBarn = Boolean(d.facilityFoalingBarn);

  // 3. Canonical mapping for Transport / Farrier if present on details
  if (d.companyName?.trim()) props.companyName = d.companyName.trim();
  if (d.websiteUrl?.trim()) props.websiteUrl = d.websiteUrl.trim();

  // 4. Canonical mapping for Stud Services if present on details
  if (d.studBreed?.trim()) props.studBreed = d.studBreed.trim();
  if (d.studAge?.trim()) {
    const parsedAge = parseInt(d.studAge.trim(), 10);
    props.studAge = isNaN(parsedAge) ? d.studAge.trim() : parsedAge;
  }
  if (d.studCoatColor?.trim()) props.studCoatColor = d.studCoatColor.trim();
  if (d.studHorseName?.trim()) props.studHorseName = d.studHorseName.trim();
  if (d.studSire?.trim()) props.studSire = d.studSire.trim();
  if (d.studDam?.trim()) props.studDam = d.studDam.trim();
  if (d.studDamsire?.trim()) props.studDamsire = d.studDamsire.trim();

  // 5. Canonical mapping for Sale Horses if present on details
  if (d.breed?.trim() && !props.HORSE_BREED) props.HORSE_BREED = d.breed.trim();
  if (d.coatColor?.trim() && !props.COAT_COLOR) props.COAT_COLOR = d.coatColor.trim();
  if (d.age?.trim() && !props.HORSE_AGE) props.HORSE_AGE = d.age.trim();
  if (d.gender?.trim() && !props.HORSE_GENDER) props.HORSE_GENDER = d.gender.trim();

  // 6. Clean up any invalid keys, nulls, or empty strings
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === '' || v === 'undefined' || v === 'null') {
      continue;
    }
    // Never send old hardcoded prefixed keys or non-property fields
    if (
      k.startsWith('facility') ||
      k === 'sellerPhone' ||
      k === 'phone'
    ) {
      continue;
    }
    cleaned[k] = v;
  }

  return cleaned;
}

export function mapDraftToCreateAdvert(
  draft: ListingDraft
): CreateAdvertDraftRequest {
  if (!draft.type) throw new Error('Kategori seçilmedi.');

  let categoryId = draft.type.categoryId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
    const found = (CATALOG_DATA as any)?.categories?.find(
      (c: any) =>
        c.slug === categoryId ||
        c.id === categoryId ||
        c.slug === draft.type?.categorySlug ||
        c.id === draft.type?.categorySlug
    );
    if (found?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(found.id)) {
      categoryId = found.id;
    }
  }

  const priceTl = parseTlInput(draft.details.priceTl);
  const price: Money | null =
    priceTl != null
      ? { amountMinor: tlToMinor(priceTl), currency: 'TRY' }
      : null;

  const body: CreateAdvertDraftRequest = {
    categoryId,
  };

  const title = draft.details.title?.trim();
  if (title) {
    body.title = title;
  }

  const description = draft.details.description?.trim();
  if (description) {
    body.description = description;
  }

  if (draft.details.districtId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.details.districtId)) {
    body.districtId = draft.details.districtId;
  }
  if (draft.details.horseId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.details.horseId)) {
    body.horseId = draft.details.horseId;
  }
  if (price) {
    body.price = price;
  }
  return body;
}
