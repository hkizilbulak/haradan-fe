/**
 * Kategori bazlı form alanları ve filtreleme gereksinimleri self-test paketi.
 * Çalıştır: node --experimental-strip-types scripts/selftest-category-forms-and-filters.ts
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
} from '../services/listing/validateListingDraft';
import {
  mapDraftToCreateAdvert,
  buildDraftProperties,
} from '../services/listing/mapDraftToRequest';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
import {
  matchesDatePeriod,
  matchesPrice,
  parseArrayParam,
  serializeArrayParam,
  PERIOD_OPTIONS,
  PANSIYON_FACILITY_OPTIONS,
  STUD_BREED_OPTIONS,
  STUD_AGE_OPTIONS,
  COAT_COLOR_OPTIONS,
  isHorseCategory,
  isPansiyonCategory,
  isTransportCategory,
  isFarrierCategory,
  isStudCategory,
  matchHorseGender,
  matchHorseBreed,
  matchHorseAge,
  matchHorseColor,
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
  assert(
    actual === expected,
    `${name} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`
  );
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

// A. Pansiyon Haralar Formu (Fotoğraf, Başlık*, Fiyat*, Açıklama, Adres*, Tesis Özellikleri, İdman Pisti)
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

// B. At Nakliyesi Formu (Fotoğraf, Başlık*, Firma Adı*, Web Sitesi, Fiyat*, Açıklama, Adres*)
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

// C. Nalbantlar Formu (Fotoğraf, Başlık*, Fiyat*, Açıklama, Adres*)
const draftFarrier = createBaseValidDraft();
draftFarrier.type = farrierType;
assert(detailsStepComplete(draftFarrier), 'Nalbantlar standart formu geçerli');

// D. Aşım Hizmetleri Formu (Fotoğraf, Başlık*, Soy Kütüğü: At*, Baba*, Anne*, Annesinin Babası*, At Bilgileri: Irk*, Yaş*, Don*, Fiyat*, Açıklama, Adres*)
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
// 3. Kategori Filtre Gereksinimleri ve Seçenekleri Testleri
// -------------------------------------------------------------
console.log('\n--- 3. Kategori Filtreleme Testleri ---');

// A. Pansiyon Haralar Filtreleri (6 Tesis Özelliği: Çim Padok, Kum Padok, Aygır Padoğu, Veteriner, Nalbant, Doğumhane)
assertEqual(PANSIYON_FACILITY_OPTIONS.length, 6, 'Pansiyon filtrelerinde tam 6 tesis switch seçeneği mevcut');
assertEqual(PANSIYON_FACILITY_OPTIONS[0].label, 'Çim Padok', '1. Tesis: Çim Padok');
assertEqual(PANSIYON_FACILITY_OPTIONS[1].label, 'Kum Padok', '2. Tesis: Kum Padok');
assertEqual(PANSIYON_FACILITY_OPTIONS[2].label, 'Aygır Padoğu', '3. Tesis: Aygır Padoğu');
assertEqual(PANSIYON_FACILITY_OPTIONS[3].label, 'Veteriner', '4. Tesis: Veteriner');
assertEqual(PANSIYON_FACILITY_OPTIONS[4].label, 'Nalbant', '5. Tesis: Nalbant');
assertEqual(PANSIYON_FACILITY_OPTIONS[5].label, 'Doğumhane', '6. Tesis: Doğumhane');

// B. Aşım Hizmetleri Filtreleri (At Irkı: Arap, İngiliz; Yaş: 0, 1, 1.5, 2, 3, 4, 5+; Don: Doru, Al, Kır, Beyaz, Yağız, Kula, Boz)
assertEqual(STUD_BREED_OPTIONS.length, 2, 'Aşım ırk filtreleri 2 seçenek');
assertEqual(STUD_BREED_OPTIONS[0], 'Arap', 'Aşım ırkı: Arap');
assertEqual(STUD_BREED_OPTIONS[1], 'İngiliz', 'Aşım ırkı: İngiliz');

assertEqual(STUD_AGE_OPTIONS.join(','), '0,1,1.5,2,3,4,5+', 'Aşım yaş filtreleri spesifikasyona birebir uygun (0, 1, 1.5, 2, 3, 4, 5+)');

assertEqual(COAT_COLOR_OPTIONS.join(','), 'Doru,Al,Kır,Beyaz,Yağız,Kula,Boz', 'Don (renk) seçenekleri spesifikasyona uygun');

// C. İlan Tarihi (Periyot) Testleri (Son 24 saat, Son 3 gün, Son 7 gün, Son 30 gün)
assertEqual(PERIOD_OPTIONS.length, 4, 'İlan tarihi 4 periyot seçeneği içerir');
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

// D. Fiyat Karşılaştırma Testleri
const priceMinor = 15000000; // 150.000 TL
assert(matchesPrice(priceMinor, 100000, 200000), '150.000 TL 100.000 - 200.000 TL aralığında');
assert(!matchesPrice(priceMinor, 160000, 200000), '150.000 TL min 160.000 TL altında');
assert(!matchesPrice(priceMinor, 50000, 120000), '150.000 TL max 120.000 TL üstünde');

// E. Çoklu Filtre Dizi Ayrıştırma & Serileştirme
const parsedBreeds = parseArrayParam('Arap, İngiliz');
assertEqual(parsedBreeds.length, 2, 'Çoklu ırk dizisi 2 eleman');
assertEqual(parsedBreeds[0], 'Arap', 'İlk ırk Arap');
assertEqual(serializeArrayParam(['Doru', 'Al', 'Kır']), 'Doru,Al,Kır', 'Don serileştirme');

// F. Filtre Kenar Çubuğu Kategori İzolasyon Testleri
assert(isHorseCategory('satilik-atlar'), 'satilik-atlar Satılık At kategorisi olarak algılandı');
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
// G. Satılık Atlar & Aşım Cinsiyet, Irk, Yaş, Don Eşleştirme Testleri
console.log('\n--- 4. At Filtre Eşleştirme Testleri (Cinsiyet, Irk, Yaş, Don) ---');

const cardMaleRaceHorse = {
  title: '3 yaş İngiliz yarış aygırı — Veliefendi hazır',
  brand: 'Thoroughbred',
  categoryId: 'cat-yaris-ati',
};
const cardFemaleArabMare = {
  title: 'Safkan Arap kısrak, 5 yaş — doğum belgesi tam',
  brand: 'Arabian',
  categoryId: 'cat-kisrak',
};
const cardPonyGelding = {
  title: 'Pony Shetland, 4 yaş — çocuk biniciliği',
  brand: 'Shetland',
  categoryId: 'cat-pony',
};
const cardArabStud = {
  title: 'Arap aygır aşım — 2026 sezonu rezervasyon',
  brand: 'Arabian',
  categoryId: 'cat-arap-aygir',
};
const cardWarmbloodHorse = {
  title: 'Dressaj Warmblood, 9 yaş — orta seviye',
  brand: 'Warmblood',
  categoryId: 'cat-binek',
};

// Cinsiyet Testleri
assert(matchHorseGender(cardMaleRaceHorse, ['Erkek']), 'Yarış aygırı Erkek filtresiyle eşleşti');
assert(!matchHorseGender(cardMaleRaceHorse, ['Dişi']), 'Yarış aygırı Dişi filtresiyle eşleşmedi');
assert(matchHorseGender(cardFemaleArabMare, ['Dişi']), 'Arap kısrak Dişi filtresiyle eşleşti');
assert(!matchHorseGender(cardFemaleArabMare, ['Erkek']), 'Arap kısrak Erkek filtresiyle eşleşmedi');
assert(matchHorseGender(cardPonyGelding, ['İğdiş']), 'Pony İğdiş filtresiyle eşleşti');
assert(matchHorseGender(cardArabStud, ['Erkek']), 'Aşım aygırı Erkek filtresiyle eşleşti');

// Irk Testleri
assert(matchHorseBreed(cardMaleRaceHorse, ['İngiliz (Thoroughbred)']), 'İngiliz yarış aygırı İngiliz (Thoroughbred) filtresiyle eşleşti');
assert(matchHorseBreed(cardFemaleArabMare, ['Safkan Arap']), 'Arap kısrak Safkan Arap filtresiyle eşleşti');
assert(matchHorseBreed(cardWarmbloodHorse, ['Warmblood / Spor Atı']), 'Warmblood atı Warmblood / Spor Atı filtresiyle eşleşti');
assert(matchHorseBreed(cardPonyGelding, ['Pony / Midilli']), 'Shetland pony Pony / Midilli filtresiyle eşleşti');
assert(!matchHorseBreed(cardMaleRaceHorse, ['Safkan Arap']), 'İngiliz atı Arap filtresiyle eşleşmedi');

// Yaş Testleri
assert(matchHorseAge(cardMaleRaceHorse, ['3 Yaş']), '3 yaş at 3 Yaş filtresiyle eşleşti');
assert(matchHorseAge(cardFemaleArabMare, ['5+ Yaş']), '5 yaş kısrak 5+ Yaş filtresiyle eşleşti');
assert(matchHorseAge(cardPonyGelding, ['4 Yaş']), '4 yaş pony 4 Yaş filtresiyle eşleşti');
assert(matchHorseAge({ title: '6 aylık tay' }, ['Tay (0-1 Yaş)']), 'Tay Tay (0-1 Yaş) filtresiyle eşleşti');
assert(!matchHorseAge(cardMaleRaceHorse, ['5+ Yaş']), '3 yaş at 5+ Yaş filtresiyle eşleşmedi');

// Don / Renk Testleri
assert(matchHorseColor({ title: 'Doru tay satılık' }, ['Doru']), 'Doru don eşleşti');
assert(matchHorseColor({ title: 'Al kısrak 3 yaş' }, ['Al']), 'Al don eşleşti');
assert(matchHorseColor({ title: 'Kır aygır' }, ['Kır']), 'Kır don eşleşti');
assert(!matchHorseColor({ title: 'Doru tay' }, ['Kır']), 'Doru tay Kır ile eşleşmedi');

console.log(`\nÖzet: ${passed} geçti, ${failed} kaldı.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('Tüm kategori form ve filtre self-testleri başarıyla geçti!');
}
