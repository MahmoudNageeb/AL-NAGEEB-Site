import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

export type UserRole = 'admin' | 'user';

export interface SessionPayload {
  uid: number;
  email: string;
  role: UserRole;
  exp: number;
}

export interface AuthValidationResult {
  valid: boolean;
  errors: {
    fullName?: string;
    email?: string;
    password?: string;
  };
  sanitized?: {
    fullName: string;
    email: string;
    password: string;
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

export function validateAuthInput(
  input: {
    fullName?: string;
    email: string;
    password: string;
  },
  mode: 'login' | 'register' | 'setup',
): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = {};
  const email = normalizeEmail(input.email ?? '');
  const password = input.password ?? '';
  const fullName = (input.fullName ?? '').trim().replace(/\s+/g, ' ');

  if (mode !== 'login') {
    if (fullName.length < 2) {
      errors.fullName = 'من فضلك اكتب اسمك (حرفين على الأقل).';
    } else if (fullName.length > 80) {
      errors.fullName = 'الاسم طويل شوية (الحد الأقصى 80 حرف).';
    }
  }

  if (!email || !isValidEmail(email)) {
    errors.email = 'من فضلك اكتب بريد إلكتروني صحيح.';
  }

  if (mode === 'login') {
    if (!password) {
      errors.password = 'من فضلك اكتب كلمة المرور.';
    }
  } else {
    if (password.length < 8) {
      errors.password = 'كلمة المرور لازم تكون 8 حروف أو أرقام على الأقل.';
    } else if (password.length > 128) {
      errors.password = 'كلمة المرور طويلة جداً.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      fullName: fullName || email.split('@')[0] || 'مستخدم',
      email,
      password,
    },
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function getSigningKey(secret?: string): Buffer {
  const raw =
    secret?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    'al-nageeb-local-dev-signing-key-v1';
  return createHmac('sha256', 'al-nageeb-session-key-v1').update(raw).digest();
}

export function signSessionToken(
  payload: Omit<SessionPayload, 'exp'> & { ttlSeconds?: number },
  secret?: string,
): string {
  const exp =
    Math.floor(Date.now() / 1000) + (payload.ttlSeconds ?? 60 * 60 * 24 * 7);
  const body: SessionPayload = {
    uid: payload.uid,
    email: normalizeEmail(payload.email),
    role: payload.role,
    exp,
  };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSigningKey(secret))
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined | null,
  secret?: string,
): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  try {
    const expectedSig = createHmac('sha256', getSigningKey(secret))
      .update(encoded)
      .digest('base64url');

    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SessionPayload;

    if (
      !Number.isInteger(parsed.uid) ||
      parsed.uid <= 0 ||
      typeof parsed.email !== 'string' ||
      (parsed.role !== 'admin' && parsed.role !== 'user') ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    if (parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export interface CookieSecurityOptions {
  httpOnly: true;
  sameSite: 'none' | 'lax';
  secure: boolean;
  partitioned?: boolean;
  path: '/';
  maxAge?: number;
}

export function resolveCookieSecurityOptions(
  input: {
    forwardedProto?: string | null;
    origin?: string | null;
    referer?: string | null;
    host?: string | null;
    url?: string | null;
    nodeEnv?: string | null;
  },
  maxAge?: number,
): CookieSecurityOptions {
  const proto = (input.forwardedProto ?? '').toLowerCase();
  const origin = (input.origin ?? '').toLowerCase();
  const referer = (input.referer ?? '').toLowerCase();
  const host = (input.host ?? '').toLowerCase();
  const url = (input.url ?? '').toLowerCase();

  let isHttps = input.nodeEnv === 'production';

  if (
    proto.includes('https') ||
    origin.startsWith('https://') ||
    referer.startsWith('https://') ||
    url.startsWith('https://') ||
    host.endsWith('.run.app')
  ) {
    isHttps = true;
  } else if (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    isHttps = false;
  }

  if (isHttps) {
    return {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
      ...(typeof maxAge === 'number' ? { maxAge } : {}),
    };
  }

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

