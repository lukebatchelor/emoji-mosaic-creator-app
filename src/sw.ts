import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// caching
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// auto updating
self.skipWaiting();
clientsClaim();

// Add a fetch handler to handle post requests to allow us to be a web share target
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // request requests can be forwarded on
  if (event.request.method !== 'POST' || !url.endsWith('upload')) {
    return event.respondWith(fetch(event.request));
  }

  // otherwise, process the upload for share api
  event.respondWith(
    (async () => {
      const formData = await event.request.formData();
      const upload = formData.get('upload');
      const cache = await caches.open('uploadedImages');
      await cache.put('upload', new Response(upload));
      console.log('cached uploaded image');
      const res = { success: true };
      return Response.redirect('/?uploaded', 303);
    })()
  );
});

console.log('hello from sw.js!');
