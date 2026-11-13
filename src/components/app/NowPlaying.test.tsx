// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { nextNow, nowPlayingOn, useNowPlaying } from "@/lib/nowPlaying";
import { useApp } from "@/lib/store";

import { NowPlayingBar, NowPlayingSetting } from "./NowPlaying";

// Now playing: the phone's plugin says what's playing, the bar shows it and sends play, pause and skip.

type Snap = { now: { playing: boolean; title?: string; artist?: string; app?: string } | null; granted?: boolean };
let change: (d: Snap) => void = () => {};
const song: Snap = { now: { playing: true, title: "Run It", artist: "Someone", app: "Spotify" }, granted: true };
const plugin = {
  state: vi.fn(() => Promise.resolve(song)),
  watch: vi.fn(() => Promise.resolve(song)),
  unwatch: vi.fn(() => Promise.resolve()),
  control: vi.fn((o: { do: string }) => Promise.resolve(void o)),
  access: vi.fn(() => Promise.resolve({ granted: false, canAsk: true })),
  askAccess: vi.fn(() => Promise.resolve({ granted: true, canAsk: true })),
  addListener: vi.fn((_e: string, cb: (d: Snap) => void) => {
    change = cb;
    return { remove: () => {} };
  }),
};

describe("Now playing", () => {
  beforeEach(async () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "android",
      Plugins: { NowPlaying: plugin },
    };
    localStorage.clear();
    await useApp.getState().reset();
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true });
    useNowPlaying.getState().clear();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
  });

  it("shows the song and pauses, skips and goes back through the phone", async () => {
    const user = userEvent.setup();
    render(<NowPlayingBar />);
    expect(await screen.findByText("Run It")).toBeInTheDocument();
    expect(screen.getByText("Someone · Spotify")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(plugin.control).toHaveBeenCalledWith({ do: "pause" });
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next song" }));
    await user.click(screen.getByRole("button", { name: "Previous song" }));
    expect(plugin.control).toHaveBeenCalledWith({ do: "next" });
    expect(plugin.control).toHaveBeenCalledWith({ do: "previous" });
  });

  it("follows the phone's updates, and hides when nothing is playing", async () => {
    render(<NowPlayingBar />);
    await screen.findByText("Run It");
    act(() => change({ now: { playing: true, title: "Next One", app: "Spotify" } }));
    expect(screen.getByText("Next One")).toBeInTheDocument();
    act(() => change({ now: null }));
    expect(screen.queryByTestId("now-playing")).toBeNull();
  });

  it("stops listening when it closes", async () => {
    const { unmount } = render(<NowPlayingBar />);
    await screen.findByText("Run It");
    unmount();
    expect(plugin.unwatch).toHaveBeenCalled();
  });

  it("is off with the switch off, and on the web", () => {
    useApp.getState().setProfile({ training: { nowPlaying: false } });
    render(<NowPlayingBar />);
    expect(plugin.watch).not.toHaveBeenCalled();
    expect(nowPlayingOn(useApp.getState().profile)).toBe(false);
    useApp.getState().setProfile({ training: {} });
    expect(nowPlayingOn(useApp.getState().profile)).toBe(true);
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    expect(nowPlayingOn(useApp.getState().profile)).toBe(false);
  });

  it("without song names, keeps a paused control so Play stays there", () => {
    const playing = nextNow(null, { playing: true });
    expect(nextNow(playing, null)).toEqual({ playing: false });
    expect(nextNow({ playing: true, title: "A song" }, null)).toBeNull();
    expect(nextNow(null, null)).toBeNull();
  });

  it("the setting asks Android for song names", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NowPlayingSetting on onChange={onChange} />);
    await user.click(await screen.findByRole("button", { name: "Show song names" }));
    expect(plugin.askAccess).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Show song names" })).toBeNull());
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
