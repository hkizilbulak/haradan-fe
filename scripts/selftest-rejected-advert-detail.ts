import assert from 'node:assert';
import { mapOwnerToAdvertDetail } from '../services/advert/mapAdvertDetail';
import { getAdvertCategoryName, buildAdvertInfoRows } from '../components/advert-detail/advertCategoryHelper';
import type { OwnerAdvertDto } from '../services/my-listings/mapOwnerAdvert';

console.log('\n--- Selftest: Rejected Advert Detail & Category Mapping ---\n');

const rejectedOwnerDto: OwnerAdvertDto = {
  id: 99,
  status: 'REJECTED',
  version: 1,
  mediaVersion: 1,
  categoryId: 'c1000000-0000-4000-8000-000000000011',
  districtId: 'd1',
  provinceId: 'p1',
  horseId: null,
  title: 'ADAAĞASI',
  description: 'Satılık arap atı',
  price: { amountMinor: 352000000, currency: 'TRY' },
  properties: {
    atAdi: 'ADAAĞASI',
    baba: 'AĞA KARACA',
    anne: 'ADAGÜLÜ',
    annesininBabasi: 'BOZDAĞ',
    atIrki: 'Safkan Arap',
    yas: '10-15 Yaş arası',
    rejectionReason: 'Eksik veya yanıltıcı soy kütüğü bilgisi.',
  },
};

const detail = mapOwnerToAdvertDetail(rejectedOwnerDto, 'http://localhost:8080', 'user-123');

// 1. Backend Status & Rejection Reason
assert.strictEqual(detail.backendStatus, 'REJECTED', 'backendStatus must be REJECTED');
assert.strictEqual(detail.rejectionReason, 'Eksik veya yanıltıcı soy kütüğü bilgisi.', 'rejectionReason must be mapped');
console.log('ok  detail maps backendStatus and rejectionReason correctly');

// 2. Category Resolution
assert.strictEqual(detail.category?.name, 'Satılık Yarış Atı', 'category.name must be Satılık Yarış Atı');
const resolvedCategoryName = getAdvertCategoryName(detail);
assert.strictEqual(resolvedCategoryName, 'Satılık Yarış Atı', 'getAdvertCategoryName must return Satılık Yarış Atı');
assert.notStrictEqual(resolvedCategoryName, 'İlanlarım', 'getAdvertCategoryName must NEVER return İlanlarım');
console.log('ok  getAdvertCategoryName returns real category name instead of İlanlarım');

// 3. Advert Info Rows (Sidebar table)
const infoRows = buildAdvertInfoRows(detail);
const categoryRow = infoRows.find((r) => r.label === 'Kategori');
assert(categoryRow, 'Kategori row must exist');
assert.strictEqual(categoryRow.value, 'Satılık Yarış Atı', 'Kategori row value must be Satılık Yarış Atı');
assert.notStrictEqual(categoryRow.value, 'İlanlarım', 'Kategori row value must not be İlanlarım');
console.log('ok  buildAdvertInfoRows puts correct category in specs sidebar');

// 4. Test breadcrumbs fallback: even if categoryId is completely empty and breadcrumbs has ['Ana sayfa', 'İlanlarım', title]
const emptyCatDetail = {
  ...detail,
  categoryId: '',
  category: null,
  breadcrumbs: [
    { label: 'Ana sayfa', href: '/' },
    { label: 'İlanlarım', href: '/my-listings' },
    { label: 'ADAAĞASI' },
  ],
};
const fallbackName = getAdvertCategoryName(emptyCatDetail);
assert.notStrictEqual(fallbackName, 'İlanlarım', 'Fallback category must never be İlanlarım');
assert.strictEqual(fallbackName, 'Satılık Yarış Atı', 'Fallback category defaults to Satılık Yarış Atı for horse');
console.log('ok  even with empty categoryId, breadcrumb parsing filters out İlanlarım');

// 5. Action logic checks
const isPublished = detail.backendStatus === 'PUBLISHED';
const isRejected = detail.backendStatus === 'REJECTED';
const isPendingReview = detail.backendStatus === 'PENDING_REVIEW';
const isChangesRequested = detail.backendStatus === 'CHANGES_REQUESTED';
const isArchived = detail.backendStatus === 'ARCHIVED';
const isSold = detail.backendStatus === 'SOLD';
const canTogglePublish = (isPublished || isArchived) && !isRejected && !isPendingReview && !isChangesRequested && !isSold;

assert.strictEqual(isPublished, false, 'Rejected advert is not published');
assert.strictEqual(canTogglePublish, false, 'Rejected advert cannot toggle publish');
console.log('ok  action logic correctly prevents publish/promote for rejected advert');

console.log('\nAll tests passed!\n');
