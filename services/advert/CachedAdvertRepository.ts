import type { AdvertDetail } from '@/types';
import type { AdvertId } from '@/types/advertId';
import { advertKey } from '@/types/advertId';
import type { AdvertQueryOptions, IAdvertRepository } from './AdvertRepository';

export function createCachedAdvertRepository(
  inner: IAdvertRepository
): IAdvertRepository {
  const cache = new Map<string, AdvertDetail>();
  const inflight = new Map<string, Promise<AdvertDetail>>();

  return {
    getCached: (id) => cache.get(advertKey(id)) ?? null,
    async getById(id, options) {
      const key = advertKey(id);
      const fresh = options?.fresh === true;
      if (!fresh) {
        const hit = cache.get(key);
        if (hit) return hit;
        const pending = inflight.get(key);
        if (pending) return pending;
      }

      const run = inner
        .getById(id, { fresh: true })
        .then((data) => {
          cache.set(key, data);
          return data;
        })
        .finally(() => {
          if (inflight.get(key) === run) inflight.delete(key);
        });

      if (!fresh) inflight.set(key, run);
      return run;
    },
  };
}
