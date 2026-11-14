import { beforeEach, describe, expect, it } from "vitest";

import type { PersonCard, SocialProfile } from "@/lib/socialTypes";

import { query, resetDb, run } from "./db";
import { placesFromOsm, savePlaces } from "./gymPlaces";
import { profileHtml } from "./profilePage";
import { publicProfile } from "./publicProfile";
import { adminReports, checkTagline, handle, resolveReports } from "./social";
import { moderate } from "./socialModeration";

// A profile's tagline and home gym (Melvin, 2026-11-14; docs/decisions/friends.md "Tagline and home gym").
const NOW = 1_800_000_000_000;
const call = (who: string, op: string, b: Record<string, unknown> = {}) => handle(who, { op, ...b }, NOW);
const join = (who: string, h: string) => call(who, "join", { handle: h, name: h.toUpperCase(), agree: true });
const mine = async (who: string) => (await call(who, "me")).body.profile as SocialProfile;
const person = async (who: string, h: string) => (await call(who, "lookup", { handle: h })).body.person as PersonCard;
const teen = (who: string) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, 1)", [
    who,
    JSON.stringify({ birthYear: new Date(NOW).getUTCFullYear() - 16 }),
  ]);

let gym = "";
beforeEach(async () => {
  await resetDb();
  await savePlaces(
    placesFromOsm([{ type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron Works" } }], {
      city: "Langley",
      region: "BC",
      country: "CA",
    }),
    NOW,
  );
  gym = String((await query("SELECT id FROM gym_places"))[0]!.id);
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await join("acc-c", "casey");
  // Blair follows Alex; Casey doesn't.
  await call("acc-b", "follow", { handle: "alex" });
  await call("acc-a", "answer", { handle: "blair", accept: true });
});

describe("tagline", () => {
  it("goes through the same filter as names and can be cleared", async () => {
    expect(checkTagline("  Early   mornings, heavy squats  ")).toEqual({ ok: true, tagline: "Early mornings, heavy squats" });
    expect(checkTagline("")).toEqual({ ok: true, tagline: "" });
    expect(checkTagline("x".repeat(80))).toEqual({ ok: true, tagline: "x".repeat(60) });
    expect((await call("acc-a", "update", { tagline: "coaching at cheap-pills.com" })).body).toEqual({ error: "tagline.link" });
    await call("acc-a", "update", { tagline: "Early mornings, heavy squats" });
    expect((await mine("acc-a")).tagline).toBe("Early mornings, heavy squats");
    // Anyone who can see the profile sees it, like the name.
    expect((await person("acc-c", "alex")).tagline).toBe("Early mornings, heavy squats");
    await call("acc-a", "update", { tagline: "" });
    expect((await mine("acc-a")).tagline).toBe("");
  });

  it("is covered by profile reports: staff see it, Remove clears it, and Clear tagline resets it", async () => {
    await call("acc-a", "update", { tagline: "Rude line" });
    await call("acc-b", "report", { kind: "profile", id: "alex", reason: "name" });
    const [r] = await adminReports();
    expect(r!.content).toBe("@alex · ALEX · “Rude line”");
    expect(await resolveReports("profile", "acc-a", "remove")).toBe(true);
    expect((await mine("acc-a")).tagline).toBe("");
    expect((await mine("acc-a")).name).toBe("alex");

    await call("acc-a", "update", { tagline: "Another rude line" });
    expect(await moderate("acc-a", { action: "resetTagline" }, NOW)).toBe(true);
    expect((await mine("acc-a")).tagline).toBe("");
  });
});

describe("home gym", () => {
  it("is a real gym from the finder, never typed, and shows only to people who see the posts", async () => {
    expect((await call("acc-a", "update", { homeGym: "Langley, BC" })).body).toEqual({ error: "gym" });
    expect((await call("acc-a", "update", { homeGym: "0123456789abcdef" })).body).toEqual({ error: "gym" });
    await call("acc-a", "update", { homeGym: gym });
    const home = (await mine("acc-a")).homeGym;
    expect(home).toMatchObject({ id: gym, name: "Iron Works", city: "Langley" });
    expect(home!.path).toMatch(/^\/gyms\/langley-bc\/iron-works\/$/);
    expect((await person("acc-b", "alex")).homeGym?.id).toBe(gym);
    expect((await person("acc-c", "alex")).homeGym).toBeNull(); // Casey can't see Alex's posts
    // Other changes keep it, and "" clears it.
    await call("acc-a", "update", { name: "Alex R" });
    expect((await mine("acc-a")).homeGym?.id).toBe(gym);
    await call("acc-a", "update", { homeGym: "" });
    expect((await mine("acc-a")).homeGym).toBeNull();
  });

  it("goes when staff hide the gym", async () => {
    await call("acc-a", "update", { homeGym: gym });
    await run("UPDATE gym_places SET hidden = 1 WHERE id = ?", [gym]);
    expect((await mine("acc-a")).homeGym).toBeNull();
    expect((await person("acc-b", "alex")).homeGym).toBeNull();
  });

  it("is never kept or shown for someone under 18", async () => {
    await teen("acc-b");
    expect((await call("acc-b", "update", { homeGym: gym })).body).toEqual({ error: "teen" });
    // Picked before they joined a school team (or set a birth year): no longer shown, and the next save drops it.
    await call("acc-a", "update", { homeGym: gym });
    await teen("acc-a");
    expect((await person("acc-b", "alex")).homeGym).toBeNull();
    const me = (await call("acc-a", "me")).body;
    expect(me.teen).toBe(true);
    expect((me.profile as SocialProfile).homeGym).toBeNull();
    await call("acc-a", "update", { name: "Alex" });
    expect((await query("SELECT home_gym FROM social_profiles WHERE account_id = 'acc-a'"))[0]!.home_gym).toBe("");
  });
});

describe("the public page", () => {
  it("shows the tagline and links the home gym to its page, every value escaped", async () => {
    await call("acc-a", "update", { public: true, tagline: "Squats <3 & deadlifts", homeGym: gym });
    const p = await publicProfile("alex", NOW);
    expect(p?.tagline).toBe("Squats <3 & deadlifts");
    expect(p?.homeGym?.name).toBe("Iron Works");
    const html = profileHtml(p, "en", "kg", NOW);
    expect(html).toContain('<p class="tagline">Squats &#60;3 &#38; deadlifts</p>');
    expect(html).toContain(`<a href="${p!.homeGym!.path}">Iron Works, Langley</a>`);
    expect(html).toContain(String.raw`"description":"Squats \u003c3 & deadlifts"`);
  });
});
