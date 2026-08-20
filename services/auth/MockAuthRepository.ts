import type {
  AuthSession,
  AuthUser,
  ChangePasswordRequest,
  EmailRequest,
  GenericAuthMessageResponse,
  LoginRequest,
  MyProfileResponse,
  RefreshSessionRequest,
  RegisterUserRequest,
  RequestEmailChangeRequest,
  TokenRequest,
  UpdateMyProfileRequest,
} from '@/types';
import { AuthError } from './AuthError';
import type { IAuthRepository } from './AuthRepository';
import { combineSession } from './mapSession';
import {
  mockUserDirectory,
  toAuthUser,
  type MockUserRecord,
} from './mockUsers';

const LATENCY_MS = 550;
const REGISTER_MESSAGE = 'Kayıt başarılı.';

/**
 * Mock auth — haradan-be AUTH sözleşmesi ile hizalı.
 * Demo (yalnız mock): demo@cartzilla.com / password123
 */
export class MockAuthRepository implements IAuthRepository {
  async login(payload: LoginRequest): Promise<AuthSession> {
    await delay(LATENCY_MS);
    const email = payload.email.trim().toLowerCase();
    if (!email || !payload.password) {
      throw new AuthError('Geçerli kimlik bilgileri girin.', 422, 'VALIDATION_ERROR');
    }
    if (!isValidEmail(email)) {
      throw new AuthError('Geçerli kimlik bilgileri girin.', 422, 'VALIDATION_ERROR');
    }

    const user = mockUserDirectory.findByEmail(email);
    if (!user || user.password !== payload.password) {
      throw new AuthError(
        'E-posta veya parola hatalı.',
        401,
        'UNAUTHENTICATED'
      );
    }

    return issueSession(user, payload.clientContext);
  }

  async register(
    payload: RegisterUserRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    const email = payload.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw new AuthError('Geçerli bir e-posta girin.', 422, 'VALIDATION_ERROR');
    }
    if (payload.password.length < 8) {
      throw new AuthError(
        'Parola en az 8 karakter olmalıdır.',
        422,
        'VALIDATION_ERROR'
      );
    }
    if (!payload.firstName.trim()) {
      throw new AuthError('Ad zorunludur.', 422, 'VALIDATION_ERROR');
    }
    if (!payload.lastName.trim()) {
      throw new AuthError('Soyad zorunludur.', 422, 'VALIDATION_ERROR');
    }
    if (!mockUserDirectory.findByEmail(email)) {
      mockUserDirectory.add({
        id: `user-${Date.now()}`,
        email,
        password: payload.password,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phone: payload.phone ?? null,
      });
    }
    return { message: REGISTER_MESSAGE };
  }

  async forgotPassword(
    payload: EmailRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    const email = payload.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw new AuthError('Geçerli bir e-posta girin.', 422, 'VALIDATION_ERROR');
    }
    return {
      message: 'Bu e-posta ile bir hesap varsa sıfırlama talimatı gönderildi.',
    };
  }

  async refresh(payload: RefreshSessionRequest): Promise<AuthSession> {
    await delay(200);
    if (!payload.refreshToken.startsWith('mock-refresh-')) {
      throw new AuthError('Oturum yenilenemedi.', 401, 'TOKEN_INVALID');
    }
    const demo = mockUserDirectory.findByEmail('demo@cartzilla.com');
    if (!demo) {
      throw new AuthError('Oturum yenilenemedi.', 401, 'TOKEN_INVALID');
    }
    return issueSession(demo, payload.clientContext);
  }

  async logout(_accessToken: string): Promise<void> {
    await delay(150);
  }

  async getMe(accessToken: string): Promise<AuthUser> {
    await delay(200);
    if (!accessToken.startsWith('mock-access-')) {
      throw new AuthError('Kimlik doğrulama gerekli.', 401, 'UNAUTHENTICATED');
    }
    const demo = mockUserDirectory.findByEmail('demo@cartzilla.com');
    if (!demo) {
      throw new AuthError('Kullanıcı bulunamadı.', 404, 'NOT_FOUND');
    }
    return toAuthUser(demo);
  }

  async resendVerification(
    payload: EmailRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    if (!isValidEmail(payload.email.trim().toLowerCase())) {
      throw new AuthError('Geçerli bir e-posta girin.', 422, 'VALIDATION_ERROR');
    }
    return { message: 'Doğrulama e-postası talimatları gönderildi.' };
  }

  async verifyEmail(
    payload: TokenRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    if (!payload.token.trim()) {
      throw new AuthError('Doğrulama jetonu geçersiz.', 400, 'TOKEN_INVALID');
    }
    return { message: 'E-posta adresi doğrulandı.' };
  }

  async changePassword(
    accessToken: string,
    payload: ChangePasswordRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    if (!accessToken.startsWith('mock-access-')) {
      throw new AuthError('Kimlik doğrulama gerekli.', 401, 'UNAUTHENTICATED');
    }
    if (!payload.currentPassword) {
      throw new AuthError('Mevcut şifre zorunludur.', 422, 'VALIDATION_ERROR');
    }
    if (!payload.newPassword || payload.newPassword.length < 8) {
      throw new AuthError(
        'Yeni şifre en az 8 karakter olmalıdır.',
        422,
        'VALIDATION_ERROR'
      );
    }
    const demo = mockUserDirectory.findByEmail('demo@cartzilla.com');
    if (!demo) {
      throw new AuthError('Kullanıcı bulunamadı.', 404, 'NOT_FOUND');
    }
    if (demo.password !== payload.currentPassword) {
      throw new AuthError('Mevcut şifre hatalı.', 422, 'VALIDATION_ERROR');
    }
    demo.password = payload.newPassword;
    mockUserDirectory.add(demo);
    return { message: 'Şifreniz başarıyla değiştirildi.' };
  }

  async requestEmailChange(
    accessToken: string,
    payload: RequestEmailChangeRequest
  ): Promise<GenericAuthMessageResponse> {
    await delay(LATENCY_MS);
    if (!accessToken.startsWith('mock-access-')) {
      throw new AuthError('Kimlik doğrulama gerekli.', 401, 'UNAUTHENTICATED');
    }
    if (!payload.newEmail || !isValidEmail(payload.newEmail.trim().toLowerCase())) {
      throw new AuthError('Geçerli bir e-posta girin.', 422, 'VALIDATION_ERROR');
    }
    return { message: 'Yeni e-posta adresinize doğrulama bağlantısı gönderildi.' };
  }

  async updateProfile(
    accessToken: string,
    payload: UpdateMyProfileRequest
  ): Promise<MyProfileResponse> {
    await delay(LATENCY_MS);
    if (!accessToken.startsWith('mock-access-')) {
      throw new AuthError('Kimlik doğrulama gerekli.', 401, 'UNAUTHENTICATED');
    }
    const demo = mockUserDirectory.findByEmail('demo@cartzilla.com');
    if (!demo) {
      throw new AuthError('Kullanıcı bulunamadı.', 404, 'NOT_FOUND');
    }
    if (payload.firstName !== undefined) demo.firstName = payload.firstName.trim();
    if (payload.lastName !== undefined) demo.lastName = payload.lastName.trim();
    if (payload.phone !== undefined) demo.phone = payload.phone;
    return {
      id: demo.id,
      email: demo.email,
      emailVerified: true,
      firstName: demo.firstName,
      lastName: demo.lastName,
      phone: demo.phone,
      role: 'USER',
      status: 'ACTIVE',
    };
  }
}

function issueSession(
  record: MockUserRecord,
  clientContext: LoginRequest['clientContext']
): AuthSession {
  return combineSession(
    {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      clientContext,
    },
    toAuthUser(record)
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
