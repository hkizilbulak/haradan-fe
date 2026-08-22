/**
 * Mobil anasayfa self-test — layout sabitleri ve modül yapısı.
 * Çalıştır: npx tsx scripts/selftest-home-mobile.ts
 */
import {
  HOME_DESKTOP_BREAKPOINT,
  MOBILE_HOME_DOCK_INSET,
} from '../constants/Layout';
import { buildListingsHref } from '../services/navigation';
import { existsSync } from 'node:fs';
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

assert(MOBILE_HOME_DOCK_INSET >= 96, 'dock inset leaves room for glass footer');
assert(HOME_DESKTOP_BREAKPOINT === 900, 'desktop breakpoint 900');

assert(
  buildListingsHref({ q: 'arap' }) === '/listings?q=arap',
  'search navigates to listings'
);

const root = join(process.cwd(), 'components');
const mobileFiles = [
  'home/mobile/MobileHomeHeroBlock.tsx',
  'home/mobile/MobileHomeTopBar.tsx',
  'home/mobile/MobileMenuSheet.tsx',
  'layout/MobileGlassDock.tsx',
];

for (const f of mobileFiles) {
  assert(existsSync(join(root, f)), `file exists ${f}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
