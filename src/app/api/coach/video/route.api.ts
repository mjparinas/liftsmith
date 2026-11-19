// Form video check-ins (src/server/formVideos.ts, docs/decisions/trainer-mode.md "Form videos"). Signed in only. Server
// build only. The video's bytes never pass through here: the phone uploads them straight to Vercel Blob with the token
// "start" hands back, and plays them from the link GET ?open= hands back.
// GET: every video this account sent or was sent, with notes, and `send` ("ok", "teen" or "off").
// GET ?open=<id>: that video and a link to watch it for an hour; marks it seen.
// POST { action }: "start" (a client: `coach`, `lift`, `question`, `bytes`, `secs`, `type`), "finish" (`id`, once the
// upload is done), "note" (either side: `id`, `ms`, `text`), "deleteNote" (`id`, your own) and "delete" (`id`).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { addNote, deleteNote, deleteVideo, finishVideo, openVideo, startVideo, videoOverview } from "@/server/formVideos";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const id = new URL(req.url).searchParams.get("open");
  if (id === null) return reply(req, 200, await videoOverview(s.accountId));
  const r = await openVideo(s.accountId, id);
  return r ? reply(req, 200, r) : reply(req, 404, { error: "gone" });
}

const STATUS: Record<string, number> = {
  notClient: 403,
  teen: 403,
  off: 503,
  bad: 400,
  big: 413,
  long: 400,
  slow: 429,
  unknown: 404,
  missing: 409,
  empty: 400,
  full: 409,
};

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req)) as { action?: unknown; id?: unknown } | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  const answer = (r: object) => ("error" in r ? reply(req, STATUS[String(r.error)] ?? 400, r) : reply(req, 200, r));
  switch (body.action) {
    case "start":
      return answer(await startVideo(s.accountId, body));
    case "finish": {
      const r = await finishVideo(s.accountId, body.id);
      return "error" in r ? answer(r) : reply(req, 200, { video: r });
    }
    case "note": {
      const r = await addNote(s.accountId, body);
      return "error" in r ? answer(r) : reply(req, 200, { note: r });
    }
    case "deleteNote":
      await deleteNote(s.accountId, body.id);
      return reply(req, 200, { ok: true });
    case "delete":
      return (await deleteVideo(s.accountId, body.id)) ? reply(req, 200, { ok: true }) : reply(req, 404, { error: "gone" });
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
