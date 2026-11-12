// Usage analytics, shared by the app (src/lib/analytics.ts) and the server (src/server/collect.ts).
// Every event the app may send is named here, with the properties it may carry. The server drops
// anything else, so a bug can't start sending workout or health data by accident.
//
// What is never sent (AGENTS.md, "Analytics and the admin panel"): weights, reps, heart rate, body
// weight, Health Connect or Apple Health readings, cycle data, location, names, emails, notes, and
// any advertising id (no IDFA, no Android advertising id, no ATT prompt).

/** Properties an event may carry: short strings, numbers and booleans only. */
export type Props = Record<string, string | number | boolean>;

const str = "s" as const;
const num = "n" as const;
const bool = "b" as const;
type Kind = typeof str | typeof num | typeof bool;

/** Event name → allowed properties and their kinds. */
export const EVENTS = {
  // Lifecycle
  first_open: {},
  app_open: { cold: bool },
  screen_view: { screen: str },
  // Setup wizard funnel
  onboarding_step: { step: num, name: str },
  onboarding_complete: { rerun: bool, goal: str, experience: str, days: num, preset: str, unit: str, healthPrefill: bool },
  // Training (counts and lengths only: no weights, reps or heart rate)
  workout_start: { minutes: num, exercises: num, call: str, overridden: bool, gymKind: str },
  workout_finish: { sets: num, minutes: num, auto: bool, prs: num, exercises: num, challenge: bool },
  workout_discard: { sets: num },
  // Features
  feature: { name: str, detail: str },
  permission: { name: str, granted: bool },
  feedback_sent: { kind: str },
  // Money (reported by the app until store server notifications land; see AGENTS.md)
  paywall_view: { from: str },
  paywall_close: { from: str },
  trial_start: { plan: str, store: str },
  purchase: { plan: str, store: str, price: num, currency: str, trial: bool },
  restore: { store: str },
  // What Pro did in the trial, shown to the lifter (trialRecap.ts): where (note, paywall, done), the trial stage,
  // and the counts behind it (adaptive workouts, weights raised, days adjusted). Once per stage and place per trial.
  trial_recap: { where: str, stage: str, workouts: num, raised: num, adjusted: num },
} as const satisfies Record<string, Record<string, Kind>>;

export type EventName = keyof typeof EVENTS;

/** One event as it travels from the app to the server. */
export interface WireEvent {
  /** Random id, so a retried batch is stored once. */
  id: string;
  name: EventName;
  /** Milliseconds since 1970, device clock. */
  at: number;
  props?: Props;
}

/** Where an install came from: the first touch the app saw. */
export interface Acquisition {
  /** web, play, appstore, testflight, sideload, unknown */
  store?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** Referrer host of the first site visit (web), or the Play install referrer string. */
  referrer?: string;
  /** First page seen on the site (web only). */
  landing?: string;
  /** Apple Search Ads attribution token (iOS, no ATT needed). Resolved on the server. */
  asaToken?: string;
}

/** The device and install the batch is from. No advertising id, no name, no account. */
export interface InstallContext {
  installId: string;
  platform: "android" | "ios" | "web";
  appVersion: string;
  build?: string;
  os?: string;
  osVersion?: string;
  manufacturer?: string;
  model?: string;
  /** phone, tablet or desktop */
  formFactor?: string;
  locale?: string;
  timeZone?: string;
  screen?: string;
  /** dark or light system theme, reduced motion, and so on: harmless, useful for design. */
  reducedMotion?: boolean;
  acquisition?: Acquisition;
}

export interface Batch {
  context: InstallContext;
  events: WireEvent[];
}

export const MAX_EVENTS = 100;
export const MAX_BATCH_BYTES = 64_000;
const MAX_STR = 120;
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const PLATFORMS = new Set(["android", "ios", "web"]);

const clip = (v: unknown, n = MAX_STR): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined);

/** Keeps only the properties the event allows, in the kind it allows. */
export function cleanProps(name: EventName, props: unknown): Props | undefined {
  if (!props || typeof props !== "object") return undefined;
  const spec = EVENTS[name] as Record<string, Kind>;
  const out: Props = {};
  for (const [k, kind] of Object.entries(spec)) {
    const v = (props as Record<string, unknown>)[k];
    if (kind === str && typeof v === "string" && v) out[k] = v.slice(0, 60);
    else if (kind === num && typeof v === "number" && Number.isFinite(v)) out[k] = Math.round(v * 100) / 100;
    else if (kind === bool && typeof v === "boolean") out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export const isEventName = (n: unknown): n is EventName => typeof n === "string" && Object.prototype.hasOwnProperty.call(EVENTS, n);

function cleanAcquisition(a: unknown): Acquisition | undefined {
  if (!a || typeof a !== "object") return undefined;
  const r = a as Record<string, unknown>;
  const out: Acquisition = {};
  for (const k of ["store", "source", "medium", "campaign", "content", "term", "referrer", "landing"] as const) {
    const v = clip(r[k], k === "referrer" ? 300 : MAX_STR);
    if (v) out[k] = v;
  }
  const t = clip(r.asaToken, 4000);
  if (t) out.asaToken = t;
  return Object.keys(out).length ? out : undefined;
}

export type CheckedBatch = { ok: true; batch: Batch } | { ok: false; error: string };

/** Checks a batch from the app. Unknown events and properties are dropped, not rejected. */
export function checkBatch(body: unknown, now = Date.now()): CheckedBatch {
  if (!body || typeof body !== "object") return { ok: false, error: "Not a batch" };
  const b = body as Record<string, unknown>;
  const c = b.context as Record<string, unknown> | undefined;
  if (!c || typeof c !== "object") return { ok: false, error: "No context" };
  if (typeof c.installId !== "string" || !SAFE_ID.test(c.installId)) return { ok: false, error: "Bad install id" };
  if (typeof c.platform !== "string" || !PLATFORMS.has(c.platform)) return { ok: false, error: "Bad platform" };
  if (!Array.isArray(b.events)) return { ok: false, error: "No events" };
  if (b.events.length > MAX_EVENTS) return { ok: false, error: "Too many events" };
  const context: InstallContext = {
    installId: c.installId,
    platform: c.platform as InstallContext["platform"],
    appVersion: clip(c.appVersion, 32) ?? "unknown",
  };
  for (const k of ["build", "os", "osVersion", "manufacturer", "model", "formFactor", "locale", "timeZone", "screen"] as const) {
    const v = clip(c[k], 64);
    if (v) context[k] = v;
  }
  if (typeof c.reducedMotion === "boolean") context.reducedMotion = c.reducedMotion;
  const acquisition = cleanAcquisition(c.acquisition);
  if (acquisition) context.acquisition = acquisition;
  const events: WireEvent[] = [];
  for (const e of b.events as unknown[]) {
    if (!e || typeof e !== "object") continue;
    const r = e as Record<string, unknown>;
    if (!isEventName(r.name) || typeof r.id !== "string" || !SAFE_ID.test(r.id) || typeof r.at !== "number") continue;
    // A clock far in the future, or a queue older than a year, isn't trustworthy.
    if (r.at > now + 86_400_000 || r.at < now - 366 * 86_400_000) continue;
    const props = cleanProps(r.name, r.props);
    events.push({ id: r.id, name: r.name, at: Math.round(r.at), ...(props ? { props } : {}) });
  }
  return { ok: true, batch: { context, events } };
}

// ---------- Website page views ----------

export interface PageView {
  /** Path only, never the query string (it can hold anything). */
  path: string;
  referrer?: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
  /** A click on a call to action ("Build my workout", store badges): its target. */
  cta?: string;
  screen?: string;
}

export function checkPageView(body: unknown): PageView | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const path = clip(b.path, 200);
  if (!path || !path.startsWith("/")) return null;
  const out: PageView = { path: path.split("?")[0].split("#")[0] };
  const ref = clip(b.referrer, 300);
  if (ref) out.referrer = ref;
  if (b.utm && typeof b.utm === "object") {
    const u = b.utm as Record<string, unknown>;
    const utm: NonNullable<PageView["utm"]> = {};
    for (const k of ["source", "medium", "campaign", "content", "term"] as const) {
      const v = clip(u[k], 80);
      if (v) utm[k] = v;
    }
    if (Object.keys(utm).length) out.utm = utm;
  }
  const cta = clip(b.cta, 80);
  if (cta) out.cta = cta;
  const screen = clip(b.screen, 20);
  if (screen) out.screen = screen;
  return out;
}

/** Reads utm_* parameters from a query string. */
export function utmFrom(search: string): PageView["utm"] | undefined {
  const q = new URLSearchParams(search);
  const utm: NonNullable<PageView["utm"]> = {};
  for (const k of ["source", "medium", "campaign", "content", "term"] as const) {
    const v = q.get(`utm_${k}`)?.trim();
    if (v) utm[k] = v.slice(0, 80);
  }
  // Common click ids say which ad network or platform sent the visit, without keeping the id itself.
  if (!utm.source) {
    if (q.has("gclid")) utm.source = "google";
    else if (q.has("fbclid")) utm.source = "facebook";
    else if (q.has("ttclid")) utm.source = "tiktok";
    else if (q.has("ref")) utm.source = q.get("ref")!.slice(0, 80);
  }
  return Object.keys(utm).length ? utm : undefined;
}

/** The host of a referrer URL, or undefined for none, our own site, or junk. */
export function referrerHost(ref: string | undefined, ownHost?: string): string | undefined {
  if (!ref) return undefined;
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (!h || (ownHost && h === ownHost.replace(/^www\./, ""))) return undefined;
    return h;
  } catch {
    return undefined;
  }
}

/** Reads a Play install referrer string ("utm_source=x&utm_medium=y") into acquisition fields. */
export function parsePlayReferrer(raw: string | undefined): Acquisition {
  if (!raw) return {};
  const q = new URLSearchParams(raw);
  const out: Acquisition = { referrer: raw.slice(0, 300) };
  const map = { utm_source: "source", utm_medium: "medium", utm_campaign: "campaign", utm_content: "content", utm_term: "term" } as const;
  for (const [k, f] of Object.entries(map)) {
    const v = q.get(k);
    if (v) out[f] = v.slice(0, MAX_STR);
  }
  // An untagged Play listing visit arrives as utm_source=google-play&utm_medium=organic: kept as is.
  return out;
}
