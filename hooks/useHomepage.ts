import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import {
  homepageRepository,
  type IHomepageRepository,
} from '@/services/homepage';
import type { HomepageData } from '@/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

function prefetchCritical(data: HomepageData) {
  const hero = data.banners[0]?.imageUrl;
  const cover = data.urgentAdverts[0]?.cover?.publicUrl
    ?? data.newAdverts[0]?.cover?.publicUrl;
  if (hero) void Image.prefetch(hero);
  if (cover) void Image.prefetch(cover);
}

/**
 * Cache-first + stale-while-revalidate.
 * İlk içerik senkron set edilir; arka plan yenilemesi startTransition ile gelir.
 */
export function useHomepage(repo: IHomepageRepository = homepageRepository) {
  const [data, setData] = useState<HomepageData | null>(() => repo.getCached());
  const [status, setStatus] = useState<Status>(() =>
    repo.getCached() ? 'success' : 'loading'
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (fresh = false) => {
      const cached = repo.getCached();
      if (!cached) setStatus('loading');

      try {
        const result = await repo.getHomepage({ fresh });
        prefetchCritical(result);
        const apply = () => {
          setData(result);
          setError(null);
          setStatus('success');
        };
        if (cached) startTransition(apply);
        else apply();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
        setError(message);
        if (!repo.getCached() && !cached) setStatus('error');
      }
    },
    [repo]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const categoryRoots = useMemo(
    () => data?.categories ?? [],
    [data?.categories]
  );

  return {
    data,
    status,
    error,
    isLoading: status === 'loading' && data === null,
    isError: status === 'error' && data === null,
    isSuccess: status === 'success',
    refetch: () => load(true),
    categoryRoots,
  };
}
