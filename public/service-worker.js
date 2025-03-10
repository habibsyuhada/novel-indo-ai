// Log untuk memastikan service worker dimuat
console.log('Service Worker loaded');

// Cache name untuk menyimpan audio files
const CACHE_NAME = 'audio-cache-v1';

// Install event handler
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      // Pre-cache audio file
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/audio/background.mp3'
        ]);
      })
    ])
  );
});

// Activate event handler
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Cleanup old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  // Handle audio file requests
  if (event.request.url.includes('/audio/')) {
    console.log('Fetching audio file:', event.request.url);
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('Found audio in cache');
            return response;
          }
          console.log('Fetching audio from network');
          return fetch(event.request).then((response) => {
            // Cache the audio file for future use
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
        .catch(() => {
          console.log('Failed to fetch audio');
          return new Response();
        })
    );
  }
});

// Message event handler
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  if (event.data === 'keepalive') {
    event.waitUntil(
      Promise.resolve().then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage('alive');
          });
        });
      })
    );
  }
}); 