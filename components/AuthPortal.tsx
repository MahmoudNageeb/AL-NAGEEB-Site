'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { ActiveSession } from '@/lib/session';

interface AuthPortalProps {
  hasAdmin: boolean;
  authorizedOwnerEmail: string;
  session: ActiveSession | null;
  nextPath?: string;
  dbConnected: boolean;
}

type AuthTab = 'login' | 'register' | 'setup';

export function AuthPortal({
  hasAdmin,
  authorizedOwnerEmail,
  session,
  nextPath,
  dbConnected,
}: AuthPortalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(
    !hasAdmin ? 'setup' : 'login',
  );
  const [fullName, setFullName] = useState(!hasAdmin ? 'محمود نجيب' : '');
  const [email, setEmail] = useState(!hasAdmin ? authorizedOwnerEmail : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setFieldErrors({});
    setBanner(null);
    if (tab === 'setup') {
      setEmail(authorizedOwnerEmail);
      setFullName('محمود نجيب');
    } else if (tab === 'login') {
      setFullName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: activeTab,
            fullName,
            email,
            password,
            nextPath,
          }),
        });
        const res = (await response.json()) as {
          ok: boolean;
          message: string;
          fieldErrors?: { fullName?: string; email?: string; password?: string };
          redirectTo?: string;
        };

        if (!res.ok) {
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          setBanner({ type: 'error', text: res.message || 'حصلت مشكلة في تسجيل الدخول.' });
          return;
        }

        setBanner({ type: 'success', text: res.message });
        window.location.assign(res.redirectTo || '/');
      } catch {
        setBanner({
          type: 'error',
          text: 'مقدرتش أوصل للسيرفر دلوقتي، جرّب تاني بعد ثواني.',
        });
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await fetch('/api/auth', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'logout' }),
        });
      } finally {
        window.location.assign('/login');
      }
    });
  };

  if (session) {
    return (
      <MotionConfig reducedMotion="user">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6">
          <div className="lux-card rounded-3xl p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-[var(--velvet-gold)]" aria-hidden="true" />
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--velvet-text)]">
                  أهلاً بيك يا {session.fullName}
                </h1>
                <p className="font-mono text-xs text-[var(--velvet-muted)]">
                  {session.email} · {session.role === 'admin' ? 'حساب الإدارة' : 'حساب طالب'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {session.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F0C97A] px-4 py-2.5 font-display text-sm font-bold text-[#1A1408] hover:bg-[#f5d593]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>افتح لوحة الأدمن</span>
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--velvet-text)] hover:border-[var(--velvet-gold)]"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <span>الرئيسية</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--velvet-rose)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--velvet-rose)] transition-colors hover:bg-[var(--velvet-rose)]/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </main>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--velvet-muted)] transition-colors hover:text-[var(--velvet-gold)]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>الرجوع للرئيسية</span>
          </Link>
        </div>

        <div className="lux-card rounded-3xl p-6 sm:p-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[var(--velvet-gold)]" aria-hidden="true" />
              <h1 className="font-display text-2xl font-bold text-[var(--velvet-text)]">
                {activeTab === 'setup'
                  ? 'تفعيل حساب الأدمن لأول مرة'
                  : activeTab === 'register'
                    ? 'اعمل حساب جديد'
                    : 'تسجيل الدخول'}
              </h1>
            </div>
            <p className="text-xs leading-relaxed text-[var(--velvet-muted)]">
              {activeTab === 'setup'
                ? `حط كلمة المرور الخاصة بحساب الإدارة (${authorizedOwnerEmail}) عشان تتحكم في رابط التحميل والمميزات وآراء المستخدمين.`
                : 'سجّل دخول بحساب الإدارة عشان تتابع وتعدّل محتوى الموقع، أو بحساب طالب عشان تشارك رأيك بسهولة.'}
            </p>
          </div>

          {/* Animated Segmented Auth Tabs */}
          <div
            role="tablist"
            aria-label="نوع العملية"
            className="mt-6 grid gap-1.5 rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] p-1.5"
            style={{
              gridTemplateColumns: !hasAdmin ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {!hasAdmin && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'setup'}
                onClick={() => switchTab('setup')}
                className={`relative rounded-xl px-2.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === 'setup'
                    ? 'text-[#1A1408]'
                    : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                }`}
              >
                {activeTab === 'setup' && (
                  <motion.span
                    layoutId="auth-tab-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#F0C97A]"
                  />
                )}
                <span className="relative z-10">تفعيل الأدمن</span>
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              onClick={() => switchTab('login')}
              className={`relative rounded-xl px-2.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'login'
                  ? 'text-[#1A1408]'
                  : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
              }`}
            >
              {activeTab === 'login' && (
                <motion.span
                  layoutId="auth-tab-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#F0C97A]"
                />
              )}
              <span className="relative z-10">تسجيل الدخول</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              onClick={() => switchTab('register')}
              className={`relative rounded-xl px-2.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'register'
                  ? 'text-[#1A1408]'
                  : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
              }`}
            >
              {activeTab === 'register' && (
                <motion.span
                  layoutId="auth-tab-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#F0C97A]"
                />
              )}
              <span className="relative z-10">حساب جديد</span>
            </button>
          </div>

          {!dbConnected && (
            <p className="mt-4 rounded-xl border border-[var(--velvet-rose)]/40 bg-[var(--velvet-rose)]/10 px-3.5 py-2.5 text-xs text-[var(--velvet-rose)]">
              تنبيه: قاعدة البيانات مش متصلة دلوقتي، اتأكد من إعدادات الاتصال.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {activeTab !== 'login' && (
              <div>
                <label
                  htmlFor="auth-full-name"
                  className="mb-1.5 block text-xs font-semibold text-[var(--velvet-text)]"
                >
                  الاسم بالكامل
                </label>
                <input
                  id="auth-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمود نجيب"
                  className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm text-[var(--velvet-text)] focus:border-[var(--velvet-gold)] focus:outline-none"
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-[var(--velvet-rose)]" role="alert">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-semibold text-[var(--velvet-text)]"
              >
                الإيميل
              </label>
              <input
                id="auth-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-left font-mono text-sm text-[var(--velvet-text)] focus:border-[var(--velvet-gold)] focus:outline-none"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-[var(--velvet-rose)]" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-semibold text-[var(--velvet-text)]"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  dir={password || activeTab === 'login' ? 'ltr' : 'rtl'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === 'login' ? '••••••••' : '8 حروف أو أرقام على الأقل'}
                  className={`w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] py-2.5 pl-10 pr-3.5 text-sm text-[var(--velvet-text)] focus:border-[var(--velvet-gold)] focus:outline-none ${
                    password || activeTab === 'login' ? 'text-left font-mono' : 'text-right'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-[var(--velvet-rose)]" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {banner && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                  banner.type === 'success'
                    ? 'border-[var(--velvet-emerald)]/40 bg-[var(--velvet-emerald)]/10 text-[var(--velvet-emerald)]'
                    : 'border-[var(--velvet-rose)]/40 bg-[var(--velvet-rose)]/10 text-[var(--velvet-rose)]'
                }`}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{banner.text}</span>
              </div>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.985 }}
              disabled={isPending || !dbConnected}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F0C97A] px-5 py-3 font-display text-sm font-bold text-[#1A1408] transition-colors hover:bg-[#f5d593] disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>
                {activeTab === 'setup'
                  ? 'تفعيل حساب الأدمن والدخول'
                  : activeTab === 'register'
                    ? 'اعمل الحساب وكمّل'
                    : 'دخول'}
              </span>
            </motion.button>
          </form>
        </div>
      </main>
    </MotionConfig>
  );
}
