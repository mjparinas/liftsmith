// Server side of in-app feedback: checks a report and turns it into an email. Pure, so it's unit tested;
// the route (src/app/api/feedback/route.api.ts) only adds HTTP, CORS and Resend.
import { shortCommit } from "./build";
import { CONTACT_TOPICS } from "./contact";
import type { FeedbackItem } from "./feedback";

export const MAX_BODY = 3_000_000;
const KINDS = new Set(["bug", "idea", "other"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Checked = { ok: true; item: FeedbackItem } | { ok: false; error: string };

export function checkFeedback(body: unknown): Checked {
  if (!body || typeof body !== "object") return { ok: false, error: "Not a report" };
  const b = body as Record<string, unknown>;
  if (typeof b.id !== "string" || b.id.length > 64) return { ok: false, error: "Bad id" };
  if (typeof b.kind !== "string" || !KINDS.has(b.kind)) return { ok: false, error: "Bad kind" };
  if (typeof b.message !== "string" || !b.message.trim() || b.message.length > 4000)
    return { ok: false, error: "Message must be 1 to 4000 characters" };
  if (b.email !== undefined && (typeof b.email !== "string" || b.email.length > 254 || !EMAIL.test(b.email)))
    return { ok: false, error: "Bad email" };
  if (
    b.screenshot !== undefined &&
    (typeof b.screenshot !== "string" || !b.screenshot.startsWith("data:image/jpeg;base64,") || b.screenshot.length > 2_800_000)
  )
    return { ok: false, error: "Bad screenshot" };
  if (b.source !== undefined && b.source !== "contact") return { ok: false, error: "Bad source" };
  if (b.topic !== undefined && (b.source !== "contact" || !CONTACT_TOPICS.some((t) => t.id === b.topic)))
    return { ok: false, error: "Bad topic" };
  return { ok: true, item: b as unknown as FeedbackItem };
}

const LABEL = { bug: "Bug", idea: "Idea", other: "Feedback" } as const;
const contact = (item: FeedbackItem) => item.source === "contact";

export function feedbackEmail(item: FeedbackItem) {
  const first = item.message.split("\n")[0].slice(0, 60);
  const d = item.diag;
  const lines = [
    item.message,
    "",
    "---",
    contact(item) ? `From: the website's contact form` : `Kind: ${LABEL[item.kind]}`,
    ...(item.topic ? [`Topic: ${CONTACT_TOPICS.find((t) => t.id === item.topic)?.label ?? item.topic}`] : []),
    `Sent: ${new Date(item.at).toISOString()}`,
    `Reply to: ${item.email ?? "(no email given)"}`,
    `Report id: ${item.id}`,
  ];
  if (d) {
    lines.push(
      "",
      "Device",
      `App ${d.version}${d.commit ? ` (build ${shortCommit(d.commit)})` : ""} on ${d.platform} · ${d.screen} · ${d.language} · ${d.timeZone} · ${d.online ? "online" : "offline"}`,
      `Screen: ${d.route || "#/"}`,
      `User agent: ${d.userAgent}`,
    );
    lines.push("", d.errors.length ? `Recent errors (${d.errors.length}):` : "No recent errors.", ...d.errors);
  } else if (!contact(item)) {
    lines.push("", "The sender chose not to include device details.");
  }
  const attachments = item.screenshot
    ? [{ filename: `screenshot-${item.id.slice(0, 8)}.jpg`, content: item.screenshot.slice("data:image/jpeg;base64,".length) }]
    : [];
  return {
    subject: `[Liftsmith ${contact(item) ? "Contact" : LABEL[item.kind]}] ${first}${item.message.length > first.length ? "…" : ""}`,
    text: lines.join("\n"),
    attachments,
  };
}

/** Origins of the native shells (Capacitor) and local development, allowed to post across origins. */
export const NATIVE_ORIGINS = new Set([
  "https://localhost",
  "capacitor://localhost",
  "liftsmith://localhost",
  "http://localhost",
  "http://localhost:3000",
]);
