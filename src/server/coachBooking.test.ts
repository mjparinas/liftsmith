import { beforeEach, describe, expect, it } from "vitest";

import { coachCleanup, joinCoach, makeInvite, unlink } from "./coach";
import { addSlots, book, BOOK_LIMITS, cancelSlot, clientSlots, coachSlots, slotsWith, type Slot } from "./coachBooking";
import { batch, resetDb } from "./db";
import { saveToken, setPushSender, type PushMessage } from "./push";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const HOUR = 3_600_000;

const sent: PushMessage[] = [];
beforeEach(async () => {
  await resetDb();
  sent.length = 0;
  setPushSender(async (m) => {
    sent.push(m);
    return "ok";
  });
  await makeInvite("coach", NOW, "CCCCDDDD");
  await joinCoach("client", "CCCCDDDD", NOW);
  await joinCoach("other", "CCCCDDDD", NOW);
  await saveToken("client", "tok-client-0123456789abcdef", "android", "en", NOW);
  await saveToken("coach", "tok-coach-0123456789abcdef", "ios", "en", NOW);
});

const open = async (x: Record<string, unknown> = {}) => {
  const r = await addSlots("coach", { start: NOW + DAY, minutes: 60, place: "Main gym", ...x }, NOW);
  if ("error" in r) throw new Error(r.error);
  return r;
};

describe("opening times", () => {
  it("adds one time, or the same time each week", async () => {
    expect(await open()).toHaveLength(1);
    const weekly = await open({ start: NOW + 2 * DAY, weeks: 4 });
    expect(weekly.map((s) => s.start - weekly[0]!.start)).toEqual([0, 7 * DAY, 14 * DAY, 21 * DAY]);
    expect(await open({ start: NOW + 3 * DAY, weeks: 99 })).toHaveLength(BOOK_LIMITS.weeks);
    expect(await coachSlots("coach", NOW)).toHaveLength(1 + 4 + BOOK_LIMITS.weeks);
  });

  it("refuses the past, too far ahead, odd lengths and people who aren't clients", async () => {
    expect(await addSlots("coach", { start: NOW - HOUR, minutes: 60 }, NOW)).toEqual({ error: "bad" });
    expect(await addSlots("coach", { start: NOW + 200 * DAY, minutes: 60 }, NOW)).toEqual({ error: "bad" });
    expect(await addSlots("coach", { start: NOW + DAY, minutes: 5 }, NOW)).toEqual({ error: "bad" });
    expect(await addSlots("coach", { start: NOW + DAY, minutes: 60, client: "stranger" }, NOW)).toEqual({ error: "notClient" });
  });

  it("a coach books a client straight in, and the client hears about it", async () => {
    const [s] = await open({ client: "client", label: "Thu 6:00 PM" });
    expect(s).toMatchObject({ clientId: "client", bookedAt: NOW });
    expect(sent.map((m) => m.token)).toEqual(["tok-client-0123456789abcdef"]);
    expect(sent[0]!.body).toContain("Thu 6:00 PM");
    expect((await clientSlots("client", NOW)).booked.map((x) => x.id)).toEqual([s!.id]);
    expect(await slotsWith("coach", "client", NOW)).toHaveLength(1);
  });
});

describe("booking", () => {
  it("a client books an open time; only one client gets it, and others never see who", async () => {
    const [s] = await open();
    expect((await clientSlots("other", NOW)).open).toHaveLength(1);
    const [a, b] = await Promise.all([book("client", s!.id, "Thu 6:00 PM", NOW), book("other", s!.id, "Thu 6:00 PM", NOW)]);
    expect([a, b].filter((r) => !("error" in r))).toHaveLength(1);
    expect([a, b].filter((r) => "error" in r)).toEqual([{ error: "taken" }]);
    const winner = (a as Slot).clientId ? "client" : "other";
    const loser = winner === "client" ? "other" : "client";
    expect((await clientSlots(loser, NOW)).open).toEqual([]);
    expect((await clientSlots(loser, NOW)).booked).toEqual([]);
  });

  it("only clients of that coach can book, and not a time that's passed", async () => {
    const [s] = await open();
    expect(await book("stranger", s!.id, "", NOW)).toEqual({ error: "taken" });
    expect(await book("client", s!.id, "", NOW + 2 * DAY)).toEqual({ error: "taken" });
    expect(await book("client", "nope", "", NOW)).toEqual({ error: "unknown" });
  });

  it("the coach hears when a client books", async () => {
    const [s] = await open();
    await book("client", s!.id, "Thu 6:00 PM", NOW);
    expect(sent.map((m) => m.token)).toEqual(["tok-coach-0123456789abcdef"]);
    expect(sent[0]!.route).toBe("#/trainer/c.client");
  });
});

describe("cancelling", () => {
  it("a client's cancel opens the time again; a coach's removes it and tells the client", async () => {
    const [s] = await open();
    await book("client", s!.id, "", NOW);
    expect(await cancelSlot("other", s!.id, "", NOW)).toEqual({ error: "unknown" });
    await cancelSlot("client", s!.id, "Thu", NOW);
    expect((await clientSlots("other", NOW)).open).toHaveLength(1);
    await book("other", s!.id, "", NOW);
    sent.length = 0;
    await saveToken("other", "tok-other-0123456789abcdef", "android", "en", NOW);
    await cancelSlot("coach", s!.id, "Thu", NOW);
    expect(await coachSlots("coach", NOW)).toEqual([]);
    expect(sent.map((m) => m.token)).toEqual(["tok-other-0123456789abcdef"]);
  });

  it("leaving a coach opens their booked times again; deleting the coach's account removes them all", async () => {
    const [s] = await open({ client: "client" });
    await unlink("client", "coach");
    expect((await coachSlots("coach", NOW))[0]).toMatchObject({ id: s!.id, clientId: null });
    await batch(coachCleanup("coach"));
    expect(await coachSlots("coach", NOW)).toEqual([]);
  });
});
