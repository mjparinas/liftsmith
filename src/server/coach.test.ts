import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import {
  assignPlan,
  cleanCode,
  clientView,
  COACH_LIMITS,
  forCoach,
  joinCoach,
  makeInvite,
  newCode,
  overview,
  previewInvite,
  removePlan,
  saveSetup,
  setNote,
  unlink,
} from "./coach";
import { query, resetDb } from "./db";
import { sync } from "./sync";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
});

const push = (account: string, events: Record<string, unknown>[], profile?: Record<string, unknown>) =>
  sync(account, `s-${account}`, {
    cursor: 0,
    events: events as { id: string; at: number }[],
    deleted: [],
    records: profile ? [{ key: "profile", value: { onboarded: true, ...profile }, updatedAt: NOW }] : [],
    first: false,
  });

describe("invite codes", () => {
  it("are 8 easy-to-read characters", () => {
    const c = newCode();
    expect(c).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect(cleanCode(` ${c.slice(0, 4).toLowerCase()}-${c.slice(4)} `)).toBe(c);
    expect(cleanCode("ABCD-EFG0")).toBe("");
    expect(cleanCode(42)).toBe("");
  });

  it("a new code replaces the old one, and codes expire after a week", async () => {
    const a = await makeInvite("coach", NOW, "AAAABBBB");
    expect(a.expiresAt).toBe(NOW + COACH_LIMITS.inviteMs);
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await previewInvite("client", "AAAABBBB", NOW)).toEqual({ error: "unknown" });
    expect(await previewInvite("client", "CCCCDDDD", NOW)).toMatchObject({ coach: { id: "coach" } });
    expect(await previewInvite("client", "CCCCDDDD", NOW + COACH_LIMITS.inviteMs + 1)).toEqual({ error: "unknown" });
  });

  it("shows the coach's name before the client agrees, and nothing is linked by looking", async () => {
    await push("coach", [], { name: "Sam" });
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await previewInvite("client", "cccc-dddd", NOW)).toMatchObject({ coach: { id: "coach", name: "Sam" } });
    expect((await overview("coach", NOW)).clients).toEqual([]);
  });

  it("can't be used by the coach on themselves", async () => {
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await joinCoach("coach", "CCCCDDDD", NOW)).toEqual({ error: "self" });
  });

  it("can't be guessed: tries are limited per hour", async () => {
    for (let i = 0; i < COACH_LIMITS.triesPerHour; i++) await previewInvite("client", "ZZZZZZZZ", NOW);
    expect(await previewInvite("client", "ZZZZZZZZ", NOW)).toEqual({ error: "slow" });
  });
});

describe("linking", () => {
  it("joins a client to the coach, both see each other, and joining twice adds nothing", async () => {
    await push("client", [], { name: "Alex" });
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await joinCoach("client", "CCCCDDDD", NOW)).toMatchObject({ coach: { id: "coach" } });
    await joinCoach("client", "CCCCDDDD", NOW + 1);
    const coach = await overview("coach", NOW);
    expect(coach.clients).toEqual([{ id: "client", name: "Alex", since: NOW }]);
    expect((await overview("client", NOW)).coaches.map((c) => c.id)).toEqual(["coach"]);
  });

  it("caps coaches per client", async () => {
    for (let i = 0; i < COACH_LIMITS.coaches; i++) {
      await makeInvite(`coach${i}`, NOW, `AAAAAAA${"ABC"[i]}`);
      await joinCoach("client", `AAAAAAA${"ABC"[i]}`, NOW);
    }
    await makeInvite("another", NOW, "DDDDDDDD");
    expect(await joinCoach("client", "DDDDDDDD", NOW)).toEqual({ error: "full" });
  });

  it("either side can unlink, and the coach loses access at once", async () => {
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
    expect(await clientView("coach", "client", NOW)).not.toBeNull();
    await unlink("client", "coach");
    expect(await clientView("coach", "client", NOW)).toBeNull();
    await joinCoach("client", "CCCCDDDD", NOW);
    await unlink("coach", "client");
    expect(await clientView("coach", "client", NOW)).toBeNull();
  });

  it("a deleted account leaves no invites or links behind", async () => {
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
    await deleteAccount("coach");
    expect(await query("SELECT * FROM coach_links")).toEqual([]);
    expect(await query("SELECT * FROM coach_invites")).toEqual([]);
  });
});

describe("what a coach sees", () => {
  const set = {
    id: "set1",
    at: NOW - DAY,
    type: "set",
    sessionId: "w1",
    exerciseId: "bench",
    weight: 100,
    reps: 5,
    targetReps: 5,
    rir: 2,
    hrAvg: 140,
    hrMax: 160,
    hrEnd: 155,
    injuryPct: 0.8,
  };

  it("keeps only training fields", () => {
    expect(forCoach(set)).toEqual({
      id: "set1",
      at: NOW - DAY,
      type: "set",
      sessionId: "w1",
      exerciseId: "bench",
      weight: 100,
      reps: 5,
      targetReps: 5,
      rir: 2,
    });
    expect(forCoach({ id: "e", at: 1, type: "sessionEnd", sessionId: "w1", seconds: 3000, avgHr: 120, kcal: 300 })).toEqual({
      id: "e",
      at: 1,
      type: "sessionEnd",
      sessionId: "w1",
      seconds: 3000,
    });
    expect(forCoach({ id: "s", at: 1, type: "sessionStart", sessionId: "w1", gymId: "home", readiness: 40, minutes: 45 })).toEqual({
      id: "s",
      at: 1,
      type: "sessionStart",
      sessionId: "w1",
      minutes: 45,
    });
  });

  it("never sends health, body, cycle, injury, pain, notes or photos", () => {
    for (const type of [
      "bodyweight",
      "measure",
      "health",
      "cycle",
      "injury",
      "injuryRule",
      "pain",
      "note",
      "hrSeries",
      "checkin",
      "feel",
      "tdee",
    ])
      expect(forCoach({ id: "x", at: 1, type })).toBeNull();
    expect(forCoach(null)).toBeNull();
    expect(forCoach({ id: 1, at: 1, type: "set" })).toBeNull();
  });

  it("sends the client's recent training, oldest first, with their name and weekly goal", async () => {
    await push(
      "client",
      [
        {
          id: "old",
          at: NOW - COACH_LIMITS.historyMs - DAY,
          type: "set",
          sessionId: "w0",
          exerciseId: "bench",
          weight: 90,
          reps: 5,
          targetReps: 5,
          rir: 2,
        },
        { id: "cx", at: NOW - COACH_LIMITS.historyMs - DAY, type: "customExercise", exercise: { id: "custom-1", name: "Sled" } },
        { id: "bw", at: NOW - DAY, type: "bodyweight", kg: 80 },
        set,
        {
          id: "set2",
          at: NOW - DAY + 1000,
          type: "set",
          sessionId: "w1",
          exerciseId: "bench",
          weight: 100,
          reps: 5,
          targetReps: 5,
          rir: 2,
        },
      ],
      { name: "Alex", daysPerWeek: 4, bodyweight: 80 },
    );
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await clientView("coach", "client", NOW)).toBeNull();
    await joinCoach("client", "CCCCDDDD", NOW);
    const v = await clientView("coach", "client", NOW);
    expect(v?.name).toBe("Alex");
    expect(v?.daysPerWeek).toBe(4);
    expect(v?.events.map((e) => e.id)).toEqual(["cx", "set1", "set2"]);
    expect(JSON.stringify(v)).not.toMatch(/hrAvg|bodyweight|injuryPct|"kg"/);
  });
});

describe("routines a coach assigns", () => {
  const CODE = "r1~UHVzaA~bench-press.4~lateral-raise.3.s~cable-pushdown.3";
  const linked = async () => {
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
  };

  it("only go to the coach's own clients, and only as a routine code", async () => {
    expect(await assignPlan("coach", "client", "Push", CODE, NOW, "p1")).toEqual({ error: "notClient" });
    await linked();
    expect(await assignPlan("coach", "client", "Push", "<script>", NOW, "p1")).toEqual({ error: "bad" });
    expect(await assignPlan("coach", "client", "  ", CODE, NOW, "p1")).toEqual({ error: "bad" });
    expect(await assignPlan("coach", "client", "Push\nday", CODE, NOW, "p1")).toMatchObject({ id: "p1", name: "Push day" });
  });

  it("show on the client's side and in the coach's view, and the coach can take one back", async () => {
    await linked();
    await assignPlan("coach", "client", "Push", CODE, NOW, "p1");
    await assignPlan("coach", "client", "Pull", CODE, NOW + 1, "p2");
    expect((await overview("client", NOW)).plans.map((p) => p.name)).toEqual(["Pull", "Push"]);
    expect((await clientView("coach", "client", NOW))?.plans).toHaveLength(2);
    await removePlan("someone-else", "p1");
    await removePlan("coach", "p1");
    expect((await overview("client", NOW)).plans.map((p) => p.id)).toEqual(["p2"]);
  });

  it("are capped per client", async () => {
    await linked();
    for (let i = 0; i < COACH_LIMITS.plans; i++) await assignPlan("coach", "client", `R${i}`, CODE, NOW, `p${i}`);
    expect(await assignPlan("coach", "client", "One more", CODE, NOW, "px")).toEqual({ error: "full" });
  });

  it("go when the pair unlinks", async () => {
    await linked();
    await assignPlan("coach", "client", "Push", CODE, NOW, "p1");
    await unlink("client", "coach");
    expect((await overview("client", NOW)).plans).toEqual([]);
  });
});

describe("what a coach's new clients start with", () => {
  it("comes with the code, keeps only known answers, and survives a new code", async () => {
    expect(await saveSetup("coach", { goal: "strength", experience: "expert", days: 9 }, NOW)).toEqual({ goal: "strength" });
    await saveSetup("coach", { goal: "muscle", experience: "new", days: 3 }, NOW);
    await makeInvite("coach", NOW, "AAAABBBB");
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await previewInvite("client", "CCCCDDDD", NOW)).toMatchObject({ setup: { goal: "muscle", experience: "new", days: 3 } });
    expect(await joinCoach("client", "CCCCDDDD", NOW)).toMatchObject({ setup: { days: 3 } });
    expect((await overview("coach", NOW)).setup).toEqual({ goal: "muscle", experience: "new", days: 3 });
  });

  it("is empty until the coach picks something", async () => {
    await makeInvite("coach", NOW, "CCCCDDDD");
    expect(await previewInvite("client", "CCCCDDDD", NOW)).toMatchObject({ setup: {} });
  });
});

describe("a coach's note to a client", () => {
  const linked = async () => {
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
  };

  it("only goes to the coach's own clients", async () => {
    expect(await setNote("coach", "client", "Hi", NOW)).toEqual({ error: "notClient" });
    expect(await query("SELECT * FROM coach_notes")).toEqual([]);
  });

  it("shows on the client's side and in the coach's view, tidied and capped, and empty text clears it", async () => {
    await linked();
    await setNote("coach", "client", "  Squat day:\r\n\n\n\nkeep\u0007 it easy  ", NOW);
    const [n] = (await overview("client", NOW)).notes;
    expect(n).toEqual({ coachId: "coach", clientId: "client", text: "Squat day:\n\nkeep  it easy", at: NOW });
    expect((await clientView("coach", "client", NOW))?.note?.text).toBe("Squat day:\n\nkeep  it easy");
    await setNote("coach", "client", "x".repeat(900), NOW + 1);
    expect((await overview("client", NOW)).notes[0]?.text).toHaveLength(COACH_LIMITS.note);
    expect((await overview("client", NOW)).notes[0]?.at).toBe(NOW + 1);
    expect(await setNote("coach", "client", "   ", NOW + 2)).toBeNull();
    expect((await overview("client", NOW)).notes).toEqual([]);
  });

  it("goes when the pair unlinks or an account is deleted", async () => {
    await linked();
    await setNote("coach", "client", "Hi", NOW);
    await unlink("client", "coach");
    expect(await query("SELECT * FROM coach_notes")).toEqual([]);
    await joinCoach("client", "CCCCDDDD", NOW);
    await setNote("coach", "client", "Hi again", NOW);
    await saveSetup("coach", { days: 4 }, NOW);
    await deleteAccount("client");
    expect(await query("SELECT * FROM coach_notes")).toEqual([]);
    await deleteAccount("coach");
    expect(await query("SELECT * FROM coach_defaults")).toEqual([]);
  });
});
