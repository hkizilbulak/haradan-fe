import { useCallback, useEffect, useState } from 'react';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from '@/services/auth/sessionStore';
import { hydrateFreshSession } from '@/services/auth/tokenRefresh';
import type { AuthSession } from '@/types';

/** Login sonrası header / profil için oturum durumu. */
export function useAuthSession() {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    getAuthSession()
  );

  useEffect(
    () => subscribeAuthSession(() => setSessionState(getAuthSession())),
    []
  );

  useEffect(() => {
    void hydrateFreshSession();
  }, []);

  const setSession = useCallback((next: AuthSession | null) => {
    setAuthSession(next);
  }, []);

  const clearSession = useCallback(() => {
    clearAuthSession();
  }, []);

  return {
    session,
    isLoggedIn: session != null,
    setSession,
    clearSession,
  };
}
