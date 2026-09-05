import type { AdvertDetail } from '@/types'
import type { AdvertId } from '@/types/advertId';

export type AdvertQueryOptions = {
  fresh?: boolean;
  accessToken?: string | null;
  viewerUserId?: string | null;
};

export interface IAdvertRepository {
  getById(id: AdvertId, options?: AdvertQueryOptions): Promise<AdvertDetail>;
  getCached(id: AdvertId): AdvertDetail | null;
  invalidate(id?: AdvertId): void;
}

