import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
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
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSession,
    getAuthSession
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
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
    ready,
    setSession,
    clearSession,
  };
}
