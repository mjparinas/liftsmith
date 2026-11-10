"use client";
// Live heart rate from any Bluetooth heart rate broadcaster (standard Heart Rate Service 0x180D):
// Fitbit Charge 6 and Pixel Watch "share heart rate", Polar, Garmin, Wahoo, Coros straps.
// The web build uses Web Bluetooth (Chrome on Android). The native shells (Android and iOS) use the
// Capacitor BLE plugin, which keeps reading with the screen off.
import { isNative } from "./juice";
import { t } from "./i18n";
import type { MessageKey } from "@/locales/en";

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";

export function parseHeartRate(view: DataView): number {
  const flags = view.getUint8(0);
  return flags & 0x01 ? view.getUint16(1, true) : view.getUint8(1);
}

export interface HrConnection {
  name: string;
  disconnect(): void;
}

/**
 * Why a connection failed, in terms the lifter can act on. `cancelled` (they closed the picker) shows
 * nothing; every other kind has its own message (`hrMessage`).
 */
export type HrProblem = "cancelled" | "bluetoothOff" | "blocked" | "unreachable" | "noService" | "pairing" | "failed";

export class HrError extends Error {
  constructor(public problem: HrProblem, public device?: string, cause?: unknown) {
    super(`heart rate: ${problem}${cause instanceof Error ? ` (${cause.name}: ${cause.message})` : ""}`);
    this.name = "HrError";
  }
}

const CONNECT_TIMEOUT_MS = 10_000;
const STEP_TIMEOUT_MS = 8_000;
const CONNECT_TRIES = 3;

/** Read the error from the picker or a GATT step and say what went wrong. */
export function classify(err: unknown, stage: "pick" | "connect" | "service" | "notify"): HrProblem {
  if (err instanceof HrError) return err.problem;
  const name = err instanceof Error || (typeof err === "object" && err && "name" in err) ? String((err as { name?: string }).name ?? "") : "";
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  if (/adapter not available|bluetooth.*(off|not enabled|disabled|unavailable|powered)|not enabled/.test(msg)) return "bluetoothOff";
  if (stage === "pick") {
    if (name === "NotFoundError" || /cancel/.test(msg)) return "cancelled";
    if (name === "SecurityError" || name === "NotAllowedError" || /permission|denied|not allowed|globally disabled/.test(msg)) return "blocked";
    return "failed";
  }
  if (/pair|bond|auth|encrypt|insufficient|not permitted/.test(msg) || name === "SecurityError") return "pairing";
  if (stage === "service" && (name === "NotFoundError" || /no services? matching|no characteristics? matching|not found/.test(msg))) return "noService";
  if (stage === "connect" || name === "NetworkError" || /timeout|timed out|disconnect|connection/.test(msg)) return "unreachable";
  return "failed";
}

/** What to tell the lifter. Fitbit and Pixel Watch get the setting that turns sharing on. */
export function hrMessage(problem: HrProblem, device?: string): string | null {
  if (problem === "cancelled") return null;
  const name = device?.trim() || t("hr.device");
  const main = t(`hr.err.${problem}` as MessageKey, { name });
  const fitbit = /fitbit|pixel|charge|google/i.test(device ?? "");
  return fitbit && problem !== "bluetoothOff" && problem !== "blocked" ? `${main} ${t("hr.tip.fitbit")}` : main;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timed out")), ms);
    p.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); });
  });
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run one step, retrying while it fails; throws an HrError naming the step's problem. */
async function step<T>(stage: "connect" | "service" | "notify", device: string | undefined, tries: number, ms: number, run: () => Promise<T>, between?: () => Promise<void>): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await withTimeout(run(), ms);
    } catch (e) {
      last = e;
      // A device without the service, or a refused pairing, won't change on a retry.
      const p = classify(e, stage);
      if (p === "noService" || p === "bluetoothOff") break;
      if (i < tries - 1) {
        await between?.().catch(() => {});
        await pause(400 * (i + 1));
      }
    }
  }
  throw new HrError(classify(last, stage), device, last);
}

type GattChar = EventTarget & { startNotifications(): Promise<unknown>; value?: DataView };
type GattServer = { connected?: boolean; getPrimaryService(s: string): Promise<{ getCharacteristic(c: string): Promise<GattChar> }>; disconnect(): void };
type BT = {
  requestDevice(o: unknown): Promise<{
    name?: string;
    gatt?: { connected?: boolean; connect(): Promise<GattServer>; disconnect(): void };
    addEventListener(t: string, f: () => void): void;
  }>;
};

export function hrSupported(): boolean {
  return isNative() || (typeof navigator !== "undefined" && "bluetooth" in navigator);
}

async function connectNative(onBpm: (bpm: number) => void, onGone: () => void): Promise<HrConnection> {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  const { Capacitor } = await import("@capacitor/core");
  let device: { deviceId: string; name?: string };
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
    device = await BleClient.requestDevice({ services: [HR_SERVICE] });
  } catch (e) {
    throw new HrError(classify(e, "pick"), undefined, e);
  }
  const id = device.deviceId;
  const name = device.name;
  let live = true;
  const gone = () => { if (live) onGone(); };
  const drop = () => BleClient.disconnect(id).catch(() => {});
  try {
    await step("connect", name, CONNECT_TRIES, CONNECT_TIMEOUT_MS + 2_000, () => BleClient.connect(id, gone, { timeout: CONNECT_TIMEOUT_MS }), drop);
    const services = await step("service", name, 1, STEP_TIMEOUT_MS, () => BleClient.getServices(id));
    if (!services.some((s) => s.uuid.toLowerCase() === HR_SERVICE)) throw new HrError("noService", name);
    const start = () => BleClient.startNotifications(id, HR_SERVICE, HR_MEASUREMENT, (v) => onBpm(parseHeartRate(v)));
    try {
      await withTimeout(start(), STEP_TIMEOUT_MS);
    } catch (e) {
      // Some watches (Fitbit, Pixel Watch) only send heart rate to a bonded phone. Android can ask
      // to pair from here; iOS pairs by itself when the watch asks, so a retry is all it needs.
      if (Capacitor.getPlatform() === "android" && !(await BleClient.isBonded(id).catch(() => true))) {
        await BleClient.createBond(id, { timeout: 30_000 }).catch((b) => { throw new HrError("pairing", name, b); });
      } else if (classify(e, "notify") === "failed") {
        throw new HrError("failed", name, e);
      }
      await step("notify", name, 2, STEP_TIMEOUT_MS, start);
    }
  } catch (e) {
    live = false;
    void drop();
    throw e instanceof HrError ? e : new HrError(classify(e, "notify"), name, e);
  }
  return { name: name ?? t("hr.device"), disconnect: () => { live = false; void drop(); } };
}

/**
 * Pick a heart rate monitor and start its readings. Every failure is an `HrError` whose `problem`
 * says what to tell the lifter (`hrMessage`); nothing fails silently or hangs.
 */
export async function connectHeartRate(onBpm: (bpm: number) => void, onGone: () => void): Promise<HrConnection> {
  if (isNative()) return connectNative(onBpm, onGone);
  const bt = (navigator as unknown as { bluetooth: BT }).bluetooth;
  let device: Awaited<ReturnType<BT["requestDevice"]>>;
  try {
    device = await bt.requestDevice({ filters: [{ services: ["heart_rate"] }] });
  } catch (e) {
    throw new HrError(classify(e, "pick"), undefined, e);
  }
  const name = device.name;
  const gatt = device.gatt;
  if (!gatt) throw new HrError("failed", name);
  let live = true;
  try {
    // Chrome's first GATT connect to a watch often fails or never answers; a fresh try usually works.
    const server = await step("connect", name, CONNECT_TRIES, CONNECT_TIMEOUT_MS, () => gatt.connect(), async () => gatt.disconnect());
    const service = await step("service", name, 2, STEP_TIMEOUT_MS, async () => {
      if (!gatt.connected) await gatt.connect();
      return server.getPrimaryService("heart_rate");
    });
    const ch = await step("service", name, 1, STEP_TIMEOUT_MS, () => service.getCharacteristic("heart_rate_measurement"));
    ch.addEventListener("characteristicvaluechanged", () => {
      if (ch.value) onBpm(parseHeartRate(ch.value));
    });
    // A watch that wants to pair makes the browser or phone show its pairing prompt here.
    await step("notify", name, 2, 30_000, () => ch.startNotifications());
    device.addEventListener("gattserverdisconnected", () => { if (live) onGone(); });
  } catch (e) {
    live = false;
    gatt.disconnect();
    throw e instanceof HrError ? e : new HrError(classify(e, "notify"), name, e);
  }
  return { name: name ?? t("hr.device"), disconnect: () => { live = false; gatt.disconnect(); } };
}

/** Zones as a share of an age-estimated maximum (Tanaka: 208 − 0.7 × age). */
export function hrZone(bpm: number, maxHr = 185): { zone: number; colour: string } {
  const p = bpm / maxHr;
  const zone = p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
  return { zone, colour: `var(--hr-${zone})` };
}
