// Connected cloud services (docs/decisions/connected-apps.md): the OAuth exchange, token storage and the
// few API calls each service needs. Strava receives finished workouts; Oura, Whoop, Withings and Polar send
// sleep, HRV, resting heart rate, breathing rate, steps and (Withings) weigh-ins in, which the app stores like
// Health Connect's; Concept2 sends rows, ski and bike sessions in as cardio. Readings and sessions pass
// through and are never stored here. Each service needs its own client id and secret in Vercel
// (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET, OURA_…, WHOOP_…, WITHINGS_…, POLAR_…, CONCEPT2_…); without them its
// row in the app says "Coming soon" and every route for it answers 503. Sonos (SONOS_…) takes play, skip and volume
// commands from the workout (src/server/sonos.ts).
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import {
  CLOUD,
  type Cloud,
  type CloudCardio,
  type CloudReading,
  type CloudStatus,
  type CloudWorkout,
  type ReadingCloud,
} from "@/lib/cloud";
import { SITE_URL } from "@/lib/site";
import type { HealthMetric } from "@/lib/types";

import { query, run } from "./db";

type Fetch = typeof fetch;

interface Provider {
  authorize: string;
  token: string;
  scope: string;
  /** Strava wants its scopes comma-separated; the others space-separated (already in `scope`). */
  extra?: Record<string, string>;
  /** Polar takes the client id and secret as HTTP Basic auth on the token call, not in the body. */
  basic?: boolean;
  /** Withings: every token call carries action=requesttoken, and the reply is wrapped in { status, body }. */
  withings?: boolean;
}

export const PROVIDERS: Record<Cloud, Provider> = {
  strava: {
    authorize: "https://www.strava.com/oauth/authorize",
    token: "https://www.strava.com/oauth/token",
    scope: "activity:write,read",
    extra: { approval_prompt: "auto" },
  },
  oura: {
    authorize: "https://cloud.ouraring.com/oauth/authorize",
    token: "https://api.ouraring.com/oauth/token",
    scope: "daily heartrate",
  },
  whoop: {
    authorize: "https://api.prod.whoop.com/oauth/oauth2/auth",
    token: "https://api.prod.whoop.com/oauth/oauth2/token",
    scope: "offline read:recovery read:sleep",
  },
  withings: {
    authorize: "https://account.withings.com/oauth2_user/authorize2",
    token: "https://wbsapi.withings.net/v2/oauth2",
    // Withings separates scopes with commas.
    scope: "user.metrics,user.activity",
    withings: true,
  },
  polar: {
    authorize: "https://flow.polar.com/oauth2/authorization",
    token: "https://polarremote.com/v2/oauth2/token",
    scope: "accesslink.read_all",
    basic: true,
  },
  concept2: {
    authorize: "https://log.concept2.com/oauth/authorize",
    token: "https://log.concept2.com/oauth/access_token",
    scope: "user:read,results:read",
  },
  // Sonos's Control API (a lab, docs/decisions/sonos.md): HTTP Basic auth on the token call, like Polar.
  sonos: {
    authorize: "https://api.sonos.com/login/v3/oauth",
    token: "https://api.sonos.com/login/v3/oauth/access",
    scope: "playback-control-all",
    basic: true,
  },
};

const ENV: Record<Cloud, string> = {
  strava: "STRAVA",
  oura: "OURA",
  whoop: "WHOOP",
  withings: "WITHINGS",
  polar: "POLAR",
  concept2: "CONCEPT2",
  sonos: "SONOS",
};
const STATE_MS = 15 * 60_000;

export function keys(p: Cloud, env: NodeJS.ProcessEnv = process.env): { id: string; secret: string } | null {
  const id = env[`${ENV[p]}_CLIENT_ID`]?.trim();
  const secret = env[`${ENV[p]}_CLIENT_SECRET`]?.trim();
  return id && secret ? { id, secret } : null;
}

export const redirectUri = (p: Cloud) => `${SITE_URL}/api/connect/${p}/callback/`;

// --- Tokens at rest: AES-256-GCM with a key made from the service's own client secret. ---

const keyFor = (secret: string) => createHash("sha256").update(`liftsmith-connect:${secret}`).digest();

export function seal(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFor(secret), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, body, c.getAuthTag()].map((b) => b.toString("base64url")).join(".");
}

/** Null when it can't be opened (the secret changed): the lifter connects again. */
export function unseal(sealed: string, secret: string): string | null {
  try {
    const [iv, body, tag] = sealed.split(".").map((s) => Buffer.from(s, "base64url"));
    if (!iv || !body || !tag) return null;
    const d = createDecipheriv("aes-256-gcm", keyFor(secret), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(body), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// --- Status, start, callback, disconnect ---

export async function status(accountId: string, env: NodeJS.ProcessEnv = process.env): Promise<CloudStatus> {
  const rows = await query<{ provider: string; created_at: number; who: string | null }>(
    "SELECT provider, created_at, who FROM connections WHERE account_id = ?",
    [accountId],
  );
  const ready = Object.fromEntries(CLOUD.map((p) => [p, !!keys(p, env)])) as Record<Cloud, boolean>;
  const linked: CloudStatus["linked"] = {};
  for (const r of rows) {
    const p = r.provider as Cloud;
    if (CLOUD.includes(p)) linked[p] = { since: Number(r.created_at), ...(r.who ? { who: r.who } : {}) };
  }
  return { ready, linked };
}

/** A one-time state and the service's sign-in page for it. */
export async function start(
  accountId: string,
  p: Cloud,
  platform: string,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<string | null> {
  const k = keys(p, env);
  if (!k) return null;
  const state = randomBytes(24).toString("base64url");
  await run("DELETE FROM connect_states WHERE expires_at < ?", [now]);
  await run("INSERT INTO connect_states (state, account_id, provider, platform, expires_at) VALUES (?, ?, ?, ?, ?)", [
    state,
    accountId,
    p,
    platform === "ios" || platform === "android" ? platform : "web",
    now + STATE_MS,
  ]);
  const cfg = PROVIDERS[p];
  const q = new URLSearchParams({
    client_id: k.id,
    redirect_uri: redirectUri(p),
    response_type: "code",
    scope: cfg.scope,
    state,
    ...cfg.extra,
  });
  return `${cfg.authorize}?${q}`;
}

interface TokenReply {
  access_token?: string;
  refresh_token?: string;
  /** Seconds from now (Oura, Whoop). */
  expires_in?: number;
  /** Unix seconds (Strava). */
  expires_at?: number;
  athlete?: { firstname?: string; lastname?: string };
  /** Polar's user id, needed to register and later remove the lifter at AccessLink. */
  x_user_id?: number | string;
}

async function tokenCall(p: Cloud, body: Record<string, string>, f: Fetch, env: NodeJS.ProcessEnv): Promise<TokenReply> {
  const k = keys(p, env);
  if (!k) throw new Error("not set up");
  const cfg = PROVIDERS[p];
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  if (cfg.basic) headers.Authorization = `Basic ${Buffer.from(`${k.id}:${k.secret}`).toString("base64")}`;
  const form = {
    ...(cfg.basic ? {} : { client_id: k.id, client_secret: k.secret }),
    ...(cfg.withings ? { action: "requesttoken" } : {}),
    ...body,
  };
  const r = await f(cfg.token, { method: "POST", headers, body: new URLSearchParams(form).toString() });
  const raw = (await r.json().catch(() => ({}))) as TokenReply & { status?: number; body?: TokenReply };
  // Withings answers 200 with its own status, 0 when it worked, and the tokens under `body`.
  const j = cfg.withings ? (raw.status === 0 ? (raw.body ?? {}) : {}) : raw;
  if (!r.ok || !j.access_token) throw new Error(`${p} token ${r.status}`);
  return j;
}

const expiry = (j: TokenReply, now: number) =>
  j.expires_at ? j.expires_at * 1000 : now + (j.expires_in && j.expires_in > 0 ? j.expires_in * 1000 : 3_600_000);

async function save(accountId: string, p: Cloud, j: TokenReply, who: string | null, env: NodeJS.ProcessEnv, now: number) {
  const k = keys(p, env)!;
  const remote = j.x_user_id === undefined ? null : String(j.x_user_id);
  await run(
    `INSERT INTO connections (account_id, provider, access_token, refresh_token, expires_at, who, created_at, remote_user)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id, provider) DO UPDATE SET access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, connections.refresh_token), expires_at = excluded.expires_at,
       who = COALESCE(excluded.who, connections.who), remote_user = COALESCE(excluded.remote_user, connections.remote_user)`,
    [
      accountId,
      p,
      seal(j.access_token!, k.secret),
      j.refresh_token ? seal(j.refresh_token, k.secret) : null,
      expiry(j, now),
      who,
      now,
      remote,
    ],
  );
}

const POLAR = "https://www.polaraccesslink.com/v3";

/**
 * Polar's AccessLink only shares a lifter's data once the app registers them, once, after they allow it. A
 * 409 means they were registered before (connected, removed here, connected again), which is fine.
 */
async function registerPolar(accountId: string, token: string, f: Fetch): Promise<boolean> {
  const r = await f(`${POLAR}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    // Polar asks for our own id for the member; a hash keeps the account id itself out of Polar.
    body: JSON.stringify({ "member-id": createHash("sha256").update(`liftsmith-polar:${accountId}`).digest("hex").slice(0, 32) }),
  }).catch(() => null);
  return !!r && (r.ok || r.status === 409);
}

/**
 * The service sent the lifter back with a code: use up the state, swap the code for tokens and keep them.
 * Returns where the lifter started (to send them back there), or null when the state or code was no good.
 */
export async function callback(
  p: Cloud,
  state: string,
  code: string,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<{ platform: string } | null> {
  if (!state || !code || state.length > 100 || code.length > 2000) return null;
  const rows = await query<{ account_id: string; provider: string; platform: string; expires_at: number }>(
    "DELETE FROM connect_states WHERE state = ? RETURNING account_id, provider, platform, expires_at",
    [state],
  );
  const s = rows[0];
  if (!s || s.provider !== p || Number(s.expires_at) < now) return null;
  const j = await tokenCall(p, { code, grant_type: "authorization_code", redirect_uri: redirectUri(p) }, f, env).catch(() => null);
  if (!j) return null;
  const who = p === "strava" ? [j.athlete?.firstname, j.athlete?.lastname].filter(Boolean).join(" ") || null : null;
  if (p === "polar" && !(await registerPolar(String(s.account_id), j.access_token!, f))) return null;
  await save(String(s.account_id), p, j, who, env, now);
  return { platform: String(s.platform) };
}

/** A working access token, refreshed first when it's about to run out. Null when not connected or refused. */
export async function accessToken(
  accountId: string,
  p: Cloud,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<string | null> {
  const k = keys(p, env);
  if (!k) return null;
  const rows = await query<{ access_token: string; refresh_token: string | null; expires_at: number }>(
    "SELECT access_token, refresh_token, expires_at FROM connections WHERE account_id = ? AND provider = ?",
    [accountId, p],
  );
  const r = rows[0];
  if (!r) return null;
  if (Number(r.expires_at) - 120_000 > now) return unseal(r.access_token, k.secret);
  const refresh = r.refresh_token ? unseal(r.refresh_token, k.secret) : null;
  if (!refresh) return null;
  const extra: Record<string, string> = p === "whoop" ? { scope: "offline" } : {};
  const j = await tokenCall(p, { grant_type: "refresh_token", refresh_token: refresh, ...extra }, f, env).catch(() => null);
  if (!j) return null;
  await save(accountId, p, j, null, env, now);
  return j.access_token!;
}

/** Revokes the token at the service (best effort) and forgets it here. */
export async function disconnect(accountId: string, p: Cloud, f: Fetch = fetch, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const token = await accessToken(accountId, p, f, env).catch(() => null);
  const remote =
    p === "polar"
      ? (
          await query<{ remote_user: string | null }>("SELECT remote_user FROM connections WHERE account_id = ? AND provider = ?", [
            accountId,
            p,
          ])
        )[0]?.remote_user
      : null;
  if (token) {
    // Withings, Concept2 and Sonos have no plain token revoke; the lifter can remove Liftsmith in their own account.
    const none = () => Promise.resolve();
    const revoke: Record<Cloud, () => Promise<unknown>> = {
      strava: () =>
        f("https://www.strava.com/oauth/deauthorize", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ access_token: token }).toString(),
        }),
      oura: () => f(`https://api.ouraring.com/oauth/revoke?access_token=${encodeURIComponent(token)}`),
      whoop: () =>
        f("https://api.prod.whoop.com/developer/v2/user/access", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }),
      // Removing the user at AccessLink ends Liftsmith's access to their Polar data.
      polar: () =>
        remote
          ? f(`${POLAR}/users/${encodeURIComponent(remote)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
          : none(),
      withings: none,
      concept2: none,
      sonos: none,
    };
    await revoke[p]().catch(() => null);
  }
  await run("DELETE FROM connections WHERE account_id = ? AND provider = ?", [accountId, p]);
  await run("DELETE FROM connect_uploads WHERE account_id = ? AND provider = ?", [accountId, p]);
}

/** Every connection of an account, revoked and forgotten (account deletion). */
export async function forgetAll(accountId: string, f: Fetch = fetch, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  for (const p of CLOUD) await disconnect(accountId, p, f, env).catch(() => null);
  await run("DELETE FROM connections WHERE account_id = ?", [accountId]);
  await run("DELETE FROM connect_states WHERE account_id = ?", [accountId]);
  await run("DELETE FROM connect_uploads WHERE account_id = ?", [accountId]);
}

// --- Strava: post a finished workout ---

export function checkWorkout(raw: unknown): CloudWorkout | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : null);
  const sessionId = str(w.sessionId, 100);
  const name = str(w.name, 120);
  const description = typeof w.description === "string" && w.description.length <= 4000 ? w.description : null;
  const startLocal = str(w.startLocal, 19);
  const seconds = typeof w.seconds === "number" && Number.isFinite(w.seconds) && w.seconds > 0 && w.seconds < 86_400 ? w.seconds : null;
  if (!sessionId || !name || description === null || !startLocal || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(startLocal) || !seconds)
    return null;
  return { sessionId, name, description, startLocal, seconds: Math.round(seconds) };
}

/** "posted" (now or before), "unlinked" (not connected or the token was refused) or "failed" (try again later). */
export async function postWorkout(
  accountId: string,
  w: CloudWorkout,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<"posted" | "unlinked" | "failed"> {
  const done = await query("SELECT 1 FROM connect_uploads WHERE account_id = ? AND provider = 'strava' AND session_id = ?", [
    accountId,
    w.sessionId,
  ]);
  if (done.length) return "posted";
  const token = await accessToken(accountId, "strava", f, env, now);
  if (!token) return "unlinked";
  const r = await f("https://www.strava.com/api/v3/activities", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name: w.name,
      sport_type: "WeightTraining",
      type: "WeightTraining",
      // Strava reads start_date_local as the lifter's own clock time, whatever zone is written on it.
      start_date_local: `${w.startLocal}Z`,
      elapsed_time: String(w.seconds),
      description: w.description,
    }).toString(),
  }).catch(() => null);
  if (!r) return "failed";
  if (r.status === 401) return "unlinked";
  if (!r.ok) return "failed";
  const j = (await r.json().catch(() => ({}))) as { id?: number | string };
  await run("INSERT OR IGNORE INTO connect_uploads (account_id, provider, session_id, remote_id, at) VALUES (?, 'strava', ?, ?, ?)", [
    accountId,
    w.sessionId,
    j.id === undefined ? null : String(j.id),
    now,
  ]);
  return "posted";
}

// --- Oura and Whoop: daily readings in ---

const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

/** YYYY-MM-DD for a moment, in a zone given as minutes ahead of UTC. */
export function dayAt(t: number, offsetMin: number): string {
  return new Date(t + offsetMin * 60_000).toISOString().slice(0, 10);
}

/** "-05:00" or "+0530" to minutes ahead of UTC. */
export function offsetMinutes(s: string | undefined, fallback: number): number {
  const m = /^([+-])(\d\d):?(\d\d)$/.exec(s ?? "");
  if (!m) return fallback;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

interface OuraSleep {
  day?: string;
  type?: string;
  total_sleep_duration?: number | null;
  average_hrv?: number | null;
  lowest_heart_rate?: number | null;
  average_breath?: number | null;
  bedtime_end?: string;
}

/** Oura's sleep periods and daily activity as one reading per metric per day. Exported for tests. */
export function ouraReadings(
  sleep: readonly OuraSleep[],
  activity: readonly { day?: string; steps?: number | null }[],
  today: string,
): CloudReading[] {
  const out: CloudReading[] = [];
  const nights = new Map<string, { secs: number; main?: OuraSleep; at: number }>();
  for (const s of sleep) {
    if (!s.day) continue;
    const at = Date.parse(s.bedtime_end ?? "") || Date.parse(`${s.day}T08:00:00Z`);
    const n = nights.get(s.day) ?? { secs: 0, at: 0 };
    n.secs += s.total_sleep_duration ?? 0;
    n.at = Math.max(n.at, at);
    // The night's main sleep carries the overnight HRV, lowest heart rate and breathing.
    if (s.type === "long_sleep" || (!n.main && s.type !== "late_nap")) n.main = s;
    nights.set(s.day, n);
  }
  const push = (
    metric: HealthMetric,
    day: string,
    value: number | null | undefined,
    ok: (v: number) => boolean,
    at: number,
    places = 1,
  ) => {
    if (typeof value === "number" && Number.isFinite(value) && ok(value)) out.push({ metric, day, value: round(value, places), at });
  };
  for (const [day, n] of nights) {
    push("sleep", day, n.secs / 3600, (v) => v >= 1 && v <= 16, n.at, 2);
    push("hrv", day, n.main?.average_hrv, (v) => v > 5 && v < 300, n.at);
    push("restingHr", day, n.main?.lowest_heart_rate, (v) => v > 25 && v < 130, n.at);
    push("breathing", day, n.main?.average_breath, (v) => v > 4 && v < 40, n.at);
  }
  // Only finished days: today's step count is still growing.
  for (const a of activity)
    if (a.day && a.day < today) push("steps", a.day, a.steps, (v) => v > 0 && v < 100_000, Date.parse(`${a.day}T23:59:00Z`), 0);
  return out.sort((a, b) => a.at - b.at);
}

interface WhoopSleep {
  id?: string | number;
  end?: string;
  timezone_offset?: string;
  nap?: boolean;
  score_state?: string;
  score?: { stage_summary?: { total_in_bed_time_milli?: number; total_awake_time_milli?: number }; respiratory_rate?: number };
}
interface WhoopRecovery {
  sleep_id?: string | number;
  created_at?: string;
  score_state?: string;
  score?: { resting_heart_rate?: number; hrv_rmssd_milli?: number };
}

/** Whoop's sleeps and recoveries as one reading per metric per day (the day each night ended). Exported for tests. */
export function whoopReadings(sleeps: readonly WhoopSleep[], recoveries: readonly WhoopRecovery[], tzMin: number): CloudReading[] {
  const out: CloudReading[] = [];
  const nightOf = new Map<string, { day: string; at: number }>();
  const asleep = new Map<string, { ms: number; at: number; breath?: number }>();
  for (const s of sleeps) {
    const end = Date.parse(s.end ?? "");
    if (!Number.isFinite(end) || s.score_state !== "SCORED") continue;
    const day = dayAt(end, offsetMinutes(s.timezone_offset, tzMin));
    if (s.id !== undefined) nightOf.set(String(s.id), { day, at: end });
    const st = s.score?.stage_summary;
    const ms = Math.max(0, (st?.total_in_bed_time_milli ?? 0) - (st?.total_awake_time_milli ?? 0));
    const cur = asleep.get(day) ?? { ms: 0, at: 0 };
    cur.ms += ms;
    cur.at = Math.max(cur.at, end);
    if (!s.nap && s.score?.respiratory_rate) cur.breath = s.score.respiratory_rate;
    asleep.set(day, cur);
  }
  for (const [day, v] of asleep) {
    const h = v.ms / 3_600_000;
    if (h >= 1 && h <= 16) out.push({ metric: "sleep", day, value: round(h, 2), at: v.at });
    if (v.breath && v.breath > 4 && v.breath < 40) out.push({ metric: "breathing", day, value: round(v.breath, 1), at: v.at });
  }
  for (const r of recoveries) {
    if (r.score_state !== "SCORED" || !r.score) continue;
    const night = r.sleep_id !== undefined ? nightOf.get(String(r.sleep_id)) : undefined;
    const created = Date.parse(r.created_at ?? "");
    const at = night?.at ?? created;
    if (!Number.isFinite(at)) continue;
    const day = night?.day ?? dayAt(at, tzMin);
    const hrv = r.score.hrv_rmssd_milli;
    const rhr = r.score.resting_heart_rate;
    if (hrv && hrv > 5 && hrv < 300) out.push({ metric: "hrv", day, value: round(hrv, 1), at });
    if (rhr && rhr > 25 && rhr < 130) out.push({ metric: "restingHr", day, value: round(rhr, 1), at });
  }
  return out.sort((a, b) => a.at - b.at);
}

// --- Withings: weigh-ins, body fat, steps and sleep ---

interface WithingsGroup {
  date?: number;
  category?: number;
  measures?: { value?: number; type?: number; unit?: number }[];
}
interface WithingsSleep {
  date?: string;
  data?: { total_sleep_time?: number; hr_min?: number; rr_average?: number };
}

/**
 * Withings' measure groups (weight type 1, fat ratio type 6; value × 10^unit), finished days' steps, and
 * nights' sleep, as one reading per metric per day. The last weigh-in of a day wins. Exported for tests.
 */
export function withingsReadings(
  groups: readonly WithingsGroup[],
  activity: readonly { date?: string; steps?: number }[],
  sleep: readonly WithingsSleep[],
  tzMin: number,
  today: string,
): CloudReading[] {
  const out: CloudReading[] = [];
  const last = new Map<string, CloudReading>();
  for (const g of groups) {
    // Category 1 is a real measurement; 2 is a goal the lifter typed.
    if (!g.date || (g.category !== undefined && g.category !== 1)) continue;
    const at = g.date * 1000;
    const day = dayAt(at, tzMin);
    for (const m of g.measures ?? []) {
      if (typeof m.value !== "number" || typeof m.unit !== "number") continue;
      const v = m.value * 10 ** m.unit;
      const metric = m.type === 1 ? "weight" : m.type === 6 ? "bodyFat" : null;
      if (!metric) continue;
      if (metric === "weight" ? v < 25 || v > 350 : v < 2 || v > 70) continue;
      const key = `${metric}|${day}`;
      const prev = last.get(key);
      if (!prev || prev.at <= at) last.set(key, { metric, day, value: round(v, metric === "weight" ? 2 : 1), at });
    }
  }
  out.push(...last.values());
  for (const a of activity)
    if (a.date && a.date < today && typeof a.steps === "number" && a.steps > 0 && a.steps < 100_000)
      out.push({ metric: "steps", day: a.date, value: Math.round(a.steps), at: Date.parse(`${a.date}T23:59:00Z`) });
  for (const n of sleep) {
    if (!n.date) continue;
    const at = Date.parse(`${n.date}T08:00:00Z`);
    const d = n.data ?? {};
    const h = (d.total_sleep_time ?? 0) / 3600;
    if (h >= 1 && h <= 16) out.push({ metric: "sleep", day: n.date, value: round(h, 2), at });
    if (d.hr_min && d.hr_min > 25 && d.hr_min < 130) out.push({ metric: "restingHr", day: n.date, value: round(d.hr_min, 1), at });
    if (d.rr_average && d.rr_average > 4 && d.rr_average < 40)
      out.push({ metric: "breathing", day: n.date, value: round(d.rr_average, 1), at });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Withings' API answers 200 with its own status: 0 worked, 401 the token is no good. */
async function withingsCall<T>(url: string, params: Record<string, string>, token: string, f: Fetch): Promise<T> {
  const r = await f(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  if (r.status === 401) throw new Unlinked();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = (await r.json()) as { status?: number; body?: T };
  if (j.status === 401) throw new Unlinked();
  if (j.status !== 0 || !j.body) throw new Error(`Withings ${j.status}`);
  return j.body;
}

// --- Polar: nightly recharge and sleep ---

interface PolarRecharge {
  date?: string;
  heart_rate_avg?: number;
  heart_rate_variability_avg?: number;
  breathing_rate_avg?: number;
}
interface PolarNight {
  date?: string;
  light_sleep?: number;
  deep_sleep?: number;
  rem_sleep?: number;
  sleep_end_time?: string;
}

/**
 * Polar's nightly recharge (the night's average HRV and breathing rate; its average heart rate stands in for
 * resting heart rate, as Polar gives no lowest) and sleep (light + deep + REM seconds), one reading per metric
 * per day, the day the night ended. Exported for tests.
 */
export function polarReadings(recharges: readonly PolarRecharge[], nights: readonly PolarNight[]): CloudReading[] {
  const out: CloudReading[] = [];
  const endOf = new Map<string, number>();
  for (const n of nights) {
    if (!n.date) continue;
    const at = Date.parse(n.sleep_end_time ?? "") || Date.parse(`${n.date}T08:00:00Z`);
    endOf.set(n.date, at);
    const h = ((n.light_sleep ?? 0) + (n.deep_sleep ?? 0) + (n.rem_sleep ?? 0)) / 3600;
    if (h >= 1 && h <= 16) out.push({ metric: "sleep", day: n.date, value: round(h, 2), at });
  }
  for (const r of recharges) {
    if (!r.date) continue;
    const at = endOf.get(r.date) ?? Date.parse(`${r.date}T08:00:00Z`);
    const hrv = r.heart_rate_variability_avg;
    const hr = r.heart_rate_avg;
    const br = r.breathing_rate_avg;
    if (hrv && hrv > 5 && hrv < 300) out.push({ metric: "hrv", day: r.date, value: round(hrv, 1), at });
    if (hr && hr > 25 && hr < 130) out.push({ metric: "restingHr", day: r.date, value: round(hr, 1), at });
    if (br && br > 4 && br < 40) out.push({ metric: "breathing", day: r.date, value: round(br, 1), at });
  }
  return out.sort((a, b) => a.at - b.at);
}

// --- Concept2: rows, ski and bike sessions ---

interface C2Result {
  id?: number | string;
  type?: string;
  date?: string;
  timezone?: string | null;
  /** Metres. */
  distance?: number;
  /** Tenths of a second. */
  time?: number;
}

/** UTC ms for a wall-clock "YYYY-MM-DD HH:MM:SS" in an IANA zone (Concept2 logs local time with its zone). */
export function zonedTime(local: string, zone: string | null | undefined, fallbackMin: number): number | null {
  const m = /^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d)(?::(\d\d))?/.exec(local);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +(m[6] ?? 0));
  let offset = fallbackMin;
  if (zone)
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).formatToParts(new Date(asUtc));
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      offset = Math.round(
        (Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - asUtc) / 60_000,
      );
    } catch {
      // An unknown zone: the phone's offset.
    }
  return asUtc - offset * 60_000;
}

/** The Logbook's results as cardio sessions: rower (and its slides and dynamic models), SkiErg and BikeErg. Exported for tests. */
export function concept2Cardio(results: readonly C2Result[], tzMin: number): CloudCardio[] {
  const out: CloudCardio[] = [];
  for (const r of results) {
    const kind =
      r.type === "skierg"
        ? "skierg"
        : r.type === "bike"
          ? "bike"
          : r.type === "rower" || r.type === "dynamic" || r.type === "slides"
            ? "rower"
            : null;
    const start = r.date ? zonedTime(r.date, r.timezone, tzMin) : null;
    const seconds = Math.round((r.time ?? 0) / 10);
    const distanceM = Math.round(r.distance ?? 0);
    if (!kind || r.id === undefined || start === null || seconds < 30 || seconds > 86_400 || distanceM <= 0 || distanceM > 1_000_000)
      continue;
    out.push({ id: String(r.id), kind, start, seconds, distanceM });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** The last `days` of Concept2 Logbook sessions. Throws Unlinked when Concept2 refused the token. */
export async function concept2Results(
  accountId: string,
  days: number,
  tzMin: number,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<CloudCardio[]> {
  const token = await accessToken(accountId, "concept2", f, env, now);
  if (!token) throw new Unlinked();
  const out: C2Result[] = [];
  for (let page = 1; page <= 5; page++) {
    const q = new URLSearchParams({
      from: dayAt(now - days * 86_400_000, tzMin),
      to: dayAt(now + 86_400_000, tzMin),
      number: "250",
      page: String(page),
    });
    const j = await getJson<{ data?: C2Result[]; meta?: { pagination?: { total_pages?: number } } }>(
      `https://log.concept2.com/api/users/me/results?${q}`,
      token,
      f,
      "application/vnd.c2logbook.v1+json",
    );
    out.push(...(j.data ?? []));
    if ((j.meta?.pagination?.total_pages ?? 1) <= page) break;
  }
  return concept2Cardio(out, tzMin);
}

async function getJson<T>(url: string, token: string, f: Fetch, accept = "application/json"): Promise<T> {
  const r = await f(url, { headers: { Authorization: `Bearer ${token}`, Accept: accept } });
  if (r.status === 401 || r.status === 403) throw new Unlinked();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export class Unlinked extends Error {}

/** The last `days` of readings from Oura, Whoop, Withings or Polar. Throws Unlinked when the service refused the token. */
export async function dailyReadings(
  accountId: string,
  p: ReadingCloud,
  days: number,
  tzMin: number,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<CloudReading[]> {
  const token = await accessToken(accountId, p, f, env, now);
  if (!token) throw new Unlinked();
  const from = now - days * 86_400_000;
  if (p === "withings") {
    const ymd = { startdateymd: dayAt(from, tzMin), enddateymd: dayAt(now, tzMin) };
    const [meas, act, sleep] = await Promise.all([
      withingsCall<{ measuregrps?: WithingsGroup[] }>(
        "https://wbsapi.withings.net/measure",
        {
          action: "getmeas",
          meastypes: "1,6",
          category: "1",
          startdate: String(Math.floor(from / 1000)),
          enddate: String(Math.floor(now / 1000)),
        },
        token,
        f,
      ),
      withingsCall<{ activities?: { date?: string; steps?: number }[] }>(
        "https://wbsapi.withings.net/v2/measure",
        { action: "getactivity", data_fields: "steps", ...ymd },
        token,
        f,
      ),
      withingsCall<{ series?: WithingsSleep[] }>(
        "https://wbsapi.withings.net/v2/sleep",
        { action: "getsummary", data_fields: "total_sleep_time,hr_min,rr_average", ...ymd },
        token,
        f,
      ),
    ]);
    return withingsReadings(meas.measuregrps ?? [], act.activities ?? [], sleep.series ?? [], tzMin, dayAt(now, tzMin));
  }
  if (p === "polar") {
    // AccessLink keeps the last 28 days of each.
    const [rech, sleep] = await Promise.all([
      getJson<{ recharges?: PolarRecharge[] }>(`${POLAR}/users/nightly-recharge`, token, f),
      getJson<{ nights?: PolarNight[] }>(`${POLAR}/users/sleep`, token, f),
    ]);
    const since = dayAt(from, tzMin);
    return polarReadings(rech.recharges ?? [], sleep.nights ?? []).filter((r) => r.day >= since);
  }
  if (p === "oura") {
    const q = `start_date=${dayAt(from, tzMin)}&end_date=${dayAt(now + 86_400_000, tzMin)}`;
    const [sleep, act] = await Promise.all([
      getJson<{ data?: OuraSleep[] }>(`https://api.ouraring.com/v2/usercollection/sleep?${q}`, token, f),
      getJson<{ data?: { day?: string; steps?: number }[] }>(`https://api.ouraring.com/v2/usercollection/daily_activity?${q}`, token, f),
    ]);
    return ouraReadings(sleep.data ?? [], act.data ?? [], dayAt(now, tzMin));
  }
  const all = async <T>(path: string): Promise<T[]> => {
    const out: T[] = [];
    let next: string | undefined;
    for (let page = 0; page < 10; page++) {
      const q = new URLSearchParams({ start: new Date(from).toISOString(), end: new Date(now).toISOString(), limit: "25" });
      if (next) q.set("nextToken", next);
      const j = await getJson<{ records?: T[]; next_token?: string | null }>(
        `https://api.prod.whoop.com/developer/v2/${path}?${q}`,
        token,
        f,
      );
      out.push(...(j.records ?? []));
      next = j.next_token ?? undefined;
      if (!next) break;
    }
    return out;
  };
  const [sleeps, recs] = await Promise.all([all<WhoopSleep>("activity/sleep"), all<WhoopRecovery>("recovery")]);
  return whoopReadings(sleeps, recs, tzMin);
}
