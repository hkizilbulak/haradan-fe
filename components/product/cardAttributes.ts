import { useEffect, useState } from 'react';
import { locationLookup } from '@/services/location/createLocationLookup';
import type { CatalogProductCard } from '@/types';

export type CardHorseAttributes = {
  province: string;
  gender: string | null;
  age: string | null;
  breed: string | null;
  serviceCategory: string | null;
};

const KNOWN_CATEGORIES: Record<string, string> = {
  'c1000000-0000-4000-8000-000000000011': 'Satılık Yarış Atı',
  'c1000000-0000-4000-8000-000000000012': 'Satılık Kısrak',
  'c1000000-0000-4000-8000-000000000013': 'Satılık Aygır',
  'c1000000-0000-4000-8000-000000000014': 'Satılık Binek Atı',
  'c1000000-0000-4000-8000-000000000015': 'Satılık Pony',
  'c1000000-0000-4000-8000-000000000021': 'Pansiyon Haralar',
  'c1000000-0000-4000-8000-000000000022': 'At Nakliyesi',
  'c1000000-0000-4000-8000-000000000023': 'Nalbantlar',
  'c1000000-0000-4000-8000-000000000031': 'Arap Aygır',
  'c1000000-0000-4000-8000-000000000032': 'İngiliz Aygır',
};

function getPropValue(props: Record<string, any>, targetKeys: string[]): any {
  const normTargets = targetKeys.map((k) => k.toLowerCase().replace(/[-_\s]/g, ''));
  for (const [pk, pv] of Object.entries(props)) {
    if (pv == null || pv === '' || pv === '-') continue;
    const normKey = pk.toLowerCase().replace(/[-_\s]/g, '');
    if (normTargets.includes(normKey)) {
      return pv;
    }
  }
  return null;
}

/**
 * Saf yardımcı: Her at ilanının gerçek ve benzersiz özelliklerini (Cinsiyet, Yaş, Irk, İl)
 * properties, kategori, marka ve başlıktan dinamik ve doğru şekilde çözer.
 */
export function getListingCardAttributes(
  product?: CatalogProductCard | null
): CardHorseAttributes {
  if (!product) {
    return {
      province: '',
      gender: null,
      age: null,
      breed: null,
      serviceCategory: null,
    };
  }

  // 1. Sadece İl (City / Province)
  let province = '';
  if (product.provinceName && product.provinceName.trim()) {
    province = product.provinceName.trim();
  } else if (product.provinceId) {
    province = locationLookup.getProvinceName(product.provinceId) || '';
  }

  if (!province && product.locationName) {
    // "Silivri, İstanbul" -> "İstanbul"
    const parts = product.locationName.split(',');
    province = parts[parts.length - 1]?.trim() || '';
  }

  // 2. Kategori ve Hizmet Ayrımı
  const catId = (product.categoryId || '').toLowerCase();
  const knownCatName = KNOWN_CATEGORIES[product.categoryId || ''] || '';
  const title = product.title || '';
  const titleLower = title.toLowerCase();

  let serviceCategory: string | null = null;
  if (
    catId === 'c1000000-0000-4000-8000-000000000021' ||
    catId.includes('pansiyon') ||
    titleLower.includes('pansiyon') ||
    titleLower.includes('hara')
  ) {
    serviceCategory = 'Pansiyon / Hara';
  } else if (
    catId === 'c1000000-0000-4000-8000-000000000022' ||
    catId.includes('nakliye') ||
    titleLower.includes('nakliye')
  ) {
    serviceCategory = 'At Nakliyesi';
  } else if (
    catId === 'c1000000-0000-4000-8000-000000000023' ||
    catId.includes('nalbant') ||
    titleLower.includes('nalbant')
  ) {
    serviceCategory = 'Nalbant';
  } else if (catId.includes('ekipman') || catId.includes('ahir')) {
    serviceCategory = 'Ekipman / Tesis';
  }

  const rawProps = (product.properties || {}) as Record<string, any>;

  // 3. Cinsiyet (Gender)
  let gender: string | null = null;
  const rawGender = getPropValue(rawProps, [
    'HORSE_GENDER',
    'horsegender',
    'horse_gender',
    'cinsiyet',
    'gender',
    'studgender',
  ]);

  if (rawGender) {
    const gStr = String(rawGender).trim().toLowerCase();
    if (
      gStr === 'd' ||
      gStr === 'k' || // TJK: dk = dişi kır
      gStr.includes('dişi') ||
      gStr.includes('disi') ||
      gStr.includes('mare') ||
      gStr.includes('filly') ||
      gStr.includes('kısrak')
    ) {
      gender = 'Dişi';
    } else if (
      gStr.includes('iğdiş') ||
      gStr.includes('igdis') ||
      gStr.includes('gelding')
    ) {
      gender = 'İğdiş';
    } else {
      gender = 'Erkek';
    }
  } else if (!serviceCategory) {
    if (
      catId === 'c1000000-0000-4000-8000-000000000012' ||
      catId.includes('kisrak') ||
      titleLower.includes('kısrak') ||
      titleLower.includes('kisrak') ||
      titleLower.includes('dişi') ||
      titleLower.includes('disi')
    ) {
      gender = 'Dişi';
    } else if (
      catId === 'c1000000-0000-4000-8000-000000000013' ||
      catId === 'c1000000-0000-4000-8000-000000000031' ||
      catId === 'c1000000-0000-4000-8000-000000000032' ||
      catId.includes('aygir') ||
      catId.includes('asim') ||
      titleLower.includes('aygır') ||
      titleLower.includes('aygir')
    ) {
      gender = 'Erkek';
    } else if (titleLower.includes('iğdiş') || titleLower.includes('igdis')) {
      gender = 'İğdiş';
    } else {
      gender = 'Erkek';
    }
  }

  // 4. Yaş (Age)
  let age: string | null = null;
  const rawAge = getPropValue(rawProps, [
    'HORSE_AGE',
    'horseage',
    'horse_age',
    'yas',
    'yaş',
    'age',
    'stallionage',
    'studage',
  ]);

  const rawBirthYear = getPropValue(rawProps, ['birthYear', 'birth_year']);
  const rawBirthDate = getPropValue(rawProps, ['BIRTH_DATE', 'birthDate', 'birth_date']);

  if (rawAge != null && String(rawAge).trim() && String(rawAge) !== '-') {
    const aStr = String(rawAge).trim();
    const aLower = aStr.toLowerCase();
    if (aLower.includes('15') && (aLower.includes('üzeri') || aLower.includes('uzeri') || aLower.includes('+'))) {
      age = '15+ yaş';
    } else if (aLower.includes('10-15') || aLower.includes('10 - 15')) {
      age = '10-15 yaş';
    } else if (aLower.includes('yaş') || aLower.includes('yas')) {
      age = aStr;
    } else if (!isNaN(Number(aStr))) {
      age = `${aStr} yaş`;
    } else {
      age = `${aStr} yaş`;
    }
  } else if (rawBirthYear && Number(rawBirthYear) > 1990) {
    const calc = new Date().getFullYear() - Number(rawBirthYear);
    age = `${calc} yaş`;
  } else if (rawBirthDate && typeof rawBirthDate === 'string') {
    const yMatch = rawBirthDate.match(/\b(19\d{2}|20\d{2})\b/);
    if (yMatch) {
      const calc = new Date().getFullYear() - Number(yMatch[1]);
      age = `${calc} yaş`;
    }
  } else if (!serviceCategory) {
    const match = title.match(/(\d+\s*(?:-\s*\d+)?|\d+\+?)\s*(?:yaş|yas)\b/i);
    if (match) {
      age = `${match[1].trim()} yaş`;
    }
  }

  // 5. Irk (Breed)
  let breed: string | null = null;
  const rawBreed = getPropValue(rawProps, [
    'HORSE_BREED',
    'horsebreed',
    'horse_breed',
    'irk',
    'ırk',
    'breed',
    'stallionbreed',
    'studbreed',
  ]);

  if (rawBreed != null && String(rawBreed).trim() && String(rawBreed) !== '-') {
    const bStr = String(rawBreed).toLowerCase();
    if (bStr.includes('arap') || bStr.includes('arabian')) {
      breed = 'Arap';
    } else if (bStr.includes('ingiliz') || bStr.includes('thoroughbred')) {
      breed = 'İngiliz';
    } else if (bStr.includes('haflinger')) {
      breed = 'Haflinger';
    } else if (bStr.includes('shetland')) {
      breed = 'Shetland';
    } else if (bStr.includes('warmblood')) {
      breed = 'Warmblood';
    } else if (bStr.includes('pony')) {
      breed = 'Pony';
    } else if (bStr.includes('friesian')) {
      breed = 'Friesian';
    } else {
      // Clean string taking first word (e.g. "Safkan Arap" -> "Arap")
      breed = String(rawBreed).trim().split(/[\s\n]+/)[0];
    }
  } else if (product.brand && product.brand.trim()) {
    const b = product.brand.trim().toLowerCase();
    if (b.includes('arabian') || b.includes('arap')) breed = 'Arap';
    else if (b.includes('thoroughbred') || b.includes('ingiliz')) breed = 'İngiliz';
    else if (b.includes('haflinger')) breed = 'Haflinger';
    else if (b.includes('shetland')) breed = 'Shetland';
    else if (b.includes('warmblood')) breed = 'Warmblood';
    else if (b.includes('friesian')) breed = 'Friesian';
    else breed = product.brand.trim();
  } else if (!serviceCategory) {
    if (
      catId === 'c1000000-0000-4000-8000-000000000031' ||
      catId.includes('arap') ||
      knownCatName.toLowerCase().includes('arap') ||
      titleLower.includes('arap')
    ) {
      breed = 'Arap';
    } else if (
      catId === 'c1000000-0000-4000-8000-000000000032' ||
      catId.includes('ingiliz') ||
      knownCatName.toLowerCase().includes('ingiliz') ||
      titleLower.includes('ingiliz') ||
      titleLower.includes('thoroughbred')
    ) {
      breed = 'İngiliz';
    } else if (titleLower.includes('haflinger')) {
      breed = 'Haflinger';
    } else if (titleLower.includes('shetland')) {
      breed = 'Shetland';
    } else if (catId === 'c1000000-0000-4000-8000-000000000015' || catId.includes('pony') || titleLower.includes('pony')) {
      breed = 'Pony';
    } else if (titleLower.includes('warmblood')) {
      breed = 'Warmblood';
    }
  }

  return {
    province,
    gender,
    age,
    breed,
    serviceCategory,
  };
}

/**
 * React hook: Geo verisi asenkron dolduğunda ili otomatik re-render eder.
 */
export function useListingCardAttributes(
  product?: CatalogProductCard | null
): CardHorseAttributes {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!product) return;

    if (!product.provinceName && product.provinceId) {
      void locationLookup.listDistricts(product.provinceId).catch(() => {});
    }

    if (locationLookup.subscribe) {
      return locationLookup.subscribe(() => {
        setTick((t) => t + 1);
      });
    }
  }, [
    product?.provinceId,
    product?.provinceName,
    product?.districtName,
    product?.locationName,
  ]);

  return getListingCardAttributes(product);
}
