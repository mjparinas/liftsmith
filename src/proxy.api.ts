// Maintenance mode (src/lib/maintenance.ts): while an admin has it on, every API route and server-drawn page except
// a few machine endpoints answers 503 with a short message. Static pages stay up (see `config` below). Named .api.ts
// so only the server build (Vercel) has it; the static export for the Android and iOS apps can't run a proxy.
import { NextResponse, type NextRequest } from "next/server";

import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import {
  MAINTENANCE_HEADER,
  MAINTENANCE_MESSAGE,
  MAINTENANCE_RETRY_SECONDS,
  maintenancePage,
  openDuringMaintenance,
} from "@/lib/maintenance";
import { maintenanceOn } from "@/server/maintenance";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (openDuringMaintenance(pathname) || !(await maintenanceOn())) return NextResponse.next();
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Retry-After": String(MAINTENANCE_RETRY_SECONDS),
    [MAINTENANCE_HEADER]: "on",
  };
  // Native apps call the API from their own origin; let them read the answer so sync can say why it waits.
  const origin = request.headers.get("origin");
  if (pathname.startsWith("/api/")) {
    if (origin && NATIVE_ORIGINS.has(origin)) Object.assign(headers, { "Access-Control-Allow-Origin": origin, Vary: "Origin" });
    return NextResponse.json({ error: MAINTENANCE_MESSAGE }, { status: 503, headers });
  }
  return new NextResponse(maintenancePage(), { status: 503, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}

// Only what the server draws per request: API routes and the pages rewritten to them (share links, public profiles,
// the gym finder and their sitemaps, next.config.ts). Every other page is a static file from the CDN that never reads
// the database, so it stays up during maintenance and doesn't pay for a function call on every visit (about 70 ms,
// plus a cold start now and then; Melvin, 2026-11-13, docs/decisions/speed.md).
export const config = {
  matcher: ["/api/:path*", "/w/:path*", "/u/:path*", "/gyms/:path*", "/sitemap-people.xml", "/sitemap-gyms.xml"],
};
