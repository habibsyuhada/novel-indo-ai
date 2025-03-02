// Audio Service Worker
// This service worker helps keep the audio context alive when the page is in the background

const CACHE_NAME = 'audio-cache-v1';

// Install event - cache necessary files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/favicon.ico',
      ]);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients immediately
  self.clients.claim();
});

// Fetch event - respond with cached resources when available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KEEP_ALIVE') {
    // Respond to keep-alive messages
    event.source.postMessage({ type: 'STILL_ALIVE' });
  }
});

// Create a periodic sync to keep the service worker alive
let keepAliveInterval;

// Start a keep-alive interval
const startKeepAlive = () => {
  if (keepAliveInterval) return;
  
  keepAliveInterval = setInterval(() => {
    // This empty function keeps the service worker active
    console.log('Service worker keep-alive ping');
    
    // Notify all clients that we're still alive
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'STILL_ALIVE' });
      });
    });
  }, 25000); // Every 25 seconds
};

// Stop the keep-alive interval
const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

// Start keep-alive on install
startKeepAlive();

// Listen for specific commands
self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'START_KEEP_ALIVE':
        startKeepAlive();
        break;
      case 'STOP_KEEP_ALIVE':
        stopKeepAlive();
        break;
    }
  }
}); 