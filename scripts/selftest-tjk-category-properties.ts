import assert from 'node:assert';
import {
  isTjkEligibleListing,
  isHorseListing,
  isSaleHorseListing,
  isStudServiceListing,
} from '../services/listing/validateListingDraft';
import { applyTjkProfile } from '../hooks/useListingWizard';
import { buildDraftProperties } from '../services/listing/mapDraftToRequest';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
import type { TjkHorseProfile } from '../types/listing';

console.log('--- 1. TJK Kategori Uygunluk (Eligibility) Testleri ---');

const yarisAti = { categoryId: 'cat-1', categorySlug: 'satilik-yaris-ati', parentSlug: 'satilik-atlar', categoryName: 'Yarış Atı' };
const kisrak = { categoryId: 'cat-2', categorySlug: 'satilik-kisrak', parentSlug: 'satilik-atlar', categoryName: 'Kısrak' };
const aygir = { categoryId: 'cat-3', categorySlug: 'satilik-aygir', parentSlug: 'satilik-atlar', categoryName: 'Aygır' };
const binekAti = { categoryId: 'cat-4', categorySlug: 'satilik-binek-ati', parentSlug: 'satilik-atlar', categoryName: 'Binek Atı' };
const pony = { categoryId: 'cat-5', categorySlug: 'satilik-pony', parentSlug: 'satilik-atlar', categoryName: 'Pony' };
const arapAygir = { categoryId: 'cat-6', categorySlug: 'arap-aygir', parentSlug: 'asim-hizmetleri', categoryName: 'Arap Aygır' };
const ingilizAygir = { categoryId: 'cat-7', categorySlug: 'ingiliz-aygir', parentSlug: 'asim-hizmetleri', categoryName: 'İngiliz Aygır' };
const pansiyon = { categoryId: 'cat-8', categorySlug: 'pansiyon-haralar', parentSlug: 'at-hizmetleri', categoryName: 'Pansiyon' };
const nakliye = { categoryId: 'cat-9', categorySlug: 'at-nakliyesi', parentSlug: 'at-hizmetleri', categoryName: 'Nakliye' };

// TJK'da kaydı olan kategoriler
assert(isTjkEligibleListing(yarisAti), 'Satılık Yarış Atı TJK uyumlu');
assert(isTjkEligibleListing(kisrak), 'Satılık Kısrak TJK uyumlu');
assert(isTjkEligibleListing(aygir), 'Satılık Aygır TJK uyumlu');
assert(isTjkEligibleListing(arapAygir), 'Arap Aygır (Aşım) TJK uyumlu');
assert(isTjkEligibleListing(ingilizAygir), 'İngiliz Aygır (Aşım) TJK uyumlu');

// Kullanıcının özel isteği: Binek atı ve pony TJK'da olmaz, çıkarıldı!
assert(!isTjkEligibleListing(binekAti), 'Satılık Binek Atı TJK sorgusu ALMAZ (TJK dışı)');
assert(!isTjkEligibleListing(pony), 'Satılık Pony TJK sorgusu ALMAZ (TJK dışı)');

// Diğer hizmetler TJK almaz
assert(!isTjkEligibleListing(pansiyon), 'Pansiyon TJK uyumlu değildir');
assert(!isTjkEligibleListing(nakliye), 'Nakliye TJK uyumlu değildir');
assert(!isTjkEligibleListing(null), 'Null tip TJK uyumlu değildir');

console.log('Tüm kategori uygunluk kontrolleri başarılı!');

console.log('\n--- 2. TJK Profil Verisi Besleme (applyTjkProfile) Testleri ---');

const mockHorse: TjkHorseProfile = {
  horseId: 'h-12345',
  tjkNumber: '85948',
  registeredName: 'BOLD PILOT',
  birthYear: 2020,
  birthDate: '2020-04-15',
  age: 4,
  gender: 'Erkek',
  breed: 'İngiliz (Thoroughbred)',
  coatColor: 'Doru',
  heightCm: 165,
  sire: 'PERSIAN BOLD',
  dam: 'ROSA BLANCHE',
  damsire: 'BALIDAR',
  owners: ['Özdemir Atman'],
  breeder: 'Atman Ekürisi',
  trainer: 'Kemal Sağlam',
  handicap: null,
};

const draft = createEmptyDraft();
const updatedDetails = applyTjkProfile(draft.details, mockHorse);

// Top level alan kontrolleri
assert.strictEqual(updatedDetails.registeredName, 'BOLD PILOT', 'Kayıtlı ad aktarıldı');
assert.strictEqual(updatedDetails.studHorseName, 'BOLD PILOT', 'Aşım aygır adı aktarıldı');
assert.strictEqual(updatedDetails.sire, 'PERSIAN BOLD', 'Baba aktarıldı');
assert.strictEqual(updatedDetails.studSire, 'PERSIAN BOLD', 'Aşım babası aktarıldı');
assert.strictEqual(updatedDetails.dam, 'ROSA BLANCHE', 'Anne aktarıldı');
assert.strictEqual(updatedDetails.studDam, 'ROSA BLANCHE', 'Aşım annesi aktarıldı');
assert.strictEqual(updatedDetails.damsire, 'BALIDAR', 'Damsire aktarıldı');
assert.strictEqual(updatedDetails.studDamsire, 'BALIDAR', 'Aşım damsire aktarıldı');
assert.strictEqual(updatedDetails.tjkNumber, '85948', 'TJK no aktarıldı');
assert.strictEqual(updatedDetails.horseId, 'h-12345', 'Horse ID aktarıldı');
assert.strictEqual(updatedDetails.breeder, 'Atman Ekürisi', 'Yetiştirici aktarıldı');
assert.strictEqual(updatedDetails.trainer, 'Kemal Sağlam', 'Antrenör aktarıldı');

// Dinamik property (properties) kontrolleri
const props = updatedDetails.properties || {};
assert.strictEqual(props.HORSE_BREED, 'İngiliz (Thoroughbred)', 'HORSE_BREED property aktarıldı');
assert.strictEqual(props.STALLION_BREED, 'İngiliz', 'STALLION_BREED property aktarıldı');
assert.strictEqual(props.COAT_COLOR, 'Doru', 'COAT_COLOR property aktarıldı');
assert.strictEqual(props.HORSE_AGE, '4 Yaş', 'HORSE_AGE property aktarıldı');
assert.strictEqual(props.STALLION_AGE, '4', 'STALLION_AGE property aktarıldı');
assert.strictEqual(props.HORSE_GENDER, 'Erkek', 'HORSE_GENDER property aktarıldı');
assert.strictEqual(props.SIRE, 'PERSIAN BOLD', 'SIRE property aktarıldı');
assert.strictEqual(props.DAM, 'ROSA BLANCHE', 'DAM property aktarıldı');
assert.strictEqual(props.DAMSIRE, 'BALIDAR', 'DAMSIRE property aktarıldı');
assert.strictEqual(props.studSire, 'PERSIAN BOLD', 'studSire property aktarıldı');
assert.strictEqual(props.studDam, 'ROSA BLANCHE', 'studDam property aktarıldı');
assert.strictEqual(props.studDamsire, 'BALIDAR', 'studDamsire property aktarıldı');
assert.strictEqual(props.studHorseName, 'BOLD PILOT', 'studHorseName property aktarıldı');
assert.strictEqual(props.REGISTERED_NAME, 'BOLD PILOT', 'REGISTERED_NAME property aktarıldı');
assert.strictEqual(props.TJK_NUMBER, '85948', 'TJK_NUMBER property aktarıldı');
assert.strictEqual(props.BIRTH_DATE, '2020-04-15', 'BIRTH_DATE property aktarıldı');
assert.strictEqual(props.HEIGHT_CM, 165, 'HEIGHT_CM property aktarıldı');
assert.strictEqual(props.BREEDER, 'Atman Ekürisi', 'BREEDER property aktarıldı');
assert.strictEqual(props.TRAINER, 'Kemal Sağlam', 'TRAINER property aktarıldı');
assert.strictEqual(props.OWNER, 'Özdemir Atman', 'OWNER property aktarıldı');

console.log('Tüm TJK profil alanları ve dinamik property beslemeleri başarılı!');

console.log('\n--- 3. buildDraftProperties İstek Dönüşümü Testleri ---');

draft.details = updatedDetails;
const builtProps = buildDraftProperties(draft);

assert.strictEqual(builtProps.SIRE, 'PERSIAN BOLD', 'buildDraftProperties SIRE aktardı');
assert.strictEqual(builtProps.DAM, 'ROSA BLANCHE', 'buildDraftProperties DAM aktardı');
assert.strictEqual(builtProps.DAMSIRE, 'BALIDAR', 'buildDraftProperties DAMSIRE aktardı');
assert.strictEqual(builtProps.TJK_NUMBER, '85948', 'buildDraftProperties TJK_NUMBER aktardı');
assert.strictEqual(builtProps.REGISTERED_NAME, 'BOLD PILOT', 'buildDraftProperties REGISTERED_NAME aktardı');
assert.strictEqual(builtProps.COAT_COLOR, 'Doru', 'buildDraftProperties COAT_COLOR aktardı');
assert.strictEqual(builtProps.HORSE_BREED, 'İngiliz (Thoroughbred)', 'buildDraftProperties HORSE_BREED aktardı');
assert.strictEqual(builtProps.STALLION_BREED, 'İngiliz', 'buildDraftProperties STALLION_BREED aktardı');

console.log('buildDraftProperties dönüşümü başarılı!');
console.log('\n✅ BÜTÜN TESTLER BAŞARIYLA GEÇTİ!');
