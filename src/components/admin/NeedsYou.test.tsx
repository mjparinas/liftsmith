// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NeedsYou } from "./NeedsYou";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NeedsYou errors", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({}),
      })),
    );
  });

  it("shows a retryable alert instead of going quiet when To Do fails", async () => {
    const user = userEvent.setup();
    render(<NeedsYou go={() => {}} />);
    await screen.findByRole("alert");
    expect(screen.getByText(/didn.t load/i)).toBeInTheDocument();
    const fetchMock = vi.mocked(fetch);
    const before = fetchMock.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(before));
  });
});
