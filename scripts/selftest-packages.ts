/**
 * Live packages catalog self-test.
 * Çalıştır: npm run selftest:packages
 */
import { resolveApiBaseUrl } from '../services/http/apiConfig';
import { mapPublicPackage, type PublicPackage } from '../services/listing/mapPackage';

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

  const res = await fetch(`${baseUrl}/v1/packages`);
  assertEqual(res.status, 200, 'GET /v1/packages status');
  const body = (await res.json()) as { items: PublicPackage[] };
  const items = (body.items ?? []).map(mapPublicPackage);
  assertEqual(items.length, 3, 'exactly 3 public packages');

  const byCode = Object.fromEntries(items.map((p) => [p.code, p]));
  assert(Boolean(byCode.STANDARD), 'STANDARD present');
  assert(Boolean(byCode.PREMIUM), 'PREMIUM present');
  assert(Boolean(byCode.ULTIMATE), 'ULTIMATE present');

  assertEqual(byCode.STANDARD?.name, 'Standart', 'Standart name');
  assertEqual(byCode.STANDARD?.price.amountMinor, 25000, 'Standart ₺250');
  assertEqual(byCode.STANDARD?.durationDays, 30, 'Standart 30 gün');
  assertEqual(byCode.STANDARD?.highlighted, false, 'Standart not highlighted');

  assertEqual(byCode.PREMIUM?.name, 'Premium', 'Premium name');
  assertEqual(byCode.PREMIUM?.price.amountMinor, 65000, 'Premium ₺650');
  assertEqual(byCode.PREMIUM?.durationDays, 45, 'Premium 45 gün');
  assertEqual(byCode.PREMIUM?.highlighted, true, 'Premium Önerilen');
  assertEqual(byCode.PREMIUM?.tagline, 'Daha fazla görünürlük', 'Premium tagline');
  assert(
    (body.items.find((p) => p.code === 'PREMIUM')?.featuredDays ?? null) === 7,
    'Premium featuredDays=7 from BE'
  );
  assert(
    (body.items.find((p) => p.code === 'ULTIMATE')?.featuredDays ?? null) === 30,
    'Ultimate featuredDays=30 from BE'
  );
  assert(
    (body.items.find((p) => p.code === 'STANDARD')?.featuredDays ?? null) == null,
    'Standard has no featuredDays'
  );

  assertEqual(byCode.ULTIMATE?.name, 'Ultimate', 'Ultimate name');
  assertEqual(byCode.ULTIMATE?.price.amountMinor, 125000, 'Ultimate ₺1250');
  assertEqual(byCode.ULTIMATE?.durationDays, 60, 'Ultimate 60 gün');
  assert(
    (byCode.ULTIMATE?.features ?? []).every((f) => f.included),
    'Ultimate all features included'
  );
  assert(
    (byCode.STANDARD?.features ?? []).some((f) => !f.included),
    'Standart has excluded features'
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
