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
 * TEMP: hide package selection step; auto-assign STANDARD on publish.
 * Flip to true when package + PayTR flow should return.
 */
export function isListingPackageStepEnabled(): boolean {
  return false;
}

/** Free default package while paid checkout is disabled. */
export const DEFAULT_LISTING_PACKAGE_CODE = 'STANDARD' as const;
