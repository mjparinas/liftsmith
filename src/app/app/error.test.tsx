// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { diagnostics } from "@/lib/diag";

import AppError from "./error";

describe("the app's error page", () => {
  it("says the data is safe, offers Reload and shows what failed, instead of Next.js's bare page", () => {
    render(<AppError error={new TypeError("x is undefined")} />);
    const page = screen.getByRole("alert");
    expect(page.textContent).toContain("Your workout and data are safe");
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(page.textContent).toContain("TypeError: x is undefined");
    expect(diagnostics().errors.some((e) => e.includes("x is undefined"))).toBe(true);
  });
});
