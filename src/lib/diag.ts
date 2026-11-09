"use client";
// Diagnostics attached to feedback when the lifter allows it: app version, platform, screen, the
// current screen route and the last few errors. Never workout history, health data or names.
import { isNative } from "./juice";

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

const MAX = 30;
const errors: string[] = [];
let installed = false;

export function recordError(msg: string) {
  errors.push(`${new Date().toISOString()} ${msg.slice(0, 500)}`);
  if (errors.length > MAX) errors.shift();
}

/** Keeps the last 30 errors in memory (never stored) so a bug report can include them. */
export function installDiag() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => recordError(`${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => recordError(`Unhandled: ${String((e as PromiseRejectionEvent).reason)}`));
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    recordError(args.map((a) => (a instanceof Error ? a.message : String(a))).join(" "));
    orig.apply(console, args);
  };
}

export interface Diagnostics {
  version: string;
  platform: string;
  userAgent: string;
  screen: string;
  language: string;
  timeZone: string;
  route: string;
  online: boolean;
  errors: string[];
}

export function diagnostics(): Diagnostics {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const native = isNative();
  return {
    version: APP_VERSION,
    platform: native ? (/iPhone|iPad/.test(ua) ? "ios" : "android") : "web",
    userAgent: ua,
    screen: typeof screen !== "undefined" ? `${screen.width}x${screen.height}@${window.devicePixelRatio ?? 1}` : "",
    language: typeof navigator !== "undefined" ? navigator.language : "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    route: typeof location !== "undefined" ? location.hash : "",
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    errors: [...errors],
  };
}
