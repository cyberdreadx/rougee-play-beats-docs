// ROUGEE PLAY PWA Service Worker
// Optimized for XMTP messaging and blockchain music platform

const CACHE_NAME = 'rougee-play-v1';
const STATIC_CACHE = 'rougee-play-static-v1';
const DYNAMIC_CACHE = 'rougee-play-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    // Static files - cache first
    if (url.pathname === '/' || url.pathname.includes('.html')) {
      event.respondWith(
        caches.match(request)
          .then((response) => {
            if (response) {
              console.log('📦 Serving from cache:', url.pathname);
              return response;
            }
            return fetch(request)
              .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(STATIC_CACHE)
                    .then((cache) => cache.put(request, responseClone));
                }
                return response;
              });
          })
      );
    }
    
    // API requests - network first, cache fallback
    else if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Cache successful API responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Fallback to cache if network fails
            return caches.match(request);
          })
      );
    }
    
    // XMTP and blockchain requests - network only
    else if (url.hostname.includes('xmtp') || url.hostname.includes('ephemera')) {
      event.respondWith(fetch(request));
    }
    
    // Other requests - cache first, network fallback
    else {
      event.respondWith(
        caches.match(request)
          .then((response) => {
            if (response) {
              return response;
            }
            return fetch(request)
              .then((response) => {
                if (response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => cache.put(request, responseClone));
                }
                return response;
              });
          })
      );
    }
  }
  
  // POST requests - network only (for XMTP messaging)
  else if (request.method === 'POST') {
    event.respondWith(fetch(request));
  }
});

// Background sync for XMTP messages
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'xmtp-sync') {
    event.waitUntil(
      // Notify the main app to sync XMTP messages
      self.clients.matchAll()
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'XMTPSYNC',
              action: 'sync-messages'
            });
          });
        })
    );
  }
});

// Push notifications for new messages
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/messages'
    },
    actions: [
      {
        action: 'open',
        title: 'Open Messages',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ROUGEE PLAY', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow('/messages')
    );
  }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('💬 Message received in service worker:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'XMTPSYNC') {
    // Trigger background sync for XMTP
    self.registration.sync.register('xmtp-sync');
  }
});

console.log('🎵 ROUGEE PLAY Service Worker loaded');
