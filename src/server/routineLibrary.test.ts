import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { libraryIdOf, libraryIndexHtml, libraryPath, publicRoutine, routineHtml, routineSlug } from "./libraryPage";
import {
  browseLibrary,
  filterRoutines,
  forgetLibraryCache,
  libraryCleanup,
  libraryRoutine,
  myLibrary,
  noteSave,
  publishRoutine,
  queryFrom,
  rateRoutine,
  reportRoutine,
  resolveRoutine,
  routineReport,
  unpublishRoutine,
  type LibraryRoutine,
} from "./routineLibrary";
import { adminReports, resolveReports } from "./social";

const NOW = 1_800_000_000_000;
const YEAR = new Date(NOW).getFullYear();
const PUSH = "r1~UHVzaA~bench-press.4~overhead-press.3.s~dip.3~w:cat-cow";
const LEGS = "r1~TGVncw~back-squat.5~romanian-deadlift.3";

const profile = (who: string, name: string, birthYear?: number) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    who,
    JSON.stringify({ name, ...(birthYear ? { birthYear } : {}) }),
    NOW,
  ]);

const draft = (over: Record<string, unknown> = {}) => ({
  code: PUSH,
  title: "Push day for beginners",
  about: "Three presses, short rests.",
  goal: "muscle",
  level: "beginner",
  minutes: 40,
  equipment: ["barbell", "bench", "dip-station"],
  ...over,
});

const made = async (who = "ana", over: Record<string, unknown> = {}, at = NOW) => {
  const r = await publishRoutine(who, draft(over), at);
  if ("error" in r) throw new Error(r.error);
  return r;
};

beforeEach(async () => {
  await resetDb();
  forgetLibraryCache();
  await profile("ana", "Ana", YEAR - 30);
  await profile("ben", "Ben", YEAR - 25);
  await profile("cy", "Cy", YEAR - 40);
  await profile("dee", "Dee", YEAR - 35);
  await profile("kid", "Kid", YEAR - 15);
});

describe("publishing", () => {
  it("publishes a routine with its name, and publishing the same routine again changes it", async () => {
    const r = await made();
    expect(r).toMatchObject({ title: "Push day for beginners", goal: "muscle", level: "beginner", by: "Ana", saves: 0, mine: true });
    expect(r.equipment).toEqual(["barbell", "bench", "dip-station"]);
    expect(r.rating).toEqual({ average: null, count: 0 });
    const again = await made("ana", { title: "Push day" }, NOW + 1);
    expect(again.id).toBe(r.id);
    expect((await myLibrary("ana")).map((x) => x.title)).toEqual(["Push day"]);
  });

  it("hides the name when asked", async () => {
    expect((await made("ana", { showName: false })).by).toBe("");
  });

  it("refuses links, bad input, someone else's routine and lifters under 18", async () => {
    expect(await publishRoutine("ana", draft({ title: "Go to spam.example.com now" }), NOW)).toEqual({ error: "title" });
    expect(await publishRoutine("ana", draft({ about: "see www.spam.example" }), NOW)).toEqual({ error: "about" });
    expect(await publishRoutine("ana", draft({ goal: "fame" }), NOW)).toEqual({ error: "bad" });
    expect(await publishRoutine("ana", draft({ minutes: 2 }), NOW)).toEqual({ error: "bad" });
    expect(await publishRoutine("ana", draft({ code: "r1~eA" }), NOW)).toEqual({ error: "empty" });
    expect(await publishRoutine("ana", draft({ code: "<script>" }), NOW)).toEqual({ error: "bad" });
    expect(await publishRoutine("kid", draft(), NOW)).toEqual({ error: "teen" });
    const r = await made();
    expect(await publishRoutine("ben", draft({ id: r.id }), NOW)).toEqual({ error: "notYours" });
  });

  it("takes a routine out with its saves and ratings", async () => {
    const r = await made();
    await noteSave("ben", r.id, NOW);
    await rateRoutine("ben", r.id, 5, NOW);
    expect(await unpublishRoutine("ben", r.id)).toBe(false);
    expect(await unpublishRoutine("ana", r.id)).toBe(true);
    expect(await libraryRoutine(r.id, null)).toBeNull();
    expect(await query("SELECT * FROM library_ratings")).toEqual([]);
  });
});

describe("browsing", () => {
  it("finds routines by words, goal and what the gym has", async () => {
    await made();
    await made("ben", { code: LEGS, title: "Squat day", about: "", goal: "strength", equipment: ["barbell", "squat-rack"] });
    const all = await browseLibrary(null, {}, NOW);
    expect(all.map((r) => r.title).sort()).toEqual(["Push day for beginners", "Squat day"]);
    expect((await browseLibrary(null, { q: "SQUAT" }, NOW)).map((r) => r.title)).toEqual(["Squat day"]);
    expect((await browseLibrary(null, { goal: "muscle" }, NOW)).map((r) => r.title)).toEqual(["Push day for beginners"]);
    expect((await browseLibrary(null, { have: ["barbell", "squat-rack"] }, NOW)).map((r) => r.title)).toEqual(["Squat day"]);
    expect(await browseLibrary(null, { have: [] }, NOW)).toEqual([]);
  });

  it("finds words without their accents", () => {
    const r = { title: "Día de pierna", about: "", by: "", goal: "strength", level: "any", equipment: [] } as unknown as LibraryRoutine;
    expect(filterRoutines([r], { q: "dia" })).toHaveLength(1);
  });

  it("reads a query from the address", () => {
    expect(queryFrom(new URLSearchParams("q=legs&goal=strength&have=barbell,bench&sort=new"))).toEqual({
      q: "legs",
      goal: "strength",
      level: null,
      have: ["barbell", "bench"],
      sort: "new",
    });
    expect(queryFrom(new URLSearchParams("goal=nope")).goal).toBeNull();
  });
});

describe("saves and ratings", () => {
  it("counts a save once per lifter, never the publisher's own", async () => {
    const r = await made();
    await noteSave("ben", r.id, NOW);
    await noteSave("ben", r.id, NOW + 1);
    await noteSave("ana", r.id, NOW);
    forgetLibraryCache();
    expect((await libraryRoutine(r.id, "ben"))?.saves).toBe(1);
    expect((await libraryRoutine(r.id, "ben"))?.saved).toBe(true);
  });

  it("only takes stars from lifters who saved it, and shows them from three ratings", async () => {
    const r = await made();
    expect(await rateRoutine("ben", r.id, 5, NOW)).toEqual({ error: "notSaved" });
    expect(await rateRoutine("ana", r.id, 5, NOW)).toEqual({ error: "yours" });
    for (const who of ["ben", "cy", "dee"]) await noteSave(who, r.id, NOW);
    expect(await rateRoutine("ben", r.id, 5, NOW)).toEqual({ average: null, count: 1 });
    expect(await rateRoutine("ben", r.id, 6, NOW)).toEqual({ error: "bad" });
    await rateRoutine("cy", r.id, 4, NOW);
    expect(await rateRoutine("dee", r.id, 3, NOW)).toEqual({ average: 4, count: 3 });
    expect((await libraryRoutine(r.id, "cy"))?.myStars).toBe(4);
    // Changing your stars replaces them; 0 takes them back.
    expect(await rateRoutine("dee", r.id, 5, NOW)).toEqual({ average: 4.7, count: 3 });
    expect(await rateRoutine("dee", r.id, 0, NOW)).toEqual({ average: null, count: 2 });
  });

  it("takes a deleted account's stars off the routines they rated", async () => {
    const r = await made();
    for (const who of ["ben", "cy", "dee"]) {
      await noteSave(who, r.id, NOW);
      await rateRoutine(who, r.id, who === "ben" ? 1 : 5, NOW);
    }
    for (const x of libraryCleanup("ben")) await run(x.sql, x.args);
    const [row] = await query("SELECT star_sum, ratings FROM library_routines WHERE id = ?", [r.id]);
    expect([Number(row?.star_sum), Number(row?.ratings)]).toEqual([10, 2]);
  });
});

describe("reports", () => {
  it("hides a routine after three reports, and staff decide on the Reports tab", async () => {
    const r = await made();
    expect(await reportRoutine("ana", r.id, "spam", "", NOW)).toBe(false);
    expect(await reportRoutine("ben", r.id, "nope", "", NOW)).toBe(false);
    for (const who of ["ben", "cy", "dee"]) expect(await reportRoutine(who, r.id, "spam", "", NOW)).toBe(true);
    expect(await libraryRoutine(r.id, null)).toBeNull();
    expect(await libraryRoutine(r.id, "ana")).not.toBeNull();
    expect((await routineReport(r.id))?.hidden).toBe(true);
    const group = (await adminReports()).find((g) => g.kind === "routine");
    expect(group).toMatchObject({ targetId: r.id, reports: 3, hidden: true, author: { accountId: "ana", name: "Ana" } });
    expect(await resolveReports("routine", r.id, "dismiss")).toBe(true);
    expect(await libraryRoutine(r.id, null)).not.toBeNull();
    expect(await resolveRoutine(r.id, "remove")).toBe(true);
    expect(await libraryRoutine(r.id, "ana")).toBeNull();
  });
});

describe("public pages", () => {
  it("makes addresses from titles and reads the id back", () => {
    expect(routineSlug("Día de pierna: 5×5!")).toBe("dia-de-pierna-5-5");
    expect(routineSlug("脚の日")).toBe("routine");
    expect(libraryIdOf("push-day-AbC123xYz456")).toBe("AbC123xYz456");
    expect(libraryIdOf("push-day")).toBeNull();
  });

  it("draws a routine's page and the index, escaping what lifters typed", async () => {
    const r = await made("ana", { title: "Push <day>" });
    const found = await publicRoutine(r.id, NOW);
    expect(found).not.toBeNull();
    const html = routineHtml("en", found!.routine, found!.more);
    expect(html).toContain("Push &#60;day&#62;");
    expect(html).not.toContain("<day>");
    expect(html).toContain(`/app/#/library/${r.id}`);
    expect(html).toContain('"@type":"ExercisePlan"');
    expect(html).toContain("4 sets");
    expect(libraryPath(r)).toBe(`/routines/push-day-${r.id}/`);
    const index = libraryIndexHtml("es", [found!.routine]);
    expect(index).toContain("Biblioteca de rutinas");
    expect(libraryIndexHtml("en", [])).toContain('name="robots" content="noindex"');
  });
});
