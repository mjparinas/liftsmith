// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminApp } from "./AdminApp";
import { TabSkeleton } from "./Skeletons";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin loading skeletons", () => {
  it("shows the panel's shape, not a bare Loading line, before the stats answer", () => {
    // An answer that never comes, so the panel stays on its first paint.
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    render(<AdminApp />);
    expect(screen.getByRole("status", { name: "Loading Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Liftsmith admin" })).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it.each(["Overview", "To Do", "Inbox", "Traffic", "Funnel", "Retention", "Devices", "Revenue", "Codes", "System", "Log"])(
    "has a shape for %s that says it's loading once",
    (tab) => {
      const { container } = render(<TabSkeleton tab={tab} />);
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(3);
    },
  );
});
