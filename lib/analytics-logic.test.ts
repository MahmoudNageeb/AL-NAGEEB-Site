import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyTrafficSeries,
  formatPublicRouteLabel,
  isPrefetchRequestHeaders,
  normalizePublicPath,
  normalizeRangeDays,
  normalizeVisitPayload,
  shouldCountSessionHit,
  summarizeTrafficSeries,
} from './analytics-logic';

test('normalizePublicPath accepts public pages and strips query strings', () => {
  assert.equal(normalizePublicPath('/'), '/');
  assert.equal(normalizePublicPath('/install?utm=promo'), '/install');
  assert.equal(normalizePublicPath('/features/#focus'), '/features');
  assert.equal(normalizePublicPath('///opinions/'), '/opinions');
});

test('normalizePublicPath rejects admin, api, next internals, and external URLs', () => {
  assert.equal(normalizePublicPath('/admin'), null);
  assert.equal(normalizePublicPath('/admin/settings'), null);
  assert.equal(normalizePublicPath('/api/download'), null);
  assert.equal(normalizePublicPath('/_next/static/chunk.js'), null);
  assert.equal(normalizePublicPath('https://evil.example/'), null);
  assert.equal(normalizePublicPath(''), null);
});

test('normalizeVisitPayload validates visitor token format and trackable path', () => {
  const valid = normalizeVisitPayload({
    visitorToken: 'vis_1234567890abcdef',
    path: '/install',
  });
  assert.deepEqual(valid, {
    ok: true,
    visitorToken: 'vis_1234567890abcdef',
    path: '/install',
  });

  assert.equal(
    normalizeVisitPayload({ visitorToken: 'short', path: '/' }).ok,
    false,
  );
  assert.equal(
    normalizeVisitPayload({
      visitorToken: 'valid_token_123456',
      path: '/admin',
    }).ok,
    false,
  );
});

test('shouldCountSessionHit prevents rapid duplicate visit writes', () => {
  assert.equal(shouldCountSessionHit(null, 100_000, 20_000), true);
  assert.equal(shouldCountSessionHit(undefined, 100_000, 20_000), true);
  assert.equal(shouldCountSessionHit(90_000, 100_000, 20_000), false);
  assert.equal(shouldCountSessionHit(80_000, 100_000, 20_000), true);
});

test('isPrefetchRequestHeaders detects browser and Next.js prefetch hints', () => {
  assert.equal(
    isPrefetchRequestHeaders(new Headers({ 'sec-purpose': 'prefetch' })),
    true,
  );
  assert.equal(
    isPrefetchRequestHeaders(new Headers({ purpose: 'prefetch' })),
    true,
  );
  assert.equal(
    isPrefetchRequestHeaders(new Headers({ 'next-router-prefetch': '1' })),
    true,
  );
  assert.equal(
    isPrefetchRequestHeaders(new Headers({ 'user-agent': 'Mozilla/5.0' })),
    false,
  );
});

test('normalizeRangeDays restricts to 7, 14, or 30 days', () => {
  assert.equal(normalizeRangeDays(7), 7);
  assert.equal(normalizeRangeDays('30'), 30);
  assert.equal(normalizeRangeDays('99'), 14);
  assert.equal(normalizeRangeDays(undefined), 14);
});

test('buildDailyTrafficSeries fills empty days chronologically and merges visitors & downloads', () => {
  const series = buildDailyTrafficSeries({
    days: 7,
    referenceDate: new Date(Date.UTC(2026, 10, 14, 12, 0, 0)),
    dailyVisitors: [
      { dateKey: '2026-11-12', uniqueVisitors: 12, totalVisits: 20 },
      { dateKey: '2026-11-14', uniqueVisitors: 25, totalVisits: 40 },
    ],
    dailyDownloads: [
      { dateKey: '2026-11-12', downloads: 5 },
      { dateKey: '2026-11-14', downloads: 10 },
    ],
  });

  assert.equal(series.length, 7);
  assert.equal(series[0].dateKey, '2026-11-08');
  assert.equal(series[0].uniqueVisitors, 0);
  assert.equal(series[4].dateKey, '2026-11-12');
  assert.equal(series[4].uniqueVisitors, 12);
  assert.equal(series[4].downloads, 5);
  assert.equal(series[6].dateKey, '2026-11-14');
  assert.equal(series[6].fullLabel, '14 نوفمبر');
  assert.equal(series[6].downloads, 10);
});

test('summarizeTrafficSeries computes totals, averages, peak days, and conversion rate safely', () => {
  const series = buildDailyTrafficSeries({
    days: 7,
    referenceDate: new Date(Date.UTC(2026, 10, 14)),
    dailyVisitors: [
      { dateKey: '2026-11-13', uniqueVisitors: 20, totalVisits: 30 },
      { dateKey: '2026-11-14', uniqueVisitors: 30, totalVisits: 40 },
    ],
    dailyDownloads: [
      { dateKey: '2026-11-13', downloads: 15 },
      { dateKey: '2026-11-14', downloads: 10 },
    ],
  });

  const summary = summarizeTrafficSeries(series);
  assert.equal(summary.periodVisitors, 50);
  assert.equal(summary.periodDownloads, 25);
  assert.equal(summary.conversionRatePercent, 50);
  assert.deepEqual(summary.peakDownloadsDay, { label: '13 نوفمبر', value: 15 });
  assert.deepEqual(summary.peakVisitorsDay, { label: '14 نوفمبر', value: 30 });
  assert.equal(formatPublicRouteLabel('/install'), 'طريقة التثبيت');
});
