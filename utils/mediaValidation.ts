export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ACCEPTED_IMAGE_TYPES =
  'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export function isAllowedImageFormat(
  mimeType?: string | null,
  fileName?: string | null
): boolean {
  if (mimeType) {
    const norm = mimeType.toLowerCase().split(';')[0]?.trim();
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(norm)) {
      return true;
    }
  }
  if (fileName) {
    const clean = fileName.split('?')[0]?.split('#')[0] || '';
    const match = clean.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (match && ['jpg', 'jpeg', 'png', 'webp'].includes(match[1])) {
      return true;
    }
  }
  return false;
}

export function resolveImageMimeType(
  mimeType?: string | null,
  fileName?: string | null
): string {
  if (mimeType) {
    const norm = mimeType.toLowerCase().split(';')[0]?.trim();
    if (norm === 'image/jpg') return 'image/jpeg';
    if (['image/jpeg', 'image/png', 'image/webp'].includes(norm)) return norm;
  }
  if (fileName) {
    const clean = fileName.split('?')[0]?.split('#')[0] || '';
    const match = clean.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (match) {
      if (match[1] === 'jpg' || match[1] === 'jpeg') return 'image/jpeg';
      if (match[1] === 'png') return 'image/png';
      if (match[1] === 'webp') return 'image/webp';
    }
  }
  return 'image/jpeg';
}
