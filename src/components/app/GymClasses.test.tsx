// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GymClass } from "@/lib/gymClasses";
import { setLanguage } from "@/lib/i18n";

const saved: unknown[] = [];
vi.mock("@/lib/gymExtrasApi", () => ({
  saveClass: vi.fn(async (_place: string, cls: Omit<GymClass, "id">) => (saved.push(cls), { cls: { id: "0123456789abcdef", ...cls } })),
  deleteClass: vi.fn(async () => true),
}));
const added: unknown[] = [];
vi.mock("@/lib/calendar", () => ({ addEvent: vi.fn(async (e: unknown) => (added.push(e), true)) }));

const { ClassSchedule, OwnerClassesSection } = await import("./GymClasses");

// A gym's class schedule in the app (docs/decisions/gyms.md "Class schedules").
const today = new Date().getDay();
const spin: GymClass = {
  id: "a1",
  name: "Spin",
  kind: "cycling",
  days: [today],
  start: "23:59",
  minutes: 30,
  coach: "Sam",
  room: "Studio 2",
  note: "Bring water.",
  off: [],
};

afterEach(() => {
  cleanup();
  saved.length = 0;
  added.length = 0;
});

describe("the class schedule on a gym's page", () => {
  it("shows today's classes, and a class opens its details with Add the next one to my calendar", async () => {
    setLanguage("en");
    render(<ClassSchedule classes={[spin]} gymName="Iron Works" />);
    expect(screen.getByRole("heading", { name: "Class schedule" })).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Spin/ }));
    const sheet = screen.getByRole("dialog", { name: "Spin" });
    expect(within(sheet).getByText("Sam")).toBeTruthy();
    expect(within(sheet).getByText("Bring water.")).toBeTruthy();
    fireEvent.click(within(sheet).getByRole("button", { name: "Add the next one to my calendar" }));
    await waitFor(() => expect(within(sheet).getByRole("status").textContent).toBe("Added to your calendar."));
    expect(added[0]).toMatchObject({ title: "Spin", minutes: 30, place: "Iron Works" });
  });

  it("shows nothing when the gym lists no classes", () => {
    const { container } = render(<ClassSchedule classes={[]} gymName="Iron Works" />);
    expect(container.textContent).toBe("");
  });
});

describe("the owner's classes", () => {
  it("adds a class with a type, days and a length, no typing needed", async () => {
    setLanguage("en");
    const onChange = vi.fn();
    render(<OwnerClassesSection place="p1" classes={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a class" }));
    const sheet = screen.getByRole("dialog", { name: "Add a class" });
    const save = within(sheet).getByRole("button", { name: "Save class" }) as HTMLButtonElement;
    fireEvent.click(within(sheet).getByRole("button", { name: "Yoga" }));
    expect((within(sheet).getByLabelText("Name") as HTMLInputElement).value).toBe("Yoga");
    // No day yet, so it can't be saved.
    expect(save.disabled).toBe(true);
    fireEvent.click(within(within(sheet).getByRole("group", { name: "Days" })).getByRole("button", { name: "Tue" }));
    fireEvent.click(within(sheet).getByRole("button", { name: "45 min" }));
    fireEvent.click(save);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(saved[0]).toMatchObject({ name: "Yoga", kind: "yoga", days: [2], minutes: 45, start: "18:00" });
  });
});
