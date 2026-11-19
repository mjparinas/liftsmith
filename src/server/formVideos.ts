// Form video check-ins (Melvin, 2026-11-19, gap item 3: "form video check-ins for coaches and physios"). A client films a
// set (or picks a clip from their phone) and sends it to one of their coaches; the coach, or physio, watches it, slows it
// down and leaves notes pinned to moments in the clip ("0:07 knees cave on the way up"), and the client answers on the
// same notes. Decision record: docs/decisions/trainer-mode.md "Form videos".
//
// Storage: the video itself never touches our database or our functions. It goes straight from the phone to a private
// Vercel Blob store with a short-lived upload token scoped to one path, size and type, and it's watched through a
// presigned link that lasts an hour, handed only to the coach and the client. Turso keeps the row and the notes.
// Under-18 clients can't send one (the check-in photo rule): nothing here works for them.
import { randomBytes } from "node:crypto";

import { cleanMessage, isAccountId, isClient, nameOf } from "./coach";
import { batch, query, rateLimit, run } from "./db";
import { notifyCoach } from "./push";
import { isMinor } from "./teams";

export const VIDEO_LIMITS = {
  /** Longest clip, in seconds: one set, with a little either side. */
  secs: 60,
  /** Biggest file: a minute filmed on a phone at 1080p. The app's own camera records about 20 MB a minute. */
  bytes: 150 * 1024 * 1024,
  /** Videos kept per coach and client; the oldest goes (with its notes) when another arrives. */
  keep: 12,
  /** Videos a client can start sending in a day, to all their coaches together. */
  perDay: 10,
  /** Notes on one video, from both sides. */
  notes: 40,
  /** Notes an account can leave in a day. */
  notesPerDay: 300,
  note: 500,
  lift: 80,
  question: 300,
  /** How long an upload token and a watch link last. */
  uploadMs: 30 * 60_000,
  watchMs: 60 * 60_000,
};

export const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

/** Where the bytes live. Vercel Blob in production (vercelStore below); tests swap in their own. */
export interface VideoStore {
  /** A client token that lets one upload of up to `bytes` reach `path`, of one of `types`, before `until`. */
  uploadToken(path: string, bytes: number, types: string[], until: number): Promise<string>;
  /** The stored size, or null when nothing reached `path`. */
  size(path: string): Promise<number | null>;
  /** A link that plays the video until `until`. */
  watchUrl(path: string, until: number): Promise<string>;
  remove(paths: string[]): Promise<void>;
}

/**
 * Vercel Blob, in a private store of its own: gym pictures use a public store under BLOB_READ_WRITE_TOKEN, and a store
 * is public or private as a whole. Connecting this one to the project with the prefix VIDEO_BLOB sets the token.
 */
export const blobConfigured = (env: NodeJS.ProcessEnv = process.env) => !!env.VIDEO_BLOB_READ_WRITE_TOKEN;
const token = () => process.env.VIDEO_BLOB_READ_WRITE_TOKEN!;

const vercelStore: VideoStore = {
  async uploadToken(path, bytes, types, until) {
    const { generateClientTokenFromReadWriteToken } = await import("@vercel/blob/client");
    return generateClientTokenFromReadWriteToken({
      token: token(),
      pathname: path,
      maximumSizeInBytes: bytes,
      allowedContentTypes: types,
      validUntil: until,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  },
  async size(path) {
    const { head } = await import("@vercel/blob");
    try {
      return (await head(path, { token: token() })).size;
    } catch {
      return null;
    }
  },
  async watchUrl(path, until) {
    const { issueSignedToken, presignUrl } = await import("@vercel/blob");
    const signed = await issueSignedToken({ token: token(), pathname: path, operations: ["get"], validUntil: until });
    return (await presignUrl(signed, { operation: "get", pathname: path, validUntil: until, access: "private" })).presignedUrl;
  },
  async remove(paths) {
    if (!paths.length) return;
    const { del } = await import("@vercel/blob");
    await del(paths, { token: token() });
  },
};

let store: VideoStore | null = null;
const theStore = () => store ?? (blobConfigured() ? vercelStore : null);
/** Tests: a store of their own (null goes back to Vercel Blob, when it's set up). */
export function setVideoStore(s: VideoStore | null) {
  store = s;
}

export interface VideoNote {
  id: string;
  authorId: string;
  /** Where in the clip, in milliseconds. */
  ms: number;
  text: string;
  at: number;
}
export interface FormVideo {
  id: string;
  coachId: string;
  clientId: string;
  /** The lift, as the client named it (an exercise name in their language, or their own words). */
  lift: string;
  /** What the client wants the coach to look at. */
  question: string;
  secs: number;
  bytes: number;
  at: number;
  notes: VideoNote[];
  /** For this account: never opened (the coach's side), and notes from the other side since it last looked. */
  unseen: boolean;
  newNotes: number;
}
/** Whether this account can send one: yes, under 18, or not set up on the server. */
export type SendState = "ok" | "teen" | "off";

type Row = {
  id: string;
  coach_id: string;
  client_id: string;
  path: string;
  lift: string;
  question: string;
  bytes: number;
  secs: number;
  ready: number;
  at: number;
  coach_seen: number;
  client_seen: number;
};
type NoteRow = { id: string; video_id: string; author_id: string; ms: number; text: string; at: number };

const line = (x: unknown, max: number) =>
  typeof x === "string"
    ? x
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
        .trim()
    : "";
const newId = () => randomBytes(12).toString("base64url");

/** A note's words, tidied like a chat message; empty when there's nothing left. */
export const cleanNote = (x: unknown) => (typeof x === "string" ? cleanMessage(x).slice(0, VIDEO_LIMITS.note).trim() : "");

/** A moment in a clip, in whole milliseconds, kept inside the clip. */
export function cleanMs(x: unknown, secs: number): number | null {
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0) return null;
  const end = Math.max(0, Math.ceil(secs * 1000));
  return Math.min(Math.round(x), end);
}

function toVideo(r: Row, notes: NoteRow[], me: string): FormVideo {
  const coach = String(r.coach_id) === me;
  const seen = Number(coach ? r.coach_seen : r.client_seen);
  const mine = notes.filter((n) => String(n.video_id) === String(r.id));
  return {
    id: String(r.id),
    coachId: String(r.coach_id),
    clientId: String(r.client_id),
    lift: String(r.lift ?? ""),
    question: String(r.question ?? ""),
    secs: Number(r.secs),
    bytes: Number(r.bytes),
    at: Number(r.at),
    notes: mine.map((n) => ({ id: String(n.id), authorId: String(n.author_id), ms: Number(n.ms), text: String(n.text), at: Number(n.at) })),
    unseen: coach && seen === 0,
    newNotes: mine.filter((n) => String(n.author_id) !== me && Number(n.at) > seen).length,
  };
}

async function notesOf(ids: string[]): Promise<NoteRow[]> {
  if (!ids.length) return [];
  return query<NoteRow>(
    `SELECT * FROM coach_video_notes WHERE video_id IN (${ids.map(() => "?").join(", ")}) ORDER BY video_id, ms, at`,
    ids,
  );
}

/** Every finished video this account sent or was sent, newest first, with their notes. */
export async function videosOf(accountId: string): Promise<FormVideo[]> {
  const rows = await query<Row>(
    "SELECT * FROM coach_videos WHERE (coach_id = ? OR client_id = ?) AND ready = 1 ORDER BY at DESC LIMIT 300",
    [accountId, accountId],
  );
  const notes = await notesOf(rows.map((r) => String(r.id)));
  return rows.map((r) => toVideo(r, notes, accountId));
}

/** What's waiting for this account: videos its clients sent that it hasn't opened, and new notes on either side. */
export async function videosWaiting(accountId: string): Promise<number> {
  return (await videosOf(accountId)).reduce((n, v) => n + (v.unseen ? 1 : 0) + v.newNotes, 0);
}

/** Whether this account may send form videos. */
export async function sendState(accountId: string, now = Date.now()): Promise<SendState> {
  if (!theStore()) return "off";
  return (await isMinor(accountId, now)) ? "teen" : "ok";
}

/** The list, and whether this account may send. */
export async function videoOverview(accountId: string): Promise<{ videos: FormVideo[]; send: SendState }> {
  const [videos, send] = await Promise.all([videosOf(accountId), sendState(accountId)]);
  return { videos, send };
}

export type StartError = "notClient" | "teen" | "off" | "bad" | "big" | "long" | "slow";

/**
 * A client starts sending a video to one of their coaches: checks it, keeps a row that isn't shown yet, and hands back
 * a token for that one upload. `finishVideo` shows it once the bytes are there.
 */
export async function startVideo(
  clientId: string,
  x: unknown,
  now = Date.now(),
  id = newId(),
): Promise<{ id: string; path: string; token: string } | { error: StartError }> {
  const b = (x ?? {}) as { coach?: unknown; lift?: unknown; question?: unknown; bytes?: unknown; secs?: unknown; type?: unknown };
  const s = theStore();
  if (!s) return { error: "off" };
  if (!isAccountId(b.coach) || !(await isClient(b.coach, clientId))) return { error: "notClient" };
  if (await isMinor(clientId, now)) return { error: "teen" };
  const type = typeof b.type === "string" ? b.type.split(";")[0]!.trim().toLowerCase() : "";
  const ext = VIDEO_TYPES[type];
  const bytes = typeof b.bytes === "number" && Number.isFinite(b.bytes) ? Math.round(b.bytes) : 0;
  const secs = typeof b.secs === "number" && Number.isFinite(b.secs) ? Math.round(b.secs * 10) / 10 : 0;
  if (!ext || bytes <= 0 || secs <= 0) return { error: "bad" };
  if (bytes > VIDEO_LIMITS.bytes) return { error: "big" };
  // A second's slack: phones round a clip's length differently.
  if (secs > VIDEO_LIMITS.secs + 1) return { error: "long" };
  if (!(await rateLimit(`video:${clientId}`, VIDEO_LIMITS.perDay, 86_400_000, now))) return { error: "slow" };
  await dropStale(clientId, now);
  const path = `form-videos/${id}.${ext}`;
  await run(
    `INSERT INTO coach_videos (id, coach_id, client_id, path, lift, question, bytes, secs, ready, at, coach_seen, client_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?)`,
    [id, b.coach, clientId, path, line(b.lift, VIDEO_LIMITS.lift), line(b.question, VIDEO_LIMITS.question), bytes, secs, now, now],
  );
  const token = await s.uploadToken(
    path,
    Math.min(VIDEO_LIMITS.bytes, Math.ceil(bytes * 1.05) + 65_536),
    Object.keys(VIDEO_TYPES),
    now + VIDEO_LIMITS.uploadMs,
  );
  return { id, path, token };
}

/** Uploads a client started over an hour ago and never finished: their rows go, and any bytes that did arrive. */
async function dropStale(clientId: string, now: number) {
  const stale = await query<Row>("SELECT * FROM coach_videos WHERE client_id = ? AND ready = 0 AND at < ?", [
    clientId,
    now - 2 * VIDEO_LIMITS.uploadMs,
  ]);
  await removeRows(stale);
}

async function removeRows(rows: Row[]) {
  if (!rows.length) return;
  const s = theStore();
  if (s) await s.remove(rows.map((r) => String(r.path))).catch(() => null);
  await batch(
    rows.flatMap((r) => [
      { sql: "DELETE FROM coach_video_notes WHERE video_id = ?", args: [r.id] },
      { sql: "DELETE FROM coach_videos WHERE id = ?", args: [r.id] },
    ]),
  );
}

export type FinishError = "unknown" | "missing" | "big" | "off";

/** The upload finished: the bytes are checked, the video shows for both, the coach hears, and the oldest past the keep goes. */
export async function finishVideo(clientId: string, id: unknown, now = Date.now()): Promise<FormVideo | { error: FinishError }> {
  const s = theStore();
  if (!s) return { error: "off" };
  if (typeof id !== "string") return { error: "unknown" };
  const [r] = await query<Row>("SELECT * FROM coach_videos WHERE id = ? AND client_id = ?", [id, clientId]);
  if (!r) return { error: "unknown" };
  if (Number(r.ready) === 1) return toVideo(r, await notesOf([id]), clientId);
  const size = await s.size(String(r.path));
  if (size === null) return { error: "missing" };
  if (size > VIDEO_LIMITS.bytes) {
    await removeRows([r]);
    return { error: "big" };
  }
  await run("UPDATE coach_videos SET ready = 1, bytes = ?, at = ?, client_seen = ? WHERE id = ?", [size, now, now, id]);
  const old = await query<Row>(
    "SELECT * FROM coach_videos WHERE coach_id = ? AND client_id = ? AND ready = 1 ORDER BY at DESC LIMIT -1 OFFSET ?",
    [r.coach_id, clientId, VIDEO_LIMITS.keep],
  );
  await removeRows(old);
  await notifyCoach(String(r.coach_id), "coachVideo", { name: await nameOf(clientId), text: String(r.lift ?? "") }, `#/trainer/v.${id}`);
  return toVideo({ ...r, ready: 1, bytes: size, at: now, client_seen: now }, [], clientId);
}

/** One of this account's videos (sent or received), or nothing. */
async function own(accountId: string, id: unknown): Promise<Row | null> {
  if (typeof id !== "string" || !id) return null;
  const [r] = await query<Row>("SELECT * FROM coach_videos WHERE id = ? AND ready = 1 AND (coach_id = ? OR client_id = ?)", [
    id,
    accountId,
    accountId,
  ]);
  return r ?? null;
}

/** One video and a link to watch it for the next hour; opening it marks it and its notes seen. */
export async function openVideo(accountId: string, id: unknown, now = Date.now()): Promise<{ video: FormVideo; url: string } | null> {
  const s = theStore();
  const r = await own(accountId, id);
  if (!s || !r) return null;
  const url = await s.watchUrl(String(r.path), now + VIDEO_LIMITS.watchMs);
  const video = toVideo(r, await notesOf([String(r.id)]), accountId);
  await markSeen(accountId, r, now);
  return { video, url };
}

async function markSeen(accountId: string, r: Row, now: number) {
  const col = String(r.coach_id) === accountId ? "coach_seen" : "client_seen";
  await run(`UPDATE coach_videos SET ${col} = ? WHERE id = ?`, [now, r.id]);
}

export type NoteError = "unknown" | "empty" | "full" | "slow";

/** A note pinned to a moment in the clip, from either side; the other side hears. */
export async function addNote(
  accountId: string,
  x: unknown,
  now = Date.now(),
  noteId = newId(),
): Promise<VideoNote | { error: NoteError }> {
  const b = (x ?? {}) as { id?: unknown; ms?: unknown; text?: unknown };
  const r = await own(accountId, b.id);
  if (!r) return { error: "unknown" };
  const text = cleanNote(b.text);
  const ms = cleanMs(b.ms, Number(r.secs));
  if (!text || ms === null) return { error: "empty" };
  const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_video_notes WHERE video_id = ?", [r.id]);
  if (Number(n?.n ?? 0) >= VIDEO_LIMITS.notes) return { error: "full" };
  if (!(await rateLimit(`videonote:${accountId}`, VIDEO_LIMITS.notesPerDay, 86_400_000, now))) return { error: "slow" };
  await run("INSERT INTO coach_video_notes (id, video_id, author_id, ms, text, at) VALUES (?, ?, ?, ?, ?, ?)", [
    noteId,
    r.id,
    accountId,
    ms,
    text,
    now,
  ]);
  await markSeen(accountId, r, now);
  const other = String(r.coach_id) === accountId ? String(r.client_id) : String(r.coach_id);
  await notifyCoach(other, "coachVideoNote", { name: await nameOf(accountId), text }, `#/trainer/v.${r.id}`);
  return { id: noteId, authorId: accountId, ms, text, at: now };
}

/** Takes back one of this account's own notes. */
export async function deleteNote(accountId: string, noteId: unknown): Promise<void> {
  if (typeof noteId !== "string") return;
  await run("DELETE FROM coach_video_notes WHERE id = ? AND author_id = ?", [noteId, accountId]);
}

/** Either side deletes a video: the file and its notes go. */
export async function deleteVideo(accountId: string, id: unknown): Promise<boolean> {
  const r = await own(accountId, id);
  if (!r) return false;
  await removeRows([r]);
  return true;
}

/** A coach and client part ways: every video between them goes, files and all. */
export async function dropPairVideos(a: string, b: string): Promise<void> {
  const rows = await query<Row>("SELECT * FROM coach_videos WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", [
    a,
    b,
    b,
    a,
  ]);
  await removeRows(rows);
}

/** An account is deleted or reset: every video it sent or was sent goes, files and all. */
export async function dropVideosOf(accountId: string): Promise<void> {
  const rows = await query<Row>("SELECT * FROM coach_videos WHERE coach_id = ? OR client_id = ?", [accountId, accountId]);
  await removeRows(rows);
}
