/**
 * PayTR iframe checkout for listing packages.
 *
 * TEMP (2026-08): always OFF — PayTR BE route 404; listing publishes
 * from details without package/payment UI. Re-enable by restoring the
 * env check below and setting isListingPackageStepEnabled() true.
 */
export function isPaytrCheckoutEnabled(): boolean {
  return false;
}

/**
 * Package selection step is enabled for listing creation wizard.
 */
export function isListingPackageStepEnabled(): boolean {
  return true;
}

/** Free default package while paid checkout is disabled. */
export const DEFAULT_LISTING_PACKAGE_CODE = 'STANDARD' as const;
