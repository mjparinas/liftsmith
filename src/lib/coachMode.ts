// Which coaching pages a lifter sees (Melvin, 2026-11-13: "if i'm a client, i probably shouldn't see your clients, school
// teams, or coach a high school team ... keep clients / coaches / high school coaches functionality separate"; decision
// record docs/decisions/trainer-mode.md "Pages for each side"). One account still does everything; what it has done decides
// what Coaching opens on:
// - a client (linked to a coach, or on a school team) sees only their coach: messages, check-ins, sessions, payments and
//   what they share;
// - a coach (has coached, or picked "I coach clients", which signing up from the coaches page does too) gets the coach's pages, one per job, as tabs;
// - a school coach (has a school address or a team, or picked "I coach a high school team") gets the Teams page;
// - someone who is none of these picks how they'll use coaching first.
import type { TeamsOverview } from "./teams";
import type { Overview } from "./trainer";

export type CoachTab = "clients" | "messages" | "schedule" | "checkins" | "pay" | "teams" | "setup" | "mine";
export const COACH_TABS: readonly CoachTab[] = ["clients", "messages", "schedule", "checkins", "pay", "teams", "setup", "mine"];

export interface Mode {
  /** Coaches clients (or said they will). */
  coach: boolean;
  /** Coaches a high school team (or said they will). */
  school: boolean;
  /** Trains with a coach. */
  client: boolean;
  /** Is on a school team. */
  athlete: boolean;
}

/** What the lifter picked on Coaching's first page, kept on the device until the server knows (their first invite). */
export type Picked = "coach" | "school" | null;
const PICKED = "liftsmith.coachMode";

export function readPicked(): Picked {
  try {
    const v = localStorage.getItem(PICKED);
    return v === "coach" || v === "school" ? v : null;
  } catch {
    return null;
  }
}
export function savePicked(v: Picked): void {
  try {
    if (v) localStorage.setItem(PICKED, v);
    else localStorage.removeItem(PICKED);
  } catch {
    // private mode: the pick holds while the page is open
  }
}

type O = Pick<Overview, "invite" | "clients" | "coaches" | "role" | "coach">;
type T = Pick<TeamsOverview, "school" | "teams" | "joined">;

export function coachingMode(o: O | null, teams: T | null, picked: Picked = null): Mode {
  return {
    coach: (!!o && (!!o.coach || !!o.invite || o.clients.length > 0 || !!o.role)) || picked === "coach",
    school: (!!teams && (!!teams.school || teams.teams.length > 0)) || picked === "school",
    client: (o?.coaches.length ?? 0) > 0,
    athlete: (teams?.joined.length ?? 0) > 0,
  };
}

/** The coach's pages, in order. Payments only once the server takes them; My coach when they train with one too. */
export function coachTabs(mode: Mode, payments: boolean): CoachTab[] {
  const tabs: CoachTab[] = [];
  if (mode.coach) tabs.push("clients", "messages", "schedule", "checkins");
  if (mode.coach && payments) tabs.push("pay");
  if (mode.school) tabs.push("teams");
  if (mode.coach) tabs.push("setup");
  if (tabs.length && (mode.client || mode.athlete)) tabs.push("mine");
  return tabs;
}

/** What Coaching shows: the coach's pages (on a tab), the client's page, or the first page that asks. */
export type View = { kind: "coach"; tab: CoachTab; tabs: CoachTab[] } | { kind: "client" } | { kind: "start" };

export function coachingView(mode: Mode, payments: boolean, asked?: string): View {
  if (asked === "start") return { kind: "start" };
  const tabs = coachTabs(mode, payments);
  if (tabs.length) {
    const tab = (tabs as string[]).includes(asked ?? "") ? (asked as CoachTab) : tabs[0]!;
    return { kind: "coach", tab, tabs };
  }
  if (mode.client || mode.athlete) return { kind: "client" };
  return { kind: "start" };
}
