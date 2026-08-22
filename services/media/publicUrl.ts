/**
 * BE PublicDeliveryURL returns same-origin relative paths (`/v1/media/...`).
 * Absolute URL = API base (`…/api`) + path.
 */
export function resolvePublicMediaUrl(
  pathOrUrl: string,
  apiBase: string
): string {
  const raw = pathOrUrl.trim();
  if (!raw) return '';
  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith('file:') ||
    raw.startsWith('blob:') ||
    raw.startsWith('data:')
  ) {
    return raw;
  }
  const base = apiBase.replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}

export function mediaDeliveryUrl(
  assetId: string,
  profile: 'DETAIL' | 'HOMEPAGE' | 'SEARCH',
  apiBase: string
): string {
  const trimmed = assetId?.trim();
  if (!trimmed) return '';
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return resolvePublicMediaUrl(`/v1/media/${trimmed}/${profile}`, apiBase);
}
