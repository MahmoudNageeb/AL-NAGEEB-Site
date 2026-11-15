'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import {
  hashPassword,
  normalizeEmail,
  validateAuthInput,
  verifyPassword,
  type UserRole,
} from '@/lib/auth-logic';
import {
  createUserInDb,
  deleteAllOpinionsInDb,
  deleteBroadcastNotificationInDb,
  deleteCapabilityInDb,
  deleteChangelogInDb,
  deleteInstallStepInDb,
  deleteOpinionInDb,
  deleteUserInDb,
  findUserByEmailWithHash,
  findUserById,
  insertOpinionInDb,
  isDatabaseConfigured,
  toggleHelpfulVoteInDb,
  toggleOpinionFeaturedInDb,
  touchUserLogin,
  updateReleaseSettingsInDb,
  updateUserCredentialsInDb,
  updateUserRoleInDb,
  upsertCapabilityInDb,
  upsertChangelogInDb,
  upsertInstallStepInDb,
  upsertOpinionByAdminInDb,
} from '@/lib/db';
import {
  validateBroadcastNotificationInput,
  type BroadcastNotificationItem,
} from '@/lib/notifications-logic';
import { sendBroadcastNotification } from '@/lib/push-sender';
import {
  validateOpinionInput,
  validateReleaseSettingsInput,
  type OpinionItem,
  type ReleaseSettingsInput,
} from '@/lib/reviews-logic';
import {
  clearSessionCookie,
  getCookieSecurityOptions,
  getCurrentSession,
  requireAdminSession,
  setSessionCookie,
} from '@/lib/session';
import type {
  AppCapability,
  AppReleaseMeta,
  ChangelogEntry,
  InstallStep,
} from '@/lib/study-app-data';

const VOTER_COOKIE_NAME = 'al_nageeb_voter';

async function getOrCreateVoterToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VOTER_COOKIE_NAME)?.value;
  if (existing && existing.length >= 16) {
    return existing;
  }
  const token = randomUUID();
  const opts = await getCookieSecurityOptions(60 * 60 * 24 * 365);
  cookieStore.set(VOTER_COOKIE_NAME, token, opts);
  return token;
}

function revalidateAllPublicAndAdmin() {
  revalidatePath('/');
  revalidatePath('/features');
  revalidatePath('/install');
  revalidatePath('/opinions');
  revalidatePath('/guide');
  revalidatePath('/admin');
  revalidatePath('/login');
}

/* ==================== PUBLIC OPINIONS ==================== */

export interface SubmitOpinionActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: {
    authorName?: string;
    authorRole?: string;
    comment?: string;
  };
  opinion?: OpinionItem;
}

export async function submitOpinionAction(payload: {
  authorName: string;
  authorRole?: string;
  comment: string;
}): Promise<SubmitOpinionActionResult> {
  const validation = validateOpinionInput(payload);
  if (!validation.valid || !validation.sanitized) {
    return {
      ok: false,
      message: 'من فضلك راجع الخانات المطلوبة الأول قبل ما تبعت.',
      fieldErrors: validation.errors,
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: 'قاعدة البيانات مش متصلة دلوقتي.',
    };
  }

  try {
    const session = await getCurrentSession();
    const opinion = await insertOpinionInDb({
      ...validation.sanitized,
      userId: session?.id ?? null,
    });
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: 'تسلم على رأيك! مشاركتك اتنشرت بنجاح على الموقع.',
      opinion,
    };
  } catch (err) {
    console.error('Opinion submit failed:', err instanceof Error ? err.message : 'Unknown error');
    return {
      ok: false,
      message: 'حصلت مشكلة وإحنا بنحفظ رأيك، جرّب تاني بعد ثواني.',
    };
  }
}

export interface VoteHelpfulActionResult {
  ok: boolean;
  helpfulCount?: number;
  hasVoted?: boolean;
  message?: string;
}

export async function voteHelpfulAction(
  opinionId: number,
): Promise<VoteHelpfulActionResult> {
  if (!Number.isInteger(opinionId) || opinionId <= 0) {
    return { ok: false, message: 'معرّف الرأي مش مظبوط.' };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: 'قاعدة البيانات مش متصلة دلوقتي.',
    };
  }

  try {
    const voterToken = await getOrCreateVoterToken();
    const res = await toggleHelpfulVoteInDb(opinionId, voterToken);
    revalidatePath('/');
    revalidatePath('/opinions');
    return {
      ok: true,
      helpfulCount: res.helpfulCount,
      hasVoted: res.hasVoted,
    };
  } catch (err) {
    console.error('Helpful vote failed:', err instanceof Error ? err.message : 'Unknown error');
    return { ok: false, message: 'مقدرناش نسجل التفاعل دلوقتي.' };
  }
}

/* ==================== AUTH ACTIONS ==================== */

export interface AuthActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: {
    fullName?: string;
    email?: string;
    password?: string;
  };
  redirectTo?: string;
}

export async function loginAction(payload: {
  email: string;
  password: string;
  nextPath?: string;
}): Promise<AuthActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: 'قاعدة البيانات غير مفعلة.' };
  }

  const check = validateAuthInput(payload, 'login');
  if (!check.valid || !check.sanitized) {
    return {
      ok: false,
      message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
      fieldErrors: check.errors,
    };
  }

  try {
    const user = await findUserByEmailWithHash(check.sanitized.email);
    if (!user || !verifyPassword(check.sanitized.password, user.passwordHash)) {
      return {
        ok: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      };
    }

    await touchUserLogin(user.id);
    await setSessionCookie({ id: user.id, email: user.email, role: user.role });
    revalidateAllPublicAndAdmin();

    if (payload.nextPath === '/admin' && user.role !== 'admin') {
      return {
        ok: false,
        message: 'تم تسجيل الدخول بحساب مستخدم عادي لا يملك صلاحية لوحة الأدمن.',
      };
    }

    const safeNext =
      payload.nextPath && payload.nextPath.startsWith('/') && !payload.nextPath.startsWith('//')
        ? payload.nextPath
        : user.role === 'admin'
          ? '/admin'
          : '/';

    return {
      ok: true,
      message: 'تم تسجيل الدخول بنجاح.',
      redirectTo: user.role === 'admin' ? safeNext : '/',
    };
  } catch (err) {
    console.error('Login failed:', err instanceof Error ? err.message : 'Unknown error');
    return { ok: false, message: 'تعذر تسجيل الدخول حالياً.' };
  }
}

export async function registerUserAction(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: 'قاعدة البيانات غير مفعلة.' };
  }

  const check = validateAuthInput(payload, 'register');
  if (!check.valid || !check.sanitized) {
    return {
      ok: false,
      message: 'يرجى التحقق من البيانات المدخلة.',
      fieldErrors: check.errors,
    };
  }

  try {
    const existing = await findUserByEmailWithHash(check.sanitized.email);
    if (existing) {
      return {
        ok: false,
        message: 'هذا البريد الإلكتروني مسجل مسبقاً. جرّب تسجيل الدخول.',
        fieldErrors: { email: 'البريد الإلكتروني مستخدم بالفعل.' },
      };
    }

    const user = await createUserInDb({
      email: check.sanitized.email,
      fullName: check.sanitized.fullName,
      passwordHash: hashPassword(check.sanitized.password),
      role: 'user',
    });

    await setSessionCookie({ id: user.id, email: user.email, role: 'user' });
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: 'تم إنشاء حسابك بنجاح.',
      redirectTo: '/',
    };
  } catch (err) {
    console.error('Register failed:', err instanceof Error ? err.message : 'Unknown error');
    return { ok: false, message: 'تعذر إنشاء الحساب حالياً.' };
  }
}

export async function logoutAction(): Promise<{ ok: boolean }> {
  await clearSessionCookie();
  revalidateAllPublicAndAdmin();
  return { ok: true };
}

/* ==================== ADMIN CMS ACTIONS ==================== */

export async function updateReleaseSettingsAction(
  input: ReleaseSettingsInput,
): Promise<{ ok: boolean; message: string; settings?: AppReleaseMeta }> {
  const admin = await requireAdminSession();
  if (!admin) {
    return { ok: false, message: 'غير مصرح بهذه العملية.' };
  }

  const check = validateReleaseSettingsInput(input);
  if (!check.valid || !check.sanitized) {
    return { ok: false, message: check.error || 'البيانات غير صالحة.' };
  }

  try {
    const settings = await updateReleaseSettingsInDb(check.sanitized);
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: 'تم تحديث بيانات الإصدار ورابط التحميل في جميع صفحات الموقع.',
      settings,
    };
  } catch (err) {
    console.error('Update release settings failed:', err instanceof Error ? err.message : 'Unknown error');
    return { ok: false, message: 'تعذر حفظ إعدادات الإصدار.' };
  }
}

export async function upsertCapabilityAction(input: {
  dbId?: number;
  sortOrder: number;
  indexLabel: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  accentHex: string;
  spanWide: boolean;
  isVisible: boolean;
}): Promise<{ ok: boolean; message: string; capability?: AppCapability }> {
  const admin = await requireAdminSession();
  if (!admin) {
    return { ok: false, message: 'غير مصرح بهذه العملية.' };
  }

  if (!input.title.trim() || !input.description.trim()) {
    return { ok: false, message: 'عنوان الميزة ووصفها مطلوبان.' };
  }

  try {
    const capability = await upsertCapabilityInDb({
      ...input,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      description: input.description.trim(),
      indexLabel: input.indexLabel.trim() || '01',
      highlights: input.highlights.map((h) => h.trim()).filter(Boolean),
    });
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: input.dbId ? 'تم تحديث الميزة بنجاح.' : 'تمت إضافة الميزة الجديدة بنجاح.',
      capability,
    };
  } catch (err) {
    console.error('Upsert capability failed:', err instanceof Error ? err.message : 'Unknown error');
    return { ok: false, message: 'تعذر حفظ الميزة.' };
  }
}

export async function deleteCapabilityAction(
  dbId: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };
  if (!Number.isInteger(dbId) || dbId <= 0) {
    return { ok: false, message: 'معرّف الميزة غير صالح.' };
  }

  try {
    await deleteCapabilityInDb(dbId);
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف الميزة.' };
  } catch {
    return { ok: false, message: 'تعذر حذف الميزة.' };
  }
}

export async function upsertInstallStepAction(input: {
  id?: number;
  stepOrder: number;
  title: string;
  detail: string;
  tip: string;
}): Promise<{ ok: boolean; message: string; step?: InstallStep }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };
  if (!input.title.trim() || !input.detail.trim()) {
    return { ok: false, message: 'عنوان الخطوة وشرحها مطلوبان.' };
  }

  try {
    const step = await upsertInstallStepInDb({
      id: input.id,
      stepOrder: Number(input.stepOrder) || 1,
      title: input.title.trim(),
      detail: input.detail.trim(),
      tip: input.tip.trim(),
    });
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: input.id ? 'تم تحديث خطوة التثبيت.' : 'تمت إضافة خطوة التثبيت.',
      step,
    };
  } catch {
    return { ok: false, message: 'تعذر حفظ خطوة التثبيت.' };
  }
}

export async function deleteInstallStepAction(
  id: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  try {
    await deleteInstallStepInDb(id);
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف خطوة التثبيت.' };
  } catch {
    return { ok: false, message: 'تعذر حذف خطوة التثبيت.' };
  }
}

export async function upsertChangelogAction(input: {
  id?: number;
  sortOrder: number;
  version: string;
  date: string;
  headline: string;
  changes: string[];
}): Promise<{ ok: boolean; message: string; entry?: ChangelogEntry }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };
  if (!input.version.trim() || !input.headline.trim()) {
    return { ok: false, message: 'رقم الإصدار والعنوان الرئيسي مطلوبان.' };
  }

  try {
    const entry = await upsertChangelogInDb({
      id: input.id,
      sortOrder: Number(input.sortOrder) || 1,
      version: input.version.trim(),
      date: input.date.trim() || 'تحديث',
      headline: input.headline.trim(),
      changes: input.changes.map((c) => c.trim()).filter(Boolean),
    });
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: input.id ? 'تم تحديث سجل الإصدار.' : 'تمت إضافة الإصدار إلى السجل.',
      entry,
    };
  } catch {
    return { ok: false, message: 'تعذر حفظ سجل التغييرات.' };
  }
}

export async function deleteChangelogAction(
  id: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  try {
    await deleteChangelogInDb(id);
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف سجل الإصدار.' };
  } catch {
    return { ok: false, message: 'تعذر حذف سجل الإصدار.' };
  }
}

export async function toggleOpinionFeaturedAction(
  id: number,
): Promise<{ ok: boolean; isFeatured?: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  try {
    const isFeatured = await toggleOpinionFeaturedInDb(id);
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      isFeatured,
      message: isFeatured ? 'تم تثبيت الرأي في الأعلى.' : 'تم إلغاء تثبيت الرأي.',
    };
  } catch {
    return { ok: false, message: 'تعذر تحديث حالة الرأي.' };
  }
}

export async function upsertOpinionByAdminAction(input: {
  id?: number;
  authorName: string;
  authorRole: string;
  comment: string;
  appVersion: string;
  helpfulCount: number;
  isFeatured: boolean;
}): Promise<{ ok: boolean; message: string; opinion?: OpinionItem }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  const check = validateOpinionInput({
    authorName: input.authorName,
    authorRole: input.authorRole,
    comment: input.comment,
  });
  if (!check.valid || !check.sanitized) {
    const firstErr =
      check.errors.authorName ||
      check.errors.authorRole ||
      check.errors.comment ||
      'يرجى مراجعة بيانات الرأي المدخلة.';
    return { ok: false, message: firstErr };
  }

  const appVersion = input.appVersion.trim() || '2.7';

  try {
    const opinion = await upsertOpinionByAdminInDb({
      id: input.id,
      authorName: check.sanitized.authorName,
      authorRole: check.sanitized.authorRole,
      comment: check.sanitized.comment,
      appVersion,
      helpfulCount: Number.isFinite(Number(input.helpfulCount))
        ? Math.max(0, Math.floor(Number(input.helpfulCount)))
        : 0,
      isFeatured: Boolean(input.isFeatured),
    });
    revalidateAllPublicAndAdmin();
    return {
      ok: true,
      message: input.id ? 'تم تعديل الرأي بنجاح.' : 'تمت إضافة الرأي بنجاح.',
      opinion,
    };
  } catch {
    return { ok: false, message: 'تعذر حفظ بيانات الرأي.' };
  }
}

export async function deleteOpinionAction(
  id: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  try {
    await deleteOpinionInDb(id);
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف الرأي بنجاح.' };
  } catch {
    return { ok: false, message: 'تعذر حذف الرأي.' };
  }
}

export async function deleteAllOpinionsAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  try {
    await deleteAllOpinionsInDb();
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف جميع الآراء بنجاح.' };
  } catch {
    return { ok: false, message: 'تعذر حذف جميع الآراء.' };
  }
}

export async function updateUserRoleAction(
  userId: number,
  role: UserRole,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };
  if (userId === admin.id && role !== 'admin') {
    return { ok: false, message: 'لا يمكنك تخفيض صلاحية حسابك الحالي.' };
  }

  try {
    await updateUserRoleInDb(userId, role);
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم تحديث صلاحية الحساب.' };
  } catch {
    return { ok: false, message: 'تعذر تحديث صلاحية الحساب.' };
  }
}

export async function deleteUserAction(
  userId: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  try {
    await deleteUserInDb(userId);
    if (userId === admin.id) {
      await clearSessionCookie();
    }
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف الحساب.' };
  } catch {
    return { ok: false, message: 'تعذر حذف الحساب.' };
  }
}

export async function updateAdminAccountAction(payload: {
  fullName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, message: 'غير مصرح بهذه العملية.' };

  const fullName = payload.fullName.trim();
  const email = normalizeEmail(payload.email);
  if (fullName.length < 2 || !email.includes('@')) {
    return { ok: false, message: 'يرجى إدخال اسم وبريد إلكتروني صحيحين.' };
  }

  try {
    const currentDb = await findUserByEmailWithHash(admin.email);
    const currentById = currentDb ?? (await findUserById(admin.id));
    if (!currentById) {
      return { ok: false, message: 'الحساب غير موجود.' };
    }

    let newHash: string | undefined;
    if (payload.newPassword && payload.newPassword.trim().length > 0) {
      if (payload.newPassword.trim().length < 8) {
        return {
          ok: false,
          message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.',
        };
      }
      if (
        !currentDb ||
        !payload.currentPassword ||
        !verifyPassword(payload.currentPassword, currentDb.passwordHash)
      ) {
        return {
          ok: false,
          message: 'كلمة المرور الحالية غير صحيحة.',
        };
      }
      newHash = hashPassword(payload.newPassword.trim());
    }

    const updated = await updateUserCredentialsInDb(admin.id, {
      fullName,
      email,
      passwordHash: newHash,
    });
    await setSessionCookie({
      id: updated.id,
      email: updated.email,
      role: updated.role,
    });
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم تحديث بيانات حساب الأدمن بنجاح.' };
  } catch {
    return { ok: false, message: 'تعذر تحديث بيانات الحساب.' };
  }
}

/* ==================== ADMIN BROADCAST NOTIFICATIONS ==================== */

export async function sendBroadcastNotificationAction(payload: {
  title: string;
  body: string;
  targetUrl?: string;
}): Promise<{
  ok: boolean;
  message: string;
  notification?: BroadcastNotificationItem;
  totalSubscribers?: number;
  pushSentCount?: number;
}> {
  const admin = await requireAdminSession();
  if (!admin) {
    return { ok: false, message: 'غير مصرح بهذه العملية.' };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, message: 'قاعدة البيانات غير متصلة حالياً.' };
  }

  const check = validateBroadcastNotificationInput(payload);
  if (!check.valid || !check.sanitized) {
    const firstErr =
      check.errors.title ||
      check.errors.body ||
      check.errors.targetUrl ||
      'يرجى مراجعة نص وعنوان الإشعار.';
    return { ok: false, message: firstErr };
  }

  try {
    const result = await sendBroadcastNotification({
      title: check.sanitized.title,
      body: check.sanitized.body,
      targetUrl: check.sanitized.targetUrl,
      adminId: admin.id,
    });

    revalidateAllPublicAndAdmin();

    if (result.totalSubscribers === 0) {
      return {
        ok: true,
        message: 'تم حفظ الإشعار في السجل، ولا يوجد مشتركون مفعلون للإشعارات حتى الآن.',
        notification: result.notification,
        totalSubscribers: 0,
        pushSentCount: 0,
      };
    }

    return {
      ok: true,
      message: `تم إرسال الإشعار بنجاح إلى ${result.totalSubscribers} مشترك (${result.pushSentCount} عبر Web Push الفوري).`,
      notification: result.notification,
      totalSubscribers: result.totalSubscribers,
      pushSentCount: result.pushSentCount,
    };
  } catch (err) {
    console.error(
      'Broadcast notification failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return { ok: false, message: 'تعذر إرسال الإشعار حالياً، جرّب تاني بعد ثواني.' };
  }
}

export async function deleteBroadcastNotificationAction(
  id: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdminSession();
  if (!admin) {
    return { ok: false, message: 'غير مصرح بهذه العملية.' };
  }
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'معرّف الإشعار غير صالح.' };
  }

  try {
    await deleteBroadcastNotificationInDb(id);
    revalidateAllPublicAndAdmin();
    return { ok: true, message: 'تم حذف الإشعار من السجل.' };
  } catch {
    return { ok: false, message: 'تعذر حذف الإشعار.' };
  }
}

