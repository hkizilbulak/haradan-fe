import type { CreateAdvertDraftRequest, ListingDraft } from '@/types/listing';
import type { Money } from '@/types/money';
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
  const TOP_LEVEL_INJECTIONS: [string, unknown][] = [
    ['COAT_COLOR', d.coatColor],
    ['coatColor', d.coatColor],
    ['HORSE_BREED', d.breed],
    ['breed', d.breed],
    ['HORSE_AGE', d.age],
    ['age', d.age],
    ['HORSE_GENDER', d.gender],
    ['gender', d.gender],
    ['COMPANY_NAME', d.companyName],
    ['companyName', d.companyName],
    ['WEBSITE_URL', d.websiteUrl],
    ['websiteUrl', d.websiteUrl],
    ['STALLION_BREED', d.studBreed],
    ['studBreed', d.studBreed],
    ['STALLION_AGE', d.studAge],
    ['studAge', d.studAge],
    ['studHorseName', d.studHorseName],
    ['studSire', d.studSire],
    ['studDam', d.studDam],
    ['studDamsire', d.studDamsire],
    ['serviceType', (d as any).serviceType],
    ['SERVICE_TYPE', (d as any).serviceType],
    ['service_type', (d as any).serviceType],
  ];

  for (const [code, val] of TOP_LEVEL_INJECTIONS) {
    if (val !== undefined && val !== null && String(val).trim() !== '' && !props[code]) {
      props[code] = typeof val === 'string' ? val.trim() : val;
    }
  }

  // 3. Clean up any invalid keys, core columns, nulls, or empty strings
  const CORE_EXCLUDED_KEYS = new Set([
    'address',
    'ADDRESS',
    'sellerPhone',
    'phone',
    'PHONE',
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
  ]);

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === '' || v === 'undefined' || v === 'null') {
      continue;
    }
    // Never send old hardcoded prefixed keys or core SQL columns
    if (k.startsWith('facility') || CORE_EXCLUDED_KEYS.has(k)) {
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
