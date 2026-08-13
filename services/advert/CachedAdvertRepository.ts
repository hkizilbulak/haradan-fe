import type { AdvertDetail } from '@/types';
import type { AdvertQueryOptions, IAdvertRepository } from './AdvertRepository';

export function createCachedAdvertRepository(
  inner: IAdvertRepository
): IAdvertRepository {
  const cache = new Map<string, AdvertDetail>();
  const inflight = new Map<string, Promise<AdvertDetail>>();

  return {
    getCached: (id) => cache.get(id) ?? null,
    async getById(id, options) {
      const fresh = options?.fresh === true;
      if (!fresh) {
        const hit = cache.get(id);
        if (hit) return hit;
        const pending = inflight.get(id);
        if (pending) return pending;
      }

      const run = inner
        .getById(id, { fresh: true })
        .then((data) => {
          cache.set(id, data);
          return data;
        })
        .finally(() => {
          if (inflight.get(id) === run) inflight.delete(id);
        });

      if (!fresh) inflight.set(id, run);
      return run;
    },
  };
}
