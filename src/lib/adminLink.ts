import { SITE_URL } from "./site";

// The admin panel from the apps (Melvin, 2026-11-26, decision card: "Both"). The panel stays a website page (/admin/,
// server build only, never bundled into the apps), so the apps show it in an in-app browser tab: a Chrome Custom Tab
// on Android, which shares Chrome's cookies and so its admin session, and Safari's view on iOS (@capacitor/browser).
// Two ways in: admin links (the digest, alerts, the sign-in email) open the app on Android through App Links
// (appLinks.ts), and staff accounts get Settings › Admin panel. Nothing here grants anything: the panel asks for its
// own sign-in and two-step as on the website. On the web the panel opens in a new browser tab.

/** Admin addresses the apps open in the browser tab: the panel itself and the sign-in link from the email. */
export function isAdminLink(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.hostname !== new URL(SITE_URL).hostname) return false;
  return u.pathname === "/admin" || u.pathname.startsWith("/admin/") || u.pathname.startsWith("/api/admin/login/");
}

const isNative = () => !!(globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

/** Opens the admin panel (or an admin link) in the in-app browser tab, or a new tab on the web. */
export async function openAdmin(url = `${SITE_URL}/admin/`): Promise<void> {
  if (!isAdminLink(url)) return;
  if (isNative()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener");
}
