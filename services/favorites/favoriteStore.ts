import type { CatalogProductCard } from '@/types';
import { advertKey, type AdvertId } from '@/types/advertId';

type Listener = () => void;

/** Optimistic UI overrides on top of hydrated server state. */
let overrides: Record<string, boolean> = {};
let cards: Record<string, CatalogProductCard> = {};
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function getFavoriteOverrides(): Record<string, boolean> {
  return overrides;
}

export function setFavoriteOverride(id: AdvertId, isFavorite: boolean): void {
  overrides = { ...overrides, [advertKey(id)]: isFavorite };
  notify();
}

function isCardFavorite(card: CatalogProductCard): boolean {
  const key = advertKey(card.id);
  const override = overrides[key];
  if (override !== undefined) return override;
  return card.isFavorite === true;
}

/** Clears all local favorite state (logout). */
export function clearFavorites(): void {
  overrides = {};
  cards = {};
  notify();
}

/**
 * Replaces local cache with BE list (login hydrate).
 * Overrides are cleared so server is source of truth.
 */
export function replaceFavoritesFromServer(items: CatalogProductCard[]): void {
  const nextCards: Record<string, CatalogProductCard> = {};
  for (const item of items) {
    nextCards[advertKey(item.id)] = { ...item, isFavorite: true };
  }
  cards = nextCards;
  overrides = {};
  for (const item of items) {
    overrides[advertKey(item.id)] = true;
  }
  notify();
}

/** Listeler render olunca kartları index’e alır — çekmece için. */
export function rememberFavoriteCards(items: CatalogProductCard[]): void {
  if (items.length === 0) return;
  let changed = false;
  const next = { ...cards };
  for (const item of items) {
    const key = advertKey(item.id);
    const prev = next[key];
    if (
      prev == null ||
      prev.isFavorite !== item.isFavorite ||
      prev.title !== item.title ||
      prev.cover?.publicUrl !== item.cover?.publicUrl
    ) {
      next[key] = item;
      changed = true;
    }
  }
  if (!changed) return;
  cards = next;
  notify();
}

/** Optimistic local flip (caller persists via repository). */
export function toggleFavoriteLocal(card: CatalogProductCard): boolean {
  cards = { ...cards, [advertKey(card.id)]: card };
  const next = !isCardFavorite(card);
  setFavoriteOverride(card.id, next);
  return next;
}

export function removeFavoriteLocal(id: AdvertId): void {
  setFavoriteOverride(id, false);
}

export function getFavoriteItems(): CatalogProductCard[] {
  const seen = new Set<string>();
  const items: CatalogProductCard[] = [];
  for (const card of Object.values(cards)) {
    const key = advertKey(card.id);
    if (seen.has(key) || !isCardFavorite(card)) continue;
    seen.add(key);
    items.push({ ...card, isFavorite: true });
  }
  return items;
}

export function subscribeFavoriteOverrides(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** @deprecated use toggleFavoriteLocal */
export function toggleFavorite(card: CatalogProductCard): void {
  toggleFavoriteLocal(card);
}

/** @deprecated use removeFavoriteLocal */
export function removeFavorite(id: AdvertId): void {
  removeFavoriteLocal(id);
}
