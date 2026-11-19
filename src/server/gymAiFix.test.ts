import type Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it } from "vitest";

import { AiError } from "./ai";
import { query, resetDb, run } from "./db";
import {
  FIX_REPORTER,
  fixBatch,
  fixesFor,
  fixStatus,
  nextPacificDay,
  pauseFor,
  runFixWorker,
  startFix,
  stopFix,
  undoFix,
  type FixBatch,
} from "./gymAiFix";
import { placesFromOsm, savePlaces } from "./gymPlaces";

// The AI fix-up pass (docs/decisions/gyms.md "AI fix-up pass"): unclaimed gyms with a website, each once ever, checked
// answers only, paused at the day's AI cap.
const NOW = 1_800_000_000_000;
const AREA = { city: "Langley", region: "BC", country: "CA" };

function fakeClient(reply: unknown, opts: { error?: Error } = {}) {
  const calls: Record<string, unknown>[] = [];
  const client = {
    beta: {
      messages: {
        create: (params: Record<string, unknown>) => {
          calls.push(params);
          if (opts.error) return Promise.reject(opts.error);
          return Promise.resolve({
            stop_reason: "end_turn",
            content: [{ type: "text", text: JSON.stringify(reply) }],
            usage: { input_tokens: 1_000, output_tokens: 100, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
          });
        },
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

const page = (async () =>
  new Response("<html><body><h1>Iron Works</h1><p>Open early, close late. Find us downtown, call us any time.</p></body></html>", {
    headers: { "content-type": "text/html" },
  })) as unknown as typeof fetch;

const ANSWER = {
  address: "100 Main Street",
  city: "Langley",
  postcode: "V2Y 1A1",
  phone: "+1 604-555-0199",
  hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
  email: "hello@ironworks.example.com",
  instagram: "@ironworksgym",
  facebook: "",
  closed: false,
  notGym: false,
  note: "",
};

async function gyms(n = 1, tags: Record<string, string> = {}) {
  await savePlaces(
    placesFromOsm(
      Array.from({ length: n }, (_, i) => ({
        type: "node" as const,
        id: 10 + i,
        lat: 49.1 + i / 100,
        lon: -122.6,
        tags: {
          leisure: "fitness_centre",
          name: `Iron Works ${i + 1}`,
          website: "https://ironworks.example.com/",
          "addr:street": "Old Road",
          "addr:housenumber": "5",
          phone: "604-555-0000",
          ...tags,
        },
      })),
      AREA,
    ),
    NOW,
  );
}

const BASE = {
  id: "g",
  name: "Iron Works",
  website: "https://ironworks.example.com/",
  address: "5 Old Road",
  city: "Langley",
  region: "BC",
  country: "CA",
  postcode: "",
  phone: "604-555-0000",
  hours: "",
  email: "",
  instagram: "",
  facebook: "",
};

beforeEach(async () => {
  await resetDb();
});

describe("what the fix-up changes", () => {
  it("fills empty fields and corrects filled ones the page clearly states differently", () => {
    expect(fixesFor(BASE, ANSWER)).toEqual([
      { field: "address", before: "5 Old Road", after: "100 Main Street" },
      { field: "postcode", before: "", after: "V2Y 1A1" },
      { field: "phone", before: "604-555-0000", after: "+1 604-555-0199" },
      { field: "hours", before: "", after: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00" },
      { field: "email", before: "", after: "hello@ironworks.example.com" },
      { field: "instagram", before: "", after: "https://www.instagram.com/ironworksgym" },
    ]);
  });

  it("leaves what's the same, and never moves a street, city or postcode on a page about somewhere else", () => {
    const g = { ...BASE, postcode: "V3A 4B5", phone: "(604) 555 0000", hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00" };
    expect(fixesFor(g, { ...ANSWER, city: "Vancouver", phone: "+1 604 555 0000", email: "", instagram: "" })).toEqual([]);
  });

  it("fixes a city that's a postcode, and refuses answers that fail the checks", () => {
    const g = { ...BASE, city: "80145", country: "IT", region: "Campania", address: "" };
    expect(fixesFor(g, { ...ANSWER, city: "Napoli", address: "Call us", phone: "call us", email: "a@designer.example.org" })).toEqual([
      { field: "city", before: "80145", after: "Napoli" },
      { field: "hours", before: "", after: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00" },
      { field: "instagram", before: "", after: "https://www.instagram.com/ironworksgym" },
    ]);
  });
});

describe("the fix-up batch", () => {
  it("changes a gym once, ever, keeps each change for Undo and never touches a claimed gym", async () => {
    await gyms(2);
    await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE name = 'Iron Works 2'");
    const { id } = (await startFix("admin@example.com", NOW)) as { id: string };
    const { client, calls } = fakeClient(ANSWER);
    const b = await fixBatch(id, { client, fetcher: page, now: NOW });
    expect(b).toMatchObject({ more: false, stopped: "" });
    expect(calls).toHaveLength(1);
    // The prompt shows our entry and the page, both as data.
    expect(String((calls[0]!.messages as { content: string }[])[0]!.content)).toMatch(/<entry>\nname: Iron Works 1[\s\S]*<page>/);
    const [row] = await query("SELECT phone, address, hours, ai_fix_at FROM gym_places WHERE name = 'Iron Works 1'");
    expect(row).toMatchObject({ phone: "+1 604-555-0199", address: "100 Main Street", ai_fix_at: NOW });
    const [owned] = await query("SELECT phone, ai_fix_at FROM gym_places WHERE name = 'Iron Works 2'");
    expect(owned).toEqual({ phone: "604-555-0000", ai_fix_at: 0 });
    // Run again, even as a new pass: nothing is due, nothing is asked.
    expect((await fixBatch(id, { client, fetcher: page, now: NOW + 1000 })).done).toEqual([]);
    await stopFix(id, NOW + 2000);
    expect(await startFix("admin@example.com", NOW + 3000)).toEqual({ error: "none" });
    expect(calls).toHaveLength(1);

    const status = await fixStatus(id);
    const phone = status!.recent.find((c) => c.field === "phone")!;
    expect(phone).toMatchObject({ name: "Iron Works 1", before: "604-555-0000", after: "+1 604-555-0199", undone: false });
    expect(await undoFix(phone.id, NOW + 4000)).toEqual({ ok: true });
    expect((await query("SELECT phone FROM gym_places WHERE name = 'Iron Works 1'"))[0]!.phone).toBe("604-555-0000");
    expect((await undoFix(phone.id)).ok).toBe(false);
  });

  it("sends a gym whose page says it closed to Reports instead of hiding it", async () => {
    await gyms(1);
    const { id } = (await startFix("admin@example.com", NOW)) as { id: string };
    const { client } = fakeClient({ ...ANSWER, closed: true, note: "The page says the gym closed in March." });
    const b = await fixBatch(id, { client, fetcher: page, now: NOW });
    expect(b.done[0]!.flagged).toBe("closed");
    const [report] = await query("SELECT reason, who, note FROM gym_place_reports");
    expect(report).toEqual({
      reason: "closed",
      who: FIX_REPORTER,
      note: "AI fix-up, from the gym's website: The page says the gym closed in March.",
    });
    expect((await query("SELECT hidden FROM gym_places"))[0]!.hidden).toBe(0);
  });

  it("puts a gym back when AI can't be asked (the cap, a refused key), so it still gets its one go", async () => {
    await gyms(2);
    const { id } = (await startFix("admin@example.com", NOW)) as { id: string };
    const capped = fakeClient(null, {
      error: new AiError("Today's AI spend reached its $2 cap (Flags › AI daily cap). It resets at midnight Pacific."),
    });
    const b = await fixBatch(id, { client: capped.client, fetcher: page, now: NOW });
    expect(b.stopped).toMatch(/cap/);
    expect(b.more).toBe(false);
    expect((await query("SELECT ai_fix_at FROM gym_places")).map((r) => r.ai_fix_at)).toEqual([0, 0]);
    // A gym whose page couldn't be read has had its go.
    const down = (async () => new Response("gone", { status: 404 })) as unknown as typeof fetch;
    const ok = fakeClient(ANSWER);
    const c = await fixBatch(id, { client: ok.client, fetcher: down, now: NOW + 1 });
    expect(c.done.map((d) => d.skipped)).toEqual(["HTTP 404", "HTTP 404"]);
    expect(ok.calls).toHaveLength(0);
    expect((await query("SELECT ai_fix_at FROM gym_places")).map((r) => r.ai_fix_at)).toEqual([NOW + 1, NOW + 1]);
  });
});

describe("the fix-up job", () => {
  const one = (over: Partial<FixBatch> = {}): FixBatch => ({
    done: [{ id: "a", name: "A", changes: [{ field: "phone", before: "", after: "604-555-0100" }], flagged: "", skipped: "" }],
    more: true,
    stopped: "",
    ...over,
  });
  const ready = async () => ({ ready: true, why: "" });

  it("pauses at the day's cap until midnight Pacific, then carries on by itself", async () => {
    await gyms(1);
    const { id } = (await startFix("admin@example.com")) as { id: string };
    const capped = "Today's AI spend reached its $2 cap (Flags › AI daily cap). It resets at midnight Pacific.";
    let n = 0;
    const r = await runFixWorker({ status: ready, fix: async () => (++n === 1 ? one() : one({ done: [], stopped: capped })) });
    expect(r).toEqual({ job: id, more: false, finished: false });
    const paused = await fixStatus(id);
    expect(paused).toMatchObject({ state: "running", done: 1, filled: 1, fixed: 0 });
    expect(paused!.pausedUntil).toBeGreaterThan(Date.now());
    expect(paused!.note).toMatch(/^Paused: .*cap.* carries on by itself at midnight Pacific\.$/);
    // While paused, a worker does nothing.
    expect((await runFixWorker({ status: ready, fix: async () => one({ more: false }) })).job).toBeNull();
    // Past midnight it picks up and finishes.
    await run("UPDATE gym_ai_fix_jobs SET paused_until = ?", [Date.now() - 1]);
    const done = await runFixWorker({ status: ready, fix: async () => one({ more: false }) });
    expect(done).toEqual({ job: id, more: false, finished: true });
    expect(await fixStatus(id)).toMatchObject({ state: "done", done: 2, note: "" });
  });

  it("pauses without claiming a gym when AI is switched off, and one pass runs at a time", async () => {
    await gyms(1);
    const { id } = (await startFix("admin@example.com")) as { id: string };
    expect(await startFix("admin@example.com")).toEqual({ error: "running", id });
    let asked = 0;
    await runFixWorker({
      status: async () => ({ ready: false, why: "AI helpers are switched off (Flags › Admin AI helpers)." }),
      fix: async () => {
        asked++;
        return one();
      },
    });
    expect(asked).toBe(0);
    expect((await fixStatus(id))!.note).toMatch(/switched off.*in a few minutes/);
  });

  it("works out when the next Pacific day starts", () => {
    // 2026-11-19 10:00 UTC is 02:00 Pacific (PST, UTC-8): the next day starts at 08:00 UTC on the 20th.
    const at = Date.UTC(2026, 10, 19, 10, 0);
    expect(new Date(nextPacificDay(at)).toISOString()).toBe("2026-11-20T08:00:00.000Z");
    expect(pauseFor("Today's AI spend reached its $2 cap", at)).toBe(nextPacificDay(at));
    expect(pauseFor("Too many AI requests just now. Try again in a minute.", at)).toBe(at + 2 * 60_000);
  });
});
