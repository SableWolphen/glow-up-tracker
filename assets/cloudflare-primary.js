// Hosting compatibility for generated Cloudflare and Android builds.
// GitHub Pages remains online as a backup, while new Android builds load
// PlushLife from Cloudflare. Keep this file side-effect-light on the web.
(function () {
  "use strict";

  const PRIMARY_ORIGIN = "https://plushlife.plushlife-app.workers.dev";
  const BACKUP_ORIGIN = "https://sablewolphen.github.io";
  const BACKUP_PATH_PREFIX = "/plushlist/";

  window.PlushLifeHosts = Object.freeze({
    primary: `${PRIMARY_ORIGIN}/`,
    backup: `${BACKUP_ORIGIN}${BACKUP_PATH_PREFIX}`,
  });

  if (!window.Capacitor || !window.Capacitor.Plugins) return;
  const PushNotifications = window.Capacitor.Plugins.PushNotifications;
  if (!PushNotifications || typeof PushNotifications.addListener !== "function") return;

  // The original native listener still supports legacy GitHub Pages links.
  // This additional listener handles new Cloudflare notification links.
  PushNotifications.addListener("pushNotificationActionPerformed", function (event) {
    const rawTarget = event && event.notification && event.notification.data && event.notification.data.url;
    if (typeof rawTarget !== "string") return;

    try {
      const target = new URL(rawTarget);
      if (target.origin !== PRIMARY_ORIGIN) return;
      window.location.href = target.href;
    } catch (_error) {
      // Ignore malformed or untrusted notification URLs.
    }
  });
})();
