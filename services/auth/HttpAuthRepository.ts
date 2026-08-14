import { ApiError, HttpClient } from '@/services/http';
import type {
  AuthSession,
  AuthTokenResponse,
  AuthUser,
  EmailRequest,
  GenericAuthMessageResponse,
  LoginRequest,
  MyProfileResponse,
  RefreshSessionRequest,
  RegisterUserRequest,
  TokenRequest,
} from '@/types';
import { AuthError } from './AuthError';
import type { IAuthRepository } from './AuthRepository';
import { combineSession, mapProfileToUser } from './mapSession';

/**
 * HTTP auth — haradan-be AUTH-01/04/05/06 + ACCOUNT-01.
 */
export class HttpAuthRepository implements IAuthRepository {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async login(payload: LoginRequest): Promise<AuthSession> {
    const tokens = await this.guard(() =>
      this.http.request<AuthTokenResponse>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    try {
      const user = await this.getMe(tokens.accessToken);
      return combineSession(tokens, user);
    } catch (err) {
      if (err instanceof AuthError && (err.status === 401 || err.status === 403)) {
        throw err;
      }
      return combineSession(tokens, {
        id: '',
        email: payload.email.trim().toLowerCase(),
        firstName: '',
        lastName: '',
        phone: null,
      });
    }
  }

  register(payload: RegisterUserRequest): Promise<GenericAuthMessageResponse> {
    return this.guard(() =>
      this.http.request<GenericAuthMessageResponse>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  }

  forgotPassword(payload: EmailRequest): Promise<GenericAuthMessageResponse> {
    return this.guard(() =>
      this.http.request<GenericAuthMessageResponse>('/v1/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  }

  async refresh(payload: RefreshSessionRequest): Promise<AuthSession> {
    const tokens = await this.guard(() =>
      this.http.request<AuthTokenResponse>('/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    let user: AuthUser;
    try {
      user = await this.getMe(tokens.accessToken);
    } catch {
      user = {
        id: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: null,
      };
    }
    return combineSession(tokens, user);
  }

  async logout(accessToken: string): Promise<void> {
    await this.guard(() =>
      this.http.request<GenericAuthMessageResponse>('/v1/auth/logout', {
        method: 'POST',
        accessToken,
      })
    );
  }

  async getMe(accessToken: string): Promise<AuthUser> {
    const profile = await this.guard(() =>
      this.http.request<MyProfileResponse>('/v1/me', {
        method: 'GET',
        accessToken,
      })
    );
    return mapProfileToUser(profile);
  }

  resendVerification(
    payload: EmailRequest
  ): Promise<GenericAuthMessageResponse> {
    return this.guard(() =>
      this.http.request<GenericAuthMessageResponse>(
        '/v1/auth/resend-verification',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
    );
  }

  verifyEmail(payload: TokenRequest): Promise<GenericAuthMessageResponse> {
    return this.guard(() =>
      this.http.request<GenericAuthMessageResponse>('/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  }

  private async guard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof AuthError) throw err;
      if (err instanceof ApiError) {
        throw new AuthError(err.message, err.status, err.code);
      }
      throw new AuthError('Sunucuya ulaşılamadı.', 0, 'NETWORK');
    }
  }
}
