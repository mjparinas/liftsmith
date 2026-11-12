import { afterEach, describe, expect, it, vi } from "vitest";

import type { MachineReading, MachineSet } from "./ftms";
import { MachineError, type MachineConnection } from "./machine";
import { MACHINE_RETRY_MS, MachineLink } from "./machineLink";

type Handlers = { onReading: (r: MachineReading) => void; onGone: () => void; again?: { id: string; name: string } };

function fakeConnect() {
  const calls: Handlers[] = [];
  let fail: MachineError | null = null;
  const connect = vi.fn(
    async (
      onReading: (r: MachineReading) => void,
      onGone: () => void,
      again?: { id: string; name: string },
    ): Promise<MachineConnection> => {
      calls.push({ onReading, onGone, again });
      if (fail) throw fail;
      return { id: "m1", name: "Bike 7", disconnect: vi.fn(async () => {}) };
    },
  );
  return { connect, calls, failWith: (e: MachineError | null) => (fail = e) };
}

afterEach(() => vi.useRealTimers());

describe("MachineLink", () => {
  it("fills in the set on screen and starts a new one when a set is logged", async () => {
    const f = fakeConnect();
    let clock = 0;
    const link = new MachineLink(f.connect, () => clock);
    let key: string | null = "s:0:0";
    const applied: MachineSet[] = [];
    link.bind({ key: () => key, apply: (s) => applied.push(s) });
    await link.tap();
    expect(link.get()).toMatchObject({ status: "live", name: "Bike 7" });
    const send = f.calls[0]!.onReading;
    send({ kind: "bike", elapsedS: 10, distanceM: 50 });
    clock += 1000;
    send({ kind: "bike", elapsedS: 11, distanceM: 56 });
    expect(applied.at(-1)).toEqual({ seconds: 11, distanceM: 56 });
    key = "s:0:1"; // Log set
    clock += 1000;
    send({ kind: "bike", elapsedS: 12, distanceM: 62 });
    expect(applied.at(-1)).toEqual({ seconds: 1, distanceM: 6 });
  });

  it("leaves strength sets alone and counts a cardio set from when it comes on screen", async () => {
    const f = fakeConnect();
    const link = new MachineLink(f.connect, () => 0);
    let key: string | null = null;
    const applied: MachineSet[] = [];
    link.bind({ key: () => key, apply: (s) => applied.push(s) });
    await link.tap();
    f.calls[0]!.onReading({ kind: "rower", elapsedS: 300, distanceM: 1000 });
    expect(applied).toHaveLength(0);
    key = "s:1:3";
    f.calls[0]!.onReading({ kind: "rower", elapsedS: 310, distanceM: 1040 });
    expect(applied.at(-1)).toEqual({ seconds: 10, distanceM: 40 });
  });

  it("says why it couldn't connect, and nothing when the picker was closed", async () => {
    const f = fakeConnect();
    const link = new MachineLink(f.connect);
    f.failWith(new MachineError("noService", "Treadmill"));
    await link.tap();
    expect(link.get().status).toBe("off");
    expect(link.get().error).toContain("Treadmill");
    f.failWith(new MachineError("cancelled"));
    await link.tap();
    expect(link.get().error).toBeNull();
  });

  it("reconnects to the same machine after a drop, then tells the lifter when it gives up", async () => {
    vi.useFakeTimers();
    const f = fakeConnect();
    const link = new MachineLink(f.connect);
    await link.tap();
    f.failWith(new MachineError("unreachable", "Bike 7"));
    f.calls[0]!.onGone();
    expect(link.get().status).toBe("reconnecting");
    for (const ms of MACHINE_RETRY_MS) await vi.advanceTimersByTimeAsync(ms);
    expect(f.calls.slice(1).every((c) => c.again?.id === "m1")).toBe(true);
    expect(link.get().status).toBe("off");
    expect(link.get().error).toContain("Bike 7");
  });

  it("lets the machine go when stopped", async () => {
    const f = fakeConnect();
    const link = new MachineLink(f.connect);
    await link.tap();
    await link.stop();
    expect(link.get()).toMatchObject({ status: "off", set: null });
  });
});
