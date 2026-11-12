"use client";

// Bluetooth gym machines (Labs, `labGymMachines`): connects a bike, rower, treadmill or cross trainer
// that shares the Fitness Machine Service and passes on its readings (ftms.ts reads them). Android and iOS
// use the same native Bluetooth plugin as the heart rate monitor (`@capacitor-community/bluetooth-le`:
// Android's BluetoothGatt and iOS's Core Bluetooth underneath), so both phones get the same thing from
// one path; the web app uses Web Bluetooth, which only Chrome has.
import { FTMS_DATA, FTMS_SERVICE, kindOf, PARSE, type MachineKind, type MachineReading } from "./ftms";
import { classify, type HrProblem } from "./heartRate";
import { t } from "./i18n";
import { isNative } from "./juice";

export interface MachineConnection {
  id: string;
  name: string;
  disconnect(): Promise<void>;
}

/** Why a connection failed: the heart rate problems (heartRate.ts `classify`), read for a machine. */
export class MachineError extends Error {
  constructor(
    public problem: HrProblem,
    public device?: string,
    cause?: unknown,
  ) {
    super(`gym machine: ${problem}${cause instanceof Error ? ` (${cause.name}: ${cause.message})` : ""}`);
    this.name = "MachineError";
  }
}

/** What to tell the lifter, or null when they closed the picker. */
export function machineMessage(problem: HrProblem, device?: string): string | null {
  const name = device?.trim() || t("lab.machines.device");
  switch (problem) {
    case "cancelled":
      return null;
    case "bluetoothOff":
      return t("hr.err.bluetoothOff");
    case "blocked":
      return t("hr.err.blocked");
    case "notFound":
      return t("lab.machines.err.notFound");
    case "noService":
      return t("lab.machines.err.noService", { name });
    case "lost":
      return t("lab.machines.err.lost", { name });
    case "pairing":
      return t("hr.err.pairing", { name });
    case "unreachable":
    case "failed":
      return t("lab.machines.err.failed", { name });
  }
}

export function machineSupported(): boolean {
  return isNative() || (typeof navigator !== "undefined" && "bluetooth" in navigator);
}

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

type OnReading = (r: MachineReading) => void;

async function connectNative(id: string | null, onReading: OnReading, onGone: () => void, name?: string): Promise<MachineConnection> {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  const { Capacitor } = await import("@capacitor/core");
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
  } catch (e) {
    throw new MachineError(classify(e, "pick"), name, e);
  }
  let deviceId = id;
  if (!deviceId) {
    try {
      const d = await BleClient.requestDevice({ services: [FTMS_SERVICE] });
      deviceId = d.deviceId;
      name = d.name ?? name;
    } catch (e) {
      throw new MachineError(classify(e, "pick"), name, e);
    }
  } else if (Capacitor.getPlatform() === "ios") {
    // iOS only knows a device by id after it's looked up again.
    await BleClient.getDevices([deviceId]).catch(() => []);
  }
  const did = deviceId;
  let live = true;
  const drop = () => BleClient.disconnect(did).catch(() => {});
  const started: string[] = [];
  try {
    await within(
      BleClient.connect(
        did,
        () => {
          if (live) {
            live = false;
            onGone();
          }
        },
        { timeout: STEP_MS },
      ),
      STEP_MS + 2_000,
    ).catch((e: unknown) => {
      throw new MachineError(classify(e, "connect"), name, e);
    });
    const services = await within(BleClient.getServices(did), STEP_MS).catch((e: unknown) => {
      throw new MachineError(classify(e, "service"), name, e);
    });
    const ftms = services.find((s) => s.uuid.toLowerCase() === FTMS_SERVICE);
    const kinds = (ftms?.characteristics ?? []).map((c) => kindOf(c.uuid)).filter((k): k is MachineKind => !!k);
    if (!kinds.length) throw new MachineError("noService", name);
    for (const k of kinds) {
      await within(
        BleClient.startNotifications(did, FTMS_SERVICE, FTMS_DATA[k], (v) => onReading(PARSE[k](v))),
        STEP_MS,
      ).catch((e: unknown) => {
        throw new MachineError(classify(e, "notify"), name, e);
      });
      started.push(FTMS_DATA[k]);
    }
  } catch (e) {
    live = false;
    await drop();
    throw e instanceof MachineError ? e : new MachineError(classify(e, "notify"), name, e);
  }
  return {
    id: did,
    name: name ?? t("lab.machines.device"),
    disconnect: async () => {
      live = false;
      for (const c of started) await within(BleClient.stopNotifications(did, FTMS_SERVICE, c), 3_000).catch(() => {});
      await within(drop(), 6_000).catch(() => {});
    },
  };
}

type WebChar = EventTarget & {
  uuid: string;
  value?: DataView;
  startNotifications(): Promise<unknown>;
  stopNotifications?(): Promise<unknown>;
};
type WebDevice = {
  id?: string;
  name?: string;
  gatt?: {
    connected?: boolean;
    connect(): Promise<{ getPrimaryService(s: string): Promise<{ getCharacteristics(): Promise<WebChar[]> }> }>;
    disconnect(): void;
  };
  addEventListener(t: string, f: () => void): void;
};
type WebBT = { requestDevice(o: unknown): Promise<WebDevice>; getDevices?(): Promise<WebDevice[]> };

async function connectWeb(id: string | null, onReading: OnReading, onGone: () => void, name?: string): Promise<MachineConnection> {
  const bt = (navigator as unknown as { bluetooth: WebBT }).bluetooth;
  let device: WebDevice | undefined;
  if (id && bt.getDevices) device = (await bt.getDevices().catch(() => [])).find((d) => d.id === id);
  if (!device) {
    if (id) throw new MachineError("lost", name);
    try {
      device = await bt.requestDevice({ filters: [{ services: [FTMS_SERVICE] }] });
    } catch (e) {
      throw new MachineError(classify(e, "pick"), name, e);
    }
  }
  const d = device;
  name = d.name ?? name;
  const gatt = d.gatt;
  if (!gatt) throw new MachineError("failed", name);
  let live = true;
  const chars: WebChar[] = [];
  try {
    const server = await within(gatt.connect(), STEP_MS).catch((e: unknown) => {
      throw new MachineError(classify(e, "connect"), name, e);
    });
    const service = await within(server.getPrimaryService(FTMS_SERVICE), STEP_MS).catch((e: unknown) => {
      throw new MachineError(classify(e, "service"), name, e);
    });
    const all = await within(service.getCharacteristics(), STEP_MS);
    for (const c of all) {
      const k = kindOf(c.uuid);
      if (!k) continue;
      c.addEventListener("characteristicvaluechanged", () => {
        if (c.value) onReading(PARSE[k](c.value));
      });
      await within(c.startNotifications(), STEP_MS);
      chars.push(c);
    }
    if (!chars.length) throw new MachineError("noService", name);
    d.addEventListener("gattserverdisconnected", () => {
      if (live) {
        live = false;
        onGone();
      }
    });
  } catch (e) {
    live = false;
    gatt.disconnect();
    throw e instanceof MachineError ? e : new MachineError(classify(e, "notify"), name, e);
  }
  return {
    id: d.id ?? "",
    name: name ?? t("lab.machines.device"),
    disconnect: async () => {
      live = false;
      for (const c of chars) if (c.stopNotifications) await within(c.stopNotifications(), 3_000).catch(() => {});
      gatt.disconnect();
    },
  };
}

/**
 * Connect a gym machine. With no `id` the phone's or browser's picker opens, showing only machines that
 * share the Fitness Machine Service; with one (a reconnect after a drop) it goes straight to that machine.
 * Every failure is a `MachineError` whose problem says what to tell the lifter (`machineMessage`).
 */
export function connectMachine(onReading: OnReading, onGone: () => void, again?: { id: string; name: string }): Promise<MachineConnection> {
  return isNative()
    ? connectNative(again?.id ?? null, onReading, onGone, again?.name)
    : connectWeb(again?.id ?? null, onReading, onGone, again?.name);
}
