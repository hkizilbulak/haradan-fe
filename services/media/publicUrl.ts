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
  if (!assetId) return '';
  return resolvePublicMediaUrl(`/v1/media/${assetId}/${profile}`, apiBase);
}
