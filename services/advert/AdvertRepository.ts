import type { AdvertDetail } from '@/types';

export type AdvertQueryOptions = {
  fresh?: boolean;
  accessToken?: string | null;
  viewerUserId?: string | null;
};

export interface IAdvertRepository {
  getById(id: string, options?: AdvertQueryOptions): Promise<AdvertDetail>;
  getCached(id: string): AdvertDetail | null;
}
