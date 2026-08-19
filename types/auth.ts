/** OpenAPI: ClientContext — FE yalnız PUBLIC_WEB / MOBILE gönderir. */
export type ClientContext = 'PUBLIC_WEB' | 'MOBILE' | 'ADMIN_BO';

export type FeClientContext = Exclude<ClientContext, 'ADMIN_BO'>;

/** OpenAPI: LoginRequest */
export type LoginRequest = {
  email: string;
  password: string;
  clientContext: FeClientContext;
};

/** OpenAPI: RegisterUserRequest */
export type RegisterUserRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

/** OpenAPI: AuthTokenResponse — user yok; profil GET /v1/me. */
export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  clientContext?: ClientContext;
};

/** OpenAPI: GenericAuthMessageResponse */
export type GenericAuthMessageResponse = {
  message: string;
};

/** OpenAPI: EmailRequest */
export type EmailRequest = {
  email: string;
};

/** OpenAPI: TokenRequest (verify-email, confirm email change) */
export type TokenRequest = {
  token: string;
};

/** OpenAPI: RefreshSessionRequest */
export type RefreshSessionRequest = {
  refreshToken: string;
  clientContext: FeClientContext;
};

/** @deprecated OpenAPI logout body yok; Bearer access token. */
export type RefreshTokenRequest = RefreshSessionRequest;

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  emailVerified?: boolean;
};

/** OpenAPI: MyProfileResponse (ACCOUNT-01) */
export type MyProfileResponse = {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: string;
};

export type AuthSession = AuthTokenResponse & {
  email: string;
  user: AuthUser;
  /** Access token basım anı (epoch ms) — yenileme için. */
  issuedAt: number;
};

/** OpenAPI: ChangePasswordRequest (AUTH-12) */
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

/** OpenAPI: RequestEmailChangeRequest (AUTH-13) */
export type RequestEmailChangeRequest = {
  newEmail: string;
};

/** OpenAPI: UpdateMyProfileRequest (ACCOUNT-02) */
export type UpdateMyProfileRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
};
