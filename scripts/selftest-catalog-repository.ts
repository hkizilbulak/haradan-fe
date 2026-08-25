/**
 * HttpCatalogRepository Source of Truth self-test paketi.
 * Doğrulama senaryoları:
 * Test 1: DB/API'deki property'ler birebir alınır.
 * Test 2: Backend'de yeni property eklendiğinde FE güncel veriyi alır.
 * Test 3: Backend'den property kaldırıldığında mock fallback olmadan güncellenir.
 * Test 4: LocalStorage API response'unu ezemez veya merge edilemez.
 * Test 5: API 500/404 durumunda mock property'e düşülmez.
 * Test 6: Kategori değiştiğinde eski kategorinin property'leri taşınmaz.
 */

import { HttpCatalogRepository } from '../services/catalog/HttpCatalogRepository';

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

// Setup mock global fetch
(globalThis as any).fetch = async (url: string, init?: RequestInit) => {
  const urlStr = url.toString();
  // Match most specific route first
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
  console.log('\n--- HttpCatalogRepository Source of Truth Self-Tests ---');

  const repo = new HttpCatalogRepository('https://mock-api.haradan.com');

  const catAUUID = '11111111-1111-1111-1111-111111111111';
  const catBUUID = '22222222-2222-2222-2222-222222222222';

  mockApiResponses['/v1/categories'] = {
    status: 200,
    body: {
      items: [
        {
          id: catAUUID,
          slug: 'satilik-atlar',
          name: 'Satılık Atlar',
          sortOrder: 1,
          children: [
            {
              id: catBUUID,
              slug: 'satilik-yaris-ati',
              name: 'Satılık Yarış Atı',
              parentId: catAUUID,
              sortOrder: 1,
              children: [],
            },
          ],
        },
      ],
    },
  };

  // -------------------------------------------------------------
  // Test 1: DB/API'de kategori A'nın property'leri birebir alınır
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Exact DB/API Property Mapping ---');
  mockApiResponses[`/v1/categories/${catAUUID}/form`] = {
    status: 200,
    body: {
      categoryId: catAUUID,
      slug: 'satilik-atlar',
      name: 'Satılık Atlar',
      properties: [
        { id: 'p1', code: 'grassPaddock', title: 'Çim Padok', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 1, options: [] },
        { id: 'p2', code: 'sandPaddock', title: 'Kum Padok', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 2, options: [] },
        { id: 'p3', code: 'vet', title: 'Veteriner', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 3, options: [] },
      ],
    },
  };

  const defA = await repo.getCategoryFormDefinition(catAUUID, { fresh: true });
  assert(defA !== null, 'Kategori A form tanımı döndü');
  assertEqual(defA?.properties.length, 3, 'Tam 3 property döndü');
  assertEqual(defA?.properties[0].code, 'grassPaddock', '1. property grassPaddock');
  assertEqual(defA?.properties[1].code, 'sandPaddock', '2. property sandPaddock');
  assertEqual(defA?.properties[2].code, 'vet', '3. property vet');

  // -------------------------------------------------------------
  // Test 2: Backend'de yeni property eklendiğinde FE güncel veriyi alır
  // -------------------------------------------------------------
  console.log('\n--- Test 2: New Property From Backend Appears Dynamically ---');
  mockApiResponses[`/v1/categories/${catAUUID}/form`] = {
    status: 200,
    body: {
      categoryId: catAUUID,
      slug: 'satilik-atlar',
      name: 'Satılık Atlar',
      properties: [
        { id: 'p1', code: 'grassPaddock', title: 'Çim Padok', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 1, options: [] },
        { id: 'p2', code: 'sandPaddock', title: 'Kum Padok', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 2, options: [] },
        { id: 'p3', code: 'vet', title: 'Veteriner', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 3, options: [] },
        { id: 'p4', code: 'newDynamicProp', title: 'Yeni Özellik', dataType: 'STRING', isRequired: false, isFilterable: true, sortOrder: 4, options: [] },
      ],
    },
  };

  const defAUpdated = await repo.getCategoryFormDefinition(catAUUID, { fresh: true });
  assertEqual(defAUpdated?.properties.length, 4, 'Yeni eklenen özellik ile 4 property oldu');
  assertEqual(defAUpdated?.properties[3].code, 'newDynamicProp', 'Yeni özellik dinamik olarak listeye geldi');

  // -------------------------------------------------------------
  // Test 3: Backend'den property kaldırıldığında mock fallback olmadan güncellenir
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Removed Property Does Not Reappear Via Mock ---');
  mockApiResponses[`/v1/categories/${catAUUID}/form`] = {
    status: 200,
    body: {
      categoryId: catAUUID,
      slug: 'satilik-atlar',
      name: 'Satılık Atlar',
      properties: [
        { id: 'p1', code: 'grassPaddock', title: 'Çim Padok', dataType: 'BOOLEAN', isRequired: false, isFilterable: true, sortOrder: 1, options: [] },
      ],
    },
  };

  const defAReduced = await repo.getCategoryFormDefinition(catAUUID, { fresh: true });
  assertEqual(defAReduced?.properties.length, 1, 'Kaldırılan alanlar mocktan geri gelmedi, 1 property kaldı');
  assertEqual(defAReduced?.properties[0].code, 'grassPaddock', 'Yalnızca kalan property döndü');

  // -------------------------------------------------------------
  // Test 4: LocalStorage API response'unu ezemez veya merge edilemez
  // -------------------------------------------------------------
  console.log('\n--- Test 4: LocalStorage Cannot Override or Pollute API ---');
  mockStorage[`haradan_category_properties_${catAUUID}`] = JSON.stringify([
    { code: 'corruptLocalStorageProp', title: 'Sahte LS Özelliği', dataType: 'STRING' },
  ]);
  mockStorage['haradan_category_properties_satilik-atlar'] = JSON.stringify([
    { code: 'anotherCorruptProp', title: 'Sahte LS 2', dataType: 'STRING' },
  ]);

  const defALS = await repo.getCategoryFormDefinition(catAUUID, { fresh: true });
  const hasCorrupt = defALS?.properties.some((p) => p.code.includes('Corrupt') || p.code.includes('corrupt'));
  assert(!hasCorrupt, 'LocalStorage içeriği API sonucuna sızmadı');
  assertEqual(defALS?.properties.length, 1, 'API sonucu localStorage tarafından ezilmedi');

  // -------------------------------------------------------------
  // Test 5: API 500/404 durumunda mock property listesine düşülmez
  // -------------------------------------------------------------
  console.log('\n--- Test 5: API Error Does Not Fall Back to Mock Properties ---');
  const catErrorUUID = '99999999-9999-9999-9999-999999999999';
  mockApiResponses[`/v1/categories/${catErrorUUID}/form`] = {
    status: 500,
    body: { error: 'Internal server error' },
  };

  try {
    const errDef = await repo.getCategoryFormDefinition(catErrorUUID, { fresh: true });
    assert(errDef === null, 'API hatasında mock property üretilmedi, null döndü');
  } catch (err) {
    assert(true, 'API hatası fırlatıldı ve mock ile maskelenmedi');
  }

  // -------------------------------------------------------------
  // Test 6: Kategori değiştiğinde eski kategorinin property'leri taşınmaz
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Category Switch Does Not Leak Old Properties ---');
  mockApiResponses[`/v1/categories/${catBUUID}/form`] = {
    status: 200,
    body: {
      categoryId: catBUUID,
      slug: 'satilik-yaris-ati',
      name: 'Satılık Yarış Atı',
      properties: [
        { id: 'pb1', code: 'trackRecord', title: 'Derece', dataType: 'STRING', isRequired: false, isFilterable: true, sortOrder: 1, options: [] },
      ],
    },
  };

  const defB = await repo.getCategoryFormDefinition(catBUUID, { fresh: true });
  assertEqual(defB?.properties.length, 1, 'Kategori B kendi property setine sahip');
  assertEqual(defB?.properties[0].code, 'trackRecord', 'Kategori B sadece trackRecord içeriyor');
  const hasAProps = defB?.properties.some((p) => p.code === 'grassPaddock' || p.code === 'sandPaddock');
  assert(!hasAProps, 'Kategori A propertyleri Kategori Bye taşınmadı');

  console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
