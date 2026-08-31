/**
 * Favoriler self-test — login gate + HTTP repository sözleşmesi.
 * Çalıştır: npm run selftest:favorites
 */
import { HttpFavoritesRepository } from '../services/favorites/HttpFavoritesRepository';
import { applyFavoriteOverrides } from '../utils/applyFavoriteOverrides';
import {
  clearFavorites,
  getFavoriteItems,
  replaceFavoritesFromServer,
  toggleFavoriteLocal,
} from '../services/favorites/favoriteStore';
import type { CatalogProductCard } from '../types';

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

function card(partial: Partial<CatalogProductCard> & { id: number }): CatalogProductCard {
  return {
    title: 'Test',
    publishedAt: new Date().toISOString(),
    price: { amountMinor: 100, currency: 'TRY' },
    categoryId: 'c',
    districtId: 'd',
    provinceId: 'p',
    horseId: null,
    cover: null,
    isFavorite: false,
    isUrgent: false,
    rating: 0,
    reviewCount: 0,
    viewCount: 0,
    oldPrice: null,
    available: null,
    brand: null,
    ...partial,
  };
}

clearFavorites();
assertEqual(getFavoriteItems().length, 0, 'starts empty');

replaceFavoritesFromServer([card({ id: 101, isFavorite: true })]);
assertEqual(getFavoriteItems().length, 1, 'hydrate from server');
assert(getFavoriteItems()[0]?.isFavorite === true, 'hydrated favorite');

const flipped = toggleFavoriteLocal(card({ id: 101, isFavorite: true }));
assertEqual(flipped, false, 'toggle off');
assertEqual(getFavoriteItems().length, 0, 'removed from list');

clearFavorites();
const applied = applyFavoriteOverrides(
  [card({ id: 999, isFavorite: null as unknown as boolean })],
  {}
);
assertEqual(applied[0]?.isFavorite, null as unknown as boolean, 'no override leaves null');

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
const responses: Record<string, { status: number; body: unknown }> = {};

function keyOf(url: string, method: string): string {
  return `${method} ${url.replace(/^https?:\/\/[^/]+/, '')}`;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  calls.push({ url, init: init ?? {} });
  const hit = responses[keyOf(url, method)];
  if (!hit) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
  }
  return new Response(JSON.stringify(hit.body), {
    status: hit.status,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

async function main(): Promise<void> {
  const repo = new HttpFavoritesRepository('http://localhost:8080/api');

  responses['GET /api/v1/me/favorites?limit=100'] = {
    status: 200,
    body: {
      hasMore: false,
      items: [
        {
          advertId: 1,
          available: true,
          card: {
            id: 1,
            title: 'Favori ilan',
            publishedAt: new Date().toISOString(),
            price: { amountMinor: 1, currency: 'TRY' },
            categoryId: 'c',
            districtId: 'd',
            provinceId: 'p',
            cover: null,
            isFavorite: true,
            isUrgent: false,
            isFeatured: false,
          },
        },
      ],
    },
  };
  responses['PUT /api/v1/me/favorites/2'] = {
    status: 200,
    body: { advertId: 2, favorited: true },
  };
  responses['DELETE /api/v1/me/favorites/2'] = {
    status: 200,
    body: { advertId: 2, favorited: false },
  };

  const listed = await repo.list('tok');
  assertEqual(listed.items.length, 1, 'list maps available cards');
  assertEqual(listed.items[0]?.id, 1, 'list card id');

  const added = await repo.add(2, 'tok');
  assertEqual(added.favorited, true, 'add favorited');
  const removed = await repo.remove(2, 'tok');
  assertEqual(removed.favorited, false, 'remove favorited');

  const auth = new Headers(calls[0]?.init.headers);
  assertEqual(auth.get('Authorization'), 'Bearer tok', 'list sends Bearer');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
