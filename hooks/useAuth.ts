import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  authRepository,
  resolveFeClientContext,
  type IAuthRepository,
} from '@/services/auth';
import { setAuthSession } from '@/services/auth/sessionStore';
import type {
  AuthSession,
  GenericAuthMessageResponse,
  MyProfileResponse,
} from '@/types';

export function useAuth(repo: IAuthRepository = authRepository) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      try {
        return await fn();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Bir hata oluştu.';
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : null;
        setError(message);
        setErrorCode(code);
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
          email: email.trim(),
          password,
          clientContext: resolveFeClientContext(Platform.OS),
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
      const phone = input.phone?.trim();
      return run(() =>
        repo.register({
          email: input.email.trim(),
          password: input.password,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          ...(phone ? { phone } : {}),
        })
      );
    },
    [repo, run]
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<GenericAuthMessageResponse | null> => {
      return run(() => repo.forgotPassword({ email: email.trim() }));
    },
    [repo, run]
  );

  const resendVerification = useCallback(
    async (email: string): Promise<GenericAuthMessageResponse | null> => {
      return run(() => repo.resendVerification({ email: email.trim() }));
    },
    [repo, run]
  );

  const verifyEmail = useCallback(
    async (token: string): Promise<GenericAuthMessageResponse | null> => {
      return run(() => repo.verifyEmail({ token: token.trim() }));
    },
    [repo, run]
  );

  const confirmEmailChange = useCallback(
    async (token: string): Promise<GenericAuthMessageResponse | null> => {
      return run(() => repo.confirmEmailChange({ token: token.trim() }));
    },
    [repo, run]
  );

  const logout = useCallback(
    async (accessToken: string | null): Promise<void> => {
      if (accessToken) {
        try {
          await repo.logout(accessToken);
        } catch {
          /* oturumu yine de kapat */
        }
      }
      setAuthSession(null);
    },
    [repo]
  );

  const changePassword = useCallback(
    async (
      accessToken: string,
      currentPassword: string,
      newPassword: string
    ): Promise<GenericAuthMessageResponse | null> => {
      return run(() =>
        repo.changePassword(accessToken, { currentPassword, newPassword })
      );
    },
    [repo, run]
  );

  const requestEmailChange = useCallback(
    async (
      accessToken: string,
      newEmail: string
    ): Promise<GenericAuthMessageResponse | null> => {
      return run(() =>
        repo.requestEmailChange(accessToken, { newEmail: newEmail.trim() })
      );
    },
    [repo, run]
  );

  const updateProfile = useCallback(
    async (
      accessToken: string,
      payload: { firstName?: string; lastName?: string; phone?: string | null }
    ): Promise<MyProfileResponse | null> => {
      return run(() => repo.updateProfile(accessToken, payload));
    },
    [repo, run]
  );

  return {
    loading,
    error,
    errorCode,
    clearError,
    login,
    register,
    forgotPassword,
    resendVerification,
    verifyEmail,
    confirmEmailChange,
    logout,
    changePassword,
    requestEmailChange,
    updateProfile,
  };
}
