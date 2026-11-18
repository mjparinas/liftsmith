import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { setFlag } from "./flags";
import { SINCE_KEY, type ImportResult } from "./gymImport";
import {
  createJob,
  dismissJob,
  emailDone,
  importAiOn,
  JOB_LIMITS,
  jobLog,
  jobStatus,
  kickWorker,
  RETRY_AFTER_MS,
  runWorker,
  startDaily,
  startWorld,
  stopJob,
  unfinishedPlaces,
} from "./gymImportJobs";

const ok = (where: string, added = 2): ImportResult => ({
  ok: true,
  id: `imp-${where}`,
  area: where,
  found: 3,
  added,
  updated: 1,
  unchanged: 0,
  kept: 0,
  skipped: { unnamed: 0, private: 0, notGym: 0, duplicate: 0 },
  server: "overpass-api.de",
  ms: 1000,
  log: ["+0.0s import"],
});
const busy = (where: string): ImportResult => ({
  ok: false,
  id: `busy-${where}`,
  error: "map",
  detail: "overpass-api.de: HTTP 504 (server busy)",
  ms: 1000,
  log: [],
});
const nowhere: ImportResult = { ok: false, id: "x", error: "where", detail: "Nominatim found no place by that name.", ms: 10, log: [] };

const quick = { sleep: async () => undefined, staggerMs: 0, mail: null };
/** The steps after the map, doing nothing, for tests about the map step. */
const noSteps = {
  enrich: async () => ({ done: [], complete: 0, more: false }),
  autoFill: async () => ({ done: [], more: false, stopped: "" }),
  tidy: async () => ({ checked: 0, next: "", cities: 0, addresses: 0, moved: 0, unsure: 0, changes: [] }),
};
const later = () => Date.now() + JOB_LIMITS.runMs;

beforeEach(async () => {
  await resetDb();
});

describe("gym imports on the server", () => {
  it("imports every city of a job, three lanes on different map servers, each told when the worker's time ends", async () => {
    const made = await createJob({
      label: "Canada",
      places: ["Langley, BC", "Surrey, BC", "Delta, BC"],
      startedBy: "a@x.com",
      notify: true,
    });
    expect("id" in made).toBe(true);
    const servers: number[] = [];
    const until: number[] = [];
    const deadline = later();
    const r = await runWorker({
      ...quick,
      deadline,
      importer: async (where, _f, _n, o) => {
        servers.push(o?.server ?? -1);
        until.push(o?.until ?? 0);
        return ok(where);
      },
    });
    expect(r).toMatchObject({ imported: 3, more: false, finished: true });
    expect(new Set(servers)).toEqual(new Set([0, 1, 2]));
    // Stops asking the map in time to save and hand over, instead of the worker idling its last minutes.
    expect(until).toEqual([1, 2, 3].map(() => deadline - JOB_LIMITS.saveMs));
    const s = (await jobStatus())!;
    expect(s).toMatchObject({ state: "done", done: 3, total: 3, failed: [], active: [] });
    expect(s.sums).toMatchObject({ found: 9, added: 6, updated: 3 });
    expect(s.recent.map((x) => x.where).sort()).toEqual(["Delta, BC", "Langley, BC", "Surrey, BC"]);
  });

  it("runs one job at a time and one worker per job", async () => {
    const first = await createJob({ label: "A", places: ["A, X"], startedBy: "", notify: false });
    expect(await createJob({ label: "B", places: ["B, X"], startedBy: "", notify: false })).toEqual({
      error: "running",
      id: (first as { id: string }).id,
    });
    let release!: () => void;
    const gate = new Promise<void>((ok) => (release = ok));
    const one = runWorker({ ...quick, importer: async (w) => (await gate, ok(w)) });
    // Wait until the first worker holds the lease, then a second finds nothing to do.
    for (let i = 0; i < 50 && !(await jobStatus())?.active.length; i++) await new Promise((ok) => setTimeout(ok, 5));
    expect(await runWorker({ ...quick, importer: async (w) => ok(w) })).toMatchObject({ job: null, imported: 0 });
    release();
    expect(await one).toMatchObject({ imported: 1, finished: true });
  });

  it("puts a busy city back in line after 3 and then 10 minutes before it counts as failed", async () => {
    await createJob({ label: "Canada", places: ["Surrey, BC"], startedBy: "", notify: false });
    const importer = async (w: string) => busy(w);
    // First try: waiting, and this worker doesn't hang about for three minutes it doesn't have.
    let r = await runWorker({ ...quick, importer, deadline: Date.now() + JOB_LIMITS.cityMs + 60_000 });
    expect(r).toMatchObject({ imported: 1, more: false, finished: false });
    let s = (await jobStatus())!;
    expect(s).toMatchObject({ state: "running", waiting: 1, done: 0 });
    const [row] = await query<{ not_before: number }>("SELECT not_before FROM gym_import_items");
    expect(Number(row!.not_before) - Date.now()).toBeGreaterThan(RETRY_AFTER_MS[0]! - 5_000);
    // Its pause is over: tried again, then again after 10 minutes, then failed.
    for (let i = 0; i < RETRY_AFTER_MS.length; i++) {
      await run("UPDATE gym_import_items SET not_before = 0");
      r = await runWorker({ ...quick, importer, deadline: Date.now() + JOB_LIMITS.cityMs + 60_000 });
    }
    expect(r.finished).toBe(true);
    s = (await jobStatus())!;
    expect(s.failed).toHaveLength(1);
    expect(s.failed[0]!.r).toMatchObject({ ok: false, detail: "overpass-api.de: HTTP 504 (server busy)" });
    const log = (await jobLog(s.id))!;
    expect(log.items[0]!.tries).toBe(1 + RETRY_AFTER_MS.length);
    expect(log.items[0]!.triedAgain).toHaveLength(RETRY_AFTER_MS.length);
  });

  it("waits inside the worker for a city whose pause ends in its time", async () => {
    await createJob({ label: "Canada", places: ["Surrey, BC"], startedBy: "", notify: false });
    let tries = 0;
    const slept: number[] = [];
    const r = await runWorker({
      mail: null,
      staggerMs: 0,
      sleep: async (ms) => {
        slept.push(ms);
        await run("UPDATE gym_import_items SET not_before = 0");
      },
      importer: async (w) => (++tries === 1 ? busy(w) : ok(w)),
      deadline: later() + RETRY_AFTER_MS[0]!,
    });
    expect(r).toMatchObject({ imported: 2, finished: true });
    expect(slept.length).toBeGreaterThan(0);
  });

  it("doesn't retry a place the map doesn't know", async () => {
    await createJob({ label: "Canada", places: ["Nowhere, ZZ"], startedBy: "", notify: false });
    const r = await runWorker({ ...quick, importer: async () => nowhere });
    expect(r.finished).toBe(true);
    expect((await jobStatus())!.failed[0]!.r).toMatchObject({ ok: false, error: "That place wasn't found on the map." });
  });

  it("hands over when its time is up, and the next worker carries on", async () => {
    await createJob({ label: "Canada", places: ["A, X", "B, X", "C, X", "D, X"], startedBy: "", notify: false });
    // Time for exactly one city per lane... and a clock that runs out after the first three.
    let calls = 0;
    const deadline = Date.now() + JOB_LIMITS.cityMs + 1_000;
    const first = await runWorker({
      ...quick,
      deadline,
      importer: async (w) => {
        calls++;
        // Each city "takes" the time left.
        await new Promise((ok) => setTimeout(ok, 1_100));
        return ok(w);
      },
    });
    expect(first).toMatchObject({ imported: 3, more: true, finished: false });
    expect(calls).toBe(3);
    const second = await runWorker({ ...quick, importer: async (w) => ok(w) });
    expect(second).toMatchObject({ imported: 1, finished: true });
  });

  it("picks up a city a crashed worker left half done", async () => {
    await createJob({ label: "Canada", places: ["A, X"], startedBy: "", notify: false });
    // A worker took the city and died: its lease ran out with the city still marked running.
    await run("UPDATE gym_import_items SET state = 'running', tries = 1");
    await run("UPDATE gym_import_jobs SET lease_until = ?", [Date.now() - 1]);
    const r = await runWorker({ ...quick, importer: async (w) => ok(w) });
    expect(r).toMatchObject({ imported: 1, finished: true });
    expect((await jobLog((await jobStatus())!.id))!.items[0]!.tries).toBe(1);
  });

  it("stops: nothing new starts, and Retry gets the cities it didn't reach", async () => {
    const places = ["A, X", "B, X", "C, X", "D, X", "E, X"];
    const made = (await createJob({ label: "Canada", places, startedBy: "", notify: false })) as { id: string };
    let n = 0;
    await runWorker({
      ...quick,
      importer: async (w) => {
        if (++n === 1) await stopJob(made.id);
        return w === "B, X" ? nowhere : ok(w);
      },
    });
    const s = (await jobStatus())!;
    expect(s.state).toBe("stopped");
    expect(s.done).toBeLessThan(places.length);
    const left = await unfinishedPlaces(made.id);
    expect(left.length).toBe(places.length - s.recent.filter((x) => x.r.ok).length);
    expect(await dismissJob(made.id)).toBe(true);
    expect(await jobStatus()).toBeNull();
    // A new job of those cities can start now.
    expect("id" in (await createJob({ label: "retry", places: left, startedBy: "", notify: false }))).toBe(true);
  });

  it("emails the admin who started it once, with the failed cities", async () => {
    await createJob({ label: "Canada", places: ["A, X", "Nowhere, ZZ"], startedBy: "a@x.com", notify: true });
    const sent: { to: string; subject: string; text: string }[] = [];
    const mail = async (to: string, subject: string, text: string) => (sent.push({ to, subject, text }), true);
    await runWorker({ ...quick, mail, importer: async (w) => (w.startsWith("Nowhere") ? nowhere : ok(w)) });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "a@x.com", subject: "Gym import done: Canada, 2 new gyms, 1 areas failed" });
    expect(sent[0]!.text).toContain("Nowhere, ZZ: That place wasn't found on the map.");
    expect(sent[0]!.text).toContain("Websites: 0 read");
    expect(sent[0]!.text).toContain("/admin/?tab=Gyms");
    expect(await emailDone((await jobStatus())!.id, mail)).toBe(false);
  });

  it("sends no email when the admin turned it off", async () => {
    await createJob({ label: "Canada", places: ["A, X"], startedBy: "a@x.com", notify: false });
    const sent: string[] = [];
    await runWorker({ ...quick, mail: async (to) => (sent.push(to), true), importer: async (w) => ok(w) });
    expect(sent).toEqual([]);
  });

  it("adds a country's regions to the job as it splits", async () => {
    await startWorld("a@x.com", false);
    const s0 = (await jobStatus())!;
    expect(s0).toMatchObject({ kind: "world", phase: "map", label: "every gym in the world" });
    expect(s0.total).toBeGreaterThan(200);
    await run("DELETE FROM gym_import_items WHERE place <> 'country:CA'");
    await run("UPDATE gym_import_jobs SET total = 1");
    const seen: string[] = [];
    const r = await runWorker({
      ...quick,
      ...noSteps,
      importer: async (w) => {
        seen.push(w);
        return w === "country:CA" ? { ...ok(w, 0), found: 0, updated: 0, split: ["region:CA:1:BC", "region:CA:2:AB"] } : ok(w);
      },
    });
    expect(r.finished).toBe(true);
    expect(seen.sort()).toEqual(["country:CA", "region:CA:1:BC", "region:CA:2:AB"]);
    expect((await jobStatus())!).toMatchObject({ total: 3, done: 3, phase: "done", sums: { added: 4 } });
  });

  it("goes on to the websites, then AI, then tidying, and counts what each did", async () => {
    await createJob({ label: "Canada", places: ["region:CA:1:BC"], startedBy: "", notify: false });
    let webCalls = 0;
    const order: string[] = [];
    const r = await runWorker({
      ...quick,
      importer: async (w) => (order.push("map"), ok(w)),
      enrich: async () => {
        order.push("web");
        webCalls++;
        return {
          done: [{ id: "g", name: "G", site: "https://g.example", filled: webCalls === 1 ? ["phone" as const] : [], skipped: "", ms: 1 }],
          complete: 2,
          more: webCalls < 2,
        };
      },
      autoFill: async () => (
        order.push("ai"),
        { done: [{ id: "g", name: "G", filled: ["hours" as const], skipped: "" }], more: false, stopped: "" }
      ),
      tidy: async (after) => (
        order.push(`tidy:${after}`),
        { checked: 1000, next: after ? "" : "zz", cities: 2, addresses: 1, moved: 1, unsure: 0, changes: [] }
      ),
    });
    expect(r.finished).toBe(true);
    expect(order).toEqual(["map", "web", "web", "ai", "tidy:", "tidy:zz"]);
    expect((await jobStatus())!).toMatchObject({
      phase: "done",
      web: { read: 6, filled: 1 },
      ai: { read: 1, filled: 1 },
      tidy: { fixed: 6 },
    });
  });

  it("stops the AI step at the day's cap, says so, and the daily job skips tidying", async () => {
    await run("INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, 0)", [SINCE_KEY, "12345"]);
    expect(await startDaily()).toMatchObject({ id: expect.any(String) });
    expect(await unfinishedPlaces((await jobStatus())!.id)).toEqual(["new:12345"]);
    let tidied = false;
    await runWorker({
      ...quick,
      importer: async (w) => ok(w),
      enrich: noSteps.enrich,
      autoFill: async () => ({ done: [], more: true, stopped: "Today's AI spend reached its $2 cap." }),
      tidy: async () => ((tidied = true), noSteps.tidy()),
    });
    const s = (await jobStatus())!;
    expect(s).toMatchObject({ kind: "daily", state: "done" });
    expect(s.note).toMatch(/reached its \$2 cap\. The next daily run carries on/);
    expect(tidied).toBe(false);
    // A schedule that arrives twice starts nothing the second time.
    expect(await startDaily()).toEqual({ skipped: "already ran today" });
  });

  it("skips the AI step when it's switched off, and says so", async () => {
    await createJob({ label: "A", places: ["region:CA:1:BC"], startedBy: "", notify: false });
    let asked = false;
    await runWorker({
      ...quick,
      importer: async (w) => ok(w),
      ...noSteps,
      autoFill: async () => ((asked = true), noSteps.autoFill()),
    });
    // The flag is read from the database: off in Admin › Gyms.
    expect(asked).toBe(true);
    expect(await importAiOn()).toBe(true);
    await setFlag("gymImportAi", false, 100, "a@x.com");
    expect(await importAiOn()).toBe(false);
    await run("DELETE FROM gym_import_jobs");
    await run("DELETE FROM gym_import_items");
    asked = false;
    await createJob({ label: "B", places: ["region:CA:1:BC"], startedBy: "", notify: false });
    await runWorker({
      ...quick,
      importer: async (w) => ok(w),
      ...noSteps,
      autoFill: async () => ((asked = true), noSteps.autoFill()),
    });
    expect(asked).toBe(false);
    expect((await jobStatus())!).toMatchObject({ state: "done", note: expect.stringMatching(/AI step skipped: it's switched off/) });
  });

  it("starts no daily job while another import runs", async () => {
    await createJob({ label: "A", places: ["region:CA:1:BC"], startedBy: "", notify: false });
    expect(await startDaily()).toEqual({ skipped: "another import is running" });
  });

  it("starts the next worker with the cron secret, on the public site rather than a vercel.app address", async () => {
    const calls: { url: string; auth: string | null }[] = [];
    const send = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), auth: new Headers(init?.headers).get("authorization") });
      return Response.json({ started: true });
    }) as typeof fetch;
    expect(await kickWorker("https://liftsmith-three.vercel.app", send, { CRON_SECRET: "s" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(calls[0]).toEqual({ url: "https://www.getliftsmith.com/api/cron/gym-imports/", auth: "Bearer s" });
    expect(await kickWorker("http://localhost:3000", send, {} as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});
