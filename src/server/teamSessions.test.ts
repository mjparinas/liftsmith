import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import { sync } from "./sync";
import { confirmSchool, deleteTeam, joinTeam, makeTeam, startSchool, teamBoard, type Team } from "./teams";
import { athleteEvents, checkPush, lastWeights, liveBoard, liveSessions, progressIn, pushSession, SESSION_LIMITS } from "./teamSessions";

const NOW = Date.UTC(2026, 10, 19, 15);
const MIN = 60_000;

beforeEach(async () => {
  await resetDb();
});

async function coachWithTeam(coach = "coach"): Promise<Team> {
  const s = await startSchool(coach, `${coach}@lincoln.k12.ca.us`, "Lincoln High", null, NOW);
  if (!s.ok || !s.devCode) throw new Error("no code");
  await confirmSchool(coach, s.devCode, NOW);
  const team = await makeTeam(coach, "Senior girls", NOW, coach === "coach" ? "VBAL2345" : "WXYZ2345");
  if ("error" in team) throw new Error(team.error);
  return team;
}

async function athlete(id: string, name: string, code = "VBAL2345") {
  await sync(id, `s-${id}`, {
    cursor: 0,
    events: [],
    deleted: [],
    records: [{ key: "profile", value: { onboarded: true, name, activeGymId: `gym-${id}` }, updatedAt: NOW }],
    first: false,
  });
  const r = await joinTeam(id, code, 16, NOW);
  if ("error" in r) throw new Error(r.error);
}

const SID = "11111111-2222-3333-4444-555555555555";
const plan = [
  { exerciseId: "back-squat", sets: 3, reps: 5 },
  { exerciseId: "push-up", sets: 2, reps: 12 },
];
const set = (id: string, athleteId: string, exercise: string, weight: number, reps: number, at: number) => ({
  id: `set-${id}-0000`,
  athlete: athleteId,
  exercise,
  weight,
  reps,
  target: exercise === "back-squat" ? 5 : 12,
  at,
});
const push = (team: string, sets: ReturnType<typeof set>[], extra: { endedAt?: number; removed?: string[] } = {}, coach = "coach") =>
  pushSession(
    coach,
    {
      session: { id: SID, team, name: "Leg day", plan, startedAt: NOW, ...(extra.endedAt ? { endedAt: extra.endedAt } : {}) },
      sets,
      removed: extra.removed ?? [],
    },
    NOW + 60 * MIN,
  );

describe("checking a push", () => {
  it("refuses a bad plan, a set from the future and junk", () => {
    const ok = { session: { id: SID, team: "T", name: "x", plan, startedAt: NOW }, sets: [], removed: [] };
    expect(checkPush(ok, NOW)).not.toBeNull();
    expect(checkPush({ ...ok, session: { ...ok.session, plan: [] } }, NOW)).toBeNull();
    expect(checkPush({ ...ok, session: { ...ok.session, plan: [{ exerciseId: "x", sets: 11, reps: 5 }] } }, NOW)).toBeNull();
    expect(checkPush({ ...ok, session: { ...ok.session, id: "short" } }, NOW)).toBeNull();
    expect(checkPush({ ...ok, sets: [set("a", "a", "back-squat", 40, 5, NOW + 60 * MIN)] }, NOW)).toBeNull();
    expect(checkPush({ ...ok, sets: [set("a", "a", "back-squat", -1, 5, NOW)] }, NOW)).toBeNull();
    expect(checkPush({ ...ok, session: { ...ok.session, endedAt: NOW - MIN } }, NOW)).toBeNull();
    expect(checkPush(null, NOW)).toBeNull();
    expect(checkPush("nope", NOW)).toBeNull();
  });

  it("counts progress per exercise, capped at the plan, and names the next exercise", () => {
    expect(progressIn(plan, new Map([["back-squat", 5]]))).toEqual({ done: 3, total: 5, on: "push-up" });
    expect(progressIn(plan, new Map())).toEqual({ done: 0, total: 5, on: "back-squat" });
    expect(
      progressIn(
        plan,
        new Map([
          ["back-squat", 3],
          ["push-up", 2],
        ]),
      ),
    ).toEqual({ done: 5, total: 5, on: "" });
  });
});

describe("team sessions", () => {
  it("only the team's own verified coach runs one, and only for athletes on the team", async () => {
    const team = await coachWithTeam();
    await athlete("ana", "Ana Lopez");
    expect(await push(team.id, [set("a", "ana", "back-squat", 40, 5, NOW + MIN)], {}, "stranger")).toEqual({
      ok: false,
      error: "notCoach",
    });
    expect(await push(team.id, [set("a", "nobody", "back-squat", 40, 5, NOW + MIN)])).toEqual({ ok: false, error: "unknown" });
    expect(await push("NOTATEAM", [])).toEqual({ ok: false, error: "unknown" });
    expect(await push(team.id, [set("a", "ana", "back-squat", 40, 5, NOW + MIN)])).toEqual({ ok: true, written: false });
  });

  it("keeps sets by their id, so a repeated push adds nothing, and a set can be taken back", async () => {
    const team = await coachWithTeam();
    await athlete("ana", "Ana Lopez");
    const one = set("a", "ana", "back-squat", 40, 5, NOW + MIN);
    await push(team.id, [one]);
    await push(team.id, [one, set("b", "ana", "back-squat", 40, 5, NOW + 3 * MIN)]);
    const [c] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM team_session_sets");
    expect(Number(c?.n)).toBe(2);
    await push(team.id, [], { removed: ["set-b-0000"] });
    const [d] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM team_session_sets");
    expect(Number(d?.n)).toBe(1);
  });

  it("shows the coach a live board: first names, sets done and the next exercise, never weights", async () => {
    const team = await coachWithTeam();
    await athlete("ana", "Ana Lopez");
    await athlete("bo", "Bo Chen");
    await push(
      team.id,
      [1, 2, 3].map((i) => set(`a${i}`, "ana", "back-squat", 37.25, 5, NOW + i * MIN)),
    );
    expect(await liveSessions("coach", NOW + 60 * MIN)).toEqual({ [team.id]: SID });
    const b = await liveBoard("coach", SID, NOW + 60 * MIN);
    expect(b?.rows).toEqual([
      { id: "ana", name: "Ana", done: 3, total: 5, on: "push-up" },
      { id: "bo", name: "Bo", done: 0, total: 5, on: "back-squat" },
    ]);
    expect(JSON.stringify(b)).not.toContain("37.25");
    expect(await liveBoard("ana", SID, NOW)).toBeNull();
  });

  it("writes each athlete's sets into their own account once it ends, once", async () => {
    const team = await coachWithTeam();
    await athlete("ana", "Ana Lopez");
    await athlete("bo", "Bo Chen");
    await push(team.id, [set("a1", "ana", "back-squat", 40, 5, NOW + 5 * MIN), set("a2", "ana", "push-up", 0, 12, NOW + 9 * MIN)]);
    expect(await push(team.id, [], { endedAt: NOW + 50 * MIN })).toEqual({ ok: true, written: true });
    // Ana pulls it on her phone like any other change; Bo logged nothing, so nothing was written for him.
    const pulled = await sync("ana", "phone", { cursor: 0, events: [], deleted: [], records: [], first: false });
    expect(pulled.events.map((e) => (e as { id: string }).id)).toEqual([
      `team-${SID}-start`,
      `team-${SID}-set-a1-0000`,
      `team-${SID}-set-a2-0000`,
      `team-${SID}-end`,
    ]);
    expect(pulled.events[0]).toMatchObject({ type: "sessionStart", source: "manual", team: "Senior girls", gymId: "gym-ana" });
    expect(pulled.events[1]).toMatchObject({ type: "set", exerciseId: "back-squat", weight: 40, reps: 5, targetReps: 5 });
    const [bo] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM sync_events WHERE account_id = 'bo'");
    expect(Number(bo?.n)).toBe(0);
    // A late retry after the end changes nothing.
    expect(await push(team.id, [set("a3", "ana", "back-squat", 45, 5, NOW + 20 * MIN)])).toEqual({ ok: true, written: true });
    const [ana] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM sync_events WHERE account_id = 'ana'");
    expect(Number(ana?.n)).toBe(4);
    // The team's weekly board counts it.
    expect((await teamBoard("coach", team.id, NOW + 60 * MIN))?.board[0]).toMatchObject({ name: "Ana", workouts: 1, sets: 2 });
    expect(await liveSessions("coach", NOW + 60 * MIN)).toEqual({});
  });

  it("starts each athlete from their last weights in the team's last sessions", async () => {
    const team = await coachWithTeam();
    await athlete("ana", "Ana Lopez");
    await push(team.id, [set("a1", "ana", "back-squat", 40, 5, NOW + MIN), set("a2", "ana", "back-squat", 42.5, 4, NOW + 4 * MIN)]);
    expect(await lastWeights("coach", team.id)).toEqual({ ana: { "back-squat": { weight: 42.5, reps: 4 } } });
    expect(await lastWeights("someone", team.id)).toBeNull();
  });

  it("deleting the team or the coach's account takes its sessions", async () => {
    const team = await coachWithTeam();
    await athlete("ana", "Ana Lopez");
    await push(team.id, [set("a1", "ana", "back-squat", 40, 5, NOW + MIN)]);
    await deleteTeam("coach", team.id);
    expect((await query("SELECT * FROM team_sessions")).length).toBe(0);
    expect((await query("SELECT * FROM team_session_sets")).length).toBe(0);
    const again = await makeTeam("coach", "Again", NOW, "WXYZ2345");
    if ("error" in again) throw new Error();
    await athlete("bo", "Bo", "WXYZ2345");
    await push(again.id, [set("b1", "bo", "back-squat", 40, 5, NOW + MIN)]);
    await deleteAccount("coach");
    expect((await query("SELECT * FROM team_sessions")).length).toBe(0);
  });
});

describe("an athlete's workout", () => {
  it("runs from a minute before the first set to the last, inside the session", () => {
    const rows = [
      { id: "b", athlete_id: "a", exercise_id: "x", weight: 10, reps: 5, target: 5, at: NOW + 10 * MIN },
      { id: "a", athlete_id: "a", exercise_id: "x", weight: 10, reps: 5, target: 5, at: NOW + 2 * MIN },
      { id: "c", athlete_id: "a", exercise_id: "x", weight: 10, reps: 0, target: 5, at: NOW + 20 * MIN },
    ];
    const ev = athleteEvents({ id: "S", name: "T", startedAt: NOW, endedAt: NOW + 30 * MIN }, rows, "g");
    expect(ev[0]).toMatchObject({ at: NOW + MIN, minutes: 9 });
    expect(ev.filter((e) => e.type === "set").map((e) => e.id)).toEqual(["team-S-a", "team-S-b"]);
    expect(ev[ev.length - 1]).toMatchObject({ type: "sessionEnd", at: NOW + 10 * MIN, seconds: 540 });
    expect(athleteEvents({ id: "S", name: "T", startedAt: NOW, endedAt: NOW }, [], "g")).toEqual([]);
    expect(SESSION_LIMITS.items).toBe(20);
  });
});
