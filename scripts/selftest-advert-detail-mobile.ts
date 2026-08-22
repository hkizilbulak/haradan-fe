/**
 * Mobil ilan detay self-test.
 * Çalıştır: npx tsx scripts/selftest-advert-detail-mobile.ts
 */
import {
  MOBILE_DETAIL_STICKY_BAR_HEIGHT,
  MOBILE_DOCK_BAR_HEIGHT,
  mobileDetailScrollInset,
  shouldShowMobileDock,
} from '../constants/Layout';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

assert(
  mobileDetailScrollInset(0) ===
    MOBILE_DOCK_BAR_HEIGHT + 8 + 8 + MOBILE_DETAIL_STICKY_BAR_HEIGHT + 12,
  'dynamic scroll inset baseline'
);
assert(shouldShowMobileDock('/advert/abc'), 'dock visible on advert detail');

const root = join(process.cwd(), 'components/advert-detail');
const mobileFiles = [
  'mobile/MobileAdvertTopBar.tsx',
  'mobile/MobileAdvertStickyBar.tsx',
];

for (const f of mobileFiles) {
  assert(existsSync(join(root, f)), `file exists ${f}`);
}

const viewSrc = readFileSync(join(root, 'AdvertDetailView.tsx'), 'utf8');
assert(viewSrc.includes('MobileAdvertTopBar'), 'detail view uses top bar');
assert(viewSrc.includes('MobileAdvertStickyBar'), 'detail view uses sticky bar');
assert(viewSrc.includes('fullBleed'), 'detail view uses full-bleed gallery');
assert(viewSrc.includes('variant="mobile"'), 'detail view mobile buy box');
assert(viewSrc.includes('mobileDetailScrollInset'), 'detail dynamic scroll inset');

const screenSrc = readFileSync(
  join(process.cwd(), 'app/advert/[id].tsx'),
  'utf8'
);
assert(screenSrc.includes('isWide ?'), 'AppHeader conditional on wide');
assert(screenSrc.includes('variant="mobile"'), 'mobile skeleton on load');

const buyBoxSrc = readFileSync(join(root, 'AdvertBuyBox.tsx'), 'utf8');
assert(buyBoxSrc.includes("variant?: 'default' | 'mobile'"), 'buy box variant prop');

const topBarSrc = readFileSync(join(root, 'mobile/MobileAdvertTopBar.tsx'), 'utf8');
assert(topBarSrc.includes('useSafeInsets'), 'top bar uses safe insets hook');
assert(!topBarSrc.includes('useSafeAreaInsets'), 'top bar no raw hook');

const stickySrc = readFileSync(join(root, 'mobile/MobileAdvertStickyBar.tsx'), 'utf8');
assert(stickySrc.includes('useSafeInsets'), 'sticky bar uses safe insets hook');
assert(!stickySrc.includes('useSafeAreaInsets'), 'sticky bar no raw hook');

const layoutSrc = readFileSync(join(process.cwd(), 'app/_layout.tsx'), 'utf8');
assert(layoutSrc.includes('initialWindowMetrics'), 'root SafeAreaProvider initial metrics');

const gallerySrc = readFileSync(join(root, 'AdvertGallery.tsx'), 'utf8');
assert(gallerySrc.includes('fullBleed'), 'gallery fullBleed prop');
assert(gallerySrc.includes('showThumbs'), 'gallery showThumbs prop');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
