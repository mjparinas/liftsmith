// The Liftsmith community (src/server/community.ts, docs/decisions/community.md). Server build only.
// GET: the board (signed in or not; a session adds what you voted for and follow). ?id=<post>: one post with its
// comments and timeline. ?changelog=1: what shipped lately.
// POST {op, ...} (signed in): create, vote, unvote, follow, comment, uncomment, delete, report.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { sessionOf } from "@/server/accounts";
import { board, changelog, handle, isPostId, thread } from "@/server/community";
import { flagsFor } from "@/server/flags";

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
  if (q.has("changelog")) return reply(req, 200, { updates: await changelog() });
  const viewer = await viewerOf(req);
  const id = q.get("id");
  if (id !== null) {
    const t = isPostId(id) ? await thread(id, viewer) : null;
    return t ? reply(req, 200, t) : reply(req, 404, { error: "gone" });
  }
  return reply(req, 200, await board(viewer));
}

export async function POST(req: Request) {
  // The admin panel's switch turns posting off for everyone at once (the board can still be read).
  const [s, flags] = await Promise.all([signedIn(req), flagsFor(null).catch(() => null)]);
  if (s instanceof Response) return s;
  if (flags && flags.community === false) return reply(req, 503, { error: "off" });
  // One screenshot (at most 450 kB of JPEG, a third more as text) plus the words.
  const body = await readJson(req, 700_000);
  if (body === undefined) return reply(req, 413, { error: "image" });
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  const r = await handle(s.accountId, body as Record<string, unknown>);
  return reply(req, r.status, r.body);
}
