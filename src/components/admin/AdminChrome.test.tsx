// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ADMIN_TABS as TABS } from "@/lib/adminTabs";

import { AdminShell, TAB_GROUPS, TAB_ICONS } from "./AdminChrome";

afterEach(cleanup);

describe("admin frame", () => {
  it("puts every section in one group, in the tab order, each with an icon", () => {
    expect(TAB_GROUPS.flatMap((g) => g.tabs)).toEqual([...TABS]);
    for (const t of TABS) expect(TAB_ICONS[t], t).toBeTruthy();
  });

  it("has one nav with every section, the open one marked, and the wordmark as the page heading", () => {
    render(
      <AdminShell tab="Users" badges={{ Inbox: 3 }}>
        <p>body</p>
      </AdminShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.querySelectorAll("button")).toHaveLength(TABS.length);
    expect(screen.getByRole("button", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("3 waiting")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Liftsmith admin" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Users" })).toBeInTheDocument();
    // Group labels stay visible on every width (phone chips used to hide them).
    for (const g of TAB_GROUPS) expect(screen.getByText(g.label)).toBeInTheDocument();
  });
});
