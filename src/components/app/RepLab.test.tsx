// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FLAG_CACHE_KEY, flag } from "@/lib/flags";
import { RepLab } from "./RepLab";
import { Settings } from "./Settings";

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  location.hash = "";
});
afterEach(cleanup);

describe("rep counter lab", () => {
  it("is off by default and opens from five taps on the Settings title", async () => {
    const user = userEvent.setup();
    expect(flag("repLab")).toBe(false);
    render(<Settings />);
    expect(screen.queryByRole("button", { name: /Rep counter lab/ })).toBeNull();
    const title = screen.getByRole("heading", { name: "Settings" });
    for (let i = 0; i < 5; i++) await user.click(title);
    expect(location.hash).toBe("#/lab");
  });

  it("asks before turning the experiment on, then offers both sources", async () => {
    const user = userEvent.setup();
    render(<RepLab />);
    await user.click(screen.getByRole("button", { name: "Turn on the lab" }));
    expect(JSON.parse(localStorage.getItem(FLAG_CACHE_KEY)!).repLab).toBe(true);
    expect(screen.getByText(/Video stays on this device/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Phone motion" }));
    await user.click(screen.getByRole("button", { name: "Curl" }));
    expect(screen.getByRole("button", { name: "Start set" })).toBeTruthy();
  });
});
