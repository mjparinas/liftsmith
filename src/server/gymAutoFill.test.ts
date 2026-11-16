import type Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { autoFillBatch, checkedFill } from "./gymAutoFill";
import { placesFromOsm, savePlaces } from "./gymPlaces";

// The import's AI backfill (docs/decisions/admin-ai.md "The import's AI backfill"): Claude reads a gym's page for what
// the map and the plain-code read missed, and only checked answers go into empty fields of unclaimed gyms.
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
  address: "100 Main Street, Langley, BC V2Y 1A1",
  city: "Langley",
  postcode: "V2Y 1A1",
  phone: "+1 604-555-0100",
  hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
  email: "hello@ironworks.example.com",
  instagram: "@ironworksgym",
  facebook: "https://example.org/not-facebook",
};

async function gym(tags: Record<string, string> = {}) {
  await savePlaces(
    placesFromOsm(
      [
        {
          type: "node",
          id: 10,
          lat: 49.1,
          lon: -122.6,
          tags: { leisure: "fitness_centre", name: "Iron Works", website: "https://ironworks.example.com/", ...tags },
        },
      ],
      AREA,
    ),
    NOW,
  );
  // The plain-code read of the website has been done.
  await run("UPDATE gym_places SET enriched_at = ?", [NOW]);
}

beforeEach(async () => {
  await resetDb();
});

describe("the import's AI backfill", () => {
  it("fills only what's still empty, with every answer checked, and asks again only after half a year", async () => {
    await gym({ phone: "604-555-0000" });
    const { client, calls } = fakeClient(ANSWER);
    const r = await autoFillBatch({ client, fetcher: page, now: NOW });
    expect(r).toMatchObject({ more: false, stopped: "" });
    expect(r.done[0]!.filled.sort()).toEqual(["address", "email", "hours", "instagram", "postcode"]);
    const [row] = await query("SELECT phone, address, postcode, hours, email, instagram, facebook, ai_at FROM gym_places");
    expect(row).toEqual({
      // The map's phone stays; the address is tidied to the street; a Facebook link on another site is refused.
      phone: "604-555-0000",
      address: "100 Main Street",
      postcode: "V2Y 1A1",
      hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
      email: "hello@ironworks.example.com",
      instagram: "https://www.instagram.com/ironworksgym",
      facebook: "",
      ai_at: NOW,
    });
    // The prompt names what's missing and wraps the page as data.
    expect(String((calls[0]!.messages as { content: string }[])[0]!.content)).toMatch(
      /Missing: address, postcode, hours, email, instagram, facebook\n<page>/,
    );
    expect((await autoFillBatch({ client, fetcher: page, now: NOW + 1000 })).done).toHaveLength(0);
    expect(calls).toHaveLength(1);
  });

  it("refuses answers that don't pass the checks", () => {
    const g = {
      id: "g",
      name: "Iron Works",
      website: "https://ironworks.example.com/",
      address: "",
      city: "80145",
      region: "Campania",
      country: "IT",
      postcode: "",
      phone: "",
      hours: "",
      email: "",
      instagram: "",
      facebook: "",
    };
    expect(
      checkedFill(g, {
        address: "Call 081 555 0100",
        city: "Napoli",
        postcode: "V2Y 1A1",
        phone: "call us",
        hours: "early till late",
        email: "studio@webdesigner.example.org",
        instagram: "https://www.facebook.com/ironworks",
        facebook: "ironworks",
      }),
    ).toEqual({ city: "Napoli", facebook: "https://www.facebook.com/ironworks" });
  });

  it("never touches a claimed gym", async () => {
    await gym();
    await run("UPDATE gym_places SET claimed_by = 'acc-owner'");
    const { client, calls } = fakeClient(ANSWER);
    expect((await autoFillBatch({ client, fetcher: page, now: NOW })).done).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("stops for the day when AI can't go on, leaving the gym for the next run", async () => {
    await gym();
    const { AiError } = await import("./ai");
    // The key refused comes back as an AiError that stops the step.
    const refused = fakeClient(null, { error: new AiError("Anthropic refused the API key.") });
    const r = await autoFillBatch({ client: refused.client, fetcher: page, now: NOW });
    expect(r.stopped).toBe("Anthropic refused the API key.");
    expect(r.more).toBe(false);
    expect((await query("SELECT ai_at FROM gym_places"))[0]!.ai_at).toBe(0);
  });
});
