import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- Testing PostStepper & Payment Step Changes ---');

// 1. PostStepper checks
const stepperFile = fs.readFileSync(
  path.resolve(process.cwd(), 'components/post/PostStepper.tsx'),
  'utf8'
);

assert(
  !stepperFile.includes("i.key === 'payment' && !isPaytrCheckoutEnabled()"),
  'PostStepper should not filter out payment with isPaytrCheckoutEnabled'
);
assert(
  stepperFile.includes("i.key === 'payment' && !isListingPackageStepEnabled()"),
  'PostStepper filters payment with isListingPackageStepEnabled'
);
console.log('ok  PostStepper includes payment step whenever package step is enabled');

// 2. useListingWizard steps check
const wizardFile = fs.readFileSync(
  path.resolve(process.cwd(), 'hooks/useListingWizard.ts'),
  'utf8'
);
assert(
  wizardFile.replace(/\r\n/g, '\n').includes('function wizardSteps(): ListingWizardStep[] {\n  if (!isListingPackageStepEnabled()) return STEPS_DIRECT;\n  return STEPS_FULL;\n}'),
  'wizardSteps returns STEPS_FULL whenever packages are enabled'
);
console.log('ok  useListingWizard wizardSteps includes STEPS_FULL (including payment)');

// 3. PostPackagesStep should NOT include summaryBox
const packagesStepFile = fs.readFileSync(
  path.resolve(process.cwd(), 'components/post/PostPackagesStep.tsx'),
  'utf8'
);
assert(
  !packagesStepFile.includes('summaryBox'),
  'PostPackagesStep should NOT contain summaryBox anymore'
);
assert(
  !packagesStepFile.includes('Sipariş Özeti'),
  'PostPackagesStep should NOT contain Sipariş Özeti anymore'
);
console.log('ok  PostPackagesStep removed summaryBox / Sipariş Özeti from bottom of packages page');

// 4. PostPaymentStep should include summaryBox and Sipariş Özeti
const paymentStepFile = fs.readFileSync(
  path.resolve(process.cwd(), 'components/post/PostPaymentStep.tsx'),
  'utf8'
);
assert(
  paymentStepFile.includes('summaryBox'),
  'PostPaymentStep contains summaryBox'
);
assert(
  paymentStepFile.includes('Sipariş Özeti'),
  'PostPaymentStep contains Sipariş Özeti'
);
assert(
  paymentStepFile.includes('packagePriceMinor'),
  'PostPaymentStep supports packagePriceMinor'
);
assert(
  paymentStepFile.includes('Seçilen Paket'),
  'PostPaymentStep displays Seçilen Paket'
);
assert(
  paymentStepFile.includes('Paket Fiyatı'),
  'PostPaymentStep displays Paket Fiyatı'
);
assert(
  paymentStepFile.includes('Toplam Ödenecek'),
  'PostPaymentStep displays Toplam Ödenecek'
);
console.log('ok  PostPaymentStep includes rich Sipariş Özeti order summary box');

console.log('\nAll tests passed successfully!');
