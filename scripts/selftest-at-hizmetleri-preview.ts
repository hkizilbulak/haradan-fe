import { getAdvertCategoryKind, buildAdvertInfoRows } from '../components/advert-detail/advertCategoryHelper';
import { isPansiyonListing, isTransportListing, isFarrierListing, isHorseListing } from '../services/listing';
import { buildDraftProperties } from '../services/listing/mapDraftToRequest';
import type { ListingDraft } from '../types/listing';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok  ${msg}`);
}

console.log('--- Selftest: At Hizmetleri Preview & Category Logic ---');

// 1. Pansiyon Haralar Draft Test
const pansiyonDraft: ListingDraft = {
  type: {
    categoryId: 'c1000000-0000-4000-8000-000000000021',
    categorySlug: 'pansiyon-haralar',
    categoryName: 'Pansiyon Haralar',
    parentSlug: 'at-hizmetleri',
    allowTjk: false,
  },
  breed: null,
  details: {
    title: 'Silivri Çiftliği Pansiyon Hizmeti',
    description: 'Geniş çim padoklu, 7/24 veteriner ve nalbant hizmeti bulunan at pansiyonu.',
    priceTl: '25.000',
    provinceId: '34',
    districtId: '450',
    address: 'Silivri Çiftliği No:5',
    registeredName: '',
    gender: null,
    birthDate: '',
    age: '',
    coatColor: '',
    heightCm: '',
    sire: '',
    dam: '',
    damsire: '',
    horseId: null,
    tjkNumber: null,
    tjkSkipped: true,
    ownersText: '',
    breeder: '',
    trainer: '',
    phoneCountryIso: 'TR',
    sellerPhone: '5551234567',
    facilityGrassPaddock: true,
    facilitySandPaddock: true,
    facilityStallionPaddock: false,
    facilityFoalingBarn: true,
    facilityFarrier: true,
    facilityVeterinarian: true,
    facilityTrainingTrack: true,
  },
  media: [],
  packageCode: 'STANDARD',
};

assert(isPansiyonListing(pansiyonDraft.type), 'Pansiyon category identified');
assert(!isHorseListing(pansiyonDraft.type), 'Pansiyon is NOT horse listing');

// Map properties with buildDraftProperties
const pansiyonProps = buildDraftProperties(pansiyonDraft);
assert(pansiyonProps.grassPaddock === true, 'grassPaddock is true');
assert(pansiyonProps.sandPaddock === true, 'sandPaddock is true');
assert(pansiyonProps.vet === true, 'veterinarian is true');
assert(pansiyonProps.farrier === true, 'farrier is true');
assert(pansiyonProps.foalingBarn === true, 'foalingBarn is true');
assert(pansiyonProps.trainingTrack === true, 'trainingTrack is true');

// Check AdvertDetail mock object for Pansiyon
const pansiyonDetail: any = {
  id: 101,
  title: pansiyonDraft.details.title,
  description: pansiyonDraft.details.description,
  categoryId: pansiyonDraft.type?.categoryId,
  category: {
    id: pansiyonDraft.type?.categoryId,
    name: pansiyonDraft.type?.categoryName,
    slug: pansiyonDraft.type?.categorySlug,
  },
  breadcrumbs: [
    { label: 'Ana sayfa', href: '/' },
    { label: 'At Hizmetleri', href: '#' },
    { label: 'Pansiyon Haralar', href: '#' },
    { label: pansiyonDraft.details.title },
  ],
  specs: [
    {
      id: 'props',
      title: 'Genel Bilgiler',
      rows: [
        { label: 'Çim Padok', value: 'Evet' },
        { label: 'Kum Padok', value: 'Evet' },
        { label: 'Doğumhane', value: 'Evet' },
        { label: 'Nalbant', value: 'Evet' },
        { label: 'Veteriner Hekim', value: 'Evet' },
        { label: 'İdman Pisti', value: 'Evet' },
      ],
    },
  ],
  horse: {
    registeredName: '',
    age: 0,
    sire: '',
    dam: '',
    damsire: '',
    breed: '',
    coatColor: '',
    gender: '',
    pedigree: [],
    siblings: [],
    statistics: [],
  },
  properties: pansiyonProps,
};

const pansiyonKind = getAdvertCategoryKind(pansiyonDetail);
assert(pansiyonKind === 'pansiyon', `Pansiyon kind must be 'pansiyon', got '${pansiyonKind}'`);

const pansiyonInfoRows = buildAdvertInfoRows(pansiyonDetail);
const pansiyonLabels = pansiyonInfoRows.map((r) => r.label);
assert(pansiyonLabels.includes('Kategori'), 'Pansiyon has Kategori row');
assert(pansiyonLabels.includes('Çim Padok'), 'Pansiyon has Çim Padok row');
assert(pansiyonLabels.includes('Kum Padok'), 'Pansiyon has Kum Padok row');
assert(pansiyonLabels.includes('Veteriner Hekim'), 'Pansiyon has Veteriner Hekim row');
assert(!pansiyonLabels.includes('Baba Adı'), 'Pansiyon must NOT have Baba Adı');
assert(!pansiyonLabels.includes('Anne Adı'), 'Pansiyon must NOT have Anne Adı');
assert(!pansiyonLabels.includes('İdmanda mı'), 'Pansiyon must NOT have İdmanda mı');

// 2. Root At Hizmetleri Draft Test
const rootServiceDraft: ListingDraft = {
  type: {
    categoryId: 'c1000000-0000-4000-8000-000000000002',
    categorySlug: 'at-hizmetleri',
    categoryName: 'At Hizmetleri',
    parentSlug: null,
    allowTjk: false,
  },
  breed: null,
  details: {
    title: 'Genel At Hizmeti',
    description: 'At bakım ve danışmanlık hizmetleri.',
    priceTl: '10.000',
    provinceId: '34',
    districtId: '450',
    address: 'Adres',
    registeredName: '',
    gender: null,
    birthDate: '',
    age: '',
    coatColor: '',
    heightCm: '',
    sire: '',
    dam: '',
    damsire: '',
    horseId: null,
    tjkNumber: null,
    tjkSkipped: true,
    ownersText: '',
    breeder: '',
    trainer: '',
    phoneCountryIso: 'TR',
    sellerPhone: '5551234567',
    properties: {
      'Hizmet Türü': 'Danışmanlık',
    },
  },
  media: [],
  packageCode: 'STANDARD',
};

const rootServiceDetail: any = {
  id: 102,
  title: rootServiceDraft.details.title,
  categoryId: rootServiceDraft.type?.categoryId,
  category: {
    id: rootServiceDraft.type?.categoryId,
    name: rootServiceDraft.type?.categoryName,
    slug: rootServiceDraft.type?.categorySlug,
  },
  breadcrumbs: [
    { label: 'Ana sayfa', href: '/' },
    { label: 'At Hizmetleri', href: '#' },
    { label: rootServiceDraft.details.title },
  ],
  specs: [
    {
      id: 'props',
      title: 'Genel Bilgiler',
      rows: [{ label: 'Hizmet Türü', value: 'Danışmanlık' }],
    },
  ],
  horse: {
    registeredName: '',
    age: 0,
    sire: '',
    dam: '',
    damsire: '',
    breed: '',
    coatColor: '',
    gender: '',
    pedigree: [],
    siblings: [],
    statistics: [],
  },
  properties: buildDraftProperties(rootServiceDraft),
};

const rootServiceKind = getAdvertCategoryKind(rootServiceDetail);
assert(rootServiceKind === 'service', `Root At Hizmetleri kind must be 'service', got '${rootServiceKind}'`);

const rootServiceRows = buildAdvertInfoRows(rootServiceDetail);
const rootServiceLabels = rootServiceRows.map((r) => r.label);
assert(rootServiceLabels.includes('Hizmet Türü'), 'Root service has Hizmet Türü row');
assert(!rootServiceLabels.includes('Baba Adı'), 'Root service must NOT have Baba Adı');
assert(!rootServiceLabels.includes('At Adı'), 'Root service must NOT have At Adı');

// 3. At Nakliyesi Draft Test
const transportDraft: ListingDraft = {
  type: {
    categoryId: 'c1000000-0000-4000-8000-000000000022',
    categorySlug: 'at-nakliyesi',
    categoryName: 'At Nakliyesi',
    parentSlug: 'at-hizmetleri',
    allowTjk: false,
  },
  breed: null,
  details: {
    title: 'Ege At Taşımacılık',
    description: 'Şehirlerarası güvenli ve kameralı at nakliyesi.',
    priceTl: '15.000',
    provinceId: '35',
    districtId: '500',
    address: 'İzmir',
    registeredName: '',
    gender: null,
    birthDate: '',
    age: '',
    coatColor: '',
    heightCm: '',
    sire: '',
    dam: '',
    damsire: '',
    horseId: null,
    tjkNumber: null,
    tjkSkipped: true,
    ownersText: '',
    breeder: '',
    trainer: '',
    phoneCountryIso: 'TR',
    sellerPhone: '5551234567',
    companyName: 'Ege At Nakliyat',
    websiteUrl: 'https://egeatnakliyat.com',
  },
  media: [],
  packageCode: 'STANDARD',
};

assert(isTransportListing(transportDraft.type), 'Transport category identified');
const transportProps = buildDraftProperties(transportDraft);
assert(transportProps.COMPANY_NAME === 'Ege At Nakliyat', 'COMPANY_NAME set in props');
assert(transportProps.WEBSITE_URL === 'https://egeatnakliyat.com', 'WEBSITE_URL set in props');

const transportDetail: any = {
  id: 103,
  title: transportDraft.details.title,
  categoryId: transportDraft.type?.categoryId,
  category: {
    id: transportDraft.type?.categoryId,
    name: transportDraft.type?.categoryName,
    slug: transportDraft.type?.categorySlug,
  },
  breadcrumbs: [
    { label: 'Ana sayfa', href: '/' },
    { label: 'At Hizmetleri', href: '#' },
    { label: 'At Nakliyesi', href: '#' },
    { label: transportDraft.details.title },
  ],
  specs: [
    {
      id: 'props',
      title: 'Genel Bilgiler',
      rows: [
        { label: 'Firma Adı', value: 'Ege At Nakliyat' },
        { label: 'Web Sitesi', value: 'https://egeatnakliyat.com' },
      ],
    },
  ],
  horse: {
    registeredName: '',
    age: 0,
    sire: '',
    dam: '',
    damsire: '',
    breed: '',
    coatColor: '',
    gender: '',
    pedigree: [],
    siblings: [],
    statistics: [],
  },
  properties: transportProps,
};

const transportKind = getAdvertCategoryKind(transportDetail);
assert(transportKind === 'transport', `Transport kind must be 'transport', got '${transportKind}'`);

const transportRows = buildAdvertInfoRows(transportDetail);
const transportLabels = transportRows.map((r) => r.label);
assert(transportLabels.includes('Firma Adı'), 'Transport has Firma Adı row');
assert(transportLabels.includes('Hizmet'), 'Transport has Hizmet row');
assert(!transportLabels.includes('Baba Adı'), 'Transport must NOT have Baba Adı');

console.log('All At Hizmetleri preview tests passed successfully!');
