/**
 * Yayındaki ilan araması mapper / kategori çözümleme self-test.
 * npm run selftest:adverts-search
 */
import { mapPublishedCardToCatalog } from '../services/adverts/mapPublishedCard';
import { resolveSearchCategoryIds } from '../services/adverts/resolveSearchCategoryIds';
import type { CategoryTreeNode } from '../types';

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

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

const apiBase = 'http://localhost:8080/api';
const mapped = mapPublishedCardToCatalog(
  {
    id: 'a1',
    title: 'Test',
    publishedAt: '2026-08-15T00:00:00Z',
    price: { amountMinor: 100, currency: 'TRY' },
    categoryId: 'c1',
    districtId: 'd1',
    provinceId: 'p1',
    horseId: null,
    cover: {
      assetId: 'm1',
      displayOrder: 0,
      isCover: true,
      publicUrl: '/v1/media/m1/DETAIL',
    },
    isFavorite: false,
    isUrgent: true,
  },
  apiBase
);
assertEqual(mapped.isUrgent, true, 'urgent mapped');
assert(
  mapped.cover?.publicUrl ===
    'http://localhost:8080/api/v1/media/m1/DETAIL',
  'cover absolutized'
);
assertEqual(mapped.rating, 0, 'catalog defaults');

const tree: CategoryTreeNode[] = [
  {
    id: 'root',
    slug: 'atlar',
    name: 'Atlar',
    children: [
      {
        id: 'leaf-1',
        slug: 'safkan',
        name: 'Safkan',
        children: [],
      },
      {
        id: 'leaf-2',
        slug: 'arap',
        name: 'Arap',
        children: [],
      },
    ],
  },
];

const leaf = resolveSearchCategoryIds(tree, 'safkan');
assertEqual(leaf.serverCategoryIds?.[0], 'leaf-1', 'leaf → server id');
assertEqual(leaf.clientCategoryIds, null, 'leaf no client filter');

const parent = resolveSearchCategoryIds(tree, 'atlar');
assertEqual(parent.serverCategoryIds?.length, 2, 'parent fan-out leaves');
assertEqual(parent.clientCategoryIds, null, 'small parent no client set');

const none = resolveSearchCategoryIds(tree, null);
assertEqual(none.serverCategoryIds, undefined, 'no slug');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
