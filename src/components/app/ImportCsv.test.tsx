// @vitest-environment jsdom
// Settings › Data › Import from another app (2026-11-13): a workout file with routines, and a body measurements
// file, through the real store and IndexedDB.
import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";

import { ImportWorkouts } from "./ImportCsv";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  await useApp.getState().reset();
});
afterEach(cleanup);

const HEVY = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Push day","2 Nov 2026, 17:00","2 Nov 2026, 18:00","","Bench Press (Barbell)","","","0","normal","80","8","","",""
"Push day","5 Nov 2026, 17:00","5 Nov 2026, 18:00","","Bench Press (Barbell)","","","0","normal","80","8","","",""
"Push day","5 Nov 2026, 17:00","5 Nov 2026, 18:00","","Running","","","1","normal","","","5","1800",""
`;

const BODY = `"date","weight_kg","fat_percent","waist_cm"
"2026-11-01","82.4","18.5","84"
`;

const file = (text: string) => new File([text], "export.csv", { type: "text/csv" });

describe("importing from another app", () => {
  it("imports workouts with cardio and saves the repeated workout as a routine", async () => {
    const user = userEvent.setup();
    render(<ImportWorkouts />);
    await user.upload(screen.getByLabelText("CSV file to import"), file(HEVY));
    await screen.findByText("Import from Hevy");
    expect(screen.getByText(/become routines: Push day/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(await screen.findByText(/Imported 2 workouts with 3 sets\. Saved 1 routine\./)).toBeTruthy();
    const { events, profile } = useApp.getState();
    expect(events.some((e) => e.type === "set" && e.exerciseId === "outdoor-run" && e.distanceM === 5000)).toBe(true);
    expect(profile.routines?.[0]?.name).toBe("Push day");
  });

  it("imports body weight and measurements from a measurements file", async () => {
    const user = userEvent.setup();
    render(<ImportWorkouts />);
    await user.upload(screen.getByLabelText("CSV file to import"), file(BODY));
    await screen.findByText("Import body weight and measurements");
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(await screen.findByText("Imported 1 weigh-in and 1 measurements.")).toBeTruthy();
    const { events } = useApp.getState();
    expect(events.find((e) => e.type === "bodyweight")).toMatchObject({ kg: 82.4, bodyFat: 18.5 });
    expect(events.find((e) => e.type === "measure")).toMatchObject({ site: "waist", cm: 84 });
  });
});
