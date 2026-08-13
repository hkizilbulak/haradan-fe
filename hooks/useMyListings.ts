import { useCallback, useEffect, useState } from 'react';
import {
  myListingsRepository,
  type IMyListingsRepository,
} from '@/services/my-listings';
import type { MyListingCard, MyListingStatus } from '@/types';

export function useMyListings(
  status: MyListingStatus,
  accessToken: string | null,
  repo: IMyListingsRepository = myListingsRepository
) {
  const [items, setItems] = useState<MyListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const res = await repo.list(status, accessToken);
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, repo, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, refetch: load };
}
