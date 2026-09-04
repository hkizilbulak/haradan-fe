import type { CreateAdvertDraftRequest, ListingDraft } from '@/types/listing';
import type { Money } from '@/types/money';
import { composeInternationalPhone } from '@/services/phone';
import { isStudServiceListing } from './validateListingDraft';
import CATALOG_DATA from '@/data/catalog.json';


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

  if (d.sellerPhone && d.sellerPhone.trim()) {
    const fullPhone =
      composeInternationalPhone(
        d.phoneCountryIso || 'TR',
        d.sellerPhone
      ) ?? d.sellerPhone.trim();
    props.sellerPhone = fullPhone;
    props.phone = fullPhone;
  }

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

  // 2. Automatic injection from top-level fields (covers TJK auto-fill and direct state)
  const normAge = (raw: unknown): string | undefined => {
    if (raw == null || raw === '') return undefined;
    const str = String(raw).trim();
    if ([
      '0', '1', '1.5', '2', '3', '4', '5', '6', '7', '8', '9', '10-15 arası', '15 üzeri'
    ].includes(str)) return str;
    const num = parseFloat(str.replace(',', '.'));
    if (isNaN(num)) return str;
    if (num === 0) return '0';
    if (num === 1) return '1';
    if (num === 1.5) return '1.5';
    if (num === 2) return '2';
    if (num === 3) return '3';
    if (num === 4) return '4';
    if (num === 5) return '5';
    if (num === 6) return '6';
    if (num === 7) return '7';
    if (num === 8) return '8';
    if (num === 9) return '9';
    if (num >= 10 && num <= 15) return '10-15 arası';
    if (num > 15) return '15 üzeri';
    return String(num);
  };

  const normGender = (raw: unknown): string | undefined => {
    if (raw == null || raw === '') return undefined;
    const g = String(raw).trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    if (g.startsWith('e')) return 'Erkek';
    if (g.startsWith('d')) return 'Dişi';
    if (g.startsWith('i') || g.startsWith('ı')) return 'İğdiş';
    return String(raw).trim();
  };

  const normBreed = (raw: unknown): string | undefined => {
    if (raw == null || raw === '') return undefined;
    const b = String(raw).trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    if (b.includes('ingiliz')) return 'İngiliz (Thoroughbred)';
    if (b.includes('arap')) return 'Safkan Arap';
    return String(raw).trim();
  };

  const normStudBreed = (raw: unknown): string | undefined => {
    if (raw == null || raw === '') return undefined;
    const b = String(raw).trim().replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    if (b.includes('ingiliz')) return 'İngiliz';
    if (b.includes('arap')) return 'Arap';
    return String(raw).trim();
  };

  const normStudAge = (raw: unknown): number | string | undefined => {
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    if (!isNaN(n)) return n;
    return String(raw).trim();
  };

  const TOP_LEVEL_INJECTIONS: [string, unknown][] = [
    ['COAT_COLOR', d.coatColor || d.studCoatColor],
    ['HORSE_BREED', normBreed(d.breed)],
    ['HORSE_AGE', normAge(d.age)],
    ['HORSE_GENDER', normGender(d.gender)],
    ['COMPANY_NAME', d.companyName],
    ['companyName', d.companyName],
    ['WEBSITE_URL', d.websiteUrl],
    ['websiteUrl', d.websiteUrl],
    ['STALLION_BREED', normStudBreed(d.studBreed || d.breed)],
    ['studBreed', normStudBreed(d.studBreed || d.breed)],
    ['STALLION_AGE', normStudAge(d.studAge || d.age)],
    ['studAge', normStudAge(d.studAge || d.age)],
    ['studCoatColor', d.studCoatColor || d.coatColor],
    ['studHorse', d.studHorseName || d.registeredName],
    ['studHorseName', d.studHorseName || d.registeredName],
    ['studSire', d.studSire || d.sire],
    ['studDam', d.studDam || d.dam],
    ['studDamSire', d.studDamsire || d.damsire],
    ['studDamsire', d.studDamsire || d.damsire],
    ['SIRE', d.sire || d.studSire],
    ['DAM', d.dam || d.studDam],
    ['DAMSIRE', d.damsire || d.studDamsire],
    ['REGISTERED_NAME', d.registeredName || d.studHorseName],
    ['HORSE_NAME', d.registeredName || d.studHorseName],
    ['TJK_NUMBER', d.tjkNumber],
    ['BIRTH_DATE', d.birthDate],
    ['HEIGHT_CM', d.heightCm ? (isNaN(parseInt(d.heightCm, 10)) ? d.heightCm : parseInt(d.heightCm, 10)) : undefined],
    ['BREEDER', d.breeder],
    ['TRAINER', d.trainer],
    ['serviceType', (d as any).serviceType],
    ['SERVICE_TYPE', (d as any).serviceType],
    ['grassPaddock', d.facilityGrassPaddock ? true : undefined],
    ['sandPaddock', d.facilitySandPaddock ? true : undefined],
    ['stallionPaddock', d.facilityStallionPaddock ? true : undefined],
    ['vet', d.facilityVeterinarian ? true : undefined],
    ['veterinarian', d.facilityVeterinarian ? true : undefined],
    ['farrier', d.facilityFarrier ? true : undefined],
    ['foalingBarn', d.facilityFoalingBarn ? true : undefined],
    ['maternity', d.facilityFoalingBarn ? true : undefined],
    ['trainingTrack', typeof d.properties?.trainingTrack === 'string' ? d.properties.trainingTrack : (d.facilityTrainingTrack ? (typeof d.facilityTrainingTrack === 'string' ? d.facilityTrainingTrack : true) : undefined)],
    ['IN_TRAINING', d.inTraining !== undefined ? Boolean(d.inTraining) : undefined],
    ['IS_FOR_RENT', d.isForRent !== undefined ? Boolean(d.isForRent) : undefined],
    ['IS_RACE_READY', d.isRaceReady !== undefined ? Boolean(d.isRaceReady) : undefined],
  ];

  for (const [code, val] of TOP_LEVEL_INJECTIONS) {
    if (val !== undefined && val !== null && String(val).trim() !== '' && !props[code]) {
      props[code] = typeof val === 'string' ? val.trim() : val;
    }
  }

  // If stud service listing, stallion is always male
  if (isStudServiceListing(draft.type)) {
    if (!props['HORSE_GENDER']) props['HORSE_GENDER'] = 'Erkek';
    if (!props['gender']) props['gender'] = 'Erkek';
  }

  // If HORSE_AGE exists in props, ensure it's normalized to the select option string
  if (props['HORSE_AGE']) {
    const matchedAge = normAge(props['HORSE_AGE']);
    if (matchedAge) {
      props['HORSE_AGE'] = matchedAge;
    }
  }

  // 3. Clean up any invalid keys, core columns, legacy lowercase keys, nulls, or empty strings
  const EXCLUDED_KEYS = new Set([
    'address',
    'ADDRESS',
    'title',
    'TITLE',
    'description',
    'DESCRIPTION',
    'price',
    'PRICE',
    'priceTl',
    'location',
    'LOCATION',
    'provinceId',
    'districtId',
    'media',
    'MEDIA',
    'images',
    'IMAGES',
    // Exclude legacy lowercase keys that live backend rejects as undefined category properties
    'age',
    'breed',
    'coatColor',
    'gender',
    'companyName',
    'websiteUrl',
    'service_type',
    'facilityGrassPaddock',
    'facilitySandPaddock',
    'facilityStallionPaddock',
    'facilityVeterinarian',
    'facilityFarrier',
    'facilityFoalingBarn',
    'facilityTrainingTrack',
    'facility_training_track',
  ]);

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === '' || v === 'undefined' || v === 'null') {
      continue;
    }
    // Never send old hardcoded prefixed keys, lowercase helpers, or core SQL columns
    if (EXCLUDED_KEYS.has(k)) {
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
