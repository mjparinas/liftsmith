// Maintenance mode (Gradelings' src/lib/maintenance.ts): an admin switches it on in the panel (System tab) and
// the website's pages and API answer 503 with a short message, while what's needed to switch it off again and
// the machine endpoints that must never miss a call keep working. The Android and iOS apps load their own files,
// so they keep working offline; sync and usage stats wait and send when it's over. The check runs in
// src/proxy.api.ts (server build only); this file holds the rules and the page, so they can be tested.

/** Header on every maintenance answer, so a client can tell it from a real error. */
export const MAINTENANCE_HEADER = "x-maintenance";
/** How long a server keeps the switch's state before reading it again. */
export const MAINTENANCE_CACHE_MS = 15_000;
export const MAINTENANCE_RETRY_SECONDS = 600;
export const MAINTENANCE_MESSAGE = "Liftsmith is under maintenance. Your workouts are saved on this device and sync when it's back.";

// The home page; pages the stores require to stay reachable (privacy policy, account deletion); the web app,
// which works offline from its own page; and the machine endpoints: health check, store webhook, cron jobs,
// reminder unsubscribe and confirm links.
const OPEN_EXACT = new Set([
  "/",
  "/privacy/",
  "/delete-account/",
  "/api/health/",
  "/api/billing/revenuecat/",
  "/api/reminders/unsubscribe/",
  "/api/reminders/confirm/",
]);
const OPEN_PREFIX = ["/admin/", "/api/admin/", "/api/cron/", "/app/", "/_next/"];

/** Whether a path still works during maintenance. */
export function openDuringMaintenance(pathname: string): boolean {
  // Files with an extension (icons, the manifest, the service worker, robots.txt, models) are static.
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (OPEN_EXACT.has(path)) return true;
  return OPEN_PREFIX.some((p) => path.startsWith(p));
}

/** The page shown instead of every other page. Self-contained: no scripts, one inline style. */
export function maintenancePage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Under maintenance · Liftsmith</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080b10;color:#e8edf4;font:18px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px;box-sizing:border-box}
main{max-width:32rem;text-align:center}
h1{font-size:1.75rem;margin:0 0 .5rem}
p{margin:0 0 1rem;color:#b4bfcd}
a{display:inline-block;min-height:44px;line-height:44px;padding:0 1.25rem;border-radius:12px;background:#4c8dff;color:#06122a;font-weight:700;text-decoration:none}
</style>
</head>
<body>
<main>
<h1>Liftsmith is under maintenance</h1>
<p>We're making a few improvements and will be back soon. The app keeps working on your phone, and your workouts sync when we're back.</p>
<a href="/">Go to the home page</a>
</main>
</body>
</html>
`;
}
