import type { Router } from 'expo-router';

export type ListingsNavQuery = {
  q?: string | null;
  category?: string | null;
  breed?: string | null;
  province?: string | null;
  min?: string | null;
  max?: string | null;
  urgent?: string | null;
};

export function buildListingsHref(query: ListingsNavQuery): string {
  const params = new URLSearchParams();
  const q = query.q?.trim();
  if (q) params.set('q', q);
  if (query.category) params.set('category', query.category);
  if (query.breed) params.set('breed', query.breed);
  if (query.province) params.set('province', query.province);
  if (query.min) params.set('min', query.min);
  if (query.max) params.set('max', query.max);
  if (query.urgent === '1' || query.urgent === 'true') params.set('urgent', '1');
  const qs = params.toString();
  return qs ? `/listings?${qs}` : '/listings';
}

function isOnListingsPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/listings' || path.startsWith('/listings/');
}

/** Home veya başka ekrandan filtreli ilanlara git. */
export function navigateToListings(
  router: Router,
  query: ListingsNavQuery
): void {
  const href = buildListingsHref(query) as '/listings';
  if (isOnListingsPath()) {
    router.replace(href);
    return;
  }
  router.push(href);
}

/**
 * Anasayfa — listings’i stack’ten düşür (push/replace document reload + 418 üretmesin).
 * Stack’te home yoksa dismissTo mevcut ekranı `/` ile değiştirir.
 */
export function navigateHome(router: Router): void {
  router.dismissTo('/');
}
