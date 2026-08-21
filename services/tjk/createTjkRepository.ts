import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { ITjkRepository } from './TjkRepository';
import { HttpTjkRepository } from './HttpTjkRepository';
import { MockTjkRepository } from './MockTjkRepository';

export function createTjkRepository(): ITjkRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return new HttpTjkRepository(baseUrl);
}

export const tjkRepository: ITjkRepository = createTjkRepository();

