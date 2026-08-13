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

type TokenDto = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
  clientContext?: LoginRequest['clientContext'];
  email?: string;
  user?: AuthUser;
};

/**
 * HTTP auth — EXPO_PUBLIC_API_URL + EXPO_PUBLIC_USE_HTTP_AUTH=1 ile açılır.
 * UI / hook aynı IAuthRepository üzerinden kalır.
 */
export class HttpAuthRepository implements IAuthRepository {
  constructor(private readonly baseUrl: string) {}

  login(payload: LoginRequest): Promise<AuthSession> {
    return this.postSession('/v1/auth/login', payload);
  }

  register(payload: RegisterUserRequest): Promise<GenericAuthMessageResponse> {
    return this.postMessage('/v1/auth/register', payload);
  }

  forgotPassword(payload: EmailRequest): Promise<GenericAuthMessageResponse> {
    return this.postMessage('/v1/auth/forgot-password', payload);
  }

  refresh(payload: RefreshTokenRequest): Promise<AuthSession> {
    return this.postSession('/v1/auth/refresh', payload);
  }

  async logout(payload: LogoutRequest): Promise<void> {
    await this.request('/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getMe(accessToken: string): Promise<AuthUser> {
    return this.request<AuthUser>('/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  private async postSession(
    path: string,
    body: unknown
  ): Promise<AuthSession> {
    const dto = await this.request<TokenDto>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapTokenDto(dto);
  }

  private postMessage(
    path: string,
    body: unknown
  ): Promise<GenericAuthMessageResponse> {
    return this.request<GenericAuthMessageResponse>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
    } catch {
      throw new AuthError('Sunucuya ulaşılamadı.', 0, 'NETWORK');
    }

    if (!res.ok) {
      const message = await readErrorMessage(res);
      throw new AuthError(message, res.status, 'HTTP');
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

function mapTokenDto(dto: TokenDto): AuthSession {
  const email = dto.user?.email ?? dto.email ?? '';
  const user: AuthUser = dto.user ?? {
    id: '',
    email,
    firstName: '',
    lastName: '',
    phone: null,
  };
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    tokenType: (dto.tokenType as 'Bearer') ?? 'Bearer',
    expiresIn: dto.expiresIn,
    clientContext: dto.clientContext,
    email,
    user,
  };
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `İstek başarısız (${res.status}).`;
  } catch {
    return `İstek başarısız (${res.status}).`;
  }
}
