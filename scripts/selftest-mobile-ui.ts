/**
 * Mobil UI/UX prod self-review — tüm mobil self-test'leri + tutarlılık kontrolleri.
 * Çalıştır: npx tsx scripts/selftest-mobile-ui.ts
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  mobileDockScrollInset,
  mobileFloatingTopInset,
  MOBILE_FLOATING_BAR_HEIGHT,
  MOBILE_HOME_DOCK_INSET,
  shouldShowMobileDock,
} from '../constants/Layout';

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

function noRawSafeAreaHook(src: string): boolean {
  return !src.includes('useSafeAreaInsets');
}

console.log('── layout helpers ──');
assert(mobileDockScrollInset(0) >= MOBILE_HOME_DOCK_INSET - 20, 'dock inset baseline');
assert(
  mobileFloatingTopInset(47) > 47 + MOBILE_FLOATING_BAR_HEIGHT,
  'floating top inset'
);
assert(shouldShowMobileDock('/listings'), 'dock on listings');
assert(shouldShowMobileDock('/advert/x'), 'dock on advert');
assert(!shouldShowMobileDock('/post'), 'dock hidden on post');

console.log('\n── shared safe insets ──');
const safeFiles = [
  'components/home/mobile/MobileHomeTopBar.tsx',
  'components/home/mobile/MobileMenuSheet.tsx',
  'components/layout/MobileGlassDock.tsx',
  'components/listings/mobile/MobileListingsTopBar.tsx',
  'components/advert-detail/mobile/MobileAdvertTopBar.tsx',
  'components/layout/mobile/MobileScreenHeader.tsx',
  'components/home/HomeFeed.tsx',
  'components/listings/ListingsView.tsx',
];
for (const f of safeFiles) {
  const src = read(f);
  assert(existsSync(join(root, f)), `exists ${f}`);
  if (f.includes('HomeFeed') || f.includes('ListingsView')) {
    assert(src.includes('useSafeInsets'), `${f} uses useSafeInsets`);
    assert(src.includes('mobileDockScrollInset'), `${f} dynamic dock pad`);
  } else {
    assert(src.includes('useSafeInsets'), `${f} uses useSafeInsets`);
    assert(noRawSafeAreaHook(src), `${f} no raw useSafeAreaInsets`);
  }
}

console.log('\n── mobile chrome per screen ──');
const homeFeed = read('components/home/HomeFeed.tsx');
assert(!homeFeed.includes('SiteFooter') || homeFeed.includes('isWide ?'), 'home hides footer mobile');
assert(homeFeed.includes('topBtnMobile'), 'home mobile top btn');
assert(homeFeed.includes('HomeHeroSection'), 'home hero section');

const listingsView = read('components/listings/ListingsView.tsx');
assert(listingsView.includes('MobileListingsTopBar'), 'listings top bar');
assert(listingsView.includes('MobileListingsQuickFilters'), 'listings quick filters');
assert(listingsView.includes('MobileListingsFilterSheet'), 'listings filter sheet');
assert(listingsView.includes('!isWide'), 'listings mobile branch');

const advertView = read('components/advert-detail/AdvertDetailView.tsx');
assert(advertView.includes('MobileAdvertTopBar'), 'advert top bar');
assert(advertView.includes('MobileAdvertStickyBar'), 'advert sticky bar');

const homeScreen = read('app/(tabs)/index.tsx');
assert(homeScreen.includes('MobileHomeTopBar'), 'home sticky top bar at screen level');
assert(!read('components/home/HomeHeroSection.tsx').includes('MobileHomeTopBar'), 'hero section no scroll-away top bar');

const advertSkel = read('components/advert-detail/AdvertDetailSkeleton.tsx');
assert(advertSkel.includes('mobileDetailScrollInset'), 'advert skeleton dynamic inset');

const favScreen = read('app/(tabs)/favorites.tsx');
assert(favScreen.includes('contentInsetBottom'), 'favorites dock inset all states');

const profileScreen = read('app/(tabs)/profile.tsx');
assert(profileScreen.includes('MobileScreenHeader'), 'profile mobile header');
assert(profileScreen.includes('ProfileDrawer'), 'profile reuses drawer content');
assert(profileScreen.includes('mobileDockScrollInset'), 'profile dynamic dock pad');
assert(
  profileScreen.includes("router.replace('/auth/login?next=/profile')"),
  'profile redirects unauthenticated to login'
);

const myListingsScreen = read('app/my-listings/index.tsx');
const myListingsView = read('components/my-listings/MyListingsView.tsx');
assert(myListingsScreen.includes('isWide ?'), 'my-listings conditional AppHeader');
assert(myListingsView.includes('MobileMyListingsTabs'), 'my-listings pill tabs');
assert(myListingsView.includes('mobileDockScrollInset'), 'my-listings dock inset');
assert(myListingsView.includes('MobileScreenHeader'), 'my-listings mobile header');

const listingsScreen = read('app/listings/index.tsx');
const advertScreen = read('app/advert/[id].tsx');
for (const [name, src] of [
  ['listings screen', listingsScreen],
  ['advert screen', advertScreen],
  ['home screen', homeScreen],
] as const) {
  assert(src.includes('isWide ?'), `${name} conditional AppHeader`);
}

console.log('\n── package self-tests ──');
const suites = [
  'scripts/selftest-home-mobile.ts',
  'scripts/selftest-listings-mobile.ts',
  'scripts/selftest-advert-detail-mobile.ts',
  'scripts/selftest-my-listings-mobile.ts',
];
for (const suite of suites) {
  try {
    execSync(`npx tsx ${suite}`, { cwd: root, stdio: 'pipe' });
    assert(true, `${suite} passed`);
  } catch {
    assert(false, `${suite} passed`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
