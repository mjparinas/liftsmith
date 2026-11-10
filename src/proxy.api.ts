// Maintenance mode (src/lib/maintenance.ts): while an admin has it on, every page and API route except the home
// page, the admin panel, the web app and a few machine endpoints answers 503 with a short message. Named .api.ts
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

// Everything but build files and files with an extension.
export const config = { matcher: "/((?!_next/static|_next/image|.*\\.[A-Za-z0-9]+$).*)" };
