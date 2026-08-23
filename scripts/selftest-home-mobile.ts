/**
 * Mobil anasayfa + alt dock self-test.
 * Çalıştır: npx tsx scripts/selftest-home-mobile.ts
 */
import {
  HOME_DESKTOP_BREAKPOINT,
  MOBILE_DOCK_BAR_HEIGHT,
  MOBILE_HOME_DOCK_INSET,
  mobileDockScrollInset,
  shouldShowMobileDock,
} from '../constants/Layout';
import { buildListingsHref } from '../services/navigation';
import {
  getCategoryIcon,
  pickListingRootCategories,
} from '../services/catalog/categoryDisplay';
import { MOCK_CATEGORIES } from '../mocks/homepage';
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

assert(MOBILE_HOME_DOCK_INSET >= MOBILE_DOCK_BAR_HEIGHT, 'dock inset >= bar height');
assert(mobileDockScrollInset(0) >= MOBILE_DOCK_BAR_HEIGHT + 8, 'dynamic dock inset');
assert(MOBILE_DOCK_BAR_HEIGHT >= 56, 'dock bar height prod minimum');
assert(HOME_DESKTOP_BREAKPOINT === 900, 'desktop breakpoint 900');

assert(shouldShowMobileDock('/'), 'dock visible on home');
assert(shouldShowMobileDock('/listings'), 'dock visible on listings');
assert(!shouldShowMobileDock('/auth/login'), 'dock hidden on auth');
assert(!shouldShowMobileDock('/post'), 'dock hidden on post wizard');

assert(
  buildListingsHref({ q: 'arap' }) === '/listings?q=arap',
  'search navigates to listings'
);

const roots = pickListingRootCategories(MOCK_CATEGORIES);
assert(roots.length >= 3, 'listing root categories from catalog tree');
assert(roots[0]?.slug === 'satilik-atlar', 'satilik-atlar first root');
assert(getCategoryIcon('satilik-atlar') === 'trophy-outline', 'satilik icon');
assert(getCategoryIcon('at-hizmetleri') === 'briefcase-outline', 'hizmet icon');
assert(getCategoryIcon('asim-hizmetleri') === 'heart-outline', 'asim icon');
assert(getCategoryIcon('yeni-urun-grubu') === 'grid-outline', 'unknown slug fallback');

const componentsRoot = join(process.cwd(), 'components');
const stripSrc = readFileSync(join(componentsRoot, 'home/CategoryStrip.tsx'), 'utf8');
assert(stripSrc.includes('pickListingRootCategories'), 'CategoryStrip uses catalog roots');
assert(stripSrc.includes('getCategoryIcon'), 'CategoryStrip uses shared icons');

const root = componentsRoot;
const mobileFiles = [
  'home/mobile/MobileHomeHeroBlock.tsx',
  'home/mobile/MobileHomeTopBar.tsx',
  'home/mobile/MobileMenuSheet.tsx',
  'layout/MobileGlassDock.tsx',
  'layout/MobileDockHost.tsx',
  'layout/glassStyles.ts',
];

for (const f of mobileFiles) {
  assert(existsSync(join(root, f)), `file exists ${f}`);
}

const dockSrc = readFileSync(join(root, 'layout/MobileGlassDock.tsx'), 'utf8');
assert(dockSrc.includes('zIndex: 9999'), 'dock uses high z-index');
assert(dockSrc.includes("nativeID=\"mobile-glass-dock\""), 'dock has test id');
assert(dockSrc.includes('useSafeInsets'), 'dock uses safe insets hook');
assert(!dockSrc.includes('useSafeAreaInsets'), 'dock no raw safe area hook');

const hostSrc = readFileSync(join(root, 'layout/MobileDockHost.tsx'), 'utf8');
assert(hostSrc.includes('shouldShowMobileDock'), 'dock host respects route guards');

const homeFeed = readFileSync(join(process.cwd(), 'components/home/HomeFeed.tsx'), 'utf8');
assert(homeFeed.includes('mobileDockScrollInset'), 'HomeFeed dynamic dock inset');
assert(homeFeed.includes('useSafeInsets'), 'HomeFeed uses safe insets');

const appLayout = readFileSync(join(process.cwd(), 'app/_layout.tsx'), 'utf8');
assert(appLayout.includes('MobileDockHost'), 'root layout mounts MobileDockHost');
assert(appLayout.includes('SafeAreaProvider'), 'root layout wraps SafeAreaProvider');

const tabsLayout = readFileSync(
  join(process.cwd(), 'app/(tabs)/_layout.tsx'),
  'utf8'
);
assert(tabsLayout.includes("display: 'none'"), 'default tab bar hidden');
assert(!tabsLayout.includes('height: 0'), 'tabs layout does not clip with height 0');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
