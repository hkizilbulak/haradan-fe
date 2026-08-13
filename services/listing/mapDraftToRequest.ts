import { composeInternationalPhone } from '@/services/phone';
import type {
  CreateListingHorsePayload,
  CreateListingRequest,
  ListingDraft,
} from '@/types/listing';
import { isHorseListing } from './validateListingDraft';

function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function tlToMinor(tl: number): number {
  return Math.round(tl * 100);
}

function parseOptionalInt(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function buildHorse(draft: ListingDraft): CreateListingHorsePayload | null {
  if (!isHorseListing(draft.type?.categorySlug)) return null;
  const d = draft.details;
  const owners = d.ownersText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    tjkId: d.tjkId,
    registeredName: d.registeredName.trim(),
    breed: draft.breed?.slug ?? null,
    gender: d.gender,
    birthDate: d.birthDate.trim() || null,
    age: parseOptionalInt(d.age),
    coatColor: d.coatColor.trim() || null,
    heightCm: parseOptionalInt(d.heightCm),
    sire: d.sire.trim() || null,
    dam: d.dam.trim() || null,
    damsire: d.damsire.trim() || null,
    owners,
    breeder: d.breeder.trim() || null,
    trainer: d.trainer.trim() || null,
  };
}

export function mapDraftToRequest(draft: ListingDraft): CreateListingRequest {
  if (!draft.type) throw new Error('Kategori seçilmedi.');
  if (!draft.packageCode) throw new Error('Paket seçilmedi.');
  const cover = draft.media.find((m) => m.isCover) ?? draft.media[0];
  if (!cover?.assetId) throw new Error('Kapak görseli yüklenmedi.');
  const priceTl = parseTlInput(draft.details.priceTl);
  return {
    categoryId: draft.type.categoryId,
    breedSlug: draft.breed?.slug ?? null,
    title: draft.details.title.trim(),
    description: draft.details.description.trim(),
    price:
      priceTl != null
        ? { amountMinor: tlToMinor(priceTl), currency: 'TRY' }
        : null,
    provinceId: draft.details.provinceId ?? '',
    sellerPhone:
      composeInternationalPhone(
        draft.details.phoneCountryIso || 'TR',
        draft.details.sellerPhone
      ) ?? (draft.details.sellerPhone.trim() || null),
    horse: buildHorse(draft),
    mediaAssetIds: draft.media
      .map((m) => m.assetId)
      .filter((id): id is string => Boolean(id)),
    coverAssetId: cover.assetId,
    packageCode: draft.packageCode,
  };
}
