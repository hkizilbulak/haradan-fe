import type { Router } from 'expo-router';

export type ListingsNavQuery = {
  q?: string | null;
  category?: string | null;
  breed?: string | null;
  breeds?: string | string[] | null;
  province?: string | string[] | null;
  district?: string | string[] | null;
  min?: string | number | null;
  max?: string | number | null;
  urgent?: string | boolean | null;
  period?: string | null;
  facilities?: string | string[] | null;
  ages?: string | string[] | null;
  colors?: string | string[] | null;
  genders?: string | string[] | null;
  features?: string | string[] | null;
  [key: string]: unknown;
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
  if (query.q != null && String(query.q).trim() !== '') {
    params.set('q', String(query.q).trim());
  }

  for (const [key, rawVal] of Object.entries(query)) {
    if (key === 'q') continue;
    if (rawVal == null || rawVal === '') continue;
    if (key === 'urgent') {
      if (rawVal === '1' || rawVal === true || rawVal === 'true') {
        params.set('urgent', '1');
      }
      continue;
    }
    if (Array.isArray(rawVal)) {
      const filtered = rawVal.filter((v) => v != null && String(v).trim() !== '');
      if (filtered.length > 0) {
        params.set(key, filtered.map(String).join(','));
      }
      continue;
    }
    const strVal = String(rawVal).trim();
    if (strVal) {
      params.set(key, strVal);
    }
  }
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
