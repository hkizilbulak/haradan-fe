/**
 * Canlı BE geo self-test: GET /v1/provinces + ilçe listesi.
 * Çalıştır: npm run selftest:geo
 */
import { resolveApiBaseUrl } from '../services/http/apiConfig';
import { HttpLocationLookup } from '../services/location/HttpLocationLookup';

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

async function main(): Promise<void> {
  const baseUrl =
    resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL) ??
    resolveApiBaseUrl('http://localhost:8080');
  if (!baseUrl) {
    console.error('FAIL API base URL missing');
    process.exit(1);
  }

  const geo = new HttpLocationLookup(baseUrl);
  const provinces = await geo.listProvinces();
  assertEqual(provinces.length, 81, '81 provinces from live catalog');
  assert(
    provinces.every((p) => p.id && p.name),
    'each province has id and name'
  );
  const istanbul = provinces.find((p) => p.name === 'İstanbul');
  assert(Boolean(istanbul), 'İstanbul is in the catalog');
  if (istanbul) {
    const districts = await geo.listDistricts(istanbul.id);
    assert(districts.length >= 10, `İstanbul districts (${districts.length})`);
    assert(
      districts.every((d) => d.provinceId === istanbul.id && d.name),
      'districts belong to İstanbul'
    );
  }

  const ankara = provinces.find((p) => p.name === 'Ankara');
  assert(Boolean(ankara), 'Ankara is in the catalog');
  if (ankara && istanbul) {
    assert(ankara.id !== istanbul.id, 'province ids are distinct');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
