export type TrafficRangeDays = 7 | 14 | 30;

export interface DailyTrafficPoint {
  dateKey: string; // YYYY-MM-DD
  shortLabel: string; // e.g. "14/11"
  fullLabel: string; // e.g. "14 نوفمبر"
  uniqueVisitors: number;
  totalVisits: number;
  downloads: number;
}

export interface PageTrafficBreakdownItem {
  path: string;
  label: string;
  hits: number;
}

export interface SiteTrafficStats {
  totalDownloads: number;
  downloadsToday: number;
  uniqueVisitors: number;
  totalVisits: number;
  visitorsToday: number;
  rangeDays: TrafficRangeDays;
  series: DailyTrafficPoint[];
  topPages: PageTrafficBreakdownItem[];
}

export const EMPTY_SITE_TRAFFIC_STATS: SiteTrafficStats = {
  totalDownloads: 0,
  downloadsToday: 0,
  uniqueVisitors: 0,
  totalVisits: 0,
  visitorsToday: 0,
  rangeDays: 14,
  series: [],
  topPages: [],
};

const EXCLUDED_PATH_PREFIXES = ['/admin', '/api', '/_next'];

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const ROUTE_LABELS: Record<string, string> = {
  '/': 'الرئيسية',
  '/features': 'المميزات',
  '/install': 'طريقة التثبيت',
  '/opinions': 'آراء الطلاب',
  '/guide': 'الدليل الشامل',
  '/login': 'تسجيل الدخول',
};

export function formatPublicRouteLabel(path: string): string {
  return ROUTE_LABELS[path] || path;
}

export function normalizeRangeDays(value: unknown): TrafficRangeDays {
  const num = Number(value);
  if (num === 7) return 7;
  if (num === 30) return 30;
  return 14;
}

export function toUtcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDailyTrafficSeries(input: {
  days: TrafficRangeDays;
  referenceDate?: Date;
  dailyVisitors: Array<{
    dateKey: string;
    uniqueVisitors: number;
    totalVisits: number;
  }>;
  dailyDownloads: Array<{
    dateKey: string;
    downloads: number;
  }>;
}): DailyTrafficPoint[] {
  const ref = input.referenceDate ? new Date(input.referenceDate) : new Date();
  const visitorMap = new Map<
    string,
    { uniqueVisitors: number; totalVisits: number }
  >();
  for (const row of input.dailyVisitors) {
    visitorMap.set(row.dateKey, {
      uniqueVisitors: Math.max(0, Number(row.uniqueVisitors) || 0),
      totalVisits: Math.max(0, Number(row.totalVisits) || 0),
    });
  }

  const downloadMap = new Map<string, number>();
  for (const row of input.dailyDownloads) {
    downloadMap.set(row.dateKey, Math.max(0, Number(row.downloads) || 0));
  }

  const points: DailyTrafficPoint[] = [];
  for (let offset = input.days - 1; offset >= 0; offset -= 1) {
    const day = new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - offset),
    );
    const dateKey = toUtcDateKey(day);
    const dayNum = day.getUTCDate();
    const monthIndex = day.getUTCMonth();
    const v = visitorMap.get(dateKey);
    const dCount = downloadMap.get(dateKey) ?? 0;

    points.push({
      dateKey,
      shortLabel: `${dayNum}/${monthIndex + 1}`,
      fullLabel: `${dayNum} ${ARABIC_MONTHS[monthIndex] ?? ''}`.trim(),
      uniqueVisitors: v?.uniqueVisitors ?? 0,
      totalVisits: v?.totalVisits ?? 0,
      downloads: dCount,
    });
  }

  return points;
}

export interface TrafficSeriesSummary {
  periodDownloads: number;
  periodVisitors: number;
  periodVisits: number;
  avgDownloadsPerDay: number;
  avgVisitorsPerDay: number;
  conversionRatePercent: number;
  peakDownloadsDay: { label: string; value: number } | null;
  peakVisitorsDay: { label: string; value: number } | null;
}

export function summarizeTrafficSeries(
  series: DailyTrafficPoint[],
): TrafficSeriesSummary {
  if (series.length === 0) {
    return {
      periodDownloads: 0,
      periodVisitors: 0,
      periodVisits: 0,
      avgDownloadsPerDay: 0,
      avgVisitorsPerDay: 0,
      conversionRatePercent: 0,
      peakDownloadsDay: null,
      peakVisitorsDay: null,
    };
  }

  let periodDownloads = 0;
  let periodVisitors = 0;
  let periodVisits = 0;
  let peakDownloadsDay: { label: string; value: number } | null = null;
  let peakVisitorsDay: { label: string; value: number } | null = null;

  for (const pt of series) {
    periodDownloads += pt.downloads;
    periodVisitors += pt.uniqueVisitors;
    periodVisits += pt.totalVisits;

    if (!peakDownloadsDay || pt.downloads > peakDownloadsDay.value) {
      peakDownloadsDay = { label: pt.fullLabel, value: pt.downloads };
    }
    if (!peakVisitorsDay || pt.uniqueVisitors > peakVisitorsDay.value) {
      peakVisitorsDay = { label: pt.fullLabel, value: pt.uniqueVisitors };
    }
  }

  const daysCount = series.length;
  return {
    periodDownloads,
    periodVisitors,
    periodVisits,
    avgDownloadsPerDay: Math.round((periodDownloads / daysCount) * 10) / 10,
    avgVisitorsPerDay: Math.round((periodVisitors / daysCount) * 10) / 10,
    conversionRatePercent:
      periodVisitors > 0
        ? Math.min(999, Math.round((periodDownloads / periodVisitors) * 1000) / 10)
        : 0,
    peakDownloadsDay:
      peakDownloadsDay && peakDownloadsDay.value > 0 ? peakDownloadsDay : null,
    peakVisitorsDay:
      peakVisitorsDay && peakVisitorsDay.value > 0 ? peakVisitorsDay : null,
  };
}

export function normalizePublicPath(rawPath: unknown): string | null {
  if (typeof rawPath !== 'string') return null;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/')) return null;

  const withoutQueryOrHash = trimmed.split(/[?#]/, 1)[0] || '/';
  const collapsedSlashes = withoutQueryOrHash.replace(/\/{2,}/g, '/');
  const normalized =
    collapsedSlashes.length > 1 && collapsedSlashes.endsWith('/')
      ? collapsedSlashes.slice(0, -1)
      : collapsedSlashes;

  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return null;
    }
  }

  return normalized.slice(0, 160);
}

export function normalizeVisitPayload(input: {
  visitorToken?: unknown;
  path?: unknown;
}):
  | { ok: true; visitorToken: string; path: string }
  | { ok: false; error: string } {
  const token =
    typeof input.visitorToken === 'string' ? input.visitorToken.trim() : '';

  if (!/^[a-zA-Z0-9_-]{12,120}$/.test(token)) {
    return { ok: false, error: 'Invalid visitor token.' };
  }

  const path = normalizePublicPath(input.path ?? '/');
  if (!path) {
    return { ok: false, error: 'Non-trackable path.' };
  }

  return { ok: true, visitorToken: token, path };
}

export function shouldCountSessionHit(
  lastRecordedTimestampMs: number | null | undefined,
  nowMs: number,
  minIntervalMs = 20_000,
): boolean {
  if (
    typeof lastRecordedTimestampMs !== 'number' ||
    !Number.isFinite(lastRecordedTimestampMs)
  ) {
    return true;
  }
  const elapsed = nowMs - lastRecordedTimestampMs;
  if (elapsed < 0) return true;
  return elapsed >= minIntervalMs;
}

export function isPrefetchRequestHeaders(headers: {
  get(name: string): string | null;
}): boolean {
  const purpose = (
    headers.get('purpose') ||
    headers.get('sec-purpose') ||
    ''
  ).toLowerCase();
  if (purpose.includes('prefetch')) return true;
  if (headers.get('x-middleware-prefetch')) return true;
  if (headers.get('next-router-prefetch')) return true;
  return false;
}
