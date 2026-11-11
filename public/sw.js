// Service Worker for PWA Home Screen Installation, Offline App Shell & Safe Updates
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `daily-report-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `daily-report-static-${CACHE_VERSION}`;
const ACTIVE_CACHES = [SHELL_CACHE, STATIC_CACHE];

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// External APIs that must NEVER be cached by the Service Worker
const BYPASS_HOSTS_OR_PATTERNS = [
  'googleapis.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseio.com',
  'firebasestorage.googleapis.com',
  'cloudinary.com',
  'api.cloudinary.com',
  'res.cloudinary.com',
  'script.google.com',
  'script.googleusercontent.com',
];

function shouldBypassRequest(urlString) {
  return BYPASS_HOSTS_OR_PATTERNS.some((pattern) => urlString.includes(pattern));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  // Activate immediately on initial install when no controller exists yet;
  // when an existing controller is active, wait for user confirmation via SKIP_WAITING
  if (!self.registration || !self.registration.active) {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!ACTIVE_CACHES.includes(key)) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Support controlled updates triggered by the user clicking "Update Now"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests over HTTP/HTTPS
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  // Strictly bypass Firebase Auth, Firestore, Cloudinary, and Google Sheets Apps Script
  if (shouldBypassRequest(request.url)) {
    return;
  }

  const url = new URL(request.url);

  // 1. Navigation requests (HTML pages): Network-first with offline fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage =
            (await caches.match(request)) ||
            (await caches.match('/index.html')) ||
            (await caches.match('/'));
          return cachedPage || Response.error();
        })
    );
    return;
  }

  // 2. Hashed build assets (/assets/*), icons, and Google Fonts: Cache-first with background refresh
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.woff2'));
  const isFontAsset =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset || isFontAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              const copy = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // 3. Default strategy for other same-origin GET requests: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

