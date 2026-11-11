// @vitest-environment jsdom
// Sharing routines (Melvin, 2026-11-11): share a routine as a link, open it, preview it and save it to
// your own routines, through the real store and IndexedDB.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decodeRoutine, encodeRoutine } from "@/lib/routineShare";
import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function onboard(user: ReturnType<typeof userEvent.setup>, gym = /Commercial gym/) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: gym }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

const PUSH = encodeRoutine({
  name: "Push day",
  items: [
    { exerciseId: "bench-press", sets: 4 },
    { exerciseId: "lateral-raise", sets: 3, group: "ss-lateral-raise" },
    { exerciseId: "cable-pushdown", sets: 3, group: "ss-lateral-raise" },
  ],
});

describe("shared routines", () => {
  it("previews a shared routine, saves it and uses it today", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/routine/${PUSH}`;
    expect(await screen.findByText("Shared routine")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Push day" })).toBeInTheDocument();
    expect(screen.getByText(/Your weights and reps come from your own lifts/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save to my routines" }));
    const saved = useApp.getState().profile.routines!;
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: "Push day" });
    expect(saved[0].items.map((i) => [i.exerciseId, i.sets, !!i.group])).toEqual([
      ["bench-press", 4, false],
      ["lateral-raise", 3, true],
      ["cable-pushdown", 3, true],
    ]);
    expect(screen.getByText("Saved to your routines.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use it today" }));
    expect(await screen.findByText("Today's workout")).toBeInTheDocument();
    expect(useApp.getState().preview!.routineId).toBe(saved[0].id);
  });

  it("doesn't save the same routine twice", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/routine/${PUSH}`;
    await user.click(await screen.findByRole("button", { name: "Save to my routines" }));
    location.hash = "#/today";
    await screen.findByText("Today's workout");
    location.hash = `#/routine/${PUSH}`;
    expect(await screen.findByText("Already in your routines as Push day.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save to my routines" })).toBeNull();
    expect(useApp.getState().profile.routines).toHaveLength(1);
  });

  it("says so when a routine link is broken", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/routine/garbage";
    expect(await screen.findByText("That routine link didn’t open")).toBeInTheDocument();
  });

  it("shares a saved routine as a link and opens one pasted in", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const at = Date.now();
    useApp.getState().saveRoutine({ id: "r1", name: "Legs", items: [{ exerciseId: "back-squat", sets: 5 }], createdAt: at, updatedAt: at });
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    await user.click(screen.getByRole("button", { name: "Routines" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Edit Legs" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Share routine" }));
    expect(share).toHaveBeenCalledTimes(1);
    const url = (share.mock.calls[0] as unknown as [{ url: string }])[0].url;
    expect(url).toContain("/app/#/routine/");
    expect(decodeRoutine(url.split("#/routine/")[1]!)).toEqual({ name: "Legs", items: [{ exerciseId: "back-squat", sets: 5 }] });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });

    // Back in the list, a link pasted in opens the preview.
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add a routine from a link" }));
    const box = within(screen.getByRole("dialog")).getByLabelText("Paste the routine link");
    await user.type(box, "nonsense");
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Open routine" })).toBeDisabled();
    await user.clear(box);
    await user.click(box);
    await user.paste(`https://www.getliftsmith.com/app/#/routine/${PUSH}`);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Open routine" }));
    expect(await screen.findByRole("heading", { name: "Push day" })).toBeInTheDocument();
  });
});
