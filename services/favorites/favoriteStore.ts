import type { CatalogProductCard } from '@/types';

type Listener = () => void;

let overrides: Record<string, boolean> = {};
let cards: Record<string, CatalogProductCard> = {};
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function getFavoriteOverrides(): Record<string, boolean> {
  return overrides;
}

export function setFavoriteOverride(id: string, isFavorite: boolean): void {
  overrides = { ...overrides, [id]: isFavorite };
  notify();
}

function isCardFavorite(card: CatalogProductCard): boolean {
  const override = overrides[card.id];
  if (override !== undefined) return override;
  return card.isFavorite === true;
}

/** Listeler render olunca kartları index’e alır — çekmece her sayfadan dolar. */
export function rememberFavoriteCards(items: CatalogProductCard[]): void {
  if (items.length === 0) return;
  let changed = false;
  const next = { ...cards };
  for (const item of items) {
    const prev = next[item.id];
    if (
      prev == null ||
      prev.isFavorite !== item.isFavorite ||
      prev.title !== item.title ||
      prev.cover?.publicUrl !== item.cover?.publicUrl
    ) {
      next[item.id] = item;
      changed = true;
    }
  }
  if (!changed) return;
  cards = next;
  notify();
}

export function toggleFavorite(card: CatalogProductCard): void {
  cards = { ...cards, [card.id]: card };
  setFavoriteOverride(card.id, !isCardFavorite(card));
}

export function removeFavorite(id: string): void {
  setFavoriteOverride(id, false);
}

export function getFavoriteItems(): CatalogProductCard[] {
  const seen = new Set<string>();
  const items: CatalogProductCard[] = [];
  for (const card of Object.values(cards)) {
    if (seen.has(card.id) || !isCardFavorite(card)) continue;
    seen.add(card.id);
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
