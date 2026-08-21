import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { IMyListingsRepository } from './MyListingsRepository';
import { HttpMyListingsRepository } from './HttpMyListingsRepository';
import { MockMyListingsRepository } from './MockMyListingsRepository';

export function createMyListingsRepository(): IMyListingsRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return new HttpMyListingsRepository(baseUrl);
}

export const myListingsRepository: IMyListingsRepository =
  createMyListingsRepository();

