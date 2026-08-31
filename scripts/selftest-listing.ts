/**
 * İlan ver + TJK sözleşme self-test.
 * Çalıştır: npm run selftest:listing
 */
import { HttpTjkRepository } from '../services/tjk/HttpTjkRepository';
import { horseSearchQuery, mapHorseDetail, mapHorseSelection } from '../services/tjk/mapHorse';
import { HttpListingRepository } from '../services/listing/HttpListingRepository';
import { mapDraftToCreateAdvert } from '../services/listing/mapDraftToRequest';
import { mapPublicPackage } from '../services/listing/mapPackage';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
import { HttpCatalogRepository } from '../services/catalog/HttpCatalogRepository';
import { HttpLocationLookup } from '../services/location/HttpLocationLookup';
import { isHorseListing, detailsErrors, detailsStepComplete } from '../services/listing/validateListingDraft';
import type { IMediaUploader } from '../services/media/MediaUploader';

let failed = 0;
let passed = 0;

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
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

assertEqual(horseSearchQuery('AAMAAL').q, 'AAMAAL', 'name search uses q');
assertEqual(horseSearchQuery('85948').tjkNumber, '85948', 'numeric query uses tjkNumber');
assertEqual(horseSearchQuery('12').q, '12', 'short numeric stays name prefix');

const mapped = mapHorseSelection({
  id: '1b221374-e177-4ba2-9411-43c9339fbb48',
  originalName: 'AAMAAL (GER) (T)',
  tjkNumber: '85948',
  birthYear: 2007,
  sireName: 'MAMOOL (IRE)',
  damName: 'API SA (IRE)',
});
assertEqual(mapped.horseId, '1b221374-e177-4ba2-9411-43c9339fbb48', 'selection horseId');
assertEqual(mapped.registeredName, 'AAMAAL (GER) (T)', 'selection name');

const detail = mapHorseDetail({
  ...mapped,
  id: mapped.horseId,
  originalName: mapped.registeredName,
  gender: 'k',
  breed: 'İngiliz\nDişi',
  coat: 'd',
  detail: { profile: { birthDate: '28.04.2007', owner: 'DUYGU', maidenSire: 'ZINAAD' } },
});
assertEqual(detail.gender, 'Dişi', 'gender k → Dişi');
assertEqual(detail.birthDate, '2007-04-28', 'birthDate dmy → iso');
assertEqual(detail.breed, 'İngiliz', 'breed first line');
assertEqual(detail.damsire, 'ZINAAD', 'maidenSire');

const pkg = mapPublicPackage({
  code: 'PREMIUM',
  displayName: 'Premium',
  description: 'Daha fazla görünürlük',
  badgeText: 'Önerilen',
  benefits: [
    'in|time-outline|45 gün yayın',
    'in|flash-outline|Acil ilan rozeti',
    'out|trophy-outline|Anasayfa vitrini',
  ],
  displayPrice: { amountMinor: 65000, currency: 'TRY' },
  defaultDurationDays: 45,
  allowsUrgent: true,
  showcaseEligible: false,
  searchPriority: 50,
  sortOrder: 20,
});
assertEqual(pkg.code, 'PREMIUM', 'package code is open');
assertEqual(pkg.name, 'Premium', 'package displayName');
assertEqual(pkg.tagline, 'Daha fazla görünürlük', 'package description tagline');
assertEqual(pkg.price.amountMinor, 65000, 'package price');
assert(pkg.highlighted, 'badge highlights package');
assertEqual(pkg.features[0]?.included, true, 'encoded in-feature included');
assertEqual(pkg.features[0]?.icon, 'time-outline', 'encoded feature icon');
assertEqual(pkg.features[2]?.included, false, 'encoded out-feature excluded');
assertEqual(pkg.features[2]?.label, 'Anasayfa vitrini', 'encoded out-feature label');

const draft = createEmptyDraft();
draft.type = {
  categoryId: 'f5668784-4459-4d32-ad79-b6df623cc4f3',
  categorySlug: 'deneme-1452',
  categoryName: 'Deneme',
  parentSlug: null,
};
draft.details.title = 'Satılık kısrak';
draft.details.description = 'Detaylı açıklama metni burada yeterince uzun.';
draft.details.priceTl = '150000';
draft.details.districtId = '11111111-1111-1111-1111-111111111111';
draft.details.address = 'Merkez Mah. No: 1';
  draft.details.horseId = '1b221374-e177-4ba2-9411-43c9339fbb48';
  draft.packageCode = 'PREMIUM';
  const body = mapDraftToCreateAdvert(draft);
assertEqual(
  Object.keys(body).sort().join(','),
  'categoryId,description,districtId,horseId,price,title',
  'create body OpenAPI fields only'
);
assertEqual(body.price?.currency, 'TRY', 'price currency TRY');

assertEqual(body.price?.amountMinor, 15000000, 'TL to minor');

const incomplete = createEmptyDraft();
incomplete.type = draft.type;
incomplete.details.title = 'Başlık';
incomplete.details.priceTl = '1000';
incomplete.details.provinceId = 'p-1';
incomplete.details.districtId = 'd-1';
incomplete.details.address = 'Sokak 1 No:2';
incomplete.details.sellerPhone = '5321234567';
incomplete.media = [{ localId: 'm1', uri: 'file://x', mimeType: 'image/jpeg', fileName: 'x.jpg', isCover: true, assetId: null }];
assert(!detailsErrors(incomplete).description, 'description is optional');
assert(detailsStepComplete(incomplete), 'details complete without description');
assertEqual(
  detailsErrors({ ...incomplete, details: { ...incomplete.details, priceTl: '' } }).priceTl,
  'Geçerli bir fiyat girin.',
  'price required'
);
assertEqual(
  detailsErrors(
    { ...incomplete, details: { ...incomplete.details, address: '' } },
    undefined,
    { ADDRESS: { code: 'ADDRESS', title: 'Açık Adres', isActive: true, isRequired: true, isFormVisible: true, isPublicVisible: true } }
  ).address,
  'Açık adres zorunludur (en az 5 karakter).',
  'address required'
);


type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
const responses: Record<string, { status: number; body: unknown }> = {};

function keyOf(url: string, method: string): string {
  return `${method} ${url.replace(/^https?:\/\/[^/]+/, '')}`;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  calls.push({ url, init: init ?? {} });
  const hit = responses[keyOf(url, method)];
  if (!hit) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'missing mock' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(hit.body), {
    status: hit.status,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

async function main() {
  const tjk = new HttpTjkRepository('http://localhost:8080/api');
  responses['GET /api/v1/horses?q=ada&limit=20'] = {
    status: 200,
    body: { items: [{ id: mapped.horseId, originalName: 'Ada', tjkNumber: 'T1', birthYear: 2019 }] },
  };
  const found = await tjk.search('ada');
  assertEqual(found[0]?.registeredName, 'Ada', 'horse search unwraps items');
  assert(
    calls.some((c) => c.url.includes('/v1/horses?q=ada')),
    'search hits /v1/horses'
  );

  calls.length = 0;
  responses['GET /api/v1/horses?tjkNumber=85948&limit=20'] = {
    status: 200,
    body: { items: [{ id: mapped.horseId, originalName: 'AAMAAL (GER) (T)', tjkNumber: '85948' }] },
  };
  const byNo = await tjk.search('85948');
  assertEqual(byNo[0]?.tjkNumber, '85948', 'tjkNumber search');

  responses[`GET /api/v1/horses/${mapped.horseId}`] = {
    status: 200,
    body: {
      id: mapped.horseId,
      originalName: 'AAMAAL (GER) (T)',
      tjkNumber: '85948',
      gender: 'k',
      detail: {},
    },
  };
  const profile = await tjk.getById(mapped.horseId);
  assertEqual(profile?.horseId, mapped.horseId, 'horse detail by uuid');

  assert(!isHorseListing(null), 'empty type is not horse');
  assert(
    isHorseListing({
      categoryId: 'c1000000-0000-4000-8000-000000000011',
      categorySlug: 'satilik-yaris-ati',
      categoryName: 'Satılık Yarış Atı',
      parentSlug: 'satilik-atlar',
    }),
    'satılık yarış atı is horse'
  );
  assert(
    !isHorseListing({
      categoryId: 'c1000000-0000-4000-8000-000000000022',
      categorySlug: 'at-nakliyesi',
      categoryName: 'At Nakliyesi',
      parentSlug: 'at-hizmetleri',
    }),
    'at nakliyesi is not horse'
  );
  assert(
    isHorseListing({
      categoryId: 'c1000000-0000-4000-8000-000000000031',
      categorySlug: 'arap-aygir',
      categoryName: 'Arap Aygır',
      parentSlug: 'asim-hizmetleri',
    }),
    'arap aygır is horse'
  );

  const catalog = new HttpCatalogRepository('http://localhost:8080/api');
  responses['GET /api/v1/categories'] = {
    status: 200,
    body: {
      items: [
        {
          id: 'c1000000-0000-4000-8000-000000000001',
          slug: 'satilik-atlar',
          name: 'Satılık Atlar',
          children: [
            {
              id: 'c1000000-0000-4000-8000-000000000011',
              slug: 'satilik-yaris-ati',
              name: 'Satılık Yarış Atı',
              children: [],
            },
          ],
        },
        {
          id: 'c1000000-0000-4000-8000-000000000002',
          slug: 'at-hizmetleri',
          name: 'At Hizmetleri',
          children: [
            {
              id: 'c1000000-0000-4000-8000-000000000021',
              slug: 'pansiyon-haralar',
              name: 'Pansiyon Haralar',
              children: [],
            },
          ],
        },
      ],
    },
  };
  const tree = await catalog.getCategoryTree();
  assertEqual(tree[0]?.slug, 'satilik-atlar', 'category tree unwraps listing groups');
  assertEqual(tree[0]?.children[0]?.slug, 'satilik-yaris-ati', 'listing type is a leaf');


  const media: IMediaUploader = {
    upload: async () => ({ assetId: 'asset-1', publicUrl: 'file://x' }),
  };
  const listing = new HttpListingRepository('http://localhost:8080/api', media);
  responses['GET /api/v1/packages'] = {
    status: 200,
    body: {
      items: [
        {
          code: 'STANDARD',
          displayName: 'Standart',
          description: 'Temel yayın',
          benefits: ['in|time-outline|30 gün yayın'],
          displayPrice: { amountMinor: 25000, currency: 'TRY' },
          defaultDurationDays: 30,
          allowsUrgent: false,
          showcaseEligible: false,
          searchPriority: 10,
          sortOrder: 10,
        },
      ],
    },
  };
  const packages = await listing.getPackages();
  assertEqual(packages[0]?.code, 'STANDARD', 'packages from /v1/packages');
  assertEqual(packages[0]?.price.amountMinor, 25000, 'standard price from BE');

  calls.length = 0;
  responses['POST /api/v1/me/adverts'] = {
    status: 201,
    body: {
      id: 1,
      status: 'DRAFT',
      version: 1,
      mediaVersion: 1,
      categoryId: draft.type?.categoryId,
      districtId: draft.details.districtId,
      horseId: draft.details.horseId,
      title: draft.details.title,
      description: draft.details.description,
      price: body.price,
      properties: {},
      media: [],
      publishedAt: null,
      deletedAt: null,
    },
  };
  responses['POST /api/v1/me/adverts/1/submit'] = {
    status: 200,
    body: {
      id: 1,
      status: 'PENDING_REVIEW',
      version: 1,
      mediaVersion: 1,
      categoryId: draft.type?.categoryId,
      districtId: draft.details.districtId,
      horseId: draft.details.horseId,
      title: draft.details.title,
      description: draft.details.description,
      price: body.price,
      properties: {},
      media: [],
      publishedAt: null,
      deletedAt: null,
    },
  };
  responses['PUT /api/v1/me/adverts/1/package'] = {
    status: 200,
    body: {
      id: 'assign-1',
      advertId: 1,
      packageCode: 'PREMIUM',
      status: 'ACTIVE',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 45 * 86400000).toISOString(),
      assignedByUserId: 'user-1',
      assignedAt: new Date().toISOString(),
      source: 'SYSTEM',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  const published = await listing.publish(draft, 'token-1');
  assertEqual(published.status, 'PENDING_REVIEW', 'submit → PENDING_REVIEW');
  const createCall = calls.find((c) => c.url.endsWith('/v1/me/adverts'));
  const createBody = JSON.parse(String(createCall?.init.body));
  assertEqual(createBody.categoryId, draft.type?.categoryId, 'create sends categoryId');
  assert(!('packageCode' in createBody), 'create does not send packageCode');
  assert(!('sellerPhone' in createBody), 'create does not send sellerPhone');
  const packageCall = calls.find((c) =>
    c.url.endsWith('/v1/me/adverts/1/package')
  );
  assert(Boolean(packageCall), 'assigns selected package before submit');
  const packageBody = JSON.parse(String(packageCall?.init.body));
  assertEqual(packageBody.packageCode, 'PREMIUM', 'package assign sends packageCode');
  const callOrder = calls.map((c) => {
    const path = c.url.replace(/^https?:\/\/[^/]+/, '');
    return `${(c.init.method ?? 'GET').toUpperCase()} ${path}`;
  });
  const packageIdx = callOrder.findIndex((c) =>
    c.includes('PUT /api/v1/me/adverts/1/package')
  );
  const submitIdx = callOrder.findIndex((c) =>
    c.includes('POST /api/v1/me/adverts/1/submit')
  );
  assert(packageIdx >= 0 && packageIdx < submitIdx, 'package before submit');
  const auth = new Headers(createCall?.init.headers);
  assertEqual(auth.get('Authorization'), 'Bearer token-1', 'create uses Bearer');
  assert(
    calls.some((c) => c.url.endsWith('/v1/me/adverts/1/submit')),
    'submit path'
  );

  const geo = new HttpLocationLookup('http://localhost:8080/api');
  responses['GET /api/v1/provinces'] = { status: 200, body: { items: [] } };
  const empty = await geo.listProvinces();
  assertEqual(empty.length, 0, 'empty geo catalog is not treated as success cache');
  responses['GET /api/v1/provinces'] = {
    status: 200,
    body: { items: [{ id: 'p-34', name: 'İstanbul' }] },
  };
  const filled = await geo.listProvinces();
  assertEqual(filled[0]?.name, 'İstanbul', 'retries empty catalog on next list');
  geo.invalidate();
  responses['GET /api/v1/provinces'] = {
    status: 200,
    body: { items: [{ id: 'p-06', name: 'Ankara' }] },
  };
  const afterInvalidate = await geo.listProvinces();
  assertEqual(afterInvalidate[0]?.name, 'Ankara', 'invalidate forces live refetch');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
