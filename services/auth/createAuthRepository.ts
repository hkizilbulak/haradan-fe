import { resolveApiBaseUrl } from '@/services/http';
import type { IAuthRepository } from './AuthRepository';
import { HttpAuthRepository } from './HttpAuthRepository';
import { MockAuthRepository } from './MockAuthRepository';

/**
 * Varsayılan: EXPO_PUBLIC_API_URL varsa HTTP.
 * Mock: EXPO_PUBLIC_USE_MOCK_AUTH=1 veya URL yok.
 */
export function createAuthRepository(): IAuthRepository {
  if (process.env.EXPO_PUBLIC_USE_MOCK_AUTH === '1') {
    return new MockAuthRepository();
  }
  const baseUrl = resolveApiBaseUrl();
  if (baseUrl) return new HttpAuthRepository(baseUrl);
  return new MockAuthRepository();
}

export const authRepository: IAuthRepository = createAuthRepository();
