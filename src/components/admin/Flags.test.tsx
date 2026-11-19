// @vitest-environment jsdom
// The AI daily cap is typed as a dollar amount, and over $50 it asks "Are you sure?" before saving (Melvin, 2026-11-19).
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { allowed } from "@/lib/flags";

import { Flags, readAmount } from "./Flags";

const cap = {
  name: "aiDailyCap",
  label: "AI daily cap (US$)",
  description: "The most the admin AI helpers may spend in a day.",
  default: 2,
  options: [],
  amount: { min: 0.01, max: 1000, confirmAbove: 50 },
  state: null,
};

function stubFetch() {
  const posts: Record<string, unknown>[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        posts.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ flags: [cap] }), { status: 200 }));
    }),
  );
  return posts;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AI daily cap amount", () => {
  it("reads dollar amounts and turns away anything else", () => {
    const a = cap.amount;
    expect(readAmount("5", a)).toEqual({ value: 5 });
    expect(readAmount(" $2.50 ", a)).toEqual({ value: 2.5 });
    expect(readAmount(".5", a)).toEqual({ value: 0.5 });
    for (const bad of ["", "abc", "-3", "2.505", "1e3", "5,00"]) expect(readAmount(bad, a)).toHaveProperty("error");
    expect(readAmount("0", a)).toHaveProperty("error");
    expect(readAmount("1001", a)).toHaveProperty("error");
  });

  it("lets the server take any amount in range, in whole cents", () => {
    expect(allowed("aiDailyCap", 7.25)).toBe(true);
    expect(allowed("aiDailyCap", 1000)).toBe(true);
    expect(allowed("aiDailyCap", 0)).toBe(false);
    expect(allowed("aiDailyCap", -1)).toBe(false);
    expect(allowed("aiDailyCap", 1000.01)).toBe(false);
    expect(allowed("aiDailyCap", 2.505)).toBe(false);
    expect(allowed("aiDailyCap", "5")).toBe(false);
    expect(allowed("aiDailyCap", Number.NaN)).toBe(false);
    // Other flags still take only their listed options.
    expect(allowed("trialDays", 14)).toBe(true);
    expect(allowed("trialDays", 10)).toBe(false);
  });

  it("saves up to $50 at once", async () => {
    const posts = stubFetch();
    render(<Flags admin />);
    const box = await screen.findByLabelText("Amount in US dollars a day");
    fireEvent.change(box, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(posts).toEqual([{ name: "aiDailyCap", value: 50, rollout: 100 }]));
  });

  it("asks before saving more than $50, and Cancel saves nothing", async () => {
    const posts = stubFetch();
    render(<Flags admin />);
    const box = await screen.findByLabelText("Amount in US dollars a day");
    fireEvent.change(box, { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Are you sure? $75 a day is more than $50.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(posts).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(await screen.findByRole("button", { name: "Yes, save" }));
    await waitFor(() => expect(posts).toEqual([{ name: "aiDailyCap", value: 75, rollout: 100 }]));
  });

  it("says why a typed amount won't do", async () => {
    const posts = stubFetch();
    render(<Flags admin />);
    const box = await screen.findByLabelText("Amount in US dollars a day");
    fireEvent.change(box, { target: { value: "lots" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Enter a dollar amount, like 2 or 2.50.")).toBeTruthy();
    expect(posts).toEqual([]);
  });
});
