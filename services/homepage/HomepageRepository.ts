import type { HomepageData } from '@/types';

export type HomepageQueryOptions = {
  /** true ise bellek önbelleğini atlar (pull-to-refresh). */
  fresh?: boolean;
};

/**
 * Ana sayfa veri sözleşmesi (DIP).
 * Mock → HttpHomepageRepository ile değiştirilir; UI değişmez.
 */
export interface IHomepageRepository {
  getHomepage(options?: HomepageQueryOptions): Promise<HomepageData>;
  getCached(): HomepageData | null;
}
