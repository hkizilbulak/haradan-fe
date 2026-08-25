/**
 * Advert Properties JSON ve Backend Hata Yönetimi Self-Test Paketi.
 * Doğrulama senaryoları:
 * Test 1 — Canonical Code (grassPaddock: true)
 * Test 2 — Eski Alias Gönderilmemesi (facilityGrassPaddock vb. yok)
 * Test 3 — Dynamic Property (yeni property otomatik aktarılır)
 * Test 4 — Backend 400 (hata fırlatılır, localStorage'a yazılmaz)
 * Test 5 — Backend 500 (hata fırlatılır, sessiz fallback yapılmaz)
 * Test 6 — Boolean Type (true/false boolean literal)
 * Test 7 — Integer Type (5 number literal)
 * Test 8 — Select (option value direkt aktarılır)
 * Test 9 — Category Change (eski kategori property'leri sıfırlanır)
 */

import { buildDraftProperties, mapDraftToCreateAdvert } from '../services/listing/mapDraftToRequest';
import { HttpListingRepository } from '../services/listing/HttpListingRepository';
import { createEmptyDraft } from '../services/listing/listingDraftStore';
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

// Mock fetch handler to simulate Backend REST API
let mockApiResponses: Record<string, { status: number; body: any }> = {};
let capturedRequests: { url: string; method: string; body: any }[] = [];

// Setup mock global fetch
(globalThis as any).fetch = async (url: string, init?: RequestInit) => {
  const urlStr = url.toString();
  const method = (init?.method ?? 'GET').toUpperCase();
  const parsedBody = init?.body ? JSON.parse(String(init.body)) : null;
  capturedRequests.push({ url: urlStr, method, body: parsedBody });

  const routes = Object.entries(mockApiResponses).sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, resp] of routes) {
    if (urlStr.includes(pattern)) {
      if (resp.status >= 400) {
        return {
          ok: false,
          status: resp.status,
          json: async () => resp.body,
          text: async () => JSON.stringify(resp.body),
        };
      }
      return {
        ok: true,
        status: resp.status,
        json: async () => resp.body,
        text: async () => JSON.stringify(resp.body),
      };
    }
  }
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' }),
    text: async () => '{"error":"Not found"}',
  };
};

// Setup mock localStorage
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
};
(globalThis as any).window = globalThis;

async function runTests() {
  console.log('\n--- Advert Properties JSON & Backend Error Handling Self-Tests ---');

  // -------------------------------------------------------------
  // Test 1: Canonical Code (grassPaddock: true)
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Canonical Code Serialization ---');
  const pansiyonDraft = createEmptyDraft();
  pansiyonDraft.type = {
    categoryId: 'c1000000-0000-4000-8000-000000000021',
    categorySlug: 'pansiyon-haralar',
    categoryName: 'Pansiyon Haralar',
    parentSlug: 'at-hizmetleri',
  };
  pansiyonDraft.details.facilityGrassPaddock = true;
  pansiyonDraft.details.facilitySandPaddock = true;
  pansiyonDraft.details.facilityVeterinarian = true;

  const pansiyonProps = buildDraftProperties(pansiyonDraft);
  assertEqual(pansiyonProps.grassPaddock, true, 'grassPaddock canonical code boolean true');
  assertEqual(pansiyonProps.sandPaddock, true, 'sandPaddock canonical code boolean true');
  assertEqual(pansiyonProps.vet, true, 'vet canonical code boolean true');

  // -------------------------------------------------------------
  // Test 2: Eski Alias Gönderilmemesi (facilityGrassPaddock vb. yok)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: No Legacy Prefixed Aliases in Request ---');
  assert(!('facilityGrassPaddock' in pansiyonProps), 'facilityGrassPaddock request içinde yok');
  assert(!('facilitySandPaddock' in pansiyonProps), 'facilitySandPaddock request içinde yok');
  assert(!('facilityVeterinarian' in pansiyonProps), 'facilityVeterinarian request içinde yok');
  assert(!('sellerPhone' in pansiyonProps), 'sellerPhone properties içinde yok');
  assert(!('phone' in pansiyonProps), 'phone properties içinde yok');

  // -------------------------------------------------------------
  // Test 3: Dynamic Property (yeni property otomatik aktarılır)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Dynamic Property Serialization ---');
  const dynamicDraft = createEmptyDraft();
  dynamicDraft.type = pansiyonDraft.type;
  dynamicDraft.details.properties = {
    customSolarPower: true,
    customCameraCount: 12,
    customNote: 'Özel güvenlikli tesis',
  };

  const dynamicProps = buildDraftProperties(dynamicDraft);
  assertEqual(dynamicProps.customSolarPower, true, 'Dinamik boolean property aktarıldı');
  assertEqual(dynamicProps.customCameraCount, 12, 'Dinamik number property aktarıldı');
  assertEqual(dynamicProps.customNote, 'Özel güvenlikli tesis', 'Dinamik string property aktarıldı');

  // -------------------------------------------------------------
  // Test 4: Backend 400 (hata fırlatılır, localStorage'a yazılmaz)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Backend 400 Error Propagation & No LocalStorage ---');
  const listingRepo = new HttpListingRepository('https://mock-api.haradan.com', {
    upload: async () => ({ assetId: 'a-1', publicUrl: 'https://img.jpg' }),
  });

  mockApiResponses['/v1/me/adverts'] = {
    status: 201,
    body: { id: 'adv-test-400', version: 1, mediaVersion: 1, status: 'DRAFT' },
  };
  mockApiResponses['/v1/me/adverts/adv-test-400/properties'] = {
    status: 400,
    body: { code: 'VALIDATION', message: 'Bu kategori için tanımlı olmayan özellik.' },
  };

  let caught400 = false;
  try {
    const errorDraft = createEmptyDraft();
    errorDraft.type = pansiyonDraft.type;
    errorDraft.details.title = 'Test Başlık';
    errorDraft.details.properties = { invalidKey: 'bad' };
    await listingRepo.createDraft(errorDraft, 'mock-token');
  } catch (err: any) {
    caught400 = true;
    assert(err.status === 400 || err.message.includes('özellik') || err.code === 'VALIDATION', '400 Hatası fırlatıldı');
  }
  assert(caught400, 'createDraft 400 hatasında reject oldu (sessiz yutulmadı)');
  assert(!mockStorage['haradan_advert_properties_adv-test-400'], '400 hatasında localStorage yazılmadı');

  // -------------------------------------------------------------
  // Test 5: Backend 500 (hata fırlatılır, sessiz fallback yapılmaz)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Backend 500 Error Propagation ---');
  mockApiResponses['/v1/me/adverts'] = {
    status: 201,
    body: { id: 'adv-test-500', version: 1, mediaVersion: 1, status: 'DRAFT' },
  };
  mockApiResponses['/v1/me/adverts/adv-test-500/properties'] = {
    status: 500,
    body: { code: 'INTERNAL', message: 'Database connection error' },
  };

  let caught500 = false;
  try {
    const errorDraft = createEmptyDraft();
    errorDraft.type = pansiyonDraft.type;
    errorDraft.details.title = 'Test Başlık';
    errorDraft.details.properties = { someProp: 'val' };
    await listingRepo.createDraft(errorDraft, 'mock-token');
  } catch (err: any) {
    caught500 = true;
    assert(err.status === 500 || err.code === 'INTERNAL', '500 Hatası fırlatıldı');
  }
  assert(caught500, 'createDraft 500 hatasında reject oldu');
  assert(!mockStorage['haradan_advert_properties_adv-test-500'], '500 hatasında localStorage yazılmadı');

  // -------------------------------------------------------------
  // Test 6: Boolean Type (true/false boolean literal)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Strict Boolean Types ---');
  const boolDraft = createEmptyDraft();
  boolDraft.details.properties = {
    hasGrass: true,
    hasSand: false,
  };
  const boolProps = buildDraftProperties(boolDraft);
  assert(typeof boolProps.hasGrass === 'boolean' && boolProps.hasGrass === true, 'hasGrass boolean literal true');
  assert(typeof boolProps.hasSand === 'boolean' && boolProps.hasSand === false, 'hasSand boolean literal false');
  assert(boolProps.hasGrass !== 'true', 'hasGrass string "true" değil');

  // -------------------------------------------------------------
  // Test 7: Integer Type (5 number literal)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Strict Integer / Number Types ---');
  const numDraft = createEmptyDraft();
  numDraft.details.studAge = '5';
  numDraft.details.properties = {
    customCapacity: 24,
    customYear: 2021,
  };
  const numProps = buildDraftProperties(numDraft);
  assert(typeof numProps.studAge === 'number' && numProps.studAge === 5, 'studAge number literal 5');
  assert(typeof numProps.customCapacity === 'number' && numProps.customCapacity === 24, 'customCapacity number literal 24');
  assert(typeof numProps.customYear === 'number' && numProps.customYear === 2021, 'customYear number literal 2021');

  // -------------------------------------------------------------
  // Test 8: Select (option value direkt aktarılır)
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Single Select Option Value ---');
  const selectDraft = createEmptyDraft();
  selectDraft.details.studBreed = 'İngiliz';
  selectDraft.details.studCoatColor = 'Doru';
  selectDraft.details.properties = {
    HEATING_TYPE: 'NATURAL_GAS',
  };
  const selectProps = buildDraftProperties(selectDraft);
  assertEqual(selectProps.studBreed, 'İngiliz', 'studBreed option value aktarıldı');
  assertEqual(selectProps.studCoatColor, 'Doru', 'studCoatColor option value aktarıldı');
  assertEqual(selectProps.HEATING_TYPE, 'NATURAL_GAS', 'HEATING_TYPE option value aktarıldı');

  // -------------------------------------------------------------
  // Test 9: Category Change (eski kategori property'leri sıfırlanır)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Category Change Clears Old Properties ---');
  const catADraft = createEmptyDraft();
  catADraft.type = {
    categoryId: 'c1',
    categorySlug: 'pansiyon-haralar',
    categoryName: 'Pansiyon Haralar',
    parentSlug: 'at-hizmetleri',
  };
  catADraft.details.facilityGrassPaddock = true;
  catADraft.details.properties = { pansiyonSpecificField: 'valA' };

  // Simulate changing category to At Nakliyesi
  const catBDraft: ListingDraft = {
    ...catADraft,
    type: {
      categoryId: 'c2',
      categorySlug: 'at-nakliyesi',
      categoryName: 'At Nakliyesi',
      parentSlug: 'at-hizmetleri',
    },
    details: {
      ...catADraft.details,
      // cleared on category change
      properties: { transportSpecificField: 'valB' },
      facilityGrassPaddock: false,
      facilitySandPaddock: false,
    },
  };

  const bProps = buildDraftProperties(catBDraft);
  assertEqual(bProps.transportSpecificField, 'valB', 'Kategori B kendi özelliğini içeriyor');
  assert(!('pansiyonSpecificField' in bProps), 'Kategori A özel alanı Kategori Bye taşınmadı');
  assert(!('grassPaddock' in bProps), 'Kategori A padok özelliği Kategori Bye taşınmadı');

  console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
