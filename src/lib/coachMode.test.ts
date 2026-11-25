import { describe, expect, it } from "vitest";

import { coachingMode, coachingNav, coachingView, coachTabs, coachTools, isSportsCoach } from "./coachMode";
import { coachBadge } from "./trainer";

const NONE = { invite: null, clients: [], coaches: [], role: null, coach: false };
const NO_TEAMS = { school: null, teams: [], joined: [] };
const SAM = { id: "k1", name: "Sam", since: 1 };

describe("which coaching pages a lifter sees", () => {
  it("a client sees only the client's page: never the coach's tabs or school teams", () => {
    const mode = coachingMode({ ...NONE, coaches: [SAM] }, NO_TEAMS);
    expect(mode).toEqual({ coach: false, school: false, client: true, athlete: false });
    expect(coachTabs(mode, true)).toEqual([]);
    expect(coachingView(mode, true)).toEqual({ kind: "client" });
    // Asking for a coach's page by its link doesn't open it for a client.
    expect(coachingView(mode, true, "clients")).toEqual({ kind: "client" });
  });

  it("a personal trainer gets booking tools; payments only once the server takes them", () => {
    const mode = coachingMode({ ...NONE, coach: true, role: "trainer" }, NO_TEAMS);
    expect(coachTabs(mode, false, "trainer")).toEqual(["clients", "messages", "schedule", "checkins", "programs", "setup"]);
    expect(coachTabs(mode, true, "trainer")).toEqual(["clients", "messages", "schedule", "checkins", "programs", "pay", "setup"]);
    expect(coachingView(mode, false, "schedule", "trainer")).toMatchObject({ kind: "coach", tab: "schedule" });
    expect(coachingView(mode, false, "teams", "trainer")).toMatchObject({ kind: "coach", tab: "clients" });
  });

  it("before How you work, a new coach only sees Clients, Messages and Setup", () => {
    const mode = coachingMode({ ...NONE, coach: true }, NO_TEAMS);
    expect(coachTabs(mode, true, null)).toEqual(["clients", "messages", "setup"]);
    expect(coachingView(mode, true, "schedule", null)).toMatchObject({ kind: "coach", tab: "clients" });
  });

  it("a sports coach leads with Programs; Teams when school; no Schedule or Payments", () => {
    const mode = coachingMode({ ...NONE, coach: true, role: "coach" }, NO_TEAMS);
    expect(coachTabs(mode, true, "coach")).toEqual(["programs", "messages", "clients", "setup"]);
    expect(isSportsCoach(mode, "coach")).toBe(true);
    const school = coachingMode({ ...NONE, coach: true, role: "coach" }, { ...NO_TEAMS, school: { school: "Hill High", active: true } as never });
    expect(coachTabs(school, true, "coach")).toEqual(["programs", "teams", "messages", "clients", "setup"]);
    expect(coachingView(school, true, undefined, "coach")).toMatchObject({ kind: "coach", tab: "programs" });
  });

  it("a physio gets the same tabs as a personal trainer", () => {
    const mode = coachingMode({ ...NONE, role: "physio" }, NO_TEAMS);
    expect(coachTabs(mode, false, "physio")).toEqual(["clients", "messages", "schedule", "checkins", "programs", "setup"]);
    expect(coachTools("physio").rehab).toBe(true);
    expect(coachTools("physio").nutrition).toBe(false);
  });

  it("an invite, a client or a picked role makes a coach; so does picking it", () => {
    expect(coachingMode({ ...NONE, invite: { code: "ABCD2345", expiresAt: 1 } }, null).coach).toBe(true);
    expect(coachingMode({ ...NONE, clients: [SAM] }, null).coach).toBe(true);
    expect(coachingMode({ ...NONE, role: "physio" }, null).coach).toBe(true);
    expect(coachingMode(NONE, null, "coach").coach).toBe(true);
    expect(coachingMode(NONE, null).coach).toBe(false);
  });

  it("a school-only coach gets the sports tabs with Teams; My coach when they train with one too", () => {
    const school = coachingMode(NONE, { ...NO_TEAMS, school: { school: "Hill High", active: true } as never });
    expect(isSportsCoach(school, null)).toBe(true);
    expect(coachTabs(school, false, null)).toEqual(["programs", "teams", "messages", "clients", "setup"]);
    const both = coachingMode({ ...NONE, coach: true, role: "trainer", coaches: [SAM] }, NO_TEAMS);
    expect(coachTabs(both, false, "trainer").at(-1)).toBe("mine");
  });

  it("someone who is none of these picks a side first", () => {
    expect(coachingView(coachingMode(NONE, NO_TEAMS), false)).toEqual({ kind: "start" });
    expect(coachingView(coachingMode({ ...NONE, coach: true }, NO_TEAMS), false, "start")).toEqual({ kind: "start" });
  });

  it("sports coaches hide booking, check-ins, pay, rehab, nutrition and form videos", () => {
    expect(coachTools("coach")).toEqual({
      schedule: false,
      checkins: false,
      pay: false,
      rehab: false,
      nutrition: false,
      videos: false,
      sessions: false,
    });
    expect(coachTools("trainer").sessions).toBe(true);
    expect(coachTools("trainer").nutrition).toBe(true);
  });
});

describe("the navigation item", () => {
  it("names a trainer, a coach and a physio, and hides it for everyone else", () => {
    expect(coachingNav("trainer")).toEqual({ role: "trainer", icon: "dumbbell" });
    expect(coachingNav("coach")).toEqual({ role: "coach", icon: "flag" });
    expect(coachingNav("physio")).toEqual({ role: "physio", icon: "bandage" });
    expect(coachingNav(null)).toBeNull();
    expect(coachingNav(undefined)).toBeNull();
  });
});

describe("the badge by the lifter's name", () => {
  it("names the coach, in the coach's own word", () => {
    expect(coachBadge({ coaches: [SAM], clients: 0 })).toBe("Coached by Sam");
    expect(coachBadge({ coaches: [{ ...SAM, role: "trainer" }], clients: 0 })).toBe("Trained by Sam");
    expect(coachBadge({ coaches: [{ ...SAM, role: "physio" }], clients: 0 })).toBe("Physio: Sam");
    expect(coachBadge({ coaches: [SAM, { id: "k2", name: "Ana" }], clients: 0 })).toBe("Coached by Sam and 1 more");
  });

  it("says Coach with a count for someone who coaches, and nothing for everyone else", () => {
    expect(coachBadge({ coaches: [], clients: 4 })).toBe("Coach · 4 clients");
    expect(coachBadge({ coaches: [], clients: 4, role: "coach" })).toBe("Coach · 4 athletes");
    expect(coachBadge({ coaches: [], clients: 4, role: "trainer" })).toBe("Coach · 4 clients");
    expect(coachBadge({ coaches: [], clients: 4, role: "physio" })).toBe("Coach · 4 clients");
    expect(coachBadge({ coaches: [], clients: 0 })).toBeNull();
  });
});
