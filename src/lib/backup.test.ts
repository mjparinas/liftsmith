import { describe, expect, it } from "vitest";

import { mergeBackup, parseBackup } from "./backup";
import { defaultProfile, makeGym } from "./defaults";
import { backupJson } from "./exportData";
import type { AppEvent } from "./types";

const gym = { ...makeGym("commercial", "kg"), id: "g1" };
const profile = { ...defaultProfile(1), name: "Sam", activeGymId: "g1", onboarded: true };
const ev = (id: string, at = 1000) => ({ type: "bodyweight", id, at, kg: 80 }) as unknown as AppEvent;

describe("backup restore", () => {
  it("reads back what backupJson writes", () => {
    const b = parseBackup(backupJson(profile, [gym], [ev("a"), ev("b")]));
    expect(b?.profile.name).toBe("Sam");
    expect(b?.gyms.map((g) => g.id)).toEqual(["g1"]);
    expect(b?.events.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("refuses files that aren't a Liftsmith backup", () => {
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup(JSON.stringify({ app: "other", version: 1, profile: {}, gyms: [], events: [] }))).toBeNull();
    expect(parseBackup(JSON.stringify({ app: "liftsmith", version: 1, profile: {}, gyms: [] }))).toBeNull();
  });

  it("drops broken events and gyms, and fills missing profile fields", () => {
    const text = JSON.stringify({
      app: "liftsmith",
      version: 1,
      profile: { name: "Old" },
      gyms: [gym, { id: 3 }],
      events: [ev("ok"), { id: "x" }, null, { id: "y", type: "set", at: "soon" }],
    });
    const b = parseBackup(text)!;
    expect(b.events.map((e) => e.id)).toEqual(["ok"]);
    expect(b.gyms).toHaveLength(1);
    expect(b.profile.unit).toBeDefined();
    expect(b.profile.activeGymId).toBe("g1");
  });

  it("adds and never removes: events by id, gyms by id, the backup's profile back", () => {
    const here = {
      profile: { ...defaultProfile(5), activeGymId: "g2", onboarded: true },
      gyms: [{ ...makeGym("home", "kg"), id: "g2" }],
      events: [ev("a"), ev("local")],
    };
    const b = parseBackup(backupJson(profile, [gym], [ev("a"), ev("b"), ev("b")]))!;
    const m = mergeBackup(here, b, 99);
    expect(m.fresh.map((e) => e.id)).toEqual(["b"]);
    expect(m.gyms.map((g) => g.id).sort()).toEqual(["g1", "g2"]);
    expect(m.profile).toMatchObject({ name: "Sam", activeGymId: "g1", onboarded: true, updatedAt: 99 });
    // Restoring the same file again adds nothing.
    expect(mergeBackup({ ...here, events: [...here.events, ...m.fresh] }, b).fresh).toHaveLength(0);
  });
});
