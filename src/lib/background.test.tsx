// @vitest-environment jsdom
// Nothing keeps the phone awake while the app is in the background (docs/decisions/battery.md).
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTO_END_MS, type Active } from "./store/workout";
import { useNow } from "./useNow";
import { watchWorkout } from "./workoutWatch";

const stopSession = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("./sessionNotify", () => ({ stopSession }));

let state: "visible" | "hidden" = "visible";
function setVisibility(s: "visible" | "hidden") {
  state = s;
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2026, 10, 2, 12));
  state = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  stopSession.mockClear();
});
afterEach(() => vi.useRealTimers());

function Clock({ ms, wakeAt, onTick }: { ms: number; wakeAt?: number; onTick: (n: number) => void }) {
  onTick(useNow(ms, wakeAt));
  return null;
}

describe("useNow", () => {
  it("ticks while on screen, stops in the background and catches up on return", () => {
    const ticks: number[] = [];
    render(<Clock ms={1000} onTick={(n) => ticks.push(n)} />);
    for (let i = 0; i < 3; i++) act(() => void vi.advanceTimersByTime(1000));
    const shown = ticks.length;
    expect(shown).toBeGreaterThanOrEqual(4);

    act(() => setVisibility("hidden"));
    const atHide = ticks.length;
    act(() => void vi.advanceTimersByTime(60 * 60_000));
    expect(ticks.length).toBe(atHide); // an hour in the background: not one redraw
    expect(vi.getTimerCount()).toBe(0); // and no timer left to wake the phone

    act(() => setVisibility("visible"));
    expect(ticks.at(-1)).toBe(Date.now()); // the right time straight away
    act(() => void vi.advanceTimersByTime(1000));
    expect(ticks.length).toBeGreaterThan(atHide + 1);
  });

  it("wakes once at wakeAt while hidden (the web's rest-over alert), and only once", () => {
    const ticks: number[] = [];
    const restUntil = Date.now() + 90_000;
    render(<Clock ms={250} wakeAt={restUntil} onTick={(n) => ticks.push(n)} />);
    act(() => setVisibility("hidden"));
    const atHide = ticks.length;
    act(() => void vi.advanceTimersByTime(89_000));
    expect(ticks.length).toBe(atHide);
    act(() => void vi.advanceTimersByTime(2_000));
    expect(ticks.length).toBe(atHide + 1);
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(restUntil);
    act(() => void vi.advanceTimersByTime(10 * 60_000));
    expect(ticks.length).toBe(atHide + 1);
  });
});

type S = { active: Active | null; autoEnd(now?: number): boolean };
function fakeStore(active: Active | null) {
  const subs = new Set<(s: S, p: S) => void>();
  const store = {
    s: null as unknown as S,
    getState: () => store.s,
    subscribe: (cb: (s: S, p: S) => void) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    set(active: Active | null) {
      const prev = store.s;
      store.s = { ...prev, active };
      subs.forEach((cb) => cb(store.s, prev));
    },
  };
  const autoEnd = vi.fn((now = Date.now()) => {
    const a = store.s.active;
    if (!a || now - a.lastAt < AUTO_END_MS) return false;
    store.set(null);
    return true;
  });
  store.s = { active, autoEnd };
  return { store, autoEnd };
}
const workout = (lastAt: number) => ({ sessionId: "s1", lastAt }) as Active;

describe("watchWorkout", () => {
  it("ends a forgotten workout from one timer, not a poll, and stops the live notification", () => {
    const { store, autoEnd } = fakeStore(workout(Date.now()));
    const onAutoEnd = vi.fn();
    const stop = watchWorkout(store, onAutoEnd);
    expect(vi.getTimerCount()).toBe(1);
    autoEnd.mockClear();
    act(() => void vi.advanceTimersByTime(AUTO_END_MS - 60_000));
    expect(autoEnd).not.toHaveBeenCalled(); // nothing ran for three hours
    act(() => void vi.advanceTimersByTime(2 * 60_000));
    expect(onAutoEnd).toHaveBeenCalledOnce();
    expect(store.getState().active).toBeNull();
    expect(stopSession).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    stop();
  });

  it("moves the deadline when the lifter does something", () => {
    const { store } = fakeStore(workout(Date.now()));
    const onAutoEnd = vi.fn();
    watchWorkout(store, onAutoEnd);
    act(() => void vi.advanceTimersByTime(2 * 3600_000));
    act(() => store.set(workout(Date.now())));
    act(() => void vi.advanceTimersByTime(2 * 3600_000));
    expect(onAutoEnd).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(3600_000 + 2_000));
    expect(onAutoEnd).toHaveBeenCalledOnce();
  });

  it("runs no timer at all without a workout, and stops the notification however a workout ends", () => {
    const { store } = fakeStore(null);
    watchWorkout(store, vi.fn());
    expect(vi.getTimerCount()).toBe(0);
    act(() => store.set(workout(Date.now())));
    expect(vi.getTimerCount()).toBe(1);
    act(() => store.set(null)); // Finish or Discard
    expect(stopSession).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("checks again on return to the app", () => {
    const { store } = fakeStore(workout(Date.now() - AUTO_END_MS - 1));
    const onAutoEnd = vi.fn();
    // Still running when the watcher starts would end at once; start it with a fresh one, then age it.
    store.s = { ...store.s, active: workout(Date.now()) };
    watchWorkout(store, onAutoEnd);
    vi.setSystemTime(Date.now() + AUTO_END_MS + 5_000); // the phone slept through the timer
    act(() => setVisibility("hidden"));
    expect(onAutoEnd).not.toHaveBeenCalled();
    act(() => setVisibility("visible"));
    expect(onAutoEnd).toHaveBeenCalledOnce();
  });
});
