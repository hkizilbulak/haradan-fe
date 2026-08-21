import { resolveApiBaseUrl } from '@/services/http';
import type { IAuthRepository } from './AuthRepository';
import { HttpAuthRepository } from './HttpAuthRepository';
import { MockAuthRepository } from './MockAuthRepository';

export function createAuthRepository(): IAuthRepository {
  const baseUrl = resolveApiBaseUrl() || 'https://haradan-be-production.up.railway.app/api';
  return new HttpAuthRepository(baseUrl);
}

export const authRepository: IAuthRepository = createAuthRepository();

