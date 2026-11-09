// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useApp } from "@/lib/store";
import { Tools } from "./Tools";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg", sex: undefined, birthYear: undefined, heightCm: undefined, daysPerWeek: 3 });
});
afterEach(cleanup);

describe("Tools › TDEE", () => {
  it("asks for what's missing, filled in with bump buttons only, then shows TDEE", async () => {
    const user = userEvent.setup();
    render(<Tools arg="tdee" />);
    expect(screen.getByText("Add your sex, age and height to see your TDEE.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Male" }));
    await user.click(screen.getByRole("button", { name: "More age" }));
    await user.click(screen.getByRole("button", { name: "More height" }));
    // The first tap lands on a typical value (30, and 177 cm for a man), not one step past it.
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("177 cm")).toBeInTheDocument();
    // Mifflin: 10×80 + 6.25×177 − 5×30 + 5 = 1761 BMR; ×1.55 (3 days a week goal) = 2730.
    expect(screen.getByTestId("tdee-value")).toHaveTextContent("2,730");
    expect(screen.getByText(/From your goal of 3 days a week/)).toBeInTheDocument();
  });

  it("records a snapshot when inputs change and charts the history", async () => {
    useApp.getState().setProfile({ sex: "female", birthYear: new Date().getFullYear() - 28, heightCm: 165 });
    act(() => void useApp.getState().refreshTdee());
    act(() => useApp.getState().logBodyweight(77));
    act(() => void useApp.getState().refreshTdee());
    const snaps = useApp.getState().events.filter((e) => e.type === "tdee");
    expect(snaps).toHaveLength(2);
    render(<Tools arg="tdee" />);
    expect(screen.getByText(/Weight down to 77 kg/)).toBeInTheDocument();
    expect(screen.getByText("First calculation")).toBeInTheDocument();
  });

  it("an activity picked by hand overrides the automatic one", async () => {
    useApp.getState().setProfile({ sex: "male", birthYear: 1990, heightCm: 180 });
    const user = userEvent.setup();
    render(<Tools arg="tdee" />);
    await user.click(screen.getByRole("button", { name: "Athlete" }));
    expect(useApp.getState().profile.tdee?.activity).toBe("athlete");
    expect(screen.getByText(/Picked by hand/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Auto" }));
    expect(useApp.getState().profile.tdee?.activity).toBeUndefined();
  });

  it("lists the calculator on the Tools hub", () => {
    render(<Tools />);
    expect(screen.getByRole("button", { name: /TDEE calculator/ })).toBeInTheDocument();
  });
});
