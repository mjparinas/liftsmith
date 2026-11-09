import { afterEach, describe, expect, it, vi } from "vitest";
import { classify, connectHeartRate, HrError, hrMessage, parseHeartRate } from "./heartRate";

const err = (name: string, message: string) => Object.assign(new Error(message), { name });

type Fake = {
  connect: ReturnType<typeof vi.fn>;
  getPrimaryService: ReturnType<typeof vi.fn>;
  startNotifications: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

function fakeBluetooth(opts: { pick?: () => Promise<void>; name?: string } = {}): Fake {
  const ch = Object.assign(new EventTarget(), { startNotifications: vi.fn(async () => undefined), value: undefined as DataView | undefined });
  const fake: Fake = {
    connect: vi.fn(),
    getPrimaryService: vi.fn(async () => ({ getCharacteristic: async () => ch })),
    startNotifications: ch.startNotifications,
    disconnect: vi.fn(),
  };
  const gatt = { connected: true, connect: fake.connect, disconnect: fake.disconnect };
  const server = { connected: true, getPrimaryService: fake.getPrimaryService, disconnect: fake.disconnect };
  fake.connect.mockResolvedValue(server);
  vi.stubGlobal("navigator", {
    bluetooth: {
      requestDevice: async () => {
        await opts.pick?.();
        return { name: opts.name ?? "Fitbit Air", gatt, addEventListener: () => {} };
      },
    },
  });
  return fake;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("parseHeartRate", () => {
  it("reads 8- and 16-bit values", () => {
    expect(parseHeartRate(new DataView(new Uint8Array([0, 72]).buffer))).toBe(72);
    expect(parseHeartRate(new DataView(new Uint8Array([1, 0x2c, 0x01]).buffer))).toBe(300);
  });
});

describe("classify", () => {
  it("treats a closed picker as cancelled, not an error to show", () => {
    expect(classify(err("NotFoundError", "User cancelled the requestDevice() chooser."), "pick")).toBe("cancelled");
    expect(classify(new Error("requestDevice cancelled."), "pick")).toBe("cancelled");
    expect(hrMessage("cancelled")).toBeNull();
  });
  it("spots Bluetooth off and blocked permission", () => {
    expect(classify(err("NotFoundError", "Bluetooth adapter not available."), "pick")).toBe("bluetoothOff");
    expect(classify(new Error("Bluetooth LE not enabled."), "pick")).toBe("bluetoothOff");
    expect(classify(err("SecurityError", "Origin is not allowed to access the service."), "pick")).toBe("blocked");
  });
  it("names a missing heart rate service", () => {
    expect(classify(err("NotFoundError", "No Services matching UUID 0000180d found in Device."), "service")).toBe("noService");
  });
  it("names pairing and unreachable devices", () => {
    expect(classify(err("NetworkError", "GATT operation failed due to insufficient authentication."), "notify")).toBe("pairing");
    expect(classify(err("NetworkError", "Connection failed for unknown reason."), "connect")).toBe("unreachable");
    expect(classify(new Error("timed out"), "connect")).toBe("unreachable");
  });
});

describe("hrMessage", () => {
  it("adds the Fitbit sharing steps for a Fitbit", () => {
    const m = hrMessage("noService", "Fitbit Air")!;
    expect(m).toContain("Fitbit Air");
    expect(m).toContain("Share heart rate");
  });
  it("leaves the tip off for other straps", () => {
    expect(hrMessage("unreachable", "Polar H10")).not.toContain("Google Health");
  });
});

describe("connectHeartRate (Web Bluetooth)", () => {
  it("retries a failed first GATT connect", async () => {
    const fake = fakeBluetooth();
    fake.connect.mockRejectedValueOnce(err("NetworkError", "Connection failed for unknown reason."));
    const c = await connectHeartRate(() => {}, () => {});
    expect(c.name).toBe("Fitbit Air");
    expect(fake.connect).toHaveBeenCalledTimes(2);
    expect(fake.startNotifications).toHaveBeenCalled();
  });

  it("gives up with 'unreachable' when the device never answers, instead of hanging", async () => {
    vi.useFakeTimers();
    const fake = fakeBluetooth();
    fake.connect.mockReturnValue(new Promise(() => {}));
    const p = connectHeartRate(() => {}, () => {}).catch((e) => e);
    await vi.advanceTimersByTimeAsync(60_000);
    const e = await p;
    expect(e).toBeInstanceOf(HrError);
    expect((e as HrError).problem).toBe("unreachable");
    expect(fake.connect).toHaveBeenCalledTimes(3);
  });

  it("says when the device has no standard heart rate service", async () => {
    const fake = fakeBluetooth();
    fake.getPrimaryService.mockRejectedValue(err("NotFoundError", "No Services matching UUID 0000180d found in Device."));
    const e = await connectHeartRate(() => {}, () => {}).catch((x) => x);
    expect((e as HrError).problem).toBe("noService");
    expect((e as HrError).device).toBe("Fitbit Air");
    expect(fake.disconnect).toHaveBeenCalled();
  });

  it("reports a closed picker as cancelled", async () => {
    fakeBluetooth({ pick: async () => { throw err("NotFoundError", "User cancelled the requestDevice() chooser."); } });
    const e = await connectHeartRate(() => {}, () => {}).catch((x) => x);
    expect((e as HrError).problem).toBe("cancelled");
  });
});
