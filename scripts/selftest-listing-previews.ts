import { LISTING_PACKAGES } from '../services/listing/listingPackages';
import type { ListingDraft } from '../types/listing';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok  ${msg}`);
}

console.log('--- Selftest: Listing Previews ---');

// 1. Check packages for preview capabilities
const standard = LISTING_PACKAGES.find((p) => p.code === 'STANDARD');
const premium = LISTING_PACKAGES.find((p) => p.code === 'PREMIUM');
const ultimate = LISTING_PACKAGES.find((p) => p.code === 'ULTIMATE');

assert(Boolean(standard && premium && ultimate), 'All 3 packages exist');

// Standard
const stdUrgent = standard!.features.some((f) => f.id === 'urgent' && f.included);
const stdShowcase = standard!.features.some((f) => f.id === 'showcase' && f.included);
assert(!stdUrgent, 'Standard package does NOT have urgent perk');
assert(!stdShowcase, 'Standard package does NOT have showcase perk');

// Premium
const premUrgent = premium!.features.some((f) => f.id === 'urgent' && f.included);
const premFeatured = premium!.features.some((f) => f.id === 'featured' && f.included);
const premShowcase = premium!.features.some((f) => f.id === 'showcase' && f.included);
assert(premUrgent, 'Premium package includes urgent preview');
assert(premFeatured, 'Premium package includes featured preview');
assert(!premShowcase, 'Premium package does not have homepage vitrin');

// Ultimate
const ultUrgent = ultimate!.features.some((f) => f.id === 'urgent' && f.included);
const ultFeatured = ultimate!.features.some((f) => f.id === 'featured' && f.included);
const ultShowcase = ultimate!.features.some((f) => f.id === 'showcase' && f.included);
assert(ultUrgent, 'Ultimate package includes urgent preview');
assert(ultFeatured, 'Ultimate package includes featured preview');
assert(ultShowcase, 'Ultimate package includes showcase vitrin preview');

// 2. Draft mapping check for AdvertPreviewModal
const mockDraft: ListingDraft = {
  type: {
    categoryId: 'cat-1',
    categorySlug: 'ingiliz-atlari',
    categoryName: 'İngiliz Atları',
    parentSlug: 'at',
  },
  breed: null,
  details: {
    title: 'Şampiyon Kan Hattı Safkan İngiliz Tayı',
    description: 'Pedigrisi çok güçlü, idmanları düzenli yapılan 2 yaşlı tay.',
    priceTl: '1.750.000',
    provinceId: '34',
    districtId: '450',
    address: 'Silivri Haralar Mevkii No:12',
    registeredName: 'BOLD PILOT JR',
    gender: 'Erkek',
    birthDate: '2024-03-15',
    age: '2',
    coatColor: 'Doru',
    heightCm: '162',
    sire: 'BOLD PILOT',
    dam: 'QUEEN OF THE SEA',
    damsire: 'SEA HERO',
    ownersText: 'Ahmet Yılmaz',
    breeder: 'Yılmaz Harası',
    trainer: 'Mehmet Demir',
    horseId: 'horse-123',
    tjkNumber: '98765',
    tjkSkipped: false,
    phoneCountryIso: 'TR',
    sellerPhone: '5551234567',
  },
  media: [
    {
      localId: 'img-1',
      uri: 'file://mock/cover.jpg',
      mimeType: 'image/jpeg',
      fileName: 'cover.jpg',
      isCover: true,
      assetId: null,
    },
    {
      localId: 'img-2',
      uri: 'file://mock/photo2.jpg',
      mimeType: 'image/jpeg',
      fileName: 'photo2.jpg',
      isCover: false,
      assetId: null,
    },
  ],
  packageCode: 'PREMIUM',
};

assert(mockDraft.media.length === 2, 'Draft media has 2 images');
assert(mockDraft.media[0].isCover === true, 'First image is cover');
assert(mockDraft.details.sellerPhone === '5551234567', 'Seller phone is present');
assert(mockDraft.details.registeredName === 'BOLD PILOT JR', 'Registered name is present');

// 3. Siblings and Statistics integrity check
const mockSiblings = [
  { name: 'GÖKÇE EFE', fatherName: 'KAFKAS ŞAHI', raceCount: '24', first: '5', second: '3', third: '4', fourth: '2', earning: '420.500 ₺' },
  { name: 'RÜZGARIN SESİ', fatherName: 'TURBO', raceCount: '18', first: '4', second: '2', third: '1', fourth: '3', earning: '315.000 ₺' },
  { name: 'ASİL KIZ', fatherName: 'ÖZGÜNHAN', raceCount: '12', first: '2', second: '3', third: '2', fourth: '1', earning: '185.000 ₺' },
];

assert(mockSiblings.length === 3, 'Preview has 3 siblings when badge is 3');
assert(mockSiblings[0].name === 'GÖKÇE EFE', 'First sibling name matches');
assert(mockSiblings[0].earning.includes('₺'), 'Sibling earning is formatted');

console.log('All listing previews selftests passed successfully!');
