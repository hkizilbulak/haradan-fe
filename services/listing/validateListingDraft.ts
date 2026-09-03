import INITIAL_CATALOG from '@/data/catalog.json';
import {
  HORSE_LISTING_GROUP_SLUGS,
  HORSE_LISTING_LEAF_SLUGS,
} from '@/constants/listingCatalog';
import {
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '@/constants/Paytr';
import {
  getGlobalPropertiesConfig,
  type GlobalPropertiesMap,
} from '@/services/catalog/addressConfig';
import { isValidNationalPhone } from '@/services/phone';
import type { CategoryPropertyPublic } from '@/types';
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

/** TJK kaydı olabilecek kategoriler (Tamamen BE allowTjk sözleşmesine göre) */
export function isTjkEligibleListing(
  type: ListingTypeSelection | null | undefined,
  formDef?: { allowTjk?: boolean } | null
): boolean {
  if (formDef && typeof formDef.allowTjk === 'boolean') {
    return formDef.allowTjk;
  }
  if (type && typeof type.allowTjk === 'boolean') {
    return type.allowTjk;
  }
  return false;
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

export function detailsErrors(
  draft: ListingDraft,
  categoryProperties?: CategoryPropertyPublic[],
  globalPropertiesConfig?: GlobalPropertiesMap,
  customGlobalProperties?: CategoryPropertyPublic[]
): ListingFieldErrors {
  const e: ListingFieldErrors = {};
  const d = draft.details;
  const globalConfigs = globalPropertiesConfig ?? getGlobalPropertiesConfig();

  // 1. Başlık
  if (!d.title.trim()) e.title = 'Başlık gerekli.';

  // 2. Fiyat
  const priceCfg = globalConfigs.PRICE;
  if (priceCfg && priceCfg.isActive && priceCfg.isRequired) {
    const price = parseTlInput(d.priceTl);
    if (price == null || price <= 0) e.priceTl = 'Geçerli bir fiyat girin.';
  } else if (d.priceTl && d.priceTl.trim()) {
    const price = parseTlInput(d.priceTl);
    if (price == null || price < 0) e.priceTl = 'Geçerli bir fiyat girin.';
  }

  // 3. Konum
  const locCfg = globalConfigs.LOCATION;
  if (!locCfg || (locCfg.isActive && locCfg.isRequired)) {
    if (!d.provinceId) e.provinceId = 'İl seçin.';
    if (!d.districtId) e.districtId = 'İlçe seçin.';
  }

  // 4. Açık Adres
  const addressConfig = globalConfigs.ADDRESS;
  if (addressConfig && addressConfig.isActive && addressConfig.isRequired) {
    if (!d.address.trim() || d.address.trim().length < 5) {
      e.address = 'Açık adres zorunludur (en az 5 karakter).';
    }
  }

  // 5. Açıklama
  const descConfig = globalConfigs.DESCRIPTION;
  if (descConfig && descConfig.isActive && descConfig.isRequired) {
    if (!d.description || !d.description.trim()) {
      e.description = 'İlan açıklaması zorunludur.';
    }
  }

  // 6. Telefon
  const phoneCfg = globalConfigs.PHONE;
  if (!phoneCfg || (phoneCfg.isActive && phoneCfg.isRequired)) {
    if (!isValidNationalPhone(d.phoneCountryIso || 'TR', d.sellerPhone)) {
      e.sellerPhone = 'Geçerli bir telefon girin.';
    }
  }

  // 7. Medya
  if (!draft.media || draft.media.length === 0) {
    e.media = 'En az bir görsel eklemelisiniz.';
  }

  // 8. Dinamik Ortak Alanlar (Custom Global Properties) Zorunluluk Kontrolü
  if (customGlobalProperties && Array.isArray(customGlobalProperties)) {
    for (const prop of customGlobalProperties) {
      if (
        prop &&
        (prop as any).isActive !== false &&
        (prop as any).is_active !== false &&
        (prop as any).isFormVisible !== false &&
        (prop as any).is_form_visible !== false &&
        prop.isRequired
      ) {
        const val =
          d.properties?.[prop.code] ??
          d.properties?.[prop.code.toLowerCase()] ??
          d.properties?.[prop.code.toUpperCase()];
        if (val === undefined || val === null || val === '') {
          e[prop.code as keyof ListingFieldErrors] = `${prop.title} zorunludur.`;
        }
      }
    }
  }

  // Kategoriye özel yedek zorunlu alan kontrolleri (categoryProperties henüz yüklenmediğinde)
  if (categoryProperties === undefined) {
    if (isPansiyonListing(draft.type)) {
      const hasAnyFacility = Boolean(
        d.facilityGrassPaddock ||
        d.facilitySandPaddock ||
        d.facilityStallionPaddock ||
        d.facilityVeterinarian ||
        d.facilityFarrier ||
        d.facilityFoalingBarn ||
        d.facilityTrainingTrack ||
        d.properties?.grassPaddock ||
        d.properties?.sandPaddock ||
        d.properties?.vet
      );
      if (!hasAnyFacility) {
        e.facility = 'En az bir tesis veya hizmet özelliği seçmelisiniz.';
      }
    } else if (isTransportListing(draft.type)) {
      if (!d.companyName?.trim() && !d.properties?.companyName) {
        e.companyName = 'Firma adı zorunludur.';
      }
    } else if (isStudServiceListing(draft.type)) {
      const hasName = Boolean(
        d.registeredName?.trim() ||
        d.studHorseName?.trim() ||
        d.properties?.REGISTERED_NAME ||
        d.properties?.studHorseName ||
        d.properties?.studHorse
      );
      if (!hasName) {
        e.studHorseName = 'Aygır adı zorunludur.';
        e.registeredName = 'Aygır adı zorunludur.';
      }
      if (!d.studBreed?.trim() && !d.properties?.studBreed && !d.properties?.STALLION_BREED) {
        e.studBreed = 'At ırkı seçimi zorunludur.';
      }
      const hasAge = Boolean(
        d.studAge?.trim() ||
        d.age?.trim() ||
        d.properties?.studAge ||
        d.properties?.STALLION_AGE
      );
      if (!hasAge) {
        e.studAge = 'Yaş bilgisi zorunludur.';
      }
      const hasColor = Boolean(
        d.studCoatColor?.trim() ||
        d.coatColor?.trim() ||
        d.properties?.studCoatColor ||
        d.properties?.COAT_COLOR
      );
      if (!hasColor) {
        e.studCoatColor = 'Donu (renk) seçimi zorunludur.';
      }
      const hasSire = Boolean(
        d.studSire?.trim() ||
        d.sire?.trim() ||
        d.properties?.studSire ||
        d.properties?.SIRE
      );
      if (!hasSire) {
        e.studSire = 'Baba (Sire) adı zorunludur.';
      }
      const hasDam = Boolean(
        d.studDam?.trim() ||
        d.dam?.trim() ||
        d.properties?.studDam ||
        d.properties?.DAM
      );
      if (!hasDam) {
        e.studDam = 'Anne (Dam) adı zorunludur.';
      }
      const hasDamsire = Boolean(
        d.studDamsire?.trim() ||
        d.damsire?.trim() ||
        d.properties?.studDamsire ||
        d.properties?.DAMSIRE
      );
      if (!hasDamsire) {
        e.studDamsire = 'Annesinin babası zorunludur.';
      }
    }
  }

  // Dinamik Kategori Özellikleri Zorunluluk Kontrolü (Tamamen haradan_bo tanımlarına göre)
  if (draft.type?.categoryId || draft.type?.categorySlug) {
    let requiredProps: any[] = [];

    if (categoryProperties !== undefined && Array.isArray(categoryProperties)) {
      requiredProps = categoryProperties.filter(
        (p) =>
          p &&
          (p as any).isActive !== false &&
          (p as any).is_active !== false &&
          (p as any).isFormVisible !== false &&
          (p as any).is_form_visible !== false &&
          p.isRequired
      );
    } else {
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
      requiredProps = allProps.filter(
        (p) =>
          p &&
          p.isActive !== false &&
          (p as any).is_active !== false &&
          p.isFormVisible !== false &&
          (p as any).is_form_visible !== false &&
          p.isRequired &&
          (p.categoryId === catIdOrSlug ||
            p.categoryId === clean ||
            p.categoryId === `cat-${clean}` ||
            p.categoryId === draft.type?.categorySlug ||
            p.categoryId === draft.type?.categoryId)
      );
    }

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

    function getCanonicalKey(prop: { code?: string; title?: string } | null | undefined): string {
      if (!prop) return '';
      const code = String(prop.code || '').trim().toUpperCase().replace(/[-_]/g, '');
      const title = String(prop.title || '').trim().toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');

      if (
        code === 'STUDHORSE' ||
        code === 'STUDHORSENAME' ||
        code === 'REGISTEREDNAME' ||
        code === 'HORSENAME' ||
        title === 'aygiradi' ||
        title === 'atadi' ||
        title === 'kayitliadi'
      ) {
        return 'canonical_stud_name';
      }
      if (
        code === 'STUDSIRE' ||
        code === 'SIRE' ||
        title === 'baba' ||
        title === 'babasire'
      ) {
        return 'canonical_stud_sire';
      }
      if (
        code === 'STUDDAM' ||
        code === 'DAM' ||
        title === 'anne' ||
        title === 'annedam'
      ) {
        return 'canonical_stud_dam';
      }
      if (
        code === 'STUDDAMSIRE' ||
        code === 'DAMSIRE' ||
        title === 'kisrakbabasi' ||
        title === 'annesi' ||
        title === 'anneninbabasi' ||
        title === 'anneninbabasidamsire'
      ) {
        return 'canonical_stud_damsire';
      }
      if (
        code === 'STALLIONBREED' ||
        code === 'STUDBREED' ||
        code === 'HORSEBREED' ||
        code === 'BREED' ||
        title === 'atirki'
      ) {
        return 'canonical_breed';
      }
      if (
        code === 'COATCOLOR' ||
        code === 'STUDCOATCOLOR' ||
        title === 'don' ||
        title === 'donu' ||
        title === 'donurenk' ||
        title === 'renk'
      ) {
        return 'canonical_coat_color';
      }
      if (
        code === 'HORSEAGE' ||
        code === 'STALLIONAGE' ||
        code === 'STUDAGE' ||
        title === 'yas' ||
        title === 'yaş'
      ) {
        return 'canonical_age';
      }
      if (
        code === 'HORSEGENDER' ||
        code === 'GENDER' ||
        title === 'cinsiyet'
      ) {
        return 'canonical_gender';
      }
      return code || title;
    }

    function findPropertyValue(properties: Record<string, unknown> | undefined, prop: { code: string; title?: string }): unknown {
      if (!properties) return undefined;
      const propCode = prop.code;
      if (properties[propCode] !== undefined && properties[propCode] !== null && String(properties[propCode]).trim() !== '') {
        return properties[propCode];
      }
      const propCodeUpper = propCode.toUpperCase();
      if (properties[propCodeUpper] !== undefined && properties[propCodeUpper] !== null && String(properties[propCodeUpper]).trim() !== '') {
        return properties[propCodeUpper];
      }
      const propCodeLower = propCode.toLowerCase();
      if (properties[propCodeLower] !== undefined && properties[propCodeLower] !== null && String(properties[propCodeLower]).trim() !== '') {
        return properties[propCodeLower];
      }
      const normTarget = propCode.replace(/[-_]/g, '').toLowerCase();
      for (const [k, v] of Object.entries(properties)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          if (k.replace(/[-_]/g, '').toLowerCase() === normTarget) {
            return v;
          }
        }
      }

      // Check canonical key matches in properties
      const canonicalKey = getCanonicalKey(prop);
      if (canonicalKey === 'canonical_stud_name') {
        return properties['studHorse'] || properties['studHorseName'] || properties['REGISTERED_NAME'] || properties['HORSE_NAME'];
      }
      if (canonicalKey === 'canonical_stud_sire') {
        return properties['studSire'] || properties['SIRE'];
      }
      if (canonicalKey === 'canonical_stud_dam') {
        return properties['studDam'] || properties['DAM'];
      }
      if (canonicalKey === 'canonical_stud_damsire') {
        return properties['studDamSire'] || properties['studDamsire'] || properties['DAMSIRE'];
      }
      if (canonicalKey === 'canonical_breed') {
        return properties['STALLION_BREED'] || properties['studBreed'] || properties['HORSE_BREED'] || properties['breed'];
      }
      if (canonicalKey === 'canonical_coat_color') {
        return properties['COAT_COLOR'] || properties['studCoatColor'] || properties['coatColor'];
      }
      if (canonicalKey === 'canonical_age') {
        return properties['STALLION_AGE'] || properties['studAge'] || properties['HORSE_AGE'] || properties['age'];
      }
      if (canonicalKey === 'canonical_gender') {
        return properties['HORSE_GENDER'] || properties['gender'];
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

      let val = findPropertyValue(d.properties, prop);
      if (val === undefined || val === null || val === '' || String(val).trim() === '') {
        const canonicalKey = getCanonicalKey(prop);
        const norm = code.replace(/[-_]/g, '').toLowerCase();
        const titleNorm = String(prop.title || '').trim().toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');

        if (
          canonicalKey === 'canonical_stud_name' ||
          norm === 'studhorsename' ||
          norm === 'studhorse' ||
          norm === 'registeredname' ||
          norm === 'horsename' ||
          norm === 'aygiradi' ||
          titleNorm === 'aygiradi' ||
          titleNorm === 'atadi' ||
          titleNorm === 'kayitliadi'
        ) {
          val = d.studHorseName || d.registeredName || d.title;
        } else if (
          canonicalKey === 'canonical_breed' ||
          norm === 'horsebreed' ||
          norm === 'breed' ||
          norm === 'stallionbreed' ||
          norm === 'studbreed' ||
          titleNorm === 'atirki'
        ) {
          val = d.studBreed || d.breed;
        } else if (
          canonicalKey === 'canonical_coat_color' ||
          norm === 'coatcolor' ||
          norm === 'color' ||
          norm === 'studcoatcolor' ||
          titleNorm === 'donu' ||
          titleNorm === 'donurenk' ||
          titleNorm === 'renk'
        ) {
          val = d.studCoatColor || d.coatColor;
        } else if (
          canonicalKey === 'canonical_age' ||
          norm === 'horseage' ||
          norm === 'age' ||
          norm === 'stallionage' ||
          norm === 'studage' ||
          titleNorm === 'yas' ||
          titleNorm === 'yaş'
        ) {
          val = d.studAge || d.age;
        } else if (
          canonicalKey === 'canonical_gender' ||
          norm === 'horsegender' ||
          norm === 'gender' ||
          titleNorm === 'cinsiyet'
        ) {
          val = d.gender;
        } else if (
          canonicalKey === 'canonical_stud_sire' ||
          norm === 'studsire' ||
          norm === 'sire' ||
          titleNorm === 'baba' ||
          titleNorm === 'babasire'
        ) {
          val = d.studSire || d.sire;
        } else if (
          canonicalKey === 'canonical_stud_dam' ||
          norm === 'studdam' ||
          norm === 'dam' ||
          titleNorm === 'anne' ||
          titleNorm === 'annedam'
        ) {
          val = d.studDam || d.dam;
        } else if (
          canonicalKey === 'canonical_stud_damsire' ||
          norm === 'studdamsire' ||
          norm === 'damsire' ||
          titleNorm === 'kisrakbabasi' ||
          titleNorm === 'annesi' ||
          titleNorm === 'anneninbabasi' ||
          titleNorm === 'anneninbabasidamsire'
        ) {
          val = d.studDamsire || d.damsire;
        } else if (norm === 'companyname' || titleNorm === 'firmaadi') {
          val = d.companyName;
        } else if (norm === 'websiteurl' || titleNorm === 'websitesi') {
          val = d.websiteUrl;
        } else if (norm === 'servicetype' || norm === 'service_type' || titleNorm === 'hizmetturu') {
          val = (d as any).serviceType;
        }
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

export function detailsStepComplete(
  draft: ListingDraft,
  categoryProperties?: CategoryPropertyPublic[]
): boolean {
  return Object.keys(detailsErrors(draft, categoryProperties)).length === 0;
}

export function packageStepComplete(draft: ListingDraft): boolean {
  if (!isListingPackageStepEnabled()) return true;
  return draft.packageCode != null && draft.packageCode.trim() !== '';
}

export function canEnterStep(
  draft: ListingDraft,
  target: ListingWizardStep,
  categoryProperties?: CategoryPropertyPublic[]
): boolean {
  if (target === 'type') return true;
  if (target === 'details') return typeStepComplete(draft);
  if (target === 'package') {
    if (!isListingPackageStepEnabled()) return false;
    return typeStepComplete(draft) && detailsStepComplete(draft, categoryProperties);
  }
  if (target === 'payment') {
    if (!isPaytrCheckoutEnabled()) return false;
    return (
      typeStepComplete(draft) &&
      detailsStepComplete(draft, categoryProperties) &&
      packageStepComplete(draft)
    );
  }
  if (target === 'review') {
    return (
      typeStepComplete(draft) &&
      detailsStepComplete(draft, categoryProperties) &&
      packageStepComplete(draft)
    );
  }
  return false;
}
