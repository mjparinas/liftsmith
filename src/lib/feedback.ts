"use client";
// In-app feedback (Melvin, 2026-11-09). Reports go to an outbox in localStorage first, so they're
// never lost offline, and are sent to /api/feedback/ when there's a connection. The server emails
// them to the owner through Resend.
import { diagnostics, type Diagnostics } from "./diag";
import { isNative } from "./juice";
import { SITE_URL } from "./site";

export type FeedbackKind = "bug" | "idea" | "other";

export interface FeedbackItem {
  id: string;
  at: number;
  kind: FeedbackKind;
  message: string;
  /** Optional, so the owner can reply. */
  email?: string;
  /** A JPEG data URL, already shrunk. */
  screenshot?: string;
  diag?: Diagnostics;
}

export const OUTBOX_KEY = "liftsmith.feedbackOutbox";
export const MAX_MESSAGE = 4000;

/** Native apps load from a local origin, so they post to the real site. */
export const feedbackUrl = () => (isNative() || typeof location === "undefined" ? `${SITE_URL}/api/feedback/` : "/api/feedback/");

function read(): FeedbackItem[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]") as FeedbackItem[];
  } catch {
    return [];
  }
}

function write(items: FeedbackItem[]) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch {
    // Storage full (a big screenshot): drop the screenshot rather than the report.
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.map((x) => ({ ...x, screenshot: undefined }))));
    } catch {}
  }
}

export const pending = () => read().length;

export function buildFeedback(input: { kind: FeedbackKind; message: string; email?: string; screenshot?: string; includeDiag: boolean }): FeedbackItem {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    at: Date.now(),
    kind: input.kind,
    message: input.message.trim().slice(0, MAX_MESSAGE),
    email: input.email?.trim() || undefined,
    screenshot: input.screenshot,
    diag: input.includeDiag ? diagnostics() : undefined,
  };
}

const REJECTED = new Set([400, 413, 422]);
let flushing: Promise<number> | null = null;

/** Sends everything in the outbox. Returns how many are still waiting. */
export function flushFeedback(post: typeof fetch = fetch): Promise<number> {
  flushing ??= (async () => {
    try {
      for (const item of read()) {
        try {
          const r = await post(feedbackUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
          // The server rejected the report itself (bad or too big): drop it so it can't block the queue.
          // Anything else (404 before the server is deployed, 429, 5xx) keeps it for a later try.
          if (r.ok || REJECTED.has(r.status)) write(read().filter((x) => x.id !== item.id));
          else break;
        } catch {
          break; // offline
        }
      }
      return read().length;
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** Queues a report and tries to send it now. True when it went out, false when it's waiting for a connection. */
export async function sendFeedback(item: FeedbackItem, post: typeof fetch = fetch): Promise<boolean> {
  write([...read(), item]);
  await flushFeedback(post);
  return !read().some((x) => x.id === item.id);
}

/** Shrinks a picked screenshot to at most 1280 px on the long side, as JPEG. */
export async function shrinkImage(file: File, max = 1280): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return undefined;
  }
}
