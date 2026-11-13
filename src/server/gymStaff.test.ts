import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { encodeRoutine } from "@/lib/routineShare";

import { query, resetDb, run } from "./db";
import { claimDeletes, editGym, ownedGyms, releaseGym } from "./gymClaims";
import { ownerExtras, postNews } from "./gymExtras";
import { addMedia } from "./gymMedia";
import { gymHtml } from "./gymPage";
import { placeById, placesFromOsm, savePlaces } from "./gymPlaces";
import { cancelInvite, canManage, invitePreview, inviteStaff, joinStaff, managersOf, removeStaff, STAFF_LIMITS, staffOf } from "./gymStaff";
import { setPushSender, type PushMessage } from "./push";

// Staff accounts and the starter program (docs/decisions/gyms.md "Staff and the starter program").
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const sent: PushMessage[] = [];

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
  await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [gym]);
});
afterEach(() => setPushSender(null));

async function hire(who: string, name = "Sam") {
  const inv = await inviteStaff("acc-owner", gym, NOW);
  if (!inv.ok) throw new Error(inv.error);
  const r = await joinStaff(who, inv.code, name, NOW);
  if (!r.ok) throw new Error(r.error);
}

describe("staff invites", () => {
  it("lets the owner invite someone who then manages the gym with them", async () => {
    const inv = await inviteStaff("acc-owner", gym, NOW);
    expect(inv).toMatchObject({ ok: true, expiresAt: NOW + STAFF_LIMITS.inviteMs });
    if (!inv.ok) return;
    expect(inv.code).toMatch(/^[2-9A-HJ-NP-Z]{10}$/);
    expect(await invitePreview(inv.code, NOW)).toEqual({ place: gym, name: "Iron Works" });
    expect(await canManage("acc-sam", gym)).toBe(false);
    expect(await joinStaff("acc-sam", inv.code, "Sam", NOW)).toEqual({ ok: true, place: gym, name: "Iron Works" });
    expect(await canManage("acc-sam", gym)).toBe(true);
    // The invite is used up: a second person can't use the same link.
    expect(await joinStaff("acc-other", inv.code, "Other", NOW)).toEqual({ ok: false, error: "gone" });
    // The staff member sees the gym on their owner's page list, as staff.
    expect(await ownedGyms("acc-sam", NOW)).toMatchObject([{ id: gym, role: "staff" }]);
    expect(await ownedGyms("acc-owner", NOW)).toMatchObject([{ id: gym, role: "owner" }]);
  });

  it("only lets the owner invite, and runs out after a week", async () => {
    expect(await inviteStaff("acc-stranger", gym, NOW)).toEqual({ ok: false, error: "owner" });
    await hire("acc-sam");
    // Staff can't invite more staff.
    expect(await inviteStaff("acc-sam", gym, NOW)).toEqual({ ok: false, error: "owner" });
    const inv = await inviteStaff("acc-owner", gym, NOW);
    if (!inv.ok) throw new Error("no invite");
    expect(await joinStaff("acc-late", inv.code, "Late", NOW + 8 * DAY)).toEqual({ ok: false, error: "gone" });
  });

  it("caps open invites and staff per gym", async () => {
    for (let i = 0; i < STAFF_LIMITS.openInvites; i++) expect((await inviteStaff("acc-owner", gym, NOW)).ok).toBe(true);
    expect(await inviteStaff("acc-owner", gym, NOW)).toEqual({ ok: false, error: "full" });
    const view = await staffOf("acc-owner", gym, NOW);
    expect(view?.invites).toHaveLength(STAFF_LIMITS.openInvites);
    // Cancelling one frees a slot.
    expect(await cancelInvite("acc-owner", gym, view!.invites[0]!.code)).toBe(true);
    expect((await inviteStaff("acc-owner", gym, NOW)).ok).toBe(true);
  });

  it("doesn't let the owner join their own staff, and checks the name", async () => {
    const inv = await inviteStaff("acc-owner", gym, NOW);
    if (!inv.ok) throw new Error("no invite");
    expect(await joinStaff("acc-owner", inv.code, "Me", NOW)).toEqual({ ok: false, error: "owner" });
    expect(await joinStaff("acc-sam", inv.code, "  ", NOW)).toEqual({ ok: false, error: "name" });
    // The invite still works after those.
    expect((await joinStaff("acc-sam", inv.code, "Sam", NOW)).ok).toBe(true);
  });
});

describe("what staff can do", () => {
  it("edits the page, posts news and sees the owner's view, but can't let the gym go", async () => {
    await hire("acc-sam");
    expect(await editGym("acc-sam", { place: gym, hours: "24/7" })).toEqual({ ok: true });
    expect((await placeById(gym))?.hours).toBe("24/7");
    expect((await postNews("acc-sam", gym, "New racks are in", NOW)).ok).toBe(true);
    expect(await ownerExtras("acc-sam", gym, NOW)).not.toBeNull();
    expect((await addMedia("acc-stranger", { place: gym, kind: "logo", image: "data:image/jpeg;base64,/9j/4A==" }, NOW)).ok).toBe(false);
    expect(await releaseGym("acc-sam", gym, NOW)).toBe(false);
    expect((await placeById(gym))?.official).toBe(true);
  });

  it("tells the owner and staff about a problem report", async () => {
    await hire("acc-sam");
    expect(await managersOf(gym)).toEqual(["acc-owner", "acc-sam"]);
  });

  it("shows staff names to managers only, never account ids", async () => {
    await hire("acc-sam", "Sam at the desk");
    const view = await staffOf("acc-owner", gym, NOW);
    expect(view?.staff).toMatchObject([{ name: "Sam at the desk", me: false }]);
    expect(JSON.stringify(view)).not.toContain("acc-sam");
    expect((await staffOf("acc-sam", gym, NOW))?.staff[0]?.me).toBe(true);
    // Staff don't see open invite codes.
    await inviteStaff("acc-owner", gym, NOW);
    expect((await staffOf("acc-sam", gym, NOW))?.invites).toEqual([]);
    expect(await staffOf("acc-stranger", gym, NOW)).toBeNull();
  });
});

describe("leaving and removing", () => {
  it("the owner removes someone by the list's id; staff can leave", async () => {
    await hire("acc-sam");
    await hire("acc-kim", "Kim");
    const kim = (await staffOf("acc-owner", gym, NOW))!.staff.find((m) => m.name === "Kim")!;
    expect(await removeStaff("acc-sam", gym, kim.id)).toBe(false);
    expect(await removeStaff("acc-owner", gym, kim.id)).toBe(true);
    expect(await canManage("acc-kim", gym)).toBe(false);
    expect(await removeStaff("acc-sam", gym)).toBe(true);
    expect(await canManage("acc-sam", gym)).toBe(false);
  });

  it("letting the gym go ends every staff place", async () => {
    await hire("acc-sam");
    expect(await releaseGym("acc-owner", gym, NOW)).toBe(true);
    expect(await canManage("acc-sam", gym)).toBe(false);
    expect(await query("SELECT * FROM gym_staff")).toEqual([]);
  });

  it("deleting the owner's account ends the staff too", async () => {
    await hire("acc-sam");
    await inviteStaff("acc-owner", gym, NOW);
    for (const st of claimDeletes("acc-owner")) await run(st.sql, st.args);
    expect(await query("SELECT * FROM gym_staff")).toEqual([]);
    expect(await query("SELECT * FROM gym_staff_invites")).toEqual([]);
  });
});

describe("the starter program", () => {
  const routine = {
    name: "Iron Works starter",
    items: [
      { exerciseId: "goblet-squat", sets: 3 },
      { exerciseId: "bench-press", sets: 3 },
    ],
  };

  it("is set by the owner or staff and shows on the gym's page with a link that saves it in the app", async () => {
    await hire("acc-sam");
    const code = encodeRoutine(routine);
    expect(await editGym("acc-sam", { place: gym, starter: code })).toEqual({ ok: true });
    const p = (await placeById(gym))!;
    expect(p.starter).toBe(code);
    expect((await ownedGyms("acc-owner", NOW))[0]?.starter).toBe(code);
    const html = gymHtml(p, [], "en");
    expect(html).toContain("Starter program");
    expect(html).toContain("Iron Works starter");
    expect(html).toContain("3 × Goblet squat");
    expect(html).toContain(`/app/#/routine/${code}`);
    // In another language the exercise names follow.
    expect(gymHtml(p, [], "es")).toContain("Programa de inicio");
    // Clearing it takes it off.
    await editGym("acc-owner", { place: gym, starter: "" });
    expect((await placeById(gym))?.starter).toBe("");
    expect(gymHtml((await placeById(gym))!, [], "en")).not.toContain("Starter program");
  });

  it("refuses codes that aren't routines, and names that fail the word check", async () => {
    expect(await editGym("acc-owner", { place: gym, starter: "r1~~not-an-exercise.3" })).toEqual({ ok: false, error: "starter" });
    expect(await editGym("acc-owner", { place: gym, starter: "<script>" })).toEqual({ ok: false, error: "starter" });
    expect(await editGym("acc-stranger", { place: gym, starter: encodeRoutine(routine) })).toEqual({ ok: false, error: "owner" });
  });
});
