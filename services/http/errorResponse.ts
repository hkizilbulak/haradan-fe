export type BeFieldError = {
  field: string;
  message: string;
  code?: string;
};

export type BeErrorBody = {
  code?: string;
  message?: string;
  traceId?: string;
  fieldErrors?: BeFieldError[];
};

export function parseBeErrorBody(raw: unknown): BeErrorBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const fieldErrors = Array.isArray(o.fieldErrors)
    ? o.fieldErrors
        .map((item): BeFieldError | null => {
          if (!item || typeof item !== 'object') return null;
          const f = item as Record<string, unknown>;
          if (typeof f.field !== 'string' || typeof f.message !== 'string') {
            return null;
          }
          const mapped: BeFieldError = {
            field: f.field,
            message: f.message,
          };
          if (typeof f.code === 'string') mapped.code = f.code;
          return mapped;
        })
        .filter((x): x is BeFieldError => x != null)
    : undefined;
  return {
    code: typeof o.code === 'string' ? o.code : undefined,
    message: typeof o.message === 'string' ? o.message : undefined,
    traceId: typeof o.traceId === 'string' ? o.traceId : undefined,
    fieldErrors,
  };
}

export function firstFieldErrorMessage(body: BeErrorBody | null): string | null {
  const first = body?.fieldErrors?.[0]?.message?.trim();
  return first || null;
}

export function userFacingBeMessage(
  status: number,
  body: BeErrorBody | null,
  fallback?: string
): string {
  const field = firstFieldErrorMessage(body);
  if (field) return field;
  if (body?.message?.trim()) return body.message.trim();
  if (fallback) return fallback;
  if (status === 401) return 'E-posta veya parola hatalı.';
  if (status === 403) return 'Bu işlem için yetkiniz yok.';
  if (status === 429) return 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.';
  if (status === 503) return 'Servis şu anda kullanılamıyor.';
  if (status >= 500) return 'Beklenmeyen bir sunucu hatası oluştu.';
  return `İstek başarısız (${status}).`;
}
