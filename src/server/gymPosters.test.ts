import { beforeEach, describe, expect, it } from "vitest";

import { todoList } from "./adminTodo";
import { query, resetDb, run } from "./db";
import { claimWithPosterCode } from "./gymClaims";
import { placeById, placesFromOsm, savePlaces } from "./gymPlaces";
import { actOnOrder, countScan, latestOrder, posterQueue, printOrder, requestPosters, staffOrder, STAND_MIN_LIFTERS } from "./gymPosters";
import { paperFor, printHtml, publicPosterHtml, qrTarget } from "./gymPrint";

const NOW = 1_800_000_000_000;
const ADDRESS = "20000 Fraser Hwy\nLangley BC V3A 4E7";
let gymId = "";

beforeEach(async () => {
  await resetDb();
  await savePlaces(
    placesFromOsm([{ type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { name: "Iron Works", website: "https://ironworks.ca" } }], {
      city: "Langley",
      region: "BC",
      country: "CA",
    }),
    NOW,
  );
  gymId = String((await query("SELECT id FROM gym_places"))[0]!.id);
});

const own = (lifters: number) => run("UPDATE gym_places SET claimed_by = 'acc-maria', lifters = ? WHERE id = ?", [lifters, gymId]);

describe("asking for a table stand", () => {
  it("mails a stand only to the gym's owner, once 20 lifters train there", async () => {
    expect(await requestPosters("acc-maria", { place: gymId, address: ADDRESS }, NOW)).toEqual({ ok: false, error: "owner" });
    await own(STAND_MIN_LIFTERS - 1);
    expect(await requestPosters("acc-other", { place: gymId, address: ADDRESS }, NOW)).toEqual({ ok: false, error: "owner" });
    expect(await requestPosters("acc-maria", { place: gymId, address: ADDRESS }, NOW)).toEqual({ ok: false, error: "lifters" });
    await own(STAND_MIN_LIFTERS);
    expect(await requestPosters("acc-maria", { place: gymId, address: "Langley" }, NOW)).toEqual({ ok: false, error: "address" });
    const r = await requestPosters("acc-maria", { place: gymId, address: ADDRESS, items: "both", lang: "fr" }, NOW);
    expect(r).toMatchObject({ ok: true });
    expect(await requestPosters("acc-maria", { place: gymId, address: ADDRESS }, NOW)).toEqual({ ok: false, error: "open" });
    expect(await latestOrder("acc-maria", gymId)).toMatchObject({ items: "stand", lang: "fr", status: "requested", fromGym: true });
    expect(await latestOrder("acc-other", gymId)).toBeNull();
  });
});

describe("the admin queue and print sheet", () => {
  it("keeps one claim code per order until it ships, and the code claims the gym", async () => {
    const r = await staffOrder({ place: gymId, address: ADDRESS, shipTo: "Manager" }, NOW);
    const id = (r as { order: string }).order;
    expect(await posterQueue(NOW)).toMatchObject([{ placeName: "Iron Works", items: "both", status: "requested", fromGym: false }]);
    const first = (await printOrder(id))!;
    expect(first.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect((await printOrder(id))!.code).toBe(first.code);

    const html = printHtml(first.row, first.code);
    expect(html).toContain(first.code!);
    expect(html).toContain("Manager<br>Iron Works<br>20000 Fraser Hwy");
    expect(html).toContain("Add this gym to your Liftsmith");
    expect(html).not.toMatch(/<script/i);
    expect(qrTarget(first.row)).toBe("https://www.getliftsmith.com/gyms/langley-bc/iron-works/?from=qr");
    expect(printHtml(first.row, first.code, { only: "poster" })).not.toContain(first.code!);

    const todo = await todoList(NOW);
    expect(todo.items.find((i) => i.kind === "gyms")?.title).toBe("Print posters for 1 gym");
    expect(await actOnOrder(id, "printed", NOW)).toBe(true);
    expect(await actOnOrder(id, "printed", NOW)).toBe(false);
    expect(await actOnOrder(id, "shipped", NOW)).toBe(true);
    expect((await query("SELECT claim_code FROM gym_posters WHERE id = ?", [id]))[0]!.claim_code).toBe("");
    expect(await claimWithPosterCode("acc-maria", gymId, first.code!)).toEqual({ ok: true, place: gymId });
  });

  it("prints no code for a gym that's already official", async () => {
    await own(30);
    const id = ((await staffOrder({ place: gymId, address: ADDRESS }, NOW)) as { order: string }).order;
    const sheet = (await printOrder(id))!;
    expect(sheet.code).toBeNull();
    expect(printHtml(sheet.row, null)).toContain("is already official");
  });
});

describe("the free poster page", () => {
  it("has the poster and stand cards in the reader's language, with no claim code or scripts", async () => {
    const p = (await placeById(gymId))!;
    const html = publicPosterHtml({ ...p, placeName: p.name }, "fr");
    expect(html).toContain("Ajoutez cette salle à votre Liftsmith");
    expect(html).toContain("noindex");
    expect(html).not.toContain(`class="page portrait letter"`);
    expect(html).not.toMatch(/<script/i);
    expect(paperFor("CA")).toBe("letter");
    expect(paperFor("DE")).toBe("A4");
  });
});

describe("QR scans", () => {
  it("counts each address once a day", async () => {
    await countScan(gymId, "ip:a", NOW);
    await countScan(gymId, "ip:a", NOW + 1000);
    await countScan(gymId, "ip:b", NOW);
    expect((await query("SELECT qr_scans FROM gym_places"))[0]!.qr_scans).toBe(2);
  });
});
