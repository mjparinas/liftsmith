import { beforeEach, describe, expect, it } from "vitest";

import { accessFor } from "./access";
import { deleteAccount } from "./accounts";
import { isClient } from "./coach";
import { query, resetDb } from "./db";
import { join as joinFriends, me as myFriends, update as updateFriends } from "./social";
import { sync } from "./sync";
import {
  confirmSchool,
  decideSchool,
  deleteTeam,
  domainOf,
  firstName,
  isFreeMail,
  isMinor,
  joinTeam,
  leaveTeam,
  looksLikeSchool,
  makeTeam,
  previewTeam,
  removeMember,
  schoolPro,
  schoolQueue,
  startSchool,
  TEAM_LIMITS,
  teamBoard,
  teamsOverview,
} from "./teams";

const NOW = Date.UTC(2026, 10, 13);
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
});

/** A coach who proves an address: the code comes back because there's no mail in tests. */
async function prove(coach: string, email: string, school = "Walnut Grove Secondary", now = NOW) {
  const s = await startSchool(coach, email, school, null, now);
  if (!s.ok || !s.devCode) throw new Error(`no code: ${JSON.stringify(s)}`);
  return confirmSchool(coach, s.devCode, now);
}

async function verifiedCoach(coach = "coach", now = NOW) {
  await prove(coach, `${coach}@lincoln.k12.ca.us`, "Lincoln High", now);
}

const push = (account: string, events: Record<string, unknown>[], profile?: Record<string, unknown>) =>
  sync(account, `s-${account}`, {
    cursor: 0,
    events: events as { id: string; at: number }[],
    deleted: [],
    records: profile ? [{ key: "profile", value: { onboarded: true, ...profile }, updatedAt: NOW }] : [],
    first: false,
  });

describe("school addresses", () => {
  it("tells free mail from school domains", () => {
    expect(domainOf("Coach@Lincoln.K12.CA.us".toLowerCase())).toBe("lincoln.k12.ca.us");
    expect(isFreeMail("gmail.com")).toBe(true);
    expect(isFreeMail("sd35.bc.ca")).toBe(false);
    expect(looksLikeSchool("lincoln.k12.ca.us")).toBe(true);
    expect(looksLikeSchool("k12.tx.us")).toBe(true);
    expect(looksLikeSchool("stmarys.sch.uk")).toBe(true);
    expect(looksLikeSchool("k12.com")).toBe(false);
    expect(looksLikeSchool("ubc.ca")).toBe(false);
  });

  it("refuses free mail, a missing school name and blocked domains", async () => {
    expect(await startSchool("c", "coach@gmail.com", "Lincoln", null, NOW)).toEqual({ ok: false, error: "freeMail" });
    expect(await startSchool("c", "not-an-email", "Lincoln", null, NOW)).toEqual({ ok: false, error: "email" });
    expect(await startSchool("c", "c@lincoln.k12.ca.us", " x ", null, NOW)).toEqual({ ok: false, error: "school" });
  });

  it("approves a known school domain at once, and Pro follows", async () => {
    const r = await prove("coach", "coach@lincoln.k12.ca.us", "Lincoln High");
    expect(r.ok && r.coach.active).toBe(true);
    expect(await schoolPro("coach", NOW)).toBe("school");
    const a = await accessFor("coach", "coach@lincoln.k12.ca.us", NOW);
    expect(a).toMatchObject({ pro: true, via: "school" });
  });

  it("an unknown domain waits for staff; approving trusts the domain for the next coach", async () => {
    const r = await prove("a", "a@sd35.bc.ca");
    expect(r.ok && r.coach.status).toBe("pending");
    expect(await schoolPro("a", NOW)).toBeNull();
    expect((await schoolQueue()).coaches.map((c) => c.status)).toEqual(["pending"]);
    expect(await decideSchool("a", "approve", NOW)).toBe(true);
    expect(await schoolPro("a", NOW)).toBe("school");
    const b = await prove("b", "b@sd35.bc.ca");
    expect(b.ok && b.coach.active).toBe(true);
  });

  it("blocking a domain rejects everyone there and stops new codes", async () => {
    await prove("a", "a@acme.com");
    await decideSchool("a", "block", NOW);
    expect((await teamsOverview("a", NOW)).school?.status).toBe("rejected");
    expect(await startSchool("b", "b@acme.com", "Acme High", null, NOW)).toEqual({ ok: false, error: "blocked" });
  });

  it("counts wrong codes before comparing, and stops after five", async () => {
    await startSchool("c", "c@lincoln.k12.ca.us", "Lincoln High", null, NOW);
    for (let i = 0; i < TEAM_LIMITS.tries; i++) expect(await confirmSchool("c", "000000x", NOW)).toEqual({ ok: false, error: "wrong" });
    expect(await confirmSchool("c", "123456", NOW)).toEqual({ ok: false, error: "expired" });
  });

  it("a code expires after 30 minutes", async () => {
    const s = await startSchool("c", "c@lincoln.k12.ca.us", "Lincoln High", null, NOW);
    expect(s.ok).toBe(true);
    const code = s.ok ? s.devCode! : "";
    expect(await confirmSchool("c", code, NOW + TEAM_LIMITS.codeMs + 1)).toEqual({ ok: false, error: "expired" });
  });

  it("the proof lasts a school year, then Pro stops until it's confirmed again", async () => {
    await verifiedCoach("coach", NOW);
    expect(await schoolPro("coach", NOW + TEAM_LIMITS.verifiedMs - DAY)).toBe("school");
    expect(await schoolPro("coach", NOW + TEAM_LIMITS.verifiedMs + DAY)).toBeNull();
  });
});

describe("teams", () => {
  it("only a verified coach makes teams, up to five", async () => {
    expect(await makeTeam("coach", "Senior boys", NOW)).toEqual({ error: "notCoach" });
    await verifiedCoach();
    for (let i = 0; i < TEAM_LIMITS.teams; i++) expect("error" in (await makeTeam("coach", `Team ${i}`, NOW))).toBe(false);
    expect(await makeTeam("coach", "One more", NOW)).toEqual({ error: "full" });
  });

  it("athletes aged 13 to 18 join, become the coach's clients and get Pro", async () => {
    await verifiedCoach();
    const team = await makeTeam("coach", "Volleyball", NOW, "VBAL2345");
    if ("error" in team) throw new Error();
    expect(await joinTeam("kid", "VBAL-2345", 12, NOW)).toEqual({ error: "age" });
    expect(await joinTeam("kid", "VBAL-2345", 19, NOW)).toEqual({ error: "age" });
    const r = await joinTeam("kid", "vbal 2345", 15, NOW);
    expect("team" in r && r.team.name).toBe("Volleyball");
    expect(await isClient("coach", "kid")).toBe(true);
    expect(await schoolPro("kid", NOW)).toBe("team");
    expect(await accessFor("kid", null, NOW)).toMatchObject({ pro: true, via: "team" });
    // Joining twice is a no-op.
    await joinTeam("kid", "VBAL2345", 15, NOW);
    expect((await teamsOverview("coach", NOW)).members[team.id]).toHaveLength(1);
  });

  it("free Pro ends when the athlete is past high school age", async () => {
    await verifiedCoach();
    await makeTeam("coach", "Track", NOW, "TRAK2345");
    await joinTeam("kid", "TRAK2345", 18, NOW);
    expect(await schoolPro("kid", NOW)).toBe("team");
    expect(await schoolPro("kid", NOW + 2 * 365 * DAY)).toBeNull();
  });

  it("a coach whose proof ran out can't take new athletes, and their athletes lose Pro", async () => {
    await verifiedCoach();
    await makeTeam("coach", "Track", NOW, "TRAK2345");
    await joinTeam("kid", "TRAK2345", 16, NOW);
    const later = NOW + TEAM_LIMITS.verifiedMs + DAY;
    expect(await previewTeam("other", "TRAK2345", later)).toEqual({ error: "lapsed" });
    expect(await schoolPro("kid", later)).toBeNull();
  });

  it("leaving, being removed or the team being deleted ends the coach link", async () => {
    await verifiedCoach();
    const a = await makeTeam("coach", "Team A", NOW, "AAAA2345");
    const b = await makeTeam("coach", "Team B", NOW, "BBBB2345");
    if ("error" in a || "error" in b) throw new Error();
    await joinTeam("kid", "AAAA2345", 16, NOW);
    await joinTeam("kid", "BBBB2345", 16, NOW);
    // Still on team B, so still linked.
    expect(await leaveTeam("kid", a.id)).toBe(true);
    expect(await isClient("coach", "kid")).toBe(true);
    expect(await removeMember("coach", b.id, "kid")).toBe(true);
    expect(await isClient("coach", "kid")).toBe(false);
    await joinTeam("kid2", "AAAA2345", 14, NOW);
    expect(await deleteTeam("coach", a.id)).toBe(true);
    expect(await isClient("coach", "kid2")).toBe(false);
    expect(await schoolPro("kid2", NOW)).toBeNull();
  });

  it("only the coach sees the team's code", async () => {
    await verifiedCoach();
    await makeTeam("coach", "Swim", NOW, "SWAM2345");
    await joinTeam("kid", "SWAM2345", 16, NOW);
    expect((await teamsOverview("coach", NOW)).teams[0]!.code).toBe("SWAM2345");
    expect((await teamsOverview("kid", NOW)).joined[0]!.code).toBe("");
  });

  it("the board counts the last 7 days, members only, first names only", async () => {
    await verifiedCoach();
    const team = await makeTeam("coach", "Rugby", NOW, "RUGB2345");
    if ("error" in team) throw new Error();
    await joinTeam("kid", "RUGB2345", 16, NOW);
    await joinTeam("kid2", "RUGB2345", 17, NOW);
    await push(
      "kid",
      [
        { id: "s1", type: "set", at: NOW - DAY, sessionId: "w1", exerciseId: "squat", weight: 60, reps: 5, targetReps: 5 },
        { id: "s2", type: "set", at: NOW - DAY, sessionId: "w1", exerciseId: "squat", weight: 60, reps: 5, targetReps: 5 },
        { id: "e1", type: "sessionEnd", at: NOW - DAY, sessionId: "w1", seconds: 1800 },
        { id: "e0", type: "sessionEnd", at: NOW - 10 * DAY, sessionId: "w0", seconds: 1800 },
      ],
      { name: "Sam Lee" },
    );
    const b = await teamBoard("kid2", team.id, NOW);
    expect(b?.board[0]).toEqual({ id: "kid", name: "Sam", workouts: 1, sets: 2 });
    expect(b?.board).toHaveLength(2);
    expect(await teamBoard("stranger", team.id, NOW)).toBeNull();
    expect(firstName("  Ana María  ")).toBe("Ana");
  });

  it("deleting a coach's account deletes their teams", async () => {
    await verifiedCoach();
    await makeTeam("coach", "Swim", NOW, "SWAM2345");
    await joinTeam("kid", "SWAM2345", 16, NOW);
    await deleteAccount("coach", async () => null);
    expect(await query("SELECT * FROM teams")).toHaveLength(0);
    expect(await query("SELECT * FROM team_members")).toHaveLength(0);
    expect(await schoolPro("kid", NOW)).toBeNull();
  });
});

describe("teen-safe Friends", () => {
  it("someone under 18 can't go public and starts out of suggestions and out of training now", async () => {
    await push("teen", [], { birthYear: 2011, name: "Teen" });
    expect(await isMinor("teen")).toBe(true);
    await joinFriends("teen", { agree: true, handle: "teenlifter", name: "Teen" });
    await updateFriends("teen", { public: true });
    const r = await myFriends("teen");
    const p = (r.body as { profile: { public: boolean; suggest: boolean; live: boolean } }).profile;
    expect(p.public).toBe(false);
    expect(p.suggest).toBe(false);
    expect(p.live).toBe(false);
  });

  it("someone under 18 can turn training now on when joining", async () => {
    await push("teen2", [], { birthYear: 2011, name: "Teen" });
    await joinFriends("teen2", { agree: true, handle: "teenlifter2", name: "Teen", live: true });
    const p = ((await myFriends("teen2")).body as { profile: { suggest: boolean; live: boolean } }).profile;
    expect(p.live).toBe(true);
    expect(p.suggest).toBe(false);
  });

  it("adults are unchanged", async () => {
    await push("adult", [], { birthYear: 1990, name: "Adult" });
    expect(await isMinor("adult")).toBe(false);
    await joinFriends("adult", { agree: true, handle: "adultlifter", name: "Adult" });
    await updateFriends("adult", { public: true });
    const p = ((await myFriends("adult")).body as { profile: { public: boolean; suggest: boolean; live: boolean } }).profile;
    expect(p.public).toBe(true);
    expect(p.suggest).toBe(true);
    expect(p.live).toBe(true);
  });
});
