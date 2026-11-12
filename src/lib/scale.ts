"use client";

// Bluetooth smart scales (Labs, `labScale`; Melvin picked it from the connections list, 2026-11-12). A scale
// that shares the standard Bluetooth Weight Scale Service (0x181D) or Body Composition Service (0x181B)
// sends its reading when the lifter steps on, and the weigh-in form fills in the weight and body fat for
// them to log. Many cheap scales use their own closed protocol instead; those can't connect, and the
// picker never lists them. Android and iOS use the same native Bluetooth plugin as heart rate monitors and
// gym machines (`@capacitor-community/bluetooth-le`), so both phones get it from one path; the web app uses
// Web Bluetooth, which only Chrome has.
import { classify, type HrProblem } from "./heartRate";
import { t } from "./i18n";
import { isNative } from "./juice";
import { toKg } from "./units";

export const WEIGHT_SERVICE = "0000181d-0000-1000-8000-00805f9b34fb";
export const WEIGHT_MEASUREMENT = "00002a9d-0000-1000-8000-00805f9b34fb";
export const BODY_SERVICE = "0000181b-0000-1000-8000-00805f9b34fb";
export const BODY_MEASUREMENT = "00002a9c-0000-1000-8000-00805f9b34fb";

export interface ScaleReading {
  kg?: number;
  /** Body fat, %. */
  bodyFat?: number;
}

const u16 = (v: DataView, o: number) => (o + 2 <= v.byteLength ? v.getUint16(o, true) : null);

/**
 * Weight Measurement (0x2A9D): flags, then the weight as a uint16 in 0.005 kg (SI) or 0.01 lb (imperial).
 * 0xFFFF means the measurement didn't work (stepped off too soon).
 */
export function parseWeight(v: DataView): ScaleReading | null {
  if (v.byteLength < 3) return null;
  const imperial = (v.getUint8(0) & 1) === 1;
  const raw = u16(v, 1);
  if (raw === null || raw === 0xffff || raw === 0) return null;
  const kg = imperial ? toKg(raw * 0.01, "lb") : raw * 0.005;
  return { kg: Math.round(kg * 100) / 100 };
}

/**
 * Body Composition Measurement (0x2A9C): 16-bit flags, body fat in 0.1 %, then optional fields in a fixed
 * order (time stamp, user, basal metabolism, muscle %, muscle mass, fat-free mass, soft lean mass, body water,
 * impedance, weight, height). Weight, when there, is in 0.005 kg or 0.01 lb like the Weight Measurement.
 */
export function parseBodyComposition(v: DataView): ScaleReading | null {
  const flags = u16(v, 0);
  const fat = u16(v, 2);
  if (flags === null || fat === null) return null;
  const out: ScaleReading = {};
  if (fat !== 0xffff && fat > 0) out.bodyFat = Math.round(fat) / 10;
  let o = 4;
  if (flags & (1 << 1)) o += 7; // time stamp
  if (flags & (1 << 2)) o += 1; // user id
  for (let bit = 3; bit <= 9; bit++) if (flags & (1 << bit)) o += 2; // basal metabolism … impedance
  if (flags & (1 << 10)) {
    const raw = u16(v, o);
    if (raw !== null && raw !== 0xffff && raw > 0) {
      const kg = flags & 1 ? toKg(raw * 0.01, "lb") : raw * 0.005;
      out.kg = Math.round(kg * 100) / 100;
    }
  }
  return out.kg === undefined && out.bodyFat === undefined ? null : out;
}

/** Only what a weigh-in can take: 25 to 350 kg, 2 to 70 % body fat. */
export function sane(r: ScaleReading): ScaleReading {
  return {
    ...(r.kg !== undefined && r.kg >= 25 && r.kg <= 350 ? { kg: r.kg } : {}),
    ...(r.bodyFat !== undefined && r.bodyFat >= 2 && r.bodyFat <= 70 ? { bodyFat: r.bodyFat } : {}),
  };
}

export class ScaleError extends Error {
  constructor(
    public problem: HrProblem | "timeout",
    public device?: string,
    cause?: unknown,
  ) {
    super(`scale: ${problem}${cause instanceof Error ? ` (${cause.name}: ${cause.message})` : ""}`);
    this.name = "ScaleError";
  }
}

/** What to tell the lifter, or null when they closed the picker. */
export function scaleMessage(problem: ScaleError["problem"], device?: string): string | null {
  const name = device?.trim() || t("lab.scale.device");
  switch (problem) {
    case "cancelled":
      return null;
    case "bluetoothOff":
      return t("hr.err.bluetoothOff");
    case "blocked":
      return t("hr.err.blocked");
    case "notFound":
      return t("lab.scale.err.notFound");
    case "noService":
      return t("lab.scale.err.noService", { name });
    case "timeout":
      return t("lab.scale.err.timeout", { name });
    case "pairing":
      return t("hr.err.pairing", { name });
    case "lost":
    case "unreachable":
    case "failed":
      return t("lab.scale.err.failed", { name });
  }
}

export function scaleSupported(): boolean {
  return isNative() || (typeof navigator !== "undefined" && "bluetooth" in navigator);
}

/** How long to wait for the lifter to step on, and for body fat after the weight. */
export const STEP_ON_MS = 60_000;
export const BODY_GRACE_MS = 4_000;
const STEP_MS = 10_000;

function within<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timed out")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/**
 * Collects a scale's readings into one: the latest weight, and body fat when the scale sends it. Resolves
 * a short while after the first weight (body fat often follows in a second packet), or when the wait runs out.
 * Exported for tests.
 */
export class ScaleTally {
  private reading: ScaleReading = {};
  private grace: ReturnType<typeof setTimeout> | null = null;
  private done = false;
  constructor(private finish: (r: ScaleReading) => void) {}

  add(r: ScaleReading | null): void {
    if (!r || this.done) return;
    const s = sane(r);
    this.reading = { ...this.reading, ...s };
    if (this.reading.kg !== undefined && this.reading.bodyFat !== undefined) this.end();
    else if (this.reading.kg !== undefined && !this.grace) this.grace = setTimeout(() => this.end(), BODY_GRACE_MS);
  }

  end(): void {
    if (this.done) return;
    this.done = true;
    if (this.grace) clearTimeout(this.grace);
    this.finish(this.reading);
  }
}

/**
 * Opens the picker (scales sharing either service), connects, and waits for the lifter to step on. Resolves
 * with the reading and lets the scale go; rejects with a ScaleError. `onWaiting` says when to step on.
 */
export async function weighOnScale(onWaiting: (name: string) => void): Promise<ScaleReading & { name: string }> {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  let name: string | undefined;
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
  } catch (e) {
    throw new ScaleError(classify(e, "pick"), name, e);
  }
  let id: string;
  try {
    const d = await BleClient.requestDevice({ services: [WEIGHT_SERVICE, BODY_SERVICE] });
    id = d.deviceId;
    name = d.name ?? undefined;
  } catch (e) {
    throw new ScaleError(classify(e, "pick"), name, e);
  }
  const started: [string, string][] = [];
  const letGo = async () => {
    for (const [s, c] of started) await within(BleClient.stopNotifications(id, s, c), 3_000).catch(() => {});
    await within(BleClient.disconnect(id), 6_000).catch(() => {});
  };
  let gone: (() => void) | null = null;
  try {
    await within(
      BleClient.connect(id, () => gone?.(), { timeout: STEP_MS }),
      STEP_MS + 2_000,
    ).catch((e: unknown) => {
      throw new ScaleError(classify(e, "connect"), name, e);
    });
    const services = await within(BleClient.getServices(id), STEP_MS).catch((e: unknown) => {
      throw new ScaleError(classify(e, "service"), name, e);
    });
    const has = (s: string, c: string) =>
      services.some((x) => x.uuid.toLowerCase() === s && x.characteristics.some((y) => y.uuid.toLowerCase() === c));
    const wanted: [string, string, (v: DataView) => ScaleReading | null][] = [
      [WEIGHT_SERVICE, WEIGHT_MEASUREMENT, parseWeight],
      [BODY_SERVICE, BODY_MEASUREMENT, parseBodyComposition],
    ];
    const use = wanted.filter(([s, c]) => has(s, c));
    if (!use.length) throw new ScaleError("noService", name);
    const reading = await new Promise<ScaleReading>((resolve, reject) => {
      const wait = setTimeout(() => tally.end(), STEP_ON_MS);
      const tally = new ScaleTally((r) => {
        clearTimeout(wait);
        resolve(r);
      });
      gone = () => tally.end();
      void (async () => {
        try {
          for (const [s, c, parse] of use) {
            await within(
              BleClient.startNotifications(id, s, c, (v) => tally.add(parse(v))),
              STEP_MS,
            );
            started.push([s, c]);
          }
          onWaiting(name ?? t("lab.scale.device"));
        } catch (e) {
          clearTimeout(wait);
          reject(new ScaleError(classify(e, "notify"), name, e));
        }
      })();
    });
    if (reading.kg === undefined) throw new ScaleError("timeout", name);
    return { ...reading, name: name ?? t("lab.scale.device") };
  } catch (e) {
    throw e instanceof ScaleError ? e : new ScaleError(classify(e, "notify"), name, e);
  } finally {
    gone = null;
    await letGo();
  }
}
