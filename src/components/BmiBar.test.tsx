// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { bmiCategory } from "@/lib/tdee";

import { BmiBar } from "./BmiBar";

describe("bmiCategory", () => {
  it("uses the standard cut-offs, each one starting its band", () => {
    expect([18.4, 18.5, 24.9, 25, 29.9, 30].map(bmiCategory)).toEqual(["under", "healthy", "healthy", "over", "over", "obese"]);
  });
});

describe("BmiBar", () => {
  afterEach(cleanup);

  it("names the band in its colour and describes the whole bar for screen readers", () => {
    render(<BmiBar bmi={23.4} note />);
    expect(screen.getByTestId("bmi-bar").dataset.band).toBe("healthy");
    expect(screen.getByTestId("bmi-band")).toHaveTextContent("Healthy range");
    expect(screen.getByTestId("bmi-band").style.color).toBe("var(--color-good)");
    expect(screen.getByRole("img")).toHaveAccessibleName(/BMI 23\.4: Healthy range/);
    expect(screen.getByText(/can't tell muscle from fat/)).toBeInTheDocument();
  });

  it("keeps the marker on the bar for values past either end, and leaves the label out when asked", () => {
    const { container } = render(<BmiBar bmi={52} label={false} />);
    expect(screen.queryByTestId("bmi-band")).toBeNull();
    const marker = container.querySelector<HTMLElement>("span.bg-ink");
    expect(marker?.style.left).toBe("100%");
    expect(screen.getByTestId("bmi-bar").dataset.band).toBe("obese");
  });
});
