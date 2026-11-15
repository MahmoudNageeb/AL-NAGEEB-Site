import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findUnseenNotifications,
  normalizeSubscriptionInput,
  sanitizeTargetUrl,
  validateBroadcastNotificationInput,
  type BroadcastNotificationItem,
} from './notifications-logic';

test('validateBroadcastNotificationInput rejects empty or dangerous values and trims valid input', () => {
  const invalid = validateBroadcastNotificationInput({
    title: 'أ',
    body: 'ok',
    targetUrl: 'javascript:alert(1)',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.body);
  assert.ok(invalid.errors.targetUrl);

  const valid = validateBroadcastNotificationInput({
    title: '  تحديث جديد v2.8  ',
    body: '  نزل تحديث جديد فيه تحسينات قوية للتركيز والسبورة.  ',
    targetUrl: '/install',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.sanitized, {
    title: 'تحديث جديد v2.8',
    body: 'نزل تحديث جديد فيه تحسينات قوية للتركيز والسبورة.',
    targetUrl: '/install',
  });
});

test('sanitizeTargetUrl allows relative paths and http/https URLs while rejecting unsafe protocols', () => {
  assert.deepEqual(sanitizeTargetUrl(''), { valid: true, value: '/' });
  assert.deepEqual(sanitizeTargetUrl('/features'), { valid: true, value: '/features' });
  assert.deepEqual(sanitizeTargetUrl('//evil.com'), { valid: false, value: '/' });
  assert.deepEqual(sanitizeTargetUrl('data:text/html,hi'), { valid: false, value: '/' });
  assert.deepEqual(sanitizeTargetUrl('https://alnageeb.app/install'), {
    valid: true,
    value: 'https://alnageeb.app/install',
  });
});

test('normalizeSubscriptionInput validates token and requires complete push keys when endpoint provided', () => {
  const bad = normalizeSubscriptionInput({ subscriberToken: 'short' });
  assert.equal(bad.valid, false);

  const fallbackOnly = normalizeSubscriptionInput({
    subscriberToken: 'token-1234567890-abcdef',
    endpoint: null,
  });
  assert.equal(fallbackOnly.valid, true);
  assert.equal(fallbackOnly.endpoint, null);

  const fullPush = normalizeSubscriptionInput({
    subscriberToken: 'token-1234567890-abcdef',
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: {
      p256dh: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFg',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  });
  assert.equal(fullPush.valid, true);
  assert.equal(fullPush.endpoint, 'https://fcm.googleapis.com/fcm/send/abc');
  assert.ok(fullPush.p256dh);
  assert.ok(fullPush.auth);
});

test('findUnseenNotifications filters seen IDs and sorts oldest unseen first', () => {
  const feed: BroadcastNotificationItem[] = [
    {
      id: 10,
      title: 'أحدث إشعار',
      body: 'نص 10',
      targetUrl: '/',
      recipientCount: 5,
      pushSentCount: 5,
      createdAt: '2026-11-13T10:00:00Z',
    },
    {
      id: 8,
      title: 'إشعار قديم',
      body: 'نص 8',
      targetUrl: '/',
      recipientCount: 4,
      pushSentCount: 4,
      createdAt: '2026-11-13T08:00:00Z',
    },
    {
      id: 9,
      title: 'إشعار متوسط',
      body: 'نص 9',
      targetUrl: '/install',
      recipientCount: 5,
      pushSentCount: 5,
      createdAt: '2026-11-13T09:00:00Z',
    },
  ];

  const unseen = findUnseenNotifications(feed, [8]);
  assert.deepEqual(
    unseen.map((n) => n.id),
    [9, 10],
  );
});
