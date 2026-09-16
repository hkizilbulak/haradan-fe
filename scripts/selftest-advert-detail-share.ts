/**
 * İlan Detay Paylaşım Özelliği Self-Test.
 * Çalıştır: npx tsx scripts/selftest-advert-detail-share.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let passed = 0;
let failed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

const root = join(process.cwd(), 'components/advert-detail');

console.log('\n── 1. Dosya ve Dışa Aktarım Kontrolleri ──');
assert(existsSync(join(root, 'AdvertShareModal.tsx')), 'AdvertShareModal.tsx dosyası mevcut');

const indexSrc = readFileSync(join(root, 'index.ts'), 'utf8');
assert(indexSrc.includes('AdvertShareModal'), 'index.ts AdvertShareModal export ediyor');

console.log('\n── 2. AdvertShareModal İçerik ve Platform Kontrolleri ──');
const modalSrc = readFileSync(join(root, 'AdvertShareModal.tsx'), 'utf8');
assert(modalSrc.includes('handleShareWhatsApp') && modalSrc.includes('api.whatsapp.com'), 'WhatsApp paylaşım mantığı mevcut');
assert(modalSrc.includes('handleShareFacebook') && modalSrc.includes('facebook.com/sharer'), 'Facebook paylaşım mantığı mevcut');
assert(modalSrc.includes('handleShareTwitter') && modalSrc.includes('twitter.com/intent/tweet'), 'Twitter / X paylaşım mantığı mevcut');
assert(modalSrc.includes('handleShareInstagram') && modalSrc.includes('instagram.com'), 'Instagram paylaşım ve bildirim mantığı mevcut');
assert(modalSrc.includes('copyToClipboard'), 'Bağlantıyı panoya kopyalama desteği mevcut');
assert(modalSrc.includes('handleNativeShare'), 'Cihazın yerel paylaşım desteği mevcut');
assert(modalSrc.includes('logo-whatsapp') && modalSrc.includes('logo-facebook') && modalSrc.includes('logo-twitter') && modalSrc.includes('logo-instagram'), 'Sosyal medya ikonları tanımlı');

console.log('\n── 3. Mobil Üst Çubuk (MobileAdvertTopBar) Kontrolleri ──');
const topBarSrc = readFileSync(join(root, 'mobile/MobileAdvertTopBar.tsx'), 'utf8');
assert(topBarSrc.includes('onShare?: () => void'), 'MobileAdvertTopBar onShare prop kabul ediyor');
assert(topBarSrc.includes('share-social-outline'), 'MobileAdvertTopBar paylaşım butonunu render ediyor');

console.log('\n── 4. Satın Alma / Bilgi Kutusu (AdvertBuyBox) Kontrolleri ──');
const buyBoxSrc = readFileSync(join(root, 'AdvertBuyBox.tsx'), 'utf8');
assert(!buyBoxSrc.includes('headerShareBtn'), 'AdvertBuyBox fiyat yanında mükerrer paylaşım butonu barındırmıyor');

console.log('\n── 5. İlan Detay Görünümü (AdvertDetailView) Entegrasyon Kontrolleri ──');
const viewSrc = readFileSync(join(root, 'AdvertDetailView.tsx'), 'utf8');
assert(viewSrc.includes('isShareModalOpen'), 'AdvertDetailView isShareModalOpen state tanımlı');
assert(viewSrc.includes('desktopTopShareBtn'), 'AdvertDetailView masaüstü paylaşım butonu mevcut');
assert(viewSrc.includes('<AdvertShareModal'), 'AdvertDetailView AdvertShareModal bileşenini render ediyor');

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
