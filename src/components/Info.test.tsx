// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GLOSSARY } from "@/lib/glossary";
import { Info } from "./Info";

describe("Info", () => {
  it("explains a term in a labelled dialog, and gives focus back when closed", async () => {
    const user = userEvent.setup();
    render(<h2>Build weeks before a deload<Info term="deloadWeeks" /></h2>);
    const btn = screen.getByRole("button", { name: "What is build weeks before a deload?" });
    await user.click(btn);
    const dialog = screen.getByRole("dialog", { name: GLOSSARY.deloadWeeks.title });
    expect(dialog.textContent).toMatch(/deload week/);
    expect(document.activeElement?.textContent).toBe("Got it");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it("has plain-language text for every term", () => {
    for (const [, t] of Object.entries(GLOSSARY)) {
      expect(t.title.length).toBeGreaterThan(2);
      expect(t.body.join(" ").length).toBeGreaterThan(60);
      expect(t.body.join(" ")).not.toMatch(/\bRPE\b|hypertrophy|CNS/);
    }
  });
});
