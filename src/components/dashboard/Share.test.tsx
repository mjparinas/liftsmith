// @vitest-environment jsdom
// Share links made by the old /me/ dashboard (docs/decisions/web-dashboard.md): no new ones are made, but
// /share/ still opens the ones already sent, and explains a broken one.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { encodeShare, shareCard } from "@/lib/dashboard";
import { derive } from "@/lib/derive";
import { makeProfile, makeWorkout, NOW } from "@/test/factories";

import { SharedProfile } from "./Share";

afterEach(cleanup);

describe("shared summary page", () => {
  it("opens a link already sent", async () => {
    const events = makeWorkout("a", NOW - 86400_000, [{ exerciseId: "bench-press", weight: 60, reps: 5 }, {}]);
    const card = shareCard(events, derive(events, NOW), makeProfile({ name: "Sam" }), NOW, { name: true });
    location.hash = `#${encodeShare(card)}`;
    render(<SharedProfile />);
    expect(await screen.findByRole("heading", { name: "Sam" })).toBeInTheDocument();
  });

  it("explains a broken share link", async () => {
    location.hash = "#broken";
    render(<SharedProfile />);
    expect(await screen.findByText("This link doesn’t work")).toBeInTheDocument();
  });
});
