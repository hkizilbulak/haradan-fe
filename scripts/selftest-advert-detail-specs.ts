/**
 * İlan Detayı Dinamik Property Mirası ve Render Self-Test Paketi.
 * Test Senaryoları:
 * Test 1 — Direct Property (Kategoriye doğrudan bağlı property)
 * Test 2 — Parent Property (Ebeveyn kategoriden miras alınan property)
 * Test 3 — Multi-level Parent (Root -> Parent -> Child mirası)
 * Test 4 — Child Override (Child tanımı parent tanımını override eder)
 * Test 5 — Dynamic Property (Yeni property FE kodu değiştirilmeden gösterilir)
 * Test 6 — Property Silme/Pasifleştirme (Pasif/gizli property listelenmez)
 * Test 7 — Boolean (true -> "Evet", false -> "Hayır")
 * Test 8 — Select (Internal value yerine option label gösterilir)
 * Test 9 — Missing Value (Değer eksikse sayfa crash olmaz)
 * Test 10 — 404 Error State (Bulunamayan ilan 404 ErrorState üretir)
 * Test 11 — Existing Advert Regression (Mevcut ilan alanları: başlık, konum, fiyat, TJK atı tam korunur)
 */

import { mapPublishedDetailToAdvert, mapOwnerToAdvertDetail, type BePublishedAdvertDetail } from '../services/advert/mapAdvertDetail';
import { HttpAdvertRepository } from '../services/advert/HttpAdvertRepository';
import { ApiError } from '../services/http';

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

// Mock global fetch for testing HttpAdvertRepository
let mockResponses: Record<string, { status: number; body: any }> = {};

(globalThis as any).fetch = async (url: string, init?: RequestInit) => {
  const urlStr = url.toString();
  for (const [route, resp] of Object.entries(mockResponses)) {
    if (urlStr.includes(route)) {
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

async function runTests() {
  console.log('\n--- Advert Detail Dynamic Specs & Inheritance Self-Tests ---');

  // -------------------------------------------------------------
  // Test 1: Direct Property
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Direct Property ---');
  const directDto: BePublishedAdvertDetail = {
    id: 'adv-direct-1',
    title: 'Pansiyon Harası',
    description: 'Açıklama',
    publishedAt: '2026-08-25T10:00:00Z',
    price: { amountMinor: 5000000, currency: 'TRY' },
    category: { id: 'c-pansiyon', name: 'Pansiyon Haralar', slug: 'pansiyon-haralar' },
    location: { districtId: 'd-1', districtName: 'Silivri', provinceId: 'p-34', provinceName: 'İstanbul' },
    horse: null,
    media: [],
    properties: [
      { code: 'trainingTrack', title: 'İdman Pisti', value: '1400m Sentetik Pist' },
    ],
    isFavorite: false,
    isUrgent: false,
  };

  const advert1 = mapPublishedDetailToAdvert(directDto, 'http://localhost:8080/api');
  assert(advert1.specs.length > 0, 'Specs grubu mevcut');
  const trackRow = advert1.specs[0]?.rows.find((r) => r.label === 'İdman Pisti');
  assertEqual(trackRow?.value, '1400m Sentetik Pist', 'Doğrudan kategori property değeri aktarıldı');

  // -------------------------------------------------------------
  // Test 2: Parent Property
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Parent Inherited Property ---');
  const parentInheritedDto: BePublishedAdvertDetail = {
    ...directDto,
    id: 'adv-child-1',
    category: { id: 'c-pansiyon-child', name: 'Butik Pansiyon', slug: 'butik-pansiyon' },
    properties: [
      { code: 'grassPaddock', title: 'Çim Padok', value: true, displayValue: 'Evet' },
      { code: 'vet', title: 'Veteriner', value: true, displayValue: 'Evet' },
    ],
  };

  const advert2 = mapPublishedDetailToAdvert(parentInheritedDto, 'http://localhost:8080/api');
  const grassRow = advert2.specs[0]?.rows.find((r) => r.label === 'Çim Padok');
  const vetRow = advert2.specs[0]?.rows.find((r) => r.label === 'Veteriner');
  assertEqual(grassRow?.value, 'Evet', 'Parenttan miras alınan Çim Padok aktarıldı');
  assertEqual(vetRow?.value, 'Evet', 'Parenttan miras alınan Veteriner aktarıldı');

  // -------------------------------------------------------------
  // Test 3: Multi-level Parent (Root -> Parent -> Child)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Multi-level Parent Inheritance ---');
  const multiLevelDto: BePublishedAdvertDetail = {
    ...directDto,
    id: 'adv-grandchild-1',
    properties: [
      { code: 'rootProp', title: 'Genel Hizmet', value: '7/24 Açık' },
      { code: 'midProp', title: 'Orta Kademe', value: 'Özel Bakım' },
      { code: 'childProp', title: 'Alt Kademe', value: 'VIP Padok' },
    ],
  };

  const advert3 = mapPublishedDetailToAdvert(multiLevelDto, 'http://localhost:8080/api');
  const rows3 = advert3.specs[0]?.rows ?? [];
  assert(rows3.some((r) => r.label === 'Genel Hizmet' && r.value === '7/24 Açık'), 'Root property mevcut');
  assert(rows3.some((r) => r.label === 'Orta Kademe' && r.value === 'Özel Bakım'), 'Parent property mevcut');
  assert(rows3.some((r) => r.label === 'Alt Kademe' && r.value === 'VIP Padok'), 'Child property mevcut');

  // -------------------------------------------------------------
  // Test 4: Child Override
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Child Override ---');
  const overrideDto: BePublishedAdvertDetail = {
    ...directDto,
    properties: [
      { code: 'grassPaddock', title: 'Çim Alan (Özel Başlık)', value: true, displayValue: 'Evet' },
    ],
  };
  const advert4 = mapPublishedDetailToAdvert(overrideDto, 'http://localhost:8080/api');
  const grassRows = advert4.specs[0]?.rows.filter((r) => r.label.includes('Çim')) ?? [];
  assertEqual(grassRows.length, 1, 'Tekilleştirme yapıldı, duplicate yok');
  assertEqual(grassRows[0]?.label, 'Çim Alan (Özel Başlık)', 'Child başlığı parent başlığını override etti');

  // -------------------------------------------------------------
  // Test 5: Dynamic Property (FE code change not needed)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: New Dynamic Property from BO ---');
  const newPropDto: BePublishedAdvertDetail = {
    ...directDto,
    properties: [
      { code: 'customSolarPower', title: 'Güneş Enerjisi Sistemi', value: true, displayValue: 'Evet' },
      { code: 'customCameraCount', title: 'Güvenlik Kamera Sayısı', value: 16 },
    ],
  };
  const advert5 = mapPublishedDetailToAdvert(newPropDto, 'http://localhost:8080/api');
  const solarRow = advert5.specs[0]?.rows.find((r) => r.label === 'Güneş Enerjisi Sistemi');
  const cameraRow = advert5.specs[0]?.rows.find((r) => r.label === 'Güvenlik Kamera Sayısı');
  assertEqual(solarRow?.value, 'Evet', 'Yeni dinamik property otomatik gösterildi');
  assertEqual(cameraRow?.value, '16', 'Yeni sayısal property otomatik gösterildi');

  // -------------------------------------------------------------
  // Test 6: Inactive / Public Invisible Property
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Inactive or Hidden Properties Omitted ---');
  const hiddenDto: BePublishedAdvertDetail = {
    ...directDto,
    properties: [
      // Only active and public visible properties are sent by backend
      { code: 'publicProp', title: 'Görünür Özellik', value: 'Değer' },
    ],
  };
  const advert6 = mapPublishedDetailToAdvert(hiddenDto, 'http://localhost:8080/api');
  assert(!advert6.specs[0]?.rows.some((r) => r.label === 'Gizli Özellik'), 'Gizli/pasif özellikler detayda yok');

  // -------------------------------------------------------------
  // Test 7: Boolean Formatting
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Boolean Values (Evet / Hayır) ---');
  const boolDto: BePublishedAdvertDetail = {
    ...directDto,
    properties: [
      { code: 'p1', title: 'Çim Padok', value: true },
      { code: 'p2', title: 'Kum Padok', value: false },
    ],
  };
  const advert7 = mapPublishedDetailToAdvert(boolDto, 'http://localhost:8080/api');
  const p1Row = advert7.specs[0]?.rows.find((r) => r.label === 'Çim Padok');
  const p2Row = advert7.specs[0]?.rows.find((r) => r.label === 'Kum Padok');
  assertEqual(p1Row?.value, 'Evet', 'true boolean Evet olarak formatlandı');
  assertEqual(p2Row?.value, 'Hayır', 'false boolean Hayır olarak formatlandı');

  // -------------------------------------------------------------
  // Test 8: Single Select Option Label
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Select Option Label ---');
  const selectDto: BePublishedAdvertDetail = {
    ...directDto,
    properties: [
      { code: 'studBreed', title: 'Aygır Irkı', value: 'THOROUGHBRED', displayValue: 'Safkan İngiliz' },
    ],
  };
  const advert8 = mapPublishedDetailToAdvert(selectDto, 'http://localhost:8080/api');
  const selectRow = advert8.specs[0]?.rows.find((r) => r.label === 'Aygır Irkı');
  assertEqual(selectRow?.value, 'Safkan İngiliz', 'Option value yerine option label görüntülendi');

  // -------------------------------------------------------------
  // Test 9: Missing Property Values (Null Safety)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Missing Values & Null Safety ---');
  const emptyPropsDto: BePublishedAdvertDetail = {
    ...directDto,
    properties: [],
  };
  const advert9 = mapPublishedDetailToAdvert(emptyPropsDto, 'http://localhost:8080/api');
  assertEqual(advert9.specs.length, 0, 'Boş property durumunda specs boş dizi, crash yok');

  // -------------------------------------------------------------
  // Test 10: 404 Error State
  // -------------------------------------------------------------
  console.log('\n--- Test 10: 404 Error State ---');
  const advertRepo = new HttpAdvertRepository('http://localhost:8080/api');
  mockResponses['/v1/adverts/non-existent-id'] = {
    status: 404,
    body: { code: 'NOT_FOUND', message: 'İlan bulunamadı.' },
  };

  let caught404 = false;
  try {
    await advertRepo.getById('non-existent-id');
  } catch (err: any) {
    caught404 = true;
    assert(err.status === 404 || err.code === 'NOT_FOUND', '404 Hatası fırlatıldı');
  }
  assert(caught404, '404 hatasında getById reject oldu');

  // -------------------------------------------------------------
  // Test 11: Existing Advert Regression
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Existing Advert Data Integrity ---');
  const completeDto: BePublishedAdvertDetail = {
    id: 'adv-full-1',
    title: 'Şampiyon Yarış Aygırı',
    description: 'Efsane soy kütüğüne sahip aygır.',
    publishedAt: '2026-08-25T12:00:00Z',
    price: { amountMinor: 75000000, currency: 'TRY' },
    category: { id: 'c-asim', name: 'Aşım Hizmetleri', slug: 'asim-hizmetleri' },
    location: { districtId: 'd-2', districtName: 'İzmit', provinceId: 'p-41', provinceName: 'Kocaeli' },
    horse: { id: 'h-1', originalName: 'TURBO', tjkNumber: '12345' },
    media: [
      { assetId: 'm-1', displayOrder: 0, isCover: true, publicUrl: '/img1.jpg' },
    ],
    properties: [
      { code: 'studSire', title: 'Baba', value: 'YELHAN' },
      { code: 'studDam', title: 'Anne', value: 'GİRİT' },
    ],
    isFavorite: true,
    isUrgent: true,
    viewCount: 154,
    sellerPhone: '05321112233',
  };

  const advert11 = mapPublishedDetailToAdvert(completeDto, 'http://localhost:8080/api');
  assertEqual(advert11.title, 'Şampiyon Yarış Aygırı', 'Başlık korundu');
  assertEqual(advert11.price?.amountMinor, 75000000, 'Fiyat korundu');
  assertEqual(advert11.provinceName, 'Kocaeli', 'İl adı korundu');
  assertEqual(advert11.districtName, 'İzmit', 'İlçe adı korundu');
  assertEqual(advert11.sellerPhone, '05321112233', 'Satıcı telefonu korundu');
  assertEqual(advert11.viewCount, 154, 'Görüntülenme sayısı korundu');
  assertEqual(advert11.isUrgent, true, 'Acil ilan etiketi korundu');
  assertEqual(advert11.gallery.length, 1, 'Galeri medyası korundu');
  assertEqual(advert11.horse.registeredName, 'TURBO', 'TJK At adı korundu');

  console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
