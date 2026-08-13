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

/**
 * Auth sözleşmesi (DIP).
 * MockAuthRepository → HttpAuthRepository; UI / hook değişmez.
 *
 * Beklenen BE:
 *  POST /v1/auth/login
 *  POST /v1/auth/register
 *  POST /v1/auth/forgot-password
 *  POST /v1/auth/refresh
 *  POST /v1/auth/logout
 *  GET  /v1/auth/me
 */
export interface IAuthRepository {
  login(payload: LoginRequest): Promise<AuthSession>;
  register(payload: RegisterUserRequest): Promise<GenericAuthMessageResponse>;
  forgotPassword(payload: EmailRequest): Promise<GenericAuthMessageResponse>;
  refresh(payload: RefreshTokenRequest): Promise<AuthSession>;
  logout(payload: LogoutRequest): Promise<void>;
  getMe(accessToken: string): Promise<AuthUser>;
}
