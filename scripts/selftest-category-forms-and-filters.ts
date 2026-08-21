/**
 * Kategori bazlı form alanları ve filtreleme gereksinimleri self-test paketi.
 * Çalıştır: npx tsx scripts/selftest-category-forms-and-filters.ts
 */
import {
  isFarrierListing,
  isHorseListing,
  isPansiyonListing,
  isSaleHorseListing,
  isStudServiceListing,
  isTransportListing,
  detailsErrors,
  detailsStepComplete,
  createEmptyDraft,
  mapDraftToCreateAdvert,
} from '../services/listing';
import {
  matchesDatePeriod,
  matchesPrice,
  parseArrayParam,
  serializeArrayParam,
  PERIOD_OPTIONS,
} from '../components/listings/filterConfig';
import type { ListingDraft } from '../types/listing';

let passed = 0;
let failed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
}

function createBaseValidDraft(): ListingDraft {
  const d = createEmptyDraft();
  d.details.title = 'Test Başlığı';
  d.details.priceTl = '50000';
  d.details.provinceId = 'prov-34';
  d.details.districtId = 'dist-34-sil';
  d.details.address = 'Silivri Çiftlik Mah. No: 12';
  d.details.sellerPhone = '5321112233';
  d.media = [
    {
      localId: 'm1',
      uri: 'file://img1.jpg',
      mimeType: 'image/jpeg',
      fileName: 'img1.jpg',
      isCover: true,
      assetId: null,
    },
  ];
  return d;
}

// -------------------------------------------------------------
// 1. Kategori Tanımlama ve Ayırma Testleri (SOLID / SRP)
// -------------------------------------------------------------
console.log('\n--- 1. Kategori Tanımlama Testleri ---');

const pansiyonType = {
  categoryId: 'cat-pansiyon',
  categorySlug: 'pansiyon-haralar',
  categoryName: 'Pansiyon Haralar',
  parentSlug: 'at-hizmetleri',
};
assert(isPansiyonListing(pansiyonType), 'Pansiyon Haralar kategorisi tanındı');
assert(!isTransportListing(pansiyonType), 'Pansiyon Haralar nakliye değildir');
assert(!isStudServiceListing(pansiyonType), 'Pansiyon Haralar aşım değildir');

const transportType = {
  categoryId: 'cat-nakliye',
  categorySlug: 'at-nakliyesi',
  categoryName: 'At Nakliyesi',
  parentSlug: 'at-hizmetleri',
};
assert(isTransportListing(transportType), 'At Nakliyesi kategorisi tanındı');
assert(!isPansiyonListing(transportType), 'At Nakliyesi pansiyon değildir');

const farrierType = {
  categoryId: 'cat-nalbant',
  categorySlug: 'nalbantlar',
  categoryName: 'Nalbantlar',
  parentSlug: 'at-hizmetleri',
};
assert(isFarrierListing(farrierType), 'Nalbantlar kategorisi tanındı');

const studType = {
  categoryId: 'cat-arap-aygir',
  categorySlug: 'arap-aygir',
  categoryName: 'Arap Aygır',
  parentSlug: 'asim-hizmetleri',
};
assert(isStudServiceListing(studType), 'Aşım Hizmetleri kategorisi tanındı');
assert(isHorseListing(studType), 'Aşım Hizmetleri horseListing kapsamında');
assert(!isSaleHorseListing(studType), 'Aşım Hizmetleri satılık at değildir');

const saleHorseType = {
  categoryId: 'cat-yaris-ati',
  categorySlug: 'satilik-yaris-ati',
  categoryName: 'Satılık Yarış Atı',
  parentSlug: 'satilik-atlar',
};
assert(isSaleHorseListing(saleHorseType), 'Satılık Yarış Atı satılık at olarak tanındı');

// -------------------------------------------------------------
// 2. İlan Form Alanları Karşılaştırma Matrisi Doğrulamaları
// -------------------------------------------------------------
console.log('\n--- 2. İlan Form Alanları ve Doğrulama Testleri ---');

// A. Pansiyon Haralar Formu
const draftPansiyon = createBaseValidDraft();
draftPansiyon.type = pansiyonType;
draftPansiyon.details.facilityGrassPaddock = true;
draftPansiyon.details.facilityVeterinarian = true;
draftPansiyon.details.facilityTrainingTrack = '1200m Kum Pist';

assert(detailsStepComplete(draftPansiyon), 'Pansiyon Haralar formu geçerli');
const reqPansiyon = mapDraftToCreateAdvert(draftPansiyon);
assertEqual(reqPansiyon.categoryId, 'cat-pansiyon', 'Pansiyon categoryId aktarıldı');
assert(reqPansiyon.properties?.facilityGrassPaddock === true, 'Çim padok property aktarıldı');
assert(reqPansiyon.properties?.facilityVeterinarian === true, 'Veteriner property aktarıldı');
assertEqual(reqPansiyon.properties?.facilityTrainingTrack, '1200m Kum Pist', 'İdman pisti property aktarıldı');

// B. At Nakliyesi Formu
const draftTransport = createBaseValidDraft();
draftTransport.type = transportType;
draftTransport.details.companyName = 'Lider At Taşımacılık';
draftTransport.details.websiteUrl = 'https://www.lidernakliyat.com';

assert(detailsStepComplete(draftTransport), 'At Nakliyesi formu geçerli');
const reqTransport = mapDraftToCreateAdvert(draftTransport);
assertEqual(reqTransport.properties?.companyName, 'Lider At Taşımacılık', 'Firma adı property aktarıldı');
assertEqual(reqTransport.properties?.websiteUrl, 'https://www.lidernakliyat.com', 'Web sitesi property aktarıldı');

// C. Nalbantlar Formu
const draftFarrier = createBaseValidDraft();
draftFarrier.type = farrierType;
assert(detailsStepComplete(draftFarrier), 'Nalbantlar standart formu geçerli');

// D. Aşım Hizmetleri Formu
const draftStud = createBaseValidDraft();
draftStud.type = studType;
draftStud.details.studHorseName = 'Rüzgarın Oğlu';
draftStud.details.studBreed = 'Arap';
draftStud.details.studAge = '7';
draftStud.details.studCoatColor = 'Al';
draftStud.details.studSire = 'Özgünhan';
draftStud.details.studDam = 'Kemiyetülırak.55';
draftStud.details.studDamsire = 'Havuçerol';

assert(detailsStepComplete(draftStud), 'Aşım Hizmetleri formu geçerli');
const reqStud = mapDraftToCreateAdvert(draftStud);
assertEqual(reqStud.properties?.studHorseName, 'Rüzgarın Oğlu', 'Aygır adı aktarıldı');
assertEqual(reqStud.properties?.studBreed, 'Arap', 'Aygır ırkı aktarıldı');
assertEqual(reqStud.properties?.studCoatColor, 'Al', 'Aygır donu aktarıldı');
assertEqual(reqStud.properties?.studSire, 'Özgünhan', 'Baba adı aktarıldı');
assertEqual(reqStud.properties?.studDam, 'Kemiyetülırak.55', 'Anne adı aktarıldı');
assertEqual(reqStud.properties?.studDamsire, 'Havuçerol', 'Annesinin babası aktarıldı');

// Aşım Hizmetlerinde aygır adı eksikse hata vermeli
const invalidStud = createBaseValidDraft();
invalidStud.type = studType;
invalidStud.details.registeredName = '';
invalidStud.details.studHorseName = '';
assert(Boolean(detailsErrors(invalidStud).registeredName), 'Aşım hizmetinde aygır adı zorunludur');

// -------------------------------------------------------------
// 3. Kategori Filtre Gereksinimleri Testleri
// -------------------------------------------------------------
console.log('\n--- 3. Kategori Filtreleme Testleri ---');

// A. İlan Tarihi (Periyot) Testleri
const now = new Date();
const h12Ago = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
const d2Ago = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
const d5Ago = new Date(now.getTime() - 120 * 3600 * 1000).toISOString();
const d40Ago = new Date(now.getTime() - 960 * 3600 * 1000).toISOString();

assert(matchesDatePeriod(h12Ago, '24h'), '12 saat önceki ilan Son 24 saat içinde');
assert(!matchesDatePeriod(d2Ago, '24h'), '2 gün önceki ilan Son 24 saat içinde değil');
assert(matchesDatePeriod(d2Ago, '3d'), '2 gün önceki ilan Son 3 gün içinde');
assert(!matchesDatePeriod(d5Ago, '3d'), '5 gün önceki ilan Son 3 gün içinde değil');
assert(matchesDatePeriod(d5Ago, '7d'), '5 gün önceki ilan Son 7 gün içinde');
assert(matchesDatePeriod(d5Ago, '30d'), '5 gün önceki ilan Son 30 gün içinde');
assert(!matchesDatePeriod(d40Ago, '30d'), '40 gün önceki ilan Son 30 gün içinde değil');

// B. Fiyat Karşılaştırma Testleri
const priceMinor = 15000000; // 150.000 TL
assert(matchesPrice(priceMinor, 100000, 200000), '150.000 TL 100.000 - 200.000 TL aralığında');
assert(!matchesPrice(priceMinor, 160000, 200000), '150.000 TL min 160.000 TL altında');
assert(!matchesPrice(priceMinor, 50000, 120000), '150.000 TL max 120.000 TL üstünde');

// C. Çoklu Filtre Dizi Ayrıştırma & Serileştirme
const parsedBreeds = parseArrayParam('Arap, İngiliz');
assertEqual(parsedBreeds.length, 2, 'Çoklu ırk dizisi 2 eleman');
assertEqual(parsedBreeds[0], 'Arap', 'İlk ırk Arap');
assertEqual(serializeArrayParam(['Doru', 'Al', 'Kır']), 'Doru,Al,Kır', 'Don serileştirme');

console.log(`\n========================================`);
console.log(`Sonuç: ${passed} test geçti, ${failed} test başarısız`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
