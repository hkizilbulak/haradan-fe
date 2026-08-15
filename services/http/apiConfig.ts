/**
 * BE OpenAPI server = `/api`. Business paths = `/v1/...`.
 * EXPO_PUBLIC_API_URL: `http://localhost:8080` veya `http://localhost:8080/api`.
 */
export function resolveApiBaseUrl(
  raw: string | undefined = process.env.EXPO_PUBLIC_API_URL
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const noSlash = trimmed.replace(/\/+$/, '');
  if (noSlash.endsWith('/api/v1')) return noSlash.slice(0, -3);
  if (noSlash.endsWith('/api')) return noSlash;
  return `${noSlash}/api`;
}

export function isHttpAuthEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_USE_MOCK_AUTH === '1') return false;
  return resolveApiBaseUrl() != null;
}

/** Auth ile aynı kural: URL varsa HTTP; EXPO_PUBLIC_USE_MOCK_API=1 mock’a zorlar. */
export function isHttpApiEnabled(serviceMockFlag?: string): boolean {
  if (serviceMockFlag === '1') return false;
  if (process.env.EXPO_PUBLIC_USE_MOCK_API === '1') return false;
  return resolveApiBaseUrl() != null;
}
