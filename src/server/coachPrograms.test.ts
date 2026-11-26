import { beforeEach, describe, expect, it } from "vitest";

import { onboardUrl, refreshAccount, type ConnectEvent, type PayConfig } from "./coachPay";
import { acceptProgramAssign, assignProgram, assignsForClient, tweakAssignDay } from "./coachProgramAssign";
import {
  browsePrograms,
  countCode,
  deleteProgram,
  dropProgram,
  forgetPrograms,
  getFree,
  myPrograms,
  ownedPrograms,
  programCheckout,
  programFor,
  saveProgram,
  storeProgramEvent,
} from "./coachPrograms";
import { query, resetDb, run } from "./db";
import { setFlag } from "./flags";
import { saveToken, setPushSender, type PushMessage } from "./push";

const NOW = 1_800_000_000_000;
const YEAR = new Date(NOW).getFullYear();
const CFG: PayConfig = { secret: "sk_test_x", webhook: "whsec_test" };
const PUSH = "push-day.3";
const DAY_A = `r1~Push~bench-press.4~overhead-press.3.s~dip.3~w:cat-cow`;
const DAY_B = `r1~Legs~back-squat.5~romanian-deadlift.3`;

const calls: { url: string; body: string; account?: string }[] = [];
const fake = async (url: string, init: RequestInit) => {
  const h = (init.headers ?? {}) as Record<string, string>;
  calls.push({ url, body: String(init.body ?? ""), account: h["Stripe-Account"] });
  const json = (x: unknown) => new Response(JSON.stringify(x), { status: 200 });
  if (url.endsWith("/accounts")) return json({ id: "acct_1", charges_enabled: true, default_currency: "cad" });
  if (url.endsWith("/account_links")) return json({ url: "https://connect.stripe.com/setup/x" });
  if (url.includes("/accounts/acct_1")) return json({ id: "acct_1", charges_enabled: true, default_currency: "cad" });
  if (url.endsWith("/checkout/sessions")) return json({ url: "https://checkout.stripe.com/c/p" });
  return json({});
};

const profile = (who: string, name: string, birthYear?: number) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    who,
    JSON.stringify({ name, ...(birthYear ? { birthYear } : {}) }),
    NOW,
  ]);

const program = (over: Record<string, unknown> = {}) => ({
  title: "Eight weeks to a bigger bench",
  about: "Three days a week, built around the bench.",
  level: "intermediate",
  goal: "strength",
  weeks: 8,
  days: [
    { name: "Push", code: DAY_A },
    { name: "Legs", code: DAY_B },
  ],
  price: 0,
  ...over,
});

const ready = async () => {
  await onboardUrl(CFG, "coach", null, NOW, fake);
  await refreshAccount(CFG, "coach", NOW, fake);
};

const sent: PushMessage[] = [];
beforeEach(async () => {
  await resetDb();
  calls.length = 0;
  sent.length = 0;
  setPushSender(async (m) => {
    sent.push(m);
    return "ok";
  });
  await profile("coach", "Sam", YEAR - 30);
  await profile("buyer", "Ana", YEAR - 25);
  await profile("teen", "Kid", YEAR - 15);
  await saveToken("coach", "tok-coach-0123456789abcdef", "android", "en", NOW);
});

const made = async (over: Record<string, unknown> = {}) => {
  const p = await saveProgram("coach", program(over), NOW);
  if ("error" in p) throw new Error(p.error);
  return p;
};

describe("making a program", () => {
  it("counts exercises and sets from a routine code, leaving part marks out", () => {
    expect(countCode(DAY_A)).toEqual({ exercises: 3, sets: 10 });
    expect(countCode(`r1~${PUSH}`)).toEqual({ exercises: 0, sets: 0 });
  });

  it("saves a free program with its days, and the coach can change it", async () => {
    const p = await made();
    expect(p).toMatchObject({ coachName: "Sam", price: 0, weeks: 8, listed: true, owned: true, sales: 0 });
    expect(p.days).toEqual([
      { name: "Push", code: DAY_A, exercises: 3, sets: 10 },
      { name: "Legs", code: DAY_B, exercises: 2, sets: 8 },
    ]);
    const again = await saveProgram("coach", program({ id: p.id, title: "Bench block" }), NOW + 1);
    expect(again).toMatchObject({ id: p.id, title: "Bench block" });
    expect(await saveProgram("buyer", program({ id: p.id }), NOW)).toEqual({ error: "notYours" });
  });

  it("keeps phases, makes the weeks theirs, and an assign takes a copy", async () => {
    const phases = [
      { kind: "build", weeks: 5, weekdays: [[1, 4], [2]] },
      { kind: "deload", weeks: 1, weekdays: [[1], [3]] },
    ];
    const p = await made({
      weeks: 2,
      phases,
      days: [
        { name: "Push", code: DAY_A, weekdays: [1, 4] },
        { name: "Legs", code: DAY_B, weekdays: [2] },
      ],
    });
    expect(p.weeks).toBe(6);
    expect(p.phases).toEqual(phases);
    expect((await programFor(p.id, "buyer"))!.phases).toEqual(phases);
    // Phases that don't fit the days are refused rather than dropped.
    expect(await saveProgram("coach", program({ phases: [phases[0], { kind: "taper", weeks: 1, weekdays: [[1], []] }] }), NOW)).toEqual({
      error: "bad",
    });
    await run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES ('coach', 'buyer', ?)", [NOW]);
    const r = await assignProgram("coach", p.id, { type: "clients", ids: ["buyer"] }, [[0], [6]], NOW);
    if ("error" in r) throw new Error(r.error);
    // The program's own weekdays win over the assign's: each phase has its own.
    expect(r.assigned[0]).toMatchObject({ weeks: 6, phases, days: [{ weekdays: [1, 4] }, { weekdays: [2] }] });
  });

  it("refuses bad input, links, and coaches under 18", async () => {
    expect(await saveProgram("coach", program({ days: [] }), NOW)).toEqual({ error: "bad" });
    expect(await saveProgram("coach", program({ weeks: 30 }), NOW)).toEqual({ error: "bad" });
    expect(await saveProgram("coach", program({ days: [{ name: "Push", code: "nope" }] }), NOW)).toEqual({ error: "bad" });
    expect(await saveProgram("coach", program({ title: "" }), NOW)).toEqual({ error: "title" });
    expect(await saveProgram("coach", program({ about: "see www.example.com" }), NOW)).toEqual({ error: "about" });
    expect(await saveProgram("teen", program(), NOW)).toEqual({ error: "teen" });
  });

  it("a price needs the coach's Stripe account ready", async () => {
    expect(await saveProgram("coach", program({ price: 30 }), NOW)).toEqual({ error: "noAccount" });
    await ready();
    expect(await saveProgram("coach", program({ price: 1000 }), NOW)).toEqual({ error: "bad" });
    expect(await made({ price: 29.99 })).toMatchObject({ price: 29.99, currency: "cad" });
  });
});

describe("one client's own copy", () => {
  const DAY_C = `r1~Legs~leg-press.4~romanian-deadlift.3`;
  const start = async () => {
    const p = await made({
      days: [
        { name: "Push", code: DAY_A, weekdays: [1] },
        { name: "Legs", code: DAY_B, weekdays: [3] },
      ],
    });
    await run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES ('coach', 'buyer', ?)", [NOW]);
    await run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES ('coach', 'teen', ?)", [NOW]);
    const r = await assignProgram("coach", p.id, { type: "clients", ids: ["buyer", "teen"] }, undefined, NOW);
    if ("error" in r) throw new Error(r.error);
    return { p, ana: r.assigned[0]!, kid: r.assigned[1]! };
  };

  it("changes a day for one client, keeps it through program edits, and puts it back", async () => {
    const { p, ana } = await start();
    await acceptProgramAssign("buyer", ana.id, NOW);
    const t = await tweakAssignDay("coach", ana.id, 1, DAY_C, "Legs (knee)", NOW + 10);
    if ("error" in t) throw new Error(t.error);
    expect(t).toMatchObject({ tweaked: [1], updatedAt: NOW + 10, days: [{ code: DAY_A }, { name: "Legs (knee)", code: DAY_C }] });
    // Only the coach who assigned it, a real day and a real routine.
    expect(await tweakAssignDay("buyer", ana.id, 1, DAY_C, "x", NOW)).toEqual({ error: "gone" });
    expect(await tweakAssignDay("coach", ana.id, 5, DAY_C, "x", NOW)).toEqual({ error: "bad" });
    expect(await tweakAssignDay("coach", ana.id, 0, `r1~${PUSH}`, "x", NOW)).toEqual({ error: "bad" });

    // The coach edits the program: the change reaches both clients, Ana's own day stays hers.
    const DAY_A2 = `r1~Push~bench-press.5~overhead-press.3`;
    await saveProgram(
      "coach",
      program({
        id: p.id,
        title: "Bench block",
        days: [
          { name: "Push", code: DAY_A2, weekdays: [1] },
          { name: "Legs", code: DAY_B, weekdays: [4] },
        ],
      }),
      NOW + 20,
    );
    const [mine] = await assignsForClient("buyer");
    expect(mine).toMatchObject({
      title: "Bench block",
      tweaked: [1],
      updatedAt: NOW + 20,
      days: [
        { code: DAY_A2, weekdays: [1] },
        { code: DAY_C, weekdays: [4] },
      ],
    });
    const [theirs] = await assignsForClient("teen");
    expect(theirs?.days.map((d) => d.code)).toEqual([DAY_A2, DAY_B]);
    expect(theirs?.tweaked).toBeUndefined();

    const back = await tweakAssignDay("coach", ana.id, 1, null, undefined, NOW + 30);
    if ("error" in back) throw new Error(back.error);
    expect(back.tweaked).toBeUndefined();
    expect(back.days[1]?.code).toBe(DAY_B);
  });

  it("keeps weekdays picked for the assign, and drops a change on a day that's gone", async () => {
    const p = await made({
      days: [
        { name: "Push", code: DAY_A, weekdays: [1] },
        { name: "Legs", code: DAY_B, weekdays: [3] },
      ],
    });
    await run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES ('coach', 'buyer', ?)", [NOW]);
    const r = await assignProgram("coach", p.id, { type: "clients", ids: ["buyer"] }, [[2], [5]], NOW);
    if ("error" in r) throw new Error(r.error);
    const a = r.assigned[0]!;
    await tweakAssignDay("coach", a.id, 1, DAY_C, "Legs", NOW + 1);
    await saveProgram(
      "coach",
      program({
        id: p.id,
        title: "Renamed",
        days: [
          { name: "Push", code: DAY_A, weekdays: [1] },
          { name: "Legs", code: DAY_B, weekdays: [3] },
        ],
      }),
      NOW + 2,
    );
    expect((await assignsForClient("buyer"))[0]?.days.map((d) => d.weekdays)).toEqual([[2], [5]]);
    await saveProgram("coach", program({ id: p.id, days: [{ name: "Push", code: DAY_A, weekdays: [1] }] }), NOW + 3);
    const [one] = await assignsForClient("buyer");
    expect(one?.days).toEqual([{ name: "Push", code: DAY_A, weekdays: [1] }]);
    expect(one?.tweaked).toBeUndefined();
  });
});

describe("seeing programs", () => {
  it("a paid program's days stay hidden until it's bought; a free one's show", async () => {
    await ready();
    const paid = await made({ price: 30 });
    const free = await made({ title: "Free starter" });
    const seen = await programFor(paid.id, "buyer");
    expect(seen?.days[0]).toEqual({ name: "Push", exercises: 3, sets: 10 });
    expect(seen?.owned).toBe(false);
    expect(seen?.sales).toBeUndefined();
    expect((await programFor(free.id, null))?.days[0]?.code).toBe(DAY_A);
  });

  it("the phone apps' list has free programs only, and teens' programs never show", async () => {
    await ready();
    await made({ price: 30 });
    await made({ title: "Free starter" });
    await run("UPDATE sync_records SET body = ? WHERE account_id = 'coach'", [JSON.stringify({ name: "Sam", birthYear: YEAR - 16 })]);
    expect(await browsePrograms(null, {}, NOW)).toEqual([]);
    await run("UPDATE sync_records SET body = ? WHERE account_id = 'coach'", [JSON.stringify({ name: "Sam", birthYear: YEAR - 30 })]);
    expect((await browsePrograms(null, {}, NOW)).map((p) => p.price).sort()).toEqual([0, 30]);
    expect((await browsePrograms(null, { freeOnly: true }, NOW)).map((p) => p.title)).toEqual(["Free starter"]);
  });

  it("an unlisted program is gone for strangers but stays for its coach", async () => {
    const p = await made({ listed: false });
    expect(await programFor(p.id, "buyer")).toBeNull();
    expect(await programFor(p.id, "coach")).not.toBeNull();
  });
});

describe("getting and buying", () => {
  it("a free program is one tap, and can be dropped", async () => {
    const p = await made();
    expect(await getFree("buyer", p.id, NOW)).toMatchObject({ owned: true });
    expect((await ownedPrograms("buyer")).map((x) => x.id)).toEqual([p.id]);
    await dropProgram("buyer", p.id);
    expect(await ownedPrograms("buyer")).toEqual([]);
  });

  it("checkout runs on the coach's account with the program and buyer in the metadata", async () => {
    await ready();
    const p = await made({ price: 29.99 });
    expect(await getFree("buyer", p.id, NOW)).toEqual({ error: "notFree" });
    expect(await programCheckout(CFG, "buyer", p.id, NOW, fake)).toBe("https://checkout.stripe.com/c/p");
    const c = calls.find((x) => x.url.endsWith("/checkout/sessions"))!;
    expect(c.account).toBe("acct_1");
    const q = new URLSearchParams(c.body);
    expect(q.get("mode")).toBe("payment");
    expect(q.get("line_items[0][price_data][unit_amount]")).toBe("2999");
    expect(q.get("metadata[kind]")).toBe("program");
    expect(q.get("metadata[buyer]")).toBe("buyer");
    expect(q.get("payment_intent_data[application_fee_amount]")).toBeNull();
    expect(await programCheckout(CFG, "teen", p.id, NOW, fake)).toEqual({ error: "teen" });
    expect(await programCheckout(CFG, "coach", p.id, NOW, fake)).toEqual({ error: "yours" });
  });

  it("keeps 2% from a coach on plain Pro once coach plans are on", async () => {
    await setFlag("coachPlans", true, 100, "test", NOW);
    await ready();
    const p = await made({ price: 50 });
    await programCheckout(CFG, "buyer", p.id, NOW, fake);
    const q = new URLSearchParams(calls.find((x) => x.url.endsWith("/checkout/sessions"))!.body);
    expect(q.get("payment_intent_data[application_fee_amount]")).toBe("100");
  });

  const paidEvent = (program: string, account = "acct_1", id = "evt_1"): ConnectEvent => ({
    id,
    type: "checkout.session.completed",
    account,
    data: {
      object: {
        id: "cs_1",
        payment_status: "paid",
        payment_intent: "pi_1",
        metadata: { kind: "program", program, buyer: "buyer", coach: "coach" },
      },
    },
  });

  it("a paid checkout gives the buyer the program once, and tells the coach once", async () => {
    await ready();
    const p = await made({ price: 30 });
    expect(await storeProgramEvent(paidEvent(p.id), NOW)).toBe(true);
    expect(await storeProgramEvent(paidEvent(p.id, "acct_1", "evt_again"), NOW)).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.body).toContain("Ana bought your program");
    const owned = await ownedPrograms("buyer");
    expect(owned[0]?.days[0]?.code).toBe(DAY_A);
    expect((await myPrograms("coach"))[0]?.sales).toBe(1);
    // A bought program stays when the buyer tries to drop it, and when the coach deletes it.
    await dropProgram("buyer", p.id);
    expect(await ownedPrograms("buyer")).toHaveLength(1);
    expect(await deleteProgram("coach", p.id, NOW)).toBe("unlisted");
    expect(await programFor(p.id, "buyer")).not.toBeNull();
    expect(await programFor(p.id, "stranger")).toBeNull();
  });

  it("ignores a checkout from another coach's account, and a refund takes the program back", async () => {
    await ready();
    const p = await made({ price: 30 });
    await storeProgramEvent(paidEvent(p.id, "acct_other"), NOW);
    expect(await ownedPrograms("buyer")).toEqual([]);
    await storeProgramEvent(paidEvent(p.id), NOW);
    const refund: ConnectEvent = {
      id: "evt_r",
      type: "charge.refunded",
      account: "acct_1",
      data: { object: { refunded: true, payment_intent: "pi_1" } },
    };
    expect(await storeProgramEvent(refund, NOW)).toBe(true);
    expect(await ownedPrograms("buyer")).toEqual([]);
  });

  it("client payment events aren't the program side's", async () => {
    const e: ConnectEvent = {
      id: "e",
      type: "checkout.session.completed",
      account: "acct_1",
      data: { object: { metadata: { coach: "coach" } } },
    };
    expect(await storeProgramEvent(e, NOW)).toBe(false);
  });

  it("deleting the coach's account removes their programs and who had them", async () => {
    const p = await made();
    await getFree("buyer", p.id, NOW);
    await forgetPrograms("coach");
    expect(await query("SELECT * FROM coach_programs")).toEqual([]);
    expect(await query("SELECT * FROM program_owners")).toEqual([]);
  });
});
