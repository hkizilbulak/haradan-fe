/**
 * BE OpenAPI server = `/api`. Business paths = `/v1/...`.
 * Prefers runtime `window.__HARADAN_API_URL__` (Railway serve injects it)
 * so a rebuild is not required when only the API origin changes.
 */
export function resolveApiBaseUrl(
  raw: string | undefined = readRawApiUrl()
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme.replace(/\/\.+$/, ''));
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (!parsed.hostname) return null;
  return `${parsed.origin}/api`;
}

function readRawApiUrl(): string | undefined {
  if (typeof globalThis !== 'undefined') {
    const runtime = (globalThis as { __HARADAN_API_URL__?: unknown })
      .__HARADAN_API_URL__;
    if (typeof runtime === 'string' && runtime.trim()) return runtime;
  }
  return process.env.EXPO_PUBLIC_API_URL;
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
