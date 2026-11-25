// Which coaching pages a lifter sees (Melvin, 2026-11-13: "if i'm a client, i probably shouldn't see your clients, school
// teams, or coach a high school team ... keep clients / coaches / high school coaches functionality separate"; decision
// record docs/decisions/trainer-mode.md "Pages for each side"). One account still does everything; what it has done decides
// what Coaching opens on:
// - a client (linked to a coach, or on a school team) sees only their coach: messages, check-ins, sessions, payments and
//   what they share;
// - a personal trainer or physio gets their tools as tabs; a sports coach (role coach, or school-only) gets Programs first;
// - roles hide irrelevant tools (2026-11-24), not only labels; Messages stay for every persona;
// - someone who is none of these picks how they'll use coaching first.
import type { TeamsOverview } from "./teams";
import type { Overview, Role } from "./trainer";

export type CoachTab = "clients" | "messages" | "schedule" | "checkins" | "programs" | "pay" | "teams" | "setup" | "mine";
export const COACH_TABS: readonly CoachTab[] = ["clients", "messages", "schedule", "checkins", "programs", "pay", "teams", "setup", "mine"];

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

/** Sports / team coach (not personal trainer or physio). School-only path counts as sports until they pick another role. */
export function isSportsCoach(mode: Mode, role: Role | null): boolean {
  if (role === "trainer" || role === "physio") return false;
  if (role === "coach") return true;
  return mode.school && !mode.coach;
}

/** Which tools a coach's client report and tabs expose for their role. Messages are always on. */
export function coachTools(role: Role | null): {
  schedule: boolean;
  checkins: boolean;
  pay: boolean;
  rehab: boolean;
  nutrition: boolean;
  videos: boolean;
  sessions: boolean;
} {
  if (role === "coach") {
    return { schedule: false, checkins: false, pay: false, rehab: false, nutrition: false, videos: false, sessions: false };
  }
  if (role === "physio") {
    return { schedule: true, checkins: true, pay: true, rehab: true, nutrition: false, videos: true, sessions: true };
  }
  if (role === "trainer") {
    return { schedule: true, checkins: true, pay: true, rehab: false, nutrition: true, videos: true, sessions: true };
  }
  // Role not picked yet: keep the report lean until Setup › How you work.
  return { schedule: false, checkins: false, pay: false, rehab: false, nutrition: false, videos: false, sessions: false };
}

/**
 * The coach's pages, in order. Role gates the set (2026-11-24): personal trainer and physio get booking and check-ins;
 * sports coaches lead with Programs (and Teams when school); pending role pick gets Clients, Messages and Setup only.
 */
export function coachTabs(mode: Mode, payments: boolean, role: Role | null = null): CoachTab[] {
  if (!mode.coach && !mode.school) return [];
  const tabs: CoachTab[] = [];
  const mine = mode.client || mode.athlete;

  if (role === "trainer" || role === "physio") {
    tabs.push("clients", "messages", "schedule", "checkins", "programs");
    if (payments) tabs.push("pay");
    if (mode.school) tabs.push("teams");
    tabs.push("setup");
  } else if (role === "coach") {
    tabs.push("programs");
    if (mode.school) tabs.push("teams");
    tabs.push("messages", "clients", "setup");
  } else if (mode.coach) {
    // Picked personal training / coaching clients but not How you work yet.
    tabs.push("clients", "messages", "setup");
  } else {
    // School-only: sports coach path.
    tabs.push("programs", "teams", "messages", "clients", "setup");
  }
  if (tabs.length && mine) tabs.push("mine");
  return tabs;
}

/** What Coaching shows: the coach's pages (on a tab), the client's page, or the first page that asks. */
export type View = { kind: "coach"; tab: CoachTab; tabs: CoachTab[] } | { kind: "client" } | { kind: "start" };

export function coachingView(mode: Mode, payments: boolean, asked?: string, role: Role | null = null): View {
  if (asked === "start") return { kind: "start" };
  const tabs = coachTabs(mode, payments, role);
  if (tabs.length) {
    const tab = (tabs as string[]).includes(asked ?? "") ? (asked as CoachTab) : tabs[0]!;
    return { kind: "coach", tab, tabs };
  }
  if (mode.client || mode.athlete) return { kind: "client" };
  return { kind: "start" };
}
