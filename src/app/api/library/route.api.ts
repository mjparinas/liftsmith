// The public routine library (src/server/routineLibrary.ts, docs/decisions/routine-library.md). Server build only.
// GET (signed in or not): routines matching ?q= (words), ?goal=, ?level=, ?have=<equipment ids, comma-separated> (only
// routines whose equipment is all there) and ?sort=top|new. GET ?id=<id>: one routine, with the viewer's own stars and
// whether they saved it. GET ?mine=1 (signed in): the lifter's own published routines.
// POST { action } (signed in): "publish" (`routine`: code, title, about, goal, level, minutes, equipment, showName, and
// `id` to change one), "unpublish" (`id`), "save" (`id`: counts a save from the library once), "rate" (`id`, `stars`
// 0 to 5, 0 takes them back) and "report" (`id`, `reason`, `note`).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { sessionOf } from "@/server/accounts";
import { rateLimit } from "@/server/db";
import {
  browseLibrary,
  libraryRoutine,
  myLibrary,
  noteSave,
  publishRoutine,
  queryFrom,
  rateRoutine,
  reportRoutine,
  unpublishRoutine,
} from "@/server/routineLibrary";

export const OPTIONS = preflight;

async function viewerOf(req: Request): Promise<string | null> {
  if (!req.headers.get("authorization")) return null;
  try {
    return (await sessionOf(req))?.accountId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (q.has("mine")) {
    const s = await signedIn(req);
    if (s instanceof Response) return s;
    return reply(req, 200, { mine: await myLibrary(s.accountId) });
  }
  const viewer = await viewerOf(req);
  const id = q.get("id");
  if (id !== null) {
    const r = await libraryRoutine(id, viewer);
    return r ? reply(req, 200, { routine: r }) : reply(req, 404, { error: "gone" });
  }
  return reply(req, 200, { routines: await browseLibrary(viewer, queryFrom(q)) });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req, 12_000)) as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  if (!(await rateLimit(`library:${s.accountId}`, 120, 3_600_000).catch(() => true))) return reply(req, 429, { error: "slow" });
  switch (body.action) {
    case "publish": {
      if (!(await rateLimit(`library-publish:${s.accountId}`, 20, 86_400_000).catch(() => true))) return reply(req, 429, { error: "slow" });
      const r = await publishRoutine(s.accountId, body.routine);
      if ("error" in r) return reply(req, r.error === "notYours" ? 404 : r.error === "full" ? 409 : r.error === "teen" ? 403 : 400, r);
      return reply(req, 200, { routine: r });
    }
    case "unpublish":
      return (await unpublishRoutine(s.accountId, body.id)) ? reply(req, 200, { ok: true }) : reply(req, 404, { error: "gone" });
    case "save":
      return (await noteSave(s.accountId, body.id)) ? reply(req, 200, { ok: true }) : reply(req, 404, { error: "gone" });
    case "rate": {
      const r = await rateRoutine(s.accountId, body.id, body.stars);
      if ("error" in r) return reply(req, r.error === "gone" ? 404 : r.error === "bad" ? 400 : 403, r);
      return reply(req, 200, { rating: r });
    }
    case "report":
      if (!(await rateLimit(`library-report:${s.accountId}`, 20, 86_400_000).catch(() => true))) return reply(req, 429, { error: "slow" });
      return (await reportRoutine(s.accountId, body.id, body.reason, body.note))
        ? reply(req, 200, { ok: true })
        : reply(req, 400, { error: "bad" });
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
