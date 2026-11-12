// @vitest-environment jsdom
// The routine builder on the desktop layout (docs/decisions/desktop-layout.md, stage 4): a wide dialog with the
// exercise browser open beside the routine, and rows that drag to a new place.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DESKTOP_QUERY } from "@/lib/layout";
import { useApp } from "@/lib/store";

import { RoutinesSheet } from "./Routines";

let wide = true;
beforeEach(async () => {
  wide = true;
  window.matchMedia = ((q: string) => ({
    matches: q === DESKTOP_QUERY ? wide : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  await useApp.getState().reset();
});
afterEach(cleanup);

async function pick(user: ReturnType<typeof userEvent.setup>, text: string, name: RegExp) {
  const box = screen.getByRole("searchbox");
  await user.clear(box);
  await user.type(box, text);
  await user.click(screen.getAllByRole("button").find((b) => name.test(b.textContent ?? ""))!);
}

describe("routine builder on desktop", () => {
  it("keeps the exercise browser open beside the routine and reorders by dragging", async () => {
    const user = userEvent.setup();
    render(<RoutinesSheet open onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Build a new routine/ }));
    expect(screen.getByRole("dialog").className).toContain("desk:max-w-4xl");
    await pick(user, "barbell bench press", /^Barbell bench press/);
    await pick(user, "back squat", /^Back squat/);
    // Still open after a pick, with no Add exercise button to press first.
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    const rows = () => within(screen.getAllByRole("list")[0]!).getAllByRole("listitem");
    expect(rows()[0]).toHaveTextContent("Barbell bench press");
    fireEvent.dragStart(rows()[1]!, { dataTransfer: { effectAllowed: "" } });
    fireEvent.dragOver(rows()[0]!);
    fireEvent.drop(rows()[0]!);
    expect(rows()[0]).toHaveTextContent("Back squat");
    expect(rows()[1]).toHaveTextContent("Barbell bench press");
  });

  it("keeps the phone's Add exercise button on a narrow window", async () => {
    wide = false;
    const user = userEvent.setup();
    render(<RoutinesSheet open onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Build a new routine/ }));
    // A new routine opens with the browser showing; after a pick it closes behind Add exercise.
    await pick(user, "barbell bench press", /^Barbell bench press/);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Add exercise" })).toBeInTheDocument();
  });
});
