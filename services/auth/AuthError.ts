/** Auth hata sözleşmesi — Mock ve Http aynı tipi fırlatır. */
export class AuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}
