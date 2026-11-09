"use client";
// Vercel Web Analytics on the public website only (Melvin, 2026-11-09). It's cookieless and keeps no
// personal data; it sits beside our own counter (SiteBeacon) as a second, independent view of traffic.
// Left out of the static export (the Android and iOS apps and the browser tests), because /_vercel/insights
// only exists on Vercel. The app (/app/), the admin panel and the lifter's dashboard are never counted.
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { isPublicPath } from "./SiteBeacon";

/** A Global Privacy Control signal turns it off, as it does our own counter. */
const gpcOn = () => typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

/** Drops page views from the app, admin and dashboard, and strips query strings (UTM tags stay in our own counter). */
export function keepEvent(event: BeforeSendEvent, gpc = gpcOn()): BeforeSendEvent | null {
  if (gpc) return null;
  let url: URL;
  try {
    url = new URL(event.url);
  } catch {
    return null;
  }
  if (!isPublicPath(url.pathname)) return null;
  return { ...event, url: url.origin + url.pathname };
}

export function VercelAnalytics() {
  if (process.env.NEXT_PUBLIC_STATIC === "1") return null;
  return <Analytics beforeSend={keepEvent} />;
}
