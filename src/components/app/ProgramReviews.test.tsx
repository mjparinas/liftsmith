// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { rateProgram, replyToProgramReview } from "@/lib/coachPrograms";
import type { Rating, Review } from "@/lib/coachReviews";

import { ProgramReviews } from "./ProgramReviews";

vi.mock("@/lib/coachPrograms", async (orig) => ({
  ...(await orig<typeof import("@/lib/coachPrograms")>()),
  rateProgram: vi.fn(async () => ({})),
  unrateProgram: vi.fn(async () => undefined),
  replyToProgramReview: vi.fn(async () => "ok"),
}));

const NOW = Date.UTC(2026, 10, 16);
const unrated: Rating = { count: 1, average: null, outcome: null };
const review = (over: Partial<Review> = {}): Review => ({
  id: "a".repeat(20),
  stars: 5,
  text: "Strong all block.",
  name: "Sam K.",
  at: NOW,
  reply: "",
  replyAt: 0,
  ...over,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ratings under a coach's program", () => {
  it("says it isn't rated yet and offers no form to someone who doesn't have it", () => {
    render(<ProgramReviews id="p1" page={{ rating: unrated, reviews: [], mine: null }} coach="Ana" own={false} onChanged={() => {}} />);
    expect(screen.getByText(/Not rated yet/)).toBeTruthy();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("lets a lifter who has had it two weeks rate it with one tap and a line", async () => {
    const u = userEvent.setup();
    const changed = vi.fn();
    render(
      <ProgramReviews
        id="p1"
        page={{ rating: unrated, reviews: [], mine: { review: null, can: { ok: true } } }}
        coach="Ana"
        own={false}
        onChanged={changed}
      />,
    );
    await u.click(screen.getByRole("radio", { name: "4 stars" }));
    await u.type(screen.getByLabelText("Your review (optional)"), "Good block");
    await u.click(screen.getByRole("button", { name: "Post review" }));
    expect(rateProgram).toHaveBeenCalledWith("p1", 4, "Good block");
    expect(changed).toHaveBeenCalled();
  });

  it("says when a lifter can rate it, before two weeks are up", () => {
    render(
      <ProgramReviews
        id="p1"
        page={{ rating: unrated, reviews: [], mine: { review: null, can: { ok: false, why: "wait", readyAt: NOW } } }}
        coach="Ana"
        own={false}
        onChanged={() => {}}
      />,
    );
    expect(screen.getByText(/You can rate it from/)).toBeTruthy();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("shows its coach every review with a reply box that answers on the program", async () => {
    const u = userEvent.setup();
    render(<ProgramReviews id="p1" page={{ rating: unrated, reviews: [review()], mine: null }} coach="Ana" own onChanged={() => {}} />);
    expect(screen.getByText("Strong all block.")).toBeTruthy();
    await u.click(screen.getByRole("button", { name: "Reply" }));
    await u.type(screen.getByLabelText("Your public reply"), "Thanks!");
    await u.click(screen.getByRole("button", { name: "Post reply" }));
    expect(replyToProgramReview).toHaveBeenCalledWith("a".repeat(20), "Thanks!");
  });
});
