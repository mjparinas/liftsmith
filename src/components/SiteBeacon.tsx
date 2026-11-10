"use client";

// Page views and call-to-action clicks on the public site, sent to our own server (/api/pv/). Cookieless:
// nothing is stored on the device for counting, and the server's visitor hash changes every day. The app
// (/app/) and the admin panel (/admin/) send nothing from here. A Global Privacy Control signal is respected.
// It also remembers the first visit's source (UTM tags, referrer, landing page) on the device, so a web app
// install can be credited to it, when usage stats are on (src/lib/analytics.ts).
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { analyticsOn, rememberFirstTouch } from "@/lib/analytics";
import { utmFrom } from "@/lib/analyticsSchema";

/** The app, the admin panel and the lifter's own dashboard aren't counted; shared /share/ pages are (friends arriving). */
export const isPublicPath = (path: string) => !/^\/(app|admin|me)(\/|$)/.test(path);

/** What a click counts as: the app, a store badge, or anything marked data-cta. */
export function ctaOf(a: Element | null): string | null {
  if (!a) return null;
  const marked = a.getAttribute("data-cta");
  if (marked) return marked;
  const href = a.getAttribute("href") ?? "";
  if (/^\/app\/?/.test(href)) return "open-app";
  if (/play\.google\.com/.test(href)) return "google-play";
  if (/apps\.apple\.com/.test(href)) return "app-store";
  return null;
}

function send(body: object) {
  if (process.env.NEXT_PUBLIC_STATIC === "1") return;
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.(`/api/pv/`, new Blob([data], { type: "text/plain" }))) return;
  } catch {}
  void fetch("/api/pv/", { method: "POST", body: data, keepalive: true }).catch(() => {});
}

export function SiteBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (!isPublicPath(path)) return;
    if (analyticsOn()) rememberFirstTouch();
    send({ path, referrer: document.referrer || undefined, utm: utmFrom(location.search), screen: String(window.innerWidth) });
  }, [path]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isPublicPath(location.pathname)) return;
      const a = e.target instanceof Element ? e.target.closest("a[href], [data-cta]") : null;
      const cta = ctaOf(a);
      if (cta) send({ path: location.pathname, cta, utm: utmFrom(location.search) });
    };
    // Capture, so a link that navigates away is still counted.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
