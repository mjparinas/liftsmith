import { ImuRepCounter } from "./imu";
import { cameraSamples, imuSamples, randomKinds, simulateSet, type CameraNoise } from "./simulate";
import { RepTracker } from "./tracker";
import type { MotionProfile, SetSummary } from "./types";

// Accuracy harness: runs the trackers over many simulated sets and scores them against the truth.
// Used by reps.test.ts (with pass marks) and to produce the numbers in the experiment report.

export interface Score {
  sets: number;
  /** Sets where completed reps (full + grinders) were counted exactly. */
  exactReps: number;
  /** Mean absolute error in completed reps per set. */
  repMae: number;
  partial: { truth: number; found: number; hit: number };
  failed: { truth: number; found: number; hit: number };
  grinder: { truth: number; found: number; hit: number };
  /** Mean absolute error of set length (ms). */
  durationMaeMs: number;
  /** Correlation between measured and true concentric speed over full reps. */
  speedCorr: number;
}

function corr(a: number[], b: number[]) {
  const n = a.length;
  if (n < 3) return NaN;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db);
}

export function evaluate(
  source: "camera" | "imu" | "fused",
  sets: number,
  profile: MotionProfile,
  noise: CameraNoise & { imuNoise?: number; hz?: number; romDeg?: number; romM?: number } = {},
): Score {
  const s: Score = {
    sets,
    exactReps: 0,
    repMae: 0,
    partial: { truth: 0, found: 0, hit: 0 },
    failed: { truth: 0, found: 0, hit: 0 },
    grinder: { truth: 0, found: 0, hit: 0 },
    durationMaeMs: 0,
    speedCorr: 0,
  };
  const ms: number[] = [];
  const ts: number[] = [];
  for (let i = 0; i < sets; i++) {
    const kinds = randomKinds(1000 + i);
    const sim = simulateSet(kinds, 2000 + i, profile.concentricFirst);
    let sum: SetSummary;
    if (source === "camera") {
      const tr = new RepTracker(profile);
      for (const x of cameraSamples(sim, 3000 + i, {
        restDeg: profile.restHigh ? 172 : 60,
        romDeg: noise.romDeg ?? 85,
        restHigh: profile.restHigh,
        barRomM: 0.5,
        ...noise,
      }))
        tr.push({ t: x.t, pos: x.pos, bar: Number.isNaN(x.bar) ? undefined : x.bar, conf: x.conf });
      sum = tr.finish();
    } else if (source === "fused") {
      const c = new ImuRepCounter(profile);
      for (const x of imuSamples(sim, 3000 + i, {
        romM: noise.romM ?? 0.5,
        downFirst: profile.restHigh,
        noise: noise.imuNoise,
        hz: noise.hz,
      }))
        c.pushFused(x.t, x.up, x.rot);
      sum = c.finish();
    } else {
      const c = new ImuRepCounter(profile);
      for (const x of imuSamples(sim, 3000 + i, {
        romM: noise.romM ?? 0.5,
        downFirst: profile.restHigh,
        noise: noise.imuNoise,
        hz: noise.hz,
      }))
        c.push(x.t, x.x, x.y, x.z);
      sum = c.finish();
    }
    const truthDone = kinds.filter((k) => k === "full" || k === "grinder").length;
    const gotDone = sum.full;
    if (truthDone === gotDone) s.exactReps++;
    s.repMae += Math.abs(truthDone - gotDone);
    s.durationMaeMs += Math.abs((sum.durationMs ?? 0) - (sim.endMs - sim.startMs));
    // Match attempts in order when the attempt counts agree, so kinds can be scored one to one.
    const aligned = sum.reps.length === kinds.length;
    for (const [k, key] of [
      ["partial", "partial"],
      ["failed", "failed"],
    ] as const) {
      s[key].truth += kinds.filter((x) => x === k).length;
      s[key].found += sum.reps.filter((r) => r.kind === k).length;
      if (aligned) s[key].hit += kinds.filter((x, j) => x === k && sum.reps[j].kind === k).length;
    }
    s.grinder.truth += kinds.filter((x) => x === "grinder").length;
    s.grinder.found += sum.reps.filter((r) => r.grinder).length;
    if (aligned) {
      s.grinder.hit += kinds.filter((x, j) => x === "grinder" && sum.reps[j].grinder).length;
      kinds.forEach((k, j) => {
        if ((k === "full" || k === "grinder") && sum.reps[j].kind === "full") {
          ms.push(sum.reps[j].speed);
          ts.push(sim.concSpeed[j]);
        }
      });
    }
  }
  s.repMae /= sets;
  s.durationMaeMs /= sets;
  s.speedCorr = corr(ms, ts);
  return s;
}

export const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "n/a");

export function describe(name: string, s: Score) {
  return `${name}: exact reps ${pct(s.exactReps, s.sets)} of ${s.sets} sets, MAE ${s.repMae.toFixed(2)} reps; partial recall ${pct(s.partial.hit, s.partial.truth)} precision ${pct(s.partial.hit, s.partial.found)}; failed recall ${pct(s.failed.hit, s.failed.truth)} precision ${pct(s.failed.hit, s.failed.found)}; grinder recall ${pct(s.grinder.hit, s.grinder.truth)} precision ${pct(s.grinder.hit, s.grinder.found)}; set length MAE ${(s.durationMaeMs / 1000).toFixed(2)} s; speed r=${s.speedCorr.toFixed(2)}`;
}
