// Bluetooth gym machines (Labs, `labGymMachines`): the Fitness Machine Service (FTMS, 0x1826) that most
// newer bikes, rowers, treadmills and cross trainers share their numbers through. This file only reads
// the bytes and adds them up, so it runs the same on Android, iOS and the web (machine.ts does the
// Bluetooth). Field layouts follow the Bluetooth SIG's FTMS 1.0 specification, section 4.

export const FTMS_SERVICE = "00001826-0000-1000-8000-00805f9b34fb";

export type MachineKind = "treadmill" | "crossTrainer" | "rower" | "bike";

/** The data characteristic for each kind of machine. A machine notifies the one (or ones) it is. */
export const FTMS_DATA: Record<MachineKind, string> = {
  treadmill: "00002acd-0000-1000-8000-00805f9b34fb",
  crossTrainer: "00002ace-0000-1000-8000-00805f9b34fb",
  rower: "00002ad1-0000-1000-8000-00805f9b34fb",
  bike: "00002ad2-0000-1000-8000-00805f9b34fb",
};

/** One notification, with only what the machine sent. Totals are the machine's own, since its workout started. */
export interface MachineReading {
  kind: MachineKind;
  /** Seconds since the machine's workout started. */
  elapsedS?: number;
  /** Metres since the machine's workout started. */
  distanceM?: number;
  /** Watts right now. */
  powerW?: number;
  /** km/h right now (bikes, treadmills, cross trainers). */
  speedKmh?: number;
  /** Pedal rpm or strokes a minute right now. */
  cadence?: number;
  heartRate?: number;
}

/** Reads fields in order; each `skip` or read moves along, so a flag that's set but unknown can't misalign the rest. */
class Reader {
  private at: number;
  constructor(
    private view: DataView,
    start: number,
  ) {
    this.at = start;
  }
  private fits(n: number): boolean {
    return this.at + n <= this.view.byteLength;
  }
  u8(): number | undefined {
    if (!this.fits(1)) return undefined;
    return this.view.getUint8(this.at++);
  }
  u16(): number | undefined {
    if (!this.fits(2)) return undefined;
    const v = this.view.getUint16(this.at, true);
    this.at += 2;
    return v;
  }
  s16(): number | undefined {
    if (!this.fits(2)) return undefined;
    const v = this.view.getInt16(this.at, true);
    this.at += 2;
    return v;
  }
  u24(): number | undefined {
    if (!this.fits(3)) return undefined;
    const v = this.view.getUint16(this.at, true) | (this.view.getUint8(this.at + 2) << 16);
    this.at += 3;
    return v;
  }
  skip(n: number): void {
    this.at += n;
  }
}

const on = (flags: number, bit: number) => (flags & (1 << bit)) !== 0;
/** Bit 0 ("More Data") works backwards: clear means the instantaneous speed (or stroke data) is there. */
const first = (flags: number) => !on(flags, 0);

function clean(r: MachineReading): MachineReading {
  const out: MachineReading = { kind: r.kind };
  for (const k of ["elapsedS", "distanceM", "powerW", "speedKmh", "cadence", "heartRate"] as const) {
    const v = r[k];
    if (v !== undefined && Number.isFinite(v)) out[k] = v;
  }
  // A negative power is a machine braking or a bad reading; neither is work done.
  if (out.powerW !== undefined && out.powerW < 0) out.powerW = 0;
  if (out.heartRate === 0) delete out.heartRate;
  return out;
}

/** Indoor Bike Data (0x2AD2). */
export function parseBike(view: DataView): MachineReading {
  const f = view.byteLength >= 2 ? view.getUint16(0, true) : 0;
  const r = new Reader(view, 2);
  const out: MachineReading = { kind: "bike" };
  if (first(f)) out.speedKmh = (r.u16() ?? NaN) / 100;
  if (on(f, 1)) r.skip(2); // average speed
  if (on(f, 2)) out.cadence = (r.u16() ?? NaN) / 2;
  if (on(f, 3)) r.skip(2); // average cadence
  if (on(f, 4)) out.distanceM = r.u24();
  if (on(f, 5)) r.skip(2); // resistance level
  if (on(f, 6)) out.powerW = r.s16();
  if (on(f, 7)) r.skip(2); // average power
  if (on(f, 8)) r.skip(5); // energy: total, per hour, per minute
  if (on(f, 9)) out.heartRate = r.u8();
  if (on(f, 10)) r.skip(1); // metabolic equivalent
  if (on(f, 11)) out.elapsedS = r.u16();
  return clean(out);
}

/** Rower Data (0x2AD1). */
export function parseRower(view: DataView): MachineReading {
  const f = view.byteLength >= 2 ? view.getUint16(0, true) : 0;
  const r = new Reader(view, 2);
  const out: MachineReading = { kind: "rower" };
  if (first(f)) {
    out.cadence = (r.u8() ?? NaN) / 2; // stroke rate
    r.skip(2); // stroke count
  }
  if (on(f, 1)) r.skip(1); // average stroke rate
  if (on(f, 2)) out.distanceM = r.u24();
  if (on(f, 3)) r.skip(2); // pace
  if (on(f, 4)) r.skip(2); // average pace
  if (on(f, 5)) out.powerW = r.s16();
  if (on(f, 6)) r.skip(2); // average power
  if (on(f, 7)) r.skip(2); // resistance level
  if (on(f, 8)) r.skip(5); // energy
  if (on(f, 9)) out.heartRate = r.u8();
  if (on(f, 10)) r.skip(1); // metabolic equivalent
  if (on(f, 11)) out.elapsedS = r.u16();
  return clean(out);
}

/** Treadmill Data (0x2ACD). */
export function parseTreadmill(view: DataView): MachineReading {
  const f = view.byteLength >= 2 ? view.getUint16(0, true) : 0;
  const r = new Reader(view, 2);
  const out: MachineReading = { kind: "treadmill" };
  if (first(f)) out.speedKmh = (r.u16() ?? NaN) / 100;
  if (on(f, 1)) r.skip(2); // average speed
  if (on(f, 2)) out.distanceM = r.u24();
  if (on(f, 3)) r.skip(4); // inclination, ramp angle
  if (on(f, 4)) r.skip(4); // elevation gain up, down
  if (on(f, 5)) r.skip(1); // pace
  if (on(f, 6)) r.skip(1); // average pace
  if (on(f, 7)) r.skip(5); // energy
  if (on(f, 8)) out.heartRate = r.u8();
  if (on(f, 9)) r.skip(1); // metabolic equivalent
  if (on(f, 10)) out.elapsedS = r.u16();
  if (on(f, 11)) r.skip(2); // remaining time
  if (on(f, 12)) {
    r.skip(2); // force on belt
    out.powerW = r.s16();
  }
  return clean(out);
}

/** Cross Trainer Data (0x2ACE): the one with 24 bits of flags. */
export function parseCrossTrainer(view: DataView): MachineReading {
  const f = view.byteLength >= 3 ? view.getUint16(0, true) | (view.getUint8(2) << 16) : 0;
  const r = new Reader(view, 3);
  const out: MachineReading = { kind: "crossTrainer" };
  if (first(f)) out.speedKmh = (r.u16() ?? NaN) / 100;
  if (on(f, 1)) r.skip(2); // average speed
  if (on(f, 2)) out.distanceM = r.u24();
  if (on(f, 3)) {
    out.cadence = r.u16(); // steps a minute
    r.skip(2); // average step rate
  }
  if (on(f, 4)) r.skip(2); // stride count
  if (on(f, 5)) r.skip(4); // elevation gain up, down
  if (on(f, 6)) r.skip(4); // inclination, ramp angle
  if (on(f, 7)) r.skip(2); // resistance level
  if (on(f, 8)) out.powerW = r.s16();
  if (on(f, 9)) r.skip(2); // average power
  if (on(f, 10)) r.skip(5); // energy
  if (on(f, 11)) out.heartRate = r.u8();
  if (on(f, 12)) r.skip(1); // metabolic equivalent
  if (on(f, 13)) out.elapsedS = r.u16();
  return clean(out);
}

export const PARSE: Record<MachineKind, (v: DataView) => MachineReading> = {
  treadmill: parseTreadmill,
  crossTrainer: parseCrossTrainer,
  rower: parseRower,
  bike: parseBike,
};

/** The kind whose characteristic this is, from its UUID (any case, short or long form). */
export function kindOf(uuid: string): MachineKind | null {
  const u = uuid.toLowerCase();
  for (const [k, full] of Object.entries(FTMS_DATA) as [MachineKind, string][]) if (u === full || full.startsWith(`0000${u}-`)) return k;
  return null;
}

/** What goes into the set on screen. */
export interface MachineSet {
  seconds: number;
  /** Metres, when the machine counts distance. */
  distanceM?: number;
  /** Average watts while moving, when the machine measures power. */
  powerW?: number;
}

/** How much a machine counter added since `before`; one that went backwards was restarted on the machine, so all it shows is new. */
const added = (now: number, before: number) => (now < before ? now : now - before);

/** Longest gap between two readings that still counts as time moving (a stalled link isn't work). */
const MAX_GAP_S = 3;

/**
 * Adds up a machine's readings into sets. The machine's own counters run for its whole workout and go
 * back to zero when someone starts a new one there, so each counter is followed as steps: a counter
 * that drops started again from zero. A set is what was added since the last Log set (`nextSet`); the
 * first set after connecting takes the machine's totals, because the lifter usually starts the machine
 * as they start the set. Machines without an elapsed time count the seconds they're moving.
 */
export class MachineTally {
  private last: { elapsedS?: number; distanceM?: number; at: number } | null = null;
  private total = { seconds: 0, metres: 0, joules: 0, powerSeconds: 0, hasDistance: false, hasPower: false };
  private base = { seconds: 0, metres: 0, joules: 0, powerSeconds: 0 };

  /** Take one reading, at `at` ms. */
  add(r: MachineReading, at: number): void {
    const prev = this.last;
    const gap = prev && Number.isFinite(prev.at) ? Math.min(MAX_GAP_S, Math.max(0, (at - prev.at) / 1000)) : 0;
    const moving = (r.speedKmh ?? 0) > 0 || (r.powerW ?? 0) > 0 || (r.cadence ?? 0) > 0;
    if (r.elapsedS !== undefined) {
      this.total.seconds += added(r.elapsedS, prev ? (prev.elapsedS ?? r.elapsedS) : 0);
    } else if (moving) {
      this.total.seconds += gap;
    }
    if (r.distanceM !== undefined) {
      this.total.hasDistance = true;
      this.total.metres += added(r.distanceM, prev ? (prev.distanceM ?? r.distanceM) : 0);
    }
    if (r.powerW !== undefined) {
      this.total.hasPower = true;
      if (moving && gap > 0) {
        this.total.joules += r.powerW * gap;
        this.total.powerSeconds += gap;
      }
    }
    this.last = { elapsedS: r.elapsedS ?? prev?.elapsedS, distanceM: r.distanceM ?? prev?.distanceM, at };
  }

  /** The set so far. */
  set(): MachineSet {
    const t = this.total;
    const b = this.base;
    const powerSeconds = t.powerSeconds - b.powerSeconds;
    return {
      seconds: Math.max(0, Math.round(t.seconds - b.seconds)),
      ...(t.hasDistance ? { distanceM: Math.max(0, Math.round(t.metres - b.metres)) } : {}),
      ...(t.hasPower && powerSeconds > 0 ? { powerW: Math.round((t.joules - b.joules) / powerSeconds) } : {}),
    };
  }

  /** A set was logged: the next one counts from here. */
  nextSet(): void {
    const t = this.total;
    this.base = { seconds: t.seconds, metres: t.metres, joules: t.joules, powerSeconds: t.powerSeconds };
  }

  /** The link dropped: keep the totals, but the next reading is a fresh look at the machine's counters. */
  gap(): void {
    if (this.last) this.last = { ...this.last, at: Number.NaN };
  }
}
