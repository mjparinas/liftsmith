import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HrError, saveHr, type HrConnection } from "./heartRate";
import { HrLink, RETRY_MS } from "./hrLink";

type Handlers = { onBpm: (b: number) => void; onGone: () => void; quiet: boolean };

function fakeConnect() {
  const calls: Handlers[] = [];
  const conns: { disconnect: ReturnType<typeof vi.fn> }[] = [];
  let fail: HrError | null = null;
  const connect = vi.fn(async (onBpm: (b: number) => void, onGone: () => void, opts: { quiet?: boolean } = {}): Promise<HrConnection> => {
    calls.push({ onBpm, onGone, quiet: !!opts.quiet });
    if (fail) throw fail;
    const c = { name: "Fitbit Air", disconnect: vi.fn(async () => {}) };
    conns.push(c);
    return c;
  });
  return { connect, calls, conns, failWith: (e: HrError | null) => (fail = e) };
}

beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("HrLink", () => {
  it("connects by itself once per workout when a monitor connected before", async () => {
    saveHr({ id: "AA:BB", name: "Fitbit Air" });
    const f = fakeConnect();
    const link = new HrLink(f.connect);
    link.auto("s1");
    link.auto("s1");
    await vi.waitFor(() => expect(link.get().status).toBe("live"));
    expect(f.connect).toHaveBeenCalledTimes(1);
    expect(f.calls[0]!.quiet).toBe(true);
  });

  it("doesn't try on its own when no monitor has connected before", () => {
    const f = fakeConnect();
    new HrLink(f.connect).auto("s1");
    expect(f.connect).not.toHaveBeenCalled();
  });

  it("stays quiet when the automatic connect finds nothing", async () => {
    saveHr({ id: "AA:BB", name: "Fitbit Air" });
    const f = fakeConnect();
    f.failWith(new HrError("unreachable", "Fitbit Air"));
    const link = new HrLink(f.connect);
    link.auto("s1");
    await vi.waitFor(() => expect(f.connect).toHaveBeenCalled());
    await Promise.resolve();
    expect(link.get()).toMatchObject({ status: "off", error: null });
  });

  it("shows why when the lifter's own tap fails", async () => {
    const f = fakeConnect();
    f.failWith(new HrError("notFound"));
    const link = new HrLink(f.connect);
    await link.tap();
    expect(f.calls[0]!.quiet).toBe(false);
    expect(link.get().error).toContain("No heart rate monitor");
  });

  it("reconnects after a drop, waiting longer each time, then tells the lifter", async () => {
    vi.useFakeTimers();
    const f = fakeConnect();
    const link = new HrLink(f.connect);
    await link.tap();
    f.failWith(new HrError("unreachable", "Fitbit Air"));
    f.calls[0]!.onGone();
    expect(link.get().status).toBe("reconnecting");
    for (const wait of RETRY_MS) {
      const before = f.connect.mock.calls.length;
      await vi.advanceTimersByTimeAsync(wait - 1);
      expect(f.connect.mock.calls.length).toBe(before);
      await vi.advanceTimersByTimeAsync(1);
      expect(f.connect.mock.calls.length).toBe(before + 1);
      expect(f.calls.at(-1)!.quiet).toBe(true);
    }
    expect(link.get().status).toBe("off");
    expect(link.get().error).toContain("Lost Fitbit Air");
  });

  it("is live again as soon as a reconnect works", async () => {
    vi.useFakeTimers();
    const f = fakeConnect();
    const link = new HrLink(f.connect);
    await link.tap();
    f.calls[0]!.onGone();
    await vi.advanceTimersByTimeAsync(RETRY_MS[0]!);
    expect(link.get().status).toBe("live");
  });

  it("releases the monitor and stops retrying when the workout ends", async () => {
    vi.useFakeTimers();
    const f = fakeConnect();
    const link = new HrLink(f.connect);
    await link.tap();
    await link.stop();
    expect(f.conns[0]!.disconnect).toHaveBeenCalled();
    f.calls[0]!.onGone();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(f.connect).toHaveBeenCalledTimes(1);
    expect(link.get().status).toBe("off");
  });

  it("lets go of a connect that finishes after the workout ended", async () => {
    let finish: (c: HrConnection) => void = () => {};
    const disconnect = vi.fn(async () => {});
    const link = new HrLink(() => new Promise<HrConnection>((r) => (finish = r)));
    const p = link.tap();
    await link.stop();
    finish({ name: "Fitbit Air", disconnect });
    await p;
    expect(disconnect).toHaveBeenCalled();
    expect(link.get().status).toBe("off");
  });
});
