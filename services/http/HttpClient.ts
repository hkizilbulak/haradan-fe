import { clearAuthSession } from '@/services/auth/sessionStore';
import { ApiError } from './ApiError';
import { parseBeErrorBody, userFacingBeMessage } from './errorResponse';

type RequestOptions = RequestInit & {
  accessToken?: string;
};

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

/**
 * Paylaşılan HTTP istemcisi.
 * Base URL OpenAPI server (`…/api`); path’ler `/v1/...`.
 */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const { accessToken, headers, body, ...rest } = init;
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const isBinary =
      typeof Blob !== 'undefined' && body instanceof Blob
        ? true
        : typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;

    let res: Response;
    try {
      res = await fetch(url, {
        ...rest,
        method: rest.method ?? 'GET',
        cache: 'no-store',
        body,
        credentials: 'omit',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          ...(body && !isForm && !isBinary
            ? { 'Content-Type': 'application/json' }
            : null),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : null),
          ...headers,
        },
      });
    } catch (err) {
      if (isAbortError(err)) throw err;
      throw new ApiError('Sunucuya ulaşılamadı.', 0, 'NETWORK');
    }

    if (!res.ok) {
      const parsed = await readBeError(res);
      if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
        clearAuthSession();
      }
      throw new ApiError(
        parsed.message,
        res.status,
        parsed.code,
        parsed.traceId
      );
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }
}

async function readBeError(
  res: Response
): Promise<{ message: string; code: string; traceId?: string }> {
  try {
    const raw: unknown = await res.json();
    const body = parseBeErrorBody(raw);
    return {
      message: userFacingBeMessage(res.status, body),
      code: body?.code ?? 'HTTP',
      traceId: body?.traceId,
    };
  } catch {
    return {
      message: userFacingBeMessage(res.status, null),
      code: 'HTTP',
    };
  }
}
