/**
 * Listings first-paint request budget.
 * Çalıştır: npx tsx scripts/selftest-listings-requests.ts
 */
import { createCachedCatalogRepository } from '../services/catalog/CachedCatalogRepository';
import { mapCategoryTreeToFacets } from '../services/catalog/mapCategoryTreeToFacets';
import type {
  CatalogFacets,
  CategoryFormDefinitionResponse,
  CategoryTreeNode,
} from '../types';
import type { CatalogQueryOptions, ICatalogRepository } from '../services/catalog/CatalogRepository';

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

class CountingCatalog implements ICatalogRepository {
  treeCalls = 0;
  facetCalls = 0;
  private tree: CategoryTreeNode[] = [
    { id: 'c1', slug: 'atlar', name: 'Atlar', allowTjk: false, children: [] },
  ];

  getCachedFacets(): CatalogFacets | null {
    return null;
  }
  getCachedCategoryTree(): CategoryTreeNode[] | null {
    return null;
  }
  invalidate(): void {}
  async getCategoryTree(_options?: CatalogQueryOptions): Promise<CategoryTreeNode[]> {
    this.treeCalls += 1;
    return this.tree;
  }
  async getFacets(_options?: CatalogQueryOptions): Promise<CatalogFacets> {
    this.facetCalls += 1;
    return mapCategoryTreeToFacets(this.tree);
  }
  async getCategoryFormDefinition(): Promise<CategoryFormDefinitionResponse | null> {
    return null;
  }
}

async function main(): Promise<void> {
  const inner = new CountingCatalog();
  const cached = createCachedCatalogRepository(inner);

  // Simulate useCatalogFacets: tree then facets
  const tree = await cached.getCategoryTree();
  const facets = await cached.getFacets();
  assertEqual(inner.treeCalls, 1, 'cached catalog tree fetched once');
  assertEqual(inner.facetCalls, 0, 'facets derived without inner.getFacets HTTP');
  assert(tree.length === 1, 'tree returned');
  assert(facets.groups.length > 0, 'facets mapped from tree');

  // Parallel race that used to double-fetch
  const parallel = new CountingCatalog();
  const cached2 = createCachedCatalogRepository(parallel);
  await Promise.all([cached2.getCategoryTree(), cached2.getFacets()]);
  assertEqual(parallel.treeCalls, 1, 'parallel tree+facets share one tree fetch');

  // Live search disabled on listings
  const homeSearchSrc = await import('fs').then((fs) =>
    fs.readFileSync(
      new URL('../components/home/HomeSearchBar.tsx', import.meta.url),
      'utf8'
    )
  );
  assert(
    homeSearchSrc.includes('enabled: !live'),
    'HomeSearchBar disables typeahead fetch when live'
  );

  const listingsSrc = await import('fs').then((fs) =>
    fs.readFileSync(
      new URL('../components/listings/ListingsView.tsx', import.meta.url),
      'utf8'
    )
  );
  assert(
    !listingsSrc.includes('listDistricts'),
    'ListingsView does not preload districts'
  );
  assert(
    listingsSrc.includes('enabled: hydrated'),
    'ListingsView gates search until hydrated'
  );

  const searchHookSrc = await import('fs').then((fs) =>
    fs.readFileSync(
      new URL('../hooks/usePublishedAdvertsSearch.ts', import.meta.url),
      'utf8'
    )
  );
  assert(
    searchHookSrc.includes('waitingForTree'),
    'search waits for category tree when slug set'
  );
  assert(
    !searchHookSrc.includes('accessToken,'),
    'search does not refetch on session token hydrate'
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
