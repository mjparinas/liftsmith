// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { makeProfile, makeSessionStart, makeSet, makeTestGym, NOW } from "@/test/factories";

import { visitFor, visitsOn } from "./gymVisits";

// The anonymous visit a finished workout sends for its gym's owner insights (docs/decisions/gyms.md "Owner insights").
const gym = makeTestGym("commercial", "kg", { id: "g1", placeId: "abcdef0123456789" });
const events = [makeSessionStart({ sessionId: "s1", gymId: "g1" }), makeSet({ sessionId: "s1", exerciseId: "bench-press" })];
const state = (over: Parameters<typeof makeProfile>[0] = {}, gyms = [gym]) => ({
  profile: makeProfile({ gymStats: true, ...over }),
  gyms,
  events,
});

describe("visitFor", () => {
  it("sends the weekday, hour, length and equipment kinds only", () => {
    const v = visitFor(state(), "s1", NOW, NOW + 50 * 60_000)!;
    const d = new Date(NOW);
    expect(v).toMatchObject({ session: "s1", place: gym.placeId, day: d.getDay(), hour: d.getHours(), at: NOW + 50 * 60_000, minutes: 50 });
    expect(Object.keys(v).sort()).toEqual(["at", "day", "gear", "hour", "minutes", "place", "session"]);
    expect(v.gear).toContain("barbell");
    expect(JSON.stringify(v)).not.toContain("bench-press");
  });

  it("sends nothing for a gym not from the map, a short workout, the switch off or an under-18", () => {
    expect(visitFor(state({}, [{ ...gym, placeId: undefined }]), "s1", NOW, NOW + 50 * 60_000)).toBeNull();
    expect(visitFor(state(), "s1", NOW, NOW + 5 * 60_000)).toBeNull();
    expect(visitFor(state({ gymStats: false }), "s1", NOW, NOW + 50 * 60_000)).toBeNull();
    const teen = new Date().getFullYear() - 15;
    expect(visitsOn(makeProfile({ birthYear: teen, gymStats: true }))).toBe(false);
  });
});
