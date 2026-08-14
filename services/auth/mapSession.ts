import type { AuthSession, AuthTokenResponse, AuthUser } from '@/types';

const ACCESS_SKEW_MS = 60_000;

export function mapProfileToUser(profile: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  emailVerified?: boolean;
}): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone ?? null,
    emailVerified: profile.emailVerified === true,
  };
}

export function combineSession(
  tokens: AuthTokenResponse,
  user: AuthUser,
  issuedAt = Date.now()
): AuthSession {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: 'Bearer',
    expiresIn: tokens.expiresIn,
    clientContext: tokens.clientContext,
    email: user.email,
    user,
    issuedAt,
  };
}

export function isAccessTokenFresh(
  session: Pick<AuthSession, 'issuedAt' | 'expiresIn'>,
  now = Date.now(),
  skewMs = ACCESS_SKEW_MS
): boolean {
  if (!session.issuedAt || !session.expiresIn) return false;
  const expiresAt = session.issuedAt + session.expiresIn * 1000;
  return expiresAt - skewMs > now;
}
