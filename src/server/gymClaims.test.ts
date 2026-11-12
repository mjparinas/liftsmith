import { beforeEach, describe, expect, it } from "vitest";

import { encodeGym, kitOf } from "@/lib/gymShare";
import { makeTestGym } from "@/test/factories";

import { deleteAccount } from "./accounts";
import { query, resetDb, run } from "./db";
import {
  claimQueue,
  claimWithPosterCode,
  decideClaim,
  editGym,
  emailMatchesSite,
  newPosterCode,
  ownedGyms,
  pendingClaimCount,
  releaseGym,
  siteDomain,
  startClaim,
  verifyClaim,
} from "./gymClaims";
import { placeById, placesFromOsm, savePlaces } from "./gymPlaces";

const NOW = 1_800_000_000_000;
let gymId = "";
let otherId = "";
const sent: { to: string; text: string }[] = [];
const mail = async (to: string, _subject: string, text: string) => {
  sent.push({ to, text });
  return true;
};
const codeIn = () => /is (\d{6})/.exec(sent.at(-1)!.text)![1]!;
const ask = (account: string, over: Record<string, unknown> = {}) =>
  startClaim(account, { place: gymId, email: "maria@ironworks.ca", role: "owner", name: "Maria Lopez", ...over }, mail, NOW);

beforeEach(async () => {
  await resetDb();
  sent.length = 0;
  await savePlaces(
    placesFromOsm(
      [
        {
          type: "node",
          id: 1,
          lat: 49.1,
          lon: -122.6,
          tags: { leisure: "fitness_centre", name: "Iron Works", website: "https://www.ironworks.ca/langley" },
        },
        {
          type: "node",
          id: 2,
          lat: 49.1,
          lon: -122.61,
          tags: { leisure: "fitness_centre", name: "Side Street Gym", website: "https://facebook.com/sidestreet" },
        },
      ],
      { city: "Langley", region: "BC", country: "CA" },
    ),
    NOW,
  );
  const rows = await query("SELECT id, name FROM gym_places ORDER BY name");
  gymId = String(rows.find((r) => r.name === "Iron Works")!.id);
  otherId = String(rows.find((r) => r.name === "Side Street Gym")!.id);
});

describe("which addresses prove a gym is yours", () => {
  it("matches the gym's own domain and its subdomains, never shared hosts", () => {
    expect(siteDomain("https://www.ironworks.ca/langley")).toBe("ironworks.ca");
    expect(emailMatchesSite("maria@ironworks.ca", "https://www.ironworks.ca")).toBe(true);
    expect(emailMatchesSite("maria@mail.ironworks.ca", "https://ironworks.ca")).toBe(true);
    expect(emailMatchesSite("maria@ironworks.ca", "https://langley.ironworks.ca")).toBe(true);
    expect(emailMatchesSite("maria@gmail.com", "https://ironworks.ca")).toBe(false);
    expect(emailMatchesSite("maria@notironworks.ca", "https://ironworks.ca")).toBe(false);
    expect(emailMatchesSite("someone@facebook.com", "https://facebook.com/sidestreet")).toBe(false);
    expect(siteDomain("")).toBeNull();
  });
});

describe("claiming by email", () => {
  it("emails a code to an address at the gym's domain, and the code makes the gym official", async () => {
    const r = await ask("acc-maria");
    expect(r).toMatchObject({ ok: true, method: "email" });
    expect(sent[0]!.to).toBe("maria@ironworks.ca");
    const claim = (r as { claim: string }).claim;
    expect(await verifyClaim("acc-maria", claim, codeIn() === "111111" ? "222222" : "111111")).toEqual({ ok: false, error: "wrong" });
    expect(await verifyClaim("acc-other", claim, codeIn())).toEqual({ ok: false, error: "expired" });
    expect(await verifyClaim("acc-maria", claim, codeIn())).toEqual({ ok: true, place: gymId });
    expect((await placeById(gymId))!.official).toBe(true);
    expect(await verifyClaim("acc-maria", claim, codeIn())).toEqual({ ok: false, error: "expired" });
    expect(await ask("acc-someone-else")).toEqual({ ok: false, error: "taken" });
  });

  it("stops after five wrong codes and when the code is old", async () => {
    const claim = ((await ask("acc-maria")) as { claim: string }).claim;
    const wrong = codeIn() === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) await verifyClaim("acc-maria", claim, wrong);
    expect(await verifyClaim("acc-maria", claim, codeIn())).toEqual({ ok: false, error: "expired" });
    const again = ((await ask("acc-maria")) as { claim: string }).claim;
    expect(await verifyClaim("acc-maria", again, codeIn(), NOW + 31 * 60_000)).toEqual({ ok: false, error: "expired" });
  });

  it("checks the request", async () => {
    expect(await ask("acc-a", { email: "nope" })).toEqual({ ok: false, error: "email" });
    expect(await ask("acc-a", { role: "boss" })).toEqual({ ok: false, error: "role" });
    expect(await ask("acc-a", { name: "" })).toEqual({ ok: false, error: "name" });
    expect(await ask("acc-a", { place: "0123456789abcdef" })).toEqual({ ok: false, error: "place" });
  });
});

describe("claims staff decide", () => {
  it("queues a claim from another address, and staff approve it", async () => {
    const r = await ask("acc-sam", { email: "sam@gmail.com", place: otherId, phone: "604-555-0100", note: "I'm the owner." });
    expect(r).toMatchObject({ ok: true, method: "review" });
    expect(sent).toHaveLength(0);
    expect(await pendingClaimCount()).toBe(1);
    const [row] = await claimQueue();
    expect(row).toMatchObject({ placeName: "Side Street Gym", name: "Maria Lopez", email: "sam@gmail.com", status: "pending" });
    expect(await decideClaim(row!.id, "approve", NOW)).toBe(true);
    expect((await placeById(otherId))!.official).toBe(true);
    expect(await pendingClaimCount()).toBe(0);
    expect(await decideClaim(row!.id, "approve", NOW)).toBe(false);
  });

  it("rejects without changing the gym", async () => {
    await ask("acc-sam", { email: "sam@gmail.com", place: otherId });
    const [row] = await claimQueue();
    expect(await decideClaim(row!.id, "reject", NOW)).toBe(true);
    expect((await placeById(otherId))!.official).toBe(false);
  });
});

describe("the poster's claim code", () => {
  it("claims the gym once, and only with the right code", async () => {
    const code = await newPosterCode(gymId);
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(await claimWithPosterCode("acc-a", gymId, "AAAA-AAAA")).toEqual({ ok: false, error: "wrong" });
    expect(await claimWithPosterCode("acc-a", gymId, code.toLowerCase())).toEqual({ ok: true, place: gymId });
    expect(await claimWithPosterCode("acc-b", gymId, code)).toEqual({ ok: false, error: "wrong" });
  });
});

describe("the owner's details", () => {
  it("lets the owner change hours, contact, description and equipment, and nobody else", async () => {
    await run("UPDATE gym_places SET claimed_by = 'acc-maria' WHERE id = ?", [gymId]);
    const code = encodeGym({ ...kitOf(makeTestGym("commercial", "kg")), name: "Iron Works" });
    expect(await editGym("acc-other", { place: gymId, hours: "24/7" })).toEqual({ ok: false, error: "owner" });
    expect(await editGym("acc-maria", { place: gymId, hours: "whenever" })).toEqual({ ok: false, error: "hours" });
    expect(await editGym("acc-maria", { place: gymId, website: "javascript:alert(1)" })).toEqual({ ok: false, error: "website" });
    expect(await editGym("acc-maria", { place: gymId, description: "Visit www.spam.com" })).toEqual({ ok: false, error: "link" });
    expect(
      await editGym("acc-maria", {
        place: gymId,
        hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
        phone: "604-555-0199",
        description: "Six racks.",
        code,
      }),
    ).toEqual({ ok: true });
    const [mine] = await ownedGyms("acc-maria");
    expect(mine).toMatchObject({ hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00", phone: "604-555-0199", description: "Six racks." });
    const p = (await placeById(gymId))!;
    expect(p.code).toBeTruthy();
    expect(p.source).toBe("owner");
  });

  it("gives the gym back when the owner lets go or deletes their account", async () => {
    await run("UPDATE gym_places SET claimed_by = 'acc-maria' WHERE id IN (?, ?)", [gymId, otherId]);
    expect(await releaseGym("acc-other", gymId)).toBe(false);
    expect(await releaseGym("acc-maria", gymId)).toBe(true);
    expect((await placeById(gymId))!.official).toBe(false);
    await deleteAccount("acc-maria", async () => null);
    expect((await placeById(otherId))!.official).toBe(false);
  });
});
