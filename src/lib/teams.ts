"use client";

// School teams, the app side (server: src/server/teams.ts; decision record docs/decisions/school-teams.md). A high
// school coach proves their school address and makes teams; athletes aged 13 to 18 join with the team's code and get
// Pro free while they're on it. Each team has a weekly board, members only.
import { api, AuthError, readAccount } from "./auth";
import { coachCode } from "./coachInvite";
import { t } from "./i18n";
import { APP_PATH, SITE_URL } from "./site";

export interface SchoolCoach {
  email: string;
  school: string;
  status: "code" | "pending" | "approved" | "rejected";
  active: boolean;
  until: number | null;
}
export interface Team {
  id: string;
  name: string;
  /** The code athletes join with: only the coach's own teams carry it. */
  code: string;
  school: string;
  coachId: string;
  coachName: string;
  members: number;
  /** Assistant coaches who help with this team (their calendar access is scoped to it): shown to athletes on My team. */
  assistants?: { id: string; name: string }[];
}
export interface Member {
  id: string;
  name: string;
  since: number;
}
export interface TeamsOverview {
  school: SchoolCoach | null;
  codeSent: boolean;
  teams: Team[];
  joined: Team[];
  members: Record<string, Member[]>;
  /** The coach's team sessions still running, by team id (teamSessions.ts): Coaching offers their live board. */
  live: Record<string, string>;
  /** Teams a coach asked this lifter to join: they join from My team with their age, no code needed. */
  invites: Team[];
  /** Athletes each of the coach's teams is waiting on, by team id. */
  invited: Record<string, Member[]>;
  /** Athletes who left each of the coach's teams, newest first, so a coach can add back one who left by mistake. */
  left: Record<string, Member[]>;
  /** Unread team chat messages, by team id. */
  chatUnread: Record<string, number>;
}
/** A message in a team's chat (teamChat.ts). */
export interface TeamMessage {
  id: string;
  name: string;
  /** Written by the team's coach. */
  coach: boolean;
  at: number;
  body: string;
  mine: boolean;
  canDelete: boolean;
  /** Their Friends avatar, or "" for a letter. */
  avatar?: string;
}
export interface TeamChatPage {
  messages: TeamMessage[];
  more: boolean;
  team: { id: string; name: string };
  /** The reader coaches this team. */
  coach: boolean;
}
/** Every list there, whatever an older server or the device's last copy left out. */
export const fullOverview = (o: Partial<TeamsOverview>): TeamsOverview => ({
  school: o.school ?? null,
  codeSent: !!o.codeSent,
  teams: o.teams ?? [],
  joined: o.joined ?? [],
  members: o.members ?? {},
  live: o.live ?? {},
  invites: o.invites ?? [],
  invited: o.invited ?? {},
  left: o.left ?? {},
  chatUnread: o.chatUnread ?? {},
});
export interface BoardRow {
  id: string;
  name: string;
  workouts: number;
  sets: number;
}

/** Ages that join a team (the server checks too). */
export const TEAM_AGES = [13, 14, 15, 16, 17, 18] as const;

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}
const post = <T>(body: Record<string, unknown>) => api<T>("/api/teams/", { token: token(), body });

export const loadTeams = async () => api<TeamsOverview>("/api/teams/", { token: token() });
export const loadBoard = async (team: string) =>
  api<{ team: Team; board: BoardRow[] }>(`/api/teams/?board=${encodeURIComponent(team)}`, { token: token() });
/** Sends a code to the coach's school address. Locally (no email) the server hands the code back. */
export const sendSchoolCode = async (email: string, school: string) =>
  post<{ ok: true; devCode?: string }>({ action: "school", email, school });
export const confirmSchoolCode = async (code: string) => (await post<{ coach: SchoolCoach }>({ action: "confirm", code })).coach;
export const makeTeam = async (name: string) => (await post<{ team: Team }>({ action: "make", name })).team;
export const newTeamCode = async (team: string) => (await post<{ team: Team }>({ action: "newCode", team })).team;
export const deleteTeam = async (team: string) => void (await post({ action: "delete", team }));
export const removeAthlete = async (team: string, id: string) => void (await post({ action: "remove", team, id }));
export const previewTeam = async (code: string) => (await post<{ team: Team }>({ action: "preview", code })).team;
export const joinTeam = async (code: string, age: number) => (await post<{ team: Team }>({ action: "join", code, age })).team;
export const leaveTeam = async (team: string) => void (await post({ action: "leave", team }));
/** A coach adds one of their athletes to a team (the athlete says yes on My team), or takes that back. */
export const inviteToTeam = async (team: string, id: string) => void (await post({ action: "invite", team, id }));
export const cancelTeamInvite = async (team: string, id: string) => void (await post({ action: "uninvite", team, id }));
/** The athlete's answer to a coach adding them. */
export const acceptTeamInvite = async (team: string, age: number) => (await post<{ team: Team }>({ action: "accept", team, age })).team;
export const declineTeamInvite = async (team: string) => void (await post({ action: "decline", team }));
/** A page of a team's chat: the newest, or `before` (earlier) or `after` (new since) a time. */
export const loadTeamChat = async (team: string, at: { before?: number; after?: number } = {}) =>
  post<TeamChatPage>({ action: "chat", team, ...at });
export const sayToTeam = async (team: string, text: string) =>
  (await post<{ message: TeamMessage }>({ action: "say", team, text })).message;
export const unsayToTeam = async (id: string) => void (await post({ action: "unsay", id }));

/** The link a coach sends: it opens Coaching with the team code filled in. */
export const teamUrl = (code: string, base = SITE_URL) => `${base.replace(/\/$/, "")}${APP_PATH}#/trainer/team.${code}`;
/** A team code from a pasted link or typed text, tidied ("" when it can't be one). Same alphabet as coach codes. */
export const teamCodeFrom = (text: string) => coachCode(text).replace(/^team\./, "");

export function teamError(e: unknown): string {
  if (e instanceof AuthError) {
    const known = ["offline", "slow", "unknown", "self", "age", "full", "coachFull", "coaches", "lapsed", "email", "freeMail"];
    const more = ["school", "blocked", "mail", "wrong", "expired", "notCoach", "name", "notClient", "member"];
    if (known.includes(e.message) || more.includes(e.message)) return t(`team.err.${e.message}` as Parameters<typeof t>[0]);
  }
  if (e instanceof AuthError && e.message === "message.link") return t("friends.err.link");
  if (e instanceof AuthError && e.message === "message.words") return t("friends.err.words");
  return t("team.err.failed");
}
