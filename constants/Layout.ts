import { Spacing } from './Spacing';

/** Ana sayfa içerik hizası — kategori sidebar ↔ hero banner genişliği. */
export const HOME_CONTENT_MAX_WIDTH = 1280;

export const HOME_DESKTOP_BREAKPOINT = 900;

/** Mobil alt dock görünür içerik yüksekliği (safe area hariç). */
export const MOBILE_DOCK_BAR_HEIGHT = 64;

/** Scroll içeriği için alt boşluk — dock + FAB payı. */
export const MOBILE_HOME_DOCK_INSET = 100;

/** İlan detay — sabit alt CTA şeridi yüksekliği. */
export const MOBILE_DETAIL_STICKY_BAR_HEIGHT = 72;

/** İlan detay scroll alt boşluğu — dock + sticky CTA (sabit tahmin). */
export const MOBILE_DETAIL_SCROLL_INSET =
  MOBILE_HOME_DOCK_INSET + MOBILE_DETAIL_STICKY_BAR_HEIGHT + 12;

/** Cihaz alt inset'ine göre dinamik scroll boşluğu. */
export function mobileDetailScrollInset(bottomInset = 0): number {
  const dock = MOBILE_DOCK_BAR_HEIGHT + Math.max(bottomInset, 8) + 8;
  return dock + MOBILE_DETAIL_STICKY_BAR_HEIGHT + 12;
}

/** Dock'un gizleneceği rota önekleri (auth, ilan sihirbazı). */
export const MOBILE_DOCK_HIDDEN_PREFIXES = [
  '/auth',
  '/post',
  '/verify-email',
] as const;

export function shouldShowMobileDock(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return !MOBILE_DOCK_HIDDEN_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function homeContentPadding(isWide: boolean): number {
  return isWide ? Spacing.xl : Spacing.md;
}
