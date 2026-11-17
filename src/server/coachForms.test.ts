import { beforeEach, describe, expect, it } from "vitest";

import { coachCleanup, joinCoach, makeInvite, unlink } from "./coach";
import {
  answerCheckin,
  checkinsOf,
  cleanAnswers,
  cleanForm,
  cleanPhoto,
  deleteForm,
  FORM_LIMITS,
  forms,
  pendingCheckins,
  photoFor,
  saveForm,
  savePhoto,
  sendDueCheckins,
  sendForm,
  setRepeat,
} from "./coachForms";
import { batch, query, resetDb, run } from "./db";
import { saveToken, setPushSender, type PushMessage } from "./push";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const WEEKLY = {
  title: "Weekly check-in",
  questions: [
    { id: "sleep", kind: "scale", label: "How did you sleep?" },
    { id: "kg", kind: "number", label: "Morning weight" },
    { id: "plan", kind: "yesno", label: "Did you follow the plan?" },
    { id: "wins", kind: "text", label: "Wins this week" },
  ],
};

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
  await saveToken("client", "tok-client-0123456789abcdef", "android", "en", NOW);
  await saveToken("coach", "tok-coach-0123456789abcdef", "ios", "en", NOW);
});

const weekly = async () => {
  const f = await saveForm("coach", WEEKLY, NOW, "f1");
  if ("error" in f) throw new Error(f.error);
  return f;
};

describe("forms", () => {
  it("keep only known kinds and labels, unique ids, and a capped length", () => {
    const f = cleanForm({
      title: "  Weekly\ncheck-in ",
      questions: [
        { id: "a", kind: "scale", label: "Sleep" },
        { id: "a", kind: "text", label: "Wins" },
        { kind: "colour", label: "Favourite colour" },
        { kind: "yesno", label: "   " },
        ...Array.from({ length: 20 }, (_, i) => ({ kind: "text", label: `Q${i}` })),
      ],
    });
    expect(f?.title).toBe("Weekly check-in");
    expect(f?.questions.slice(0, 2)).toEqual([
      { id: "a", kind: "scale", label: "Sleep" },
      { id: "ax", kind: "text", label: "Wins" },
    ]);
    expect(f?.questions).toHaveLength(FORM_LIMITS.questions);
    expect(cleanForm({ title: "Empty", questions: [] })).toBeNull();
  });

  it("are the coach's own to change or delete, up to ten", async () => {
    await weekly();
    expect(await saveForm("coach", { ...WEEKLY, id: "f1", title: "Sunday check-in" }, NOW + 1)).toMatchObject({
      id: "f1",
      title: "Sunday check-in",
    });
    expect(await saveForm("other", { ...WEEKLY, id: "f1" }, NOW)).toEqual({ error: "bad" });
    for (let i = 1; i < FORM_LIMITS.forms; i++) await saveForm("coach", WEEKLY, NOW, `f${i + 1}`);
    expect(await saveForm("coach", WEEKLY, NOW, "f99")).toEqual({ error: "full" });
    await deleteForm("other", "f1");
    expect((await forms("coach")).some((f) => f.id === "f1")).toBe(true);
    await deleteForm("coach", "f1");
    expect((await forms("coach")).some((f) => f.id === "f1")).toBe(false);
  });
});

describe("answers", () => {
  it("fit their questions or stay empty", () => {
    const qs = cleanForm(WEEKLY)!.questions;
    expect(cleanAnswers(qs, { sleep: 4, kg: 81.234, plan: true, wins: "  Hit 100 kg  " })).toEqual({
      sleep: 4,
      kg: 81.23,
      plan: true,
      wins: "Hit 100 kg",
    });
    expect(cleanAnswers(qs, { sleep: 9, kg: "heavy", plan: "yes", wins: 5, extra: 1 })).toEqual({
      sleep: null,
      kg: null,
      plan: null,
      wins: null,
    });
  });
});

describe("sending and answering", () => {
  it("goes only to the coach's own client, with a push that opens it", async () => {
    await weekly();
    expect(await sendForm("coach", "stranger", "f1", NOW)).toEqual({ error: "notClient" });
    expect(await sendForm("coach", "client", "nope", NOW)).toEqual({ error: "noForm" });
    const c = await sendForm("coach", "client", "f1", NOW, "c1");
    expect(c).toMatchObject({ id: "c1", title: "Weekly check-in", answers: null });
    expect(sent.map((m) => [m.token.slice(0, 10), m.kind, m.route])).toEqual([["tok-client", "coachCheckin", "#/trainer/f.c1"]]);
    expect((await pendingCheckins("client")).map((x) => x.id)).toEqual(["c1"]);
  });

  it("keeps the questions as they were sent, even after the form changes", async () => {
    await weekly();
    await sendForm("coach", "client", "f1", NOW, "c1");
    await saveForm("coach", { id: "f1", title: "New", questions: [{ kind: "text", label: "Other" }] }, NOW + 1);
    expect((await pendingCheckins("client"))[0]?.questions.map((q) => q.id)).toEqual(["sleep", "kg", "plan", "wins"]);
  });

  it("is answered once, by the client it was sent to, and tells the coach", async () => {
    await weekly();
    await sendForm("coach", "client", "f1", NOW, "c1");
    expect(await answerCheckin("coach", "c1", { sleep: 3 }, NOW)).toEqual({ error: "unknown" });
    expect(await answerCheckin("client", "c1", {}, NOW)).toEqual({ error: "empty" });
    expect(await answerCheckin("client", "c1", { sleep: 2, wins: "Squat PR" }, NOW + 1)).toMatchObject({
      answeredAt: NOW + 1,
      answers: { sleep: 2, wins: "Squat PR" },
    });
    expect(await answerCheckin("client", "c1", { sleep: 5 }, NOW + 2)).toEqual({ error: "answered" });
    expect(sent.at(-1)).toMatchObject({ kind: "coachCheckinDone", route: "#/trainer/c.client" });
    expect(await pendingCheckins("client")).toEqual([]);
    expect((await checkinsOf("coach", "client")).checkins[0]).toMatchObject({ id: "c1", answers: { sleep: 2 } });
  });

  it("keeps at most three waiting", async () => {
    await weekly();
    for (let i = 0; i < 5; i++) await sendForm("coach", "client", "f1", NOW + i, `c${i}`);
    expect((await pendingCheckins("client")).map((x) => x.id)).toEqual(["c4", "c3", "c2"]);
  });
});

describe("weekly check-ins", () => {
  it("send now, then again every seven days from the daily job, until turned off", async () => {
    await weekly();
    expect(await setRepeat("coach", "client", "f1", NOW)).toEqual({ formId: "f1", nextAt: NOW + 7 * DAY, every: 7 });
    expect(await pendingCheckins("client")).toHaveLength(1);
    expect(await sendDueCheckins(NOW + 6 * DAY)).toBe(0);
    expect(await sendDueCheckins(NOW + 7 * DAY + 3600_000)).toBe(1);
    expect((await checkinsOf("coach", "client")).repeat).toEqual({ formId: "f1", nextAt: NOW + 14 * DAY, every: 7 });
    expect(await setRepeat("coach", "client", null, NOW)).toBeNull();
    expect(await sendDueCheckins(NOW + 30 * DAY)).toBe(0);
  });

  it("stop when the form is deleted or the pair unlinks", async () => {
    await weekly();
    await setRepeat("coach", "client", "f1", NOW);
    await deleteForm("coach", "f1");
    expect((await checkinsOf("coach", "client")).repeat).toBeNull();
    await weekly();
    await setRepeat("coach", "client", "f1", NOW);
    await unlink("client", "coach");
    expect(await query("SELECT * FROM coach_checkins")).toEqual([]);
    expect(await query("SELECT * FROM coach_checkin_repeats")).toEqual([]);
  });

  it("a deleted account leaves no forms or check-ins behind", async () => {
    await weekly();
    await sendForm("coach", "client", "f1", NOW, "c1");
    await saveForm("coach", PROGRESS, NOW, "p1");
    await sendForm("coach", "client", "p1", NOW, "c2");
    await savePhoto("client", "c2", "front", JPEG, NOW);
    await batch(coachCleanup("coach"));
    expect(await query("SELECT * FROM coach_checkin_photos")).toEqual([]);
    expect(await query("SELECT * FROM coach_forms")).toEqual([]);
    expect(await query("SELECT * FROM coach_checkins")).toEqual([]);
  });
});

// 2026-11-17: body weight and photo questions, and repeating every two or four weeks.
const PROGRESS = {
  title: "Progress check-in",
  questions: [
    { id: "kg", kind: "weight", label: "Weight this morning" },
    { id: "front", kind: "photo", label: "From the front" },
    { id: "energy", kind: "scale", label: "Energy" },
  ],
};
// A tiny JPEG-looking data URL: the right first bytes, padded to a believable length.
const JPEG = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 7)]).toString("base64")}`;
const progress = async () => {
  const f = await saveForm("coach", PROGRESS, NOW, "p1");
  if ("error" in f) throw new Error(f.error);
  return f;
};
const teen = (id: string) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    id,
    JSON.stringify({ birthYear: new Date(NOW).getFullYear() - 15 }),
    NOW,
  ]);

describe("weight and photo questions", () => {
  it("keep at most three photo questions a form", () => {
    const f = cleanForm({ title: "Photos", questions: Array.from({ length: 5 }, (_, i) => ({ kind: "photo", label: `Pose ${i}` })) });
    expect(f?.questions).toHaveLength(FORM_LIMITS.photos);
  });

  it("weights are kilograms in a human range, and a photo counts only when it reached the server", () => {
    const qs = cleanForm(PROGRESS)!.questions;
    expect(cleanAnswers(qs, { kg: 81.26, front: true, energy: 4 })).toEqual({ kg: 81.3, front: null, energy: 4 });
    expect(cleanAnswers(qs, { kg: 5, front: true }, new Set(["front"]))).toEqual({ kg: null, front: true, energy: null });
  });

  it("photos must really be JPEGs of a sensible size", () => {
    expect(cleanPhoto(JPEG)).toBe(JPEG);
    expect(cleanPhoto("data:image/png;base64,iVBORw0KGgo")).toBeNull();
    expect(cleanPhoto(`data:image/jpeg;base64,${Buffer.alloc(300, 1).toString("base64")}`)).toBeNull();
    expect(cleanPhoto(`data:image/jpeg;base64,${"A".repeat(FORM_LIMITS.photoChars)}`)).toBeNull();
    expect(cleanPhoto(42)).toBeNull();
  });

  it("the client attaches a photo to a waiting check-in, and only the pair can see it", async () => {
    await progress();
    await sendForm("coach", "client", "p1", NOW, "c1");
    expect(await savePhoto("stranger", "c1", "front", JPEG, NOW)).toEqual({ error: "unknown" });
    expect(await savePhoto("client", "c1", "energy", JPEG, NOW)).toEqual({ error: "bad" });
    expect(await savePhoto("client", "c1", "front", "nope", NOW)).toEqual({ error: "bad" });
    expect(await savePhoto("client", "c1", "front", JPEG, NOW)).toBe(true);
    const done = await answerCheckin("client", "c1", { kg: 80, front: true, energy: 3 }, NOW + 1);
    expect(done).toMatchObject({ answers: { kg: 80, front: true, energy: 3 } });
    expect(await photoFor("coach", "c1", "front")).toBe(JPEG);
    expect(await photoFor("client", "c1", "front")).toBe(JPEG);
    expect(await photoFor("stranger", "c1", "front")).toBeNull();
    expect(await savePhoto("client", "c1", "front", JPEG, NOW + 2)).toEqual({ error: "answered" });
  });

  it("a photo the client never sent is skipped, whatever the answers say", async () => {
    await progress();
    await sendForm("coach", "client", "p1", NOW, "c1");
    expect(await answerCheckin("client", "c1", { front: true, energy: 2 }, NOW + 1)).toMatchObject({ answers: { front: null, energy: 2 } });
  });

  it("a client under 18 is never asked for a photo, and can't send one", async () => {
    await progress();
    await teen("client");
    const c = await sendForm("coach", "client", "p1", NOW, "c1");
    expect("error" in c ? c : c.questions.map((q) => q.kind)).toEqual(["weight", "scale"]);
    await saveForm("coach", { title: "Photos only", questions: [{ kind: "photo", label: "Front" }] }, NOW, "p2");
    expect(await sendForm("coach", "client", "p2", NOW, "c2")).toEqual({ error: "teen" });
  });

  it("photos go with their check-in, and when the pair unlinks", async () => {
    await progress();
    await sendForm("coach", "client", "p1", NOW, "c0");
    await savePhoto("client", "c0", "front", JPEG, NOW);
    // Three newer ones push the unanswered c0 out, and its photo with it.
    for (let i = 1; i <= FORM_LIMITS.pending; i++) await sendForm("coach", "client", "p1", NOW + i, `c${i}`);
    expect(await photoFor("coach", "c0", "front")).toBeNull();
    await savePhoto("client", "c1", "front", JPEG, NOW);
    expect(await photoFor("coach", "c1", "front")).toBe(JPEG);
    await unlink("client", "coach");
    expect(await query("SELECT * FROM coach_checkin_photos")).toEqual([]);
  });
});

describe("repeating every two or four weeks", () => {
  it("steps by the chosen period, and anything else means weekly", async () => {
    await weekly();
    expect(await setRepeat("coach", "client", "f1", NOW, 14)).toEqual({ formId: "f1", nextAt: NOW + 14 * DAY, every: 14 });
    expect(await sendDueCheckins(NOW + 13 * DAY)).toBe(0);
    expect(await sendDueCheckins(NOW + 14 * DAY)).toBe(1);
    expect((await checkinsOf("coach", "client")).repeat).toEqual({ formId: "f1", nextAt: NOW + 28 * DAY, every: 14 });
    expect(await setRepeat("coach", "client", "f1", NOW, 28)).toMatchObject({ every: 28, nextAt: NOW + 28 * DAY });
    expect(await setRepeat("coach", "client", "f1", NOW, 3)).toMatchObject({ every: 7 });
  });
});
