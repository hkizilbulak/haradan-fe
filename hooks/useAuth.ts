import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  authRepository,
  type IAuthRepository,
} from '@/services/auth';
import { setAuthSession } from '@/services/auth/sessionStore';
import type {
  AuthSession,
  ClientContext,
  GenericAuthMessageResponse,
} from '@/types';

function resolveClientContext(): ClientContext {
  return Platform.OS === 'web' ? 'PUBLIC_WEB' : 'MOBILE';
}

export function useAuth(repo: IAuthRepository = authRepository) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Bir hata oluştu.';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<AuthSession | null> => {
      const session = await run(() =>
        repo.login({
          email,
          password,
          clientContext: resolveClientContext(),
        })
      );
      if (session) setAuthSession(session);
      return session;
    },
    [repo, run]
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    }): Promise<GenericAuthMessageResponse | null> => {
      return run(() => repo.register(input));
    },
    [repo, run]
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<GenericAuthMessageResponse | null> => {
      return run(() => repo.forgotPassword({ email }));
    },
    [repo, run]
  );

  const logout = useCallback(
    async (refreshToken: string | null): Promise<void> => {
      if (refreshToken) {
        try {
          await repo.logout({ refreshToken });
        } catch {
          /* oturumu yine de kapat */
        }
      }
      setAuthSession(null);
    },
    [repo]
  );

  return {
    loading,
    error,
    clearError,
    login,
    register,
    forgotPassword,
    logout,
  };
}
