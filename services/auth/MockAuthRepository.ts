import type {
  AuthSession,
  AuthUser,
  EmailRequest,
  GenericAuthMessageResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterUserRequest,
} from '@/types';
import { AuthError } from './AuthError';
import type { IAuthRepository } from './AuthRepository';
import {
  mockUserDirectory,
  toAuthUser,
  type MockUserRecord,
} from './mockUsers';

const LATENCY_MS = 550;

/**
 * Mock auth — haradan-be alanlarıyla uyumlu.
 * Demo: demo@cartzilla.com / password123
 */
export class MockAuthRepository implements IAuthRepository {
  async login(payload: LoginRequest): Promise<AuthSession> {
    await delay(LATENCY_MS);
    const email = payload.email.trim().toLowerCase();
    if (!email || !payload.password) {
      throw new AuthError('E-posta ve şifre gerekli.', 400, 'VALIDATION');
    }
    if (!isValidEmail(email)) {
      throw new AuthError('Geçerli bir e-posta girin.', 400, 'VALIDATION');
    }

    const user = mockUserDirectory.findByEmail(email);
    if (!user || user.password !== payload.password) {
      throw new AuthError('E-posta veya şifre hatalı.', 401, 'INVALID_CREDENTIALS');
    }

    return issueSession(user, payload.clientContext);
  }

  async register(
    payload: RegisterUserRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    const email = payload.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw new AuthError('Geçerli bir e-posta girin.', 400, 'VALIDATION');
    }
    if (payload.password.length < 8) {
      throw new AuthError('Şifre en az 8 karakter olmalı.', 400, 'VALIDATION');
    }
    if (!payload.firstName.trim() || !payload.lastName.trim()) {
      throw new AuthError('Ad ve soyad gerekli.', 400, 'VALIDATION');
    }
    if (mockUserDirectory.findByEmail(email)) {
      throw new AuthError('Bu e-posta zaten kayıtlı.', 409, 'EMAIL_TAKEN');
    }

    mockUserDirectory.add({
      id: `user-${Date.now()}`,
      email,
      password: payload.password,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      phone: payload.phone ?? null,
    });

    return {
      message: 'Kayıt başarılı. Giriş yapabilirsiniz.',
    };
  }

  async forgotPassword(
    payload: EmailRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    const email = payload.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw new AuthError('Geçerli bir e-posta girin.', 400, 'VALIDATION');
    }
    return {
      message:
        'Bu e-posta ile bir hesap varsa sıfırlama talimatı gönderildi.',
    };
  }

  async refresh(payload: RefreshTokenRequest): Promise<AuthSession> {
    await delay(200);
    if (!payload.refreshToken.startsWith('mock-refresh-')) {
      throw new AuthError('Oturum yenilenemedi.', 401, 'INVALID_REFRESH');
    }
    const demo = mockUserDirectory.findByEmail('demo@cartzilla.com');
    if (!demo) {
      throw new AuthError('Oturum yenilenemedi.', 401, 'INVALID_REFRESH');
    }
    return issueSession(demo, payload.clientContext);
  }

  async logout(_payload: LogoutRequest): Promise<void> {
    await delay(150);
  }

  async getMe(accessToken: string): Promise<AuthUser> {
    await delay(200);
    if (!accessToken.startsWith('mock-access-')) {
      throw new AuthError('Oturum geçersiz.', 401, 'UNAUTHORIZED');
    }
    const demo = mockUserDirectory.findByEmail('demo@cartzilla.com');
    if (!demo) {
      throw new AuthError('Kullanıcı bulunamadı.', 404, 'NOT_FOUND');
    }
    return toAuthUser(demo);
  }
}

function issueSession(
  record: MockUserRecord,
  clientContext: LoginRequest['clientContext']
): AuthSession {
  const user = toAuthUser(record);
  return {
    accessToken: `mock-access-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    clientContext,
    email: user.email,
    user,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
