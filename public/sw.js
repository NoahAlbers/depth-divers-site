// Push notification service worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, url, tag } = payload;

    event.waitUntil(
      self.registration.showNotification(title || "Depth Divers", {
        body: body || "",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: tag || "default",
        data: { url: url || "/" },
      })
    );
  } catch {
    // Fallback for non-JSON payloads
    event.waitUntil(
      self.registration.showNotification("Depth Divers", {
        body: event.data.text(),
        data: { url: "/" },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(url);
    })
  );
});
