import INITIAL_CATALOG from '@/data/catalog.json';
import {
  HORSE_LISTING_GROUP_SLUGS,
  HORSE_LISTING_LEAF_SLUGS,
} from '@/constants/listingCatalog';
import {
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '@/constants/Paytr';
import { getAddressFieldConfig } from '@/services/catalog/addressConfig';
import { isValidNationalPhone } from '@/services/phone';
import type {
  ListingDraft,
  ListingTypeSelection,
  ListingWizardStep,
} from '@/types/listing';

function parseTlInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export type ListingFieldErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'priceTl'
    | 'provinceId'
    | 'districtId'
    | 'address'
    | 'registeredName'
    | 'gender'
    | 'media'
    | 'sellerPhone'
    | 'facility'
    | 'companyName'
    | 'studHorseName'
    | 'studBreed'
    | 'studAge'
    | 'studCoatColor'
    | 'studSire'
    | 'studDam'
    | 'studDamsire'
    | (string & {}),
    string
  >
>;

export function isPansiyonListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.categorySlug === 'pansiyon-haralar' ||
    type.categoryId === 'cat-pansiyon'
  );
}

export function isTransportListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.categorySlug === 'at-nakliyesi' ||
    type.categoryId === 'cat-nakliye'
  );
}

export function isFarrierListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.categorySlug === 'nalbantlar' ||
    type.categoryId === 'cat-nalbant'
  );
}

export function isStudServiceListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.parentSlug === 'asim-hizmetleri' ||
    type.categorySlug === 'asim-hizmetleri' ||
    type.categorySlug === 'arap-aygir' ||
    type.categorySlug === 'ingiliz-aygir' ||
    type.categoryId === 'cat-asim' ||
    type.categoryId === 'cat-arap-aygir' ||
    type.categoryId === 'cat-ingiliz-aygir'
  );
}

export function isSaleHorseListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  return (
    type.parentSlug === 'satilik-atlar' ||
    type.categorySlug === 'satilik-yaris-ati' ||
    type.categorySlug === 'satilik-kisrak' ||
    type.categorySlug === 'satilik-aygir' ||
    type.categorySlug === 'satilik-binek-ati' ||
    type.categorySlug === 'satilik-pony'
  );
}

export function isHorseListing(
  type: ListingTypeSelection | null | undefined
): boolean {
  if (!type) return false;
  if (type.parentSlug && HORSE_LISTING_GROUP_SLUGS.has(type.parentSlug)) {
    return true;
  }
  return HORSE_LISTING_LEAF_SLUGS.has(type.categorySlug);
}

export function typeStepComplete(draft: ListingDraft): boolean {
  return draft.type != null;
}

export function detailsErrors(draft: ListingDraft): ListingFieldErrors {
  const e: ListingFieldErrors = {};
  const d = draft.details;
  if (!d.title.trim()) e.title = 'Başlık gerekli.';
  const price = parseTlInput(d.priceTl);
  if (price == null || price <= 0) e.priceTl = 'Geçerli bir fiyat girin.';
  if (!d.provinceId) e.provinceId = 'İl seçin.';
  if (!d.districtId) e.districtId = 'İlçe seçin.';

  const addressConfig = getAddressFieldConfig();
  if (addressConfig.isActive && addressConfig.isRequired) {
    if (!d.address.trim() || d.address.trim().length < 5) {
      e.address = 'Açık adres zorunludur (en az 5 karakter).';
    }
  }

  if (!isValidNationalPhone(d.phoneCountryIso || 'TR', d.sellerPhone)) {
    e.sellerPhone = 'Geçerli bir telefon girin.';
  }
  if (!draft.media || draft.media.length === 0) {
    e.media = 'En az bir görsel eklemelisiniz.';
  }

  // Dinamik Kategori Özellikleri Zorunluluk Kontrolü (Tamamen haradan_bo tanımlarına göre)
  if (draft.type?.categoryId || draft.type?.categorySlug) {
    const catIdOrSlug = draft.type.categoryId || draft.type.categorySlug;
    let allProps: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('haradan_catalog_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.categoryProperties)) {
            allProps = parsed.categoryProperties;
          }
        }
      } catch {}
    }
    if (allProps.length === 0) {
      allProps = ((INITIAL_CATALOG as any)?.categoryProperties || []) as any[];
    }
    const clean = catIdOrSlug.replace(/^cat-/, '');
    const requiredProps = allProps.filter(
      (p) =>
        p &&
        p.isActive !== false &&
        p.isFormVisible !== false &&
        p.isRequired &&
        (p.categoryId === catIdOrSlug ||
          p.categoryId === clean ||
          p.categoryId === `cat-${clean}` ||
          p.categoryId === draft.type?.categorySlug ||
          p.categoryId === draft.type?.categoryId)
    );

    const CORE_CODES = new Set([
      'TITLE',
      'DESCRIPTION',
      'PRICE',
      'LOCATION',
      'PHONE',
      'ADDRESS',
      'MEDIA',
      'IMAGES',
      'title',
      'description',
      'price',
      'location',
      'phone',
      'address',
      'media',
      'images',
    ]);

    function findPropertyValue(properties: Record<string, unknown> | undefined, propCode: string): unknown {
      if (!properties) return undefined;
      if (properties[propCode] !== undefined && properties[propCode] !== '') {
        return properties[propCode];
      }
      const normTarget = propCode.replace(/[-_]/g, '').toLowerCase();
      for (const [k, v] of Object.entries(properties)) {
        if (k.replace(/[-_]/g, '').toLowerCase() === normTarget && v !== undefined && v !== '') {
          return v;
        }
      }
      return undefined;
    }

    for (const prop of requiredProps) {
      if (prop.dataType === 'BOOLEAN') {
        continue;
      }
      const code = prop.code;
      const codeUpper = String(code).toUpperCase();
      if (CORE_CODES.has(code) || CORE_CODES.has(codeUpper)) {
        continue;
      }

      let val = findPropertyValue(d.properties, code);
      if (val === undefined || val === null || val === '') {
        const norm = code.replace(/[-_]/g, '').toLowerCase();
        if (norm === 'horsebreed' || norm === 'breed') val = d.breed;
        else if (norm === 'coatcolor' || norm === 'color') val = d.coatColor;
        else if (norm === 'horseage' || norm === 'age') val = d.age;
        else if (norm === 'horsegender' || norm === 'gender') val = d.gender;
        else if (norm === 'companyname') val = d.companyName;
        else if (norm === 'websiteurl') val = d.websiteUrl;
        else if (norm === 'stallionbreed' || norm === 'studbreed') val = d.studBreed;
        else if (norm === 'stallionage' || norm === 'studage') val = d.studAge;
        else if (norm === 'studhorsename') val = d.studHorseName;
        else if (norm === 'studsire') val = d.studSire;
        else if (norm === 'studdam') val = d.studDam;
        else if (norm === 'studdamsire') val = d.studDamsire;
        else if (norm === 'servicetype') val = (d as any).serviceType;
      }
      if (val === undefined || val === null || val === '' || String(val).trim() === '') {
        if (!e[code]) {
          e[code] = `${prop.title} zorunludur.`;
        }
      }
    }
  }

  return e;
}

export function detailsStepComplete(draft: ListingDraft): boolean {
  return Object.keys(detailsErrors(draft)).length === 0;
}

export function packageStepComplete(draft: ListingDraft): boolean {
  if (!isListingPackageStepEnabled()) return true;
  return draft.packageCode != null && draft.packageCode.trim() !== '';
}

export function canEnterStep(
  draft: ListingDraft,
  target: ListingWizardStep
): boolean {
  if (target === 'type') return true;
  if (target === 'details') return typeStepComplete(draft);
  if (target === 'package') {
    if (!isListingPackageStepEnabled()) return false;
    return typeStepComplete(draft) && detailsStepComplete(draft);
  }
  if (target === 'payment') {
    if (!isPaytrCheckoutEnabled()) return false;
    return (
      typeStepComplete(draft) &&
      detailsStepComplete(draft) &&
      packageStepComplete(draft)
    );
  }
  if (target === 'review') {
    return (
      typeStepComplete(draft) &&
      detailsStepComplete(draft) &&
      packageStepComplete(draft)
    );
  }
  return false;
}
