import type {
  AuthSession,
  AuthUser,
  ChangePasswordRequest,
  EmailRequest,
  FeClientContext,
  GenericAuthMessageResponse,
  LoginRequest,
  MyProfileResponse,
  RefreshSessionRequest,
  RegisterUserRequest,
  RequestEmailChangeRequest,
  TokenRequest,
  UpdateMyProfileRequest,
} from '@/types';

/**
 * Auth sözleşmesi (DIP) — haradan-be OpenAPI AUTH-01…06 + ACCOUNT-01.
 *
 * POST /v1/auth/register
 * POST /v1/auth/login
 * POST /v1/auth/refresh
 * POST /v1/auth/logout          Bearer
 * POST /v1/auth/password/forgot
 * POST /v1/auth/resend-verification
 * POST /v1/auth/verify-email
 * GET  /v1/me                  Bearer
 * PATCH /v1/me                 Bearer  (ACCOUNT-02)
 * POST /v1/me/password         Bearer  (AUTH-12)
 * POST /v1/me/email/change-request Bearer (AUTH-13)
 */
export interface IAuthRepository {
  login(payload: LoginRequest): Promise<AuthSession>;
  register(payload: RegisterUserRequest): Promise<GenericAuthMessageResponse>;
  forgotPassword(payload: EmailRequest): Promise<GenericAuthMessageResponse>;
  refresh(payload: RefreshSessionRequest): Promise<AuthSession>;
  logout(accessToken: string): Promise<void>;
  getMe(accessToken: string): Promise<AuthUser>;
  resendVerification(payload: EmailRequest): Promise<GenericAuthMessageResponse>;
  verifyEmail(payload: TokenRequest): Promise<GenericAuthMessageResponse>;
  changePassword(accessToken: string, payload: ChangePasswordRequest): Promise<GenericAuthMessageResponse>;
  requestEmailChange(accessToken: string, payload: RequestEmailChangeRequest): Promise<GenericAuthMessageResponse>;
  updateProfile(accessToken: string, payload: UpdateMyProfileRequest): Promise<MyProfileResponse>;
}

export function resolveFeClientContext(
  os: 'web' | 'ios' | 'android' | string
): FeClientContext {
  return os === 'web' ? 'PUBLIC_WEB' : 'MOBILE';
}
