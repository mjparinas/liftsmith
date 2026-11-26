// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sessionFields, takenStep } from "@/components/app/workout/sessionAhead";

import { defaultProfile } from "./defaults";
import { exercise } from "./exercises";
import type { PlanItem } from "./generator";
import { buildWeights } from "./pickWeights";
import { runShortcut } from "./shortcuts";
import { useApp } from "./store";
import { takenEquipment, takenPick, takenSwaps } from "./takenSwap";
import { makeTestGym } from "@/test/factories";
import { workoutWhy } from "./why";

const pro = vi.hoisted(() => ({ on: true }));
vi.mock("./billing", async (orig) => ({ ...(await orig<typeof import("./billing")>()), hasPro: () => pro.on }));

// "Machine taken" (docs/decisions/watch-apps.md): one tap on a watch or the phone swaps the exercise on screen for the
// best pick that doesn't need the busy equipment, and says why.

const gym = makeTestGym("commercial");
const plain = buildWeights([], undefined, Date.now());
const item = (exerciseId: string, over: Partial<PlanItem> = {}): PlanItem => ({
  exerciseId,
  sets: 3,
  restSec: 90,
  focus: exercise(exerciseId).primary[0]!,
  target: { weight: 50, reps: 10, rir: 2, note: "" },
  ...over,
});

describe("the Machine taken pick", () => {
  it("never needs the taken machine, and works the same main muscles", () => {
    const busy = takenEquipment("lat-pulldown");
    expect(busy).toContain("latPulldown");
    const list = takenSwaps("lat-pulldown", gym, [], [], null, plain);
    expect(list.length).toBeGreaterThan(0);
    for (const id of list) {
      expect(exercise(id).needs.some((n) => busy.includes(n))).toBe(false);
      expect(exercise(id).primary.some((m) => exercise("lat-pulldown").primary.includes(m))).toBe(true);
    }
  });

  it("goes for the favourite among the best matches", () => {
    const short = takenSwaps("lat-pulldown", gym, [], [], null, plain).slice(0, 4);
    const fav = short.at(-1)!;
    const liked = buildWeights([], { favourites: [fav] } as never, Date.now());
    expect(takenSwaps("lat-pulldown", gym, [], [], null, liked)[0]).toBe(fav);
  });

  it("skips what's already in the workout, and offers nothing for a stretch or cardio", () => {
    const first = takenSwaps("lat-pulldown", gym, [], [], null, plain)[0]!;
    expect(takenPick(item("lat-pulldown"), ["lat-pulldown", first], gym, [], null, plain)).not.toBe(first);
    expect(takenPick(item("lat-pulldown", { part: "rehab" }), [], gym, [], null, plain)).toBeNull();
    expect(takenPick(undefined, [], gym, [], null, plain)).toBeNull();
  });

  it("says what it stands in for, under the target", () => {
    const why = workoutWhy(item("cable-pullover", { takenFrom: "lat-pulldown" }), { week: { deload: false } as never, call: "normal", items: [] });
    expect(why).toContain("Lat pulldown");
  });
});

describe("Machine taken in a workout", () => {
  beforeEach(async () => {
    pro.on = true;
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
    useApp.getState().start();
  });

  it("swaps from the watch's tap, and marks the new exercise as standing in for it", () => {
    const before = useApp.getState().active!;
    const from = before.plan.items[before.index]!.exerciseId;
    expect(runShortcut("taken")).toBe("workout");
    const a = useApp.getState().active!;
    const now = a.plan.items[a.index]!;
    expect(now.exerciseId).not.toBe(from);
    expect(now.takenFrom).toBe(from);
    const swap = useApp.getState().events.findLast((e) => e.type === "swap");
    // A plain swap (not "not available here"): pick weights learn from it like any other.
    expect(swap).toMatchObject({ from, to: now.exerciseId, avoid: false });
  });

  it("is Pro, like working around taken equipment on the phone", () => {
    pro.on = false;
    const from = useApp.getState().active!.plan.items[0]!.exerciseId;
    expect(useApp.getState().takenSwap()).toBeNull();
    expect(useApp.getState().active!.plan.items[0]!.exerciseId).toBe(from);
  });

  it("works out the watches' state after the tap exactly as the swap lands", () => {
    const s = useApp.getState();
    const a = s.active!;
    const to = takenPick(a.plan.items[a.index], a.plan.items.map((i) => i.exerciseId), s.gyms[0]!, [], null, buildWeights([], s.profile.training, Date.now()));
    expect(to).toBeTruthy();
    const step = takenStep(a, s.events, s.profile, s.gyms[0]!, to!, true)!;
    useApp.getState().swap(to!, false, true);
    const f = sessionFields(useApp.getState().active!, useApp.getState().events, s.profile.unit, s.gyms[0]!)!;
    expect(step.setLabel).toBe(f.setLabel);
    expect(step.next).toBe(f.next);
    expect(step.plates).toBe(f.plates);
    expect(step.why).toContain(exercise(a.plan.items[a.index]!.exerciseId).name);
    expect(step.ahead.length).toBeGreaterThan(0);
  });
});
