import { detailsErrors } from '../services/listing/validateListingDraft';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
import type { CategoryPropertyPublic } from '../types';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok  ${msg}`);
}

console.log('--- Testing Eküri Multi-Category Listing Validation ---');

// Mock Category Properties for Satılık Yarış Atı
const satilikYarisAtiProps: CategoryPropertyPublic[] = [
  {
    code: 'HORSE_BREED',
    title: 'At Irkı',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 1,
    options: [{ value: 'ingiliz', label: 'İngiliz' }],
    ...({ categoryId: 'c1000000-0000-4000-8000-000000000011' } as any),
  },
  {
    code: 'HORSE_AGE',
    title: 'Yaş',
    dataType: 'INTEGER',
    isRequired: true,
    isFilterable: true,
    sortOrder: 2,
    options: [],
    ...({ categoryId: 'c1000000-0000-4000-8000-000000000011' } as any),
  },
  {
    code: 'COAT_COLOR',
    title: 'Donu (Renk)',
    dataType: 'SINGLE_SELECT',
    isRequired: true,
    isFilterable: true,
    sortOrder: 3,
    options: [{ value: 'al', label: 'Al' }],
    ...({ categoryId: 'c1000000-0000-4000-8000-000000000011' } as any),
  },
];

// Mock Category Properties for At Nakliyesi
const atNakliyesiProps: CategoryPropertyPublic[] = [
  {
    code: 'COMPANY_NAME',
    title: 'Firma Adı',
    dataType: 'STRING',
    isRequired: true,
    isFilterable: true,
    sortOrder: 1,
    options: [],
    ...({ categoryId: 'c1000000-0000-4000-8000-000000000022' } as any),
  },
];

// 1. Test Satılık Yarış Atı validation
const draftHorse = createEmptyDraft();
draftHorse.type = {
  categoryId: 'c1000000-0000-4000-8000-000000000011',
  categorySlug: 'satilik-yaris-ati',
  categoryName: 'Satılık Yarış Atı',
  parentSlug: 'satilik-atlar',
};
draftHorse.details.title = 'Yarış Atı Başlığı';
draftHorse.details.priceTl = '500.000';
draftHorse.details.provinceId = '34';
draftHorse.details.districtId = '450';
draftHorse.details.sellerPhone = '5321112233';
draftHorse.media = [{ localId: 'm1', uri: 'file://img1.jpg', mimeType: 'image/jpeg', fileName: 'img1.jpg', isCover: true, assetId: null }];

// When breed is missing on horse listing, it MUST warn about At Irkı
const horseErrsMissingBreed = detailsErrors(draftHorse, satilikYarisAtiProps);
assert(
  Boolean(horseErrsMissingBreed['HORSE_BREED'] || Object.values(horseErrsMissingBreed).some((msg) => msg?.includes('At Irkı'))),
  'Horse listing without breed correctly produces "At Irkı" error'
);

// 2. Test At Nakliyesi validation (The user bug report!)
const draftTransport = createEmptyDraft();
draftTransport.type = {
  categoryId: 'c1000000-0000-4000-8000-000000000022',
  categorySlug: 'at-nakliyesi',
  categoryName: 'At Nakliyesi',
  parentSlug: 'at-hizmetleri',
};
draftTransport.details.title = 'Güvenli At Nakliyesi Hizmeti';
draftTransport.details.priceTl = '5.000';
draftTransport.details.provinceId = '34';
draftTransport.details.districtId = '450';
draftTransport.details.sellerPhone = '5321112233';
draftTransport.media = [{ localId: 'm2', uri: 'file://img2.jpg', mimeType: 'image/jpeg', fileName: 'img2.jpg', isCover: true, assetId: null }];
draftTransport.details.companyName = 'Haradan Nakliyat';

// Case A: Validated with its own properties (atNakliyesiProps)
const transportErrsOwnProps = detailsErrors(draftTransport, atNakliyesiProps);
assert(
  !transportErrsOwnProps['HORSE_BREED'] && !Object.values(transportErrsOwnProps).some((msg) => msg?.includes('At Irkı')),
  'At Nakliyesi does NOT get "At Irkı" error when evaluated with own props'
);
assert(
  Object.keys(transportErrsOwnProps).length === 0,
  'Valid At Nakliyesi listing passes validation with 0 errors'
);

// Case B: Validated even if horse properties were passed in (cross-category safety!)
const transportErrsCrossProps = detailsErrors(draftTransport, satilikYarisAtiProps);
assert(
  !transportErrsCrossProps['HORSE_BREED'] && !Object.values(transportErrsCrossProps).some((msg) => msg?.includes('At Irkı')),
  'At Nakliyesi does NOT get "At Irkı" error even if horse category props are passed (cross-category protection works)'
);

// Case C: Validated with undefined props (using catalog/fallback defaults)
const transportErrsUndefinedProps = detailsErrors(draftTransport, undefined);
assert(
  !transportErrsUndefinedProps['HORSE_BREED'] && !Object.values(transportErrsUndefinedProps).some((msg) => msg?.includes('At Irkı')),
  'At Nakliyesi does NOT get "At Irkı" error when categoryProperties is undefined'
);
assert(
  Object.keys(transportErrsUndefinedProps).length === 0,
  'Valid At Nakliyesi listing passes validation with undefined props'
);

// Case D: Missing companyName on At Nakliyesi must produce Firma Adı error, NOT At Irkı error
draftTransport.details.companyName = '';
const transportErrsMissingCompany = detailsErrors(draftTransport, undefined);
assert(
  Boolean(transportErrsMissingCompany['companyName'] || transportErrsMissingCompany['COMPANY_NAME'] || Object.values(transportErrsMissingCompany).some((msg) => msg?.includes('Firma'))),
  'At Nakliyesi with missing company name produces "Firma adı" error'
);
assert(
  !transportErrsMissingCompany['HORSE_BREED'] && !Object.values(transportErrsMissingCompany).some((msg) => msg?.includes('At Irkı')),
  'At Nakliyesi with missing company name does NOT produce "At Irkı" error'
);

console.log('\nAll multi-category validation tests passed successfully!');
