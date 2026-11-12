import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { ownedGyms, releaseGym } from "./gymClaims";
import { placeById, placesFromOsm, savePlaces } from "./gymPlaces";
import { gymClubStart, handle } from "./social";

// An official gym's own club and weekly leaderboard (docs/decisions/gyms.md).
const NOW = 1_800_000_000_000;
const call = (who: string, op: string, b: Record<string, unknown> = {}) => handle(who, { op, ...b }, NOW);
const join = (who: string, h: string) => call(who, "join", { handle: h, name: h, agree: true });

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
  await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [gym]);
});

describe("a gym's club", () => {
  it("is started by the owner once, shows on the gym, and lifters join it like any club", async () => {
    expect((await gymClubStart("acc-owner", gym, NOW)).body).toEqual({ error: "notJoined" });
    await join("acc-owner", "ironworks");
    await join("acc-lifter", "sam");
    expect((await gymClubStart("acc-lifter", gym, NOW)).code).toBe(403);
    const first = (await gymClubStart("acc-owner", gym, NOW)).body as { id: string; code: string };
    expect((await gymClubStart("acc-owner", gym, NOW)).body).toEqual(first);
    expect((await placeById(gym))!.club).toBe(first.code);
    expect((await ownedGyms("acc-owner", NOW))[0]!.club).toBe(first.code);

    expect((await call("acc-lifter", "clubJoin", { code: first.code })).code).toBe(200);
    const list = (await call("acc-lifter", "clubs")).body.clubs as { name: string; members: number }[];
    expect(list).toEqual([{ id: first.id, name: "Iron Works", members: 2, mine: false }]);
  });

  it("stays with its members as an ordinary club when the owner lets the gym go", async () => {
    await join("acc-owner", "ironworks");
    const { code } = (await gymClubStart("acc-owner", gym, NOW)).body as { code: string };
    expect(await releaseGym("acc-owner", gym)).toBe(true);
    expect((await placeById(gym))!.club).toBe("");
    expect(await query("SELECT code FROM clubs")).toEqual([{ code }]);
  });
});
