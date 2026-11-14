import { describe, expect, it } from "vitest";

import { EXERCISES } from "../exercises";
import { alternatives } from "../generator";
import { jointsAt } from "./mesh";
import { motionFor } from "./motions";
import { BODIES } from "./rig";

const B = BODIES.male;
const props = (id: string) => motionFor(id).props?.(B) ?? [];
const cables = (id: string) => props(id).filter((p) => p.kind === "cable");
const rails = (id: string) => props(id).filter((p) => p.kind === "rail");

/** Everything the demo draws for an exercise over one rep. */
function look(id: string): string {
  const m = motionFor(id);
  const frames = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((d) => jointsAt(m, B, d));
  return JSON.stringify([frames, m.props?.(B) ?? [], m.load, m.hold, m.phases, m.plates]);
}

describe("each exercise's own gear in the demo", () => {
  it("holds what the exercise uses", () => {
    expect(motionFor("db-pullover").load).toBe("dumbbell");
    expect(cables("db-pullover")).toHaveLength(0); // no pulley for a dumbbell
    expect(motionFor("cable-pullover").load).toBe("handle");
    expect(motionFor("med-ball-slam").load).toBe("ball");
    expect(motionFor("kb-goblet-squat").load).toBe("kettlebell");
    expect(motionFor("bodyweight-squat").load).toBe("none");
  });

  it("racks a bar on the back of a barbell lunge, behind the neck", () => {
    expect(motionFor("reverse-lunge").load).toBe("none");
    const m = motionFor("barbell-reverse-lunge");
    expect(m.load).toBe("barbell");
    for (const d of [0, 0.5, 1]) {
      const J = jointsAt(m, B, d);
      expect(J.bar![1]).toBeGreaterThan(J.shC[1] - 0.1);
      expect(J.bar![0]).toBeLessThan(J.neck[0]);
    }
  });

  it("draws bands from the feet, ring straps from overhead and Smith rails", () => {
    expect(cables("band-curl").map((c) => c.from)).toEqual(["ankleL", "ankleR"]);
    expect(motionFor("band-row").load).toBe("none"); // a band has no handle bar
    const straps = cables("ring-dip");
    expect(straps).toHaveLength(2);
    expect(cables("dip")).toHaveLength(0);
    expect(rails("smith-row")).toHaveLength(2);
    expect(rails("barbell-row")).toHaveLength(0);
  });
});

describe("variations the name gives", () => {
  it("curls one arm at a time on an alternating curl", () => {
    const m = motionFor("db-alternating-curl");
    const rest = jointsAt(m, B, 0);
    const left = jointsAt(m, B, 0.25);
    const right = jointsAt(m, B, 0.75);
    expect(left.handL[1]).toBeGreaterThan(rest.handL[1] + 0.2);
    expect(left.handR[1]).toBeCloseTo(rest.handR[1], 2);
    expect(right.handR[1]).toBeGreaterThan(rest.handR[1] + 0.2);
    expect(right.handL[1]).toBeCloseTo(rest.handL[1], 2);
  });

  it("lowers slowly on a negative and holds still on a hold", () => {
    expect(motionFor("negative-dip").phases.map((p) => p[3])).toContain("Lower · 4s");
    expect(motionFor("negative-pull-up").phases.map((p) => p[3])).toContain("Lower · 4s");
    const hold = motionFor("db-shrug-hold").phases.find((p) => p[3] === "Hold")!;
    expect(hold[1]).toBe(1);
    expect(hold[2]).toBe(1);
  });
});

describe("swaps look different", () => {
  // Melvin, 2026-11-12: "different exercises with the same animations". The swap sheet's top six
  // for every lift, counted where both draw exactly the same thing. A ratchet: lower it as moves get
  // their own motions, never raise it. What's left is mostly true twins (steady and interval cardio,
  // jump rope and battle rope styles) and close cousins still sharing a pose.
  const LOOK_ALIKES = 286;
  it(`leaves at most ${LOOK_ALIKES} look-alike swap pairs`, () => {
    const looks = new Map<string, string>();
    const of = (id: string) => looks.get(id) ?? (looks.set(id, look(id)), looks.get(id)!);
    const same = new Set<string>();
    for (const e of EXERCISES)
      for (const a of alternatives(e.id, null).slice(0, 6)) if (of(e.id) === of(a.id)) same.add([e.id, a.id].sort().join(" "));
    expect(same.size).toBeLessThanOrEqual(LOOK_ALIKES);
  });
});

describe("planks and crawls that move", () => {
  // Melvin, 2026-11-13: the sideways plank walk showed a forearm plank holding still.
  const at = (id: string, d: number) => jointsAt(motionFor(id), B, d);
  const ds = (id: string) => {
    const n = motionFor(id).phases.length;
    return Array.from({ length: n * 4 + 1 }, (_, i) => i / (n * 4));
  };

  it("walks the sideways plank on straight arms, hips level, out to one side and back", () => {
    const zs = ds("lateral-plank-walk").map((d) => at("lateral-plank-walk", d));
    const hipZ = zs.map((J) => J.hipC[2]);
    expect(Math.max(...hipZ) - Math.min(...hipZ)).toBeGreaterThan(0.3);
    expect(hipZ[0]).toBeCloseTo(hipZ[hipZ.length - 1]!, 5);
    const hipY = zs.map((J) => J.hipC[1]);
    expect(Math.max(...hipY) - Math.min(...hipY)).toBeLessThan(0.005);
    // on the hands, not the forearms: the elbows stay well off the floor
    for (const J of zs) expect(Math.min(J.elbowL[1], J.elbowR[1])).toBeGreaterThan(0.2);
    // the right hand and right foot step out together
    const q = at("lateral-plank-walk", 1 / 16);
    const s = at("lateral-plank-walk", 0);
    expect(q.handR[1]).toBeGreaterThan(s.handR[1] + 0.03);
    expect(q.ankleR[1]).toBeGreaterThan(s.ankleR[1] + 0.02);
    expect(q.handL[1]).toBeCloseTo(s.handL[1], 3);
  });

  it("moves the sideways bear crawl to the side and the backward one backwards", () => {
    const side = ds("lateral-bear-crawl").map((d) => at("lateral-bear-crawl", d).hipC[2]);
    expect(Math.max(...side) - Math.min(...side)).toBeGreaterThan(0.25);
    const back = ds("backward-bear-crawl").map((d) => at("backward-bear-crawl", d).hipC[0]);
    expect(back[0]! - Math.min(...back)).toBeGreaterThan(0.3);
    expect(look("bear-crawl")).not.toBe(look("lateral-bear-crawl"));
  });

  it("jumps the feet wide on plank jacks, taps shoulders, and goes forearms to hands on up-downs", () => {
    const j0 = at("plank-jack", 0),
      j1 = at("plank-jack", 1);
    expect(j1.ankleR[2] - j1.ankleL[2]).toBeGreaterThan(j0.ankleR[2] - j0.ankleL[2] + 0.5);
    const tap = at("plank-shoulder-tap", 0.25);
    expect(tap.handL[2]).toBeGreaterThan(0.05); // across to the right shoulder
    expect(tap.handL[1]).toBeGreaterThan(0.2);
    const down = at("plank-up-down", 0),
      up = at("plank-up-down", 0.5);
    expect(down.elbowL[1]).toBeLessThan(0.12);
    expect(up.elbowL[1]).toBeGreaterThan(0.2);
    expect(at("high-plank", 0).elbowL[1]).toBeGreaterThan(0.2);
  });
});
