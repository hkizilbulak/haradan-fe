import { useEffect, useState } from 'react';
import {
  listingRepository,
  type IListingRepository,
} from '@/services/listing';
import type { ListingPackage } from '@/types/listing';

export function useListingPackages(
  repo: IListingRepository = listingRepository,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false;
  const [packages, setPackages] = useState<ListingPackage[]>(
    () => repo.getCachedPackages() ?? []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
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
  }, [repo, enabled]);

  return { packages, error };
}
