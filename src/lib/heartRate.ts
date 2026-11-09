"use client";
// Live heart rate from any Bluetooth heart rate broadcaster (standard Heart Rate Service 0x180D):
// Fitbit Charge 6 and Pixel Watch "share heart rate", Polar, Garmin, Wahoo, Coros straps.
// The web build uses Web Bluetooth (Chrome on Android). The native shells (Android and iOS) use the
// Capacitor BLE plugin, which keeps reading with the screen off.
import { isNative } from "./juice";

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

type BT = {
  requestDevice(o: unknown): Promise<{
    name?: string;
    gatt?: { connect(): Promise<{ getPrimaryService(s: string): Promise<{ getCharacteristic(c: string): Promise<EventTarget & { startNotifications(): Promise<unknown>; value?: DataView }> }>; disconnect(): void }> };
    addEventListener(t: string, f: () => void): void;
  }>;
};

export function hrSupported(): boolean {
  return isNative() || (typeof navigator !== "undefined" && "bluetooth" in navigator);
}

async function connectNative(onBpm: (bpm: number) => void, onGone: () => void): Promise<HrConnection> {
  const { BleClient } = await import("@capacitor-community/bluetooth-le");
  await BleClient.initialize({ androidNeverForLocation: true });
  const device = await BleClient.requestDevice({ services: [HR_SERVICE] });
  await BleClient.connect(device.deviceId, onGone);
  await BleClient.startNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT, (v) => onBpm(parseHeartRate(v)));
  return { name: device.name ?? "Heart rate monitor", disconnect: () => void BleClient.disconnect(device.deviceId) };
}

export async function connectHeartRate(onBpm: (bpm: number) => void, onGone: () => void): Promise<HrConnection> {
  if (isNative()) return connectNative(onBpm, onGone);
  const bt = (navigator as unknown as { bluetooth: BT }).bluetooth;
  const device = await bt.requestDevice({ filters: [{ services: ["heart_rate"] }] });
  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService("heart_rate");
  const ch = await service.getCharacteristic("heart_rate_measurement");
  ch.addEventListener("characteristicvaluechanged", () => {
    if (ch.value) onBpm(parseHeartRate(ch.value));
  });
  device.addEventListener("gattserverdisconnected", onGone);
  await ch.startNotifications();
  return { name: device.name ?? "Heart rate monitor", disconnect: () => server.disconnect() };
}

/** Zones as a share of an age-estimated maximum (Tanaka: 208 − 0.7 × age). */
export function hrZone(bpm: number, maxHr = 185): { zone: number; colour: string } {
  const p = bpm / maxHr;
  const zone = p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
  return { zone, colour: `var(--hr-${zone})` };
}
