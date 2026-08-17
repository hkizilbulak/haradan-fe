/**
 * Auth sözleşme self-test — BE OpenAPI ile hizalı.
 * Çalıştır: npx tsx scripts/selftest-auth.ts
 */
import { HttpAuthRepository } from '../services/auth/HttpAuthRepository';
import { AuthError } from '../services/auth/AuthError';
import { combineSession, isAccessTokenFresh } from '../services/auth/mapSession';
import { resolveApiBaseUrl } from '../services/http/apiConfig';
import {
  parseBeErrorBody,
  userFacingBeMessage,
} from '../services/http/errorResponse';

let failed = 0;
let passed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

assertEqual(resolveApiBaseUrl('http://localhost:8080'), 'http://localhost:8080/api', 'base url appends /api');
assertEqual(resolveApiBaseUrl('http://localhost:8080/'), 'http://localhost:8080/api', 'base url strips slash');
assertEqual(resolveApiBaseUrl('http://localhost:8080/api'), 'http://localhost:8080/api', 'base url keeps /api');
assertEqual(resolveApiBaseUrl('http://localhost:8080/api/v1'), 'http://localhost:8080/api', 'base url strips /v1');
assertEqual(
  resolveApiBaseUrl('https://haradan-be-production.up.railway.app/api/v1/...'),
  'https://haradan-be-production.up.railway.app/api',
  'strips placeholder path to /api'
);
assertEqual(resolveApiBaseUrl(''), null, 'empty url is null');
assertEqual(resolveApiBaseUrl(undefined), null, 'undefined url is null');

const unauth = parseBeErrorBody({
  code: 'UNAUTHENTICATED',
  message: 'E-posta veya parola hatalı.',
  traceId: 't1',
});
assertEqual(unauth?.code, 'UNAUTHENTICATED', 'parse unauthenticated code');
assertEqual(
  userFacingBeMessage(401, unauth),
  'E-posta veya parola hatalı.',
  'user message from BE'
);

const validation = parseBeErrorBody({
  code: 'VALIDATION_ERROR',
  message: 'Geçersiz istek.',
  traceId: 't2',
  fieldErrors: [{ field: 'password', message: 'Parola en az 8 karakter olmalıdır.' }],
});
assertEqual(
  userFacingBeMessage(422, validation),
  'Parola en az 8 karakter olmalıdır.',
  'field error preferred'
);

const session = combineSession(
  {
    accessToken: 'a',
    refreshToken: 'r',
    tokenType: 'Bearer',
    expiresIn: 900,
    clientContext: 'PUBLIC_WEB',
  },
  { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', phone: null },
  1_000_000
);
assert(session.issuedAt === 1_000_000, 'issuedAt stamped');
assert(isAccessTokenFresh(session, 1_000_000 + 30_000), 'fresh within ttl');
assert(!isAccessTokenFresh(session, 1_000_000 + 900_000), 'stale at expiry');

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
const responses: Record<string, { status: number; body: unknown }> = {};

function keyOf(url: string, method: string): string {
  return `${method} ${url.replace(/^https?:\/\/[^/]+/, '')}`;
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  calls.push({ url, init: init ?? {} });
  const hit = responses[keyOf(url, method)];
  if (!hit) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'missing mock', traceId: 'x' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(hit.body), {
    status: hit.status,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

const repo = new HttpAuthRepository('http://localhost:8080/api');

async function main() {

responses['POST /api/v1/auth/register'] = {
  status: 201,
  body: { message: 'Kayıt alındı. E-posta doğrulama talimatları gönderildi.' },
};
const registered = await repo.register({
  email: 'ada@example.com',
  password: 'Password1',
  firstName: 'Ada',
  lastName: 'Lovelace',
});
assertEqual(
  registered.message,
  'Kayıt alındı. E-posta doğrulama talimatları gönderildi.',
  'register 201 message'
);
const registerCall = calls.find((c) => c.url.endsWith('/v1/auth/register'));
assert(registerCall != null, 'register hit path');
const registerBody = JSON.parse(String(registerCall?.init.body));
assertEqual(registerBody.password, 'Password1', 'register sends password');
assertEqual(
  Object.keys(registerBody).sort().join(','),
  'email,firstName,lastName,password',
  'register body matches OpenAPI (no extra fields)'
);

calls.length = 0;
responses['POST /api/v1/auth/register'] = {
  status: 201,
  body: { message: 'Kayıt alındı. E-posta doğrulama talimatları gönderildi.' },
};
const duplicate = await repo.register({
  email: 'ada@example.com',
  password: 'Password1',
  firstName: 'Ada',
  lastName: 'Lovelace',
});
assertEqual(duplicate.message, registered.message, 'duplicate register still 201');

calls.length = 0;
responses['POST /api/v1/auth/login'] = {
  status: 200,
  body: {
    accessToken: 'acc-1',
    refreshToken: 'ref-1',
    tokenType: 'Bearer',
    expiresIn: 900,
    clientContext: 'PUBLIC_WEB',
  },
};
responses['GET /api/v1/me'] = {
  status: 200,
  body: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'ada@example.com',
    emailVerified: true,
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    role: 'USER',
    status: 'ACTIVE',
  },
};
const logged = await repo.login({
  email: 'ada@example.com',
  password: 'Password1',
  clientContext: 'PUBLIC_WEB',
});
assertEqual(logged.accessToken, 'acc-1', 'login access token');
assertEqual(logged.refreshToken, 'ref-1', 'login refresh token');
assertEqual(logged.user.firstName, 'Ada', 'login hydrates profile');
assertEqual(logged.tokenType, 'Bearer', 'login token type');
const loginBody = JSON.parse(
  String(calls.find((c) => c.url.endsWith('/v1/auth/login'))?.init.body)
);
assertEqual(loginBody.clientContext, 'PUBLIC_WEB', 'login sends clientContext');
assertEqual(
  Object.keys(loginBody).sort().join(','),
  'clientContext,email,password',
  'login body matches OpenAPI'
);
const meHeaders = new Headers(
  calls.find((c) => c.url.endsWith('/v1/me'))?.init.headers
);
assertEqual(meHeaders.get('Authorization'), 'Bearer acc-1', 'login hydrates /me with Bearer');
assertEqual(meHeaders.get('Content-Type'), null, 'GET /me has no JSON content-type');
assert(
  !('user' in (responses['POST /api/v1/auth/login'].body as object) && logged.user.id === ''),
  'profile not expected on token response'
);

calls.length = 0;
responses['POST /api/v1/auth/refresh'] = {
  status: 200,
  body: {
    accessToken: 'acc-2',
    refreshToken: 'ref-2',
    tokenType: 'Bearer',
    expiresIn: 900,
    clientContext: 'PUBLIC_WEB',
  },
};
const refreshed = await repo.refresh({
  refreshToken: 'ref-1',
  clientContext: 'PUBLIC_WEB',
});
assertEqual(refreshed.accessToken, 'acc-2', 'refresh rotates access');
assertEqual(refreshed.refreshToken, 'ref-2', 'refresh rotates refresh');
const refreshBody = JSON.parse(
  String(calls.find((c) => c.url.endsWith('/v1/auth/refresh'))?.init.body)
);
assertEqual(refreshBody.clientContext, 'PUBLIC_WEB', 'refresh sends clientContext');
assertEqual(refreshBody.refreshToken, 'ref-1', 'refresh sends previous refresh token');

calls.length = 0;
responses['POST /api/v1/auth/logout'] = {
  status: 200,
  body: { message: 'Oturum kapatıldı.' },
};
await repo.logout('acc-2');
const logoutInit = calls.find((c) => c.url.endsWith('/v1/auth/logout'))?.init;
const logoutHeaders = new Headers(logoutInit?.headers);
assertEqual(logoutHeaders.get('Authorization'), 'Bearer acc-2', 'logout uses Bearer');
assert(logoutInit?.body == null || logoutInit.body === undefined, 'logout has no body');
assertEqual(logoutHeaders.get('Content-Type'), null, 'logout has no JSON content-type');

calls.length = 0;
responses['POST /api/v1/auth/password/forgot'] = {
  status: 200,
  body: { message: 'Bu e-posta ile bir hesap varsa sıfırlama talimatı gönderildi.' },
};
const forgot = await repo.forgotPassword({ email: 'ada@example.com' });
assert(forgot.message.includes('sıfırlama'), 'forgot password message');
assert(
  calls.some((c) => c.url.endsWith('/v1/auth/password/forgot')),
  'forgot uses /v1/auth/password/forgot'
);

calls.length = 0;
responses['POST /api/v1/auth/login'] = {
  status: 401,
  body: {
    code: 'UNAUTHENTICATED',
    message: 'E-posta veya parola hatalı.',
    traceId: 't-login',
  },
};
try {
  await repo.login({
    email: 'ada@example.com',
    password: 'WrongPass1',
    clientContext: 'PUBLIC_WEB',
  });
  assert(false, 'bad login should throw');
} catch (err) {
  assert(err instanceof AuthError, 'bad login is AuthError');
  const ae = err as AuthError;
  assertEqual(ae.status, 401, 'bad login status');
  assertEqual(ae.code, 'UNAUTHENTICATED', 'bad login code');
  assertEqual(ae.message, 'E-posta veya parola hatalı.', 'bad login message');
}

calls.length = 0;
responses['POST /api/v1/auth/login'] = {
  status: 403,
  body: {
    code: 'EMAIL_NOT_VERIFIED',
    message: 'E-posta adresi doğrulanmamış.',
    traceId: 't-verify',
  },
};
try {
  await repo.login({
    email: 'ada@example.com',
    password: 'Password1',
    clientContext: 'PUBLIC_WEB',
  });
  assert(false, 'unverified login should throw');
} catch (err) {
  const ae = err as AuthError;
  assertEqual(ae.status, 403, 'unverified login status');
  assertEqual(ae.code, 'EMAIL_NOT_VERIFIED', 'unverified login code');
}

calls.length = 0;
responses['POST /api/v1/auth/register'] = {
  status: 422,
  body: {
    code: 'VALIDATION_ERROR',
    message: 'Geçersiz istek.',
    traceId: 't-reg',
    fieldErrors: [{ field: 'password', message: 'Parola en az 8 karakter olmalıdır.' }],
  },
};
try {
  await repo.register({
    email: 'ok@example.com',
    password: 'short',
    firstName: 'A',
    lastName: 'B',
  });
  assert(false, 'short password should throw');
} catch (err) {
  const ae = err as AuthError;
  assertEqual(ae.status, 422, 'register validation status');
  assertEqual(ae.code, 'VALIDATION_ERROR', 'register validation code');
  assertEqual(ae.message, 'Parola en az 8 karakter olmalıdır.', 'register field message');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
}

void main();
