// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LiftDemo, detectMode } from "./LiftDemo";

describe("LiftDemo", () => {
  afterEach(cleanup);
  it("draws nothing where there is no canvas (tests), but still names the lift", () => {
    expect(detectMode()).toBe("none");
    render(<LiftDemo exerciseId="back-squat" />);
    expect(screen.getByText("Back squat")).toBeInTheDocument();
  });

  it("offers body, view, overlay and tempo controls and lists the muscles worked", () => {
    render(<LiftDemo exerciseId="deadlift" controls />);
    const skeleton = screen.getByRole("button", { name: "Skeleton" });
    expect(skeleton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(skeleton);
    expect(skeleton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Target muscles" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bar path" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Side" }));
    expect(screen.getByRole("button", { name: "Side" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Hamstrings")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("remembers the chosen body on this device", () => {
    const { unmount } = render(<LiftDemo exerciseId="push-up" controls />);
    fireEvent.click(screen.getByRole("button", { name: "Female" }));
    expect(localStorage.getItem("liftsmith.demo.body")).toBe("female");
    unmount();
    render(<LiftDemo exerciseId="push-up" controls />);
    expect(screen.getByRole("button", { name: "Female" })).toHaveAttribute("aria-pressed", "true");
  });

  it("calls it a hand path when there's no barbell", () => {
    render(<LiftDemo exerciseId="push-up" controls />);
    expect(screen.getByRole("button", { name: "Hand path" })).toBeInTheDocument();
  });
});

describe("heartbeat on the figure", () => {
  afterEach(cleanup);
  it("shows the live heart rate only when a monitor is connected", () => {
    const { rerender } = render(<LiftDemo exerciseId="back-squat" bpm={128} />);
    expect(screen.getByLabelText("Heart rate 128")).toHaveTextContent("♥ 128");
    rerender(<LiftDemo exerciseId="back-squat" bpm={null} />);
    expect(screen.queryByLabelText(/Heart rate/)).toBeNull();
  });

  it("beats once per beat interval, strong then soft", async () => {
    const { heartBeat, heartAt } = await import("./engine");
    expect(heartBeat(0.04 * 0.5, 120)).toBeCloseTo(1, 1); // the first beat peaks at 4% of the 0.5 s interval
    expect(heartBeat(0.3 * 0.5, 120)).toBeCloseTo(0.6, 1); // the second, softer beat
    expect(heartBeat(0.65 * 0.5, 120)).toBeLessThan(0.05); // rest between beats
    expect(heartBeat(0.5 + 0.02, 120)).toBeCloseTo(heartBeat(0.02, 120)); // repeats every beat
    const { BODIES } = await import("@/lib/demo/rig");
    const { jointsAt } = await import("@/lib/demo/mesh");
    const { motionFor } = await import("@/lib/demo/motions");
    const J = jointsAt(motionFor(null), BODIES.male, 0);
    const h = heartAt(J, BODIES.male);
    expect(h[2]).toBeLessThan(0); // the lifter's left
    expect(h[0]).toBeGreaterThan(J.shC[0]); // front of the chest
    expect(h[1]).toBeLessThan(J.shC[1]);
    expect(h[1]).toBeGreaterThan(J.hipC[1]);
  });
});
