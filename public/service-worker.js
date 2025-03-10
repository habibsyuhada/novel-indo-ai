// Background audio service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle audio playback in background
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/audio/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response();
        })
    );
  }
});

// Keep service worker alive
self.addEventListener('message', (event) => {
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