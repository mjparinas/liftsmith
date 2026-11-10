import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectHeartRate, HrError, saveHr } from "./heartRate";

// The native path (Android and iOS) through the Capacitor BLE plugin.
const HR = "0000180d-0000-1000-8000-00805f9b34fb";
const ble = vi.hoisted(() => ({
  platform: "android",
  initialize: vi.fn(async () => {}),
  requestDevice: vi.fn(async () => ({ deviceId: "AA:BB", name: "Fitbit Air" })),
  getDevices: vi.fn(async () => []),
  getConnectedDevices: vi.fn(async (): Promise<{ deviceId: string; name?: string }[]> => []),
  getBondedDevices: vi.fn(async (): Promise<{ deviceId: string; name?: string }[]> => []),
  connect: vi.fn(async (id: string): Promise<void> => void id),
  disconnect: vi.fn(async () => {}),
  getServices: vi.fn(async () => [{ uuid: "0000180d-0000-1000-8000-00805f9b34fb" }]),
  startNotifications: vi.fn(async () => {}),
  stopNotifications: vi.fn(async () => {}),
  isBonded: vi.fn(async () => true),
  createBond: vi.fn(async () => {}),
}));

vi.mock("./juice", () => ({ isNative: () => true }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => ble.platform } }));
vi.mock("@capacitor-community/bluetooth-le", () => ({ BleClient: ble }));

const noop = () => {};

beforeEach(() => {
  vi.clearAllMocks();
  ble.platform = "android";
  ble.connect.mockImplementation(async () => {});
  ble.getBondedDevices.mockResolvedValue([]);
  ble.getConnectedDevices.mockResolvedValue([]);
  const m = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  });
});

describe("connectHeartRate (Android and iOS)", () => {
  it("connects to the saved monitor by id, without a scan", async () => {
    saveHr({ id: "AA:BB", name: "Fitbit Air" });
    const c = await connectHeartRate(noop, noop);
    expect(c.name).toBe("Fitbit Air");
    expect(ble.requestDevice).not.toHaveBeenCalled();
    expect(ble.connect).toHaveBeenCalledWith("AA:BB", expect.any(Function), expect.anything());
    expect(ble.startNotifications).toHaveBeenCalledWith("AA:BB", HR, expect.any(String), expect.any(Function));
  });

  it("finds the saved monitor under a new address by its name among bonded devices", async () => {
    saveHr({ id: "OLD", name: "Fitbit Air" });
    ble.getBondedDevices.mockResolvedValue([
      { deviceId: "EAR", name: "Buds" },
      { deviceId: "NEW", name: "Fitbit Air" },
    ]);
    ble.connect.mockImplementation(async (id: string) => {
      if (id === "OLD") throw new Error("Connection timeout.");
    });
    await connectHeartRate(noop, noop);
    expect(ble.connect.mock.calls.map((c) => c[0])).toEqual(["OLD", "NEW"]);
    expect(ble.requestDevice).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("liftsmith.hr.device")!)).toEqual({ id: "NEW", name: "Fitbit Air" });
  });

  it("looks the saved monitor up first on iOS, which only connects to devices it knows", async () => {
    ble.platform = "ios";
    saveHr({ id: "1E2F-UUID", name: "Polar H10" });
    await connectHeartRate(noop, noop);
    expect(ble.getDevices).toHaveBeenCalledWith(["1E2F-UUID"]);
    expect(ble.getBondedDevices).not.toHaveBeenCalled();
  });

  it("a quiet reconnect never opens the picker", async () => {
    saveHr({ id: "AA:BB", name: "Fitbit Air" });
    ble.connect.mockRejectedValue(new Error("Connection timeout."));
    const e = await connectHeartRate(noop, noop, { quiet: true }).catch((x) => x);
    expect(e).toBeInstanceOf(HrError);
    expect(ble.requestDevice).not.toHaveBeenCalled();
  });

  it("falls back to the picker when the lifter taps Connect and the saved monitor isn't there", async () => {
    saveHr({ id: "GONE", name: "Fitbit Air" });
    ble.connect.mockImplementation(async (id: string) => {
      if (id === "GONE") throw new Error("Connection timeout.");
    });
    await connectHeartRate(noop, noop);
    expect(ble.requestDevice).toHaveBeenCalledTimes(1);
  });

  it("releases the monitor fully: readings stopped, then the link dropped", async () => {
    const c = await connectHeartRate(noop, noop);
    await c.disconnect();
    expect(ble.stopNotifications).toHaveBeenCalledWith("AA:BB", HR, expect.any(String));
    expect(ble.disconnect).toHaveBeenCalledWith("AA:BB");
    expect(ble.stopNotifications.mock.invocationCallOrder[0]!).toBeLessThan(ble.disconnect.mock.invocationCallOrder[0]!);
  });

  it("doesn't report its own release as a dropped link", async () => {
    const gone = vi.fn();
    const c = await connectHeartRate(noop, gone);
    await c.disconnect();
    const onDisconnect = (ble.connect.mock.calls[0] as unknown as [string, () => void])[1];
    onDisconnect();
    expect(gone).not.toHaveBeenCalled();
  });
});
