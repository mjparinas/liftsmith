import { beforeEach, expect, it } from "vitest";

import { pickCell, routineFromSchedule } from "@/lib/scheduleDays";

import { unlink } from "./coach";
import {
  acceptCalendarInvite,
  calendarAccess,
  calendarOwner,
  clearScheduleDay,
  inviteCalendarAssistant,
  revokeCalendarAccess,
  scheduleMonth,
  setScheduleDay,
  trainingActivity,
  upcomingSchedule,
} from "./coachSchedule";
import { resetDb, run } from "./db";

const now = Date.UTC(2026, 10, 25, 12);
const day = "2026-12-03";
const code = "r1~Push~bench-press.4";
const team = "ABCDEFGH";

beforeEach(async () => {
  await resetDb();
  await run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES ('coach', 'athlete', ?)", [now]);
  await run("INSERT INTO teams (id, coach_id, name, code, created_at) VALUES (?, 'coach', 'Team', 'JOINTEAM', ?)", [team, now]);
  await run("INSERT INTO team_members (team_id, account_id, birth_year, joined_at) VALUES (?, 'athlete', 2000, ?)", [team, now]);
});

it("delivers the most specific assignment and falls back as assignments are cleared", async () => {
  await setScheduleDay("coach", "all", day, "workout", "Push", code, now);
  await setScheduleDay("coach", `team:${team}`, day, "rest", null, null, now);
  await setScheduleDay("coach", "client:athlete", day, "workout", "Bench", code, now);
  const chosen = pickCell(await upcomingSchedule("athlete", now), day);
  expect(chosen && routineFromSchedule(chosen)?.name).toBe("Bench");

  await clearScheduleDay("coach", "client:athlete", day, now);
  expect(pickCell(await upcomingSchedule("athlete", now), day)?.kind).toBe("rest");

  await clearScheduleDay("coach", `team:${team}`, day, now);
  expect(pickCell(await upcomingSchedule("athlete", now), day)?.name).toBe("Push");
  expect(await upcomingSchedule("outsider", now)).toEqual([]);
});

it("supports future months and rejects invalid dates and unauthorized edits", async () => {
  expect(await setScheduleDay("coach", "all", "2027-02-30", "rest", null, null, now)).toEqual({ error: "horizon" });
  expect(await setScheduleDay("coach", "all", "2027-12-01", "rest", null, null, now)).toEqual({ error: "horizon" });
  expect(await setScheduleDay("athlete", `team:${team}`, day, "rest", null, null, now)).toEqual({ error: "gone" });
  expect(await setScheduleDay("coach", "client:outsider", day, "rest", null, null, now)).toEqual({ error: "gone" });
  await setScheduleDay("coach", "all", "2027-06-12", "rest", null, null, now);
  expect(await scheduleMonth("coach", "all", 2027, 5)).toMatchObject({ days: [{ date: "2027-06-12", kind: "rest" }] });
});

it("keeps the workout identity when a coach retries an unchanged save", async () => {
  const original = await setScheduleDay("coach", "all", day, "workout", "Push", code, now);
  const retry = await setScheduleDay("coach", "all", day, "workout", "Push", code, now + 1000);
  expect(original).toMatchObject({ updatedAt: now });
  expect(retry).toEqual(original);
  const updated = await setScheduleDay("coach", "all", day, "workout", "Push", "r1~Push~bench-press.5", now + 2000);
  expect(updated).toMatchObject({ updatedAt: now + 2000 });
  expect(await setScheduleDay("coach", "all", day, "workout", "Invalid", "r1~Invalid~unknown.3", now)).toEqual({ error: "bad" });
  expect(await scheduleMonth("coach", "all", 2026, 11)).toMatchObject({ days: [updated] });
});

it("stops sharing a client assignment when the athlete unlinks", async () => {
  await setScheduleDay("coach", "client:athlete", day, "rest", null, null, now);
  await unlink("athlete", "coach");
  expect(await upcomingSchedule("athlete", now)).toEqual([]);
});

it("lets an assistant use a single invited scope until access is revoked", async () => {
  const scope = `team:${team}`;
  const invitation = await inviteCalendarAssistant("coach", scope);
  expect(invitation).toBeTruthy();
  expect(await acceptCalendarInvite("coach", invitation)).toBe(false);
  expect(await acceptCalendarInvite("assistant", invitation)).toBe(true);
  expect(await acceptCalendarInvite("outsider", invitation)).toBe(false);
  const [grant] = await calendarAccess("assistant");
  expect(grant).toMatchObject({ own: false, scope });
  expect(await calendarOwner("assistant", grant?.id, scope)).toBe("coach");
  expect(await calendarOwner("assistant", grant?.id, "all")).toBeNull();
  expect(await calendarOwner("outsider", grant?.id, scope)).toBeNull();
  await revokeCalendarAccess("outsider", grant?.id);
  expect(await calendarOwner("assistant", grant?.id, scope)).toBe("coach");
  await revokeCalendarAccess("coach", grant?.id);
  expect(await calendarOwner("assistant", grant?.id, scope)).toBeNull();
});

it("counts workouts by session for the lead coach's linked roster", async () => {
  const log = (account: string, id: string, type: string, at: number) =>
    run("INSERT INTO sync_events (account_id, id, at, body) VALUES (?, ?, ?, ?)", [
      account,
      id,
      at,
      JSON.stringify({ type, sessionId: "same" }),
    ]);
  await log("athlete", "done", "sessionEnd", now - 1000);
  await log("athlete", "duplicate", "sessionEnd", now - 2000);
  await log("athlete", "set", "set", now);
  await log("outsider", "done", "sessionEnd", now);
  expect(await trainingActivity("coach", now)).toEqual([expect.objectContaining({ id: "athlete", workouts: 1, lastAt: now - 1000 })]);
  expect(await trainingActivity("assistant", now)).toEqual([]);
});
