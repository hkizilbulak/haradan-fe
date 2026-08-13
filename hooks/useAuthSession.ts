import { useCallback, useEffect, useState } from 'react';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from '@/services/auth/sessionStore';
import type { AuthSession } from '@/types';

/** Login sonrası header / profil için oturum durumu. */
export function useAuthSession() {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    getAuthSession()
  );

  useEffect(() => subscribeAuthSession(() => setSessionState(getAuthSession())), []);

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
