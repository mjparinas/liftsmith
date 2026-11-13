import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { joinCoach, makeInvite, previewInvite } from "./coach";
import { query, resetDb, run } from "./db";
import { editGym, ownedGyms } from "./gymClaims";
import {
  decideTrainer,
  deleteNews,
  extrasDeletes,
  fixIssue,
  issuesOf,
  joinAsTrainer,
  myTrainerGyms,
  newsOf,
  ownerExtras,
  postNews,
  reportIssue,
} from "./gymExtras";
import { gymHtml } from "./gymPage";
import { placeById, placesFromOsm, savePlaces } from "./gymPlaces";
import { saveToken, setPushSender, type PushMessage } from "./push";
import { gymClubStart, handle } from "./social";

// Round 3 on a real gym (docs/decisions/gyms.md): amenities and prices, announcements, equipment problems, trainers.
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const sent: PushMessage[] = [];
const profile = (who: string, name: string) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [who, JSON.stringify({ name }), NOW]);

let gym = "";
beforeEach(async () => {
  await resetDb();
  sent.length = 0;
  setPushSender(async (m) => (sent.push(m), "ok"));
  await savePlaces(
    placesFromOsm([{ type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron Works" } }], {
      city: "Langley",
      region: "BC",
      country: "CA",
    }),
    NOW,
  );
  gym = String((await query("SELECT id FROM gym_places"))[0]!.id);
});
afterEach(() => setPushSender(null));

const claim = () => run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [gym]);

describe("amenities and prices", () => {
  it("are kept from the known list, tidied, and shown on the gym's page with its structured data", async () => {
    await claim();
    expect(
      await editGym("acc-owner", {
        place: gym,
        amenities: ["sauna", "showers", "jacuzzi", "sauna"],
        prices: { day: "15", month: 49.999, currency: "CAD" },
      }),
    ).toEqual({ ok: true });
    const p = (await placeById(gym))!;
    expect(p.amenities).toEqual(["showers", "sauna"]);
    expect(p.prices).toEqual({ currency: "CAD", day: 15, month: 50 });
    expect((await ownedGyms("acc-owner", NOW))[0]).toMatchObject({ amenities: ["showers", "sauna"], country: "CA" });
    const html = gymHtml(p, [], "en");
    expect(html).toContain("Day pass $15");
    expect(html).toContain("Membership from $50 a month");
    expect(html).toContain('"amenityFeature"');
    expect(html).toContain("Sauna");
    // Clearing them takes them off the page.
    await editGym("acc-owner", { place: gym, amenities: [], prices: {} });
    expect(await placeById(gym)).toMatchObject({ amenities: [], prices: null });
  });

  it("can't be set by someone who doesn't own the gym", async () => {
    await claim();
    expect(await editGym("acc-other", { place: gym, amenities: ["sauna"] })).toEqual({ ok: false, error: "owner" });
  });
});

describe("announcements", () => {
  it("are posted by the owner only, show for 60 days, and reach club members who left workout pushes on", async () => {
    await claim();
    await handle("acc-owner", { op: "join", handle: "ironworks", name: "Iron Works", agree: true }, NOW);
    await handle("acc-sam", { op: "join", handle: "sam", name: "Sam", agree: true }, NOW);
    await handle("acc-sam", { op: "pushToken", token: "tok-sam-0123456789abcdef", platform: "android", lang: "en" }, NOW);
    const { code } = (await gymClubStart("acc-owner", gym, NOW)).body as { code: string };
    await handle("acc-sam", { op: "clubJoin", code }, NOW);

    expect(await postNews("acc-sam", gym, "Free day pass!", NOW)).toEqual({ ok: false, error: "owner" });
    const r = await postNews("acc-owner", gym, "Closed Monday for the holiday.", NOW);
    expect(r).toMatchObject({ ok: true, pushed: 1 });
    expect(sent).toMatchObject([
      { token: "tok-sam-0123456789abcdef", body: "Iron Works: Closed Monday for the holiday.", route: `#/gymplace/${gym}` },
    ]);
    expect((await placeById(gym))!.news.map((n) => n.text)).toEqual(["Closed Monday for the holiday."]);
    expect(gymHtml((await placeById(gym))!, [], "en")).toContain("From the gym");

    // Three a day, and links are refused like everywhere else.
    expect(await postNews("acc-owner", gym, "See https://example.com", NOW)).toEqual({ ok: false, error: "link" });
    await postNews("acc-owner", gym, "Two", NOW);
    await postNews("acc-owner", gym, "Three", NOW);
    expect(await postNews("acc-owner", gym, "Four", NOW)).toEqual({ ok: false, error: "slow" });

    if (!r.ok) throw new Error("posted");
    expect(await deleteNews("acc-owner", gym, r.id)).toBe(true);
    await run("UPDATE gym_news SET created_at = ?", [NOW - 61 * DAY]);
    expect(await newsOf(gym, NOW)).toEqual([]);
  });
});

describe("equipment problems", () => {
  it("are reported by anyone, counted once per piece, told to the owner, and closed by Fixed", async () => {
    await claim();
    await saveToken("acc-owner", "tok-owner-0123456789abcdef", "ios", "en", NOW);
    const a = await reportIssue("ip:abc", { place: gym, equipment: "legPress", kind: "broken", note: "Cable snapped" }, NOW);
    const b = await reportIssue("acc:sam", { place: gym, equipment: "legPress", kind: "broken" }, NOW + 1000);
    expect(a).toMatchObject({ ok: true });
    expect(b).toEqual(a);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ token: "tok-owner-0123456789abcdef", route: `#/gymedit/${gym}` });
    expect(await issuesOf(gym, NOW)).toMatchObject([{ equipment: "legPress", kind: "broken", note: "Cable snapped", reports: 2 }]);
    expect(await reportIssue("ip:abc", { place: gym, equipment: "jetpack" }, NOW)).toEqual({ ok: false, error: "equipment" });
    expect((await ownerExtras("acc-owner", gym, NOW))!.issues).toHaveLength(1);
    expect(await ownerExtras("acc-sam", gym, NOW)).toBeNull();

    if (!a.ok) throw new Error("reported");
    expect(await fixIssue("acc:owner", gym, a.id, NOW)).toBe(true);
    expect(await fixIssue("acc:owner", gym, a.id, NOW)).toBe(false);
    expect(await issuesOf(gym, NOW)).toEqual([]);
  });

  it("run out after 14 days without another report", async () => {
    await reportIssue("ip:abc", { place: gym, equipment: "cable", kind: "missing" }, NOW);
    expect(await issuesOf(gym, NOW + 13 * DAY)).toHaveLength(1);
    expect(await issuesOf(gym, NOW + 15 * DAY)).toEqual([]);
  });
});

describe("trainers", () => {
  it("list themselves on an unclaimed gym, wait for the owner on an official one, and join through the usual consent", async () => {
    await profile("acc-coach", "Riley");
    expect(await joinAsTrainer("acc-coach", { place: gym }, NOW)).toEqual({ ok: false, error: "coach" });
    await makeInvite("acc-coach", NOW, "AAAABBBB");
    expect(await joinAsTrainer("acc-coach", { place: gym, bio: "Powerlifting coach" }, NOW)).toEqual({ ok: true, status: "listed" });
    const listed = (await placeById(gym))!.trainers;
    expect(listed).toMatchObject([{ name: "Riley", bio: "Powerlifting coach" }]);
    expect(gymHtml((await placeById(gym))!, [], "en")).toContain("Train with Riley");

    // The listing's own code opens the coach like an invite does, and keeps working after the invite runs out.
    const code = listed[0]!.code;
    expect(await previewInvite("acc-client", code, NOW + 30 * DAY)).toMatchObject({ coach: { id: "acc-coach" } });
    expect(await joinCoach("acc-client", code, NOW + 30 * DAY)).toMatchObject({ coach: { id: "acc-coach" } });

    // Once the gym is claimed, a new trainer waits for the owner, who approves or removes them.
    await claim();
    await profile("acc-coach2", "Jo");
    await makeInvite("acc-coach2", NOW, "CCCCDDDD");
    expect(await joinAsTrainer("acc-coach2", { place: gym }, NOW)).toEqual({ ok: true, status: "pending" });
    expect((await placeById(gym))!.trainers.map((x) => x.name)).toEqual(["Riley"]);
    const pending = (await ownerExtras("acc-owner", gym, NOW))!.trainers.find((x) => x.status === "pending")!;
    expect(await previewInvite("acc-client2", pending.code, NOW)).toEqual({ error: "unknown" });
    expect(await decideTrainer("acc-coach", gym, pending.code, true)).toBe(false);
    expect(await decideTrainer("acc-owner", gym, pending.code, true)).toBe(true);
    expect((await placeById(gym))!.trainers.map((x) => x.name)).toEqual(["Riley", "Jo"]);
    expect(await decideTrainer("acc-owner", gym, code, false)).toBe(true);
    expect((await placeById(gym))!.trainers.map((x) => x.name)).toEqual(["Jo"]);
    expect(await myTrainerGyms("acc-coach2")).toMatchObject([{ place: gym, status: "listed" }]);
  });

  it("go with the coach's account", async () => {
    await profile("acc-coach", "Riley");
    await makeInvite("acc-coach", NOW, "AAAABBBB");
    await joinAsTrainer("acc-coach", { place: gym }, NOW);
    for (const st of extrasDeletes("acc-coach")) await run(st.sql, st.args);
    expect((await placeById(gym))!.trainers).toEqual([]);
  });
});
