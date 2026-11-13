import { describe, expect, it } from "vitest";

import { coachingMode, coachingView, coachTabs } from "./coachMode";
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

  it("a coach gets a page per job, payments only once the server takes them", () => {
    const mode = coachingMode({ ...NONE, coach: true }, NO_TEAMS);
    expect(coachTabs(mode, false)).toEqual(["clients", "messages", "schedule", "checkins", "setup"]);
    expect(coachTabs(mode, true)).toEqual(["clients", "messages", "schedule", "checkins", "pay", "setup"]);
    expect(coachingView(mode, false, "schedule")).toMatchObject({ kind: "coach", tab: "schedule" });
    // A page that isn't theirs falls back to the first one.
    expect(coachingView(mode, false, "teams")).toMatchObject({ kind: "coach", tab: "clients" });
  });

  it("an invite, a client or a picked role makes a coach; so does picking it", () => {
    expect(coachingMode({ ...NONE, invite: { code: "ABCD2345", expiresAt: 1 } }, null).coach).toBe(true);
    expect(coachingMode({ ...NONE, clients: [SAM] }, null).coach).toBe(true);
    expect(coachingMode({ ...NONE, role: "physio" }, null).coach).toBe(true);
    expect(coachingMode(NONE, null, "coach").coach).toBe(true);
    expect(coachingMode(NONE, null).coach).toBe(false);
  });

  it("a school coach gets the Teams page; a coach who trains with a coach too gets My coach", () => {
    const school = coachingMode(NONE, { ...NO_TEAMS, school: { school: "Hill High", active: true } as never });
    expect(coachTabs(school, false)).toEqual(["teams"]);
    const both = coachingMode({ ...NONE, coach: true, coaches: [SAM] }, NO_TEAMS);
    expect(coachTabs(both, false).at(-1)).toBe("mine");
  });

  it("someone who is none of these picks a side first", () => {
    expect(coachingView(coachingMode(NONE, NO_TEAMS), false)).toEqual({ kind: "start" });
    expect(coachingView(coachingMode({ ...NONE, coach: true }, NO_TEAMS), false, "start")).toEqual({ kind: "start" });
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
    expect(coachBadge({ coaches: [], clients: 0 })).toBeNull();
  });
});
