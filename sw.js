// ===== بوابة الجود الذكية — Service Worker =====
// v1.0 — PWA Support

const CACHE_NAME = 'aljood-portal-v1';
const STATIC_CACHE = 'aljood-static-v1';

// الملفات الأساسية للتخزين المؤقت
const CORE_URLS = [
  '/grade-dashboard/',
  '/grade-dashboard/index.html',
  '/grade-dashboard/manifest.json'
];

// ── التثبيت: تخزين الملفات الأساسية ──
self.addEventListener('install', event => {
  console.log('[SW] Installing Al Jood Portal PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_URLS).catch(err => {
        console.warn('[SW] Some files could not be cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── التفعيل: حذف النسخ القديمة ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating Al Jood Portal PWA...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── الاعتراض: Cache-First لـ GitHub Pages ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // تجاهل طلبات غير HTTP
  if (!url.protocol.startsWith('http')) return;

  // تجاهل طلبات Google Fonts وFont Awesome (شبكة أولاً)
  if (url.hostname.includes('googleapis') || url.hostname.includes('gstatic') ||
      url.hostname.includes('fontawesome') || url.hostname.includes('jsdelivr') ||
      url.hostname.includes('cdnjs')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // طلبات البيانات من GitHub — شبكة أولاً (للتحديث الفوري)
  if (url.hostname.includes('raw.githubusercontent') || url.hostname.includes('github')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // الملفات الأساسية — Cache-First مع تحديث في الخلفية
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// ── إشعارات Push (جاهزة للمستقبل) ──
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'إشعار من بوابة الجود',
    icon: '/grade-dashboard/icon-192.png',
    badge: '/grade-dashboard/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/grade-dashboard/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'بوابة الجود الذكية', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/grade-dashboard/';
  event.waitUntil(clients.openWindow(url));
});
