import 'server-only';
import { sendNotification, setVapidDetails } from 'web-push';
import {
  clearInvalidPushEndpointsInDb,
  createBroadcastNotificationInDb,
  getAuthorizedOwnerEmail,
  getOrCreateVapidKeysInDb,
  listEnabledPushSubscribersInDb,
  updateBroadcastCountsInDb,
} from './db';
import type { BroadcastNotificationItem } from './notifications-logic';

export interface SendBroadcastResult {
  notification: BroadcastNotificationItem;
  totalSubscribers: number;
  pushSentCount: number;
}

export async function sendBroadcastNotification(input: {
  title: string;
  body: string;
  targetUrl: string;
  adminId: number;
}): Promise<SendBroadcastResult> {
  const [vapidKeys, subscribers] = await Promise.all([
    getOrCreateVapidKeysInDb(),
    listEnabledPushSubscribersInDb(),
  ]);

  const ownerEmail = getAuthorizedOwnerEmail();
  setVapidDetails(
    `mailto:${ownerEmail}`,
    vapidKeys.publicKey,
    vapidKeys.privateKey,
  );

  // Create notification row first so we have its persistent ID in the push payload
  const created = await createBroadcastNotificationInDb({
    title: input.title,
    body: input.body,
    targetUrl: input.targetUrl,
    sentByAdminId: input.adminId,
    recipientCount: subscribers.length,
    pushSentCount: 0,
  });

  const pushTargets = subscribers.filter(
    (sub): sub is typeof sub & { endpoint: string; p256dh: string; auth: string } =>
      Boolean(sub.endpoint && sub.p256dh && sub.auth),
  );

  let pushSentCount = 0;
  const expiredEndpoints: string[] = [];

  if (pushTargets.length > 0) {
    const payloadJson = JSON.stringify({
      id: created.id,
      title: created.title,
      body: created.body,
      url: created.targetUrl,
      createdAt: created.createdAt,
    });

    const results = await Promise.allSettled(
      pushTargets.map(async (target) => {
        try {
          await sendNotification(
            {
              endpoint: target.endpoint,
              keys: {
                p256dh: target.p256dh,
                auth: target.auth,
              },
            },
            payloadJson,
            { TTL: 60 * 60 * 24 },
          );
          return { ok: true as const };
        } catch (err) {
          const statusCode =
            typeof err === 'object' && err !== null && 'statusCode' in err
              ? Number((err as { statusCode?: number }).statusCode)
              : 0;
          if (statusCode === 404 || statusCode === 410) {
            expiredEndpoints.push(target.endpoint);
          }
          return { ok: false as const };
        }
      }),
    );

    pushSentCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.ok,
    ).length;

    if (expiredEndpoints.length > 0) {
      await clearInvalidPushEndpointsInDb(expiredEndpoints).catch(() => {});
    }
  }

  const finalNotification =
    pushSentCount > 0
      ? await updateBroadcastCountsInDb(created.id, subscribers.length, pushSentCount)
      : created;

  return {
    notification: finalNotification,
    totalSubscribers: subscribers.length,
    pushSentCount,
  };
}
