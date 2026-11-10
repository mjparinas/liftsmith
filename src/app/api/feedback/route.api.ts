// POST /api/feedback/: a report from the in-app feedback screen, emailed to the owner through Resend.
// Only in the server build (Vercel). The static export used for the native shells and CI leaves it out
// (see pageExtensions in next.config.ts). Needs RESEND_API_KEY and FEEDBACK_TO; FEEDBACK_FROM is optional.
import { checkFeedback, feedbackEmail, MAX_BODY, NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { rateLimit } from "@/server/db";

const hits = new Map<string, number[]>();
const LIMIT = 10; // reports per address per hour

/** Shared across instances through the database; per instance only when the database can't answer. */
async function tooMany(ip: string, now: number): Promise<boolean> {
  try {
    return !(await rateLimit(`feedback:${ip}`, LIMIT, 3_600_000, now));
  } catch {
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
    hits.set(ip, [...recent, now]);
    return recent.length >= LIMIT;
  }
}

function cors(origin: string | null): Record<string, string> {
  return origin && NATIVE_ORIGINS.has(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      }
    : {};
}

const json = (status: number, body: unknown, headers: Record<string, string>) => Response.json(body, { status, headers });

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const h = cors(req.headers.get("origin"));
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return json(413, { error: "Too large" }, h);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  const now = Date.now();
  if (await tooMany(ip, now)) return json(429, { error: "Too many reports, try again later" }, h);

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { error: "Too large" }, h);
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Not JSON" }, h);
  }
  const checked = checkFeedback(body);
  if (!checked.ok) return json(400, { error: checked.error }, h);

  const key = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO;
  // Not set up yet: the app keeps the report queued and retries later.
  if (!key || !to) return json(503, { error: "Feedback email is not configured" }, h);

  const mail = feedbackEmail(checked.item);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `feedback-${checked.item.id}` },
    body: JSON.stringify({
      from: process.env.FEEDBACK_FROM ?? "Liftsmith feedback <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()),
      reply_to: checked.item.email,
      subject: mail.subject,
      text: mail.text,
      attachments: mail.attachments,
    }),
  });
  if (!r.ok) return json(502, { error: "Could not send" }, h);
  return json(200, { ok: true }, h);
}
