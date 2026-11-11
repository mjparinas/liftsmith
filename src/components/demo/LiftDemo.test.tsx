// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { bodyFor, detectMode, LiftDemo } from "./LiftDemo";

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

  it("shows no body toggle or body label in the app; the figure follows the body it's given", () => {
    const { rerender } = render(<LiftDemo exerciseId="push-up" controls />);
    expect(screen.queryByRole("button", { name: "Female" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Male" })).toBeNull();
    expect(screen.queryByText(/^(Male|Female)$/)).toBeNull();
    rerender(<LiftDemo exerciseId="push-up" body="female" controls />);
    expect(screen.queryByText(/^(Male|Female)$/)).toBeNull();
  });

  it("keeps the toggle on the public site's demos", () => {
    render(<LiftDemo exerciseId="push-up" controls bodyToggle />);
    expect(screen.getByRole("button", { name: "Male" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Female" }));
    expect(screen.getByRole("button", { name: "Female" })).toHaveAttribute("aria-pressed", "true");
  });

  it("picks the figure from Settings' sex, male when it isn't set", () => {
    expect(bodyFor("female")).toBe("female");
    expect(bodyFor("male")).toBe("male");
    expect(bodyFor(undefined)).toBe("male");
    expect(bodyFor(null)).toBe("male");
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
    expect(screen.getByLabelText("Heart rate 128")).toHaveTextContent("128");
    // One reading draws no trend line yet; a few do.
    expect(screen.queryByTestId("heart-trend")).toBeNull();
    rerender(<LiftDemo exerciseId="back-squat" bpm={128} hrTrend={[118, 122, 125, 128]} />);
    expect(screen.getByTestId("heart-trend").querySelector("path[stroke]")?.getAttribute("d")).toMatch(/^M0 /);
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

  it("speeds up or slows down from where it is when the heart rate changes, without a skipped beat", async () => {
    const { advanceBeat, heartPulse } = await import("./engine");
    // a quarter of a second at 60 bpm is a quarter of a beat
    let ph = advanceBeat(0, 0.25, 60);
    expect(ph).toBeCloseTo(0.25);
    // the reading jumps to 150: the next frame carries on from a quarter, it doesn't leap to a new phase
    const next = advanceBeat(ph, 1 / 60, 150);
    expect(next - ph).toBeCloseTo(150 / 60 / 60);
    // a whole second at 120 bpm is two beats, so it lands where it started
    ph = 0.1;
    for (let i = 0; i < 60; i++) ph = advanceBeat(ph, 1 / 60, 120);
    expect(ph).toBeCloseTo(0.1);
    expect(heartPulse(0.04)).toBeCloseTo(1, 1);
  });

  it("pulses the heart icon beside the bpm at the live rate, not once a second", async () => {
    const { beatStyle } = await import("@/lib/beat");
    expect(beatStyle(120)).toEqual({ animationDuration: "0.500s" });
    expect(beatStyle(300)).toEqual({ animationDuration: "0.250s" }); // a bad reading is clamped
    expect(beatStyle(null)).toBeUndefined();
    render(<LiftDemo exerciseId="back-squat" bpm={150} />);
    const icon = screen.getByTestId("heart-readout").querySelector(".animate-beat") as HTMLElement;
    expect(icon.style.animationDuration).toBe("0.4s");
  });
});
