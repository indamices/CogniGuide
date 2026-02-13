/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'cogniguide-v1';
const RUNTIME_CACHE = 'cogniguide-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Cache strategies
const CacheStrategies = {
  // Stale-While-Revalidate: Serve from cache, update in background
  async staleWhileRevalidate(request: Request): Promise<Response> {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  },

  // Cache-First: Try cache first, fallback to network
  async cacheFirst(request: Request): Promise<Response> {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      // Return a custom offline page for HTML requests
      if (request.headers.get('accept')?.includes('text/html')) {
        return new Response('Offline - CogniGuide', {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      throw error;
    }
  },

  // Network-First: Try network first, fallback to cache
  async networkFirst(request: Request): Promise<Response> {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
      const networkResponse = await fetch(request);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Network-Only: Always fetch from network
  async networkOnly(request: Request): Promise<Response> {
    return fetch(request);
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Caching static assets');
      await cache.addAll(STATIC_ASSETS);

      // Force the waiting service worker to become active
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    (async () => {
      // Enable navigation preload if available
      if ('navigationPreload' in self.registration) {
        await (self.registration as any).navigationPreload.enable();
      }

      // Clean up old caches
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(
        (name) => name !== CACHE_NAME && name !== RUNTIME_CACHE
      );

      await Promise.all(
        cachesToDelete.map((name) => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );

      // Take control of all clients immediately
      await self.clients.claim();
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // For API calls, use network-first with offline fallback
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(CacheStrategies.networkFirst(request));
      return;
    }
    return;
  }

  // Determine strategy based on request type
  let strategy;

  // HTML documents - Stale-While-Revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    strategy = CacheStrategies.staleWhileRevalidate(request);
  }
  // Static assets (JS, CSS, images) - Cache-First
  else if (
    request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)
  ) {
    strategy = CacheStrategies.cacheFirst(request);
  }
  // API calls - Network-First
  else if (url.pathname.startsWith('/api/')) {
    strategy = CacheStrategies.networkFirst(request);
  }
  // Default - Stale-While-Revalidate
  else {
    strategy = CacheStrategies.staleWhileRevalidate(request);
  }

  event.respondWith(strategy);
});

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        try {
          // Sync any queued data
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_REQUEST',
              data: {}
            });
          });
        } catch (error) {
          console.error('[SW] Sync failed:', error);
          // Retry later
          throw error;
        }
      })()
    );
  }
});

// Push notifications (optional)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New update from CogniGuide',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CogniGuide', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});

// Message handling for manual cache updates
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      event.waitUntil(
        (async () => {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.addAll(data.urls);
        })()
      );
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((name) => caches.delete(name))
          );
        })()
      );
      break;
  }
});

// Periodic background sync (Chrome only)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event: any) => {
    if (event.tag === 'content-sync') {
      event.waitUntil(
        (async () => {
          // Perform periodic sync tasks
          console.log('[SW] Periodic sync triggered');
        })()
      );
    }
  });
}

export {};
