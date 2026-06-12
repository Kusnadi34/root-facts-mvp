import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';


precacheAndRoute(self.__WB_MANIFEST);


registerRoute(
  /^https:\/\/api\./i,
  new NetworkFirst({
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60,
    },
  })
);


registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
  })
);


self.addEventListener('install', () => {
  self.skipWaiting();
});


self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
