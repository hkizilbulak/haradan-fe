/**
 * Mobil Ara / listings self-test.
 * Çalıştır: npx tsx scripts/selftest-listings-mobile.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  countActiveListingsFilters,
  emptyListingsFilters,
} from '../components/listings/mobile/listingsFilterCount';
import {
  getCategoryShortLabel,
} from '../services/catalog/categoryDisplay';
import {
  MOBILE_HOME_DOCK_INSET,
  mobileListingsTopInset,
  shouldShowMobileDock,
} from '../constants/Layout';

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
  getCategoryShortLabel('satilik-atlar', 'Satılık Atlar') === 'Satılık',
  'short label satilik'
);
assert(
  getCategoryShortLabel('at-hizmetleri', 'At Hizmetleri') === 'Hizmet',
  'short label hizmet'
);
assert(
  getCategoryShortLabel('asim-hizmetleri', 'Aşım Hizmetleri') === 'Aşım',
  'short label asim'
);
assert(shouldShowMobileDock('/listings'), 'dock visible on listings');
assert(MOBILE_HOME_DOCK_INSET >= 64, 'dock inset present');
assert(mobileListingsTopInset(47) > 47 + 52, 'top inset includes bar height');

const empty = emptyListingsFilters();
assert(countActiveListingsFilters(empty) === 0, 'empty filters count 0');
assert(
  countActiveListingsFilters({
    ...empty,
    urgentOnly: true,
    categorySlug: 'satilik-atlar',
  }) === 2,
  'counts urgent + category'
);

const root = join(process.cwd(), 'components/listings');
for (const f of [
  'mobile/MobileListingsTopBar.tsx',
  'mobile/MobileListingsFilterSheet.tsx',
  'mobile/MobileListingsQuickFilters.tsx',
  'mobile/listingsFilterCount.ts',
]) {
  assert(existsSync(join(root, f)), `file exists ${f}`);
}

const viewSrc = readFileSync(join(root, 'ListingsView.tsx'), 'utf8');
assert(viewSrc.includes('MobileListingsTopBar'), 'view uses top bar');
assert(viewSrc.includes('MobileListingsFilterSheet'), 'view uses filter sheet');
assert(viewSrc.includes('MobileListingsQuickFilters'), 'view uses quick filters');
assert(viewSrc.includes('mobileDockScrollInset'), 'listings dynamic dock pad');
assert(viewSrc.includes('compact={!isWide}'), 'compact grid on mobile');
assert(viewSrc.includes('variant="glass"'), 'glass search on mobile');
assert(viewSrc.includes('mobileListingsTopInset'), 'dynamic top inset');
assert(!viewSrc.includes('styles.chip'), 'no bulky chip styles in view');

const screenSrc = readFileSync(
  join(process.cwd(), 'app/listings/index.tsx'),
  'utf8'
);
assert(screenSrc.includes('isWide ?'), 'AppHeader conditional on wide');

const gridSrc = readFileSync(join(root, 'ListingsGrid.tsx'), 'utf8');
assert(gridSrc.includes('compact'), 'grid supports compact');

const topBarSrc = readFileSync(
  join(root, 'mobile/MobileListingsTopBar.tsx'),
  'utf8'
);
assert(topBarSrc.includes('useSafeInsets'), 'top bar uses safe insets');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
