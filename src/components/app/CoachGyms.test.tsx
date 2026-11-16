// @vitest-environment jsdom
// Coaching › Setup › Gyms you train at (Melvin, 2026-11-16): tapping a listed gym's name opens that gym's page.
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { CoachGyms } from "./CoachGyms";

vi.mock("@/lib/gymExtrasApi", () => ({
  trainerGyms: () => Promise.resolve([{ place: "osm-123", name: "Campus Crossfit", bio: "", status: "listed" }]),
  listAsTrainer: vi.fn(),
  leaveAsTrainer: vi.fn(),
}));

afterEach(cleanup);

it("opens the gym's page from its name", async () => {
  location.hash = "#/coaching";
  window.scrollTo = () => {};
  render(<CoachGyms />);
  await userEvent.click(await screen.findByRole("button", { name: /Campus Crossfit/ }));
  expect(location.hash).toBe("#/gymplace/osm-123");
});
