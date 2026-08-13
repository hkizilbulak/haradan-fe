import type { IMyListingsRepository } from './MyListingsRepository';
import { HttpMyListingsRepository } from './HttpMyListingsRepository';
import { MockMyListingsRepository } from './MockMyListingsRepository';

/**
 * Varsayılan: mock.
 * HTTP: EXPO_PUBLIC_USE_HTTP_MY_LISTINGS=1 ve EXPO_PUBLIC_API_URL.
 */
export function createMyListingsRepository(): IMyListingsRepository {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_MY_LISTINGS === '1';
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (useHttp && baseUrl) {
    return new HttpMyListingsRepository(baseUrl);
  }
  return new MockMyListingsRepository();
}

export const myListingsRepository: IMyListingsRepository =
  createMyListingsRepository();
