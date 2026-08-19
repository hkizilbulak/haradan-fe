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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!accessToken) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const res = await repo.list(status, accessToken);
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi.');
      if (!opts?.silent) setItems([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [accessToken, repo, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const removeDraft = useCallback(
    async (id: string, expectedVersion: number) => {
      if (!accessToken) {
        throw new Error('Oturum bulunamadı.');
      }
      const removed = items.find((item) => item.id === id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      try {
        await repo.removeDraft(id, expectedVersion, accessToken);
      } catch (err) {
        if (removed) {
          setItems((prev) =>
            prev.some((item) => item.id === id)
              ? prev
              : [...prev, removed].sort((a, b) =>
                  a.updatedAt < b.updatedAt ? 1 : -1
                )
          );
        }
        throw err;
      }
    },
    [accessToken, items, repo]
  );

  const markSold = useCallback(
    async (id: string, expectedVersion: number): Promise<MyListingCard> => {
      if (!accessToken) {
        throw new Error('Oturum bulunamadı.');
      }
      const updated = await repo.markSold(id, expectedVersion, accessToken);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    },
    [accessToken, repo]
  );

  return { items, loading, error, refetch: load, removeDraft, markSold };
}
