/**
 * PayTR iframe checkout for listing packages.
 *
 * Enable with EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED=1 (and BE PAYTR_ENABLED=true).
 * When off, package step still shows; CTA publishes without payment.
 */
export function isPaytrCheckoutEnabled(): boolean {
  return (
    String(process.env.EXPO_PUBLIC_PAYTR_CHECKOUT_ENABLED ?? '').trim() === '1'
  );
}

/**
 * Package selection step is enabled for listing creation wizard.
 */
export function isListingPackageStepEnabled(): boolean {
  return true;
}

/** Default package when none selected (free path / fallback). */
export const DEFAULT_LISTING_PACKAGE_CODE = 'STANDARD' as const;
