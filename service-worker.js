const CACHE_NAME = "plushlife-v19";
const APP_SHELL = ["./", "./login.html", "./legal.html", "./manifest.webmanifest", "./icon.svg?v=2", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png"];
const PRIVATE_TRACKER_URL = new URL("./", self.registration.scope).href;

function privateTrackerUrl(candidate) {
  try {
    const scopeUrl = new URL(self.registration.scope);
    const targetUrl = new URL(candidate || PRIVATE_TRACKER_URL, self.registration.scope);
    const staysInsideApp = targetUrl.origin === scopeUrl.origin &&
      targetUrl.pathname.startsWith(scopeUrl.pathname);
    return staysInsideApp ? targetUrl.href : PRIVATE_TRACKER_URL;
  } catch (_error) {
    return PRIVATE_TRACKER_URL;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(
          (cached) => cached || caches.match("./")
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_error) {}
  event.waitUntil(self.registration.showNotification(data.title || "Just checking on you 💛", {
    body: data.body || "Hi sweetheart, how are you doing? Come check in when you're ready.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: data.tag || "plushlist-reminder",
    data: { url: privateTrackerUrl(data.url) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = privateTrackerUrl(event.notification.data?.url);
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const windowClient of windows) {
      if ("focus" in windowClient) {
        windowClient.navigate(targetUrl);
        return windowClient.focus();
      }
    }
    return clients.openWindow(targetUrl);
  }));
});
