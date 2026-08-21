/**
 * Self-test: PayTR checkout feature flag defaults OFF.
 * Run: npx tsx scripts/selftest-paytr-flag.ts
 */
import { isPaytrCheckoutEnabled } from '../constants/Paytr';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const prev = process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED;

delete process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED;
assert(!isPaytrCheckoutEnabled(), 'default off when unset');

process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED = '0';
assert(!isPaytrCheckoutEnabled(), '0 is off');

process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED = 'false';
assert(!isPaytrCheckoutEnabled(), 'false is off');

process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED = '1';
assert(isPaytrCheckoutEnabled(), '1 is on');

process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED = 'true';
assert(isPaytrCheckoutEnabled(), 'true is on');

if (prev === undefined) delete process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED;
else process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED = prev;

console.log('selftest-paytr-flag: ok');
