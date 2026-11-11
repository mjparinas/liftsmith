// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setWeekStart } from "@/lib/derive";
import { setLanguage } from "@/lib/i18n";
import { useApp } from "@/lib/store";

import { ExercisePrefsEditor, FavouriteButton, RestTimerSettings, TrainingSettings } from "./TrainingSettings";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, goal: "muscle" });
});
afterEach(() => {
  cleanup();
  setWeekStart(1);
  setLanguage("en");
});

const training = () => useApp.getState().profile.training;

describe("Settings › Workout preferences", () => {
  it("shows in the chosen language, with the weekday names from Intl", async () => {
    setLanguage("fr");
    const user = userEvent.setup();
    render(<TrainingSettings />);
    expect(screen.getByRole("heading", { name: "Préférences d’entraînement" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "dimanche" }));
    expect(training()?.weekStart).toBe(0);
    await user.click(screen.getByRole("button", { name: "RPE : de 1 à 10" }));
    expect(training()?.effort).toBe("rpe");
  });

  it("saves each choice, and Auto clears it", async () => {
    const user = userEvent.setup();
    render(<TrainingSettings />);
    await user.click(screen.getByRole("button", { name: "RPE: 1 to 10" }));
    expect(training()?.effort).toBe("rpe");
    await user.click(screen.getByRole("button", { name: "Sunday" }));
    expect(training()?.weekStart).toBe(0);
    await user.click(within(screen.getByRole("group", { name: "Muscle priorities" })).getByRole("button", { name: "Calves" }));
    expect(training()?.priorities).toEqual(["calves"]);
    await user.click(screen.getByRole("button", { name: "45 min" }));
    expect(training()?.minutes).toBe(45);
    expect(useApp.getState().profile.minutes).toBe(45);
    const sets = screen.getAllByRole("group").find((g) => g.textContent?.startsWith("Auto2345"))!;
    await user.click(sets.querySelectorAll("button")[3]);
    expect(training()?.sets).toBe(4);
    await user.click(sets.querySelectorAll("button")[0]);
    expect(training()?.sets).toBeUndefined();
  });

  it("has the rest timer in Settings › Workout, as switches", async () => {
    const user = userEvent.setup();
    render(<RestTimerSettings />);
    await user.click(screen.getByRole("switch", { name: "Start the rest timer by itself after Log set" }));
    expect(training()?.autoRest).toBe(false);
    await user.click(screen.getByRole("switch", { name: "Keep the screen on during a workout" }));
    expect(training()?.keepAwake).toBe(false);
    await user.click(screen.getByRole("button", { name: "Silent" }));
    expect(training()?.restAlert).toBe("silent");
  });

  it("adds a favourite with taps, no typing", async () => {
    const user = userEvent.setup();
    render(<TrainingSettings />);
    const favs = screen.getByRole("group", { name: "Add a favourite: pick a muscle" });
    await user.click([...favs.querySelectorAll("button")].find((b) => b.textContent === "Quads")!);
    await user.click(screen.getByRole("button", { name: /^Back squat/ }));
    expect(training()?.favourites).toEqual(["back-squat"]);
  });

  it("sets one exercise's rest, reps and sets, with the default shown", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FavouriteButton exerciseId="back-squat" />
        <ExercisePrefsEditor exerciseId="back-squat" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Default (2 min)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Default (6–10)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "3–5" }));
    await user.click(screen.getByRole("button", { name: "Add to favourites" }));
    expect(training()?.exercises?.["back-squat"]).toEqual({ reps: [3, 5] });
    expect(training()?.favourites).toEqual(["back-squat"]);
  });
});
