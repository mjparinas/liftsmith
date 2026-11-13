import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import {
  alertPain,
  alertQuiet,
  alertTrained,
  assignPlan,
  cleanCode,
  clientView,
  COACH_LIMITS,
  coachCleanup,
  forCoach,
  joinCoach,
  makeInvite,
  messages,
  newCode,
  overview,
  previewInvite,
  removePlan,
  saveSetup,
  sendMessage,
  setAlerts,
  setKind,
  setNote,
  setRole,
  setShare,
  setTargets,
  unlink,
  unreadFrom,
} from "./coach";
import { query, resetDb } from "./db";
import { saveToken, setPushSender, type PushMessage } from "./push";
import { sync } from "./sync";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
  setPushSender(null);
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

describe("chat between a coach and a client", () => {
  const sent: PushMessage[] = [];
  beforeEach(async () => {
    sent.length = 0;
    setPushSender(async (m) => {
      sent.push(m);
      return "ok";
    });
    await push("coach", [], { name: "Sam" });
    await push("client", [], { name: "Alex" });
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
  });

  it("only goes between a linked pair, either way, and empty text sends nothing", async () => {
    expect(await sendMessage("stranger", "client", "hi", NOW)).toEqual({ error: "notLinked" });
    expect(await sendMessage("coach", "client", "  \n ", NOW)).toEqual({ error: "empty" });
    expect(await sendMessage("coach", "client", "How did squats feel?", NOW, "m1")).toMatchObject({ id: "m1", from: "coach" });
    expect(await sendMessage("client", "coach", "Heavy but good", NOW + 1, "m2")).toMatchObject({ id: "m2", from: "client" });
    const r = await messages("client", "coach", undefined, NOW + 2);
    expect(r).toMatchObject({ name: "Sam", more: false });
    expect("messages" in r && r.messages.map((m) => m.text)).toEqual(["How did squats feel?", "Heavy but good"]);
    expect(await messages("stranger", "coach", undefined, NOW)).toEqual({ error: "notLinked" });
  });

  it("counts unread messages until the thread is opened", async () => {
    await sendMessage("coach", "client", "One", NOW, "m1");
    await sendMessage("coach", "client", "Two", NOW + 1, "m2");
    expect(await unreadFrom("client")).toEqual({ coach: 2 });
    expect(await unreadFrom("coach")).toEqual({});
    await messages("client", "coach", undefined, NOW + 2);
    expect(await unreadFrom("client")).toEqual({});
  });

  it("pages older messages", async () => {
    for (let i = 0; i < COACH_LIMITS.page + 3; i++) await sendMessage("coach", "client", `m${i}`, NOW + i, `id${i}`);
    const first = await messages("client", "coach", undefined, NOW + 1000);
    if (!("messages" in first)) throw new Error("not linked");
    expect(first.more).toBe(true);
    expect(first.messages).toHaveLength(COACH_LIMITS.page);
    const older = await messages("client", "coach", first.messages[0]!.at, NOW + 1000);
    expect("messages" in older && older.messages.map((m) => m.text)).toEqual(["m0", "m1", "m2"]);
  });

  it("pushes the message to the other side's phones, with the sender's name and a link to the thread", async () => {
    await saveToken("client", "tok-client-0123456789abcdef", "android", "en", NOW);
    await sendMessage("coach", "client", "See you Monday", NOW, "m1");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ token: "tok-client-0123456789abcdef", kind: "coachMsg", route: "#/trainer/m.coach" });
    expect(sent[0]!.body).toContain("Sam");
  });

  it("goes when the pair unlinks or an account is deleted", async () => {
    await sendMessage("coach", "client", "Hi", NOW, "m1");
    await unlink("client", "coach");
    expect(await query("SELECT * FROM coach_messages")).toEqual([]);
    expect(await query("SELECT * FROM coach_reads")).toEqual([]);
    expect(
      coachCleanup("x")
        .map((q) => q.sql)
        .join(" "),
    ).toMatch(/coach_messages.*coach_reads.*coach_shares.*coach_alerts.*coach_prefs/);
  });
});

describe("body data a client shares", () => {
  beforeEach(async () => {
    await push(
      "client",
      [
        { id: "w1", at: NOW - 40 * DAY, type: "bodyweight", kg: 82 },
        { id: "w2", at: NOW - DAY, type: "bodyweight", kg: 80, bodyFat: 18.5 },
        { id: "m1", at: NOW - DAY, type: "measure", site: "waist", cm: 84 },
        { id: "p1", at: NOW - DAY, type: "photo", note: "private" },
      ],
      { name: "Alex", sex: "female", heightCm: 168 },
    );
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
  });

  it("is off until the client turns it on, and only for their own coach", async () => {
    expect((await clientView("coach", "client", NOW))?.body).toBeNull();
    expect(await setShare("client", "stranger", true, NOW)).toEqual({ error: "notClient" });
    expect(await setShare("client", "coach", true, NOW)).toBe(true);
    const body = (await clientView("coach", "client", NOW))?.body;
    expect(body).toEqual({
      sex: "female",
      heightCm: 168,
      weights: [
        { at: NOW - 40 * DAY, kg: 82 },
        { at: NOW - DAY, kg: 80, bodyFat: 18.5 },
      ],
      measures: [{ at: NOW - DAY, site: "waist", cm: 84 }],
      food: [],
    });
    expect(JSON.stringify(body)).not.toContain("private");
    expect((await overview("client", NOW)).bodyShared).toEqual(["coach"]);
    expect((await overview("coach", NOW)).sharesBody).toEqual(["client"]);
    expect(await setShare("client", "coach", false, NOW)).toBe(false);
    expect((await clientView("coach", "client", NOW))?.body).toBeNull();
  });

  it("stops when the pair unlinks", async () => {
    await setShare("client", "coach", true, NOW);
    await unlink("coach", "client");
    expect(await query("SELECT * FROM coach_shares")).toEqual([]);
  });
});

describe("alerts to a coach", () => {
  const sent: PushMessage[] = [];
  beforeEach(async () => {
    sent.length = 0;
    setPushSender(async (m) => {
      sent.push(m);
      return "ok";
    });
    await push("client", [], { name: "Alex" });
    await makeInvite("coach", NOW - 10 * DAY, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW - 10 * DAY);
    await saveToken("coach", "tok-coach-0123456789abcdef", "ios", "en", NOW);
  });

  it("tell the coach once per finished workout, and never about old ones", async () => {
    await alertTrained("client", [{ type: "sessionEnd", at: NOW - 60_000 }], NOW);
    await alertTrained("client", [{ type: "sessionEnd", at: NOW - 60_000 }], NOW + 1000);
    await alertTrained("client", [{ type: "sessionEnd", at: NOW - 3 * DAY }], NOW);
    expect(sent.map((m) => [m.kind, m.route])).toEqual([["coachTrained", "#/trainer/c.client"]]);
  });

  it("tell the coach once when a client goes a week without training, and again after they train", async () => {
    expect(await alertQuiet(NOW)).toBe(1);
    expect(await alertQuiet(NOW + DAY)).toBe(0);
    expect(sent.map((m) => m.kind)).toEqual(["coachQuiet"]);
    await alertTrained("client", [{ type: "sessionEnd", at: NOW + DAY }], NOW + DAY);
    expect(await alertQuiet(NOW + DAY + 2 * 7 * DAY)).toBe(1);
  });

  it("stay quiet when the coach turns them off", async () => {
    await setAlerts("coach", false, NOW);
    await alertTrained("client", [{ type: "sessionEnd", at: NOW - 60_000 }], NOW);
    expect(await alertQuiet(NOW)).toBe(0);
    expect(sent).toEqual([]);
    expect((await overview("coach", NOW)).alerts).toBe(false);
  });
});

describe("physio support", () => {
  beforeEach(async () => {
    await push(
      "client",
      [
        { id: "i1", at: NOW - 5 * DAY, type: "injury", injuryId: "knee1", part: "knee" },
        { id: "r1", at: NOW - 5 * DAY, type: "injuryRule", injuryId: "knee1", action: "light", pct: 70, ack: true },
        { id: "p1", at: NOW - DAY, type: "pain", injuryId: "knee1", score: 4, sessionId: "s1", exerciseId: "wall-sit" },
        { id: "c1", at: NOW - DAY, type: "cycle", flow: "light" },
      ],
      { name: "Alex" },
    );
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
  });

  it("sends pain and injuries only when the client shares them, and never the rest of the health side", async () => {
    const types = async () => (await clientView("coach", "client", NOW))!.events.map((e) => e.type);
    expect(await types()).toEqual([]);
    expect((await clientView("coach", "client", NOW))!.pain).toBe(false);
    expect(await setShare("client", "coach", true, NOW, "pain")).toBe(true);
    const view = (await clientView("coach", "client", NOW))!;
    expect(view.pain).toBe(true);
    expect(view.body).toBeNull();
    expect(view.events).toEqual([
      { id: "i1", at: NOW - 5 * DAY, type: "injury", injuryId: "knee1", part: "knee" },
      { id: "p1", at: NOW - DAY, type: "pain", injuryId: "knee1", score: 4, sessionId: "s1", exerciseId: "wall-sit" },
    ]);
    expect((await overview("client", NOW)).painShared).toEqual(["coach"]);
    expect((await overview("coach", NOW)).sharesPain).toEqual(["client"]);
    // Body data is its own switch.
    await setShare("client", "coach", true, NOW, "body");
    expect((await clientView("coach", "client", NOW))!.pain).toBe(true);
    await setShare("client", "coach", false, NOW, "pain");
    expect(await types()).toEqual([]);
    expect((await clientView("coach", "client", NOW))!.body).not.toBeNull();
  });

  it("a coach can work as a physio, which their clients see", async () => {
    expect((await overview("coach", NOW)).kind).toBe("trainer");
    expect(await setKind("coach", "physio", NOW)).toBe("physio");
    expect(await setKind("coach", "surgeon", NOW)).toBe("trainer");
    await setKind("coach", "physio", NOW);
    await setAlerts("coach", false, NOW);
    expect((await overview("coach", NOW)).kind).toBe("physio");
    expect((await overview("coach", NOW)).alerts).toBe(false);
    expect((await overview("client", NOW)).kinds).toEqual({ coach: "physio" });
    expect((await clientView("coach", "client", NOW))!.kind).toBe("physio");
  });

  it("a routine can say how many times a week, and only 1 to 7", async () => {
    const a = await assignPlan("coach", "client", "Knee", "r1~S25lZQ~wall-sit.3~rehab", NOW, "p1", 3);
    expect(a).toMatchObject({ perWeek: 3, code: "r1~S25lZQ~wall-sit.3~rehab" });
    const b = await assignPlan("coach", "client", "Other", "r1~S25lZQ~wall-sit.3", NOW, "p2", 9);
    expect(b).not.toHaveProperty("perWeek");
    const plans = (await clientView("coach", "client", NOW))!.plans;
    expect(plans.find((p) => p.id === "p1")?.perWeek).toBe(3);
    expect(plans.find((p) => p.id === "p2")).not.toHaveProperty("perWeek");
  });

  it("high pain pushes the coach once in a day, only when shared and with alerts on", async () => {
    const sent: PushMessage[] = [];
    setPushSender(async (m) => {
      sent.push(m);
      return "ok";
    });
    await saveToken("coach", "tok-coach-0123456789abcdef", "android", "en", NOW);
    const high = [{ type: "pain", at: NOW - 60_000, score: 7 }];
    await alertPain("client", high, NOW);
    expect(sent).toEqual([]);
    await setShare("client", "coach", true, NOW, "pain");
    await alertPain("client", [{ type: "pain", at: NOW - 60_000, score: 3 }], NOW);
    await alertPain("client", [{ type: "pain", at: NOW - DAY, score: 9 }], NOW);
    expect(sent).toEqual([]);
    await alertPain("client", high, NOW);
    await alertPain("client", high, NOW + 3_600_000);
    expect(sent.map((m) => [m.kind, m.body, m.route])).toEqual([
      ["coachPain", "Alex rated their pain 7/10. Worth checking in.", "#/trainer/c.client"],
    ]);
    await setAlerts("coach", false, NOW);
    await alertPain("client", high, NOW + DAY);
    expect(sent).toHaveLength(1);
  });
});

describe("nutrition targets from the coach", () => {
  beforeEach(async () => {
    await push(
      "client",
      [
        { id: "k1", at: NOW - 2 * DAY, type: "health", metric: "kcalIn", day: "2027-01-13", value: 2100 },
        { id: "k2", at: NOW - DAY, type: "health", metric: "kcalIn", day: "2027-01-13", value: 2300 },
        { id: "p1", at: NOW - DAY, type: "health", metric: "protein", day: "2027-01-13", value: 120 },
        { id: "s1", at: NOW - DAY, type: "health", metric: "sleep", day: "2027-01-13", value: 400 },
        { id: "old", at: NOW - 60 * DAY, type: "health", metric: "kcalIn", day: "2026-11-15", value: 2000 },
      ],
      { name: "Alex" },
    );
    await makeInvite("coach", NOW, "CCCCDDDD");
    await joinCoach("client", "CCCCDDDD", NOW);
  });

  it("only go to the coach's own clients, keep numbers in range, and both empty clears them", async () => {
    expect(await setTargets("stranger", "client", 2400, 160, NOW)).toEqual({ error: "notClient" });
    expect(await setTargets("coach", "client", 2400.4, 9999, NOW)).toEqual({
      coachId: "coach",
      clientId: "client",
      kcal: 2400,
      protein: null,
      at: NOW,
    });
    expect(await setTargets("coach", "client", 2500, 150, NOW + 1)).toMatchObject({ kcal: 2500, protein: 150 });
    expect((await overview("client", NOW)).targets).toEqual([
      { coachId: "coach", clientId: "client", kcal: 2500, protein: 150, at: NOW + 1 },
    ]);
    expect((await clientView("coach", "client", NOW))?.targets).toMatchObject({ kcal: 2500, protein: 150 });
    expect(await setTargets("coach", "client", null, "x", NOW)).toBeNull();
    expect((await overview("client", NOW)).targets).toEqual([]);
  });

  it("the client's food days reach the coach only with body sharing on, newest number per day, last 30 days", async () => {
    expect((await clientView("coach", "client", NOW))?.body).toBeNull();
    await setShare("client", "coach", true, NOW);
    expect((await clientView("coach", "client", NOW))?.body?.food).toEqual([{ day: "2027-01-13", kcal: 2300, protein: 120 }]);
  });

  it("go when the pair unlinks or an account is deleted", async () => {
    await setTargets("coach", "client", 2400, 160, NOW);
    await unlink("client", "coach");
    expect(await query("SELECT * FROM coach_targets")).toEqual([]);
    expect(coachCleanup("x").some((q) => q.sql.includes("coach_targets"))).toBe(true);
  });
});

describe("personal trainer or coach", () => {
  it("a coach picks a role, their clients see it, and alerts stay as they were", async () => {
    await makeInvite("coach", NOW, "EEEEFFFF");
    expect(((await previewInvite("client", "EEEEFFFF", NOW)) as { coach: { role?: string } }).coach.role).toBeUndefined();
    await setAlerts("coach", false, NOW);
    expect(await setRole("coach", "trainer", NOW)).toBe("trainer");
    expect(await setRole("coach", "wizard", NOW)).toBeNull();
    await setRole("coach", "coach", NOW);
    expect(((await previewInvite("client", "EEEEFFFF", NOW)) as { coach: { role?: string } }).coach.role).toBe("coach");
    await joinCoach("client", "EEEEFFFF", NOW);
    expect((await overview("client", NOW)).coaches[0]).toMatchObject({ id: "coach", role: "coach" });
    expect((await overview("coach", NOW)).role).toBe("coach");
    expect((await overview("coach", NOW)).alerts).toBe(false);
  });
});
