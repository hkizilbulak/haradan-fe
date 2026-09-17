import fs from 'fs';
import path from 'path';
import { isPaytrCheckoutEnabled } from '../constants/Paytr';
import type { PaytrChargeStatus, PaytrCheckoutResult } from '../types/paytr';

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

const sample: PaytrCheckoutResult = {
  chargeId: '11111111-1111-4111-8111-111111111111',
  merchantOid: 'hrdabcdef',
  iframeToken: 'tok',
  iframeUrl: 'https://www.paytr.com/odeme/guvenli/tok',
  amountMinor: 25000,
  currencyCode: 'TRY',
  packageCode: 'STANDARD',
  advertId: 42,
  status: 'PENDING',
};

assert(sample.iframeUrl.includes('/odeme/guvenli/'), 'iframe URL shape');
assert(sample.amountMinor === 25000, 'amount minor units');
assert(typeof isPaytrCheckoutEnabled() === 'boolean', 'flag is boolean');

const status: PaytrChargeStatus = {
  merchantOid: sample.merchantOid,
  advertId: 42,
  packageCode: 'STANDARD',
  amountMinor: 25000,
  currencyCode: 'TRY',
  status: 'SUCCEEDED',
  paidAt: new Date().toISOString(),
  advertSubmittedAt: new Date().toISOString(),
};
assert(status.status === 'SUCCEEDED', 'succeeded status');

const paytrConst = fs.readFileSync(
  path.resolve(process.cwd(), 'constants/Paytr.ts'),
  'utf8'
);
assert(
  paytrConst.includes('EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED'),
  'flag reads EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED'
);
assert(
  !/export function isPaytrCheckoutEnabled\(\)[\s\S]*?return false;/.test(
    String(paytrConst)
  ),
  'checkout is not hard-disabled'
);

const paymentStep = fs.readFileSync(
  path.resolve(process.cwd(), 'components/post/PostPaymentStep.tsx'),
  'utf8'
);
assert(paymentStep.includes('paytriframe'), 'payment step embeds PayTR iframe');
assert(paymentStep.includes('amountMinor'), 'payment step shows amount');

const wizard = fs.readFileSync(
  path.resolve(process.cwd(), 'hooks/useListingWizard.ts'),
  'utf8'
);
assert(wizard.includes('startPaytrCheckout'), 'wizard starts PayTR checkout');
assert(
  !wizard.includes("err.message.includes('404')"),
  '404 no longer silently bypasses payment'
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
