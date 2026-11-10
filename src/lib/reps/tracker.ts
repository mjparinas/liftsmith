import type { MotionProfile, MotionSample, Rep, RepKind, SetSummary } from "./types";

// The rep tracker: one state machine for every source. It follows how far the lifter is from their
// rest position (standing tall, arms locked), counts an attempt each time they leave it and come back,
// and grades each attempt when it ends: full, partial (well short of the set's deepest rep) or failed
// (never made it back). Speed comes from the bar point when the scale is known, otherwise from the
// signal itself, so velocity loss, grinders and a rough RIR work either way.

/** One Euro filter (Casiez et al. 2012): smooths jitter at rest without lagging fast movement. */
export class OneEuro {
  private x?: number;
  private dx = 0;
  private t?: number;
  constructor(
    private minCutoff = 1.5,
    private beta = 0.02,
    private dCutoff = 1,
  ) {}
  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(value: number, tMs: number): number {
    if (this.x === undefined || this.t === undefined) {
      this.x = value;
      this.t = tMs;
      return value;
    }
    const dt = Math.max(1e-3, (tMs - this.t) / 1000);
    this.t = tMs;
    const rawDx = (value - this.x) / dt;
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (rawDx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += OneEuro.alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }
}

export interface TrackerOptions {
  /** An attempt that hasn't come back this long after its turnaround is failed. */
  failMs?: number;
  /** Tracking lost this long while away from rest ends the attempt as failed. */
  lostMs?: number;
  /** After at least one rep, this long at rest means the set is over. */
  idleMs?: number;
  /** Full reps must reach this share of the set's deepest one. */
  partialBelow?: number;
}

type Phase = "rest" | "out" | "back" | "recover";

interface Pt {
  t: number;
  e: number;
  bar?: number;
}

export type TrackerEvent = { type: "rep"; rep: Rep } | { type: "failed"; rep: Rep } | { type: "setOver"; at: number };

export class RepTracker {
  private readonly opt: Required<TrackerOptions>;
  private filt = new OneEuro();
  private barFilt = new OneEuro(1.2, 0.05);
  private rest?: number;
  private phase: Phase = "rest";
  private peak = 0;
  private turnT = 0;
  private startT = 0;
  private lostSince?: number;
  private trough = Infinity;
  private reversals = 0;
  private troughMin = Infinity;
  private sank = false;
  private buf: Pt[] = [];
  private lastStill = 0;
  private lastT = 0;
  private overSent = false;
  private lastClose = -Infinity;
  private win: number[] = [];
  private barWin: number[] = [];
  private attempts: Rep[] = [];
  private lastE = 0;

  constructor(
    private profile: MotionProfile,
    opts: TrackerOptions = {},
  ) {
    this.opt = { failMs: 6000, lostMs: 1500, idleMs: 8000, partialBelow: 0.8, ...opts };
  }

  /** Excursion from rest in signal units: 0 at rest, growing as the lifter moves away from it. */
  private excursion(x: number) {
    const r = this.rest ?? x;
    return Math.max(0, this.profile.restHigh ? r - x : x - r);
  }

  /** Excursion that starts an attempt: half the smallest full rep, well above setup fidgets. */
  private get enter() {
    return this.profile.minRom * 0.5;
  }

  push(s: MotionSample): TrackerEvent[] {
    const out: TrackerEvent[] = [];
    this.lastT = s.t;
    const lost = s.conf < 0.3 || !Number.isFinite(s.pos);
    if (lost) {
      this.lostSince ??= s.t;
      if (this.phase !== "rest" && s.t - this.lostSince >= this.opt.lostMs) out.push(...this.fail(s.t));
      out.push(...this.checkOver(s.t));
      return out;
    }
    this.lostSince = undefined;
    // A 5-sample median throws out single-frame glitches (a limb mislabelled for a frame), then the
    // One Euro filter smooths what's left.
    const x = this.filt.filter(median5(this.win, s.pos), s.t);
    const bar = s.bar === undefined || !Number.isFinite(s.bar) ? undefined : this.barFilt.filter(median5(this.barWin, s.bar), s.t);
    if (this.rest === undefined) this.rest = x;
    const e = this.excursion(x);
    this.lastE = e;

    if (this.phase === "recover") {
      // After a miss, wait until the lifter is back at rest (racked, stood up, spotted) before arming again.
      if (e < this.enter * 0.5) {
        this.phase = "rest";
        this.lastStill = s.t;
      }
      out.push(...this.checkOver(s.t));
      return out;
    }

    if (this.phase === "rest") {
      // Let the rest level follow small drift (a step, the camera settling) and lockouts past it.
      const beyond = this.profile.restHigh ? x > this.rest : x < this.rest;
      if (beyond) this.rest += 0.3 * (x - this.rest);
      else if (e < this.enter * 0.4) this.rest += 0.02 * (x - this.rest);
      if (e < this.enter * 0.25) this.lastStill = s.t;
      this.buf.push({ t: s.t, e, bar });
      if (this.buf.length > 90) this.buf.shift();
      // Re-arm only once the lifter has been properly back at rest since the last attempt.
      if (e >= this.enter && this.lastStill > this.lastClose) {
        this.phase = "out";
        this.startT = this.lastStill || s.t;
        this.buf = this.buf.filter((p) => p.t >= this.startT);
        this.peak = e;
        this.turnT = s.t;
        this.reversals = 0;
        this.troughMin = Infinity;
        this.sank = false;
      }
      out.push(...this.checkOver(s.t));
      return out;
    }

    this.buf.push({ t: s.t, e, bar });
    const hyst = Math.max(0.12 * this.peak, this.profile.minRom * 0.08);
    // The turnaround moves only on real progress, not on the filter creeping toward a held position.
    const deeper = e > this.peak + 0.02 * this.profile.minRom;
    if (this.phase === "out") {
      if (deeper) {
        this.peak = e;
        this.turnT = s.t;
      } else if (e < this.peak - hyst) {
        this.phase = "back";
        this.trough = e;
      }
      // Got a good way back up, then sank to the bottom again: a miss, even if they stand up after.
      if (this.reversals > 0 && this.troughMin < 0.75 * this.peak && e >= 0.88 * this.peak) this.sank = true;
    } else {
      this.troughMin = Math.min(this.troughMin, e);
      if (e < this.trough) this.trough = e;
      else if (e > this.trough + hyst) {
        // Sinking again on the way back: a sticking point, or the start of a miss.
        this.reversals++;
        this.phase = "out";
        if (deeper) {
          this.peak = e;
          this.turnT = s.t;
        }
      }
      if (e <= Math.max(0.2 * this.peak, this.enter * 0.5)) {
        if (this.sank) {
          const rep = this.close(s.t, "failed");
          out.push({ type: "failed", rep });
        } else out.push({ type: "rep", rep: this.close(s.t, "full") });
        this.lastStill = s.t;
        return out;
      }
    }
    if (s.t - this.turnT >= this.opt.failMs) out.push(...this.fail(s.t));
    return out;
  }

  private fail(t: number): TrackerEvent[] {
    if (this.phase === "rest" || this.phase === "recover") return [];
    const rep = this.close(t, "failed");
    this.phase = "recover";
    return [{ type: "failed", rep }];
  }

  private checkOver(t: number): TrackerEvent[] {
    const hasRep = this.attempts.some((r) => r.kind !== "failed");
    const last = this.attempts[this.attempts.length - 1];
    if (this.overSent || !last) return [];
    if ((hasRep || last.kind === "failed") && t - last.end >= this.opt.idleMs) {
      this.overSent = true;
      return [{ type: "setOver", at: last.end }];
    }
    return [];
  }

  /** True once the set has ended on its own (idle after the last rep, or a failed rep and idle). */
  get over() {
    return this.overSent;
  }

  /**
   * How far through the rep the lifter is right now, 0 at rest and 1 at the set's deepest point so far
   * (or a typical full rep before the first one), for a figure that follows them.
   */
  get progress(): number {
    return this.rest === undefined ? 0 : this.scale(this.lastE);
  }

  /** The same for a position that hasn't been through the filters yet (a live motion estimate). */
  progressAt(pos: number): number {
    return this.rest === undefined || !Number.isFinite(pos) ? this.progress : this.scale(this.excursion(pos));
  }

  private scale(e: number) {
    const deepest = Math.max(this.peak, ...this.attempts.filter((r) => r.kind !== "failed").map((r) => r.rom));
    return Math.min(1, e / Math.max(deepest, this.profile.minRom * 1.25));
  }

  /** The current excursion phase, for a live display. */
  get state(): Phase {
    return this.phase;
  }

  private close(t: number, kind: RepKind): Rep {
    const pts = this.buf;
    const start = this.startT;
    const turn = this.turnT;
    const end = kind === "failed" ? Math.min(t, (this.lostSince ?? t)) : t;
    const conc = this.profile.concentricFirst ? pts.filter((p) => p.t <= turn) : pts.filter((p) => p.t >= turn);
    const concentricMs = this.profile.concentricFirst ? turn - start : end - turn;
    const eccentricMs = this.profile.concentricFirst ? end - turn : turn - start;
    const { speed, metres, sticking } = analyseConcentric(conc);
    const rep: Rep = {
      index: this.attempts.length,
      kind,
      start,
      turn,
      end,
      rom: this.peak,
      depth: 1,
      concentricMs: Math.max(0, concentricMs),
      eccentricMs: Math.max(0, eccentricMs),
      speed,
      speedIsMetres: metres,
      velocityLoss: 0,
      grinder: false,
      sticking: sticking || this.reversals > 0,
    };
    // Twitches (a step, unracking, a camera bump) that never got near a rep's depth are dropped.
    if (rep.rom >= this.profile.minRom * 0.6 || kind === "failed") this.attempts.push(rep);
    else rep.index = -1;
    this.lastClose = t;
    this.phase = "rest";
    this.buf = [];
    this.peak = 0;
    this.reversals = 0;
    return rep;
  }

  /** Every attempt so far, graded against the whole set. */
  summary(): SetSummary {
    return summarise(this.attempts, this.opt.partialBelow, this.profile.minRom);
  }

  /** Ends the set now: an attempt still in progress counts as failed. */
  finish(): SetSummary {
    this.fail(this.lastT);
    return this.summary();
  }
}

function median5(win: number[], v: number): number {
  win.push(v);
  if (win.length > 5) win.shift();
  return [...win].sort((a, b) => a - b)[win.length >> 1];
}

/** Mean concentric speed and whether it stalled, from the points of one concentric half. */
function analyseConcentric(pts: Pt[]): { speed: number; metres: boolean; sticking: boolean } {
  if (pts.length < 3) return { speed: 0, metres: false, sticking: false };
  const dur = (pts[pts.length - 1].t - pts[0].t) / 1000;
  if (dur <= 0) return { speed: 0, metres: false, sticking: false };
  const withBar = pts.every((p) => p.bar !== undefined);
  const val = (p: Pt) => (withBar ? (p.bar as number) : p.e);
  // Path travelled over the concentric (direction-agnostic: up for a squat, down for a pulldown's bar).
  const disp = Math.abs(val(pts[pts.length - 1]) - val(pts[0]));
  const speed = disp / dur;
  // Speeds over ~100 ms windows; a stall is the middle of the lift running under 15% of its peak.
  const v: { t: number; v: number }[] = [];
  for (let i = 1, j = 0; i < pts.length; i++) {
    while (pts[i].t - pts[j].t > 100 && j < i - 1) j++;
    const dt = (pts[i].t - pts[j].t) / 1000;
    if (dt > 0) v.push({ t: pts[i].t, v: Math.abs(val(pts[i]) - val(pts[j])) / dt });
  }
  const peak = Math.max(...v.map((x) => x.v));
  const t0 = pts[0].t + 0.15 * dur * 1000;
  const t1 = pts[0].t + 0.85 * dur * 1000;
  let slowFrom: number | undefined;
  let sticking = false;
  for (const x of v) {
    if (x.t < t0 || x.t > t1) continue;
    if (x.v < 0.15 * peak) {
      slowFrom ??= x.t;
      if (x.t - slowFrom >= 250) sticking = true;
    } else slowFrom = undefined;
  }
  return { speed, metres: withBar, sticking };
}

/** Rough reps in reserve from velocity loss across a set (after Sánchez-Medina and González-Badillo 2011). */
export function rirFromVelocityLoss(loss: number): number {
  if (loss < 0.1) return 4;
  if (loss < 0.2) return 3;
  if (loss < 0.3) return 2;
  if (loss < 0.45) return 1;
  return 0;
}

export function summarise(attempts: Rep[], partialBelow = 0.8, minRom = 0): SetSummary {
  const reps = attempts.map((r) => ({ ...r }));
  const done = reps.filter((r) => r.kind !== "failed");
  const deepest = Math.max(0, ...done.map((r) => r.rom));
  for (const r of reps) {
    r.depth = deepest > 0 ? Math.min(1, r.rom / deepest) : 0;
    if (r.kind !== "failed" && (r.rom < partialBelow * deepest || r.rom < minRom)) r.kind = "partial";
  }
  // A shallow attempt that sticks at the turnaround and is the last one is a miss, not a partial.
  const last = reps[reps.length - 1];
  if (last && last.kind === "partial" && last.sticking) last.kind = "failed";
  const full = reps.filter((r) => r.kind === "full");
  const best = Math.max(0, ...full.map((r) => r.speed));
  for (const r of reps) {
    r.velocityLoss = best > 0 && r.kind === "full" ? Math.max(0, 1 - r.speed / best) : 0;
    r.grinder = r.kind === "full" && (r.velocityLoss >= 0.5 || r.sticking);
  }
  const lastFull = full[full.length - 1];
  const startedAt = reps[0]?.start;
  const endedAt = last?.end;
  const velocityLoss = lastFull ? lastFull.velocityLoss : undefined;
  return {
    reps,
    full: full.length,
    partial: reps.filter((r) => r.kind === "partial").length,
    failed: reps.filter((r) => r.kind === "failed").length,
    grinders: reps.filter((r) => r.grinder).length,
    startedAt,
    endedAt,
    durationMs: startedAt !== undefined && endedAt !== undefined ? endedAt - startedAt : undefined,
    timeUnderLoadMs: reps.reduce((a, r) => a + (r.end - r.start), 0),
    bestSpeed: best || undefined,
    lastSpeed: lastFull?.speed,
    velocityLoss,
    estRir: full.length >= 3 && velocityLoss !== undefined ? rirFromVelocityLoss(velocityLoss) : undefined,
  };
}
