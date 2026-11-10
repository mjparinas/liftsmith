"use client";

// First-party usage analytics for the admin panel (Melvin, 2026-11-09: "whatever data we can store,
// save it"). Events go to an outbox in localStorage first, so nothing is lost offline, and are sent
// in batches to /api/collect/ when there's a connection. The allow-list of events and properties is
// in analyticsSchema.ts; the server drops everything else.
//
// The install id is a random id made on first open. It is not an advertising id, isn't shared with
// anyone, and is reset by "Erase this device". The lifter can switch analytics off in Settings;
// in the EU, EEA, UK and Switzerland it starts off until they switch it on (ePrivacy consent).
import {
  cleanProps,
  MAX_EVENTS,
  parsePlayReferrer,
  referrerHost,
  utmFrom,
  type Acquisition,
  type EventName,
  type InstallContext,
  type Props,
  type WireEvent,
} from "./analyticsSchema";
import { APP_VERSION } from "./diag";
import { installInfo } from "./installInfo";
import { isNative } from "./juice";
import { SITE_URL } from "./site";

export const ID_KEY = "liftsmith.installId";
export const CONSENT_KEY = "liftsmith.analytics";
export const OUTBOX_KEY = "liftsmith.analyticsOutbox";
export const TOUCH_KEY = "liftsmith.firstTouch";
const MAX_QUEUE = 500;

function uid(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function put(key: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch {}
}

/** Time zones where analytics needs an explicit yes (EU, EEA, UK, Switzerland). */
export function needsOptIn(timeZone: string): boolean {
  if (
    /^Europe\//.test(timeZone) &&
    !/^Europe\/(Moscow|Minsk|Istanbul|Kiev|Kyiv|Simferopol|Volgograd|Kirov|Astrakhan|Saratov|Ulyanovsk|Samara)$/.test(timeZone)
  )
    return true;
  return /^(Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Arctic\/Longyearbyen)$/.test(timeZone);
}

const zone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
};

/** Whether usage stats are on: the lifter's own choice, or the default for where they are. */
export function analyticsOn(): boolean {
  const v = get(CONSENT_KEY);
  if (v === "on") return true;
  if (v === "off") return false;
  return !needsOptIn(zone());
}

/** True when the lifter hasn't chosen yet (the wizard asks then). */
export const consentAsked = () => get(CONSENT_KEY) !== null;

export function setAnalytics(on: boolean) {
  put(CONSENT_KEY, on ? "on" : "off");
  // Switching off drops whatever was waiting to go.
  if (!on) put(OUTBOX_KEY, null);
}

export function installId(): string {
  let id = get(ID_KEY);
  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = uid();
    put(ID_KEY, id);
  }
  return id;
}

/** "Erase this device" also forgets the install id and anything waiting to be sent. */
export function forgetAnalytics() {
  for (const k of [ID_KEY, OUTBOX_KEY, TOUCH_KEY]) put(k, null);
}

function read(): WireEvent[] {
  try {
    return JSON.parse(get(OUTBOX_KEY) ?? "[]") as WireEvent[];
  } catch {
    return [];
  }
}
const write = (xs: WireEvent[]) => put(OUTBOX_KEY, JSON.stringify(xs.slice(-MAX_QUEUE)));

export const queued = () => read().length;

/** Records an event. Never throws, never blocks a tap. */
export function track(name: EventName, props?: Props, at = Date.now()) {
  if (typeof window === "undefined" || !analyticsOn()) return;
  const clean = cleanProps(name, props);
  write([...read(), { id: uid().replace(/[^A-Za-z0-9_-]/g, ""), name, at, ...(clean ? { props: clean } : {}) }]);
  scheduleFlush();
}

// ---------- First touch (how the lifter found us) ----------

/**
 * On the website, remembers the first visit's source (UTM tags, referrer, landing page) so the web
 * app's install can be credited to it. Called by the public-page beacon and the app.
 */
export function rememberFirstTouch(
  loc: Pick<Location, "search" | "pathname" | "hostname"> = location,
  ref = typeof document !== "undefined" ? document.referrer : "",
) {
  if (get(TOUCH_KEY)) return;
  const utm = utmFrom(loc.search);
  const host = referrerHost(ref, loc.hostname);
  const touch: Acquisition = { landing: loc.pathname.slice(0, 120), ...(host ? { referrer: host } : {}), ...(utm ?? {}) };
  put(TOUCH_KEY, JSON.stringify(touch));
}

function firstTouch(): Acquisition {
  try {
    return JSON.parse(get(TOUCH_KEY) ?? "{}") as Acquisition;
  } catch {
    return {};
  }
}

// ---------- Device and install ----------

function formFactor(): string {
  const w = Math.min(screen.width, screen.height);
  return w >= 600 ? (isNative() || /Mobi|Android|iPad/.test(navigator.userAgent) ? "tablet" : "desktop") : "phone";
}

/** Browser and OS from the user agent, for the web build (native builds ask the OS). */
export function fromUserAgent(ua: string): Pick<InstallContext, "os" | "osVersion" | "model"> {
  const ios = /(iPhone|iPad|iPod).*OS (\d+)[_.](\d+)/.exec(ua);
  if (ios) return { os: "iOS", osVersion: `${ios[2]}.${ios[3]}`, model: ios[1] };
  const android = /Android (\d+(?:\.\d+)?)(?:;\s*([^;)]+))?/.exec(ua);
  if (android) return { os: "Android", osVersion: android[1], model: android[2]?.replace(/ Build\/.*/, "").trim() };
  const mac = /Mac OS X (\d+)[_.](\d+)/.exec(ua);
  if (mac) return { os: "macOS", osVersion: `${mac[1]}.${mac[2]}` };
  const win = /Windows NT (\d+\.\d+)/.exec(ua);
  if (win) return { os: "Windows", osVersion: win[1] };
  if (/CrOS/.test(ua)) return { os: "ChromeOS" };
  if (/Linux/.test(ua)) return { os: "Linux" };
  return {};
}

let ctx: Promise<InstallContext> | null = null;

/** The install's device and source, read once per launch. */
export function context(): Promise<InstallContext> {
  ctx ??= (async () => {
    const native = isNative();
    const ua = navigator.userAgent;
    const info = native ? await installInfo() : null;
    const platform: InstallContext["platform"] = native ? (info?.platform ?? (/iPhone|iPad/.test(ua) ? "ios" : "android")) : "web";
    const base: InstallContext = {
      installId: installId(),
      platform,
      appVersion: info?.appVersion ?? APP_VERSION,
      ...(info?.build ? { build: info.build } : {}),
      ...(native && info
        ? { os: info.os, osVersion: info.osVersion, manufacturer: info.manufacturer, model: info.model }
        : fromUserAgent(ua)),
      formFactor: formFactor(),
      locale: navigator.language,
      timeZone: zone(),
      screen: `${screen.width}x${screen.height}@${window.devicePixelRatio ?? 1}`,
      reducedMotion: typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)").matches : false,
    };
    let acquisition: Acquisition;
    if (!native) acquisition = { store: "web", ...firstTouch() };
    else if (platform === "android") acquisition = { store: info?.store ?? "unknown", ...parsePlayReferrer(info?.installReferrer) };
    else acquisition = { store: info?.store ?? "unknown", ...(info?.asaToken ? { asaToken: info.asaToken } : {}) };
    return { ...base, acquisition };
  })();
  return ctx;
}

/** The store this build belongs to, for purchase events: play, appstore or web. */
export function platformStore(): string {
  if (!isNative()) return "web";
  return typeof navigator !== "undefined" && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? "appstore" : "play";
}

// ---------- Sending ----------

/** Native apps load from a local origin, so they post to the real site. */
export const collectUrl = () => (isNative() || typeof location === "undefined" ? `${SITE_URL}/api/collect/` : "/api/collect/");

/** The static export served on the web (browser tests, previews) has no server to send to. */
const canSend = () => isNative() || process.env.NEXT_PUBLIC_STATIC !== "1";

const REJECTED = new Set([400, 413, 422]);
let flushing: Promise<number> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (timer || typeof window === "undefined") return;
  // Shortly after a change, so a burst of events goes in one request.
  timer = setTimeout(() => {
    timer = null;
    void flushAnalytics();
  }, 5_000);
}

/** Sends everything waiting, in batches. Returns how many are still waiting. */
export function flushAnalytics(post: typeof fetch = fetch): Promise<number> {
  flushing ??= (async () => {
    try {
      if (!analyticsOn() || !canSend()) return read().length;
      while (read().length) {
        const batch = read().slice(0, MAX_EVENTS);
        try {
          const r = await post(collectUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context: await context(), events: batch }),
            keepalive: true,
          });
          // Rejected outright: drop it so it can't block the queue. Anything else (offline, 404 before the
          // server is deployed, 429, 5xx) keeps it for a later try.
          if (r.ok || REJECTED.has(r.status)) {
            const sent = new Set(batch.map((e) => e.id));
            write(read().filter((e) => !sent.has(e.id)));
          } else break;
        } catch {
          break;
        }
      }
      return read().length;
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** For tests. */
export function resetAnalyticsState() {
  ctx = null;
  flushing = null;
  if (timer) clearTimeout(timer);
  timer = null;
}

// ---------- Wiring for the app ----------

let started = false;

/** Called once when the app starts: first open, app opens, and sending on reconnect and on leave. */
export function startAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  rememberFirstTouch();
  if (!get("liftsmith.firstOpenAt")) {
    put("liftsmith.firstOpenAt", String(Date.now()));
    track("first_open");
  }
  track("app_open", { cold: true });
  void flushAnalytics();
  window.addEventListener("online", () => void flushAnalytics());
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      void flushAnalytics();
    } else if (hiddenAt && Date.now() - hiddenAt > 30 * 60_000) {
      // Back after half an hour away counts as a new open (as most analytics tools do).
      track("app_open", { cold: false });
    }
  });
}
