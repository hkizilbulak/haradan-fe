import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { ITjkRepository } from './TjkRepository';
import { HttpTjkRepository } from './HttpTjkRepository';
import { MockTjkRepository } from './MockTjkRepository';

export function createTjkRepository(): ITjkRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_TJK)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpTjkRepository(baseUrl);
  }
  return new MockTjkRepository();
}

export const tjkRepository: ITjkRepository = createTjkRepository();
