// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setLanguage } from "@/lib/i18n";
import { useApp } from "@/lib/store";

import { Tools } from "./Tools";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp
    .getState()
    .setProfile({ onboarded: true, bodyweight: 80, unit: "kg", sex: undefined, birthYear: undefined, heightCm: undefined, daysPerWeek: 3 });
});
afterEach(() => {
  cleanup();
  setLanguage("en");
});

describe("Tools › TDEE", () => {
  it("speaks the phone's language, with its number format", async () => {
    setLanguage("fr");
    useApp.getState().setProfile({ sex: "male", birthYear: new Date().getFullYear() - 30, heightCm: 177 });
    render(<Tools arg="tdee" />);
    expect(screen.getByRole("heading", { name: "Calculateur de DEJ" })).toBeInTheDocument();
    expect(screen.getByTestId("tdee-value").textContent?.replace(/\s/g, "")).toBe("2730");
    expect(screen.getByText(/D’après votre objectif de 3 jours par semaine \(exercice modéré\)/)).toBeInTheDocument();
    expect(screen.getByText("Surpoids")).toBeInTheDocument();
  });

  it("reads sex, age and height from Your stats, and links there when they're missing", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Tools arg="tdee" />);
    expect(screen.getByText("Add your sex, age, and height to see your TDEE.")).toBeInTheDocument();
    expect(
      screen.getByText("This needs your sex, age, and height. Set them once in Your stats and every tool uses them."),
    ).toBeInTheDocument();
    // No boxes for them here: Your stats is the one place.
    expect(screen.queryByLabelText("Age")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Add your stats/ }));
    expect(window.location.hash).toBe("#/settings/stats");
    unmount();

    useApp.getState().setProfile({ sex: "male", birthYear: new Date().getFullYear() - 30, heightCm: 177 });
    render(<Tools arg="tdee" />);
    // Mifflin: 10×80 + 6.25×177 − 5×30 + 5 = 1761 BMR; ×1.55 (3 days a week goal) = 2730.
    expect(screen.getByTestId("tdee-value")).toHaveTextContent("2,730");
    expect(screen.getByText("177 cm")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Edit your stats/ })).toBeInTheDocument();
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
