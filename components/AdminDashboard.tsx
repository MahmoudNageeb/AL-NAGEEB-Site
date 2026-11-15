'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Layers,
  ListChecks,
  Loader2,
  LogOut,
  MessageSquareText,
  Pin,
  Plus,
  Save,
  Send,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  deleteAllOpinionsAction,
  deleteBroadcastNotificationAction,
  deleteCapabilityAction,
  deleteChangelogAction,
  deleteInstallStepAction,
  deleteOpinionAction,
  deleteUserAction,
  sendBroadcastNotificationAction,
  toggleOpinionFeaturedAction,
  updateAdminAccountAction,
  updateReleaseSettingsAction,
  updateUserRoleAction,
  upsertCapabilityAction,
  upsertChangelogAction,
  upsertInstallStepAction,
  upsertOpinionByAdminAction,
} from '@/app/actions';
import type { DbUserRecord, PushSubscriberStats } from '@/lib/db';
import {
  EMPTY_SITE_TRAFFIC_STATS,
  type SiteTrafficStats,
  type TrafficRangeDays,
} from '@/lib/analytics-logic';
import type { BroadcastNotificationItem } from '@/lib/notifications-logic';
import type { OpinionItem } from '@/lib/reviews-logic';
import type { ActiveSession } from '@/lib/session';
import type {
  AppCapability,
  AppReleaseMeta,
  ChangelogEntry,
  InstallStep,
} from '@/lib/study-app-data';
import { ThemeToggleButton } from './ThemeProvider';
import { TrafficAnalyticsChart } from './TrafficAnalyticsChart';

type AdminTab =
  | 'release'
  | 'notifications'
  | 'capabilities'
  | 'install'
  | 'opinions'
  | 'account';

interface AdminDashboardProps {
  admin: ActiveSession;
  initialSettings: AppReleaseMeta;
  initialCapabilities: AppCapability[];
  initialInstallSteps: InstallStep[];
  initialChangelog: ChangelogEntry[];
  initialOpinions: OpinionItem[];
  initialUsers: DbUserRecord[];
  initialPushStats: PushSubscriberStats;
  initialBroadcasts: BroadcastNotificationItem[];
  initialTrafficStats?: SiteTrafficStats;
}

const ACCENT_CHOICES = [
  { hex: '#F0C97A', label: 'ذهبي ملكي' },
  { hex: '#7AD7F0', label: 'سماوي ياقوتي' },
  { hex: '#72D99B', label: 'زمردي' },
  { hex: '#C7A4FF', label: 'أرجواني' },
  { hex: '#FFC870', label: 'كهرماني' },
  { hex: '#F48FB1', label: 'وردي أكاديمي' },
];

export function AdminDashboard({
  admin,
  initialSettings,
  initialCapabilities,
  initialInstallSteps,
  initialChangelog,
  initialOpinions,
  initialUsers,
  initialPushStats,
  initialBroadcasts,
  initialTrafficStats = EMPTY_SITE_TRAFFIC_STATS,
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('release');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [trafficStats, setTrafficStats] = useState<SiteTrafficStats>(initialTrafficStats);
  const [refreshingStats, setRefreshingStats] = useState(false);

  // Tab 1: Release Settings State
  const [settingsForm, setSettingsForm] = useState<AppReleaseMeta>(initialSettings);

  // Tab 2: Capabilities State
  const [capabilities, setCapabilities] = useState<AppCapability[]>(initialCapabilities);
  const [editingCap, setEditingCap] = useState<{
    dbId?: number;
    sortOrder: number;
    indexLabel: string;
    title: string;
    subtitle: string;
    description: string;
    highlightsText: string;
    accentHex: string;
    spanWide: boolean;
    isVisible: boolean;
  } | null>(null);

  // Tab 3: Install Steps & Changelog State
  const [installSteps, setInstallSteps] = useState<InstallStep[]>(initialInstallSteps);
  const [editingStep, setEditingStep] = useState<InstallStep | null>(null);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>(initialChangelog);
  const [editingLog, setEditingLog] = useState<{
    id?: number;
    sortOrder: number;
    version: string;
    date: string;
    headline: string;
    changesText: string;
  } | null>(null);

  // Tab 4: Opinions & Users State
  const [opinions, setOpinions] = useState<OpinionItem[]>(initialOpinions);
  const [opinionSearch, setOpinionSearch] = useState('');
  const [editingOpinion, setEditingOpinion] = useState<{
    id?: number;
    authorName: string;
    authorRole: string;
    comment: string;
    appVersion: string;
    helpfulCount: number;
    isFeatured: boolean;
  } | null>(null);
  const [users, setUsers] = useState<DbUserRecord[]>(initialUsers);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // Tab 5: Admin Account State
  const [adminName, setAdminName] = useState(admin.fullName);
  const [adminEmail, setAdminEmail] = useState(admin.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Tab 6: Broadcast Notifications State
  const [broadcasts, setBroadcasts] = useState<BroadcastNotificationItem[]>(initialBroadcasts);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTargetUrl, setNotifTargetUrl] = useState('/install');

  const showStatus = (ok: boolean, text: string) => {
    setBanner({ type: ok ? 'success' : 'error', text });
  };

  const fetchTrafficStats = async (days: TrafficRangeDays) => {
    setRefreshingStats(true);
    try {
      const res = await fetch(`/api/analytics/stats?days=${days}`, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const nextStats = (await res.json()) as SiteTrafficStats;
        setTrafficStats(nextStats);
      }
    } catch {
      // Keep current stats on transient network error
    } finally {
      setRefreshingStats(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'release') return;
    let cancelled = false;
    const syncStats = async () => {
      try {
        const res = await fetch(`/api/analytics/stats?days=${trafficStats.rangeDays}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        if (!cancelled && res.ok) {
          const nextStats = (await res.json()) as SiteTrafficStats;
          setTrafficStats(nextStats);
        }
      } catch {
        // Keep SSR initial stats
      }
    };
    void syncStats();
    return () => {
      cancelled = true;
    };
  }, [activeTab, trafficStats.rangeDays]);

  const handleSaveRelease = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateReleaseSettingsAction({
        version: settingsForm.version,
        versionCode: Number(settingsForm.versionCode),
        fileSizeLabel: settingsForm.fileSizeLabel,
        minAndroid: settingsForm.minAndroid,
        packageName: settingsForm.packageName,
        apkDownloadUrl: settingsForm.apkDownloadUrl,
        heroTitle: settingsForm.heroTitle,
        heroSubtitle: settingsForm.heroSubtitle,
        licenseNote: settingsForm.licenseNote,
        repoUrl: settingsForm.repoUrl,
        announcementText: settingsForm.announcementText,
      });
      if (res.settings) setSettingsForm(res.settings);
      showStatus(res.ok, res.message);
      if (res.ok) router.refresh();
    });
  };

  const handleSaveCapability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCap) return;
    startTransition(async () => {
      const res = await upsertCapabilityAction({
        dbId: editingCap.dbId,
        sortOrder: editingCap.sortOrder,
        indexLabel: editingCap.indexLabel,
        title: editingCap.title,
        subtitle: editingCap.subtitle,
        description: editingCap.description,
        highlights: editingCap.highlightsText.split('\n'),
        accentHex: editingCap.accentHex,
        spanWide: editingCap.spanWide,
        isVisible: editingCap.isVisible,
      });
      showStatus(res.ok, res.message);
      if (res.ok && res.capability) {
        setCapabilities((prev) => {
          const exists = prev.some((c) => c.dbId === res.capability!.dbId);
          const next = exists
            ? prev.map((c) => (c.dbId === res.capability!.dbId ? res.capability! : c))
            : [...prev, res.capability!];
          return [...next].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
        });
        setEditingCap(null);
        router.refresh();
      }
    });
  };

  const handleToggleCapVisibility = (cap: AppCapability) => {
    if (!cap.dbId) return;
    startTransition(async () => {
      const res = await upsertCapabilityAction({
        dbId: cap.dbId,
        sortOrder: cap.sortOrder ?? 1,
        indexLabel: cap.index,
        title: cap.title,
        subtitle: cap.subtitle,
        description: cap.description,
        highlights: cap.highlights,
        accentHex: cap.accentHex,
        spanWide: Boolean(cap.spanWide),
        isVisible: !(cap.isVisible ?? true),
      });
      if (res.ok && res.capability) {
        setCapabilities((prev) =>
          prev.map((c) => (c.dbId === cap.dbId ? res.capability! : c)),
        );
        router.refresh();
      }
    });
  };

  const handleDeleteCapability = (dbId: number) => {
    startTransition(async () => {
      const res = await deleteCapabilityAction(dbId);
      showStatus(res.ok, res.message);
      if (res.ok) {
        setCapabilities((prev) => prev.filter((c) => c.dbId !== dbId));
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const handleSaveInstallStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;
    startTransition(async () => {
      const res = await upsertInstallStepAction({
        id: editingStep.id,
        stepOrder: editingStep.stepOrder,
        title: editingStep.title,
        detail: editingStep.detail,
        tip: editingStep.tip,
      });
      showStatus(res.ok, res.message);
      if (res.ok && res.step) {
        setInstallSteps((prev) => {
          const exists = prev.some((s) => s.id === res.step!.id);
          const next = exists
            ? prev.map((s) => (s.id === res.step!.id ? res.step! : s))
            : [...prev, res.step!];
          return [...next].sort((a, b) => a.stepOrder - b.stepOrder);
        });
        setEditingStep(null);
        router.refresh();
      }
    });
  };

  const handleDeleteInstallStep = (id: number) => {
    startTransition(async () => {
      const res = await deleteInstallStepAction(id);
      showStatus(res.ok, res.message);
      if (res.ok) {
        setInstallSteps((prev) => prev.filter((s) => s.id !== id));
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const handleSaveChangelog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    startTransition(async () => {
      const res = await upsertChangelogAction({
        id: editingLog.id,
        sortOrder: editingLog.sortOrder,
        version: editingLog.version,
        date: editingLog.date,
        headline: editingLog.headline,
        changes: editingLog.changesText.split('\n'),
      });
      showStatus(res.ok, res.message);
      if (res.ok && res.entry) {
        setChangelog((prev) => {
          const exists = prev.some((l) => l.id === res.entry!.id);
          const next = exists
            ? prev.map((l) => (l.id === res.entry!.id ? res.entry! : l))
            : [...prev, res.entry!];
          return [...next].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
        });
        setEditingLog(null);
        router.refresh();
      }
    });
  };

  const handleDeleteChangelog = (id: number) => {
    startTransition(async () => {
      const res = await deleteChangelogAction(id);
      showStatus(res.ok, res.message);
      if (res.ok) {
        setChangelog((prev) => prev.filter((l) => l.id !== id));
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const handleToggleFeaturedOpinion = (id: number) => {
    startTransition(async () => {
      const res = await toggleOpinionFeaturedAction(id);
      showStatus(res.ok, res.message);
      if (res.ok && typeof res.isFeatured === 'boolean') {
        setOpinions((prev) =>
          prev.map((op) => (op.id === id ? { ...op, isFeatured: res.isFeatured! } : op)),
        );
        router.refresh();
      }
    });
  };

  const handleSaveOpinionByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpinion) return;
    startTransition(async () => {
      const res = await upsertOpinionByAdminAction({
        id: editingOpinion.id,
        authorName: editingOpinion.authorName,
        authorRole: editingOpinion.authorRole,
        comment: editingOpinion.comment,
        appVersion: editingOpinion.appVersion,
        helpfulCount: Number(editingOpinion.helpfulCount) || 0,
        isFeatured: editingOpinion.isFeatured,
      });
      showStatus(res.ok, res.message);
      if (res.ok && res.opinion) {
        setOpinions((prev) => {
          const exists = prev.some((op) => op.id === res.opinion!.id);
          const next = exists
            ? prev.map((op) => (op.id === res.opinion!.id ? res.opinion! : op))
            : [res.opinion!, ...prev];
          return [...next].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        });
        setEditingOpinion(null);
        router.refresh();
      }
    });
  };

  const handleDeleteOpinion = (id: number) => {
    startTransition(async () => {
      const res = await deleteOpinionAction(id);
      showStatus(res.ok, res.message);
      if (res.ok) {
        setOpinions((prev) => prev.filter((op) => op.id !== id));
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const handleDeleteAllOpinions = () => {
    startTransition(async () => {
      const res = await deleteAllOpinionsAction();
      showStatus(res.ok, res.message);
      if (res.ok) {
        setOpinions([]);
        setEditingOpinion(null);
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const handleToggleUserRole = (user: DbUserRecord) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    startTransition(async () => {
      const res = await updateUserRoleAction(user.id, nextRole);
      showStatus(res.ok, res.message);
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)),
        );
        router.refresh();
      }
    });
  };

  const handleDeleteUser = (userId: number) => {
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      showStatus(res.ok, res.message);
      if (res.ok) {
        if (userId === admin.id) {
          router.push('/login');
          router.refresh();
          return;
        }
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const handleSaveAdminAccount = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAdminAccountAction({
        fullName: adminName,
        email: adminEmail,
        currentPassword,
        newPassword,
      });
      showStatus(res.ok, res.message);
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        router.refresh();
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

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await sendBroadcastNotificationAction({
        title: notifTitle,
        body: notifBody,
        targetUrl: notifTargetUrl,
      });
      showStatus(res.ok, res.message);
      if (res.ok && res.notification) {
        setBroadcasts((prev) => [res.notification!, ...prev]);
        setNotifTitle('');
        setNotifBody('');
        router.refresh();
      }
    });
  };

  const handleDeleteBroadcast = (id: number) => {
    startTransition(async () => {
      const res = await deleteBroadcastNotificationAction(id);
      showStatus(res.ok, res.message);
      if (res.ok) {
        setBroadcasts((prev) => prev.filter((item) => item.id !== id));
        setConfirmDeleteKey(null);
        router.refresh();
      }
    });
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'release', label: 'الإصدار والتحميل', icon: Settings },
    { id: 'notifications', label: 'إرسال إشعار للزوار', icon: BellRing },
    { id: 'capabilities', label: 'المميزات الديناميكية', icon: Layers },
    { id: 'install', label: 'التثبيت والتحديثات', icon: ListChecks },
    { id: 'opinions', label: 'الآراء والحسابات', icon: MessageSquareText },
    { id: 'account', label: 'حساب الأدمن', icon: Shield },
  ];

  const filteredOpinions = opinions.filter(
    (op) =>
      !opinionSearch.trim() ||
      op.authorName.toLowerCase().includes(opinionSearch.toLowerCase()) ||
      op.comment.toLowerCase().includes(opinionSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[var(--velvet-bg)] text-[var(--velvet-text)]">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--velvet-border)] bg-[var(--velvet-bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl border border-[#D4B782]/40 bg-[#0C0F14]"
              aria-label="العودة للموقع"
            >
              <span className="font-display text-base font-extrabold leading-none text-[#D4B782]">
                N
              </span>
              <span className="mt-0.5 h-[2px] w-4 rounded-full bg-[#D4B782]" />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-[var(--velvet-text)] sm:text-base">
                لوحة تحكم AL NAGEEB
              </p>
              <p className="truncate text-xs text-[var(--velvet-muted)]">
                {admin.fullName} · {admin.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggleButton />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--velvet-text)] hover:border-[var(--velvet-gold)] whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">معاينة الموقع</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--velvet-rose)]/40 px-3.5 py-2 text-xs font-semibold text-[var(--velvet-rose)] hover:bg-[var(--velvet-rose)]/10 whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12">
        {/* Sidebar Navigation (260px feel on desktop) */}
        <aside className="lg:col-span-3">
          <nav
            aria-label="أقسام لوحة التحكم"
            className="flex flex-row gap-1.5 overflow-x-auto rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] p-2 lg:flex-col"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setBanner(null);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-right text-xs font-bold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#F0C97A] text-[#1A1408]'
                      : 'text-[var(--velvet-muted)] hover:bg-[var(--velvet-surface-high)] hover:text-[var(--velvet-text)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Compact Live Summary in Sidebar */}
          <div className="mt-4 hidden rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] p-4 lg:block">
            <p className="text-xs font-semibold text-[var(--velvet-muted)]">الحالة الحالية</p>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">الإصدار</dt>
                <dd dir="ltr" className="font-numeric font-bold text-[var(--velvet-gold)]">
                  v{settingsForm.version}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">الحجم</dt>
                <dd dir="ltr" className="font-numeric font-bold">
                  {settingsForm.fileSizeLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">المميزات الظاهرة</dt>
                <dd className="font-numeric font-bold">
                  {capabilities.filter((c) => c.isVisible !== false).length} / {capabilities.length}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">إجمالي التحميلات</dt>
                <dd className="font-numeric font-bold text-[var(--velvet-gold)]">
                  {trafficStats.totalDownloads.toLocaleString('en-US')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">عدد الزوار</dt>
                <dd className="font-numeric font-bold text-[var(--velvet-sky)]">
                  {trafficStats.uniqueVisitors.toLocaleString('en-US')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">آراء المستخدمين</dt>
                <dd className="font-numeric font-bold">{opinions.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">الحسابات</dt>
                <dd className="font-numeric font-bold">{users.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--velvet-muted)]">مفعلو الإشعارات</dt>
                <dd className="font-numeric font-bold text-[var(--velvet-emerald)]">
                  {initialPushStats.enabledCount}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Main Admin Workspace */}
        <main className="space-y-6 lg:col-span-9">
          {banner && (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
                banner.type === 'success'
                  ? 'border-[var(--velvet-emerald)]/40 bg-[var(--velvet-emerald)]/10 text-[var(--velvet-emerald)]'
                  : 'border-[var(--velvet-rose)]/40 bg-[var(--velvet-rose)]/10 text-[var(--velvet-rose)]'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{banner.text}</span>
            </div>
          )}

          {/* TAB 1: RELEASE & DOWNLOAD SETTINGS */}
          {activeTab === 'release' && (
            <section className="space-y-6">
              {/* Primary Analytics Highlights: Downloads & Visitors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  data-testid="admin-downloads-kpi"
                  className="lux-card relative overflow-hidden rounded-2xl border border-[#F0C97A]/25 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--velvet-muted)]">
                        عدد التحميلات (APK)
                      </p>
                      <p className="mt-1.5 font-numeric text-3xl font-extrabold text-[var(--velvet-gold)]">
                        {trafficStats.totalDownloads.toLocaleString('en-US')}
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--velvet-muted)]">
                        اليوم:{' '}
                        <span className="font-numeric font-bold text-[var(--velvet-text)]">
                          +{trafficStats.downloadsToday.toLocaleString('en-US')}
                        </span>
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F0C97A]/30 bg-[#F0C97A]/10 text-[#F0C97A]">
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                <div
                  data-testid="admin-visitors-kpi"
                  className="lux-card relative overflow-hidden rounded-2xl border border-[#7AD7F0]/25 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--velvet-muted)]">
                        عدد الزوار الفعليين
                      </p>
                      <p className="mt-1.5 font-numeric text-3xl font-extrabold text-[var(--velvet-sky)]">
                        {trafficStats.uniqueVisitors.toLocaleString('en-US')}
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--velvet-muted)]">
                        إجمالي الزيارات:{' '}
                        <span className="font-numeric font-bold text-[var(--velvet-text)]">
                          {trafficStats.totalVisits.toLocaleString('en-US')}
                        </span>
                        {' · '}اليوم:{' '}
                        <span className="font-numeric font-bold text-[var(--velvet-text)]">
                          +{trafficStats.visitorsToday.toLocaleString('en-US')}
                        </span>
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#7AD7F0]/30 bg-[#7AD7F0]/10 text-[#7AD7F0]">
                      <Users className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Visits & Downloads Time-Series Analytics Chart */}
              <TrafficAnalyticsChart
                stats={trafficStats}
                loading={refreshingStats}
                onRangeChange={(days) => void fetchTrafficStats(days)}
                onRefresh={() => void fetchTrafficStats(trafficStats.rangeDays)}
              />

              {/* 4 Release & Community KPI Strip */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">الإصدار الحالي</p>
                  <p dir="ltr" className="mt-1 font-numeric text-2xl font-bold text-[var(--velvet-gold)] text-right">
                    v{settingsForm.version}
                  </p>
                </div>
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">حجم الحزمة</p>
                  <p dir="ltr" className="mt-1 font-numeric text-2xl font-bold text-right">
                    {settingsForm.fileSizeLabel}
                  </p>
                </div>
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">الآراء المنشورة</p>
                  <p className="mt-1 font-numeric text-2xl font-bold">{opinions.length}</p>
                </div>
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">الحسابات المسجلة</p>
                  <p className="mt-1 font-numeric text-2xl font-bold">{users.length}</p>
                </div>
              </div>

              <form onSubmit={handleSaveRelease} className="lux-card space-y-5 rounded-3xl p-6 sm:p-8">
                <div>
                  <h2 className="font-display text-xl font-bold">
                    بيانات الإصدار ورابط التحميل المباشر
                  </h2>
                  <p className="mt-1 text-xs text-[var(--velvet-muted)]">
                    أي تعديل تحفظه هنا ينعكس فوراً في الصفحة الرئيسية، صفحة الدليل، وزر تحميل ملف APK.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="set-version" className="mb-1.5 block text-xs font-semibold">
                      رقم الإصدار
                    </label>
                    <input
                      id="set-version"
                      dir="ltr"
                      value={settingsForm.version}
                      onChange={(e) => setSettingsForm({ ...settingsForm, version: e.target.value })}
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-vcode" className="mb-1.5 block text-xs font-semibold">
                      رمز البناء (versionCode)
                    </label>
                    <input
                      id="set-vcode"
                      type="number"
                      dir="ltr"
                      value={settingsForm.versionCode}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, versionCode: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-size" className="mb-1.5 block text-xs font-semibold">
                      حجم الملف
                    </label>
                    <input
                      id="set-size"
                      dir="ltr"
                      value={settingsForm.fileSizeLabel}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, fileSizeLabel: e.target.value })
                      }
                      placeholder="38.4 MB"
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-android" className="mb-1.5 block text-xs font-semibold">
                      النظام المطلوب
                    </label>
                    <input
                      id="set-android"
                      dir="ltr"
                      value={settingsForm.minAndroid}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, minAndroid: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor="set-apk-url" className="text-xs font-semibold">
                      رابط تحميل ملف APK المباشر
                    </label>
                    <a
                      href={settingsForm.apkDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--velvet-gold)] hover:underline"
                    >
                      <span>اختبار الرابط</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                  <input
                    id="set-apk-url"
                    type="url"
                    dir="ltr"
                    value={settingsForm.apkDownloadUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, apkDownloadUrl: e.target.value })
                    }
                    className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-left font-mono text-xs focus:border-[var(--velvet-gold)] focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="set-pkg" className="mb-1.5 block text-xs font-semibold">
                      اسم الحزمة (Package Name)
                    </label>
                    <input
                      id="set-pkg"
                      dir="ltr"
                      value={settingsForm.packageName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, packageName: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-left font-mono text-xs focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-repo" className="mb-1.5 block text-xs font-semibold">
                      رابط مستودع GitHub
                    </label>
                    <input
                      id="set-repo"
                      type="url"
                      dir="ltr"
                      value={settingsForm.repoUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, repoUrl: e.target.value })}
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-left font-mono text-xs focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="set-hero-title" className="mb-1.5 block text-xs font-semibold">
                    العنوان الرئيسي في الصفحة الأولى
                  </label>
                  <input
                    id="set-hero-title"
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="set-hero-sub" className="mb-1.5 block text-xs font-semibold">
                    الوصف أسفل العنوان الرئيسي
                  </label>
                  <textarea
                    id="set-hero-sub"
                    rows={3}
                    value={settingsForm.heroSubtitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm leading-relaxed focus:border-[var(--velvet-gold)] focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="set-announcement" className="mb-1.5 block text-xs font-semibold">
                      رسالة إعلان أعلى الصفحة (اختياري)
                    </label>
                    <input
                      id="set-announcement"
                      value={settingsForm.announcementText}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                      }
                      placeholder="مثال: تحديث جديد متاح الآن لتحسين ثبات المؤقت العائم"
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-license" className="mb-1.5 block text-xs font-semibold">
                      سطر الترخيص في الفوتر
                    </label>
                    <input
                      id="set-license"
                      value={settingsForm.licenseNote}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, licenseNote: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-[var(--velvet-border)] pt-4">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-6 py-2.5 font-display text-sm font-bold text-[#1A1408] hover:bg-[#f5d593] disabled:opacity-60"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>حفظ وتطبيق التغييرات</span>
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB: BROADCAST NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <section className="space-y-6">
              {/* Subscriber KPIs */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">المشتركون بالإشعارات</p>
                  <p className="mt-1 font-numeric text-2xl font-bold text-[var(--velvet-emerald)]">
                    {initialPushStats.enabledCount}
                  </p>
                </div>
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">أجهزة Web Push الفورية</p>
                  <p className="mt-1 font-numeric text-2xl font-bold text-[var(--velvet-gold)]">
                    {initialPushStats.webPushDeviceCount}
                  </p>
                </div>
                <div className="lux-card rounded-2xl p-4">
                  <p className="text-xs text-[var(--velvet-muted)]">إجمالي الإشعارات المرسلة</p>
                  <p className="mt-1 font-numeric text-2xl font-bold">{broadcasts.length}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* Notification Composer */}
                <form
                  onSubmit={handleSendBroadcast}
                  className="lux-card space-y-5 rounded-3xl p-6 sm:p-7 lg:col-span-7"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold">
                      إرسال إشعار لكل مفعلّي الإشعارات
                    </h2>
                    <p className="mt-1 text-xs text-[var(--velvet-muted)]">
                      اكتب عنوان ونص الإشعار بحرية، وهيُرسل فوراً لكل زائر مفعّل الإشعارات على الموقع.
                    </p>
                  </div>

                  {/* Quick Egyptian Arabic Presets */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--velvet-muted)]">
                      قوالب سريعة جاهزة للتعديل:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          label: 'تحديث جديد',
                          title: `نزل تحديث جديد لتطبيق النجيب v${settingsForm.version} 🚀`,
                          body: 'ضيفنا تحسينات قوية في مؤقت التركيز والسبورة الذكية — حمّل التحديث الجديد دلوقتي واستمتع بأداء أسرع.',
                          url: '/install',
                        },
                        {
                          label: 'رسالة تحفيز',
                          title: 'فكّر نفسك بهدفك وكمل مذاكرتك 💪',
                          body: 'جلسة تركيز واحدة النهارده بـ 25 دقيقة في النجيب هتقربك خطوة كبيرة من حلمك. يلا ابدأ!',
                          url: '/',
                        },
                        {
                          label: 'ميزة جديدة',
                          title: 'اكتشف إمكانيات النجيب الجديدة ✨',
                          body: 'تقدر دلوقتي تعرف كل أدوات السبورة الهندسية ومخطط الأسبوع بالتفصيل من صفحة المميزات.',
                          url: '/features',
                        },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setNotifTitle(preset.title);
                            setNotifBody(preset.body);
                            setNotifTargetUrl(preset.url);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--velvet-text)] transition-colors hover:border-[var(--velvet-gold)]"
                        >
                          <Sparkles className="h-3 w-3 text-[var(--velvet-gold)]" aria-hidden="true" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <label htmlFor="notif-title" className="font-semibold">
                        عنوان الإشعار
                      </label>
                      <span dir="ltr" className="font-numeric text-[var(--velvet-muted)]">
                        {notifTitle.length} / 120
                      </span>
                    </div>
                    <input
                      id="notif-title"
                      required
                      maxLength={120}
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="مثال: تحديث جديد لتطبيق النجيب متاح الآن"
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <label htmlFor="notif-body" className="font-semibold">
                        نص الإشعار
                      </label>
                      <span dir="ltr" className="font-numeric text-[var(--velvet-muted)]">
                        {notifBody.length} / 500
                      </span>
                    </div>
                    <textarea
                      id="notif-body"
                      required
                      maxLength={500}
                      rows={4}
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      placeholder="اكتب الرسالة اللي عايز توصل لكل الناس اللي مفعلين الإشعارات..."
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm leading-relaxed focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notif-target-url" className="block text-xs font-semibold">
                      الصفحة اللي تفتح لما الزائر يضغط على الإشعار
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { path: '/', label: 'الرئيسية' },
                        { path: '/install', label: 'صفحة التثبيت' },
                        { path: '/features', label: 'المميزات' },
                        { path: '/opinions', label: 'الآراء' },
                        { path: '/guide', label: 'الدليل' },
                      ].map((route) => (
                        <button
                          key={route.path}
                          type="button"
                          onClick={() => setNotifTargetUrl(route.path)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            notifTargetUrl === route.path
                              ? 'border-[var(--velvet-gold)] bg-[var(--velvet-gold)]/15 text-[var(--velvet-gold)]'
                              : 'border-[var(--velvet-border)] bg-[var(--velvet-bg)] text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                          }`}
                        >
                          {route.label}
                        </button>
                      ))}
                    </div>
                    <input
                      id="notif-target-url"
                      dir="ltr"
                      value={notifTargetUrl}
                      onChange={(e) => setNotifTargetUrl(e.target.value)}
                      placeholder="/install"
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-left font-mono text-xs focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--velvet-border)] pt-4">
                    <span className="text-xs text-[var(--velvet-muted)]">
                      سيصل إلى{' '}
                      <strong className="font-numeric text-[var(--velvet-emerald)]">
                        {initialPushStats.enabledCount}
                      </strong>{' '}
                      مشترك مفعّل
                    </span>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-6 py-2.5 font-display text-sm font-bold text-[#1A1408] hover:bg-[#f5d593] disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>إرسال الإشعار الآن</span>
                    </button>
                  </div>
                </form>

                {/* Live Notification Preview */}
                <div className="lux-card flex flex-col justify-between space-y-5 rounded-3xl p-6 lg:col-span-5">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[var(--velvet-gold)]">
                      معاينة حيّة للإشعار قبل الإرسال
                    </p>
                    <p className="text-xs leading-relaxed text-[var(--velvet-muted)]">
                      كده هيظهر الإشعار للمستخدمين على الموبايل والكمبيوتر وفي مركز إشعارات الموقع.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--velvet-gold)]/40 bg-[#0C0F14] p-4 text-white shadow-[0_20px_50px_-24px_rgba(240,201,122,0.5)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-[#D4B782]/45 bg-[#12161E]">
                        <span className="font-display text-sm font-extrabold leading-none text-[#D4B782]">
                          N
                        </span>
                        <span className="mt-0.5 h-[2px] w-3.5 rounded-full bg-[#D4B782]" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-[#9AA4B2]">
                          <span>AL NAGEEB · الآن</span>
                          <span dir="ltr" className="font-mono">
                            {notifTargetUrl || '/'}
                          </span>
                        </div>
                        <p className="font-display text-sm font-bold text-white">
                          {notifTitle.trim() || 'عنوان الإشعار هيظهر هنا...'}
                        </p>
                        <p className="text-xs leading-relaxed text-[#CBD5E1]">
                          {notifBody.trim() ||
                            'اكتب نص الإشعار في الخانة اللي جنبك عشان تشوف شكله قبل ما تبعته.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)]/70 p-3.5 text-xs leading-relaxed text-[var(--velvet-muted)]">
                    ملحوظة: الإشعارات بتوصل عبر خدمة <strong className="text-[var(--velvet-text)]">Web Push</strong> حتى لو المتصفح مقفول، وكمان بتظهر مباشرة في جرس الإشعارات جوا الموقع.
                  </div>
                </div>
              </div>

              {/* Sent Notifications History */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold">سجل الإشعارات المرسلة</h3>

                {broadcasts.length === 0 ? (
                  <div className="lux-card rounded-2xl p-8 text-center text-sm text-[var(--velvet-muted)]">
                    لم تقم بإرسال أي إشعارات جماعية حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcasts.map((item) => {
                      const delKey = `notif-${item.id}`;
                      return (
                        <article
                          key={item.id}
                          className="lux-card flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5"
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--velvet-muted)]">
                              <span className="font-display text-sm font-bold text-[var(--velvet-text)]">
                                {item.title}
                              </span>
                              <span dir="ltr" className="font-mono text-[11px] text-[var(--velvet-gold)]">
                                {item.targetUrl}
                              </span>
                              <span>·</span>
                              <span className="font-numeric">
                                وصل لـ {item.recipientCount} مشترك ({item.pushSentCount} Push)
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-[var(--velvet-muted)] sm:text-sm">
                              {item.body}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setNotifTitle(item.title);
                                setNotifBody(item.body);
                                setNotifTargetUrl(item.targetUrl);
                              }}
                              className="rounded-xl border border-[var(--velvet-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--velvet-gold)]"
                            >
                              إعادة استخدام
                            </button>

                            {confirmDeleteKey === delKey ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBroadcast(item.id)}
                                  className="rounded-xl bg-[var(--velvet-rose)] px-3 py-1.5 text-xs font-bold text-[#1A0810]"
                                >
                                  تأكيد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="rounded-xl border border-[var(--velvet-border)] px-2.5 py-1.5 text-xs"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                aria-label={`حذف إشعار ${item.title}`}
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="rounded-xl border border-[var(--velvet-rose)]/40 p-1.5 text-[var(--velvet-rose)] hover:bg-[var(--velvet-rose)]/10"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 2: DYNAMIC CAPABILITIES */}
          {activeTab === 'capabilities' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">المميزات المعروضة في الموقع</h2>
                  <p className="text-xs text-[var(--velvet-muted)]">
                    أضف أو عدّل أو أخفِ المميزات لتواكب كل إصدار جديد من التطبيق.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCap({
                      sortOrder: capabilities.length + 1,
                      indexLabel: String(capabilities.length + 1).padStart(2, '0'),
                      title: '',
                      subtitle: '',
                      description: '',
                      highlightsText: '',
                      accentHex: '#F0C97A',
                      spanWide: false,
                      isVisible: true,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-4 py-2 font-display text-xs font-bold text-[#1A1408] hover:bg-[#f5d593]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>إضافة ميزة جديدة</span>
                </button>
              </div>

              {editingCap && (
                <form onSubmit={handleSaveCapability} className="lux-card space-y-4 rounded-3xl p-6">
                  <h3 className="font-display text-base font-bold text-[var(--velvet-gold)]">
                    {editingCap.dbId ? 'تعديل الميزة' : 'ميزة جديدة'}
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <label htmlFor="cap-order" className="mb-1 block text-xs font-semibold">
                        الترتيب
                      </label>
                      <input
                        id="cap-order"
                        type="number"
                        value={editingCap.sortOrder}
                        onChange={(e) =>
                          setEditingCap({ ...editingCap, sortOrder: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 font-numeric text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="cap-idx" className="mb-1 block text-xs font-semibold">
                        الرقم الظاهر
                      </label>
                      <input
                        id="cap-idx"
                        dir="ltr"
                        value={editingCap.indexLabel}
                        onChange={(e) =>
                          setEditingCap({ ...editingCap, indexLabel: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="cap-color" className="mb-1 block text-xs font-semibold">
                        لون التمييز
                      </label>
                      <select
                        id="cap-color"
                        value={editingCap.accentHex}
                        onChange={(e) =>
                          setEditingCap({ ...editingCap, accentHex: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      >
                        {ACCENT_CHOICES.map((c) => (
                          <option key={c.hex} value={c.hex}>
                            {c.label} ({c.hex})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cap-title" className="mb-1 block text-xs font-semibold">
                        عنوان الميزة
                      </label>
                      <input
                        id="cap-title"
                        value={editingCap.title}
                        onChange={(e) => setEditingCap({ ...editingCap, title: e.target.value })}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="cap-sub" className="mb-1 block text-xs font-semibold">
                        العنوان الفرعي
                      </label>
                      <input
                        id="cap-sub"
                        value={editingCap.subtitle}
                        onChange={(e) => setEditingCap({ ...editingCap, subtitle: e.target.value })}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cap-desc" className="mb-1 block text-xs font-semibold">
                      الوصف التفصيلي
                    </label>
                    <textarea
                      id="cap-desc"
                      rows={3}
                      value={editingCap.description}
                      onChange={(e) =>
                        setEditingCap({ ...editingCap, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="cap-bullets" className="mb-1 block text-xs font-semibold">
                      النقاط البارزة (نقطة في كل سطر)
                    </label>
                    <textarea
                      id="cap-bullets"
                      rows={3}
                      value={editingCap.highlightsText}
                      onChange={(e) =>
                        setEditingCap({ ...editingCap, highlightsText: e.target.value })
                      }
                      placeholder={'ميزة فرعية 1\nميزة فرعية 2'}
                      className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingCap.spanWide}
                        onChange={(e) =>
                          setEditingCap({ ...editingCap, spanWide: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#F0C97A]"
                      />
                      <span>عرض البطاقة بشكل واسع (عمودين في الشبكة)</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingCap.isVisible}
                        onChange={(e) =>
                          setEditingCap({ ...editingCap, isVisible: e.target.checked })
                        }
                        className="h-4 w-4 accent-[#F0C97A]"
                      />
                      <span>ظاهرة للزوار</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-5 py-2 text-xs font-bold text-[#1A1408]"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>حفظ الميزة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCap(null)}
                      className="rounded-xl border border-[var(--velvet-border)] px-4 py-2 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {capabilities.map((cap) => {
                  const delKey = `cap-${cap.dbId}`;
                  return (
                    <article
                      key={cap.dbId ?? cap.id}
                      className="lux-card flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span dir="ltr" className="font-numeric font-bold" style={{ color: cap.accentHex }}>
                            {cap.index}
                          </span>
                          <span className="text-[var(--velvet-muted)]">· {cap.subtitle}</span>
                          {cap.isVisible === false && (
                            <span className="text-[var(--velvet-rose)]">· مخفية عن الزوار</span>
                          )}
                        </div>
                        <h3 className="font-display text-base font-bold">{cap.title}</h3>
                        <p className="text-xs leading-relaxed text-[var(--velvet-muted)]">
                          {cap.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCapVisibility(cap)}
                          aria-label={cap.isVisible !== false ? `إخفاء ${cap.title}` : `إظهار ${cap.title}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--velvet-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--velvet-gold)]"
                        >
                          {cap.isVisible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          <span>{cap.isVisible !== false ? 'ظاهرة' : 'مخفية'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCap({
                              dbId: cap.dbId,
                              sortOrder: cap.sortOrder ?? 1,
                              indexLabel: cap.index,
                              title: cap.title,
                              subtitle: cap.subtitle,
                              description: cap.description,
                              highlightsText: cap.highlights.join('\n'),
                              accentHex: cap.accentHex,
                              spanWide: Boolean(cap.spanWide),
                              isVisible: cap.isVisible !== false,
                            })
                          }
                          className="rounded-xl border border-[var(--velvet-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--velvet-gold)]"
                        >
                          تعديل
                        </button>
                        {cap.dbId && (
                          confirmDeleteKey === delKey ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteCapability(cap.dbId!)}
                                className="rounded-xl bg-[var(--velvet-rose)] px-3 py-1.5 text-xs font-bold text-[#1A0810]"
                              >
                                تأكيد الحذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="rounded-xl border border-[var(--velvet-border)] px-2.5 py-1.5 text-xs"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              aria-label={`حذف ${cap.title}`}
                              onClick={() => setConfirmDeleteKey(delKey)}
                              className="rounded-xl border border-[var(--velvet-rose)]/40 p-1.5 text-[var(--velvet-rose)] hover:bg-[var(--velvet-rose)]/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 3: INSTALL STEPS & CHANGELOG */}
          {activeTab === 'install' && (
            <section className="space-y-8">
              {/* Install Steps */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold">خطوات طريقة التثبيت</h2>
                    <p className="text-xs text-[var(--velvet-muted)]">
                      تظهر في قسم طريقة التثبيت بالصفحة الرئيسية.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingStep({
                        stepOrder: installSteps.length + 1,
                        title: '',
                        detail: '',
                        tip: '',
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-4 py-2 font-display text-xs font-bold text-[#1A1408]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة خطوة</span>
                  </button>
                </div>

                {editingStep && (
                  <form onSubmit={handleSaveInstallStep} className="lux-card space-y-4 rounded-2xl p-5">
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <label htmlFor="step-order" className="mb-1 block text-xs font-semibold">
                          رقم الخطوة
                        </label>
                        <input
                          id="step-order"
                          type="number"
                          value={editingStep.stepOrder}
                          onChange={(e) =>
                            setEditingStep({ ...editingStep, stepOrder: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 font-numeric text-sm"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="step-title" className="mb-1 block text-xs font-semibold">
                          عنوان الخطوة
                        </label>
                        <input
                          id="step-title"
                          value={editingStep.title}
                          onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="step-detail" className="mb-1 block text-xs font-semibold">
                        الشرح
                      </label>
                      <textarea
                        id="step-detail"
                        rows={2}
                        value={editingStep.detail}
                        onChange={(e) => setEditingStep({ ...editingStep, detail: e.target.value })}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="step-tip" className="mb-1 block text-xs font-semibold">
                        ملاحظة مساعدة (اختياري)
                      </label>
                      <input
                        id="step-tip"
                        value={editingStep.tip}
                        onChange={(e) => setEditingStep({ ...editingStep, tip: e.target.value })}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl bg-[#F0C97A] px-4 py-2 text-xs font-bold text-[#1A1408]"
                      >
                        حفظ الخطوة
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStep(null)}
                        className="rounded-xl border border-[var(--velvet-border)] px-4 py-2 text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {installSteps.map((step) => {
                    const delKey = `step-${step.id}`;
                    return (
                      <div key={step.id ?? step.stepOrder} className="lux-card rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span dir="ltr" className="font-numeric text-xs font-bold text-[var(--velvet-gold)]">
                              {String(step.stepOrder).padStart(2, '0')}
                            </span>
                            <h3 className="mt-1 font-display text-sm font-bold">{step.title}</h3>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingStep(step)}
                              className="rounded-lg border border-[var(--velvet-border)] px-2.5 py-1 text-xs"
                            >
                              تعديل
                            </button>
                            {step.id && (
                              confirmDeleteKey === delKey ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInstallStep(step.id!)}
                                  className="rounded-lg bg-[var(--velvet-rose)] px-2.5 py-1 text-xs font-bold text-[#1A0810]"
                                >
                                  تأكيد
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  aria-label={`حذف خطوة ${step.title}`}
                                  onClick={() => setConfirmDeleteKey(delKey)}
                                  className="rounded-lg border border-[var(--velvet-rose)]/40 p-1 text-[var(--velvet-rose)]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--velvet-muted)]">
                          {step.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Changelog Manager */}
              <div className="space-y-4 border-t border-[var(--velvet-border)] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-[var(--velvet-gold)]" aria-hidden="true" />
                    <h2 className="font-display text-xl font-bold">سجل التغييرات للإصدارات</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingLog({
                        sortOrder: 1,
                        version: `v${settingsForm.version}`,
                        date: 'الإصدار الحالي',
                        headline: '',
                        changesText: '',
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-4 py-2 font-display text-xs font-bold text-[#1A1408]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة إصدار للسجل</span>
                  </button>
                </div>

                {editingLog && (
                  <form onSubmit={handleSaveChangelog} className="lux-card space-y-4 rounded-2xl p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="log-ver" className="mb-1 block text-xs font-semibold">
                          الإصدار
                        </label>
                        <input
                          id="log-ver"
                          dir="ltr"
                          value={editingLog.version}
                          onChange={(e) => setEditingLog({ ...editingLog, version: e.target.value })}
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="log-date" className="mb-1 block text-xs font-semibold">
                          التاريخ أو التسمية
                        </label>
                        <input
                          id="log-date"
                          value={editingLog.date}
                          onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="log-order" className="mb-1 block text-xs font-semibold">
                          الترتيب
                        </label>
                        <input
                          id="log-order"
                          type="number"
                          value={editingLog.sortOrder}
                          onChange={(e) =>
                            setEditingLog({ ...editingLog, sortOrder: Number(e.target.value) })
                          }
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 font-numeric text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="log-head" className="mb-1 block text-xs font-semibold">
                        ملخص التحديث
                      </label>
                      <input
                        id="log-head"
                        value={editingLog.headline}
                        onChange={(e) => setEditingLog({ ...editingLog, headline: e.target.value })}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="log-changes" className="mb-1 block text-xs font-semibold">
                        التحسينات (سطر لكل نقطة)
                      </label>
                      <textarea
                        id="log-changes"
                        rows={3}
                        value={editingLog.changesText}
                        onChange={(e) =>
                          setEditingLog({ ...editingLog, changesText: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl bg-[#F0C97A] px-4 py-2 text-xs font-bold text-[#1A1408]"
                      >
                        حفظ السجل
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLog(null)}
                        className="rounded-xl border border-[var(--velvet-border)] px-4 py-2 text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {changelog.map((entry) => {
                    const delKey = `log-${entry.id}`;
                    return (
                      <div key={entry.id ?? entry.version} className="lux-card rounded-2xl p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span dir="ltr" className="font-numeric text-sm font-bold text-[var(--velvet-gold)]">
                              {entry.version}
                            </span>
                            <span className="mx-2 text-xs text-[var(--velvet-muted)]">· {entry.date}</span>
                            <h3 className="mt-1 font-display text-base font-bold">{entry.headline}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingLog({
                                  id: entry.id,
                                  sortOrder: entry.sortOrder ?? 1,
                                  version: entry.version,
                                  date: entry.date,
                                  headline: entry.headline,
                                  changesText: entry.changes.join('\n'),
                                })
                              }
                              className="rounded-lg border border-[var(--velvet-border)] px-3 py-1 text-xs"
                            >
                              تعديل
                            </button>
                            {entry.id && (
                              confirmDeleteKey === delKey ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChangelog(entry.id!)}
                                  className="rounded-lg bg-[var(--velvet-rose)] px-3 py-1 text-xs font-bold text-[#1A0810]"
                                >
                                  تأكيد
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  aria-label={`حذف سجل ${entry.version}`}
                                  onClick={() => setConfirmDeleteKey(delKey)}
                                  className="rounded-lg border border-[var(--velvet-rose)]/40 p-1.5 text-[var(--velvet-rose)]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: OPINIONS MODERATION & REGISTERED USERS */}
          {activeTab === 'opinions' && (
            <section className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold">التحكم الكامل في آراء المستخدمين</h2>
                    <p className="text-xs text-[var(--velvet-muted)]">
                      أضف أو عدّل أو ثبّت أي رأي، أو احذف التعليقات الفردية أو جميعها بضغطة واحدة.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      value={opinionSearch}
                      onChange={(e) => setOpinionSearch(e.target.value)}
                      placeholder="بحث في الآراء..."
                      className="w-52 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)] px-3.5 py-2 text-xs focus:border-[var(--velvet-gold)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOpinion({
                          authorName: '',
                          authorRole: '',
                          comment: '',
                          appVersion: settingsForm.version,
                          helpfulCount: 0,
                          isFeatured: false,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0C97A] px-3.5 py-2 font-display text-xs font-bold text-[#1A1408] hover:bg-[#f5d593]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>إضافة رأي</span>
                    </button>
                    {opinions.length > 0 && (
                      confirmDeleteKey === 'op-all' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleDeleteAllOpinions}
                            disabled={isPending}
                            className="rounded-xl bg-[var(--velvet-rose)] px-3 py-2 text-xs font-bold text-[#1A0810]"
                          >
                            تأكيد حذف الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(null)}
                            className="rounded-xl border border-[var(--velvet-border)] px-2.5 py-2 text-xs"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteKey('op-all')}
                          className="rounded-xl border border-[var(--velvet-rose)]/40 px-3 py-2 text-xs font-semibold text-[var(--velvet-rose)] hover:bg-[var(--velvet-rose)]/10"
                        >
                          حذف الكل
                        </button>
                      )
                    )}
                  </div>
                </div>

                {editingOpinion && (
                  <form onSubmit={handleSaveOpinionByAdmin} className="lux-card space-y-4 rounded-3xl p-6">
                    <h3 className="font-display text-base font-bold text-[var(--velvet-gold)]">
                      {editingOpinion.id ? 'تعديل رأي مستخدم' : 'إضافة رأي جديد للموقع'}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label htmlFor="adm-op-name" className="mb-1 block text-xs font-semibold">
                          الاسم
                        </label>
                        <input
                          id="adm-op-name"
                          value={editingOpinion.authorName}
                          onChange={(e) =>
                            setEditingOpinion({ ...editingOpinion, authorName: e.target.value })
                          }
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="adm-op-role" className="mb-1 block text-xs font-semibold">
                          الصف أو التخصص
                        </label>
                        <input
                          id="adm-op-role"
                          value={editingOpinion.authorRole}
                          onChange={(e) =>
                            setEditingOpinion({ ...editingOpinion, authorRole: e.target.value })
                          }
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="adm-op-ver" className="mb-1 block text-xs font-semibold">
                          رقم الإصدار
                        </label>
                        <input
                          id="adm-op-ver"
                          dir="ltr"
                          value={editingOpinion.appVersion}
                          onChange={(e) =>
                            setEditingOpinion({ ...editingOpinion, appVersion: e.target.value })
                          }
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="adm-op-helpful" className="mb-1 block text-xs font-semibold">
                          عدد «مفيد»
                        </label>
                        <input
                          id="adm-op-helpful"
                          type="number"
                          min={0}
                          dir="ltr"
                          value={editingOpinion.helpfulCount}
                          onChange={(e) =>
                            setEditingOpinion({
                              ...editingOpinion,
                              helpfulCount: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-left font-numeric text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="adm-op-comment" className="mb-1 block text-xs font-semibold">
                        نص الرأي
                      </label>
                      <textarea
                        id="adm-op-comment"
                        rows={3}
                        value={editingOpinion.comment}
                        onChange={(e) =>
                          setEditingOpinion({ ...editingOpinion, comment: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={editingOpinion.isFeatured}
                          onChange={(e) =>
                            setEditingOpinion({ ...editingOpinion, isFeatured: e.target.checked })
                          }
                          className="h-4 w-4 accent-[#F0C97A]"
                        />
                        <span>تثبيت هذا الرأي في أعلى القائمة</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-5 py-2 text-xs font-bold text-[#1A1408]"
                        >
                          <Save className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>حفظ الرأي</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingOpinion(null)}
                          className="rounded-xl border border-[var(--velvet-border)] px-4 py-2 text-xs font-semibold"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {filteredOpinions.length === 0 ? (
                  <div className="lux-card rounded-2xl p-8 text-center text-sm text-[var(--velvet-muted)]">
                    لا توجد آراء مطابقة حالياً.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOpinions.map((op) => {
                      const delKey = `op-${op.id}`;
                      return (
                        <article
                          key={op.id}
                          className="lux-card flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5"
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-display text-sm font-bold">{op.authorName}</span>
                              {op.authorRole && (
                                <span className="text-[var(--velvet-muted)]">· {op.authorRole}</span>
                              )}
                              <span className="text-[var(--velvet-muted)]">
                                · إصدار {op.appVersion} · مفيد ({op.helpfulCount})
                              </span>
                              {op.isFeatured && (
                                <span className="font-semibold text-[var(--velvet-gold)]">· مثبت</span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-[var(--velvet-text)]/90">
                              {op.comment}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingOpinion({
                                  id: op.id,
                                  authorName: op.authorName,
                                  authorRole: op.authorRole,
                                  comment: op.comment,
                                  appVersion: op.appVersion,
                                  helpfulCount: op.helpfulCount,
                                  isFeatured: op.isFeatured,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-[var(--velvet-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--velvet-gold)]"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleFeaturedOpinion(op.id)}
                              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                                op.isFeatured
                                  ? 'border-[var(--velvet-gold)] bg-[var(--velvet-gold)]/15 text-[var(--velvet-gold)]'
                                  : 'border-[var(--velvet-border)] text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                              }`}
                            >
                              <Pin className="h-3.5 w-3.5" />
                              <span>{op.isFeatured ? 'مثبت' : 'تثبيت'}</span>
                            </button>

                            {confirmDeleteKey === delKey ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOpinion(op.id)}
                                  className="rounded-xl bg-[var(--velvet-rose)] px-3 py-1.5 text-xs font-bold text-[#1A0810]"
                                >
                                  تأكيد الحذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(null)}
                                  className="rounded-xl border border-[var(--velvet-border)] px-2.5 py-1.5 text-xs"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                aria-label={`حذف رأي ${op.authorName}`}
                                onClick={() => setConfirmDeleteKey(delKey)}
                                className="rounded-xl border border-[var(--velvet-rose)]/40 p-1.5 text-[var(--velvet-rose)] hover:bg-[var(--velvet-rose)]/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Users Table */}
              <div className="space-y-4 border-t border-[var(--velvet-border)] pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--velvet-sky)]" aria-hidden="true" />
                  <h2 className="font-display text-xl font-bold">الحسابات المسجلة</h2>
                </div>

                <div className="lux-card overflow-hidden rounded-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-xs">
                      <thead>
                        <tr className="border-b border-[var(--velvet-border)] bg-[var(--velvet-surface-high)]/60 font-bold">
                          <th className="px-4 py-3">الاسم</th>
                          <th className="px-4 py-3">البريد الإلكتروني</th>
                          <th className="px-4 py-3">الصلاحية</th>
                          <th className="px-4 py-3">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--velvet-border)]/70">
                        {users.map((u) => {
                          const delKey = `usr-${u.id}`;
                          return (
                            <tr key={u.id}>
                              <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                              <td dir="ltr" className="px-4 py-3 text-right font-mono text-[var(--velvet-muted)]">
                                {u.email}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {u.role === 'admin' ? (
                                  <span className="text-[var(--velvet-gold)]">أدمن</span>
                                ) : (
                                  <span>مستخدم</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {u.id !== admin.id && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleUserRole(u)}
                                      className="rounded-lg border border-[var(--velvet-border)] px-2.5 py-1 hover:border-[var(--velvet-gold)]"
                                    >
                                      {u.role === 'admin' ? 'تحويل لمستخدم' : 'ترقية لأدمن'}
                                    </button>
                                  )}
                                  {confirmDeleteKey === delKey ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="rounded-lg bg-[var(--velvet-rose)] px-2.5 py-1 font-bold text-[#1A0810]"
                                      >
                                        تأكيد
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteKey(null)}
                                        className="rounded-lg border border-[var(--velvet-border)] px-2 py-1"
                                      >
                                        إلغاء
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteKey(delKey)}
                                      className="rounded-lg border border-[var(--velvet-rose)]/40 px-2.5 py-1 text-[var(--velvet-rose)]"
                                    >
                                      {u.id === admin.id ? 'حذف حسابي' : 'حذف'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: ADMIN ACCOUNT & PASSWORD */}
          {activeTab === 'account' && (
            <section className="lux-card max-w-xl space-y-5 rounded-3xl p-6 sm:p-8">
              <div>
                <h2 className="font-display text-xl font-bold">إعدادات حساب الأدمن والأمان</h2>
                <p className="mt-1 text-xs text-[var(--velvet-muted)]">
                  عدّل اسمك أو بريدك الإلكتروني أو قم بتغيير كلمة المرور الخاصة باللوحة.
                </p>
              </div>

              <form onSubmit={handleSaveAdminAccount} className="space-y-4">
                <div>
                  <label htmlFor="adm-name" className="mb-1.5 block text-xs font-semibold">
                    الاسم
                  </label>
                  <input
                    id="adm-name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="adm-email" className="mb-1.5 block text-xs font-semibold">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="adm-email"
                    type="email"
                    dir="ltr"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2.5 text-left font-mono text-sm"
                  />
                </div>
                <div className="border-t border-[var(--velvet-border)] pt-4">
                  <p className="mb-3 text-xs font-semibold text-[var(--velvet-muted)]">
                    تغيير كلمة المرور (اختياري)
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="adm-cur-pass" className="mb-1 block text-xs font-semibold">
                        كلمة المرور الحالية
                      </label>
                      <input
                        id="adm-cur-pass"
                        type="password"
                        dir="ltr"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-left font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="adm-new-pass" className="mb-1 block text-xs font-semibold">
                        كلمة المرور الجديدة (8 أحرف فأكثر)
                      </label>
                      <input
                        id="adm-new-pass"
                        type="password"
                        dir="ltr"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3.5 py-2 text-left font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F0C97A] px-6 py-2.5 font-display text-sm font-bold text-[#1A1408] hover:bg-[#f5d593]"
                >
                  <Save className="h-4 w-4" />
                  <span>حفظ بيانات الحساب</span>
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
