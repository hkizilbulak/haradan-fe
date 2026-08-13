/** OpenAPI: ClientContext */
export type ClientContext = 'PUBLIC_WEB' | 'MOBILE' | 'ADMIN_BO';

/** OpenAPI: LoginRequest */
export type LoginRequest = {
  email: string;
  password: string;
  clientContext: ClientContext;
};

/** OpenAPI: RegisterUserRequest */
export type RegisterUserRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

/** OpenAPI: AuthTokenResponse */
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

/** OpenAPI: EmailRequest (forgot password) */
export type EmailRequest = {
  email: string;
};

export type AuthSession = AuthTokenResponse & {
  email: string;
  user: AuthUser;
};

/** Oturumdaki kullanıcı — GET /v1/auth/me ile aynı şekil. */
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

/** OpenAPI: RefreshTokenRequest */
export type RefreshTokenRequest = {
  refreshToken: string;
  clientContext: ClientContext;
};

/** OpenAPI: LogoutRequest */
export type LogoutRequest = {
  refreshToken: string;
};
