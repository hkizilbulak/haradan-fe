import fs from 'fs';
import path from 'path';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok  ${msg}`);
}

console.log('--- Testing Ekuri Wizard Stepper, Payment and Review (Gönder) Steps ---');

const ekuriFilePath = path.join(__dirname, '../components/post/PostEkuriWizardView.tsx');
const ekuriContent = fs.readFileSync(ekuriFilePath, 'utf8');

// 1. Check Stepper has 4 steps: İlanlar, Paket, Ödeme, Gönder
assert(ekuriContent.includes("step === 'listings'"), 'Stepper handles listings step');
assert(ekuriContent.includes("step === 'package'"), 'Stepper handles package step');
assert(ekuriContent.includes("step === 'checkout'"), 'Stepper handles checkout step');
assert(ekuriContent.includes("step === 'success'"), 'Stepper handles success (Gönder) step');
assert(ekuriContent.includes('İlanlar ({items.length}/10)'), 'Stepper displays İlanlar step');
assert(ekuriContent.includes('Paket\n            </Text>') || ekuriContent.includes('Paket</Text>') || ekuriContent.includes('>Paket<') || /Paket\s*<\/Text>/.test(ekuriContent), 'Stepper displays Paket step');
assert(ekuriContent.includes('Ödeme\n            </Text>') || ekuriContent.includes('Ödeme</Text>') || ekuriContent.includes('>Ödeme<') || /Ödeme\s*<\/Text>/.test(ekuriContent), 'Stepper displays Ödeme step');
assert(ekuriContent.includes('Gönder\n            </Text>') || ekuriContent.includes('Gönder</Text>') || ekuriContent.includes('>Gönder<') || /Gönder\s*<\/Text>/.test(ekuriContent), 'Stepper displays Gönder step');

// 2. Check Ödeme (Checkout) step has single-listing-parity Sipariş Özeti & payment methods
assert(ekuriContent.includes('styles.summaryBox'), 'Checkout renders summaryBox (Sipariş Özeti)');
assert(ekuriContent.includes('>Sipariş Özeti<'), 'Checkout renders Sipariş Özeti title');
assert(ekuriContent.includes('styles.methodToggle'), 'Checkout renders methodToggle for payment methods');
assert(ekuriContent.includes('Online Ödeme'), 'Checkout includes Online Ödeme (PayTR)');
assert(ekuriContent.includes('Havale / EFT'), 'Checkout includes Havale / EFT option');
assert(ekuriContent.includes('getActiveBankAccounts'), 'Checkout integrates getActiveBankAccounts');
assert(ekuriContent.includes('copyToClipboard'), 'Checkout provides copyToClipboard for IBAN & Bundle ID');

// 3. Check Pakete Dahil İlanlar is removed from Checkout for clean single-listing-like layout
assert(!ekuriContent.includes('Pakete Dahil İlanlar'), 'Checkout does not include redundant Pakete Dahil İlanlar section');

// 4. Check Step 4 (Gönder / Inceleme) modeled after PostReviewStep
assert(ekuriContent.includes('styles.reviewContainer'), 'Step 4 renders reviewContainer');
assert(ekuriContent.includes('styles.reviewHero'), 'Step 4 renders reviewHero with halo icon');
assert(ekuriContent.includes('Eküri İlanlarınız İncelemeye Alındı'), 'Step 4 shows success title');
assert(ekuriContent.includes('styles.reviewCard'), 'Step 4 renders reviewCard');
assert(ekuriContent.includes('Eküri Grup No'), 'Step 4 shows Eküri Grup No');
assert(ekuriContent.includes('İncelemede'), 'Step 4 displays İncelemede status badge');
assert(ekuriContent.includes('İlanlarıma Git'), 'Step 4 provides action button to navigate to my-listings');
assert(ekuriContent.includes('Yeni Eküri İlanı'), 'Step 4 provides action button to start new bundle');

console.log('\nAll Ekuri wizard tests passed successfully!');
