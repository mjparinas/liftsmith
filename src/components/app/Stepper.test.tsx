// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Stepper } from "./ui";

afterEach(cleanup);

// Japanese and German let words break anywhere (overflow-wrap: anywhere in globals.css), which also let the
// workout's big weight break between digits ("142." over "5") on a phone. A number never wraps.
describe("Stepper", () => {
  for (const compact of [false, true]) {
    it(`keeps the number on one line${compact ? " (compact)" : ""}`, () => {
      render(<Stepper value="142.5" label="Weight" compact={compact} onDown={() => {}} onUp={() => {}} />);
      expect(screen.getByText("142.5").className).toContain("whitespace-nowrap");
    });
  }
});
