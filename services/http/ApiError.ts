/** HTTP / ağ hataları — Mock ve Http aynı tipi fırlatır. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId?: string;

  constructor(
    message: string,
    status = 400,
    code = 'API_ERROR',
    traceId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}
