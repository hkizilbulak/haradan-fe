import { ApiError } from './ApiError';

type RequestOptions = RequestInit & {
  accessToken?: string;
};

/**
 * Paylaşılan HTTP istemcisi — listing / TJK / media.
 * Auth repo kendi istemcisini korur; yeni servisler buradan geçer.
 */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const { accessToken, headers, body, ...rest } = init;
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

    let res: Response;
    try {
      res = await fetch(url, {
        ...rest,
        body,
        headers: {
          Accept: 'application/json',
          ...(isForm ? null : { 'Content-Type': 'application/json' }),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : null),
          ...headers,
        },
      });
    } catch {
      throw new ApiError('Sunucuya ulaşılamadı.', 0, 'NETWORK');
    }

    if (!res.ok) {
      throw new ApiError(await readErrorMessage(res), res.status, 'HTTP');
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `İstek başarısız (${res.status}).`;
  } catch {
    return `İstek başarısız (${res.status}).`;
  }
}
