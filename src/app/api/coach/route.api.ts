// Trainer mode (src/server/coach.ts). Signed in only. Server build only.
// GET: your invite, clients and coaches; GET ?client=<id>: that client's training, if they're your client.
// POST { action }: "invite" (a fresh code), "cancel" (no code), "preview" and "join" (a client entering a
// code), "unlink" (either side ends it, with `id`), "assign" (a coach gives a client a routine: `client`, `name`,
// `code`), "unassign" (with the plan's `id`), "setup" (what the coach's new clients start setup with: `setup`) and
// "note" (the coach's note to a client: `client`, `text`; empty text clears it).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import {
  assignPlan,
  cancelInvite,
  clientView,
  isAccountId,
  joinCoach,
  makeInvite,
  overview,
  previewInvite,
  removePlan,
  saveSetup,
  setNote,
  unlink,
} from "@/server/coach";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const client = new URL(req.url).searchParams.get("client");
  if (client === null) return reply(req, 200, await overview(s.accountId));
  if (!isAccountId(client)) return reply(req, 400, { error: "Bad request." });
  const view = await clientView(s.accountId, client);
  return view ? reply(req, 200, view) : reply(req, 404, { error: "gone" });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req)) as
    { action?: unknown; code?: unknown; id?: unknown; client?: unknown; name?: unknown; setup?: unknown; text?: unknown } | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  switch (body.action) {
    case "invite":
      return reply(req, 200, { invite: await makeInvite(s.accountId) });
    case "cancel":
      await cancelInvite(s.accountId);
      return reply(req, 200, { ok: true });
    case "preview":
    case "join": {
      const r = body.action === "join" ? await joinCoach(s.accountId, body.code) : await previewInvite(s.accountId, body.code);
      if ("error" in r) return reply(req, r.error === "slow" ? 429 : r.error === "unknown" ? 404 : 409, r);
      return reply(req, 200, r);
    }
    case "assign": {
      const r = await assignPlan(s.accountId, body.client, body.name, body.code);
      if ("error" in r) return reply(req, r.error === "notClient" ? 404 : r.error === "full" ? 409 : 400, r);
      return reply(req, 200, { plan: r });
    }
    case "setup":
      return reply(req, 200, { setup: await saveSetup(s.accountId, body.setup) });
    case "note": {
      const r = await setNote(s.accountId, body.client, body.text);
      if (r && "error" in r) return reply(req, 404, r);
      return reply(req, 200, { note: r });
    }
    case "unassign":
      await removePlan(s.accountId, body.id);
      return reply(req, 200, { ok: true });
    case "unlink":
      if (!isAccountId(body.id)) return reply(req, 400, { error: "Bad request." });
      await unlink(s.accountId, body.id);
      return reply(req, 200, { ok: true });
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
