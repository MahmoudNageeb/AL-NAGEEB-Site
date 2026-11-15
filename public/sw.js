/* Service Worker for AL NAGEEB Web Push Notifications */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    id: null,
    title: 'تطبيق النجيب — AL NAGEEB',
    body: 'في إشعار جديد من إدارة الموقع.',
    url: '/',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        id: parsed.id ?? null,
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        url: parsed.url || '/',
      };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const showPromise = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    dir: 'rtl',
    lang: 'ar',
    tag: payload.id ? `al-nageeb-${payload.id}` : 'al-nageeb-broadcast',
    renotify: true,
    data: {
      id: payload.id,
      url: payload.url,
    },
  });

  const notifyClientsPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) {
        client.postMessage({
          type: 'AL_NAGEEB_PUSH_RECEIVED',
          payload,
        });
      }
    });

  event.waitUntil(Promise.all([showPromise, notifyClientsPromise]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
