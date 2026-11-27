// The Pinterest queue (docs/decisions/pinterest.md). The "Pins" GitHub workflow draws each exercise's tall pin and its
// 15-second clip from the 3D figure (scripts/pins.mjs) and uploads them here; they wait in `pins` for a look on the admin
// Pins tab (or go straight to the queue when review is off), and the "pins" schedule posts them to Pinterest through its
// API at a steady pace, one image pin and one video pin per exercise, on a board per muscle group.
//
// Pinterest is linked once from the Pins tab with OAuth (PINTEREST_APP_ID and PINTEREST_APP_SECRET, the app made on
// developers.pinterest.com); its tokens are kept sealed with the app secret and refreshed before they run out. A new
// Pinterest app starts on Trial access, whose pins only its owner sees; the Sandbox switch sends everything to Pinterest's
// sandbox until the app has Standard access (which takes a short screen recording of connecting and posting from this tab).
import { BOARDS, pinContent, type PinBoard } from "@/lib/pinContent";
import { SITE_URL } from "@/lib/site";

import { seal, unseal } from "./connect";
import { query, run } from "./db";
import { claimSetting, getJson, setSetting } from "./settings";

export type PinKind = "image" | "video";
/** review: made, waiting for a look · ready: in the queue · posting: being sent · processing: Pinterest is still taking
 * the video in · posted · failed · skipped (never posted). */
export type PinStatus = "review" | "ready" | "posting" | "processing" | "posted" | "failed" | "skipped";

export interface PinRow {
  id: string;
  exercise: string;
  kind: PinKind;
  title: string;
  description: string;
  alt: string;
  link: string;
  board: PinBoard;
  media_url: string;
  cover_url: string;
  status: PinStatus;
  created_at: number;
  updated_at: number;
  posted_at: number | null;
  pin_id: string | null;
  media_id: string | null;
  error: string;
  tries: number;
}

export interface PinSettings {
  /** Pins posted a day, spread through it. */
  perDay: number;
  /** Post the clips as video pins too (they're also there to download for other short-video apps). */
  video: boolean;
  /** New pins wait on the Pins tab for Approve; off puts them straight in the queue. */
  review: boolean;
  paused: boolean;
  /** Everything goes to Pinterest's sandbox (Trial access). Sandbox takes no video pins, so clips wait. */
  sandbox: boolean;
}

export const DEFAULT_SETTINGS: PinSettings = { perDay: 2, video: true, review: true, paused: false, sandbox: false };
export const PER_DAY = [1, 2, 3, 4, 5] as const;
const SETTINGS_KEY = "pins.settings";
const LINK_KEY = "pins.pinterest";
const STATE_KEY = "pins.state";

export async function pinSettings(): Promise<PinSettings> {
  const v = await getJson<Partial<PinSettings>>(SETTINGS_KEY, {});
  const s = { ...DEFAULT_SETTINGS, ...(v && typeof v === "object" ? v : {}) };
  return { ...s, perDay: PER_DAY.includes(s.perDay as 1) ? s.perDay : DEFAULT_SETTINGS.perDay };
}

export async function savePinSettings(next: Partial<PinSettings>): Promise<PinSettings> {
  const cur = await pinSettings();
  const merged: PinSettings = {
    perDay: PER_DAY.includes(next.perDay as 1) ? next.perDay! : cur.perDay,
    video: typeof next.video === "boolean" ? next.video : cur.video,
    review: typeof next.review === "boolean" ? next.review : cur.review,
    paused: typeof next.paused === "boolean" ? next.paused : cur.paused,
    sandbox: typeof next.sandbox === "boolean" ? next.sandbox : cur.sandbox,
  };
  await setSetting(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}

// --- Pinterest: OAuth, tokens and calls ---

export const SCOPES = "boards:read,boards:write,pins:read,pins:write,user_accounts:read";
export const pinterestRedirect = () => `${SITE_URL}/api/admin/pins/callback/`;
const app = (env: NodeJS.ProcessEnv = process.env) =>
  env.PINTEREST_APP_ID && env.PINTEREST_APP_SECRET ? { id: env.PINTEREST_APP_ID, secret: env.PINTEREST_APP_SECRET } : null;
export const pinterestConfigured = (env: NodeJS.ProcessEnv = process.env) => !!app(env);
const apiBase = (sandbox: boolean) => (sandbox ? "https://api-sandbox.pinterest.com/v5" : "https://api.pinterest.com/v5");

interface Link {
  access: string;
  refresh: string;
  expires: number;
  refreshExpires: number;
  user: string;
  sandbox: boolean;
  boards: Partial<Record<PinBoard, string>>;
}

type Http = (url: string, init?: RequestInit) => Promise<Response>;
let http: Http = (url, init) => fetch(url, init);
/** Tests: answer Pinterest's calls (null puts the real fetch back). */
export function setPinterestFetch(f: Http | null) {
  http = f ?? ((url, init) => fetch(url, init));
}

async function readLink(): Promise<Link | null> {
  const l = await getJson<Link | null>(LINK_KEY, null);
  return l && typeof l.access === "string" ? { ...l, boards: l.boards ?? {} } : null;
}
const saveLink = (l: Link | null) => setSetting(LINK_KEY, JSON.stringify(l));

/** What the Pins tab shows about the link: never a token. */
export async function pinterestStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  user: string;
  sandbox: boolean;
  expires: number;
}> {
  const l = await readLink();
  return { configured: pinterestConfigured(), connected: !!l, user: l?.user ?? "", sandbox: !!l?.sandbox, expires: l?.refreshExpires ?? 0 };
}

/** Pinterest's sign-in page, with a one-time state kept for the callback. */
export async function connectUrl(now = Date.now()): Promise<string | null> {
  const a = app();
  if (!a) return null;
  const state = crypto.randomUUID();
  await setSetting(STATE_KEY, JSON.stringify({ state, until: now + 15 * 60_000 }), now);
  const q = new URLSearchParams({ client_id: a.id, redirect_uri: pinterestRedirect(), response_type: "code", scope: SCOPES, state });
  return `https://www.pinterest.com/oauth/?${q}`;
}

async function tokenCall(body: URLSearchParams, sandbox: boolean) {
  const a = app();
  if (!a) throw new Error("Pinterest isn't set up (PINTEREST_APP_ID and PINTEREST_APP_SECRET).");
  const r = await http(`${apiBase(sandbox)}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${a.id}:${a.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const j = (await r.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    message?: string;
  };
  if (!r.ok || !j.access_token) throw new Error(j.message || `Pinterest said ${r.status}`);
  return j;
}

/** The callback: uses up the state, swaps the code for tokens and keeps them sealed. */
export async function finishConnect(code: string, state: string, now = Date.now()): Promise<string | null> {
  const a = app();
  if (!a) return "Pinterest isn't set up.";
  const saved = await getJson<{ state?: string; until?: number } | null>(STATE_KEY, null);
  if (!saved?.state || saved.state !== state || (saved.until ?? 0) < now)
    return "That sign-in link has run out. Press Connect Pinterest again.";
  await setSetting(STATE_KEY, "null", now);
  const sandbox = (await pinSettings()).sandbox;
  try {
    const t = await tokenCall(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: pinterestRedirect() }), sandbox);
    const link: Link = {
      access: seal(t.access_token!, a.secret),
      refresh: t.refresh_token ? seal(t.refresh_token, a.secret) : "",
      expires: now + (t.expires_in ?? 2_592_000) * 1000,
      refreshExpires: now + (t.refresh_token_expires_in ?? 31_536_000) * 1000,
      user: "",
      sandbox,
      boards: {},
    };
    await saveLink(link);
    const me = await call<{ username?: string }>("GET", "/user_account").catch(() => null);
    // Read it again: the call may have refreshed the tokens.
    const kept = await readLink();
    if (me?.username && kept) await saveLink({ ...kept, user: me.username });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Pinterest didn't answer.";
  }
}

export const disconnectPinterest = () => saveLink(null);

/** A working access token, refreshed when it has under three days left. */
async function accessToken(now = Date.now()): Promise<{ token: string; link: Link } | null> {
  const a = app();
  const l = await readLink();
  if (!a || !l) return null;
  if (l.expires - 3 * 86_400_000 > now) {
    const token = unseal(l.access, a.secret);
    return token ? { token, link: l } : null;
  }
  const refresh = l.refresh ? unseal(l.refresh, a.secret) : null;
  if (!refresh) return null;
  const t = await tokenCall(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }), l.sandbox);
  const next: Link = {
    ...l,
    access: seal(t.access_token!, a.secret),
    refresh: t.refresh_token ? seal(t.refresh_token, a.secret) : l.refresh,
    expires: now + (t.expires_in ?? 2_592_000) * 1000,
    refreshExpires: t.refresh_token_expires_in ? now + t.refresh_token_expires_in * 1000 : l.refreshExpires,
  };
  await saveLink(next);
  return { token: t.access_token!, link: next };
}

export class PinterestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const t = await accessToken();
  if (!t) throw new PinterestError("Pinterest isn't connected.", 401);
  const r = await http(`${apiBase(t.link.sandbox)}${path}`, {
    method,
    headers: { Authorization: `Bearer ${t.token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const j = (await r.json().catch(() => ({}))) as T & { message?: string };
  if (!r.ok) throw new PinterestError(j.message || `Pinterest said ${r.status}`, r.status);
  return j;
}

/** The board for a muscle group: found by name on the account, or made, and remembered. */
async function boardFor(board: PinBoard): Promise<string> {
  const l = await readLink();
  const known = l?.boards[board];
  if (known) return known;
  const { name, description } = BOARDS[board];
  const list = await call<{ items?: { id: string; name: string }[] }>("GET", "/boards?page_size=250");
  let id = list.items?.find((b) => b.name.toLowerCase() === name.toLowerCase())?.id;
  if (!id) id = (await call<{ id: string }>("POST", "/boards", { name, description, privacy: "PUBLIC" })).id;
  const now = await readLink();
  if (now) await saveLink({ ...now, boards: { ...now.boards, [board]: id } });
  return id;
}

// --- The queue ---

const COLS =
  "id, exercise, kind, title, description, alt, link, board, media_url, cover_url, status, created_at, updated_at, posted_at, pin_id, media_id, error, tries";

/** Exercises that already have pins (made, queued or posted), so the workflow makes the next ones. */
export async function madeExercises(): Promise<string[]> {
  const rows = await query<{ exercise: string }>("SELECT DISTINCT exercise FROM pins");
  return rows.map((r) => String(r.exercise));
}

/** Pins waiting to post (queued or waiting for a look). */
export async function queuedCount(): Promise<number> {
  const r = await query<{ n: number }>("SELECT COUNT(*) AS n FROM pins WHERE status IN ('review', 'ready')");
  return Number(r[0]?.n ?? 0);
}

/** Pins the workflow should make this week: none once three weeks are waiting, so the queue never piles up. */
export const toMake = (asked: number, queued: number, perDay: number) =>
  Math.max(0, Math.min(asked, Math.ceil((21 * perDay - queued) / 2)));

/** Where an exercise's files go in the public Blob store: under pins/<exercise>/, one stamp per run. */
export function uploadPaths(exercise: string, now = Date.now()) {
  const stamp = now.toString(36);
  return {
    image: `pins/${exercise}/${stamp}-pin.jpg`,
    video: `pins/${exercise}/${stamp}-clip.mp4`,
    cover: `pins/${exercise}/${stamp}-cover.jpg`,
  };
}

/** A Blob address we'd accept for this exercise: our public store, under its folder, of the right kind. */
export function okUpload(url: unknown, exercise: string, ext: "jpg" | "mp4"): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith(`/pins/${exercise}/`) &&
      u.pathname.endsWith(`.${ext}`) &&
      !u.search
    );
  } catch {
    return false;
  }
}

/**
 * Puts a freshly made pin and clip in the queue. An exercise made again replaces its pins that haven't been posted
 * (and their files); posted ones stay as they are. Returns the files no longer used, for the caller to delete.
 */
export async function addMade(
  exercise: string,
  files: { image: string; video: string; cover: string },
  now = Date.now(),
): Promise<{ ok: true; replaced: string[] } | { ok: false; error: string }> {
  if (!okUpload(files.image, exercise, "jpg") || !okUpload(files.video, exercise, "mp4") || !okUpload(files.cover, exercise, "jpg"))
    return { ok: false, error: "files" };
  const image = pinContent(exercise, "image");
  const video = pinContent(exercise, "video");
  if (!image || !video) return { ok: false, error: "exercise" };
  const status: PinStatus = (await pinSettings()).review ? "review" : "ready";
  const old = await query<{ media_url: string; cover_url: string; status: string }>(
    "SELECT media_url, cover_url, status FROM pins WHERE exercise = ?",
    [exercise],
  );
  const replaced = old.filter((o) => o.status !== "posted").flatMap((o) => [String(o.media_url), String(o.cover_url)]);
  for (const [kind, c, media, cover] of [
    ["image", image, files.image, ""],
    ["video", video, files.video, files.cover],
  ] as const)
    await run(
      `INSERT INTO pins (${COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, '', 0)
       ON CONFLICT (id) DO UPDATE SET title = excluded.title, description = excluded.description, alt = excluded.alt,
         link = excluded.link, board = excluded.board, media_url = excluded.media_url, cover_url = excluded.cover_url,
         status = excluded.status, updated_at = excluded.updated_at, media_id = NULL, error = '', tries = 0
       WHERE pins.status <> 'posted'`,
      [`${exercise}:${kind}`, exercise, kind, c.title, c.description, c.alt, c.link, c.board, media, cover, status, now, now],
    );
  return { ok: true, replaced: replaced.filter((u) => u && u !== files.image && u !== files.video && u !== files.cover) };
}

export interface QueueView {
  counts: Record<PinStatus, number>;
  pins: PinRow[];
}

const toRow = (r: Record<string, unknown>): PinRow =>
  ({
    ...r,
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
    posted_at: r.posted_at == null ? null : Number(r.posted_at),
    tries: Number(r.tries),
  }) as PinRow;

/** The Pins tab's list: everything waiting or failing, then the newest posted and skipped. */
export async function pinQueue(): Promise<QueueView> {
  const counts = { review: 0, ready: 0, posting: 0, processing: 0, posted: 0, failed: 0, skipped: 0 } satisfies Record<PinStatus, number>;
  for (const r of await query<{ status: PinStatus; n: number }>("SELECT status, COUNT(*) AS n FROM pins GROUP BY status"))
    if (r.status in counts) counts[r.status] = Number(r.n);
  const open = await query(
    `SELECT ${COLS} FROM pins WHERE status IN ('review', 'ready', 'posting', 'processing', 'failed') ORDER BY created_at, id LIMIT 300`,
  );
  const done = await query(`SELECT ${COLS} FROM pins WHERE status IN ('posted', 'skipped') ORDER BY updated_at DESC LIMIT 60`);
  return { counts, pins: [...open, ...done].map(toRow) };
}

/** Approve, skip, put back or edit pins from the Pins tab. Returns how many rows changed. */
export async function changePins(
  action: "approve" | "approveAll" | "skip" | "retry" | "edit",
  id: string | null,
  edit: { title?: string; description?: string } = {},
  now = Date.now(),
): Promise<number> {
  switch (action) {
    case "approveAll":
      return run("UPDATE pins SET status = 'ready', updated_at = ? WHERE status = 'review'", [now]);
    case "approve":
      return run("UPDATE pins SET status = 'ready', updated_at = ? WHERE id = ? AND status IN ('review', 'skipped')", [now, id]);
    case "skip":
      return run("UPDATE pins SET status = 'skipped', updated_at = ? WHERE id = ? AND status IN ('review', 'ready', 'failed')", [now, id]);
    case "retry":
      return run("UPDATE pins SET status = 'ready', error = '', updated_at = ? WHERE id = ? AND status = 'failed'", [now, id]);
    case "edit": {
      const title = (edit.title ?? "").trim().slice(0, 100);
      const description = (edit.description ?? "").trim().slice(0, 500);
      if (!title || !description) return 0;
      return run("UPDATE pins SET title = ?, description = ?, updated_at = ? WHERE id = ? AND status IN ('review', 'ready', 'failed')", [
        title,
        description,
        now,
        id,
      ]);
    }
  }
}

// --- Posting ---

const HOUR = 3_600_000;
const pinPage = (id: string) => `https://www.pinterest.com/pin/${id}/`;
export const pinUrl = pinPage;

async function markPosted(row: PinRow, pinId: string, now: number) {
  await run("UPDATE pins SET status = 'posted', pin_id = ?, posted_at = ?, updated_at = ?, error = '' WHERE id = ?", [
    pinId,
    now,
    now,
    row.id,
  ]);
}

async function markFailed(row: PinRow, e: unknown, now: number) {
  const msg = (e instanceof Error ? e.message : String(e)).slice(0, 300);
  // A busy or briefly broken Pinterest gets two more tries on later runs; anything else waits for Try again.
  const again = e instanceof PinterestError && (e.status === 429 || e.status >= 500) && row.tries < 2;
  await run("UPDATE pins SET status = ?, error = ?, tries = tries + 1, updated_at = ? WHERE id = ?", [
    again ? "ready" : "failed",
    msg,
    now,
    row.id,
  ]);
}

/** Asks Pinterest whether a video it was sent is ready; makes the pin once it is. */
async function finishVideo(row: PinRow, now: number): Promise<"posted" | "waiting" | "failed"> {
  try {
    const m = await call<{ status?: string }>("GET", `/media/${row.media_id}`);
    if (m.status === "failed") throw new Error("Pinterest couldn't process the video.");
    if (m.status !== "succeeded") {
      if (now - row.updated_at > 6 * HOUR) throw new Error("Pinterest took over six hours with the video.");
      return "waiting";
    }
    const pin = await call<{ id: string }>("POST", "/pins", {
      board_id: await boardFor(row.board),
      title: row.title,
      description: row.description,
      link: row.link,
      alt_text: row.alt,
      media_source: { source_type: "video_id", media_id: row.media_id, cover_image_url: row.cover_url },
    });
    await markPosted(row, pin.id, now);
    return "posted";
  } catch (e) {
    await markFailed(row, e, now);
    return "failed";
  }
}

/** Sends one pin. A video is uploaded and left to Pinterest to process; a later run (or a short wait here) finishes it. */
let wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Tests: don't really wait between looks at a video Pinterest is processing. */
export function setPinWait(f: ((ms: number) => Promise<void>) | null) {
  wait = f ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
}

export async function postPin(row: PinRow, now = Date.now()): Promise<PinStatus> {
  const claimed = await run("UPDATE pins SET status = 'posting', updated_at = ? WHERE id = ? AND status IN ('ready', 'review', 'failed')", [
    now,
    row.id,
  ]);
  if (!claimed) return row.status;
  try {
    if (row.kind === "image") {
      const pin = await call<{ id: string }>("POST", "/pins", {
        board_id: await boardFor(row.board),
        title: row.title,
        description: row.description,
        link: row.link,
        alt_text: row.alt,
        media_source: { source_type: "image_url", url: row.media_url },
      });
      await markPosted(row, pin.id, now);
      return "posted";
    }
    const reg = await call<{ media_id: string; upload_url: string; upload_parameters: Record<string, string> }>("POST", "/media", {
      media_type: "video",
    });
    const file = await http(row.media_url);
    if (!file.ok) throw new Error("The clip file is missing from storage. Make it again.");
    const form = new FormData();
    for (const [k, v] of Object.entries(reg.upload_parameters ?? {})) form.append(k, v);
    form.append("file", new Blob([await file.arrayBuffer()], { type: "video/mp4" }), "clip.mp4");
    const up = await http(reg.upload_url, { method: "POST", body: form });
    if (!up.ok) throw new Error(`The video upload to Pinterest failed (${up.status}).`);
    await run("UPDATE pins SET status = 'processing', media_id = ?, updated_at = ? WHERE id = ?", [reg.media_id, now, row.id]);
    const next = { ...row, status: "processing" as const, media_id: reg.media_id, updated_at: now };
    // Short clips are usually ready within a minute: look a few times before leaving it to the next run.
    for (let i = 0; i < 4; i++) {
      await wait(10_000);
      const r = await finishVideo(next, now);
      if (r !== "waiting") return r;
    }
    return "processing";
  } catch (e) {
    await markFailed(row, e, now);
    return "failed";
  }
}

/** The next pin to post: oldest first, taking turns between images and clips; clips only when they can be posted. */
export function pickNext(ready: PinRow[], lastKind: PinKind | null, s: PinSettings): PinRow | null {
  const can = ready.filter((p) => p.kind === "image" || (s.video && !s.sandbox));
  return can.find((p) => p.kind !== lastKind) ?? can[0] ?? null;
}

/**
 * The "pins" schedule (every two hours): finishes videos Pinterest has processed, then posts one pin when the day's
 * share hasn't gone out and the last one went up long enough ago, so `perDay` pins spread through the day. Safe to run
 * twice: an hour's run is claimed once, and each pin is claimed in one statement before it's sent.
 */
export async function postDue(now = Date.now()): Promise<{ posted: number; skipped?: string }> {
  const s = await pinSettings();
  if (s.paused) return { posted: 0, skipped: "paused" };
  if (!(await readLink())) return { posted: 0, skipped: "not connected" };
  if (!(await claimSetting("pins.run", String(Math.floor(now / HOUR)), now))) return { posted: 0, skipped: "already ran" };
  let posted = 0;
  // A pin left mid-send (the function stopped) can't be known to be on Pinterest or not: someone checks first.
  await run(
    "UPDATE pins SET status = 'failed', error = 'Stopped while sending. Check Pinterest before trying again.', updated_at = ? WHERE status = 'posting' AND updated_at < ?",
    [now, now - HOUR / 2],
  );
  for (const r of (await query(`SELECT ${COLS} FROM pins WHERE status = 'processing' ORDER BY created_at LIMIT 5`)).map(toRow))
    if ((await finishVideo(r, now)) === "posted") posted++;
  const recent = (
    await query<{ kind: PinKind; posted_at: number }>("SELECT kind, posted_at FROM pins WHERE posted_at > ? ORDER BY posted_at DESC", [
      now - 24 * HOUR,
    ])
  ).map((r) => ({ kind: r.kind, at: Number(r.posted_at) }));
  const gap = (24 * HOUR) / s.perDay - HOUR / 4;
  if (recent.length >= s.perDay || (recent[0] && now - recent[0].at < gap)) return { posted, skipped: "not due" };
  const last =
    recent[0]?.kind ??
    (await query<{ kind: PinKind }>("SELECT kind FROM pins WHERE posted_at IS NOT NULL ORDER BY posted_at DESC LIMIT 1"))[0]?.kind ??
    null;
  const ready = (await query(`SELECT ${COLS} FROM pins WHERE status = 'ready' ORDER BY created_at, id LIMIT 20`)).map(toRow);
  const next = pickNext(ready, last, s);
  if (!next) return { posted, skipped: "queue empty" };
  if ((await postPin(next, now)) === "posted") posted++;
  return { posted };
}

/** Post now (the Pins tab): one pin, whatever the pace. */
export async function postNow(id: string, now = Date.now()): Promise<PinStatus | null> {
  const row = (await query(`SELECT ${COLS} FROM pins WHERE id = ?`, [id])).map(toRow)[0];
  if (!row) return null;
  if (!(await readLink())) throw new PinterestError("Pinterest isn't connected.", 401);
  if (row.kind === "video" && (await pinSettings()).sandbox) throw new PinterestError("Pinterest's sandbox takes no video pins.", 400);
  return postPin(row, now);
}

/** How long the queue lasts at today's pace, in days (for the tab's "enough for" line). */
export const daysLeft = (queued: number, perDay: number) => Math.floor(queued / Math.max(1, perDay));
