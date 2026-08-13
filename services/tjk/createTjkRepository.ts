import type { ITjkRepository } from './TjkRepository';
import { HttpTjkRepository } from './HttpTjkRepository';
import { MockTjkRepository } from './MockTjkRepository';

/**
 * Varsayılan: mock.
 * HTTP: EXPO_PUBLIC_USE_HTTP_TJK=1 ve EXPO_PUBLIC_API_URL.
 */
export function createTjkRepository(): ITjkRepository {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_TJK === '1';
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (useHttp && baseUrl) {
    return new HttpTjkRepository(baseUrl);
  }
  return new MockTjkRepository();
}

export const tjkRepository: ITjkRepository = createTjkRepository();
