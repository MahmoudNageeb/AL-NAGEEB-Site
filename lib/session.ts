import 'server-only';
import { cookies, headers } from 'next/headers';
import {
  resolveCookieSecurityOptions,
  signSessionToken,
  verifySessionToken,
  type CookieSecurityOptions,
  type UserRole,
} from './auth-logic';
import { findUserById, isDatabaseConfigured } from './db';

export const SESSION_COOKIE_NAME = 'al_nageeb_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface ActiveSession {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export async function getCookieSecurityOptions(
  maxAge?: number,
): Promise<CookieSecurityOptions> {
  try {
    const hdrs = await headers();
    return resolveCookieSecurityOptions(
      {
        forwardedProto: hdrs.get('x-forwarded-proto'),
        origin: hdrs.get('origin'),
        referer: hdrs.get('referer'),
        host: hdrs.get('x-forwarded-host') || hdrs.get('host'),
        nodeEnv: process.env.NODE_ENV,
      },
      maxAge,
    );
  } catch {
    return resolveCookieSecurityOptions(
      { nodeEnv: process.env.NODE_ENV },
      maxAge,
    );
  }
}

export async function getCurrentSession(): Promise<ActiveSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const dbUser = await findUserById(decoded.uid);
    if (!dbUser) return null;
    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<ActiveSession | null> {
  const session = await getCurrentSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session;
}

export async function setSessionCookie(user: {
  id: number;
  email: string;
  role: UserRole;
}): Promise<void> {
  const token = signSessionToken({
    uid: user.id,
    email: user.email,
    role: user.role,
  });
  const cookieStore = await cookies();
  const opts = await getCookieSecurityOptions(SESSION_MAX_AGE_SECONDS);
  cookieStore.set(SESSION_COOKIE_NAME, token, opts);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const opts = await getCookieSecurityOptions(0);
  cookieStore.set(SESSION_COOKIE_NAME, '', opts);
}
