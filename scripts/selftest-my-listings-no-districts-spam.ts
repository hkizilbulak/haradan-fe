import { HttpLocationLookup } from '../services/location/HttpLocationLookup';
import { getListingCardAttributes } from '../components/product/cardAttributes';
import type { CatalogProductCard } from '../types';
import type { AdvertId } from '../types/advertId';

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

async function runTest() {
  console.log('=== TEST: My Listings No District Spam Verification ===');

  let districtCallCount = 0;
  let provinceCallCount = 0;

  // Mock lookup subclass tracking calls
  class TrackingLocationLookup extends HttpLocationLookup {
    override async listDistricts(provinceId: string) {
      districtCallCount++;
      return super.listDistricts(provinceId);
    }

    override async listProvinces() {
      provinceCallCount++;
      return super.listProvinces();
    }
  }

  const lookup = new TrackingLocationLookup('http://localhost:8080/api');

  // Adverts similar to the user's screen (Adana, Ağrı, Afyonkarahisar)
  const sampleCards: CatalogProductCard[] = [
    {
      id: 101 as AdvertId,
      title: 'AARON',
      price: { amountMinor: 100, currency: 'TRY' },
      provinceId: '802aa4c5-68d5-56e3-b5d8-c98b5d7f7874', // Adana
      districtId: 'dist-01-sey',
    },
    {
      id: 102 as AdvertId,
      title: 'ACELE ETME',
      price: { amountMinor: 200, currency: 'TRY' },
      provinceId: '37e6351b-f88f-5b1e-8e6c-ba9c16c079d9', // Ağrı
      districtId: 'dist-04-mer',
    },
    {
      id: 103 as AdvertId,
      title: 'ABACAN',
      price: { amountMinor: 10000000, currency: 'TRY' },
      provinceId: '37e6351b-f88f-5b1e-8e6c-ba9c16c079d9', // Ağrı
      districtId: 'dist-04-dog',
    },
    {
      id: 104 as AdvertId,
      title: 'ACE QUEEN',
      price: { amountMinor: 100, currency: 'TRY' },
      provinceId: 'c6cb4581-16fa-5faf-a4be-4c903baea061', // Afyonkarahisar
      districtId: 'dist-03-mer',
    },
  ] as unknown as CatalogProductCard[];

  // 1. Trigger listProvinces once as MyListingsView does
  await lookup.listProvinces();
  assert(provinceCallCount === 1, `listProvinces called once (count=${provinceCallCount})`);

  // 2. Resolve card attributes for all cards
  for (const card of sampleCards) {
    const attrs = getListingCardAttributes(card);
    assert(Boolean(attrs.province), `Province resolved for card "${card.title}": ${attrs.province}`);
  }

  // 3. Verify ZERO listDistricts calls were made
  assert(districtCallCount === 0, `listDistricts was NEVER called during card attribute resolution (count=${districtCallCount})`);

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

void runTest();
