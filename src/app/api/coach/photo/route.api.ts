// Photo answers to check-in forms (src/server/coachForms.ts, docs/decisions/trainer-mode.md "Check-in forms"). Signed
// in only. Server build only. Its own route because a photo is far bigger than the coach route's 8 kB body.
// GET ?checkin=<id>&q=<question id>: the photo, for the coach who sent the check-in or the client who answered it.
// POST { id, q, photo }: the client attaches a JPEG data URL to a photo question of a check-in waiting for them.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { FORM_LIMITS, photoFor, savePhoto } from "@/server/coachForms";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const q = new URL(req.url).searchParams;
  const photo = await photoFor(s.accountId, q.get("checkin"), q.get("q"));
  return photo ? reply(req, 200, { photo }) : reply(req, 404, { error: "gone" });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req, FORM_LIMITS.photoChars + 1_000)) as { id?: unknown; q?: unknown; photo?: unknown } | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  const r = await savePhoto(s.accountId, body.id, body.q, body.photo);
  if (r === true) return reply(req, 200, { ok: true });
  const status = { unknown: 404, answered: 409, bad: 400, teen: 403, busy: 429 }[r.error];
  return reply(req, status, r);
}
