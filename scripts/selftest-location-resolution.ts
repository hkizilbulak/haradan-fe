import { StaticLocationLookup } from '../services/location/StaticLocationLookup';
import { HttpLocationLookup } from '../services/location/HttpLocationLookup';
import { formatAdvertLocation } from '../services/location/locationHelper';
import { mapPublishedDetailToAdvert, type BePublishedAdvertDetail } from '../services/advert/mapAdvertDetail';
import { mapPublishedCardToCatalog, type BePublishedCard } from '../services/adverts/mapPublishedCard';
import { MOCK_HOMEPAGE } from '../mocks/homepage';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`✓ ${msg}`);
  } else {
    failed++;
    console.error(`✗ ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
  assert(actual === expected, `${msg} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

async function runTests() {
  console.log('=== TEST: StaticLocationLookup ===');
  const staticGeo = new StaticLocationLookup();

  // 1. Mock code lookup
  assertEqual(staticGeo.getProvinceName('prov-34'), 'İstanbul', 'Lookup by prov-34');
  assertEqual(staticGeo.getProvinceName('prov-06'), 'Ankara', 'Lookup by prov-06');
  assertEqual(staticGeo.getDistrictName('dist-34-kad'), 'Kadıköy', 'Lookup by dist-34-kad');
  assertEqual(staticGeo.getDistrictName('dist-34-sil'), 'Silivri', 'Lookup by dist-34-sil');
  assertEqual(staticGeo.getDistrictName('dist-06-cub'), 'Çubuk', 'Lookup by dist-06-cub');
  assertEqual(staticGeo.getDistrictName('dist-35-tor'), 'Torbalı', 'Lookup by dist-35-tor');
  assertEqual(staticGeo.getDistrictName('dist-16-nil'), 'Nilüfer', 'Lookup by dist-16-nil');

  // 2. Deterministic UUID lookup
  assertEqual(staticGeo.getProvinceName('c029c5bf-570e-5eb2-9d0f-0437fa131ff1'), 'İstanbul', 'Lookup by Istanbul UUID');
  assertEqual(staticGeo.getProvinceName('2436cf3e-a250-511c-aa39-c5cd1c8a3f71'), 'Ankara', 'Lookup by Ankara UUID');
  assertEqual(staticGeo.getProvinceName('64f1681f-bd67-5b6d-a0fb-cb67e70dda74'), 'İzmir', 'Lookup by Izmir UUID');

  // 3. Plate code lookup
  assertEqual(staticGeo.getProvinceName('34'), 'İstanbul', 'Lookup by plate string 34');
  assertEqual(staticGeo.getProvinceName('06'), 'Ankara', 'Lookup by plate string 06');

  // 4. Dynamic registration & Subscription
  let subscriptionCalled = false;
  const unsubscribe = staticGeo.subscribe(() => {
    subscriptionCalled = true;
  });
  staticGeo.registerProvince('custom-prov-uuid', 'Bursa');
  staticGeo.registerDistrict('custom-dist-uuid', 'Nilüfer', 'custom-prov-uuid');
  unsubscribe();
  assertEqual(subscriptionCalled, true, 'StaticLocationLookup subscribe triggered');
  assertEqual(staticGeo.getProvinceName('custom-prov-uuid'), 'Bursa', 'Lookup registered province');
  assertEqual(staticGeo.getDistrictName('custom-dist-uuid'), 'Nilüfer', 'Lookup registered district');

  // 5. formatLocation
  assertEqual(
    staticGeo.formatLocation('dist-34-kad', 'prov-34'),
    'Kadıköy, İstanbul',
    'formatLocation dist-34-kad + prov-34'
  );
  assertEqual(
    staticGeo.formatLocation('dist-06-cub', 'prov-06'),
    'Çubuk, Ankara',
    'formatLocation dist-06-cub + prov-06'
  );
  assertEqual(
    staticGeo.formatLocation(undefined, 'prov-34'),
    'İstanbul',
    'formatLocation only prov-34'
  );
  assertEqual(
    staticGeo.formatLocation('dist-34-kad', undefined),
    'Kadıköy',
    'formatLocation only dist-34-kad'
  );
  assertEqual(
    staticGeo.formatLocation(undefined, undefined, 'Kadıköy', 'İstanbul'),
    'Kadıköy, İstanbul',
    'formatLocation direct names'
  );

  console.log('\n=== TEST: HttpLocationLookup ===');
  const httpGeo = new HttpLocationLookup('http://localhost:8080/api');

  // Fallback to static lookup when offline
  assertEqual(httpGeo.getProvinceName('prov-34'), 'İstanbul', 'HttpLocationLookup fallback prov-34');
  assertEqual(httpGeo.getProvinceName('c029c5bf-570e-5eb2-9d0f-0437fa131ff1'), 'İstanbul', 'HttpLocationLookup fallback Istanbul UUID');
  assertEqual(httpGeo.getDistrictName('dist-34-kad'), 'Kadıköy', 'HttpLocationLookup fallback dist-34-kad');

  // Dynamic registration on HttpLocationLookup
  let httpSubCalled = false;
  const httpUnsub = httpGeo.subscribe(() => {
    httpSubCalled = true;
  });
  httpGeo.registerProvince('prov-test-99', 'Testİl');
  httpGeo.registerDistrict('dist-test-99', 'Testİlçe', 'prov-test-99');
  httpUnsub();
  assertEqual(httpSubCalled, true, 'HttpLocationLookup subscribe triggered');
  assertEqual(httpGeo.getProvinceName('prov-test-99'), 'Testİl', 'HttpLocationLookup registered province');
  assertEqual(httpGeo.getDistrictName('dist-test-99'), 'Testİlçe', 'HttpLocationLookup registered district');

  console.log('\n=== TEST: formatAdvertLocation ===');
  assertEqual(
    formatAdvertLocation({ locationName: 'Beşiktaş, İstanbul' }),
    'Beşiktaş, İstanbul',
    'formatAdvertLocation with pre-formatted locationName'
  );
  assertEqual(
    formatAdvertLocation({ districtName: 'Kadıköy', provinceName: 'İstanbul' }),
    'Kadıköy, İstanbul',
    'formatAdvertLocation with districtName and provinceName'
  );
  assertEqual(
    formatAdvertLocation({ districtId: 'dist-34-sil', provinceId: 'prov-34' }),
    'Silivri, İstanbul',
    'formatAdvertLocation with mock IDs'
  );
  assertEqual(
    formatAdvertLocation({ districtId: 'dist-06-cub', provinceId: 'prov-06' }),
    'Çubuk, Ankara',
    'formatAdvertLocation Ankara mock IDs'
  );

  console.log('\n=== TEST: Homepage Mock Cards Location ===');
  const sampleNewAd = MOCK_HOMEPAGE.newAdverts[0];
  const sampleUrgent = MOCK_HOMEPAGE.urgentAdverts[0];
  const sampleTrending = MOCK_HOMEPAGE.trending[0];

  assert(Boolean(sampleNewAd?.locationName && sampleNewAd.locationName.includes(',')), `New advert card has "İlçe, İl": ${sampleNewAd?.locationName}`);
  assert(Boolean(sampleUrgent?.locationName && sampleUrgent.locationName.includes(',')), `Urgent card has "İlçe, İl": ${sampleUrgent?.locationName}`);
  assert(Boolean(sampleTrending?.locationName && sampleTrending.locationName.includes(',')), `Trending card has "İlçe, İl": ${sampleTrending?.locationName}`);

  console.log('\n=== TEST: mapPublishedDetailToAdvert ===');
  const sampleDetailDto: BePublishedAdvertDetail = {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Şampiyon Yarış Atı',
    description: 'Harika bir at',
    publishedAt: new Date().toISOString(),
    price: { amountMinor: 150000000, currency: 'TRY' },
    category: { id: 'cat-1', name: 'Arap Atı', slug: 'arap-ati' },
    location: {
      districtId: 'dist-custom-123',
      districtName: 'Çekmeköy',
      provinceId: 'c029c5bf-570e-5eb2-9d0f-0437fa131ff1',
      provinceName: 'İstanbul',
    },
    horse: null,
    media: [],
    properties: [],
    isFavorite: false,
    isUrgent: false,
    viewCount: 42,
  };

  const advertDetail = mapPublishedDetailToAdvert(sampleDetailDto, 'http://localhost:8080');
  assertEqual(advertDetail.districtName, 'Çekmeköy', 'AdvertDetail districtName mapped');
  assertEqual(advertDetail.provinceName, 'İstanbul', 'AdvertDetail provinceName mapped');
  assertEqual(advertDetail.locationName, 'Çekmeköy, İstanbul', 'AdvertDetail locationName mapped');
  assertEqual(formatAdvertLocation(advertDetail), 'Çekmeköy, İstanbul', 'formatAdvertLocation(advertDetail)');

  console.log('\n=== TEST: mapPublishedCardToCatalog ===');
  const sampleCardDto: BePublishedCard = {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Aygır Hizmeti',
    publishedAt: new Date().toISOString(),
    price: { amountMinor: 5000000, currency: 'TRY' },
    categoryId: 'cat-2',
    districtId: 'dist-34-kad',
    provinceId: 'prov-34',
    cover: null,
    isFavorite: null,
    isUrgent: true,
    viewCount: 150,
  };

  const catalogCard = mapPublishedCardToCatalog(sampleCardDto, 'http://localhost:8080');
  assertEqual(catalogCard.locationName, 'Kadıköy, İstanbul', 'CatalogProductCard locationName mapped');
  assertEqual(formatAdvertLocation(catalogCard), 'Kadıköy, İstanbul', 'formatAdvertLocation(catalogCard)');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

void runTests();
