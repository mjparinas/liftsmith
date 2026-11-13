// Trainer mode (src/server/coach.ts). Signed in only. Server build only.
// GET: your invite, clients and coaches; GET ?client=<id>: that client's training, if they're your client.
// POST { action }: "invite" (a fresh code), "cancel" (no code), "preview" and "join" (a client entering a
// code), "unlink" (either side ends it, with `id`), "assign" (a coach gives a client a routine: `client`, `name`,
// `code`), "unassign" (with the plan's `id`), "setup" (what the coach's new clients start setup with: `setup`) and
// "note" (the coach's note to a client: `client`, `text`; empty text clears it), "send" (a chat message to the other
// side: `id`, `text`), "targets" (a coach's daily calories and protein for a client: `client`, `kcal`, `protein`;
// both empty clears them), "share" (a client shares body data with a coach or stops: `id`, `on`), "alerts" (a coach's
// alerts on or off: `on`) and "pushToken" (this phone's push token, for coaching pushes without Friends).
// GET ?chat=<id>[&before=<ms>]: the messages with that person, which marks them read.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import {
  assignPlan,
  cancelInvite,
  clientView,
  isAccountId,
  joinCoach,
  makeInvite,
  messages,
  overview,
  previewInvite,
  removePlan,
  saveSetup,
  sendMessage,
  setAlerts,
  setNote,
  setShare,
  setTargets,
  unlink,
} from "@/server/coach";
import { saveToken } from "@/server/push";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const q = new URL(req.url).searchParams;
  const chat = q.get("chat");
  if (chat !== null) {
    const r = await messages(s.accountId, chat, q.has("before") ? Number(q.get("before")) : undefined);
    return "error" in r ? reply(req, 404, r) : reply(req, 200, r);
  }
  const client = q.get("client");
  if (client === null) return reply(req, 200, await overview(s.accountId));
  if (!isAccountId(client)) return reply(req, 400, { error: "Bad request." });
  const view = await clientView(s.accountId, client);
  return view ? reply(req, 200, view) : reply(req, 404, { error: "gone" });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req)) as
    | {
        action?: unknown;
        code?: unknown;
        id?: unknown;
        client?: unknown;
        name?: unknown;
        setup?: unknown;
        text?: unknown;
        via?: unknown;
        on?: unknown;
        token?: unknown;
        platform?: unknown;
        lang?: unknown;
        kcal?: unknown;
        protein?: unknown;
      }
    | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  switch (body.action) {
    case "invite":
      return reply(req, 200, { invite: await makeInvite(s.accountId, Date.now(), undefined, body.via) });
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
    case "targets": {
      const r = await setTargets(s.accountId, body.client, body.kcal, body.protein);
      if (r && "error" in r) return reply(req, 404, r);
      return reply(req, 200, { targets: r });
    }
    case "send": {
      const r = await sendMessage(s.accountId, body.id, body.text);
      if ("error" in r) return reply(req, r.error === "slow" ? 429 : r.error === "empty" ? 400 : 404, r);
      return reply(req, 200, { message: r });
    }
    case "share": {
      const r = await setShare(s.accountId, body.id, body.on);
      if (typeof r === "object") return reply(req, 404, r);
      return reply(req, 200, { on: r });
    }
    case "alerts":
      return reply(req, 200, { on: await setAlerts(s.accountId, body.on) });
    case "pushToken": {
      const str = (x: unknown) => (typeof x === "string" ? x : "");
      return (await saveToken(s.accountId, str(body.token), str(body.platform), str(body.lang)))
        ? reply(req, 200, { ok: true })
        : reply(req, 400, { error: "token" });
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
