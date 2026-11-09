import { describe, expect, it } from "vitest";
import { addDays, atTime, parts, zoned } from "@/lib/messages";
import { capped, checkBody, confirm, memoryStore, reminderEnv, remove, runDaily, schedule, sha256, subscribe, unsubscribe, unsubToken, type Env, type Mailer, type Outgoing } from "./reminders";

const TZ = "America/Toronto";
const MON = zoned(2026, 11, 9, 0, 0, TZ);
const env: Env = { siteUrl: "https://liftsmith.app", secret: "s3cret", postalAddress: "123 Example St, Toronto ON M5V 0A1, Canada" };
const ID = "a".repeat(32);
const TOKEN = "b".repeat(64);

function fakeMail() {
  const sent: Outgoing[] = [];
  const cancelled: string[] = [];
  let n = 0;
  const mail: Mailer = {
    async send(m) {
      sent.push(m);
      return { id: `re_${++n}` };
    },
    async cancel(id) {
      cancelled.push(id);
      return true;
    },
  };
  return { mail, sent, cancelled };
}

function body(p: Record<string, unknown> = {}) {
  return {
    id: ID,
    token: TOKEN,
    email: "Lifter@Example.com",
    kinds: {},
    consentAt: MON,
    resubscribe: false,
    tz: TZ,
    days: [1, 3, 5],
    time: "18:00",
    daysPerWeek: 3,
    startedAt: addDays(MON, -30, TZ),
    lastWorkoutAt: atTime(addDays(MON, -3, TZ), "18:00", TZ),
    firstWorkoutAt: addDays(MON, -20, TZ),
    weekDays: 0,
    weekStart: MON,
    streakWeeks: 2,
    pro: { state: "pro" },
    ...p,
  };
}

const ok = (b: unknown) => {
  const c = checkBody(b);
  if (!c.ok) throw new Error(c.error);
  return c.body;
};

const confirmToken = (m: Outgoing) => /t=([0-9a-f]{64})/.exec(m.text)![1];

async function confirmed(now = MON - 3600_000) {
  const store = memoryStore();
  const f = fakeMail();
  await subscribe(ok(body()), store, f.mail, env, now);
  await confirm(ID, confirmToken(f.sent[0]), store, f.mail, env, now);
  return { store, ...f };
}

describe("checking the subscription", () => {
  it("accepts what the app sends and normalises the address", () => {
    const b = ok(body());
    expect(b.email).toBe("lifter@example.com");
    expect(b.plan).toMatchObject({ tz: TZ, days: [1, 3, 5], streakWeeks: 2 });
    expect(b.plan).not.toHaveProperty("kinds");
  });

  it.each([
    ["id", { id: "nope" }],
    ["token", { token: "x" }],
    ["email", { email: "not an email" }],
    ["kinds", { kinds: { spam: true } }],
    ["tz", { tz: "Mars/Olympus" }],
    ["days", { days: [1, 1] }],
    ["time", { time: "25:00" }],
    ["daysPerWeek", { daysPerWeek: 9 }],
    ["pro", { pro: { state: "gold" } }],
    ["lastWorkoutAt", { lastWorkoutAt: -5 }],
  ])("rejects a bad %s", (_, p) => {
    expect(checkBody(body(p)).ok).toBe(false);
  });

  it("needs every setting before it sends anything", () => {
    expect(reminderEnv({ RESEND_API_KEY: "k", REMINDER_SECRET: "s", MAIL_FROM: "a@b.c" })).toEqual({ missing: ["MAIL_POSTAL_ADDRESS"] });
    expect(reminderEnv({ RESEND_API_KEY: "k", REMINDER_SECRET: "s", MAIL_FROM: "a@b.c", MAIL_POSTAL_ADDRESS: "x", NEXT_PUBLIC_SITE_URL: "https://x.app/" })).toMatchObject({ env: { siteUrl: "https://x.app" } });
  });
});

describe("double opt-in", () => {
  it("sends only a confirmation until the link's button is pressed, then a welcome", async () => {
    const store = memoryStore();
    const { mail, sent } = fakeMail();
    const r = await subscribe(ok(body()), store, mail, env, MON);
    expect(r.body.status).toBe("pending");
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toBe("Confirm your Liftsmith emails");
    expect(sent[0].text).not.toMatch(/Unsubscribe/); // not yet a subscriber
    // Stored hashed, never the raw secrets.
    const row = store.subs.get(ID)!;
    expect(row.tokenHash).toBe(sha256(TOKEN));
    expect(JSON.stringify(row)).not.toContain(TOKEN);
    expect(JSON.stringify(row)).not.toContain(confirmToken(sent[0]));
    expect(row.accountId).toBeNull();

    expect(await confirm(ID, "f".repeat(64), store, mail, env, MON)).toBe("invalid");
    expect(await confirm(ID, confirmToken(sent[0]), store, mail, env, MON)).toBe("confirmed");
    expect(await confirm(ID, confirmToken(sent[0]), store, mail, env, MON)).toBe("already");
    const welcome = sent.find((m) => m.subject === "Welcome to Liftsmith")!;
    expect(welcome.headers).toMatchObject({ "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
    expect(welcome.text).toContain(env.postalAddress);
    expect(welcome.text).toContain(`/api/reminders/unsubscribe/?s=${ID}&t=${unsubToken(ID, env.secret)}`);
    expect(sent.filter((m) => m.subject === "Welcome to Liftsmith")).toHaveLength(1);
  });

  it("caps confirmation emails at three a day", async () => {
    const store = memoryStore();
    const { mail, sent } = fakeMail();
    await subscribe(ok(body()), store, mail, env, MON);
    for (let i = 0; i < 5; i++) await subscribe(ok(body({ resubscribe: true })), store, mail, env, MON + i);
    expect(sent.filter((m) => m.subject.startsWith("Confirm"))).toHaveLength(3);
  });

  it("refuses changes without the device's token", async () => {
    const store = memoryStore();
    const { mail } = fakeMail();
    await subscribe(ok(body()), store, mail, env, MON);
    expect((await subscribe(ok(body({ token: "c".repeat(64), email: "evil@example.com" })), store, mail, env, MON)).code).toBe(403);
    expect((await remove(ID, "c".repeat(64), store, mail, MON)).code).toBe(403);
  });

  it("asks again when the address changes", async () => {
    const { store, mail, sent } = await confirmed();
    const r = await subscribe(ok(body({ email: "new@example.com" })), store, mail, env, MON);
    expect(r.body.status).toBe("pending");
    expect(sent.at(-1)).toMatchObject({ to: "new@example.com", subject: "Confirm your Liftsmith emails" });
  });
});

describe("scheduling", () => {
  it("schedules the Monday email for the lifter's morning, in their time zone", async () => {
    const { sent } = await confirmed(MON - 3600_000);
    const week = sent.find((m) => m.subject === "Your training week")!;
    expect(week.scheduledAt).toBe(atTime(MON, "08:00", TZ));
    expect(week.idempotencyKey).toBe(`${ID}-reminder:2026-11-09`);
    expect(week.text).toContain("Unsubscribe from all Liftsmith emails");
  });

  it("doesn't schedule the same email twice when the job runs again", async () => {
    const { store, mail, sent } = await confirmed();
    const before = sent.length;
    await runDaily(store, mail, env, MON - 1800_000);
    expect(sent.length).toBe(before);
  });

  it("cancels a scheduled nudge once a workout makes it wrong", async () => {
    // Trained last Friday; Monday and Wednesday missed would mean a Thursday 08:00 nudge.
    const thu = addDays(MON, 3, TZ);
    const { store, mail, sent, cancelled } = await confirmed(thu - 6 * 3600_000);
    const nudge = sent.find((m) => m.subject === "Two training days slipped by");
    expect(nudge?.scheduledAt).toBe(atTime(thu, "08:00", TZ));
    // Wednesday night the phone reports a workout: the nudge is cancelled.
    await subscribe(ok(body({ lastWorkoutAt: thu - 5 * 3600_000, weekDays: 1 })), store, mail, env, thu - 4 * 3600_000);
    expect(cancelled).toHaveLength(1);
    expect(store.all.find((s) => s.key === "missed:2026-11-12")?.status).toBe("cancelled");
  });

  it("congratulates the first workout right away, once", async () => {
    const store = memoryStore();
    const f = fakeMail();
    const fresh = { lastWorkoutAt: null, firstWorkoutAt: null, streakWeeks: 0, startedAt: MON - 3600_000 };
    await subscribe(ok(body(fresh)), store, f.mail, env, MON);
    await confirm(ID, confirmToken(f.sent[0]), store, f.mail, env, MON);
    const at = atTime(MON, "18:30", TZ);
    const update = body({ ...fresh, lastWorkoutAt: at, firstWorkoutAt: at, weekDays: 1 });
    await subscribe(ok(update), store, f.mail, env, at + 3600_000);
    await subscribe(ok(update), store, f.mail, env, at + 7200_000);
    const first = f.sent.filter((m) => m.subject === "Your first workout is in the books");
    expect(first).toHaveLength(1);
    expect(first[0].scheduledAt).toBeUndefined();
  });

  it("caps email at one a day, three a week and one Pro email a fortnight", () => {
    const s = (day: number, kind: "reminder" | "pro" = "reminder") => ({ subId: ID, key: `${kind}:${day}`, kind, sendAt: atTime(addDays(MON, day, TZ), "08:00", TZ), resendId: null, status: "sent" as const });
    const at = (day: number, h = 12) => atTime(addDays(MON, day, TZ), `${h}:00`, TZ);
    expect(capped({ kind: "missed", at: at(0) }, [s(0)], TZ)).toBe(true);
    expect(capped({ kind: "missed", at: at(1) }, [s(0)], TZ)).toBe(false);
    expect(capped({ kind: "missed", at: at(5) }, [s(0), s(2), s(4)], TZ)).toBe(true);
    expect(capped({ kind: "missed", at: at(8) }, [s(0), s(2), s(4)], TZ)).toBe(false);
    expect(capped({ kind: "pro", at: at(10) }, [s(0, "pro")], TZ)).toBe(true);
    expect(capped({ kind: "pro", at: at(15) }, [s(0, "pro")], TZ)).toBe(false);
    expect(capped({ kind: "missed", at: at(0) }, [{ ...s(0), status: "cancelled" }], TZ)).toBe(false);
  });

  it("sends nothing while a subscription is unconfirmed", async () => {
    const store = memoryStore();
    const { mail, sent } = fakeMail();
    await subscribe(ok(body()), store, mail, env, MON - 3600_000);
    expect(await schedule(store.subs.get(ID)!, store, mail, env, MON - 3600_000)).toBe(0);
    expect((await runDaily(store, mail, env, MON - 3600_000)).subs).toBe(0);
    expect(sent).toHaveLength(1);
  });
});

describe("unsubscribe and delete", () => {
  it("one-click unsubscribe stops everything and cancels what's scheduled", async () => {
    const { store, mail, sent, cancelled } = await confirmed();
    expect(await unsubscribe(ID, "0".repeat(32), store, mail, env, MON - 1800_000)).toBe(false);
    expect(await unsubscribe(ID, unsubToken(ID, env.secret), store, mail, env, MON - 1800_000)).toBe(true);
    expect(store.subs.get(ID)!.status).toBe("unsubscribed");
    expect(cancelled.length).toBeGreaterThan(0);
    const n = sent.length;
    // The app keeps syncing, which must not quietly resubscribe them.
    expect((await subscribe(ok(body()), store, mail, env, MON)).body.status).toBe("unsubscribed");
    await runDaily(store, mail, env, MON);
    expect(sent.length).toBe(n);
    // Turning email back on in the app asks for a fresh confirmation.
    expect((await subscribe(ok(body({ resubscribe: true })), store, mail, env, MON)).body.status).toBe("pending");
  });

  it("deleting from the app erases the address and its history", async () => {
    const { store, mail } = await confirmed();
    expect((await remove(ID, TOKEN, store, mail, MON)).code).toBe(200);
    expect(store.subs.size).toBe(0);
    expect(store.all).toHaveLength(0);
    expect((await remove(ID, TOKEN, store, mail, MON)).code).toBe(404);
  });
});

it("plans in the subscriber's zone, not the server's", async () => {
  const tokyo = "Asia/Tokyo";
  const store = memoryStore();
  const f = fakeMail();
  const mon = zoned(2026, 11, 9, 0, 0, tokyo);
  await subscribe(ok(body({ tz: tokyo, weekStart: mon })), store, f.mail, env, mon - 3600_000);
  await confirm(ID, confirmToken(f.sent[0]), store, f.mail, env, mon - 3600_000);
  const week = f.sent.find((m) => m.subject === "Your training week")!;
  expect(parts(week.scheduledAt!, tokyo)).toMatchObject({ wd: 1, h: 8 });
});
