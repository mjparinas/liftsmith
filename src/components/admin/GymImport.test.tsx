// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportRow } from "@/server/gymImport";
import type { JobStatus } from "@/server/gymImportJobs";

import { eta, failedPlaces, GymImport, pickCountry, POLL_MS, shortError } from "./GymImport";

const T0 = Date.now();
const job = (over: Partial<JobStatus> = {}): JobStatus => ({
  id: "job1",
  label: "Canada",
  state: "running",
  total: 2,
  skipped: 1,
  startedBy: "a@x.com",
  notify: true,
  startedAt: T0,
  endedAt: 0,
  activeAt: T0,
  done: 0,
  active: ["Langley, BC", "Surrey, BC"],
  waiting: 0,
  pending: 0,
  failed: [],
  recent: [],
  sums: { found: 0, added: 0, updated: 0, unchanged: 0, kept: 0 },
  ...over,
});
const surrey = {
  where: "Surrey, BC",
  at: T0 + 60_000,
  r: { ok: false as const, error: "No map server answered in time.", detail: "overpass-api.de: HTTP 504" },
};
const finished = job({
  state: "done",
  done: 2,
  endedAt: T0 + 120_000,
  active: [],
  failed: [surrey],
  recent: [surrey],
  sums: { found: 10, added: 4, updated: 1, unchanged: 5, kept: 0 },
});

let onServer: JobStatus | null = null;
let imports: ImportRow[] = [];
const posts: Record<string, unknown>[] = [];
beforeEach(() => {
  posts.length = 0;
  onServer = null;
  imports = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url.includes("?imports=1")) return Response.json({ imports });
    if (url.includes("?countries=1"))
      return Response.json({
        countries: [
          { code: "CA", name: "Canada", cities: 3 },
          { code: "JP", name: "Japan", cities: 1 },
        ],
      });
    if (url.includes("?job=1")) return Response.json({ job: onServer });
    if (url.includes("&log=1")) return Response.json({ run: "Canada", cities: [] });
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    posts.push(body);
    if (body.action === "importJob") onServer = job();
    if (body.action === "importRetryRecent") onServer = job({ id: "job3", label: "1 failed city", total: 1, skipped: 0 });
    if (body.action === "importRetry") onServer = job({ id: "job2", label: "1 failed city", total: 1, skipped: 0, active: ["Surrey, BC"] });
    if (body.action === "importClose") onServer = null;
    return Response.json({ job: onServer });
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Admin › Gyms import", () => {
  it("starts a country import on the server, follows it, and retries only what failed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const changed = vi.fn();
    render(<GymImport admin changed={changed} />);
    await userEvent.click(await screen.findByRole("button", { name: "Import Canada's 3 cities" }));
    expect(posts[0]).toEqual({ action: "importJob", country: "CA", skipRecent: true, notify: true });
    expect(await screen.findByText(/Importing Canada: 0 of 2 cities/)).toBeTruthy();
    expect(screen.getByText(/1 imported in the last 7 days skipped/)).toBeTruthy();
    expect(screen.getByText(/this page can be closed; an email goes out when it's done/)).toBeTruthy();
    expect(screen.getByText("Langley, BC, Surrey, BC")).toBeTruthy();
    // The server finishes it; the page reads that on its next poll.
    onServer = finished;
    await vi.advanceTimersByTimeAsync(POLL_MS + 100);
    await waitFor(() => expect(screen.getByText(/Done: Canada, 2 of 2 cities/)).toBeTruthy());
    expect(screen.getAllByText(/Surrey, BC: No map server answered in time\. \(overpass-api\.de: HTTP 504\)/).length).toBeGreaterThan(0);
    expect(changed).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Download debug log" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Retry 1 failed" }));
    expect(posts.at(-1)).toEqual({ action: "importRetry", job: "job1" });
    expect(await screen.findByText(/Importing 1 failed city: 0 of 1 cities/)).toBeTruthy();
  });

  it("doesn't poll while the tab is hidden, and reads again when it comes back", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onServer = job();
    let reads = 0;
    const real = globalThis.fetch;
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      if (url.includes("?job=1")) reads++;
      return real(url, init);
    });
    render(<GymImport admin changed={() => undefined} />);
    expect(await screen.findByText(/Importing Canada: 0 of 2 cities/)).toBeTruthy();
    const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const before = reads;
    await vi.advanceTimersByTimeAsync(POLL_MS * 3 + 100);
    expect(reads).toBe(before);
    hidden.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(reads).toBe(before + 1));
    hidden.mockRestore();
  });

  it("shows the import still running on the server when the page opens again", async () => {
    onServer = job({ done: 1, active: ["Surrey, BC"], waiting: 1, recent: [{ where: "Langley, BC", at: T0, r: { ...okLine } }] });
    render(<GymImport admin changed={() => undefined} />);
    expect(await screen.findByText(/Importing Canada: 1 of 2 cities/)).toBeTruthy();
    expect(screen.getByText(/1 busy, trying again soon/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Import Canada/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(posts.at(-1)).toEqual({ action: "importStop", job: "job1" });
  });

  it("picks the country from a search box by name or code", async () => {
    render(<GymImport admin changed={() => undefined} />);
    const box = await screen.findByRole("combobox", { name: "Country" });
    await waitFor(() => expect((box as HTMLInputElement).value).toBe("Canada"));
    await userEvent.clear(box);
    await userEvent.type(box, "jp");
    await userEvent.click(screen.getByRole("button", { name: "Import Japan's 1 city" }));
    expect(posts.at(-1)).toEqual({ action: "importJob", country: "JP", skipRecent: true, notify: true });
    expect(pickCountry([{ code: "CA", name: "Canada" }], "canada")?.code).toBe("CA");
    expect(pickCountry([{ code: "CA", name: "Canada" }], "Can")).toBeNull();
  });

  it("lists recent imports as a table with a short error, a failed-only filter and Retry failed", async () => {
    imports = [
      row({
        id: "a",
        query: "phoenix, az",
        area: "Phoenix, AZ",
        ok: false,
        error: "map: maps.mail.ru: no answer in 62.8s; overpass-api.de: TypeError: fetch failed",
      }),
      row({ id: "b", query: "naperville, il", area: "Naperville, IL", ok: true, found: 32, added: 32 }),
      row({ id: "c", query: "naperville, il", area: "Naperville, IL", ok: false, error: "map: overpass-api.de: HTTP 502 (server busy)" }),
    ];
    render(<GymImport admin changed={() => undefined} />);
    expect(await screen.findAllByText("Map servers busy")).toHaveLength(2);
    expect(screen.getByText("The last 3, newest first. 1 still failing.")).toBeTruthy();
    // The long error is only in the row's details.
    expect(screen.queryByText(/TypeError: fetch failed/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Failed: Phoenix, AZ" }));
    expect(screen.getByText(/TypeError: fetch failed/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Failed only (2)" }));
    expect(screen.queryByText("32 found, 32 new, 0 changed")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Retry 1 failed" }));
    expect(posts.at(-1)).toEqual({ action: "importRetryRecent", notify: true });
    expect(await screen.findByText(/Importing 1 failed city/)).toBeTruthy();
  });

  it("sums up an import error in a few words", () => {
    expect(shortError("where: Nominatim found no place by that name.")).toBe("Place not found");
    expect(shortError("map: maps.mail.ru: HTTP 504 (server busy); overpass.private.coffee: no answer in 100.0s")).toBe("Map servers busy");
    expect(shortError("map: overpass-api.de: error: runtime error: query failed")).toBe("Map error");
    expect(failedPlaces([row({ query: "a", ok: true }), row({ query: "a", ok: false }), row({ query: "b", ok: false })])).toEqual(["b"]);
  });

  it("works out the time left from the cities already done", () => {
    expect(eta(0, 0, 10, 5_000)).toBeNull();
    expect(eta(0, 2, 10, 60_000)).toBe(240_000);
    expect(eta(0, 10, 10, 60_000)).toBeNull();
  });
});

const okLine = {
  ok: true as const,
  id: "x",
  area: "Langley, BC",
  found: 10,
  added: 4,
  updated: 1,
  unchanged: 5,
  kept: 0,
  skipped: { unnamed: 0, private: 0, notGym: 0, duplicate: 0 },
  server: "maps.mail.ru",
  ms: 12_000,
};

function row(over: Partial<ImportRow>): ImportRow {
  return {
    id: "r",
    query: "langley, bc",
    area: "Langley, BC",
    ok: true,
    error: "",
    found: 0,
    added: 0,
    updated: 0,
    unchanged: 0,
    kept: 0,
    server: "maps.mail.ru",
    ms: 30_000,
    log: "+0.0s import",
    at: T0,
    ...over,
  };
}
