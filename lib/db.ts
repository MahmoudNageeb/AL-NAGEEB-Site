import 'server-only';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { hashPassword, normalizeEmail, type UserRole } from './auth-logic';
import {
  filterAndSortOpinions,
  type OpinionItem,
  type OpinionSortOption,
  type ReleaseSettingsInput,
} from './reviews-logic';
import { generateVAPIDKeys } from 'web-push';
import {
  APP_RELEASE_META,
  CHANGELOG_ENTRIES,
  CORE_CAPABILITIES,
  DEFAULT_INSTALL_STEPS,
  type AppCapability,
  type AppReleaseMeta,
  type ChangelogEntry,
  type InstallStep,
} from './study-app-data';
import type { BroadcastNotificationItem } from './notifications-logic';
import {
  buildDailyTrafficSeries,
  EMPTY_SITE_TRAFFIC_STATS,
  formatPublicRouteLabel,
  normalizeRangeDays,
  type SiteTrafficStats,
  type TrafficRangeDays,
} from './analytics-logic';

const globalForPg = globalThis as unknown as {
  __alNageebPool?: Pool;
  __alNageebInitPromise?: Promise<void>;
  __alNageebSchemaReady?: boolean;
};

export const OWNER_DEFAULT_EMAIL = 'mahmoudnageeb2709@gmail.com';

export function getAuthorizedOwnerEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL || OWNER_DEFAULT_EMAIL);
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url && !url.includes('user:password@host'));
}

function isLocalConnection(connectionString: string): boolean {
  return (
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1') ||
    connectionString.includes('::1')
  );
}

function normalizeConnectionString(connectionString: string, local: boolean): string {
  if (local) return connectionString;
  try {
    const parsed = new URL(connectionString);
    const sslMode = parsed.searchParams.get('sslmode');
    if (
      (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') &&
      parsed.searchParams.get('uselibpqcompat') !== 'true'
    ) {
      parsed.searchParams.set('sslmode', 'verify-full');
      return parsed.toString();
    }
  } catch {
    // Keep original connection string if URL parsing fails
  }
  return connectionString;
}

function createPool(connectionString: string): Pool {
  const local = isLocalConnection(connectionString);
  const normalized = normalizeConnectionString(connectionString, local);
  const pool = new Pool({
    connectionString: normalized,
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 8000,
    ssl: local ? false : { rejectUnauthorized: true },
  });
  attachDatabasePool(pool);
  return pool;
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!globalForPg.__alNageebPool) {
    globalForPg.__alNageebPool = createPool(connectionString);
  }
  return globalForPg.__alNageebPool;
}

async function runSchemaInitialization(): Promise<void> {
  const directUrl =
    process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
  if (!directUrl) return;

  const isSeparateDirectPool =
    Boolean(process.env.DATABASE_URL_UNPOOLED?.trim()) &&
    process.env.DATABASE_URL_UNPOOLED?.trim() !== process.env.DATABASE_URL?.trim();

  const ddlPool = isSeparateDirectPool ? createPool(directUrl) : getPool();

  try {
    // 1. Users & Admin Accounts
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `);

    // 2. Dynamic Site & Release Settings
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY,
        app_name TEXT NOT NULL DEFAULT 'AL NAGEEB',
        arabic_name TEXT NOT NULL DEFAULT 'النجيب — منظومة الدراسة الشاملة',
        package_name TEXT NOT NULL DEFAULT 'com.nageebstudyos.study',
        version TEXT NOT NULL DEFAULT '2.7',
        version_code INTEGER NOT NULL DEFAULT 7,
        min_android TEXT NOT NULL DEFAULT 'Android 8.0+',
        file_size_label TEXT NOT NULL DEFAULT '38.4 MB',
        apk_download_url TEXT NOT NULL,
        hero_title TEXT NOT NULL,
        hero_subtitle TEXT NOT NULL,
        license_note TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        announcement_text TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ddlPool.query(
      `INSERT INTO app_settings (
        id, app_name, arabic_name, package_name, version, version_code,
        min_android, file_size_label, apk_download_url, hero_title, hero_subtitle,
        license_note, repo_url, announcement_text
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING`,
      [
        APP_RELEASE_META.name,
        APP_RELEASE_META.arabicName,
        APP_RELEASE_META.packageName,
        APP_RELEASE_META.version,
        APP_RELEASE_META.versionCode,
        APP_RELEASE_META.minAndroid,
        APP_RELEASE_META.fileSizeLabel,
        APP_RELEASE_META.apkDownloadUrl,
        APP_RELEASE_META.heroTitle,
        APP_RELEASE_META.heroSubtitle,
        APP_RELEASE_META.licenseNote,
        APP_RELEASE_META.repoUrl,
        APP_RELEASE_META.announcementText,
      ],
    );

    // 3. Dynamic Capabilities
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS app_capabilities (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 1,
        index_label TEXT NOT NULL DEFAULT '01',
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
        accent_hex TEXT NOT NULL DEFAULT '#F0C97A',
        span_wide BOOLEAN NOT NULL DEFAULT FALSE,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    const capCountRes = await ddlPool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM app_capabilities`,
    );
    if (Number(capCountRes.rows[0]?.count ?? 0) === 0) {
      for (let i = 0; i < CORE_CAPABILITIES.length; i += 1) {
        const cap = CORE_CAPABILITIES[i];
        await ddlPool.query(
          `INSERT INTO app_capabilities (
            slug, sort_order, index_label, title, subtitle, description,
            highlights, accent_hex, span_wide, is_visible
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)`,
          [
            cap.id,
            i + 1,
            cap.index,
            cap.title,
            cap.subtitle,
            cap.description,
            JSON.stringify(cap.highlights),
            cap.accentHex,
            Boolean(cap.spanWide),
            true,
          ],
        );
      }
    }

    // 4. Dynamic Installation Steps
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS app_install_steps (
        id SERIAL PRIMARY KEY,
        step_order INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        tip TEXT NOT NULL DEFAULT ''
      )
    `);

    const installCountRes = await ddlPool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM app_install_steps`,
    );
    if (Number(installCountRes.rows[0]?.count ?? 0) === 0) {
      for (const step of DEFAULT_INSTALL_STEPS) {
        await ddlPool.query(
          `INSERT INTO app_install_steps (step_order, title, detail, tip)
           VALUES ($1, $2, $3, $4)`,
          [step.stepOrder, step.title, step.detail, step.tip],
        );
      }
    }

    // 5. Dynamic Changelog Entries
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS app_changelog (
        id SERIAL PRIMARY KEY,
        sort_order INTEGER NOT NULL DEFAULT 1,
        version TEXT NOT NULL,
        release_date TEXT NOT NULL,
        headline TEXT NOT NULL,
        changes JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);

    const changelogCountRes = await ddlPool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM app_changelog`,
    );
    if (Number(changelogCountRes.rows[0]?.count ?? 0) === 0) {
      for (let i = 0; i < CHANGELOG_ENTRIES.length; i += 1) {
        const entry = CHANGELOG_ENTRIES[i];
        await ddlPool.query(
          `INSERT INTO app_changelog (sort_order, version, release_date, headline, changes)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [
            i + 1,
            entry.version,
            entry.date,
            entry.headline,
            JSON.stringify(entry.changes),
          ],
        );
      }
    }

    // 6. Opinions (migrating existing reviews table safely without breaking existing rows)
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        reviewer_name TEXT NOT NULL,
        rating SMALLINT,
        comment TEXT NOT NULL,
        app_version TEXT NOT NULL DEFAULT '2.7',
        helpful_count INTEGER NOT NULL DEFAULT 0,
        user_role TEXT NOT NULL DEFAULT '',
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        user_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ddlPool.query(
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT ''`,
    );
    await ddlPool.query(
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE`,
    );
    await ddlPool.query(
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    );
    await ddlPool.query(
      `ALTER TABLE reviews ALTER COLUMN rating DROP NOT NULL`,
    );
    await ddlPool.query(
      `ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check`,
    );
    await ddlPool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_helpful_created
        ON reviews (helpful_count DESC, created_at DESC)
    `);

    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS review_helpful_votes (
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        voter_token TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (review_id, voter_token)
      )
    `);

    // 7. Non-destructive upgrade of untouched legacy seed copy to refined Egyptian Arabic
    await ddlPool.query(
      `UPDATE app_settings
       SET arabic_name = $1,
           hero_title = $2,
           hero_subtitle = $3,
           license_note = $4
       WHERE id = 1
         AND hero_title = 'منظومة النجيب للدراسة والتركيز والسبورة الذكية'`,
      [
        APP_RELEASE_META.arabicName,
        APP_RELEASE_META.heroTitle,
        APP_RELEASE_META.heroSubtitle,
        APP_RELEASE_META.licenseNote,
      ],
    );

    const legacyCapTitles: Record<string, string> = {
      'focus-os': 'مؤقت التطبيقات ودرع التشتيت الصارم',
      library: 'المكتبة الدراسية الهرمية غير المحدودة',
      'weekly-planner': 'مخطط الأداء والبطولة الأسبوعي',
      whiteboard: 'السبورة الذكية متعددة الطبقات والهندسة',
      'offline-backup': 'خصوصية 100% ونسخ احتياطي محلي مضغوط',
      analytics: 'التحليلات وسجل جلسات التركيز',
    };
    for (const cap of CORE_CAPABILITIES) {
      const legacyTitle = legacyCapTitles[cap.id];
      if (!legacyTitle) continue;
      await ddlPool.query(
        `UPDATE app_capabilities
         SET title = $1, subtitle = $2, description = $3, highlights = $4::jsonb
         WHERE slug = $5 AND title = $6`,
        [
          cap.title,
          cap.subtitle,
          cap.description,
          JSON.stringify(cap.highlights),
          cap.id,
          legacyTitle,
        ],
      );
    }

    const legacyStepTitles: Record<number, string> = {
      1: 'تنزيل ملف APK الرسمي',
      2: 'السماح بالتثبيت من المتصفح',
      3: 'تفعيل أذونات التركيز الاختيارية',
      4: 'الترقية الآمنة وحفظ بياناتك',
    };
    for (const step of DEFAULT_INSTALL_STEPS) {
      const legacyTitle = legacyStepTitles[step.stepOrder];
      if (!legacyTitle) continue;
      await ddlPool.query(
        `UPDATE app_install_steps
         SET title = $1, detail = $2, tip = $3
         WHERE step_order = $4 AND title = $5`,
        [step.title, step.detail, step.tip, step.stepOrder, legacyTitle],
      );
    }

    const legacyChangelogHeadlines: Record<string, string> = {
      'v2.7': 'تطوير شامل لنظام الحماية، السبورة الهندسية، ومخطط البطولة الأسبوعي',
      'v2.4': 'نظام التصميم Academic Velvet OS ودعم 48 باليت لوني',
    };
    for (const entry of CHANGELOG_ENTRIES) {
      const legacyHeadline = legacyChangelogHeadlines[entry.version];
      if (!legacyHeadline) continue;
      await ddlPool.query(
        `UPDATE app_changelog
         SET release_date = $1, headline = $2, changes = $3::jsonb
         WHERE version = $4 AND headline = $5`,
        [
          entry.date,
          entry.headline,
          JSON.stringify(entry.changes),
          entry.version,
          legacyHeadline,
        ],
      );
    }

    // 8. Optional Env Bootstrap Admin (if both ADMIN_EMAIL and ADMIN_PASSWORD are provided)
    const envAdminEmail = process.env.ADMIN_EMAIL?.trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (envAdminEmail && envAdminPassword) {
      const normalized = normalizeEmail(envAdminEmail);
      const existingAdmin = await ddlPool.query<{ id: number }>(
        `SELECT id FROM app_users WHERE email = $1 LIMIT 1`,
        [normalized],
      );
      if (existingAdmin.rows.length === 0) {
        await ddlPool.query(
          `INSERT INTO app_users (email, full_name, password_hash, role)
           VALUES ($1, $2, $3, 'admin')`,
          [normalized, 'محمود نجيب', hashPassword(envAdminPassword)],
        );
      }
    }

    // 9. Web Push VAPID Keys, Subscribers & Broadcast Notifications
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS push_vapid_keys (
        id INTEGER PRIMARY KEY,
        public_key TEXT NOT NULL,
        private_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS push_subscribers (
        id SERIAL PRIMARY KEY,
        subscriber_token TEXT UNIQUE NOT NULL,
        endpoint TEXT,
        p256dh TEXT,
        auth TEXT,
        user_agent TEXT NOT NULL DEFAULT '',
        notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS broadcast_notifications (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        target_url TEXT NOT NULL DEFAULT '/',
        sent_by_admin_id INTEGER,
        recipient_count INTEGER NOT NULL DEFAULT 0,
        push_sent_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 10. Site Visitors & APK Download Analytics
    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS site_visitors (
        visitor_token TEXT PRIMARY KEY,
        first_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        visit_count INTEGER NOT NULL DEFAULT 1,
        last_path TEXT NOT NULL DEFAULT '/'
      )
    `);

    await ddlPool.query(`
      CREATE INDEX IF NOT EXISTS idx_site_visitors_last_visit
        ON site_visitors (last_visit_at DESC)
    `);

    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS download_events (
        id SERIAL PRIMARY KEY,
        version TEXT NOT NULL DEFAULT '',
        target_url TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ddlPool.query(`
      CREATE INDEX IF NOT EXISTS idx_download_events_created
        ON download_events (created_at DESC)
    `);

    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS site_daily_visits (
        visit_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
        visitor_token TEXT NOT NULL,
        hits INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (visit_date, visitor_token)
      )
    `);

    await ddlPool.query(`
      CREATE INDEX IF NOT EXISTS idx_site_daily_visits_date
        ON site_daily_visits (visit_date DESC)
    `);

    await ddlPool.query(`
      CREATE TABLE IF NOT EXISTS site_path_stats (
        path TEXT PRIMARY KEY,
        hits INTEGER NOT NULL DEFAULT 1,
        last_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    globalForPg.__alNageebSchemaReady = true;
  } finally {
    if (isSeparateDirectPool) {
      await ddlPool.end().catch(() => {});
    }
  }
}

export async function initDb(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  if (globalForPg.__alNageebSchemaReady) return;
  if (!globalForPg.__alNageebInitPromise) {
    globalForPg.__alNageebInitPromise = runSchemaInitialization().catch((err) => {
      globalForPg.__alNageebInitPromise = undefined;
      throw err;
    });
  }
  await globalForPg.__alNageebInitPromise;
}

export interface PublicSiteSnapshot {
  dbConnected: boolean;
  settings: AppReleaseMeta;
  capabilities: AppCapability[];
  installSteps: InstallStep[];
  changelog: ChangelogEntry[];
  opinions: OpinionItem[];
}

function mapSettingsRow(row?: {
  app_name: string;
  arabic_name: string;
  package_name: string;
  version: string;
  version_code: number;
  min_android: string;
  file_size_label: string;
  apk_download_url: string;
  hero_title: string;
  hero_subtitle: string;
  license_note: string;
  repo_url: string;
  announcement_text: string;
}): AppReleaseMeta {
  if (!row) return APP_RELEASE_META;
  return {
    name: row.app_name,
    arabicName: row.arabic_name,
    packageName: row.package_name,
    version: row.version,
    versionCode: Number(row.version_code),
    minAndroid: row.min_android,
    minSdk: APP_RELEASE_META.minSdk,
    targetSdk: APP_RELEASE_META.targetSdk,
    fileSizeLabel: row.file_size_label,
    apkDownloadUrl: row.apk_download_url,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    licenseNote: row.license_note,
    repoUrl: row.repo_url,
    announcementText: row.announcement_text || '',
  };
}

export async function getPublicSettings(): Promise<AppReleaseMeta> {
  if (!isDatabaseConfigured()) return APP_RELEASE_META;
  try {
    await initDb();
    const pool = getPool();
    const res = await pool.query<{
      app_name: string;
      arabic_name: string;
      package_name: string;
      version: string;
      version_code: number;
      min_android: string;
      file_size_label: string;
      apk_download_url: string;
      hero_title: string;
      hero_subtitle: string;
      license_note: string;
      repo_url: string;
      announcement_text: string;
    }>(
      `SELECT app_name, arabic_name, package_name, version, version_code,
              min_android, file_size_label, apk_download_url, hero_title,
              hero_subtitle, license_note, repo_url, announcement_text
       FROM app_settings
       WHERE id = 1
       LIMIT 1`,
    );
    return mapSettingsRow(res.rows[0]);
  } catch {
    return APP_RELEASE_META;
  }
}

export async function getPublicSiteSnapshot(options?: {
  voterToken?: string | null;
  sortBy?: OpinionSortOption;
  includeHiddenCapabilities?: boolean;
}): Promise<PublicSiteSnapshot> {
  if (!isDatabaseConfigured()) {
    return {
      dbConnected: false,
      settings: APP_RELEASE_META,
      capabilities: CORE_CAPABILITIES,
      installSteps: DEFAULT_INSTALL_STEPS,
      changelog: CHANGELOG_ENTRIES,
      opinions: [],
    };
  }

  try {
    await initDb();
    const pool = getPool();
    const voterToken = options?.voterToken?.trim() || '';

    const settingsRes = await pool.query<{
      app_name: string;
      arabic_name: string;
      package_name: string;
      version: string;
      version_code: number;
      min_android: string;
      file_size_label: string;
      apk_download_url: string;
      hero_title: string;
      hero_subtitle: string;
      license_note: string;
      repo_url: string;
      announcement_text: string;
    }>(
      `SELECT app_name, arabic_name, package_name, version, version_code,
              min_android, file_size_label, apk_download_url, hero_title,
              hero_subtitle, license_note, repo_url, announcement_text
       FROM app_settings
       WHERE id = 1
       LIMIT 1`,
    );

    const capQuery = options?.includeHiddenCapabilities
      ? `SELECT id, slug, sort_order, index_label, title, subtitle, description,
                highlights, accent_hex, span_wide, is_visible
         FROM app_capabilities
         ORDER BY sort_order ASC, id ASC`
      : `SELECT id, slug, sort_order, index_label, title, subtitle, description,
                highlights, accent_hex, span_wide, is_visible
         FROM app_capabilities
         WHERE is_visible = TRUE
         ORDER BY sort_order ASC, id ASC`;

    const capRes = await pool.query<{
      id: number;
      slug: string;
      sort_order: number;
      index_label: string;
      title: string;
      subtitle: string;
      description: string;
      highlights: string[];
      accent_hex: string;
      span_wide: boolean;
      is_visible: boolean;
    }>(capQuery);

    const installRes = await pool.query<{
      id: number;
      step_order: number;
      title: string;
      detail: string;
      tip: string;
    }>(
      `SELECT id, step_order, title, detail, tip
       FROM app_install_steps
       ORDER BY step_order ASC, id ASC`,
    );

    const changelogRes = await pool.query<{
      id: number;
      sort_order: number;
      version: string;
      release_date: string;
      headline: string;
      changes: string[];
    }>(
      `SELECT id, sort_order, version, release_date, headline, changes
       FROM app_changelog
       ORDER BY sort_order ASC, id DESC`,
    );

    const opinionsRes = await pool.query<{
      id: number;
      reviewer_name: string;
      user_role: string;
      comment: string;
      app_version: string;
      helpful_count: number;
      is_featured: boolean;
      created_at: Date;
      has_voted: boolean;
    }>(
      `SELECT
         r.id,
         r.reviewer_name,
         r.user_role,
         r.comment,
         r.app_version,
         r.helpful_count,
         r.is_featured,
         r.created_at,
         CASE WHEN v.review_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_voted
       FROM reviews r
       LEFT JOIN review_helpful_votes v
         ON v.review_id = r.id AND v.voter_token = $1
       ORDER BY r.is_featured DESC, r.created_at DESC
       LIMIT 100`,
      [voterToken],
    );

    const settings = mapSettingsRow(settingsRes.rows[0]);

    const capabilities: AppCapability[] = capRes.rows.map((row, idx) => ({
      id: row.slug || `cap-${row.id}`,
      dbId: row.id,
      sortOrder: Number(row.sort_order),
      index: row.index_label || String(idx + 1).padStart(2, '0'),
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      highlights: Array.isArray(row.highlights) ? row.highlights : [],
      accentHex: row.accent_hex || '#F0C97A',
      spanWide: Boolean(row.span_wide),
      isVisible: Boolean(row.is_visible),
    }));

    const installSteps: InstallStep[] = installRes.rows.map((row) => ({
      id: row.id,
      stepOrder: Number(row.step_order),
      title: row.title,
      detail: row.detail,
      tip: row.tip,
    }));

    const changelog: ChangelogEntry[] = changelogRes.rows.map((row) => ({
      id: row.id,
      sortOrder: Number(row.sort_order),
      version: row.version,
      date: row.release_date,
      headline: row.headline,
      changes: Array.isArray(row.changes) ? row.changes : [],
    }));

    const mappedOpinions: OpinionItem[] = opinionsRes.rows.map((row) => ({
      id: row.id,
      authorName: row.reviewer_name,
      authorRole: row.user_role || '',
      comment: row.comment,
      appVersion: row.app_version,
      helpfulCount: Number(row.helpful_count),
      isFeatured: Boolean(row.is_featured),
      createdAt: new Date(row.created_at).toISOString(),
      hasVoted: Boolean(row.has_voted),
    }));

    return {
      dbConnected: true,
      settings,
      capabilities,
      installSteps,
      changelog,
      opinions: filterAndSortOpinions(
        mappedOpinions,
        '',
        options?.sortBy ?? 'newest',
      ),
    };
  } catch (err) {
    console.error(
      'Database query error:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return {
      dbConnected: false,
      settings: APP_RELEASE_META,
      capabilities: CORE_CAPABILITIES,
      installSteps: DEFAULT_INSTALL_STEPS,
      changelog: CHANGELOG_ENTRIES,
      opinions: [],
    };
  }
}

export async function insertOpinionInDb(input: {
  authorName: string;
  authorRole: string;
  comment: string;
  userId?: number | null;
}): Promise<OpinionItem> {
  await initDb();
  const pool = getPool();
  const settings = await getPublicSettings();

  const res = await pool.query<{
    id: number;
    reviewer_name: string;
    user_role: string;
    comment: string;
    app_version: string;
    helpful_count: number;
    is_featured: boolean;
    created_at: Date;
  }>(
    `INSERT INTO reviews (reviewer_name, user_role, rating, comment, app_version, user_id)
     VALUES ($1, $2, NULL, $3, $4, $5)
     RETURNING id, reviewer_name, user_role, comment, app_version, helpful_count, is_featured, created_at`,
    [
      input.authorName,
      input.authorRole,
      input.comment,
      settings.version,
      input.userId ?? null,
    ],
  );

  const row = res.rows[0];
  return {
    id: row.id,
    authorName: row.reviewer_name,
    authorRole: row.user_role || '',
    comment: row.comment,
    appVersion: row.app_version,
    helpfulCount: Number(row.helpful_count),
    isFeatured: Boolean(row.is_featured),
    createdAt: new Date(row.created_at).toISOString(),
    hasVoted: false,
  };
}

export async function toggleHelpfulVoteInDb(
  reviewId: number,
  voterToken: string,
): Promise<{ helpfulCount: number; hasVoted: boolean }> {
  await initDb();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query<{ review_id: number }>(
      `SELECT review_id
       FROM review_helpful_votes
       WHERE review_id = $1 AND voter_token = $2`,
      [reviewId, voterToken],
    );

    let hasVoted: boolean;
    let updatedCount = 0;

    if (existing.rows.length > 0) {
      await client.query(
        `DELETE FROM review_helpful_votes
         WHERE review_id = $1 AND voter_token = $2`,
        [reviewId, voterToken],
      );
      const dec = await client.query<{ helpful_count: number }>(
        `UPDATE reviews
         SET helpful_count = GREATEST(0, helpful_count - 1)
         WHERE id = $1
         RETURNING helpful_count`,
        [reviewId],
      );
      updatedCount = Number(dec.rows[0]?.helpful_count ?? 0);
      hasVoted = false;
    } else {
      await client.query(
        `INSERT INTO review_helpful_votes (review_id, voter_token)
         VALUES ($1, $2)`,
        [reviewId, voterToken],
      );
      const inc = await client.query<{ helpful_count: number }>(
        `UPDATE reviews
         SET helpful_count = helpful_count + 1
         WHERE id = $1
         RETURNING helpful_count`,
        [reviewId],
      );
      updatedCount = Number(inc.rows[0]?.helpful_count ?? 0);
      hasVoted = true;
    }

    await client.query('COMMIT');
    return { helpfulCount: updatedCount, hasVoted };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/* ==================== AUTH & USER MANAGEMENT ==================== */

export interface DbUserRecord {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
}

export async function hasAnyAdminInDb(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  await initDb();
  const pool = getPool();
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app_users WHERE role = 'admin'`,
  );
  return Number(res.rows[0]?.count ?? 0) > 0;
}

export async function findUserByEmailWithHash(email: string): Promise<
  | (DbUserRecord & {
      passwordHash: string;
    })
  | null
> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    email: string;
    full_name: string;
    password_hash: string;
    role: string;
    created_at: Date;
    last_login_at: Date | null;
  }>(
    `SELECT id, email, full_name, password_hash, role, created_at, last_login_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [normalizeEmail(email)],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  };
}

export async function findUserById(id: number): Promise<DbUserRecord | null> {
  if (!isDatabaseConfigured()) return null;
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at: Date;
    last_login_at: Date | null;
  }>(
    `SELECT id, email, full_name, role, created_at, last_login_at
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  };
}

export async function createUserInDb(input: {
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
}): Promise<DbUserRecord> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at: Date;
    last_login_at: Date | null;
  }>(
    `INSERT INTO app_users (email, full_name, password_hash, role, last_login_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, email, full_name, role, created_at, last_login_at`,
    [normalizeEmail(input.email), input.fullName, input.passwordHash, input.role],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  };
}

export async function touchUserLogin(userId: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`UPDATE app_users SET last_login_at = NOW() WHERE id = $1`, [
    userId,
  ]);
}

export async function listUsersInDb(): Promise<DbUserRecord[]> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at: Date;
    last_login_at: Date | null;
  }>(
    `SELECT id, email, full_name, role, created_at, last_login_at
     FROM app_users
     ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at DESC`,
  );
  return res.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  }));
}

export async function updateUserRoleInDb(
  userId: number,
  role: UserRole,
): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`UPDATE app_users SET role = $1 WHERE id = $2`, [role, userId]);
}

export async function deleteUserInDb(userId: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM app_users WHERE id = $1`, [userId]);
}

export async function updateUserCredentialsInDb(
  userId: number,
  updates: {
    fullName: string;
    email: string;
    passwordHash?: string;
  },
): Promise<DbUserRecord> {
  await initDb();
  const pool = getPool();
  if (updates.passwordHash) {
    const res = await pool.query<{
      id: number;
      email: string;
      full_name: string;
      role: string;
      created_at: Date;
      last_login_at: Date | null;
    }>(
      `UPDATE app_users
       SET full_name = $1, email = $2, password_hash = $3
       WHERE id = $4
       RETURNING id, email, full_name, role, created_at, last_login_at`,
      [updates.fullName, normalizeEmail(updates.email), updates.passwordHash, userId],
    );
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role === 'admin' ? 'admin' : 'user',
      createdAt: new Date(row.created_at).toISOString(),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    };
  }

  const res = await pool.query<{
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at: Date;
    last_login_at: Date | null;
  }>(
    `UPDATE app_users
     SET full_name = $1, email = $2
     WHERE id = $3
     RETURNING id, email, full_name, role, created_at, last_login_at`,
    [updates.fullName, normalizeEmail(updates.email), userId],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  };
}

/* ==================== ADMIN CMS MUTATIONS ==================== */

export async function updateReleaseSettingsInDb(
  input: ReleaseSettingsInput,
): Promise<AppReleaseMeta> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    app_name: string;
    arabic_name: string;
    package_name: string;
    version: string;
    version_code: number;
    min_android: string;
    file_size_label: string;
    apk_download_url: string;
    hero_title: string;
    hero_subtitle: string;
    license_note: string;
    repo_url: string;
    announcement_text: string;
  }>(
    `UPDATE app_settings
     SET version = $1,
         version_code = $2,
         file_size_label = $3,
         min_android = $4,
         package_name = $5,
         apk_download_url = $6,
         hero_title = $7,
         hero_subtitle = $8,
         license_note = $9,
         repo_url = $10,
         announcement_text = $11,
         updated_at = NOW()
     WHERE id = 1
     RETURNING app_name, arabic_name, package_name, version, version_code,
               min_android, file_size_label, apk_download_url, hero_title,
               hero_subtitle, license_note, repo_url, announcement_text`,
    [
      input.version,
      input.versionCode,
      input.fileSizeLabel,
      input.minAndroid,
      input.packageName,
      input.apkDownloadUrl,
      input.heroTitle,
      input.heroSubtitle,
      input.licenseNote,
      input.repoUrl,
      input.announcementText ?? '',
    ],
  );
  return mapSettingsRow(res.rows[0]);
}

export async function upsertCapabilityInDb(input: {
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
}): Promise<AppCapability> {
  await initDb();
  const pool = getPool();

  if (input.dbId && input.dbId > 0) {
    const res = await pool.query<{
      id: number;
      slug: string;
      sort_order: number;
      index_label: string;
      title: string;
      subtitle: string;
      description: string;
      highlights: string[];
      accent_hex: string;
      span_wide: boolean;
      is_visible: boolean;
    }>(
      `UPDATE app_capabilities
       SET sort_order = $1,
           index_label = $2,
           title = $3,
           subtitle = $4,
           description = $5,
           highlights = $6::jsonb,
           accent_hex = $7,
           span_wide = $8,
           is_visible = $9
       WHERE id = $10
       RETURNING id, slug, sort_order, index_label, title, subtitle, description,
                 highlights, accent_hex, span_wide, is_visible`,
      [
        input.sortOrder,
        input.indexLabel,
        input.title,
        input.subtitle,
        input.description,
        JSON.stringify(input.highlights),
        input.accentHex,
        input.spanWide,
        input.isVisible,
        input.dbId,
      ],
    );
    const row = res.rows[0];
    return {
      id: row.slug,
      dbId: row.id,
      sortOrder: Number(row.sort_order),
      index: row.index_label,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      highlights: Array.isArray(row.highlights) ? row.highlights : [],
      accentHex: row.accent_hex,
      spanWide: Boolean(row.span_wide),
      isVisible: Boolean(row.is_visible),
    };
  }

  const slug = `cap-${Date.now()}`;
  const res = await pool.query<{
    id: number;
    slug: string;
    sort_order: number;
    index_label: string;
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
    accent_hex: string;
    span_wide: boolean;
    is_visible: boolean;
  }>(
    `INSERT INTO app_capabilities (
      slug, sort_order, index_label, title, subtitle, description,
      highlights, accent_hex, span_wide, is_visible
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
    RETURNING id, slug, sort_order, index_label, title, subtitle, description,
              highlights, accent_hex, span_wide, is_visible`,
    [
      slug,
      input.sortOrder,
      input.indexLabel,
      input.title,
      input.subtitle,
      input.description,
      JSON.stringify(input.highlights),
      input.accentHex,
      input.spanWide,
      input.isVisible,
    ],
  );
  const row = res.rows[0];
  return {
    id: row.slug,
    dbId: row.id,
    sortOrder: Number(row.sort_order),
    index: row.index_label,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    accentHex: row.accent_hex,
    spanWide: Boolean(row.span_wide),
    isVisible: Boolean(row.is_visible),
  };
}

export async function deleteCapabilityInDb(dbId: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM app_capabilities WHERE id = $1`, [dbId]);
}

export async function upsertInstallStepInDb(input: {
  id?: number;
  stepOrder: number;
  title: string;
  detail: string;
  tip: string;
}): Promise<InstallStep> {
  await initDb();
  const pool = getPool();

  if (input.id && input.id > 0) {
    const res = await pool.query<{
      id: number;
      step_order: number;
      title: string;
      detail: string;
      tip: string;
    }>(
      `UPDATE app_install_steps
       SET step_order = $1, title = $2, detail = $3, tip = $4
       WHERE id = $5
       RETURNING id, step_order, title, detail, tip`,
      [input.stepOrder, input.title, input.detail, input.tip, input.id],
    );
    const row = res.rows[0];
    return {
      id: row.id,
      stepOrder: Number(row.step_order),
      title: row.title,
      detail: row.detail,
      tip: row.tip,
    };
  }

  const res = await pool.query<{
    id: number;
    step_order: number;
    title: string;
    detail: string;
    tip: string;
  }>(
    `INSERT INTO app_install_steps (step_order, title, detail, tip)
     VALUES ($1, $2, $3, $4)
     RETURNING id, step_order, title, detail, tip`,
    [input.stepOrder, input.title, input.detail, input.tip],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    stepOrder: Number(row.step_order),
    title: row.title,
    detail: row.detail,
    tip: row.tip,
  };
}

export async function deleteInstallStepInDb(id: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM app_install_steps WHERE id = $1`, [id]);
}

export async function upsertChangelogInDb(input: {
  id?: number;
  sortOrder: number;
  version: string;
  date: string;
  headline: string;
  changes: string[];
}): Promise<ChangelogEntry> {
  await initDb();
  const pool = getPool();

  if (input.id && input.id > 0) {
    const res = await pool.query<{
      id: number;
      sort_order: number;
      version: string;
      release_date: string;
      headline: string;
      changes: string[];
    }>(
      `UPDATE app_changelog
       SET sort_order = $1, version = $2, release_date = $3, headline = $4, changes = $5::jsonb
       WHERE id = $6
       RETURNING id, sort_order, version, release_date, headline, changes`,
      [
        input.sortOrder,
        input.version,
        input.date,
        input.headline,
        JSON.stringify(input.changes),
        input.id,
      ],
    );
    const row = res.rows[0];
    return {
      id: row.id,
      sortOrder: Number(row.sort_order),
      version: row.version,
      date: row.release_date,
      headline: row.headline,
      changes: Array.isArray(row.changes) ? row.changes : [],
    };
  }

  const res = await pool.query<{
    id: number;
    sort_order: number;
    version: string;
    release_date: string;
    headline: string;
    changes: string[];
  }>(
    `INSERT INTO app_changelog (sort_order, version, release_date, headline, changes)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, sort_order, version, release_date, headline, changes`,
    [
      input.sortOrder,
      input.version,
      input.date,
      input.headline,
      JSON.stringify(input.changes),
    ],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    sortOrder: Number(row.sort_order),
    version: row.version,
    date: row.release_date,
    headline: row.headline,
    changes: Array.isArray(row.changes) ? row.changes : [],
  };
}

export async function deleteChangelogInDb(id: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM app_changelog WHERE id = $1`, [id]);
}

export async function toggleOpinionFeaturedInDb(
  id: number,
): Promise<boolean> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{ is_featured: boolean }>(
    `UPDATE reviews
     SET is_featured = NOT is_featured
     WHERE id = $1
     RETURNING is_featured`,
    [id],
  );
  return Boolean(res.rows[0]?.is_featured);
}

export async function upsertOpinionByAdminInDb(input: {
  id?: number;
  authorName: string;
  authorRole: string;
  comment: string;
  appVersion: string;
  helpfulCount: number;
  isFeatured: boolean;
}): Promise<OpinionItem> {
  await initDb();
  const pool = getPool();

  if (input.id && input.id > 0) {
    const res = await pool.query<{
      id: number;
      reviewer_name: string;
      user_role: string;
      comment: string;
      app_version: string;
      helpful_count: number;
      is_featured: boolean;
      created_at: Date;
    }>(
      `UPDATE reviews
       SET reviewer_name = $1,
           user_role = $2,
           comment = $3,
           app_version = $4,
           helpful_count = $5,
           is_featured = $6
       WHERE id = $7
       RETURNING id, reviewer_name, user_role, comment, app_version, helpful_count, is_featured, created_at`,
      [
        input.authorName,
        input.authorRole,
        input.comment,
        input.appVersion,
        Math.max(0, Math.floor(input.helpfulCount)),
        input.isFeatured,
        input.id,
      ],
    );
    const row = res.rows[0];
    return {
      id: row.id,
      authorName: row.reviewer_name,
      authorRole: row.user_role || '',
      comment: row.comment,
      appVersion: row.app_version,
      helpfulCount: Number(row.helpful_count),
      isFeatured: Boolean(row.is_featured),
      createdAt: new Date(row.created_at).toISOString(),
      hasVoted: false,
    };
  }

  const res = await pool.query<{
    id: number;
    reviewer_name: string;
    user_role: string;
    comment: string;
    app_version: string;
    helpful_count: number;
    is_featured: boolean;
    created_at: Date;
  }>(
    `INSERT INTO reviews (reviewer_name, user_role, rating, comment, app_version, helpful_count, is_featured)
     VALUES ($1, $2, NULL, $3, $4, $5, $6)
     RETURNING id, reviewer_name, user_role, comment, app_version, helpful_count, is_featured, created_at`,
    [
      input.authorName,
      input.authorRole,
      input.comment,
      input.appVersion,
      Math.max(0, Math.floor(input.helpfulCount)),
      input.isFeatured,
    ],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    authorName: row.reviewer_name,
    authorRole: row.user_role || '',
    comment: row.comment,
    appVersion: row.app_version,
    helpfulCount: Number(row.helpful_count),
    isFeatured: Boolean(row.is_featured),
    createdAt: new Date(row.created_at).toISOString(),
    hasVoted: false,
  };
}

export async function deleteOpinionInDb(id: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM reviews WHERE id = $1`, [id]);
}

export async function deleteAllOpinionsInDb(): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM reviews`);
}

/* ==================== WEB PUSH & BROADCAST NOTIFICATIONS ==================== */

export interface PushSubscriberStats {
  enabledCount: number;
  webPushDeviceCount: number;
}

export interface EnabledPushSubscriberRecord {
  id: number;
  subscriberToken: string;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
}

export async function getOrCreateVapidKeysInDb(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const envPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPublic && envPrivate) {
    return { publicKey: envPublic, privateKey: envPrivate };
  }

  try {
    await initDb();
    const pool = getPool();
    const existing = await pool.query<{ public_key: string; private_key: string }>(
      `SELECT public_key, private_key FROM push_vapid_keys WHERE id = 1 LIMIT 1`,
    );
    if (existing.rows[0]?.public_key && existing.rows[0]?.private_key) {
      return {
        publicKey: existing.rows[0].public_key,
        privateKey: existing.rows[0].private_key,
      };
    }

    const generated = generateVAPIDKeys();
    await pool.query(
      `INSERT INTO push_vapid_keys (id, public_key, private_key)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [generated.publicKey, generated.privateKey],
    );

    const finalRes = await pool.query<{ public_key: string; private_key: string }>(
      `SELECT public_key, private_key FROM push_vapid_keys WHERE id = 1 LIMIT 1`,
    );
    return {
      publicKey: finalRes.rows[0]?.public_key || generated.publicKey,
      privateKey: finalRes.rows[0]?.private_key || generated.privateKey,
    };
  } catch {
    const generated = generateVAPIDKeys();
    return {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
    };
  }
}

export async function upsertPushSubscriberInDb(input: {
  subscriberToken: string;
  endpoint?: string | null;
  p256dh?: string | null;
  auth?: string | null;
  userAgent?: string;
}): Promise<PushSubscriberStats> {
  await initDb();
  const pool = getPool();
  await pool.query(
    `INSERT INTO push_subscribers (
       subscriber_token, endpoint, p256dh, auth, user_agent, notifications_enabled, last_seen_at
     )
     VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
     ON CONFLICT (subscriber_token)
     DO UPDATE SET
       endpoint = COALESCE(EXCLUDED.endpoint, push_subscribers.endpoint),
       p256dh = COALESCE(EXCLUDED.p256dh, push_subscribers.p256dh),
       auth = COALESCE(EXCLUDED.auth, push_subscribers.auth),
       user_agent = CASE WHEN EXCLUDED.user_agent <> '' THEN EXCLUDED.user_agent ELSE push_subscribers.user_agent END,
       notifications_enabled = TRUE,
       last_seen_at = NOW()`,
    [
      input.subscriberToken,
      input.endpoint ?? null,
      input.p256dh ?? null,
      input.auth ?? null,
      (input.userAgent || '').slice(0, 240),
    ],
  );

  return getPushSubscriberStatsInDb();
}

export async function disablePushSubscriberInDb(subscriberToken: string): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(
    `UPDATE push_subscribers
     SET notifications_enabled = FALSE,
         endpoint = NULL,
         p256dh = NULL,
         auth = NULL,
         last_seen_at = NOW()
     WHERE subscriber_token = $1`,
    [subscriberToken],
  );
}

export async function isSubscriberEnabledInDb(subscriberToken: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  await initDb();
  const pool = getPool();
  const res = await pool.query<{ notifications_enabled: boolean }>(
    `SELECT notifications_enabled
     FROM push_subscribers
     WHERE subscriber_token = $1
     LIMIT 1`,
    [subscriberToken],
  );
  return Boolean(res.rows[0]?.notifications_enabled);
}

export async function getPushSubscriberStatsInDb(): Promise<PushSubscriberStats> {
  if (!isDatabaseConfigured()) {
    return { enabledCount: 0, webPushDeviceCount: 0 };
  }
  await initDb();
  const pool = getPool();
  const res = await pool.query<{ enabled_count: string; push_count: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE notifications_enabled = TRUE)::text AS enabled_count,
       COUNT(*) FILTER (
         WHERE notifications_enabled = TRUE
           AND endpoint IS NOT NULL
           AND p256dh IS NOT NULL
           AND auth IS NOT NULL
       )::text AS push_count
     FROM push_subscribers`,
  );
  return {
    enabledCount: Number(res.rows[0]?.enabled_count ?? 0),
    webPushDeviceCount: Number(res.rows[0]?.push_count ?? 0),
  };
}

export async function listEnabledPushSubscribersInDb(): Promise<EnabledPushSubscriberRecord[]> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    subscriber_token: string;
    endpoint: string | null;
    p256dh: string | null;
    auth: string | null;
  }>(
    `SELECT id, subscriber_token, endpoint, p256dh, auth
     FROM push_subscribers
     WHERE notifications_enabled = TRUE
     ORDER BY id ASC`,
  );
  return res.rows.map((row) => ({
    id: row.id,
    subscriberToken: row.subscriber_token,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
  }));
}

export async function clearInvalidPushEndpointsInDb(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return;
  await initDb();
  const pool = getPool();
  await pool.query(
    `UPDATE push_subscribers
     SET endpoint = NULL, p256dh = NULL, auth = NULL
     WHERE endpoint = ANY($1::text[])`,
    [endpoints],
  );
}

export async function createBroadcastNotificationInDb(input: {
  title: string;
  body: string;
  targetUrl: string;
  sentByAdminId: number;
  recipientCount: number;
  pushSentCount: number;
}): Promise<BroadcastNotificationItem> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    title: string;
    body: string;
    target_url: string;
    recipient_count: number;
    push_sent_count: number;
    created_at: Date;
  }>(
    `INSERT INTO broadcast_notifications (
       title, body, target_url, sent_by_admin_id, recipient_count, push_sent_count
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, body, target_url, recipient_count, push_sent_count, created_at`,
    [
      input.title,
      input.body,
      input.targetUrl,
      input.sentByAdminId,
      input.recipientCount,
      input.pushSentCount,
    ],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    targetUrl: row.target_url,
    recipientCount: Number(row.recipient_count),
    pushSentCount: Number(row.push_sent_count),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function updateBroadcastCountsInDb(
  id: number,
  recipientCount: number,
  pushSentCount: number,
): Promise<BroadcastNotificationItem> {
  await initDb();
  const pool = getPool();
  const res = await pool.query<{
    id: number;
    title: string;
    body: string;
    target_url: string;
    recipient_count: number;
    push_sent_count: number;
    created_at: Date;
  }>(
    `UPDATE broadcast_notifications
     SET recipient_count = $1, push_sent_count = $2
     WHERE id = $3
     RETURNING id, title, body, target_url, recipient_count, push_sent_count, created_at`,
    [recipientCount, pushSentCount, id],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    targetUrl: row.target_url,
    recipientCount: Number(row.recipient_count),
    pushSentCount: Number(row.push_sent_count),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listBroadcastNotificationsInDb(
  limit = 30,
): Promise<BroadcastNotificationItem[]> {
  if (!isDatabaseConfigured()) return [];
  await initDb();
  const pool = getPool();
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const res = await pool.query<{
    id: number;
    title: string;
    body: string;
    target_url: string;
    recipient_count: number;
    push_sent_count: number;
    created_at: Date;
  }>(
    `SELECT id, title, body, target_url, recipient_count, push_sent_count, created_at
     FROM broadcast_notifications
     ORDER BY id DESC
     LIMIT $1`,
    [safeLimit],
  );
  return res.rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    targetUrl: row.target_url,
    recipientCount: Number(row.recipient_count),
    pushSentCount: Number(row.push_sent_count),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function deleteBroadcastNotificationInDb(id: number): Promise<void> {
  await initDb();
  const pool = getPool();
  await pool.query(`DELETE FROM broadcast_notifications WHERE id = $1`, [id]);
}

/* ==================== SITE VISITORS & DOWNLOAD ANALYTICS ==================== */

export async function recordSiteVisitInDb(
  visitorToken: string,
  path: string,
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await initDb();
  const pool = getPool();
  const cleanPath = path.slice(0, 160) || '/';
  await Promise.all([
    pool.query(
      `INSERT INTO site_visitors (visitor_token, last_path, visit_count, first_visit_at, last_visit_at)
       VALUES ($1, $2, 1, NOW(), NOW())
       ON CONFLICT (visitor_token)
       DO UPDATE SET
         visit_count = site_visitors.visit_count + 1,
         last_path = EXCLUDED.last_path,
         last_visit_at = NOW()`,
      [visitorToken, cleanPath],
    ),
    pool.query(
      `INSERT INTO site_daily_visits (visit_date, visitor_token, hits)
       VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, $1, 1)
       ON CONFLICT (visit_date, visitor_token)
       DO UPDATE SET hits = site_daily_visits.hits + 1`,
      [visitorToken],
    ),
    pool.query(
      `INSERT INTO site_path_stats (path, hits, last_visit_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (path)
       DO UPDATE SET
         hits = site_path_stats.hits + 1,
         last_visit_at = NOW()`,
      [cleanPath],
    ),
  ]);
}

export async function recordDownloadEventInDb(input: {
  version: string;
  targetUrl: string;
  userAgent?: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await initDb();
  const pool = getPool();
  await pool.query(
    `INSERT INTO download_events (version, target_url, user_agent)
     VALUES ($1, $2, $3)`,
    [
      input.version.slice(0, 40),
      input.targetUrl.slice(0, 500),
      (input.userAgent || '').slice(0, 240),
    ],
  );
}

export async function getSiteTrafficStatsInDb(
  daysParam?: unknown,
): Promise<SiteTrafficStats> {
  const rangeDays: TrafficRangeDays = normalizeRangeDays(daysParam);
  const emptyFallback: SiteTrafficStats = {
    ...EMPTY_SITE_TRAFFIC_STATS,
    rangeDays,
    series: buildDailyTrafficSeries({
      days: rangeDays,
      dailyVisitors: [],
      dailyDownloads: [],
    }),
  };

  if (!isDatabaseConfigured()) return emptyFallback;
  try {
    await initDb();
    const pool = getPool();
    const [
      visitorsRes,
      downloadsRes,
      dailyVisitorsRes,
      dailyDownloadsRes,
      topPagesRes,
    ] = await Promise.all([
      pool.query<{
        unique_visitors: string;
        total_visits: string;
        visitors_today: string;
      }>(`
        SELECT
          COUNT(*)::text AS unique_visitors,
          COALESCE(SUM(visit_count), 0)::text AS total_visits,
          COUNT(*) FILTER (
            WHERE last_visit_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
          )::text AS visitors_today
        FROM site_visitors
      `),
      pool.query<{
        total_downloads: string;
        downloads_today: string;
      }>(`
        SELECT
          COUNT(*)::text AS total_downloads,
          COUNT(*) FILTER (
            WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
          )::text AS downloads_today
        FROM download_events
      `),
      pool.query<{
        date_key: string;
        unique_visitors: string;
        total_visits: string;
      }>(
        `SELECT
           TO_CHAR(visit_date, 'YYYY-MM-DD') AS date_key,
           COUNT(*)::text AS unique_visitors,
           COALESCE(SUM(hits), 0)::text AS total_visits
         FROM site_daily_visits
         WHERE visit_date >= ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date - ($1::int - 1))
         GROUP BY visit_date
         ORDER BY visit_date ASC`,
        [rangeDays],
      ),
      pool.query<{
        date_key: string;
        downloads: string;
      }>(
        `SELECT
           TO_CHAR((created_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS date_key,
           COUNT(*)::text AS downloads
         FROM download_events
         WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' - (($1::int - 1) * INTERVAL '1 day')
         GROUP BY (created_at AT TIME ZONE 'UTC')::date
         ORDER BY 1 ASC`,
        [rangeDays],
      ),
      pool.query<{ path: string; hits: number }>(
        `SELECT path, hits
         FROM site_path_stats
         ORDER BY hits DESC, last_visit_at DESC
         LIMIT 6`,
      ),
    ]);

    const series = buildDailyTrafficSeries({
      days: rangeDays,
      dailyVisitors: dailyVisitorsRes.rows.map((r) => ({
        dateKey: r.date_key,
        uniqueVisitors: Number(r.unique_visitors),
        totalVisits: Number(r.total_visits),
      })),
      dailyDownloads: dailyDownloadsRes.rows.map((r) => ({
        dateKey: r.date_key,
        downloads: Number(r.downloads),
      })),
    });

    return {
      totalDownloads: Number(downloadsRes.rows[0]?.total_downloads ?? 0),
      downloadsToday: Number(downloadsRes.rows[0]?.downloads_today ?? 0),
      uniqueVisitors: Number(visitorsRes.rows[0]?.unique_visitors ?? 0),
      totalVisits: Number(visitorsRes.rows[0]?.total_visits ?? 0),
      visitorsToday: Number(visitorsRes.rows[0]?.visitors_today ?? 0),
      rangeDays,
      series,
      topPages: topPagesRes.rows.map((r) => ({
        path: r.path,
        label: formatPublicRouteLabel(r.path),
        hits: Number(r.hits),
      })),
    };
  } catch {
    return emptyFallback;
  }
}




