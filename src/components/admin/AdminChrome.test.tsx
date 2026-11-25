// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ADMIN_TABS as TABS } from "@/lib/adminTabs";

import { AdminShell, TAB_GROUPS, TAB_ICONS } from "./AdminChrome";

afterEach(cleanup);

describe("admin frame", () => {
  it("puts every section in one group, in the tab order, each with an icon", () => {
    expect(TAB_GROUPS.flatMap((g) => g.tabs)).toEqual([...TABS]);
    for (const t of TABS) expect(TAB_ICONS[t], t).toBeTruthy();
  });

  it("keeps Work and People open, collapses Numbers until expanded, and marks the open tab", async () => {
    const user = userEvent.setup();
    render(
      <AdminShell tab="Users" badges={{ Inbox: 3 }}>
        <p>body</p>
      </AdminShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(screen.getByRole("button", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Inbox, 3 waiting/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Liftsmith admin" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Users" })).toBeInTheDocument();
    for (const g of TAB_GROUPS) expect(screen.getByText(g.label)).toBeInTheDocument();
    // Numbers starts collapsed while on a People tab.
    expect(screen.queryByRole("button", { name: "Traffic" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Numbers.*expand/i }));
    expect(screen.getByRole("button", { name: "Traffic" })).toBeInTheDocument();
    // Work tabs stay reachable without expanding (Inbox carries a waiting badge in its name).
    expect(screen.getByRole("button", { name: /Inbox/ })).toBeInTheDocument();
    expect(nav.querySelectorAll("button").length).toBeGreaterThan(TAB_GROUPS.filter((g) => !g.collapse).flatMap((g) => g.tabs).length);
  });

  it("opens a collapsed group when the current tab lives there", () => {
    render(
      <AdminShell tab="Revenue">
        <p>body</p>
      </AdminShell>,
    );
    expect(screen.getByRole("button", { name: "Revenue" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Traffic" })).toBeInTheDocument();
  });
});
