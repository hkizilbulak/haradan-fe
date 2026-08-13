import { Spacing } from './Spacing';

/** Ana sayfa içerik hizası — kategori sidebar ↔ hero banner genişliği. */
export const HOME_CONTENT_MAX_WIDTH = 1280;

export const HOME_DESKTOP_BREAKPOINT = 900;

export function homeContentPadding(isWide: boolean): number {
  return isWide ? Spacing.xl : Spacing.md;
}
