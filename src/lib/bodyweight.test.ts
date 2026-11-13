// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NOW } from "@/test/factories";

import { defaultProfile } from "./defaults";
import { useApp } from "./store";
import { currentKg } from "./tdee";
import { twin } from "./twin";
import { fmtBodyweight, toKg } from "./units";

// Melvin, 2026-11-13: Settings › Body weight said 142 lb while Body › Health said 143 lb. Settings read the
// profile's copy of the weight, the health figure read the newest weigh-in, and the profile syncs on its own
// (last write wins), so another device's older copy had replaced it. Both now read the newest weigh-in, with
// one rounding, and the store puts the profile's copy back whenever weigh-ins or the profile change.

const DAY = 86_400_000;
const lb142 = toKg(142, "lb");
const lb143 = toKg(143, "lb");

describe("one body weight everywhere", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ onboarded: true, unit: "lb", bodyweight: lb143 });
  });
  afterEach(() => vi.useRealTimers());

  it("puts the profile back to the newest weigh-in when sync brings an older profile", () => {
    const s = useApp.getState;
    s().logBodyweight(lb142);
    expect(s().profile.bodyweight).toBeCloseTo(lb142, 6);
    // Another device saved a setting later, carrying its older copy of the weight.
    s().applySynced({ events: [], deleted: [], gyms: null, profile: { ...s().profile, bodyweight: lb143, updatedAt: NOW + 1 } });
    expect(s().profile.bodyweight).toBeCloseTo(lb142, 6);
  });

  it("follows a newer weigh-in that arrives from another device", () => {
    const s = useApp.getState;
    s().logBodyweight(lb143);
    s().applySynced({
      events: [{ type: "bodyweight", id: "other", at: NOW + DAY, kg: lb142 }],
      deleted: [],
      gyms: null,
      profile: null,
    });
    expect(s().profile.bodyweight).toBeCloseTo(lb142, 6);
  });

  it("keeps the profile when an older weigh-in arrives", () => {
    const s = useApp.getState;
    s().logBodyweight(lb142);
    s().applySynced({ events: [{ type: "bodyweight", id: "old", at: NOW - DAY, kg: lb143 }], deleted: [], gyms: null, profile: null });
    expect(s().profile.bodyweight).toBeCloseTo(lb142, 6);
  });

  it("shows the same number on Settings and the health figure", () => {
    const events = [{ type: "bodyweight" as const, id: "w", at: NOW - DAY, kg: 64.45 }];
    const profile = { ...defaultProfile(NOW - 10 * DAY), unit: "lb" as const, bodyweight: lb143 };
    const weight = twin({ events, sessions: [], profile, now: NOW, pro: false, native: false }).find((m) => m.id === "weight");
    expect(weight?.display).toBe(fmtBodyweight(currentKg(events, profile), "lb"));
    expect(weight?.display).toBe("142.1 lb");
  });
});
