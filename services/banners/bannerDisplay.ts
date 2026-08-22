import { resolvePublicMediaUrl } from '@/services/media/publicUrl';
import type { ActiveBannerItem, BannerPlacement } from '@/types';

const HERO_PLACEMENTS: BannerPlacement[] = ['HOMEPAGE_HERO', 'HOMEPAGE'];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * BE banner görsel URL — relative path, asset id veya tam URL.
 */
export function resolveBannerImageUrl(
  imageUrl: string | null | undefined,
  apiBase: string
): string {
  const raw = (imageUrl ?? '').trim();
  if (!raw) return '';

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith('data:') ||
    raw.startsWith('blob:') ||
    raw.startsWith('file:')
  ) {
    return raw;
  }

  if (raw.startsWith('/v1/media/')) {
    return resolvePublicMediaUrl(raw, apiBase);
  }

  if (UUID_RE.test(raw) || /^asset-/i.test(raw)) {
    return resolvePublicMediaUrl(`/v1/media/${raw}/BANNER`, apiBase);
  }

  return resolvePublicMediaUrl(raw, apiBase);
}

/** Tek banner kaydını FE hero slider için normalize eder. */
export function normalizeBannerItem(
  item: ActiveBannerItem,
  apiBase: string
): ActiveBannerItem {
  return {
    ...item,
    imageUrl: resolveBannerImageUrl(item.imageUrl, apiBase),
    sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
  };
}

/** Mobil/masaüstü hero slider — yalnız ana sayfa banner placement'ları. */
export function selectHomeHeroBanners(
  banners: ActiveBannerItem[]
): ActiveBannerItem[] {
  const seen = new Set<string>();
  return banners
    .filter(
      (b) =>
        HERO_PLACEMENTS.includes(b.placement) &&
        Boolean(b.imageUrl?.trim())
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
}

/** Promo / içerik arası banner. */
export function selectHomePromoBanner(
  banners: ActiveBannerItem[]
): ActiveBannerItem | null {
  const promo = banners
    .filter((b) => b.placement === 'HOMEPAGE_PROMO' && b.imageUrl?.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return promo[0] ?? null;
}
