import { useEffect, useState } from 'react';
import {
  listingRepository,
  type IListingRepository,
} from '@/services/listing';
import type { ListingPackage } from '@/types/listing';

export function useListingPackages(
  repo: IListingRepository = listingRepository
) {
  const [packages, setPackages] = useState<ListingPackage[]>(
    () => repo.getCachedPackages() ?? []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await repo.getPackages();
        if (cancelled) return;
        setPackages(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Paketler yüklenemedi.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  return { packages, error };
}
