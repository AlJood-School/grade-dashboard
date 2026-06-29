/**
 * ═══════════════════════════════════════════════════════════════
 *  EduOS Service Worker  v1.0
 *  بوابة الجود الذكية — PWA
 *  © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE — CN-6573712
 * ═══════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'eduos-v1';
const STATIC_ASSETS = [
  '/apps/eduos-hub/index.html',
  '/apps/platform-state.js',
  '/apps/platform-week.js',
  '/apps/platform-motd.js',
  '/apps/platform-lang.js',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap',
];

// ── Install ───────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] بعض الملفات لم تُخزَّن مؤقتاً:', err.message);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — Network First, Cache Fallback ─────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase API → لا تخزَّن
  if (url.hostname.includes('supabase') || url.hostname.includes('supabase.co')) {
    return;
  }

  // Google Fonts → Cache First
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // HTML/JS/CSS → Network First
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok && event.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push Notifications ────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'بوابة الجود الذكية';
  const opts  = {
    body:    data.body || '',
    icon:    '/apps/assets/icons/icon-192.png',
    badge:   '/apps/assets/icons/icon-72.png',
    dir:     'rtl',
    lang:    'ar',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/apps/eduos-hub/index.html' },
    tag:     data.tag || 'eduos-notification',
    requireInteraction: data.important || false,
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

// ── Notification Click ────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/apps/eduos-hub/index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync — للإشارات المؤجلة ───────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-atheer-signals') {
    event.waitUntil(syncPendingSignals());
  }
});

async function syncPendingSignals() {
  // تُنفَّذ حين تعود الشبكة
  console.info('[SW] مزامنة إشارات أثير المؤجلة...');
}
