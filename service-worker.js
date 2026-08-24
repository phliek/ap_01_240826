// Einfacher Service Worker: cached die App-Hülle für vollständige Offline-Nutzung.
var CACHE_NAME = "finanzen-app-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate: sofort aus dem Cache antworten (auch offline nutzbar),
// im Hintergrund aktualisieren, sobald wieder Internet verfügbar ist.
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var fetchPromise = fetch(event.request)
        .then(function (networkResponse) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
