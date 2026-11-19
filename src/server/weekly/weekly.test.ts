import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { COMPETITORS } from "@/content/compare";
import { addDays, atTime, parts, zoned } from "@/lib/messages";
import { MSG_LANGS } from "@/lib/messageText";

import { checkBody, confirm, memoryStore, runDaily, subscribe, type Env, type Mailer, type Outgoing, type Send } from "../reminders";
import { TOUR } from "../tour";
import { WEEKLY, type WeeklyEmail } from "./list";
import {
  AFTER_TOUR,
  forAccount,
  imageOf,
  nextWeekly,
  NO_FACTS,
  queue,
  TEXT,
  weeklyKey,
  weeklyMail,
  weeklyStart,
  WITHOUT_TOUR,
} from "./send";

const TZ = "America/Vancouver";
const MON = zoned(2026, 11, 9, 0, 0, TZ);
const TUE = addDays(MON, 1, TZ);
const DAY = 86_400_000;
const footer = { unsubscribeUrl: "https://example.com/u", postalAddress: "1 Main St" };
const send = (key: string, kind: Send["kind"], at: number, status: Send["status"] = "sent"): Send => ({
  subId: "s",
  key,
  kind,
  sendAt: at,
  resendId: null,
  status,
});
const byId = (id: string) => WEEKLY.find((e) => e.id === id)!;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/**
 * Brand-new feature emails (`fresh`) go out first to everyone, so while one is on the list it leads every queue.
 * The order tests are about the list underneath, so they set the real fresh emails aside (and add their own).
 */
function setFreshAside() {
  let aside: WeeklyEmail[] = [];
  beforeAll(() => {
    aside = WEEKLY.filter((e) => e.fresh);
    for (const e of aside) WEEKLY.splice(WEEKLY.indexOf(e), 1);
  });
  afterAll(() => {
    WEEKLY.push(...aside);
  });
}

describe("the weekly tips' words", () => {
  it("has every email in every language, with the same number of points", () => {
    const ids = WEEKLY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lang of MSG_LANGS) {
      const { emails, common } = TEXT[lang];
      expect(Object.keys(emails).sort(), lang).toEqual([...ids].sort());
      for (const id of ids) {
        const w = emails[id]!;
        expect(w.points.length, `${lang} ${id}`).toBe(TEXT.en.emails[id]!.points.length);
        for (const line of [w.title, w.intro, w.dyk, ...w.points]) expect(line.trim(), `${lang} ${id}`).not.toBe("");
      }
      for (const [k, v] of Object.entries(common))
        expect(placeholders(v), `${lang} ${k}`).toEqual(placeholders(TEXT.en.common[k as keyof typeof common]));
    }
  });

  it("has three to five points per email and no other app's name", () => {
    const names = COMPETITORS.map((c) => c.name.toLowerCase());
    for (const lang of MSG_LANGS)
      for (const [id, w] of Object.entries(TEXT[lang].emails)) {
        expect(w.points.length, id).toBeGreaterThanOrEqual(3);
        expect(w.points.length, id).toBeLessThanOrEqual(5);
        const all = [w.title, w.intro, w.dyk, ...w.points].join(" ").toLowerCase();
        for (const n of names) expect(all, `${lang} ${id}`).not.toContain(n);
        expect(all, `${lang} ${id}`).not.toContain("5/3/1");
      }
  });

  it("has a screenshot for every email in every language", () => {
    for (const lang of MSG_LANGS)
      for (const e of WEEKLY) {
        const shot = imageOf(e);
        if (shot) expect(existsSync(join(process.cwd(), "public/email", lang, `${shot}.jpg`)), `${lang} ${e.id}`).toBe(true);
      }
    // The ones without a picture are the screens that need someone's account, the gym's own pages, and the community
    // and the routine library, whose posts and routines come from our server in the lifters' own words.
    expect(
      WEEKLY.filter((e) => !imageOf(e)).every(
        (e) => e.route.startsWith("trainer") || ["friends", "gym", "community", "library"].includes(e.route),
      ),
    ).toBe(true);
    expect(weeklyMail({ email: byId("friends-feed"), n: 0 }, footer, "en", { state: "pro" }).html).not.toContain("/email/en/w/");
  });

  it("opens a screen the app knows", () => {
    for (const e of WEEKLY) expect(e.route, e.id).toMatch(/^[a-z-]+(\/[a-z-]+)?$/);
  });
});

describe("who gets which", () => {
  setFreshAside();
  const coach = { roles: ["coach" as const], flags: { coachPlans: false } };
  it("sends role emails only to that role, keeps lifter emails from roles they'd repeat, and waits for flags", () => {
    expect(forAccount(byId("coach-clients"), NO_FACTS)).toBe(false);
    expect(forAccount(byId("coach-clients"), coach)).toBe(true);
    expect(forAccount(byId("find-coach"), NO_FACTS)).toBe(true);
    expect(forAccount(byId("find-coach"), coach)).toBe(false);
    expect(forAccount(byId("coach-plans"), coach)).toBe(false);
    expect(forAccount(byId("coach-plans"), { ...coach, flags: { coachPlans: true } })).toBe(true);
    expect(queue(new Set(), NO_FACTS).some((e) => e.audience !== "lifter")).toBe(false);
  });

  it("goes in list order, skipping what was sent, with brand-new features first", () => {
    // New feature emails go first (tested just below), so count them as already sent here.
    const sent = new Set([weeklyKey(byId("gym-setup")), ...WEEKLY.filter((w) => w.fresh).map(weeklyKey)]);
    expect(queue(sent, NO_FACTS)[0]!.id).toBe("import");
    const original = WEEKLY.length;
    const fresh: WeeklyEmail = { id: "zz-new", audience: "lifter", tier: "free", route: "today", fresh: "2026-12-01" };
    WEEKLY.push(fresh);
    try {
      expect(queue(sent, NO_FACTS)[0]!.id).toBe("zz-new");
    } finally {
      WEEKLY.length = original;
    }
  });
});

describe("when they go out", () => {
  setFreshAside();
  const tourDone = TOUR.map((t, i) => send(`tour:${t.id}`, "tour", atTime(addDays(MON, i - 14, TZ), "10:00", TZ)));
  const lastTour = tourDone.at(-1)!.sendAt;

  it("starts a week after Getting started, or fifteen days in when it's off, never while it runs", () => {
    expect(weeklyStart(tourDone, true, 0)).toBe(lastTour + AFTER_TOUR);
    expect(weeklyStart(tourDone.slice(0, 5), true, 0)).toBeNull();
    expect(weeklyStart([], false, MON)).toBe(MON + WITHOUT_TOUR);
  });

  it("goes on Tuesday at 10:00, or the next free weekday, and once a calendar week", () => {
    const start = 0;
    // The first two in line: any brand-new feature email, then the list.
    const [first, second] = queue(new Set(), NO_FACTS).map(weeklyKey);
    const t = nextWeekly(tourDone, TZ, MON + 12 * 3600_000, TUE + DAY, start, NO_FACTS);
    expect(t).toMatchObject({ key: first, at: atTime(TUE, "10:00", TZ), n: 0 });
    // Tuesday already has an email: Wednesday instead.
    const busy = [...tourDone, send("recap:x", "recap", atTime(TUE, "18:00", TZ))];
    expect(nextWeekly(busy, TZ, TUE, TUE + DAY, start, NO_FACTS)).toBeNull();
    const wed = addDays(MON, 2, TZ);
    expect(nextWeekly(busy, TZ, wed, wed + DAY, start, NO_FACTS)?.at).toBe(atTime(wed, "10:00", TZ));
    // One went out this week: nothing more until next week, and the next one is the next on the list.
    const done = [...tourDone, send(first!, "weekly", atTime(TUE, "10:00", TZ))];
    expect(nextWeekly(done, TZ, wed, addDays(MON, 7, TZ), start, NO_FACTS)).toBeNull();
    const nextTue = addDays(MON, 8, TZ);
    expect(nextWeekly(done, TZ, nextTue, nextTue + DAY, start, NO_FACTS)).toMatchObject({ key: second, n: 1 });
    // A weekly tip that stepped aside goes again.
    const stepped = [...tourDone, send(first!, "weekly", atTime(TUE, "10:00", TZ), "cancelled")];
    expect(nextWeekly(stepped, TZ, wed, wed + DAY, start, NO_FACTS)?.key).toBe(first);
  });

  it("never on Sunday or Monday, before it may start, in a week that already has three emails or a trial ending", () => {
    expect(nextWeekly(tourDone, TZ, MON, MON + DAY, 0, NO_FACTS)).toBeNull();
    expect(nextWeekly(tourDone, TZ, TUE, TUE + DAY, TUE + DAY, NO_FACTS)).toBeNull();
    const three = [-1, -3, -5].map((d, i) => send(`x${i}`, "missed", atTime(addDays(TUE, d, TZ), "18:00", TZ)));
    expect(nextWeekly([...tourDone, ...three], TZ, TUE, TUE + DAY, 0, NO_FACTS)).toBeNull();
    expect(parts(atTime(TUE, "10:00", TZ), TZ).wd).toBe(2);
    const trial = send("trial:x", "trial", atTime(addDays(MON, 4, TZ), "10:00", TZ));
    expect(nextWeekly([...tourDone, trial], TZ, TUE, TUE + DAY, 0, NO_FACTS)).toBeNull();
  });
});

describe("the email", () => {
  it("is branded, in the reader's language, with its screen, its points and Did you know", () => {
    const m = weeklyMail({ email: byId("gym-setup"), n: 0 }, footer, "fr", { state: "free", since: 0 });
    expect(m.subject).toBe(TEXT.fr.emails["gym-setup"]!.title);
    expect(m.html).toContain('src="https://www.getliftsmith.com/email/fr/w/gym-setup.jpg"');
    expect(m.text).toContain("Conseil de la semaine · 1");
    expect(m.text).toContain(`• ${TEXT.fr.emails["gym-setup"]!.points[0]}`);
    expect(m.text).toContain("Le saviez-vous ?");
    expect(m.html).toContain("#/gym");
    expect(m.text).toContain("https://example.com/u");
    // A free feature has no Pro line.
    expect(m.text).not.toContain("Pro");
  });

  it("ends Pro and Labs emails with what that means for this reader", () => {
    const free = weeklyMail({ email: byId("plateau"), n: 3 }, footer, "en", { state: "free", since: 0 }).text;
    expect(free).toContain("This is part of Pro: $6.99 a month or $39.99 a year, with no ads, ever.");
    const pro = weeklyMail({ email: byId("plateau"), n: 3 }, footer, "en", { state: "pro" }).text;
    expect(pro).toContain("This is part of your Pro.");
    const trial = weeklyMail({ email: byId("labs-camera"), n: 3 }, footer, "en", { state: "trial", endsAt: 0 }).text;
    expect(trial).toContain("Labs are experiments");
    expect(trial).toContain("This is part of the Pro trial you're on.");
    const plans = weeklyMail({ email: byId("coach-plans"), n: 3 }, footer, "en", { state: "free", since: 0 }).text;
    expect(plans).not.toContain("This is part of Pro");
    const why = weeklyMail({ email: byId("why-pro"), n: 3 }, footer, "en", { state: "free", since: 0 }).text;
    expect(why).toContain("See what Pro adds");
  });
});

describe("through the daily job", () => {
  setFreshAside();
  const env: Env = { siteUrl: "https://www.getliftsmith.com", secret: "s3cret", postalAddress: "1 Main St" };
  const ID = "a".repeat(32);
  const TOKEN = "b".repeat(64);
  function fakeMail() {
    const sent: Outgoing[] = [];
    let n = 0;
    const mail: Mailer = {
      async send(m) {
        sent.push(m);
        return { id: `re_${++n}` };
      },
      async cancel() {
        return true;
      },
    };
    return { mail, sent };
  }
  const body = (p: Record<string, unknown> = {}) => {
    const c = checkBody({
      id: ID,
      token: TOKEN,
      email: "lifter@example.com",
      kinds: { tour: false },
      consentAt: MON,
      resubscribe: false,
      tz: TZ,
      days: [1, 3, 5],
      time: "18:00",
      daysPerWeek: 3,
      startedAt: addDays(MON, -30, TZ),
      lastWorkoutAt: atTime(MON, "18:00", TZ),
      firstWorkoutAt: addDays(MON, -20, TZ),
      weekDays: 1,
      weekStart: MON,
      streakWeeks: 2,
      pro: { state: "pro" },
      ...p,
    });
    if (!c.ok) throw new Error(c.error);
    return c.body;
  };

  async function run(p: Record<string, unknown> = {}, roles: ("coach" | "gym")[] = []) {
    const store = memoryStore();
    const f = fakeMail();
    const joined = addDays(MON, -16, TZ);
    await subscribe(body(p), store, f.mail, env, joined, { accountId: "acct", email: "lifter@example.com" });
    const sub = await store.get(ID);
    if (sub?.status === "pending") await confirm(ID, /t=([0-9a-f]{64})/.exec(f.sent[0]!.text)![1]!, store, f.mail, env, joined);
    store.facts.set("acct", { roles, flags: { coachPlans: false } });
    await runDaily(store, f.mail, env, TUE + 3600_000);
    return f.sent.filter((m) => m.idempotencyKey.includes("weekly:"));
  }

  it("sends the first weekly tip on Tuesday once Getting started is behind them", async () => {
    const w = await run();
    expect(w).toHaveLength(1);
    expect(w[0]!.scheduledAt).toBe(atTime(TUE, "10:00", TZ));
    expect(w[0]!.html).toContain(`/email/en/w/${queue(new Set(), NO_FACTS)[0]!.id}.jpg`);
  });

  it("sends nothing to under-18s or with its switch off", async () => {
    expect(await run({ teen: true })).toHaveLength(0);
    expect(await run({ kinds: { tour: false, weekly: false } })).toHaveLength(0);
  });

  it("puts a role's email in its turn", async () => {
    const store = memoryStore();
    expect(store.facts.size).toBe(0);
    // New feature emails go first (tested above), so count them as already sent here.
    const sent = new Set(["weekly:gym-setup", "weekly:import", ...WEEKLY.filter((w) => w.fresh).map((w) => `weekly:${w.id}`)]);
    expect(queue(sent, { roles: ["coach"], flags: { coachPlans: false } })[0]!.id).toBe("coach-clients");
    expect((await run({}, ["gym"]))[0]!.html).toContain(
      `/w/${queue(new Set(), { roles: ["gym"], flags: { coachPlans: false } })[0]!.id}.jpg`,
    );
  });
});
