// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { makeGym, defaultProfile } from "./defaults";
import { distanceM, gymAt, roundPlace } from "./geo";
import { useApp } from "./store";
import type { Gym } from "./types";

const at = (g: Gym, lat: number, lon: number, radiusM = 300): Gym => ({ ...g, place: { lat, lon, radiusM } });
const home = at(makeGym("home", "kg", "home"), 47.6062, -122.3321);
const club = at(makeGym("commercial", "kg", "club"), 47.62, -122.35);
const hotel = makeGym("bodyweight", "kg", "hotel");

describe("gym by location", () => {
  it("measures distance", () => {
    expect(distanceM({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111_195, -2);
    expect(roundPlace(47.606234)).toBe(47.606);
  });

  it("picks the gym you're at and ignores gyms without a place", () => {
    expect(gymAt([home, club, hotel], { lat: 47.6063, lon: -122.3322, accuracy: 50 })?.id).toBe("home");
    expect(gymAt([home, club, hotel], { lat: 47.62, lon: -122.3501, accuracy: 100 })?.id).toBe("club");
  });

  it("doesn't guess when the fix is too rough, nothing is near, or two gyms are both plausible", () => {
    expect(gymAt([home, club], null)).toBeNull();
    expect(gymAt([home, club], { lat: 47.6063, lon: -122.3322, accuracy: 5_000 })).toBeNull();
    expect(gymAt([home, club], { lat: 48, lon: -122, accuracy: 30 })).toBeNull();
    const next = at(makeGym("commercial", "kg", "next"), 47.6070, -122.3321);
    expect(gymAt([home, next], { lat: 47.6066, lon: -122.3321, accuracy: 300 })).toBeNull();
  });
});

describe("switching the active gym", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    useApp.setState({ gyms: [home, club], profile: { ...defaultProfile(), onboarded: true, activeGymId: "home" } });
  });

  it("switches when you arrive at another gym, and says so", async () => {
    expect(await useApp.getState().pickGymByLocation({ lat: 47.62, lon: -122.35, accuracy: 80 })).toBe("club");
    expect(useApp.getState().profile.activeGymId).toBe("club");
    expect(useApp.getState().pickedByLocation).toBe("club");
  });

  it("never switches mid-workout or when no gym opted in", async () => {
    useApp.getState().replan();
    useApp.getState().start();
    expect(await useApp.getState().pickGymByLocation({ lat: 47.62, lon: -122.35, accuracy: 80 })).toBeNull();
    useApp.getState().discard();
    useApp.setState({ gyms: [hotel] });
    expect(await useApp.getState().pickGymByLocation({ lat: 47.62, lon: -122.35, accuracy: 80 })).toBeNull();
  });
});
