import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IMyListingsRepository } from './MyListingsRepository';
import { HttpMyListingsRepository } from './HttpMyListingsRepository';
import { MockMyListingsRepository } from './MockMyListingsRepository';

/**
 * Varsayılan: API URL varsa HTTP (`EXPO_PUBLIC_USE_MOCK_MY_LISTINGS=1` mock).
 */
export function createMyListingsRepository(): IMyListingsRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_MY_LISTINGS)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpMyListingsRepository(baseUrl);
  }
  return new MockMyListingsRepository();
}

export const myListingsRepository: IMyListingsRepository =
  createMyListingsRepository();
