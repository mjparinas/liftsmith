// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eta, GymImport } from "./GymImport";

const posts: { where: string; server: number }[] = [];
beforeEach(() => {
  posts.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url.includes("?imports=1")) return Response.json({ imports: [] });
    if (url.includes("?cities=CA"))
      return Response.json({ cities: ["Langley, BC", "Surrey, BC", "Delta, BC"], last: { "delta, bc": Date.now() - 86_400_000 } });
    const body = JSON.parse(String(init?.body)) as { where: string; server: number };
    posts.push(body);
    if (body.where === "Surrey, BC")
      return Response.json(
        { ok: false, error: "No map server answered in time.", detail: "overpass-api.de: HTTP 504", log: ["+0.0s import"] },
        { status: 502 },
      );
    return Response.json({
      ok: true,
      id: "x",
      area: body.where,
      found: 10,
      added: 4,
      updated: 1,
      unchanged: 5,
      kept: 0,
      skipped: { unnamed: 0, private: 0, notGym: 0, duplicate: 0 },
      server: "maps.mail.ru",
      ms: 12_000,
      log: ["+0.0s import"],
    });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Admin › Gyms import", () => {
  it("imports a country's cities, skipping recent ones, shows errors and retries only the failed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const changed = vi.fn();
    render(<GymImport admin changed={changed} />);
    await userEvent.click(screen.getByRole("button", { name: "Import Canada's major cities" }));
    await waitFor(() => expect(screen.getByText(/Done: Canada, 2 of 2 cities/)).toBeTruthy(), { timeout: 10_000 });
    expect(screen.getByText(/1 imported in the last 7 days skipped/)).toBeTruthy();
    expect(posts.map((p) => p.where).sort()).toEqual(["Langley, BC", "Surrey, BC"]);
    // The two workers start on different map servers.
    expect(new Set(posts.map((p) => p.server)).size).toBe(2);
    expect(screen.getAllByText(/Surrey, BC: No map server answered in time\. \(overpass-api\.de: HTTP 504\)/).length).toBeGreaterThan(0);
    expect(changed).toHaveBeenCalled();
    posts.length = 0;
    await userEvent.click(screen.getByRole("button", { name: "Retry 1 failed" }));
    await waitFor(() => expect(screen.getByText(/Done: 1 failed city, 1 of 1 cities/)).toBeTruthy(), { timeout: 10_000 });
    expect(posts.map((p) => p.where)).toEqual(["Surrey, BC"]);
    expect(screen.getByRole("button", { name: "Download debug log" })).toBeTruthy();
    vi.useRealTimers();
  });

  it("works out the time left from the cities already done", () => {
    expect(eta(0, 0, 10, 5_000)).toBeNull();
    expect(eta(0, 2, 10, 60_000)).toBe(240_000);
    expect(eta(0, 10, 10, 60_000)).toBeNull();
  });
});
