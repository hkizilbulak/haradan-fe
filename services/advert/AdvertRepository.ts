import type { AdvertDetail } from '@/types';

export type AdvertQueryOptions = {
  fresh?: boolean;
};

export interface IAdvertRepository {
  getById(id: string, options?: AdvertQueryOptions): Promise<AdvertDetail>;
  getCached(id: string): AdvertDetail | null;
}
