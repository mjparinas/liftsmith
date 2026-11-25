// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { fullOverview } from "@/lib/teams";

import { CoachTeams } from "./SchoolTeams";

afterEach(cleanup);

const TEAM = { id: "t1", name: "Varsity", code: "VRST2345", school: "Lincoln High", coachId: "me", coachName: "Pat", members: 1 };

describe("a coach's team card", () => {
  it("lists athletes who left with Add, so one who left by mistake comes back", () => {
    const data = fullOverview({
      school: { email: "pat@lincoln.k12.ca.us", school: "Lincoln High", status: "approved", active: true, until: Date.UTC(2027, 6, 1) },
      teams: [TEAM],
      members: { t1: [{ id: "a", name: "Ana", since: 1 }] },
      left: { t1: [{ id: "b", name: "Ben", since: 2 }] },
    });
    render(
      <CoachTeams
        data={data}
        athletes={[
          { id: "a", name: "Ana" },
          { id: "c", name: "Cy" },
        ]}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Add Ben" })).toBeInTheDocument();
    expect(screen.getByText("Left the team")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Cy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Ana" })).toBeNull();
  });

  it("draws from an old server's reply with no lists at all", () => {
    render(<CoachTeams data={fullOverview({ school: null })} onChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Confirm my school" })).toBeInTheDocument();
  });
});
