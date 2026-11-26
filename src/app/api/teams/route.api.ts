// School teams (src/server/teams.ts, docs/decisions/school-teams.md). Signed in only. Server build only.
// GET: the coach's school proof and teams, and the teams this lifter is on; GET ?board=<team id>: that team's week.
// POST { action }: "school" (send a code to a school address: `email`, `school`), "confirm" (the emailed `code`),
// "make" (a team: `name`), "newCode" and "delete" (a coach's team: `team`), "remove" (an athlete off a team: `team`,
// `id`), "preview" and "join" (an athlete entering a team code: `code`, and `age` to join) and "leave" (`team`).
// My team (2026-11-25): "invite" and "uninvite" (a coach adds one of their athletes to a team: `team`, `id`), "accept"
// (`team`, `age`) and "decline" (`team`) for the athlete; "chat" (`team`, `before` or `after`), "say" (`team`, `text`)
// and "unsay" (a message `id`) for the team's chat (teamChat.ts).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { resendMail } from "@/server/accounts";
import { teamChat, teamSay, teamUnsay } from "@/server/teamChat";
import {
  acceptTeamInvite,
  cancelTeamInvite,
  confirmSchool,
  declineTeamInvite,
  deleteTeam,
  inviteToTeam,
  joinTeam,
  leaveTeam,
  makeTeam,
  newTeamCode,
  previewTeam,
  removeMember,
  startSchool,
  teamBoard,
  teamsOverview,
} from "@/server/teams";
import { liveSessions } from "@/server/teamSessions";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const board = new URL(req.url).searchParams.get("board");
  // `live`: the coach's team sessions still running, by team (teamSessions.ts), so Coaching can open their board.
  if (board === null) return reply(req, 200, { ...(await teamsOverview(s.accountId)), live: await liveSessions(s.accountId) });
  const b = await teamBoard(s.accountId, board);
  return b ? reply(req, 200, b) : reply(req, 404, { error: "gone" });
}

const STATUS: Record<string, number> = { slow: 429, unknown: 404, mail: 502, notCoach: 403, lapsed: 409 };

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const b = (await readJson(req)) as Record<string, unknown> | undefined;
  if (!b || typeof b !== "object") return reply(req, 400, { error: "Bad request." });
  const fail = (error: string) => reply(req, STATUS[error] ?? 400, { error });
  switch (b.action) {
    case "school": {
      const r = await startSchool(s.accountId, b.email, b.school, resendMail());
      return r.ok ? reply(req, 200, r) : fail(r.error);
    }
    case "confirm": {
      const r = await confirmSchool(s.accountId, b.code);
      return r.ok ? reply(req, 200, r) : fail(r.error);
    }
    case "make": {
      const r = await makeTeam(s.accountId, b.name);
      return "error" in r ? fail(r.error) : reply(req, 200, { team: r });
    }
    case "newCode": {
      const r = await newTeamCode(s.accountId, b.team);
      return r ? reply(req, 200, { team: r }) : fail("unknown");
    }
    case "delete":
      return (await deleteTeam(s.accountId, b.team)) ? reply(req, 200, { ok: true }) : fail("unknown");
    case "remove":
      return (await removeMember(s.accountId, b.team, b.id)) ? reply(req, 200, { ok: true }) : fail("unknown");
    case "preview":
    case "join": {
      const r = b.action === "join" ? await joinTeam(s.accountId, b.code, b.age) : await previewTeam(s.accountId, b.code);
      return "error" in r ? fail(r.error) : reply(req, 200, r);
    }
    case "invite": {
      const r = await inviteToTeam(s.accountId, b.team, b.id);
      return "error" in r ? fail(r.error) : reply(req, 200, r);
    }
    case "uninvite":
      return (await cancelTeamInvite(s.accountId, b.team, b.id)) ? reply(req, 200, { ok: true }) : fail("unknown");
    case "accept": {
      const r = await acceptTeamInvite(s.accountId, b.team, b.age);
      return "error" in r ? fail(r.error) : reply(req, 200, r);
    }
    case "decline":
      return (await declineTeamInvite(s.accountId, b.team)) ? reply(req, 200, { ok: true }) : fail("unknown");
    case "chat":
    case "say":
    case "unsay": {
      const r =
        b.action === "chat"
          ? await teamChat(s.accountId, b)
          : b.action === "say"
            ? await teamSay(s.accountId, b)
            : await teamUnsay(s.accountId, b);
      return reply(req, r.code, r.body);
    }
    case "leave":
      return (await leaveTeam(s.accountId, b.team)) ? reply(req, 200, { ok: true }) : fail("unknown");
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
