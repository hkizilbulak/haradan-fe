/**
 * Mobil İlanlarım — layout, sekmeler, dock inset, geniş-only AppHeader.
 * Çalıştır: npx tsx scripts/selftest-my-listings-mobile.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mobileDockScrollInset, shouldShowMobileDock } from '../constants/Layout';
import { MY_LISTING_TABS } from '../services/my-listings/statusTabs';

const root = process.cwd();
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

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

console.log('── my-listings mobile files ──');
const mobileTabs = 'components/my-listings/mobile/MobileMyListingsTabs.tsx';
assert(existsSync(join(root, mobileTabs)), 'MobileMyListingsTabs exists');

const tabsSrc = read(mobileTabs);
assert(tabsSrc.includes('MY_LISTING_TABS'), 'tabs use shared tab config');
assert(tabsSrc.includes('accessibilityRole="tab"'), 'tabs a11y role');
assert(MY_LISTING_TABS.length === 5, 'five status tabs');

console.log('\n── screen shell ──');
const screenSrc = read('app/my-listings/index.tsx');
assert(screenSrc.includes('useIsWideLayout'), 'screen uses wide layout hook');
assert(screenSrc.includes('isWide ?'), 'conditional AppHeader');
assert(
  screenSrc.includes("edges={isWide ? ['left', 'right', 'bottom'] : ['left', 'right']}"),
  'mobile top inset via header'
);

console.log('\n── view mobile branch ──');
const viewSrc = read('components/my-listings/MyListingsView.tsx');
assert(viewSrc.includes('MobileScreenHeader'), 'view mobile header');
assert(viewSrc.includes('MobileMyListingsTabs'), 'view mobile tabs');
assert(viewSrc.includes('mobileDockScrollInset'), 'view dynamic dock pad');
assert(viewSrc.includes('useSafeInsets'), 'view uses safe insets hook');
assert(viewSrc.includes('compact={!isWide}'), 'compact cards on mobile');
assert(viewSrc.includes('onBack={() => router.back()}'), 'back navigation');
assert(viewSrc.includes('!isWide'), 'mobile branch guard');

console.log('\n── dock visibility ──');
assert(shouldShowMobileDock('/my-listings'), 'dock visible on my-listings');
assert(!shouldShowMobileDock('/my-listings/edit/adv-123'), 'dock hidden on edit screen');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
