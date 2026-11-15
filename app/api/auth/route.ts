import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  hashPassword,
  resolveCookieSecurityOptions,
  signSessionToken,
  validateAuthInput,
  verifyPassword,
} from '@/lib/auth-logic';
import {
  createUserInDb,
  findUserByEmailWithHash,
  isDatabaseConfigured,
  touchUserLogin,
} from '@/lib/db';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/session';

function getRequestCookieOpts(request: Request, maxAge: number) {
  return resolveCookieSecurityOptions(
    {
      forwardedProto: request.headers.get('x-forwarded-proto'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host:
        request.headers.get('x-forwarded-host') || request.headers.get('host'),
      url: request.url,
      nodeEnv: process.env.NODE_ENV,
    },
    maxAge,
  );
}

function revalidateAuthRoutes() {
  revalidatePath('/');
  revalidatePath('/features');
  revalidatePath('/install');
  revalidatePath('/opinions');
  revalidatePath('/guide');
  revalidatePath('/admin');
  revalidatePath('/login');
}

export async function POST(request: Request) {
  let body: {
    mode?: string;
    fullName?: string;
    email?: string;
    password?: string;
    nextPath?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'الطلب مش سليم، جرّب تاني.' },
      { status: 400 },
    );
  }

  const mode = body.mode;

  if (mode === 'logout') {
    const res = NextResponse.json({
      ok: true,
      message: 'تم تسجيل الخروج بنجاح.',
      redirectTo: '/login',
    });
    res.cookies.set(SESSION_COOKIE_NAME, '', getRequestCookieOpts(request, 0));
    revalidateAuthRoutes();
    return res;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: 'قاعدة البيانات غير متصلة حالياً.' },
      { status: 503 },
    );
  }

  if (mode === 'register') {
    const check = validateAuthInput(
      {
        fullName: body.fullName ?? '',
        email: body.email ?? '',
        password: body.password ?? '',
      },
      'register',
    );
    if (!check.valid || !check.sanitized) {
      return NextResponse.json(
        {
          ok: false,
          message: 'يرجى التحقق من البيانات المدخلة.',
          fieldErrors: check.errors,
        },
        { status: 400 },
      );
    }

    try {
      const existing = await findUserByEmailWithHash(check.sanitized.email);
      if (existing) {
        return NextResponse.json(
          {
            ok: false,
            message: 'هذا البريد الإلكتروني مسجل مسبقاً. جرّب تسجيل الدخول.',
            fieldErrors: { email: 'البريد الإلكتروني مستخدم بالفعل.' },
          },
          { status: 409 },
        );
      }

      const user = await createUserInDb({
        email: check.sanitized.email,
        fullName: check.sanitized.fullName,
        passwordHash: hashPassword(check.sanitized.password),
        role: 'user',
      });

      const token = signSessionToken({
        uid: user.id,
        email: user.email,
        role: 'user',
      });

      const res = NextResponse.json({
        ok: true,
        message: 'تم إنشاء حسابك بنجاح.',
        redirectTo: '/',
      });
      res.cookies.set(
        SESSION_COOKIE_NAME,
        token,
        getRequestCookieOpts(request, SESSION_MAX_AGE_SECONDS),
      );
      revalidateAuthRoutes();
      return res;
    } catch (err) {
      console.error(
        'API register failed:',
        err instanceof Error ? err.message : 'Unknown error',
      );
      return NextResponse.json(
        { ok: false, message: 'تعذر إنشاء الحساب حالياً.' },
        { status: 500 },
      );
    }
  }

  // Default: login
  const check = validateAuthInput(
    {
      email: body.email ?? '',
      password: body.password ?? '',
    },
    'login',
  );
  if (!check.valid || !check.sanitized) {
    return NextResponse.json(
      {
        ok: false,
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
        fieldErrors: check.errors,
      },
      { status: 400 },
    );
  }

  try {
    const user = await findUserByEmailWithHash(check.sanitized.email);
    if (!user || !verifyPassword(check.sanitized.password, user.passwordHash)) {
      return NextResponse.json(
        { ok: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' },
        { status: 401 },
      );
    }

    await touchUserLogin(user.id);

    if (
      body.nextPath === '/admin' &&
      user.role !== 'admin'
    ) {
      const token = signSessionToken({
        uid: user.id,
        email: user.email,
        role: user.role,
      });
      const res = NextResponse.json(
        {
          ok: false,
          message: 'تم تسجيل الدخول بحساب مستخدم عادي لا يملك صلاحية لوحة الأدمن.',
        },
        { status: 403 },
      );
      res.cookies.set(
        SESSION_COOKIE_NAME,
        token,
        getRequestCookieOpts(request, SESSION_MAX_AGE_SECONDS),
      );
      revalidateAuthRoutes();
      return res;
    }

    const token = signSessionToken({
      uid: user.id,
      email: user.email,
      role: user.role,
    });

    const safeNext =
      body.nextPath &&
      body.nextPath.startsWith('/') &&
      !body.nextPath.startsWith('//')
        ? body.nextPath
        : user.role === 'admin'
          ? '/admin'
          : '/';

    const res = NextResponse.json({
      ok: true,
      message: 'تم تسجيل الدخول بنجاح.',
      redirectTo: user.role === 'admin' ? safeNext : '/',
    });
    res.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getRequestCookieOpts(request, SESSION_MAX_AGE_SECONDS),
    );
    revalidateAuthRoutes();
    return res;
  } catch (err) {
    console.error(
      'API login failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return NextResponse.json(
      { ok: false, message: 'تعذر تسجيل الدخول حالياً.' },
      { status: 500 },
    );
  }
}
