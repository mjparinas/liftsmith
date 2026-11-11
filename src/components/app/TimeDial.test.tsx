// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { setLanguage } from "@/lib/i18n";

import { TimeField } from "./TimeDial";

let saved = "";
function Harness({ start = "18:00" }: { start?: string }) {
  const [v, setV] = useState(start);
  return (
    <TimeField
      label="Time"
      value={v}
      onChange={(x) => {
        saved = x;
        setV(x);
      }}
    />
  );
}

afterEach(() => {
  cleanup();
  setLanguage("en");
  saved = "";
});

describe("the time dial", () => {
  it("opens a dial instead of the browser's time box, picks the hour then the minutes, and saves on Set time", () => {
    setLanguage("en");
    render(<Harness />);
    expect(document.querySelector('input[type="time"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Time: 6:00/ }));
    const dialog = screen.getByRole("dialog", { name: "Time" });
    const face = () => within(dialog).getByRole("group", { name: /Hour|Minutes/ });
    expect(within(dialog).getByRole("button", { name: "PM", pressed: true })).toBeTruthy();
    fireEvent.click(within(face()).getByRole("button", { name: /^7:00/ }));
    // On to the minutes by itself, like Android's dial.
    expect(face().getAttribute("aria-label")).toBe("Minutes");
    fireEvent.click(within(face()).getByRole("button", { name: "30 minutes" }));
    expect(saved).toBe(""); // nothing saved until Set time
    fireEvent.click(within(dialog).getByRole("button", { name: "Set time" }));
    expect(saved).toBe("19:30");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /^Time: 7:30/ })).toBeTruthy();
  });

  it("switches AM and PM, and closing leaves the time as it was", () => {
    render(<Harness start="07:15" />);
    fireEvent.click(screen.getByRole("button", { name: /^Time:/ }));
    const dialog = screen.getByRole("dialog", { name: "Time" });
    fireEvent.click(within(dialog).getByRole("button", { name: "PM" }));
    expect(within(dialog).getByRole("button", { name: "PM", pressed: true })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(saved).toBe("");
    fireEvent.click(screen.getByRole("button", { name: /^Time:/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "PM" }));
    fireEvent.click(screen.getByRole("button", { name: "Set time" }));
    expect(saved).toBe("19:15");
  });

  it("shows a 24-hour face with an inner ring where the region uses one", () => {
    setLanguage("fr");
    render(<Harness start="09:00" />);
    fireEvent.click(screen.getByRole("button", { name: /^Time: 9:00/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "PM" })).toBeNull();
    const face = within(dialog).getByRole("group", { name: "Heure" });
    expect(within(face).getAllByRole("button")).toHaveLength(24);
    fireEvent.click(within(face).getByRole("button", { name: "21:00" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Régler l’heure" }));
    expect(saved).toBe("21:00");
  });
});
