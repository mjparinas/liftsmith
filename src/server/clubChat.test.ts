import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ClubMessage, ClubSummary, CrewSession } from "@/lib/socialTypes";

import { CHAT_PUSH_GAP, crewReminders } from "./clubChat";
import { query, resetDb, run } from "./db";
import { saveToken, setPushSender, type PushMessage } from "./push";
import { adminReports, handle, resolveReports } from "./social";

// Club chat and crew sessions (Melvin, 2026-11-17; docs/decisions/friends.md "Club chat and crew sessions").
const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string) => call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true });
const born = (who: string, year: number) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    who,
    JSON.stringify({ birthYear: year }),
    NOW,
  ]);
const chat = async (who: string, now = NOW + 1) =>
  ((await call(who, "clubChat", { id: club }, now)).body.messages as ClubMessage[] | undefined)?.map((m) => m.body);
const say = (who: string, text: string, now = NOW) => call(who, "clubSay", { id: club, text }, now);
const sessions = async (who: string, now = NOW) =>
  ((await call(who, "club", { id: club, from: now - 86_400_000 }, now)).body.club as { sessions: CrewSession[] }).sessions;

const sent: PushMessage[] = [];
let club = "";
beforeEach(async () => {
  await resetDb();
  sent.length = 0;
  setPushSender(async (m) => {
    sent.push(m);
    return "ok";
  });
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await join("acc-c", "casey");
  await join("acc-d", "drew");
  for (const [who, tok] of [
    ["acc-a", "tok-a"],
    ["acc-b", "tok-b"],
    ["acc-c", "tok-c"],
  ] as const)
    await saveToken(who, `${tok}-0123456789abcdef`, "android", "en", NOW);
  const r = (await call("acc-a", "clubCreate", { name: "Barn crew" })).body as { id: string; code: string };
  club = r.id;
  for (const who of ["acc-b", "acc-c"]) await call(who, "clubJoin", { code: r.code });
});
afterEach(() => setPushSender(null));

describe("club chat", () => {
  it("is for members only, in time order, through the word filter and with no links", async () => {
    expect((await say("acc-a", "Who's in for 6 tomorrow?")).code).toBe(200);
    expect((await say("acc-b", "Me!", NOW + 1000)).code).toBe(200);
    expect(await chat("acc-c", NOW + 2000)).toEqual(["Who's in for 6 tomorrow?", "Me!"]);
    expect((await say("acc-d", "let me in")).code).toBe(404);
    expect((await call("acc-d", "clubChat", { id: club })).code).toBe(404);
    expect((await say("acc-a", "see www.example.com")).body).toEqual({ error: "message.link" });
    expect((await say("acc-a", "   ")).body).toEqual({ error: "message.empty" });
  });

  it("asks for only what's new after a time, and pages back with before", async () => {
    for (let i = 0; i < 55; i++) await say("acc-a", `m${i}`, NOW + i);
    const first = (await call("acc-b", "clubChat", { id: club }, NOW + 100)).body as { messages: ClubMessage[]; more: boolean };
    expect(first.messages).toHaveLength(50);
    expect(first.messages[0]!.body).toBe("m5");
    expect(first.more).toBe(true);
    const back = (await call("acc-b", "clubChat", { id: club, before: first.messages[0]!.at }, NOW + 100)).body as {
      messages: ClubMessage[];
    };
    expect(back.messages.map((m) => m.body)).toEqual(["m0", "m1", "m2", "m3", "m4"]);
    await say("acc-c", "new one", NOW + 200);
    const next = (await call("acc-b", "clubChat", { id: club, after: NOW + 54 }, NOW + 300)).body as { messages: ClubMessage[] };
    expect(next.messages.map((m) => m.body)).toEqual(["new one"]);
  });

  it("leaves out people blocked either way and muted, and lets the writer or the starter delete", async () => {
    await say("acc-b", "from blair");
    const [m] = (await call("acc-c", "clubChat", { id: club }, NOW + 1)).body.messages as ClubMessage[];
    expect(m).toMatchObject({ mine: false, canDelete: false });
    await call("acc-c", "mute", { handle: "blair" });
    expect(await chat("acc-c")).toEqual([]);
    await call("acc-a", "block", { handle: "blair" });
    expect(await chat("acc-a")).toEqual([]);
    // The starter can still delete it: Casey can't.
    await call("acc-c", "clubUnsay", { id: m!.id });
    expect(await query("SELECT id FROM club_messages")).toHaveLength(1);
    await call("acc-a", "clubUnsay", { id: m!.id });
    expect(await query("SELECT id FROM club_messages")).toHaveLength(0);
  });

  it("counts unread messages on the club list until the chat is opened", async () => {
    await say("acc-a", "one");
    await say("acc-a", "two", NOW + 1);
    const list = async (who: string, now: number) => ((await call(who, "clubs", {}, now)).body.clubs as ClubSummary[])[0]!;
    expect((await list("acc-b", NOW + 2)).unread).toBe(2);
    expect((await list("acc-a", NOW + 2)).unread).toBe(0);
    await chat("acc-b", NOW + 3);
    expect((await list("acc-b", NOW + 4)).unread).toBe(0);
  });

  it("pushes members at most once an hour per club, and not after they turn it off", async () => {
    await say("acc-a", "first");
    expect(sent.map((m) => m.token.slice(0, 5)).sort()).toEqual(["tok-b", "tok-c"]);
    expect(sent[0]).toMatchObject({ kind: "clubMsg", route: `#/friends/club.${club}` });
    expect(sent[0]!.body).toBe("Barn crew · Alex: first");
    sent.length = 0;
    await say("acc-a", "second", NOW + 60_000);
    expect(sent).toEqual([]);
    // Casey reads the chat; an hour on, both get the next one, unless Blair turned it off.
    await chat("acc-c", NOW + 2 * 60_000);
    await call("acc-b", "clubChatPush", { id: club, on: false });
    await say("acc-a", "third", NOW + CHAT_PUSH_GAP + 60_000);
    expect(sent.map((m) => m.token.slice(0, 5))).toEqual(["tok-c"]);
  });

  it("is reported like a comment: three reports hide a message, and staff can remove it", async () => {
    await join("acc-e", "eden");
    const code = String(((await call("acc-a", "club", { id: club, from: NOW - 1 })).body.club as { code: string }).code);
    for (const who of ["acc-d", "acc-e"]) await call(who, "clubJoin", { code });
    const r = (await say("acc-b", "rude words")).body.message as ClubMessage;
    for (const who of ["acc-a", "acc-c", "acc-d"])
      expect((await call(who, "report", { kind: "message", id: r.id, reason: "abuse" })).code).toBe(200);
    expect(await chat("acc-e")).toEqual([]);
    const [group] = await adminReports();
    expect(group).toMatchObject({ kind: "message", content: "rude words", hidden: true, author: { handle: "blair" } });
    expect(await resolveReports("message", r.id, "remove")).toBe(true);
    expect(await query("SELECT id FROM club_messages")).toHaveLength(0);
  });

  it("isn't for under 18s", async () => {
    await born("acc-c", new Date(NOW).getUTCFullYear() - 15);
    expect((await say("acc-c", "hi")).body).toEqual({ error: "crewMinor" });
    expect((await call("acc-c", "clubChat", { id: club })).body).toEqual({ error: "crewMinor" });
    // Nor do they get its pushes.
    await say("acc-a", "hello crew");
    expect(sent.map((m) => m.token.slice(0, 5))).toEqual(["tok-b"]);
  });

  it("goes with the club, and with a lifter leaving Friends", async () => {
    await say("acc-b", "bye");
    await call("acc-b", "leave");
    expect(await query("SELECT id FROM club_messages")).toHaveLength(0);
    await say("acc-c", "still here");
    await call("acc-a", "clubLeave", { id: club });
    expect(await query("SELECT id FROM club_messages")).toHaveLength(0);
  });
});

describe("crew sessions", () => {
  const plan = (who: string, b: Record<string, unknown> = {}, now = NOW) =>
    call(who, "crewPost", { club, at: NOW + 20 * HOUR, title: "Leg day", place: "", ...b }, now);

  it("are posted for up to 30 days ahead, with the poster in, and tell the club", async () => {
    expect((await plan("acc-a", { at: NOW - HOUR })).body).toEqual({ error: "crew.when" });
    expect((await plan("acc-a", { at: NOW + 31 * 24 * HOUR })).body).toEqual({ error: "crew.when" });
    expect((await plan("acc-a", { title: "" })).body).toEqual({ error: "crew.empty" });
    expect((await plan("acc-a", { place: "www.example.com" })).body).toEqual({ error: "crew.link" });
    expect((await plan("acc-d")).code).toBe(404);
    const r = (await plan("acc-a", { place: "By the racks" })).body as { sessions: CrewSession[] };
    expect(r.sessions).toEqual([
      expect.objectContaining({ title: "Leg day", place: "By the racks", in: true, canCancel: true, by: { handle: "alex", name: "Alex" } }),
    ]);
    expect(
      sent
        .filter((m) => m.kind === "crewNew")
        .map((m) => m.token.slice(0, 5))
        .sort(),
    ).toEqual(["tok-b", "tok-c"]);
    expect(sent.find((m) => m.kind === "crewNew")!.body).toBe("Alex posted a crew session: Leg day. Are you in?");
  });

  it("take I'm in and out, and only the poster or the starter can cancel", async () => {
    await plan("acc-b");
    const [x] = await sessions("acc-c");
    expect(x).toMatchObject({ in: false, canCancel: false });
    await call("acc-c", "crewGoing", { id: x!.id });
    expect((await sessions("acc-c"))[0]!.going.map((g) => g.handle)).toEqual(["blair", "casey"]);
    await call("acc-c", "crewGoing", { id: x!.id, on: false });
    expect((await sessions("acc-c"))[0]!.going.map((g) => g.handle)).toEqual(["blair"]);
    expect((await call("acc-c", "crewCancel", { id: x!.id })).code).toBe(404);
    expect((await sessions("acc-a"))[0]!.canCancel).toBe(true);
    await call("acc-a", "crewCancel", { id: x!.id });
    expect(await sessions("acc-b")).toEqual([]);
  });

  it("remind everyone who's in once, within the hour before, however often the schedule runs", async () => {
    await plan("acc-a");
    const [x] = await sessions("acc-b");
    await call("acc-b", "crewGoing", { id: x!.id });
    sent.length = 0;
    expect(await crewReminders(NOW + 18 * HOUR)).toEqual({ sessions: 0, pushed: 0 });
    expect(await crewReminders(NOW + 19.5 * HOUR)).toEqual({ sessions: 1, pushed: 2 });
    expect(await crewReminders(NOW + 19.6 * HOUR)).toEqual({ sessions: 0, pushed: 0 });
    expect(sent.map((m) => m.kind)).toEqual(["crewSoon", "crewSoon"]);
    expect(sent[0]!.body).toBe("Crew session within the hour: Leg day. See you there 💪");
  });

  it("mark who trained from a posted workout around the time, and tag the others who are friends", async () => {
    await plan("acc-a");
    const [x] = await sessions("acc-b");
    await call("acc-b", "crewGoing", { id: x!.id });
    await call("acc-c", "crewGoing", { id: x!.id });
    // Alex and Blair follow each other; Casey is only in the club.
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    await call("acc-b", "follow", { handle: "alex" });
    await call("acc-a", "answer", { handle: "blair", accept: true });
    const r = await call(
      "acc-a",
      "post",
      {
        workoutId: "w1",
        at: NOW + 20.2 * HOUR,
        body: {
          seconds: 3000,
          sets: 12,
          volume: 4200,
          prs: 0,
          muscles: ["quads"],
          exercises: [{ id: "squat", name: "Squat", sets: 4, w: 100, r: 5 }],
        },
      },
      NOW + 21.5 * HOUR,
    );
    expect(r.code).toBe(200);
    const going = (await sessions("acc-b", NOW + 21.5 * HOUR))[0]!.going;
    expect(going.map((g) => [g.handle, g.trained])).toEqual([
      ["alex", true],
      ["blair", false],
      ["casey", false],
    ]);
    const tagged = await query("SELECT account_id FROM post_partners WHERE post_id = ?", [String(r.body.id)]);
    expect(tagged.map((t) => t.account_id)).toEqual(["acc-b"]);
  });

  it("aren't for under 18s, who see none", async () => {
    await plan("acc-a");
    await born("acc-c", new Date(NOW).getUTCFullYear() - 16);
    expect(await sessions("acc-c")).toEqual([]);
    expect((await plan("acc-c")).body).toEqual({ error: "crewMinor" });
    const [x] = await sessions("acc-b");
    expect((await call("acc-c", "crewGoing", { id: x!.id })).body).toEqual({ error: "crewMinor" });
  });

  it("show the next one the lifter is in on the club list", async () => {
    await plan("acc-a");
    const [c] = (await call("acc-a", "clubs", {})).body.clubs as ClubSummary[];
    expect(c!.nextSession).toBe(NOW + 20 * HOUR);
    const [b] = (await call("acc-b", "clubs", {})).body.clubs as ClubSummary[];
    expect(b!.nextSession).toBeNull();
  });
});
