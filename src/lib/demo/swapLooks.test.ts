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
  const LOOK_ALIKES = 222;
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

describe("walks that travel", () => {
  // Melvin, 2026-11-14: the audit found band walks, shuffles and skaters playing cossack squats in place.
  const span = (id: string, axis: 0 | 2) => {
    const m = motionFor(id);
    const v = Array.from({ length: 41 }, (_, i) => jointsAt(m, B, i / 40).hipC[axis]);
    return Math.max(...v) - Math.min(...v);
  };
  it("moves sideways on side walks, shuffles, skaters and the sideways sled drag", () => {
    for (const id of ["band-lateral-walk", "lateral-shuffle", "lateral-squat-walk", "sled-lateral-drag", "skater-jumps", "lateral-bound"])
      expect(span(id, 2), id).toBeGreaterThan(0.3);
  });
  it("moves forward and back on the monster walk, squat walk and crab walk", () => {
    for (const id of ["band-monster-walk", "duck-walk", "crab-walk"]) expect(span(id, 0), id).toBeGreaterThan(0.25);
    // the crab walk faces up: hands behind the shoulders' line, feet in front
    const J = jointsAt(motionFor("crab-walk"), B, 0);
    expect(J.handL[0]).toBeLessThan(J.hipC[0] - 0.3);
    expect(J.ankleL[0]).toBeGreaterThan(J.hipC[0] + 0.2);
  });
  it("lands skater jumps on one leg with the other swept behind", () => {
    const J = jointsAt(motionFor("skater-jumps"), B, 1);
    expect(J.ankleL[1]).toBeGreaterThan(J.ankleR[1] + 0.15);
    expect(J.ankleL[0]).toBeLessThan(J.ankleR[0] - 0.2);
  });
  it("walks backwards on the backward treadmill walk and elliptical", () => {
    expect(motionFor("backward-treadmill-walk").phases[0]![1]).toBe(1);
    expect(motionFor("elliptical-backward").phases[0]![2]).toBe(0);
  });
});

describe("floor positions", () => {
  // Melvin, 2026-11-14 audit: reverse planks and walkouts played glute bridges, side-lying moves a side plank,
  // handstands pike push-ups and several planks the forearm plank.
  const at = (id: string, d = 0) => jointsAt(motionFor(id), B, d);
  it("faces up on the reverse plank, hands behind on straight arms and heels down", () => {
    const J = at("reverse-plank");
    expect(J.handL[0]).toBeLessThan(J.hipC[0] - 0.3);
    expect(J.elbowL[1]).toBeGreaterThan(0.2);
    expect(J.hipC[1]).toBeGreaterThan(0.3);
  });
  it("walks the heels out on walkouts and slides them on slider leg curls", () => {
    for (const id of ["hamstring-walkout", "slider-leg-curl"]) expect(at(id, 0.5).ankleL[0], id).toBeGreaterThan(at(id, 0).ankleL[0] + 0.3);
  });
  it("lies flat on the side for side-lying moves", () => {
    for (const id of ["side-lying-leg-raise", "band-clamshell", "side-lying-adduction"]) expect(motionFor(id).roll?.(0), id).toBe(-90);
  });
  it("stacks handstands over the hands and walks up the wall", () => {
    const H = at("freestanding-handstand");
    expect(H.ankleL[1]).toBeGreaterThan(H.hipC[1] + 0.7);
    expect(H.hipC[1]).toBeGreaterThan(H.shC[1] + 0.4);
    expect(at("handstand-push-up", 1).head[1]).toBeLessThan(at("handstand-push-up", 0).head[1] - 0.2);
    expect(at("wall-walk", 0.5).ankleL[1]).toBeGreaterThan(at("wall-walk", 0).ankleL[1] + 0.8);
  });
  it("puts the knee plank on the knees and the high-hand planks on straight arms", () => {
    expect(at("knee-plank").kneeL[1]).toBeLessThan(0.12);
    for (const id of ["ring-plank", "planche-lean", "plank-pull-through"]) expect(at(id).elbowL[1], id).toBeGreaterThan(0.2);
    expect(at("plank-to-pike", 1).hipC[1]).toBeGreaterThan(at("plank-to-pike", 0).hipC[1] + 0.3);
  });
});

describe("push-up variations", () => {
  // Melvin, 2026-11-14 audit: these all played the plain push-up.
  const at = (id: string, d: number) => jointsAt(motionFor(id), B, d);
  it("claps in the air, brings a knee to the elbow, shifts to one hand and slides across", () => {
    const air = at("clap-push-up", -0.3);
    expect(air.handL[1]).toBeGreaterThan(0.2);
    expect(air.handR[2] - air.handL[2]).toBeLessThan(0.15);
    const knee = at("spiderman-push-up", 0.5);
    expect(knee.kneeL[2]).toBeLessThan(-0.3);
    expect(knee.kneeL[0]).toBeGreaterThan(at("spiderman-push-up", 0).kneeL[0] + 0.2);
    expect(Math.abs(at("archer-push-up", 0.5).shC[2])).toBeGreaterThan(0.15);
    expect(Math.abs(at("typewriter-push-up", 0.375).shC[2])).toBeGreaterThan(0.15);
  });
  it("keeps one hand off the floor on the one-arm push-up and lifts both on hand-release push-ups", () => {
    expect(at("one-arm-push-up", 0).handL[1]).toBeGreaterThan(0.3);
    const off = at("hand-release-push-up", 1.4);
    expect(Math.min(off.handL[1], off.handR[1])).toBeGreaterThan(0.08);
    const tap = at("shoulder-tap-push-up", -0.5);
    expect(tap.handL[1]).toBeGreaterThan(0.2);
  });
  it("opens the arms on ring flys and bends the elbows overhead on bodyweight skull crushers", () => {
    const fly = at("ring-fly", 1);
    expect(fly.handR[2] - fly.handL[2]).toBeGreaterThan(1);
    const top = at("bodyweight-skull-crusher", 0),
      bottom = at("bodyweight-skull-crusher", 1);
    expect(bottom.head[1]).toBeLessThan(top.head[1] - 0.1);
    expect(top.handR[1]).toBeGreaterThan(0.6);
  });
});

describe("jumps and hops", () => {
  // Melvin, 2026-11-14 audit: these played the jump squat, a calf raise, a back lunge or a jog.
  const m = (id: string) => motionFor(id);
  const at = (id: string, d: number) => jointsAt(m(id), B, d);
  const air = (id: string, d: number) => Math.min(at(id, d).ankleL[1], at(id, d).ankleR[1]);
  it("leaves the floor on every jump and hop, rope jumps included", () => {
    for (const id of ["jump-rope", "double-unders", "pogo-hops", "pogo-jumps", "tuck-jump", "squat-jack", "line-hops"])
      expect(air(id, 0.25), id).toBeGreaterThan(air(id, 0) + 0.04);
  });
  it("travels: forward on broad and frog jumps, sideways on lateral hops and line hops", () => {
    expect(at("broad-jump", 0.5).hipC[0]).toBeGreaterThan(at("broad-jump", 0).hipC[0] + 0.8);
    expect(at("frog-jump", 0.5).hipC[0]).toBeGreaterThan(at("frog-jump", 0).hipC[0] + 0.6);
    expect(at("lateral-hop", 0.5).hipC[2] - at("lateral-hop", 0).hipC[2]).toBeGreaterThan(0.4);
    expect(at("line-hops", 0.5).hipC[2] - at("line-hops", 0).hipC[2]).toBeGreaterThan(0.2);
  });
  it("hops on one leg, tucks the knees, lands wide and turns half way round", () => {
    const one = at("single-leg-hop", 0);
    expect(one.ankleL[1]).toBeGreaterThan(one.ankleR[1] + 0.2);
    const tuck = at("tuck-jump", 0.25);
    expect(tuck.kneeL[1]).toBeGreaterThan(tuck.hipC[1] - 0.25);
    const jack = (d: number) => at("squat-jack", d).ankleR[2] - at("squat-jack", d).ankleL[2];
    expect(jack(0.5)).toBeGreaterThan(jack(0) + 0.3);
    expect(m("squat-jump-180").yaw?.(0.5)).toBe(180);
    expect(m("jump-squat").yaw).toBeUndefined();
  });
  it("switches legs in the air on jumping lunges and crosses behind on curtsy lunges", () => {
    expect(at("jumping-lunge", 0).ankleR[0]).toBeGreaterThan(at("jumping-lunge", 0).ankleL[0] + 0.5);
    expect(at("jumping-lunge", 0.5).ankleL[0]).toBeGreaterThan(at("jumping-lunge", 0.5).ankleR[0] + 0.5);
    const c = at("curtsy-lunge", 1);
    expect(c.ankleL[2]).toBeGreaterThan(c.ankleR[2]);
    expect(c.ankleL[0]).toBeLessThan(c.ankleR[0] - 0.3);
  });
  it("kicks the heels up on butt kicks and drops the back knee on skater and shrimp squats", () => {
    const k = at("butt-kicks", 1);
    expect(k.ankleL[1]).toBeGreaterThan(k.kneeL[1] + 0.2);
    expect(k.ankleR[1]).toBeLessThan(0.15);
    for (const id of ["skater-squat", "shrimp-squat"]) {
      const bottom = at(id, 1);
      expect(bottom.kneeL[1], id).toBeLessThan(0.15);
      expect(bottom.ankleL[1], id).toBeGreaterThan(0.05);
    }
    const shrimp = at("shrimp-squat", 1);
    expect(Math.hypot(shrimp.handL[0] - shrimp.ankleL[0], shrimp.handL[1] - shrimp.ankleL[1])).toBeLessThan(0.2);
  });
});

describe("hangs, one-leg squats and lifts", () => {
  // Melvin, 2026-11-14 audit: these played a pull-up, a hanging knee raise, a two-leg squat, a back
  // squat, a standing pulldown or a deadlift.
  const m = (id: string) => motionFor(id);
  const at = (id: string, d: number) => jointsAt(m(id), B, d);
  it("gets over the bar on muscle-ups and turns the body around it on skin the cat and the tuck front lever", () => {
    for (const id of ["muscle-up", "ring-muscle-up"]) {
      const top = at(id, 1);
      expect(top.shC[1], id).toBeGreaterThan(top.handR[1] + 0.4);
    }
    const inverted = at("skin-the-cat", 2 / 3);
    expect(inverted.hipC[1]).toBeGreaterThan(inverted.shC[1] + 0.3);
    const lever = at("tuck-front-lever", 1);
    expect(Math.abs(lever.hipC[1] - lever.shC[1])).toBeLessThan(0.1);
  });
  it("swings the legs side to side on windshield wipers and moves over one hand on archer and typewriter pull-ups", () => {
    expect(at("windshield-wiper", 1).ankleR[2]).toBeGreaterThan(0.6);
    expect(at("windshield-wiper", 0).ankleL[2]).toBeLessThan(-0.6);
    expect(at("archer-pull-up", 1).shC[2] - at("archer-pull-up", 0).shC[2]).toBeGreaterThan(0.35);
    expect(at("typewriter-pull-up", 0.55).shC[2]).toBeGreaterThan(0.15);
  });
  it("pulls the power clean from the floor and holds the bar overhead on the overhead squat", () => {
    expect(m("power-clean").pose(B, 2).bar![1]).toBeLessThan(0.3);
    const ohs = at("overhead-squat", 1);
    expect(ohs.handR[1]).toBeGreaterThan(ohs.head[1]);
  });
  it("squats on one leg on pistols and the one-leg wall sit, and holds still against the wall", () => {
    for (const id of ["pistol-squat", "box-pistol-squat", "assisted-pistol-squat", "single-leg-wall-sit"]) {
      const bottom = at(id, 1);
      expect(bottom.ankleL[1], id).toBeGreaterThan(0.1);
      expect(bottom.ankleL[0], id).toBeGreaterThan(bottom.kneeL[0]);
    }
    expect(m("wall-sit").phases.some((p) => p[3] === "Hold" && p[1] === p[2])).toBe(true);
    const sissy = at("sissy-squat", 1);
    expect(sissy.kneeR[0]).toBeGreaterThan(sissy.ankleR[0] + 0.3);
    expect(sissy.shC[0]).toBeLessThan(sissy.kneeR[0]);
  });
  it("lies on a bench for pullovers and slams the ball into the floor", () => {
    for (const id of ["db-pullover", "barbell-pullover", "kb-pullover"]) {
      expect(Math.abs(at(id, 0).hipC[1] - at(id, 0).shC[1]), id).toBeLessThan(0.05);
      expect(at(id, 1).handR[0], id).toBeLessThan(at(id, 1).shC[0]);
    }
    expect(at("med-ball-slam", 0).handR[1]).toBeGreaterThan(at("med-ball-slam", 0).head[1]);
    expect(at("med-ball-slam", 1).handR[1]).toBeLessThan(0.4);
  });
});

describe("the rest of the audit", () => {
  // Melvin, 2026-11-14 audit: these played a row, a carry, a calf raise, a donkey kick, a glute
  // kickback, standing still, a mountain climber, a machine press, a dead bug, a burpee, a swing or
  // a Pallof press.
  const m = (id: string) => motionFor(id);
  const at = (id: string, d: number) => jointsAt(m(id), B, d);
  it("straightens the arm back on triceps kickbacks", () => {
    for (const id of ["db-kickback", "band-kickback", "cable-triceps-kickback"]) {
      expect(at(id, 1).handR[0], id).toBeLessThan(at(id, 1).elbowR[0] - 0.15);
      expect(at(id, 0).handR[1], id).toBeLessThan(at(id, 0).elbowR[1] - 0.15);
    }
  });
  it("pulls a sled on a strap, lifts the toes, and moves the leg out, across or up behind", () => {
    for (const id of ["sled-drag", "sled-pull", "sled-row"])
      expect(
        m(id)
          .props?.(B)
          .some((p) => p.kind === "box"),
        id,
      ).toBe(true);
    expect(m("tibialis-raise").pose(B, 1).foot).toBeLessThan(-20);
    expect(at("fire-hydrant", 1).kneeR[2]).toBeGreaterThan(at("fire-hydrant", 0).kneeR[2] + 0.25);
    expect(at("cable-hip-abduction", 1).ankleR[2]).toBeGreaterThan(0.45);
    expect(at("cable-hip-adduction", 1).ankleR[2]).toBeLessThan(0);
    expect(at("cable-standing-leg-curl", 1).ankleR[1]).toBeGreaterThan(at("cable-standing-leg-curl", 1).kneeR[1]);
  });
  it("bends sideways on side bends and lifts a knee to the side on the standing oblique crunch", () => {
    for (const id of ["db-side-bend", "kb-side-bend"]) expect(at(id, 1).shC[2] - at(id, 1).hipC[2], id).toBeGreaterThan(0.15);
    expect(at("cable-side-bend", 1).shC[2] - at("cable-side-bend", 0).shC[2]).toBeGreaterThan(0.25);
    expect(at("standing-oblique-crunch", 1).kneeR[2]).toBeGreaterThan(0.3);
  });
  it("punches, tucks both knees, passes the ball and presses the dip handles down", () => {
    expect(at("shadow-boxing", 0.25).handL[0]).toBeGreaterThan(at("shadow-boxing", 0).handL[0] + 0.3);
    expect(at("shadow-boxing", 0.75).handR[0]).toBeGreaterThan(at("shadow-boxing", 0.5).handR[0] + 0.3);
    for (const id of ["ring-knee-tuck", "slider-knee-tuck"]) {
      const tuck = at(id, 1);
      expect(Math.abs(tuck.ankleL[0] - tuck.ankleR[0]), id).toBeLessThan(0.02);
      expect(tuck.ankleL[0], id).toBeGreaterThan(at(id, 0).ankleL[0] + 0.4);
    }
    expect(at("med-ball-chest-pass", 1).handR[0]).toBeGreaterThan(at("med-ball-chest-pass", 0).handR[0] + 0.3);
    expect(at("seated-dip-machine", 1).handR[1]).toBeLessThan(at("seated-dip-machine", 0).handR[1] - 0.3);
  });
  it("slides a heel out, snatches the dumbbells overhead, figure-eights the bell and holds the Pallof press out", () => {
    expect(at("heel-slide", 0.25).ankleL[0]).toBeGreaterThan(at("heel-slide", 0).ankleL[0] + 0.25);
    expect(at("db-devil-press", 3 / 8).hipC[1]).toBeLessThan(0.5);
    expect(at("db-devil-press", 7 / 8).handR[1]).toBeGreaterThan(at("db-devil-press", 7 / 8).head[1]);
    expect(at("kb-figure-eight", 0.25).handR[2]).toBeGreaterThan(0.15);
    expect(at("kb-figure-eight", 0.75).handR[2]).toBeLessThan(-0.05);
    for (const id of ["pallof-squat", "pallof-reverse-lunge"]) {
      expect(at(id, 1).hipC[1], id).toBeLessThan(at(id, 0).hipC[1] - 0.2);
      expect(at(id, 1).handR[0] - at(id, 1).shC[0], id).toBeGreaterThan(0.4);
    }
  });
  it("curls then presses, and leans back from the rings into a curl, a face pull, a Y and a reverse fly", () => {
    const top = at("hammer-curl-to-press", 1);
    expect(top.handR[1]).toBeGreaterThan(top.head[1]);
    expect(at("ring-biceps-curl", 1).handR[1]).toBeGreaterThan(at("ring-biceps-curl", 1).shR[1]);
    expect(at("ring-y-raise", 1).handR[2]).toBeGreaterThan(0.45);
    expect(at("ring-reverse-fly", 1).handR[2]).toBeGreaterThan(0.6);
    expect(at("ring-face-pull", 1).elbowR[2]).toBeGreaterThan(0.3);
  });
});

describe("one-arm moves", () => {
  // Melvin, 2026-11-14: the one-arm dumbbell bench press pressed with both hands.
  const at = (id: string, d: number) => jointsAt(motionFor(id), B, d);
  const moved = (id: string, k: "handL" | "handR") => Math.hypot(...at(id, 0)[k].map((x, i) => x - at(id, 1)[k][i]!));
  it("works the right arm while the left hand rests on the hip", () => {
    for (const id of [
      "db-single-arm-bench",
      "kb-single-arm-bench-press",
      "db-one-arm-floor-press",
      "db-single-arm-press",
      "single-arm-cable-row",
      "single-arm-machine-press",
      "one-arm-cable-pulldown",
    ]) {
      expect(moved(id, "handR"), id).toBeGreaterThan(0.3);
      expect(moved(id, "handL"), id).toBeLessThan(0.15);
      expect(motionFor(id).hold, id).toBe("R");
    }
  });
});
