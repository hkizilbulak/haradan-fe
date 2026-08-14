import type { AuthSession } from '@/types';

function normalizeSession(raw: AuthSession): AuthSession {
  const email = raw.user?.email ?? raw.email ?? '';
  return {
    ...raw,
    email,
    issuedAt: raw.issuedAt ?? 0,
    expiresIn: raw.expiresIn ?? 0,
    tokenType: 'Bearer',
    user: {
      id: raw.user?.id ?? '',
      email,
      firstName: raw.user?.firstName ?? '',
      lastName: raw.user?.lastName ?? '',
      phone: raw.user?.phone ?? null,
      emailVerified: raw.user?.emailVerified === true,
    },
  };
}

const STORAGE_KEY = 'haradan.authSession';

type Listener = () => void;

let session: AuthSession | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function readStorage(): AuthSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw) as AuthSession);
  } catch {
    return null;
  }
}

function writeStorage(next: AuthSession | null) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hydrateAuthSession(): AuthSession | null {
  if (!hydrated) {
    session = readStorage();
    hydrated = true;
  }
  return session;
}

export function getAuthSession(): AuthSession | null {
  hydrateAuthSession();
  return session;
}

export function setAuthSession(next: AuthSession | null): void {
  session = next ? normalizeSession(next) : null;
  hydrated = true;
  writeStorage(session);
  notify();
}

export function patchAuthSession(partial: Partial<AuthSession>): void {
  const current = getAuthSession();
  if (!current) return;
  setAuthSession({ ...current, ...partial });
}

export function clearAuthSession(): void {
  setAuthSession(null);
}

export function subscribeAuthSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
