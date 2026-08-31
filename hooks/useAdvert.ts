import { startTransition, useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  advertRepository,
  type IAdvertRepository,
} from '@/services/advert';
import type { AdvertDetail } from '@/types'
import type { AdvertId } from '@/types/advertId';

type Status = 'idle' | 'loading' | 'success' | 'error';

function prefetchGallery(detail: AdvertDetail) {
  const urls = detail.gallery.slice(0, 3).map((g) => g.publicUrl);
  urls.forEach((url) => {
    if (url) void Image.prefetch(url);
  });
}

/**
 * İlan detay — id bazlı cache-first + SWR.
 */
export function useAdvert(
  id: AdvertId | undefined,
  accessToken: string | null = null,
  viewerUserId: string | null = null,
  repo: IAdvertRepository = advertRepository
) {
  const [data, setData] = useState<AdvertDetail | null>(() =>
    id ? repo.getCached(id) : null
  );
  const [status, setStatus] = useState<Status>(() =>
    id && repo.getCached(id) ? 'success' : 'loading'
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (fresh = false) => {
      if (!id) {
        setStatus('error');
        setError('İlan bulunamadı.');
        return;
      }

      const cached = repo.getCached(id);
      if (!cached) setStatus('loading');

      try {
        const result = await repo.getById(id, {
          fresh,
          accessToken,
          viewerUserId,
        });
        prefetchGallery(result);
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
        if (!repo.getCached(id) && !cached) setStatus('error');
      }
    },
    [id, repo, accessToken, viewerUserId]
  );

  useEffect(() => {
    setData(id ? repo.getCached(id) : null);
    setStatus(id && repo.getCached(id) ? 'success' : 'loading');
    void load(false);
  }, [id, load, repo]);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading' && data === null,
    isError: status === 'error' && data === null,
    isSuccess: status === 'success',
    refetch: () => load(true),
  };
}
