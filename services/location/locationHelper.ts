import { useEffect, useState } from 'react';
import { locationLookup } from './createLocationLookup';

export type AdvertLocationInput = {
  districtId?: string | null;
  provinceId?: string | null;
  districtName?: string | null;
  provinceName?: string | null;
  locationName?: string | null;
};

/**
 * Robustly formats location for cards and detail views.
 * If names are present, registers them to locationLookup for subsequent fast lookup.
 */
export function formatAdvertLocation(input?: AdvertLocationInput | null): string {
  if (!input) return '';

  if (input.locationName && input.locationName.trim()) {
    return input.locationName.trim();
  }

  return locationLookup.formatLocation(
    input.districtId,
    input.provinceId,
    input.districtName,
    input.provinceName
  );
}

/**
 * React hook that returns the formatted advert location ("İlçe, İl" or "İl")
 * and automatically re-renders whenever asynchronous district/province data finishes loading.
 * Geo listesi yalnızca display name yoksa çekilir — kartlarda BE isimleri varsa ekstra istek yok.
 */
export function useAdvertLocation(input?: AdvertLocationInput | null): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!input) return;

    const hasNames =
      Boolean(input.locationName?.trim()) ||
      Boolean(input.provinceName?.trim()) ||
      Boolean(input.districtName?.trim());

    if (!hasNames && input.provinceId) {
      void locationLookup.listDistricts(input.provinceId).catch(() => {});
    }

    if (locationLookup.subscribe) {
      return locationLookup.subscribe(() => {
        setTick((t) => t + 1);
      });
    }
  }, [
    input?.districtId,
    input?.provinceId,
    input?.districtName,
    input?.provinceName,
    input?.locationName,
  ]);

  return formatAdvertLocation(input);
}
