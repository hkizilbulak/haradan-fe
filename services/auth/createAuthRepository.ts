import type { IAuthRepository } from './AuthRepository';
import { HttpAuthRepository } from './HttpAuthRepository';
import { MockAuthRepository } from './MockAuthRepository';

/**
 * Varsayılan: mock.
 * HTTP: EXPO_PUBLIC_USE_HTTP_AUTH=1 ve EXPO_PUBLIC_API_URL.
 */
export function createAuthRepository(): IAuthRepository {
  const useHttp = process.env.EXPO_PUBLIC_USE_HTTP_AUTH === '1';
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (useHttp && baseUrl) {
    return new HttpAuthRepository(baseUrl);
  }
  return new MockAuthRepository();
}

export const authRepository: IAuthRepository = createAuthRepository();
