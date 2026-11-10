"use client";

// Live heart rate from any Bluetooth heart rate broadcaster (standard Heart Rate Service 0x180D):
// Fitbit Charge 6 and Pixel Watch "share heart rate", Polar, Garmin, Wahoo, Coros straps.
// The web build uses Web Bluetooth (Chrome on Android). The native shells (Android and iOS) use the
// Capacitor BLE plugin, which keeps reading with the screen off.
import type { MessageKey } from "@/locales/en";

import { t } from "./i18n";
import { isNative } from "./juice";

const HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";

export function parseHeartRate(view: DataView): number {
  const flags = view.getUint8(0);
  return flags & 0x01 ? view.getUint16(1, true) : view.getUint8(1);
}

export interface HrConnection {
  name: string;
  /** Stops the readings and releases the monitor, so the next workout (or another app) can reach it. */
  disconnect(): Promise<void>;
}

/**
 * Why a connection failed, in terms the lifter can act on. `cancelled` (they closed the picker) shows
 * nothing; every other kind has its own message (`hrMessage`). `notFound`: the picker's scan found
 * nothing; `lost`: a monitor dropped mid-workout and the automatic reconnects ran out.
 */
export type HrProblem = "cancelled" | "bluetoothOff" | "blocked" | "notFound" | "lost" | "unreachable" | "noService" | "pairing" | "failed";

export class HrError extends Error {
  constructor(
    public problem: HrProblem,
    public device?: string,
    cause?: unknown,
  ) {
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
  const name =
    err instanceof Error || (typeof err === "object" && err && "name" in err) ? String((err as { name?: string }).name ?? "") : "";
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  if (/adapter not available|bluetooth.*(off|not enabled|disabled|unavailable|powered)|not enabled/.test(msg)) return "bluetoothOff";
  if (stage === "pick") {
    // The phone's picker scanned and found nothing (Android: "No device found.").
    if (/no devices? found/.test(msg)) return "notFound";
    if (name === "NotFoundError" || /cancel/.test(msg)) return "cancelled";
    if (name === "SecurityError" || name === "NotAllowedError" || /permission|denied|not allowed|globally disabled/.test(msg))
      return "blocked";
    return "failed";
  }
  if (/pair|bond|auth|encrypt|insufficient|not permitted/.test(msg) || name === "SecurityError") return "pairing";
  if (stage === "service" && (name === "NotFoundError" || /no services? matching|no characteristics? matching|not found/.test(msg)))
    return "noService";
  if (stage === "connect" || name === "NetworkError" || /timeout|timed out|disconnect|connection/.test(msg)) return "unreachable";
  return "failed";
}

/**
 * What to tell the lifter. Fitbit and Pixel Watch get the setting that turns sharing on; a Fitbit
 * that connected before and can't be found gets the one fix that works then (sharing off and on).
 */
export function hrMessage(problem: HrProblem, device?: string): string | null {
  if (problem === "cancelled") return null;
  const name = device?.trim() || t("hr.device");
  const main = t(`hr.err.${problem}` as MessageKey, { name });
  if (problem === "bluetoothOff" || problem === "blocked") return main;
  const fitbit = /fitbit|pixel|charge|google/i.test(device ?? "");
  const lost = problem === "notFound" || problem === "unreachable" || problem === "lost";
  if (fitbit && lost && savedHr()) return `${main} ${t("hr.tip.reshare")}`;
  // Nothing found and no name to go on: the lifter may well have a Fitbit, so say how sharing starts.
  return fitbit || (problem === "notFound" && !device) ? `${main} ${t("hr.tip.fitbit")}` : main;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
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

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run one step, retrying while it fails; throws an HrError naming the step's problem. */
async function step<T>(
  stage: "connect" | "service" | "notify",
  device: string | undefined,
  tries: number,
  ms: number,
  run: () => Promise<T>,
  between?: () => Promise<void>,
): Promise<T> {
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

type GattChar = EventTarget & { startNotifications(): Promise<unknown>; stopNotifications?(): Promise<unknown>; value?: DataView };
type GattServer = {
  connected?: boolean;
  getPrimaryService(s: string): Promise<{ getCharacteristic(c: string): Promise<GattChar> }>;
  disconnect(): void;
};
type WebDevice = {
  id?: string;
  name?: string;
  gatt?: { connected?: boolean; connect(): Promise<GattServer>; disconnect(): void };
  addEventListener(t: string, f: () => void): void;
};
type BT = {
  requestDevice(o: unknown): Promise<WebDevice>;
  /** Devices this site was allowed before (Chrome); missing in browsers that don't keep the permission. */
  getDevices?(): Promise<WebDevice[]>;
};
type Ble = (typeof import("@capacitor-community/bluetooth-le"))["BleClient"];

export function hrSupported(): boolean {
  return isNative() || (typeof navigator !== "undefined" && "bluetooth" in navigator);
}

/** The monitor that last connected, so the next workout can reconnect to it without a scan. */
export interface SavedHr {
  id: string;
  name?: string;
}

const SAVED_KEY = "liftsmith.hr.device";

export function savedHr(): SavedHr | null {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "null") as Partial<SavedHr> | null;
    return v && typeof v.id === "string" && v.id ? { id: v.id, name: typeof v.name === "string" ? v.name : undefined } : null;
  } catch {
    return null;
  }
}

export function saveHr(d: SavedHr | null): void {
  try {
    if (d) localStorage.setItem(SAVED_KEY, JSON.stringify(d));
    else localStorage.removeItem(SAVED_KEY);
  } catch {
    // Private mode or storage full: it only means the next workout asks again.
  }
}

/** How hard to try one device: a picked device gets the full retries, a quiet reconnect one short try. */
type Effort = { tries: number; timeout: number };
const FULL: Effort = { tries: CONNECT_TRIES, timeout: CONNECT_TIMEOUT_MS };
const QUICK: Effort = { tries: 1, timeout: 8_000 };

/**
 * Connect to one device by id and start its readings. Connecting by id needs no scan, so it works
 * when the monitor has stopped advertising because the phone still holds a link to it (a Fitbit
 * sharing heart rate through the Google Health app does this once a first session has ended).
 */
async function openNative(
  BleClient: Ble,
  android: boolean,
  id: string,
  name: string | undefined,
  effort: Effort,
  onBpm: (bpm: number) => void,
  onGone: () => void,
): Promise<HrConnection> {
  let live = true;
  const gone = () => {
    if (live) {
      live = false;
      onGone();
    }
  };
  const drop = () => BleClient.disconnect(id).catch(() => {});
  let notifying = false;
  try {
    await step("connect", name, effort.tries, effort.timeout + 2_000, () => BleClient.connect(id, gone, { timeout: effort.timeout }), drop);
    const services = await step("service", name, 1, STEP_TIMEOUT_MS, () => BleClient.getServices(id));
    if (!services.some((s) => s.uuid.toLowerCase() === HR_SERVICE)) throw new HrError("noService", name);
    const start = () => BleClient.startNotifications(id, HR_SERVICE, HR_MEASUREMENT, (v) => onBpm(parseHeartRate(v)));
    try {
      await withTimeout(start(), STEP_TIMEOUT_MS);
    } catch (e) {
      // Some watches (Fitbit, Pixel Watch) only send heart rate to a bonded phone. Android can ask
      // to pair from here; iOS pairs by itself when the watch asks, so a retry is all it needs.
      if (android && !(await BleClient.isBonded(id).catch(() => true))) {
        await BleClient.createBond(id, { timeout: 30_000 }).catch((b) => {
          throw new HrError("pairing", name, b);
        });
      } else if (classify(e, "notify") === "failed") {
        throw new HrError("failed", name, e);
      }
      await step("notify", name, 2, STEP_TIMEOUT_MS, start);
    }
    notifying = true;
  } catch (e) {
    live = false;
    await drop();
    throw e instanceof HrError ? e : new HrError(classify(e, "notify"), name, e);
  }
  saveHr({ id, name });
  return {
    name: name ?? t("hr.device"),
    // Release the monitor fully: stop its readings, then drop the link (the plugin closes the GATT
    // client once Android says it's gone). A half-released link keeps the watch tied to this phone.
    disconnect: async () => {
      live = false;
      if (notifying) await withTimeout(BleClient.stopNotifications(id, HR_SERVICE, HR_MEASUREMENT), 3_000).catch(() => {});
      await withTimeout(drop(), 6_000).catch(() => {});
    },
  };
}

/** Devices worth trying without a scan: the saved one, then any the phone is already linked to. */
async function nativeCandidates(BleClient: Ble, android: boolean, saved: SavedHr | null): Promise<SavedHr[]> {
  const out: SavedHr[] = [];
  const add = (d: { deviceId: string; name?: string }) => {
    if (d.deviceId && !out.some((o) => o.id === d.deviceId)) out.push({ id: d.deviceId, name: d.name ?? saved?.name });
  };
  if (saved) {
    // iOS only knows a device by id after it's looked up (retrievePeripherals); Android connects by address.
    if (!android) await BleClient.getDevices([saved.id]).catch(() => []);
    add({ deviceId: saved.id, name: saved.name });
  }
  const sameName = (d: { name?: string }) => !!saved?.name && d.name === saved.name;
  // iOS filters connected devices by service, so each one is a heart rate monitor. Android lists
  // every connected device, so only the saved monitor's name counts (its address can change).
  const connected = await BleClient.getConnectedDevices([HR_SERVICE]).catch(() => []);
  connected.filter((d) => !android || sameName(d)).forEach(add);
  if (android) (await BleClient.getBondedDevices().catch(() => [])).filter(sameName).forEach(add);
  return out;
}

async function connectNative(onBpm: (bpm: number) => void, onGone: () => void, quiet: boolean): Promise<HrConnection> {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  const { Capacitor } = await import("@capacitor/core");
  const android = Capacitor.getPlatform() === "android";
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
  } catch (e) {
    throw new HrError(classify(e, "pick"), undefined, e);
  }
  const saved = savedHr();
  let last: HrError | null = null;
  for (const c of await nativeCandidates(BleClient, android, saved)) {
    try {
      return await openNative(BleClient, android, c.id, c.name, QUICK, onBpm, onGone);
    } catch (e) {
      last = e instanceof HrError ? e : new HrError("failed", c.name, e);
      if (last.problem === "bluetoothOff") throw last;
    }
  }
  // A quiet reconnect never opens the picker; the lifter tapping Connect does.
  if (quiet) throw last ?? new HrError("notFound", saved?.name);
  let device: { deviceId: string; name?: string };
  try {
    device = await BleClient.requestDevice({ services: [HR_SERVICE] });
  } catch (e) {
    throw new HrError(classify(e, "pick"), saved?.name, e);
  }
  return openNative(BleClient, android, device.deviceId, device.name, FULL, onBpm, onGone);
}

async function openWeb(device: WebDevice, effort: Effort, onBpm: (bpm: number) => void, onGone: () => void): Promise<HrConnection> {
  const name = device.name;
  const gatt = device.gatt;
  if (!gatt) throw new HrError("failed", name);
  let live = true;
  let ch: GattChar | null = null;
  try {
    // Chrome's first GATT connect to a watch often fails or never answers; a fresh try usually works.
    const server = await step(
      "connect",
      name,
      effort.tries,
      effort.timeout,
      () => gatt.connect(),
      async () => gatt.disconnect(),
    );
    const service = await step("service", name, 2, STEP_TIMEOUT_MS, async () => {
      if (!gatt.connected) await gatt.connect();
      return server.getPrimaryService("heart_rate");
    });
    const c = await step("service", name, 1, STEP_TIMEOUT_MS, () => service.getCharacteristic("heart_rate_measurement"));
    c.addEventListener("characteristicvaluechanged", () => {
      if (c.value) onBpm(parseHeartRate(c.value));
    });
    // A watch that wants to pair makes the browser or phone show its pairing prompt here.
    await step("notify", name, 2, 30_000, () => c.startNotifications());
    ch = c;
    device.addEventListener("gattserverdisconnected", () => {
      if (live) {
        live = false;
        onGone();
      }
    });
  } catch (e) {
    live = false;
    gatt.disconnect();
    throw e instanceof HrError ? e : new HrError(classify(e, "notify"), name, e);
  }
  if (device.id) saveHr({ id: device.id, name });
  return {
    name: name ?? t("hr.device"),
    disconnect: async () => {
      live = false;
      if (ch?.stopNotifications) await withTimeout(ch.stopNotifications(), 3_000).catch(() => {});
      gatt.disconnect();
    },
  };
}

/**
 * Connect a heart rate monitor and start its readings. The monitor used last time is tried first,
 * by id and without a scan; only if that fails does the picker open. With `quiet` (the automatic
 * connect when a workout starts, and reconnects after a drop) the picker never opens. Every failure
 * is an `HrError` whose `problem` says what to tell the lifter (`hrMessage`); nothing hangs.
 */
export async function connectHeartRate(
  onBpm: (bpm: number) => void,
  onGone: () => void,
  opts: { quiet?: boolean } = {},
): Promise<HrConnection> {
  if (isNative()) return connectNative(onBpm, onGone, !!opts.quiet);
  const bt = (navigator as unknown as { bluetooth: BT }).bluetooth;
  const saved = savedHr();
  let last: HrError | null = null;
  if (saved && bt.getDevices) {
    const known = (await bt.getDevices().catch(() => [])).find((d) => d.id === saved.id);
    if (known) {
      try {
        return await openWeb(known, QUICK, onBpm, onGone);
      } catch (e) {
        last = e instanceof HrError ? e : new HrError("failed", saved.name, e);
      }
    }
  }
  if (opts.quiet) throw last ?? new HrError("notFound", saved?.name);
  let device: WebDevice;
  try {
    device = await bt.requestDevice({ filters: [{ services: ["heart_rate"] }] });
  } catch (e) {
    throw new HrError(classify(e, "pick"), saved?.name, e);
  }
  return openWeb(device, FULL, onBpm, onGone);
}

/** Zones as a share of an age-estimated maximum (Tanaka: 208 − 0.7 × age). */
export function hrZone(bpm: number, maxHr = 185): { zone: number; colour: string } {
  const p = bpm / maxHr;
  const zone = p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
  return { zone, colour: `var(--hr-${zone})` };
}
