import type { HomepageData } from '@/types';
import type {
  IHomepageRepository,
  HomepageQueryOptions,
} from './HomepageRepository';

/**
 * In-flight dedupe + bellek cache.
 * İlk boya anında getCached() ile skeleton’suz dönüş; HTTP repo da bunu sarar.
 */
export function createCachedHomepageRepository(
  inner: IHomepageRepository
): IHomepageRepository {
  let cache: HomepageData | null = inner.getCached();
  let inflight: Promise<HomepageData> | null = null;

  return {
    getCached: () => cache,
    async getHomepage(options?: HomepageQueryOptions) {
      const fresh = options?.fresh === true;
      if (!fresh) {
        if (cache) return cache;
        if (inflight) return inflight;
      }

      const run = inner
        .getHomepage({ fresh: true })
        .then((data) => {
          cache = data;
          return data;
        })
        .finally(() => {
          if (inflight === run) inflight = null;
        });

      if (!fresh) inflight = run;
      return run;
    },
  };
}
