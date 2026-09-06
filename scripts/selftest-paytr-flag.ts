/**
 * Self-test: PayTR flag is env-driven; package step stays on.
 * Run: npm run selftest:paytr-flag
 *
 * Default (no env): checkout OFF.
 * With EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED=1: checkout ON.
 */
import {
  DEFAULT_LISTING_PACKAGE_CODE,
  isListingPackageStepEnabled,
  isPaytrCheckoutEnabled,
} from '../constants/Paytr';

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

const raw = String(process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED ?? '').trim();
const expectOn = raw === '1';

assert(isListingPackageStepEnabled(), 'package step enabled');
assert(DEFAULT_LISTING_PACKAGE_CODE === 'STANDARD', 'default package STANDARD');
assert(
  isPaytrCheckoutEnabled() === expectOn,
  `PayTR checkout matches env (enabled=${expectOn}, raw=${JSON.stringify(raw)})`
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
