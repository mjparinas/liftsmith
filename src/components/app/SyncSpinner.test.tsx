// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNet } from "@/lib/net";

import { MIN_SHOW_MS, SHOW_AFTER_MS, SyncSpinner } from "./SyncSpinner";

beforeEach(() => {
  vi.useFakeTimers();
  useNet.setState({ busy: 0, offline: false });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ring = () => screen.queryByTestId("sync-spinner");

describe("the syncing ring", () => {
  it("shows only while background work runs, after a short wait, and lingers a moment", () => {
    render(<SyncSpinner />);
    expect(ring()).toBeNull();
    act(() => {
      useNet.setState({ busy: 1 });
    });
    expect(ring()).toBeNull();
    act(() => {
      vi.advanceTimersByTime(SHOW_AFTER_MS);
    });
    expect(ring()).not.toBeNull();
    expect(ring()).toHaveAttribute("aria-hidden", "true");
    act(() => {
      useNet.setState({ busy: 0 });
    });
    expect(ring()).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(MIN_SHOW_MS);
    });
    expect(ring()).toBeNull();
  });

  it("never flickers for a quick answer", () => {
    render(<SyncSpinner />);
    act(() => {
      useNet.setState({ busy: 1 });
    });
    act(() => {
      vi.advanceTimersByTime(SHOW_AFTER_MS - 50);
    });
    act(() => {
      useNet.setState({ busy: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(ring()).toBeNull();
  });

  it("stays out of the workout", () => {
    render(<SyncSpinner hidden />);
    act(() => {
      useNet.setState({ busy: 1 });
    });
    act(() => {
      vi.advanceTimersByTime(SHOW_AFTER_MS);
    });
    expect(ring()).toBeNull();
  });
});
