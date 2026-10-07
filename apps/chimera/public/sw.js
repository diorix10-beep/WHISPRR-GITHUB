/*
 * Retires the service worker installed by the previous CHIMERA.
 *
 * The previous site was a PWA, so many browsers still hold an old service worker
 * and a cache of the old app. This app does not use a service worker. When a
 * browser checks /sw.js it receives this file, which clears the old caches,
 * unregisters itself and reloads open tabs so visitors get the new site.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      windows.forEach((client) => client.navigate(client.url));
    })(),
  );
});
