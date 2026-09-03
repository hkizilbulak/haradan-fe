import type { FeClientContext } from '@/types';
import { ApiError } from '../http/ApiError';
import { authRepository } from './createAuthRepository';
import { isAccessTokenFresh } from './mapSession';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from './sessionStore';

let refreshInFlight: Promise<string | null> | null = null;

export function resolveStoredClientContext(): FeClientContext {
  const ctx = getAuthSession()?.clientContext;
  return ctx === 'MOBILE' ? 'MOBILE' : 'PUBLIC_WEB';
}

/**
 * Access token’ı döner; skew içindeyse refresh rotate eder (tek uçuş).
 */
export async function getValidAccessToken(): Promise<string | null> {
  const current = getAuthSession();
  if (!current) return null;
  if (isAccessTokenFresh(current)) return current.accessToken;
  return refreshAccessToken();
}

/**
 * Refresh token ile yeni access token alır; storage ve user state günceller.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<string | null> {
  const current = getAuthSession();
  if (!current?.refreshToken) {
    clearAuthSession();
    return null;
  }
  try {
    const next = await authRepository.refresh({
      refreshToken: current.refreshToken,
      clientContext: resolveStoredClientContext(),
    });
    const user =
      next.user.id && next.user.email
        ? next.user
        : current.user;
    setAuthSession({ ...next, user, email: user.email });
    return next.accessToken;
  } catch (err: unknown) {
    if (
      err instanceof ApiError &&
      (err.status === 401 ||
        err.status === 403 ||
        err.code === 'TOKEN_INVALID' ||
        err.code === 'TOKEN_EXPIRED' ||
        err.code === 'SESSION_REVOKED' ||
        err.code === 'REFRESH_REPLAY_DETECTED')
    ) {
      clearAuthSession();
    }
    return null;
  }
}

export async function hydrateFreshSession(): Promise<void> {
  const current = getAuthSession();
  if (!current) return;
  if (isAccessTokenFresh(current)) return;
  await refreshAccessToken();
}
