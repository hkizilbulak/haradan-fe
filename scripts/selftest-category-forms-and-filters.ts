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
  buildDraftProperties,
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
const propsPansiyon = buildDraftProperties(draftPansiyon);
assert(propsPansiyon.facilityGrassPaddock === true, 'Çim padok property aktarıldı');
assert(propsPansiyon.facilityVeterinarian === true, 'Veteriner property aktarıldı');
assertEqual(propsPansiyon.facilityTrainingTrack, '1200m Kum Pist', 'İdman pisti property aktarıldı');

// B. At Nakliyesi Formu
const draftTransport = createBaseValidDraft();
draftTransport.type = transportType;
draftTransport.details.companyName = 'Lider At Taşımacılık';
draftTransport.details.websiteUrl = 'https://www.lidernakliyat.com';

assert(detailsStepComplete(draftTransport), 'At Nakliyesi formu geçerli');
const reqTransport = mapDraftToCreateAdvert(draftTransport);
assertEqual(reqTransport.categoryId, 'cat-nakliye', 'Nakliye categoryId aktarıldı');
const propsTransport = buildDraftProperties(draftTransport);
assertEqual(propsTransport.companyName, 'Lider At Taşımacılık', 'Firma adı property aktarıldı');
assertEqual(propsTransport.websiteUrl, 'https://www.lidernakliyat.com', 'Web sitesi property aktarıldı');

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
assertEqual(reqStud.categoryId, 'cat-arap-aygir', 'Aşım categoryId aktarıldı');
const propsStud = buildDraftProperties(draftStud);
assertEqual(propsStud.studHorseName, 'Rüzgarın Oğlu', 'Aygır adı aktarıldı');
assertEqual(propsStud.studBreed, 'Arap', 'Aygır ırkı aktarıldı');
assertEqual(propsStud.studCoatColor, 'Al', 'Aygır donu aktarıldı');
assertEqual(propsStud.studSire, 'Özgünhan', 'Baba adı aktarıldı');
assertEqual(propsStud.studDam, 'Kemiyetülırak.55', 'Anne adı aktarıldı');
assertEqual(propsStud.studDamsire, 'Havuçerol', 'Annesinin babası aktarıldı');

// Zorunlu alan testleri
// 1. Pansiyon tesis seçilmezse hata vermeli
const emptyPansiyon = createBaseValidDraft();
emptyPansiyon.type = pansiyonType;
assert(Boolean(detailsErrors(emptyPansiyon).facility), 'Pansiyonda en az 1 tesis seçilmelidir');

// 2. Nakliyede firma adı boşsa hata vermeli
const emptyTransport = createBaseValidDraft();
emptyTransport.type = transportType;
assert(Boolean(detailsErrors(emptyTransport).companyName), 'Nakliyede firma adı zorunludur');

// 3. Aşım Hizmetlerinde eksik alanlar hata vermeli
const invalidStud = createBaseValidDraft();
invalidStud.type = studType;
const studErrs = detailsErrors(invalidStud);
assert(Boolean(studErrs.studHorseName), 'Aşımda aygır adı zorunludur');
assert(Boolean(studErrs.studBreed), 'Aşımda at ırkı zorunludur');
assert(Boolean(studErrs.studAge), 'Aşımda yaş zorunludur');
assert(Boolean(studErrs.studCoatColor), 'Aşımda don seçimi zorunludur');
assert(Boolean(studErrs.studSire), 'Aşımda baba (Sire) zorunludur');
assert(Boolean(studErrs.studDam), 'Aşımda anne (Dam) zorunludur');
assert(Boolean(studErrs.studDamsire), 'Aşımda annesinin babası zorunludur');

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

// D. Filtre Kenar Çubuğu Kategori İzolasyon Testleri
import {
  isHorseCategory,
  isPansiyonCategory,
  isTransportCategory,
  isFarrierCategory,
  isStudCategory,
} from '../components/listings/filterConfig';

assert(isHorseCategory('satilik-atlar'), 'satilik-atlar Satılık At kategorisi olarak algılandı');
assert(isHorseCategory('satilik-yaris-ati'), 'satilik-yaris-ati Satılık At kategorisi olarak algılandı');
assert(isHorseCategory('satilik-binek-ati'), 'satilik-binek-ati Satılık At kategorisi olarak algılandı');
assert(isHorseCategory('satilik-pony'), 'satilik-pony Satılık At kategorisi olarak algılandı');
assert(isHorseCategory('satilik-kisrak'), 'satilik-kisrak Satılık At kategorisi olarak algılandı');
assert(isHorseCategory('satilik-aygir'), 'satilik-aygir Satılık At kategorisi olarak algılandı');
assert(!isHorseCategory('at-nakliyesi'), 'at-nakliyesi Satılık At kategorisi değildir');
assert(!isHorseCategory('pansiyon-haralar'), 'pansiyon-haralar Satılık At kategorisi değildir');
assert(!isHorseCategory('nalbantlar'), 'nalbantlar Satılık At kategorisi değildir');

assert(isTransportCategory('at-nakliyesi'), 'at-nakliyesi Nakliye kategorisi olarak algılandı');
assert(!isTransportCategory('satilik-atlar'), 'satilik-atlar Nakliye kategorisi değildir');

assert(isPansiyonCategory('pansiyon-haralar'), 'pansiyon-haralar Pansiyon kategorisi olarak algılandı');
assert(!isPansiyonCategory('at-nakliyesi'), 'at-nakliyesi Pansiyon kategorisi değildir');

assert(isFarrierCategory('nalbantlar'), 'nalbantlar Nalbant kategorisi olarak algılandı');
assert(!isFarrierCategory('satilik-atlar'), 'satilik-atlar Nalbant kategorisi değildir');

assert(isStudCategory('asim-hizmetleri'), 'asim-hizmetleri Aşım kategorisi olarak algılandı');
assert(isStudCategory('arap-aygir'), 'arap-aygir Aşım kategorisi olarak algılandı');
assert(!isStudCategory('at-nakliyesi'), 'at-nakliyesi Aşım kategorisi değildir');

console.log(`\n========================================`);
console.log(`Sonuç: ${passed} test geçti, ${failed} test başarısız`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
