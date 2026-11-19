// Form video check-ins on the phone (Melvin, 2026-11-19; server: src/server/formVideos.ts, decision record:
// docs/decisions/trainer-mode.md "Form videos"). A client films a set with the app's own camera (or picks a clip),
// it goes straight to private storage, and the coach pins notes to moments in it. Pure web code: the camera is
// getUserMedia (the same permission camera rep counting uses on Android and iOS), the clip is a file input, and
// playback is a <video>, so Android, iOS and the web get it together.
import { api, AuthError, readAccount } from "./auth";

export interface VideoNote {
  id: string;
  authorId: string;
  ms: number;
  text: string;
  at: number;
}
export interface FormVideo {
  id: string;
  coachId: string;
  clientId: string;
  lift: string;
  question: string;
  secs: number;
  bytes: number;
  at: number;
  notes: VideoNote[];
  unseen: boolean;
  newNotes: number;
}
export type SendState = "ok" | "teen" | "off";

/** The server's VIDEO_LIMITS that the phone checks first. */
export const VIDEO_MAX = { secs: 60, bytes: 150 * 1024 * 1024, note: 500, lift: 80, question: 300, notes: 40 };
/** The app's own camera: 720p at about 2.5 Mbit/s, near 20 MB a minute, enough to see a bar path on gym signal. */
export const RECORD = { width: 1280, height: 720, bitsPerSecond: 2_500_000 };
/** Seconds to get into place after Record, before the camera starts keeping anything. */
export const GET_READY = 5;
/** Playback speeds for looking at a rep closely. */
export const SPEEDS = [0.25, 0.5, 1] as const;

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}
const post = <T>(body: Record<string, unknown>) => api<T>("/api/coach/video/", { token: token(), body });

export const loadVideos = () => api<{ videos: FormVideo[]; send: SendState }>("/api/coach/video/", { token: token() });
export const openVideo = (id: string) =>
  api<{ video: FormVideo; url: string }>(`/api/coach/video/?open=${encodeURIComponent(id)}`, { token: token() });
export const addVideoNote = async (id: string, ms: number, text: string) =>
  (await post<{ note: VideoNote }>({ action: "note", id, ms: Math.max(0, Math.round(ms)), text })).note;
export const deleteVideoNote = async (id: string) => void (await post({ action: "deleteNote", id }));
export const deleteVideo = async (id: string) => void (await post({ action: "delete", id }));

/** The clip's type without codecs ("video/webm;codecs=vp9" is webm), or "" when it isn't one the server keeps. */
export function baseType(type: string): "video/mp4" | "video/webm" | "video/quicktime" | "" {
  const t = type.split(";")[0]!.trim().toLowerCase();
  return t === "video/mp4" || t === "video/webm" || t === "video/quicktime" ? t : "";
}

/** What the phone's recorder can make, best first: MP4 plays everywhere (iOS records only it), WebM elsewhere. */
export function recorderType(supported: (t: string) => boolean): string {
  const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((x) => supported(x)) ?? "";
}

export type ClipProblem = "type" | "long" | "big" | "empty";
/** Why a clip can't go, before anything is uploaded; null when it can. */
export function clipProblem(c: { type: string; bytes: number; secs: number }): ClipProblem | null {
  if (!baseType(c.type)) return "type";
  if (c.bytes <= 0 || !(c.secs > 0)) return "empty";
  if (c.bytes > VIDEO_MAX.bytes) return "big";
  if (c.secs > VIDEO_MAX.secs + 1) return "long";
  return null;
}

/** A moment in a clip as people say it: 0:07, 1:02. */
export function stamp(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Where a note sits on the clip's bar, 0 to 100 %. */
export const notePlace = (ms: number, secs: number) => (secs > 0 ? Math.min(100, Math.max(0, (ms / (secs * 1000)) * 100)) : 0);

/** A clip's length in seconds, read from the file itself (a recorder's WebM may say Infinity until it's seeked). */
export function clipSeconds(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = (n: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(n) && n > 0 ? n : 0);
    };
    v.onloadedmetadata = () => {
      if (Number.isFinite(v.duration)) return done(v.duration);
      v.ontimeupdate = () => {
        v.ontimeupdate = null;
        done(v.duration);
      };
      v.currentTime = 1e7;
    };
    v.onerror = () => done(0);
    v.src = url;
  });
}

/**
 * Sends a clip to a coach: the server checks it and hands back a one-upload token, the bytes go straight to storage
 * (in parts, retried, so gym signal can drop for a moment), then the server shows it to the coach.
 */
export async function sendVideo(
  clip: { file: Blob; type: string; secs: number },
  to: { coach: string; lift: string; question: string },
  onProgress: (share: number) => void,
  signal?: AbortSignal,
): Promise<FormVideo> {
  const type = baseType(clip.type);
  const start = await post<{ id: string; path: string; token: string }>({
    action: "start",
    coach: to.coach,
    lift: to.lift,
    question: to.question,
    bytes: clip.file.size,
    secs: Math.round(clip.secs * 10) / 10,
    type,
  });
  const { put } = await import("@vercel/blob/client");
  try {
    await put(start.path, clip.file, {
      access: "private",
      token: start.token,
      contentType: type,
      multipart: clip.file.size > 8 * 1024 * 1024,
      abortSignal: signal,
      onUploadProgress: (e) => onProgress(Math.min(1, e.percentage / 100)),
    });
  } catch (e) {
    if (signal?.aborted) throw new AuthError("cancelled");
    throw new AuthError(e instanceof Error && /network|fetch|offline/i.test(e.message) ? "offline" : "upload");
  }
  onProgress(1);
  return (await post<{ video: FormVideo }>({ action: "finish", id: start.id })).video;
}
