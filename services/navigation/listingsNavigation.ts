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

export type HeaderNavKey = 'home' | 'listings' | 'my-listings';

/**
 * Header sol/sağ slot `flex:1` kaplar. `box-none` olmadan boş alan,
 * overlay nav’ın (özellikle sağdaki İlanlarım) tıklamasını yutar.
 * Çocuklar varsayılan hit-test ile tıklanır kalır.
 */
export const HEADER_FLEX_SLOT_POINTER_EVENTS = 'box-none' as const;

export function buildMyListingsHref(isLoggedIn: boolean): string {
  return isLoggedIn ? '/my-listings' : '/auth/login?next=/my-listings';
}

export function headerNavHref(
  key: HeaderNavKey,
  isLoggedIn: boolean
): string {
  if (key === 'home') return '/';
  if (key === 'listings') return '/listings';
  return buildMyListingsHref(isLoggedIn);
}

export function headerNavKeyFromPath(pathname: string): HeaderNavKey | '' {
  const path = (pathname.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  if (path.startsWith('/my-listings')) return 'my-listings';
  if (path.startsWith('/listings')) return 'listings';
  if (
    path === '/' ||
    path === '/(tabs)' ||
    path === '/(tabs)/index' ||
    path === '/index'
  ) {
    return 'home';
  }
  return '';
}

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
