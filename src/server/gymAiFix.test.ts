import type Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it } from "vitest";

import { AiError } from "./ai";
import { query, resetDb, run } from "./db";
import {
  applyFix,
  dismissSuggestion,
  FIX_REPORTER,
  fixBatch,
  fixesFor,
  fixStatus,
  nextPacificDay,
  pauseFor,
  revertOldRules,
  runFixWorker,
  sameStreet,
  showsAddress,
  startFix,
  stopFix,
  sureOf,
  undoFix,
  unitFirst,
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
  locations: 1,
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

const SINGLE = { ours: false, single: true };
const OURS = { ours: true, single: false };
const CHAIN = { ours: false, single: false };

describe("how sure the fix-up is of the location", () => {
  it("knows a page about this gym: our street on it, or a one-location site", () => {
    expect(showsAddress("907 Kingston Road", "YMCA … Visit us at 907 Kingston Rd, Toronto. Call 416-…")).toBe(true);
    expect(showsAddress("6334A Rue Saint-Hubert", "Studio: 6334-A rue St-Hubert, Montréal")).toBe(true);
    expect(showsAddress("435 Spadina Road", "Studio Lagree, 672 Queen St. East, Toronto")).toBe(false);
    expect(sureOf({ address: "1 A St" }, { locations: 1 }, "Welcome to our gym")).toEqual({ ours: false, single: true });
    // A chain's page: several locations, or the words a chain uses for them.
    expect(sureOf({ address: "" }, { locations: 4 }, "Welcome")).toEqual({ ours: false, single: false });
    expect(sureOf({ address: "" }, { locations: 1 }, "Find a gym near you. All our locations are open 24/7.").single).toBe(false);
    expect(sureOf({ address: "" }, { locations: 1 }, "Trouvez nos succursales").single).toBe(false);
  });

  it("treats a unit moved, dropped or written another way as the same address", () => {
    expect(sameStreet("200-1377 The Queensway", "1377 The Queensway")).toBe(true);
    expect(sameStreet("6334A Rue Saint-Hubert", "6334-A rue St-Hubert")).toBe(true);
    expect(sameStreet("206-2710 Rue Masson", "2710 rue Masson, bureau 206")).toBe(true);
    expect(sameStreet("6036 Boul Métropolitain E", "6036 Boul. Métropolitain East")).toBe(true);
    expect(sameStreet("3645 Rue Notre-Dame Ouest", "3645 Notre-Dame O.")).toBe(true);
    expect(sameStreet("123 Dundas Street West", "140 Spadina Ave.")).toBe(false);
    expect(sameStreet("4236 Rue Sainte-Catherine Est", "4787 Rue Sainte-Catherine E")).toBe(false);
  });

  it("keeps the unit in front", () => {
    expect(unitFirst("1440 Bathurst Street, Unit 111")).toBe("111-1440 Bathurst Street");
    expect(unitFirst("Unit 103, 1201 Dundas Street East")).toBe("103-1201 Dundas Street East");
    expect(unitFirst("10 Lower Spadina Avenue, Suite 100")).toBe("100-10 Lower Spadina Avenue");
    expect(unitFirst("2710 rue Masson, bureau 206")).toBe("206-2710 rue Masson");
    expect(unitFirst("100 Main Street")).toBe("100 Main Street");
  });
});

describe("what the fix-up changes", () => {
  it("fills empty fields and only suggests the rest, from a one-location site", () => {
    expect(fixesFor(BASE, ANSWER, SINGLE)).toEqual([
      { field: "address", before: "5 Old Road", after: "100 Main Street", kind: "suggest" },
      { field: "postcode", before: "", after: "V2Y 1A1", kind: "fill" },
      { field: "phone", before: "604-555-0000", after: "+1 604-555-0199", kind: "suggest" },
      { field: "hours", before: "", after: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00", kind: "fill" },
      { field: "email", before: "", after: "hello@ironworks.example.com", kind: "fill" },
      { field: "instagram", before: "", after: "https://www.instagram.com/ironworksgym", kind: "fill" },
    ]);
  });

  it("does nothing from a chain's page that doesn't show our address (the head office's number, another branch)", () => {
    expect(fixesFor({ ...BASE, phone: "+1-514-321-9027" }, { ...ANSWER, phone: "(514) 394-9366", locations: 30 }, CHAIN)).toEqual([]);
  });

  it("never suggests another street from a page that shows ours, nor hours with conditions over plain ones", () => {
    const g = { ...BASE, address: "907 Kingston Road", hours: 'Mo-Fr 06:00-23:00 "Members"' };
    const out = fixesFor(g, { ...ANSWER, address: "907 Kingston Rd", hours: "24/7", phone: "" }, OURS);
    expect(out.map((c) => c.field)).toEqual(["postcode", "email", "instagram"]);
  });

  it("leaves what's the same written another way, and a street or city from somewhere else", () => {
    const g = {
      ...BASE,
      address: "200-1377 Main Street",
      postcode: "V3A 4B5",
      phone: "(604) 555 0000",
      hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
      facebook: "https://www.facebook.com/IronWorks,",
    };
    const same = {
      ...ANSWER,
      address: "1377 Main St",
      phone: "+1 604 555 0000",
      email: "",
      instagram: "",
      facebook: "https://www.facebook.com/IronWorks",
    };
    expect(fixesFor(g, same, SINGLE)).toEqual([]);
    expect(fixesFor({ ...g, address: "" }, { ...same, city: "Vancouver" }, SINGLE)).toEqual([]);
  });

  it("fixes a city that's a postcode, and refuses answers that fail the checks", () => {
    const g = { ...BASE, city: "80145", country: "IT", region: "Campania", address: "" };
    expect(
      fixesFor(g, { ...ANSWER, city: "Napoli", address: "Call us", phone: "call us", email: "a@designer.example.org" }, SINGLE),
    ).toEqual([
      { field: "city", before: "80145", after: "Napoli", kind: "fill" },
      { field: "hours", before: "", after: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00", kind: "fill" },
      { field: "instagram", before: "", after: "https://www.instagram.com/ironworksgym", kind: "fill" },
    ]);
  });
});

describe("the fix-up batch", () => {
  it("fills a gym once, ever, keeps suggestions for staff and never touches a claimed gym", async () => {
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
    // Filled what was empty; the phone and street we had stay until staff apply the suggestion.
    expect(row).toMatchObject({
      phone: "604-555-0000",
      address: "5 Old Road",
      hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
      ai_fix_at: NOW,
    });
    const [owned] = await query("SELECT phone, ai_fix_at FROM gym_places WHERE name = 'Iron Works 2'");
    expect(owned).toEqual({ phone: "604-555-0000", ai_fix_at: 0 });
    // Run again, even as a new pass: nothing is due, nothing is asked.
    expect((await fixBatch(id, { client, fetcher: page, now: NOW + 1000 })).done).toEqual([]);
    await stopFix(id, NOW + 2000);
    expect(await startFix("admin@example.com", NOW + 3000)).toEqual({ error: "none" });
    expect(calls).toHaveLength(1);

    const status = await fixStatus(id);
    expect(status!.suggestions.map((c) => c.field).sort()).toEqual(["address", "phone"]);
    const phone = status!.suggestions.find((c) => c.field === "phone")!;
    expect(phone).toMatchObject({ name: "Iron Works 1", before: "604-555-0000", after: "+1 604-555-0199", state: "suggested" });
    expect((await undoFix(phone.id)).ok).toBe(false);
    expect(await applyFix(phone.id, NOW + 4000)).toEqual({ ok: true });
    expect((await query("SELECT phone FROM gym_places WHERE name = 'Iron Works 1'"))[0]!.phone).toBe("+1 604-555-0199");
    const street = status!.suggestions.find((c) => c.field === "address")!;
    expect(await dismissSuggestion(street.id)).toBe(true);
    expect((await fixStatus(id))!.suggestions).toEqual([]);
    const hours = (await fixStatus(id))!.recent.find((c) => c.field === "hours")!;
    expect(await undoFix(hours.id, NOW + 5000)).toEqual({ ok: true });
    expect((await query("SELECT hours FROM gym_places WHERE name = 'Iron Works 1'"))[0]!.hours).toBe("");
  });

  it("changes nothing from a chain's page that doesn't show the branch", async () => {
    await gyms(1);
    const { id } = (await startFix("admin@example.com", NOW)) as { id: string };
    const chain = (async () =>
      new Response(
        "<html><body><h1>Iron Works</h1><p>Find a gym near you: 30 locations across Canada. Head office (514) 394-9366.</p></body></html>",
        {
          headers: { "content-type": "text/html" },
        },
      )) as unknown as typeof fetch;
    const { client } = fakeClient({ ...ANSWER, locations: 30, phone: "(514) 394-9366" });
    const b = await fixBatch(id, { client, fetcher: chain, now: NOW });
    expect(b.done[0]!.changes).toEqual([]);
    expect((await query("SELECT phone, hours FROM gym_places"))[0]).toEqual({ phone: "604-555-0000", hours: "" });
  });

  it("puts right the first run: undoes its corrections, keeps its fills, and gives its gyms a fresh go", async () => {
    await gyms(2);
    await run("INSERT INTO gym_ai_fix_jobs (id, state, total, started_at, fixed, filled) VALUES ('old', 'stopped', 2, ?, 1, 1)", [NOW]);
    const [one, two] = (await query("SELECT id FROM gym_places ORDER BY name")).map((r) => String(r.id));
    // What the first run wrote: a phone and a street over ours, and an Instagram where there was none.
    await run(
      "UPDATE gym_places SET phone = '1 (416) 928-1875', address = '140 Spadina Ave.', instagram = 'https://www.instagram.com/iw', ai_fix_at = ? WHERE id = ?",
      [NOW, one],
    );
    await run("UPDATE gym_places SET ai_fix_at = ? WHERE id = ?", [NOW, two]);
    await run(
      `INSERT INTO gym_ai_fixes (id, job, place_id, field, before, after, at) VALUES
       ('c1', 'old', ?, 'phone', '604-555-0000', '1 (416) 928-1875', ?),
       ('c2', 'old', ?, 'address', '5 Old Road', '140 Spadina Ave.', ?),
       ('c3', 'old', ?, 'instagram', '', 'https://www.instagram.com/iw', ?)`,
      [one, NOW, one, NOW, one, NOW],
    );
    expect(await revertOldRules(NOW + 1)).toEqual({ undone: 2, left: 0, kept: 1, gyms: 2 });
    expect((await query("SELECT phone, address, instagram FROM gym_places WHERE id = ?", [one]))[0]).toEqual({
      phone: "604-555-0000",
      address: "5 Old Road",
      instagram: "https://www.instagram.com/iw",
    });
    expect((await query("SELECT ai_fix_at FROM gym_places")).map((r) => r.ai_fix_at)).toEqual([0, 0]);
    expect((await fixStatus("old"))!.note).toMatch(/2 of its corrections were undone/);
    // Once only, and a new pass runs under the new rules.
    expect(await revertOldRules(NOW + 2)).toBeNull();
    const made = (await startFix("admin@example.com", NOW + 3)) as { id: string };
    expect((await fixStatus(made.id))!).toMatchObject({ total: 2, oldRules: false });
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
    done: [
      { id: "a", name: "A", changes: [{ field: "phone", before: "", after: "604-555-0100", kind: "fill" }], flagged: "", skipped: "" },
    ],
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
