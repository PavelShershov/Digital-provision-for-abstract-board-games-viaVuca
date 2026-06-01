const MODEL_CACHE_NAME = 'viavuca-3d-models-v1';

const CACHEABLE_EXTENSIONS = [
  '.glb',
  '.gltf',
  '.bin',
  '.ktx2',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp'
];

function isCacheableAssetRequest(request) {
  if (!request || request.method !== 'GET') {
    return false;
  }

  try {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch (error) {
    return false;
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('viavuca-3d-models-') &&
                     cacheName !== MODEL_CACHE_NAME;
            })
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (!isCacheableAssetRequest(request)) {
    return;
  }

  event.respondWith(
    caches.open(MODEL_CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);

        if (
          networkResponse &&
          networkResponse.ok &&
          networkResponse.status === 200
        ) {
          await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        return new Response('Файл модели недоступен в сети и отсутствует в кэше.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
      }
    })
  );
});
