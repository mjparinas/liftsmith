// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SonosNow } from "@/lib/cloud";
import { SONOS_DEFAULTS, sonosMute, sonosSend, useSonos } from "@/lib/sonos";

import { SonosBar } from "./Sonos";

vi.mock("@/lib/sonos", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/sonos")>();
  return { ...real, refreshSonos: vi.fn(async () => {}), sonosSend: vi.fn(async () => true), sonosMute: vi.fn(async () => true) };
});

const now: SonosNow = {
  group: "G1",
  playing: true,
  volume: 40,
  muted: false,
  track: "Lift Off",
  artist: null,
  image: null,
  source: null,
  canSkip: true,
  canSkipBack: true,
};

function show(over: Partial<SonosNow> = {}) {
  useSonos.setState({
    prefs: { ...SONOS_DEFAULTS, group: "G1", groupName: "Garage" },
    state: { groups: [{ id: "G1", name: "Garage", household: "H", playing: true }], favourites: [], now: { ...now, ...over } },
    error: null,
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("SonosBar", () => {
  it("mutes with the speaker button, shows it, and unmutes back", () => {
    show();
    render(<SonosBar resting={false} />);
    const btn = screen.getByTestId("sonos-mute");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(sonosMute).toHaveBeenCalledWith(true);
    act(() => show({ muted: true }));
    expect(screen.getByTestId("sonos-mute").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByTestId("sonos-mute"));
    expect(sonosMute).toHaveBeenLastCalledWith(false);
  });

  it("turning it up during a set makes that the set volume; during rest, the rest volume", () => {
    show();
    const { rerender } = render(<SonosBar resting={false} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "62" } });
    act(() => void vi.advanceTimersByTime(400));
    expect(sonosSend).toHaveBeenCalledWith({ do: "volume", level: 62 });
    expect(useSonos.getState().prefs.setVolume).toBe(62);
    rerender(<SonosBar resting />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "30" } });
    act(() => void vi.advanceTimersByTime(400));
    expect(useSonos.getState().prefs).toMatchObject({ setVolume: 62, restVolume: 30 });
  });

  it("unmutes when the volume is moved while muted", () => {
    show({ muted: true });
    render(<SonosBar resting={false} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "50" } });
    act(() => void vi.advanceTimersByTime(400));
    expect(sonosMute).toHaveBeenCalledWith(false);
  });
});
