// POST /api/reminders/: create or update an email reminder subscription (double opt-in).
// DELETE /api/reminders/: stop every email and erase the address.
// Server build only (Vercel). Needs RESEND_API_KEY, REMINDER_SECRET, MAIL_FROM and MAIL_POSTAL_ADDRESS,
// plus the database (DATABASE_URL or TURSO_DATABASE_URL). See src/server/reminders.ts.
import { checkBody, remove, subscribe } from "@/server/reminders";
import { cors, limited, readJson, setup } from "@/server/reminderHttp";

const json = (status: number, body: unknown, headers: Record<string, string>) => Response.json(body, { status, headers });

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const h = cors(req.headers.get("origin"));
  if (limited(req, 60)) return json(429, { error: "Too many requests" }, h);
  const s = setup();
  if (!s) return json(503, { error: "Email reminders are not configured" }, h);
  const raw = await readJson(req);
  if (raw === undefined) return json(400, { error: "Not JSON" }, h);
  const checked = checkBody(raw);
  if (!checked.ok) return json(400, { error: checked.error }, h);
  const r = await subscribe(checked.body, s.store, s.mail, s.env, Date.now());
  return json(r.code, r.body, h);
}

export async function DELETE(req: Request) {
  const h = cors(req.headers.get("origin"));
  if (limited(req, 60)) return json(429, { error: "Too many requests" }, h);
  const s = setup();
  if (!s) return json(503, { error: "Email reminders are not configured" }, h);
  const raw = (await readJson(req)) as { id?: unknown; token?: unknown } | undefined;
  if (typeof raw?.id !== "string" || typeof raw.token !== "string") return json(400, { error: "Bad request" }, h);
  const r = await remove(raw.id, raw.token, s.store, s.mail, Date.now());
  return json(r.code, r.body, h);
}
