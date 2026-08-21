/**
 * PayTR iframe checkout for listing packages.
 *
 * Default: OFF — package step submits directly to PENDING_REVIEW.
 * Enable anytime with EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED=1 (and BE PayTR env).
 */
export function isPaytrCheckoutEnabled(): boolean {
  const raw = process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED;
  if (raw == null || raw.trim() === '') return false;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}
