// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";

import type { SonosGroup, SonosNow } from "./cloud";
import { useCloud } from "./connections";
import { setLab } from "./labs";
import { followWorkout, musicSteps, optimistic, pickGroup, setSonosPrefs, SONOS_DEFAULTS, useSonos, type SonosPrefs } from "./sonos";
import type { Active } from "./store/workout";
import { ACCOUNT_KEY } from "./syncOutbox";

const NOW = 1_800_000_000_000;
const prefs: SonosPrefs = { ...SONOS_DEFAULTS, group: "G1", groupName: "Garage" };
// Only the fields the music rules read.
const active = (over: Partial<Active> = {}) => ({ sessionId: "s1", startedAt: NOW - 1000, restUntil: null, ...over }) as Active;

describe("musicSteps", () => {
  it("starts the music at the set volume with a new workout, or the chosen favourite", () => {
    expect(musicSteps(null, active(), prefs, NOW)).toEqual([{ do: "play" }, { do: "volume", level: 40 }]);
    expect(musicSteps(null, active(), { ...prefs, startFavourite: "7" }, NOW)).toEqual([
      { do: "favourite", id: "7" },
      { do: "volume", level: 40 },
    ]);
  });

  it("leaves a workout coming back from storage alone", () => {
    expect(musicSteps(null, active({ startedAt: NOW - 10 * 60_000 }), prefs, NOW)).toEqual([]);
  });

  it("turns down for rest and back up when rest is skipped", () => {
    const set = active();
    const rest = active({ restUntil: NOW + 90_000 });
    expect(musicSteps(set, rest, prefs, NOW)).toEqual([{ do: "volume", level: 25 }]);
    expect(musicSteps(rest, active({ restUntil: null }), prefs, NOW)).toEqual([{ do: "volume", level: 40 }]);
    // +30 s while resting changes nothing.
    expect(musicSteps(rest, active({ restUntil: NOW + 120_000 }), prefs, NOW)).toEqual([]);
  });

  it("pauses at the end only when asked, and does nothing when not following", () => {
    expect(musicSteps(active(), null, prefs, NOW)).toEqual([{ do: "pause" }]);
    expect(musicSteps(active(), null, { ...prefs, pauseAtEnd: false }, NOW)).toEqual([]);
    expect(musicSteps(null, active(), { ...prefs, follow: false }, NOW)).toEqual([]);
  });
});

describe("pickGroup", () => {
  const g = (id: string, name: string, playing = false): SonosGroup => ({ id, name, household: "H", playing });
  it("keeps the saved speaker, finds it by name after regrouping, else the one playing", () => {
    const groups = [g("A", "Kitchen"), g("B2", "Garage"), g("C", "Den", true)];
    expect(pickGroup(groups, { group: "A", groupName: "Kitchen" })?.id).toBe("A");
    expect(pickGroup(groups, { group: "B1", groupName: "Garage" })?.id).toBe("B2");
    expect(pickGroup(groups, { group: null, groupName: null })?.id).toBe("C");
    expect(pickGroup([], prefs)).toBeNull();
  });
});

describe("optimistic", () => {
  const now: SonosNow = { group: "G1", playing: false, volume: 98, track: null, artist: null, image: null };
  it("shows the change straight away, within 0 to 100", () => {
    expect(optimistic(now, { do: "play" }).playing).toBe(true);
    expect(optimistic(now, { do: "nudge", delta: 5 }).volume).toBe(100);
    expect(optimistic({ ...now, volume: null }, { do: "volume", level: 10 }).volume).toBeNull();
  });
});

describe("prefs", () => {
  afterEach(() => localStorage.clear());
  it("never lets rest be louder than sets", () => {
    setSonosPrefs({ setVolume: 30, restVolume: 60 });
    expect(useSonos.getState().prefs).toMatchObject({ setVolume: 30, restVolume: 30 });
  });
});

describe("followWorkout", () => {
  let posts: unknown[];
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    posts = [];
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ token: "tok", id: "a1" }));
    setLab("labSonos", true);
    useCloud.setState({ status: { ready: {} as never, linked: { sonos: { since: NOW } } } });
    useSonos.setState({ prefs, state: null, error: null });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.body) posts.push(JSON.parse(String(init.body)));
        return new Response("{}", { status: 200 });
      }),
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
    useCloud.setState({ status: null });
  });

  it("turns down for rest and back up once when rest runs out", async () => {
    const store = create<{ active: Active | null }>(() => ({ active: active() }));
    const off = followWorkout(store);
    store.setState({ active: active({ restUntil: NOW + 60_000 }) });
    await vi.advanceTimersByTimeAsync(0);
    expect(posts).toEqual([{ group: "G1", command: { do: "volume", level: 25 } }]);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(posts.at(-1)).toEqual({ group: "G1", command: { do: "volume", level: 40 } });
    expect(posts).toHaveLength(2);
    off();
  });

  it("does nothing while the lab is off", async () => {
    setLab("labSonos", false);
    const store = create<{ active: Active | null }>(() => ({ active: active() }));
    const off = followWorkout(store);
    store.setState({ active: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(posts).toEqual([]);
    off();
  });
});
