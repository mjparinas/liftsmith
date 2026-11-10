// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { loadBar } from "@/lib/plates";
import { MUSCLES } from "@/lib/types";

import { BodyMap } from "./BodyMap";
import { PlateBar } from "./PlateBar";

describe("PlateBar", () => {
  it("says which plates go on each side", () => {
    render(
      <PlateBar
        loading={loadBar(140, 20, [
          { weight: 25, count: 4 },
          { weight: 10, count: 2 },
        ])}
        bar={20}
        unit="kg"
      />,
    );
    expect(screen.getByText("25 + 25 + 10")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName("Load 25, 25, 10 kg on each side of a 20 kg bar");
  });
  it("warns when the exact weight can't be loaded", () => {
    render(<PlateBar loading={loadBar(101, 20, [{ weight: 20, count: 4 }])} bar={20} unit="kg" />);
    expect(screen.getByText("nearest you can load")).toBeInTheDocument();
  });
});

describe("BodyMap", () => {
  it("labels every muscle with its recovery for screen readers, and shows a legend", () => {
    const rec = Object.fromEntries(MUSCLES.map((m, i) => [m, i * 5])) as Record<(typeof MUSCLES)[number], number>;
    const { container } = render(<BodyMap rec={rec} />);
    const titles = [...container.querySelectorAll("title")].map((t) => t.textContent);
    for (const m of ["Chest", "Quads", "Hamstrings", "Lats"]) expect(titles.some((t) => t?.startsWith(m))).toBe(true);
    for (const l of ["Fresh", "Ready", "Recovering", "Fatigued"]) expect(screen.getByText(l)).toBeInTheDocument();
  });
});
