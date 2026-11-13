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
}
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

/** The link a coach sends: it opens Coaching with the team code filled in. */
export const teamUrl = (code: string, base = SITE_URL) => `${base.replace(/\/$/, "")}${APP_PATH}#/trainer/team.${code}`;
/** A team code from a pasted link or typed text, tidied ("" when it can't be one). Same alphabet as coach codes. */
export const teamCodeFrom = (text: string) => coachCode(text.replace(/team\./i, ""));

export function teamError(e: unknown): string {
  if (e instanceof AuthError) {
    const known = ["offline", "slow", "unknown", "self", "age", "full", "coachFull", "coaches", "lapsed", "email", "freeMail"];
    const more = ["school", "blocked", "mail", "wrong", "expired", "notCoach", "name"];
    if (known.includes(e.message) || more.includes(e.message)) return t(`team.err.${e.message}` as Parameters<typeof t>[0]);
  }
  return t("team.err.failed");
}
