// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WidgetsSection } from "./GymWidgets";

// Widgets for your website on an official gym's owner page (docs/decisions/gyms.md "Website widgets").
const GYM = { id: "fedcba9876543210", name: "Iron Works", citySlug: "langley-bc", slug: "iron-works" };

afterEach(cleanup);

describe("Widgets for your website", () => {
  it("previews the class schedule and builds its code", () => {
    render(<WidgetsSection gym={GYM} />);
    expect(screen.getByTitle(/Class schedule/)).toHaveAttribute("src", "https://www.getliftsmith.com/embed/gym/fedcba9876543210/schedule/");
    const code = (screen.getByLabelText("Code to paste") as HTMLTextAreaElement).value;
    expect(code).toContain("<iframe");
    expect(code).toContain('<a href="https://www.getliftsmith.com/gyms/langley-bc/iron-works/">Iron Works</a>');
  });
  it("follows the widget, look and language picked, and copies the code", async () => {
    const user = userEvent.setup();
    const write = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
    render(<WidgetsSection gym={GYM} />);
    await user.click(screen.getByRole("button", { name: "Badge" }));
    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: "Français" }));
    const code = (screen.getByLabelText("Code to paste") as HTMLTextAreaElement).value;
    expect(code).not.toContain("<iframe");
    expect(code).toContain("/embed/gym/fedcba9876543210/badge.svg?lang=fr&amp;theme=dark");
    expect(code).toContain('width="179"');
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(write).toHaveBeenCalledWith(code);
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");
  });
});
