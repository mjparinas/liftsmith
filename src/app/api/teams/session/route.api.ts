// Team sessions (src/server/teamSessions.ts, docs/decisions/school-teams.md "Team sessions"). Signed in only, school
// coaches only. Server build only.
// GET ?id=<session>: the live board of one of the coach's sessions. GET ?last=<team>: each athlete's last weights in
// the team's last few sessions, for the tablet's start. POST: a push from the tablet (`session`, `sets`, `removed`).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { lastWeights, liveBoard, pushSession } from "@/server/teamSessions";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const q = new URL(req.url).searchParams;
  const last = q.get("last");
  if (last !== null) {
    const w = await lastWeights(s.accountId, last);
    return w ? reply(req, 200, { last: w }) : reply(req, 404, { error: "unknown" });
  }
  const b = await liveBoard(s.accountId, q.get("id"));
  return b ? reply(req, 200, { board: b }) : reply(req, 404, { error: "unknown" });
}

const STATUS: Record<string, number> = { slow: 429, unknown: 404, notCoach: 403, full: 413 };

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const r = await pushSession(s.accountId, await readJson(req, 200_000));
  return r.ok ? reply(req, 200, r) : reply(req, STATUS[r.error] ?? 400, { error: r.error });
}
