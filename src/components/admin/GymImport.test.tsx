// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JobStatus } from "@/server/gymImportJobs";

import { eta, GymImport, POLL_MS, shortError, stepState } from "./GymImport";

const T0 = Date.now();
const job = (over: Partial<JobStatus> = {}): JobStatus => ({
  id: "job1",
  label: "every gym in the world",
  kind: "world",
  state: "running",
  phase: "map",
  total: 248,
  startedBy: "a@x.com",
  notify: true,
  startedAt: T0,
  endedAt: 0,
  activeAt: T0,
  done: 0,
  active: ["BC, CA", "AB, CA"],
  waiting: 0,
  pending: 246,
  failed: [],
  recent: [],
  sums: { found: 0, added: 0, updated: 0, unchanged: 0, kept: 0 },
  web: { read: 0, filled: 0 },
  ai: { read: 0, filled: 0 },
  tidy: { fixed: 0 },
  note: "",
  ...over,
});
const yukon = {
  where: "YT, CA",
  at: T0 + 60_000,
  r: { ok: false as const, error: "No map server answered in time.", detail: "overpass-api.de: HTTP 504 (server busy)" },
};
const finished = job({
  state: "done",
  phase: "done",
  total: 300,
  done: 300,
  endedAt: T0 + 7_200_000,
  active: [],
  pending: 0,
  failed: [yukon],
  recent: [yukon],
  sums: { found: 900, added: 850, updated: 10, unchanged: 40, kept: 3 },
  web: { read: 400, filled: 250 },
  ai: { read: 120, filled: 80 },
  tidy: { fixed: 12 },
});

let onServer: JobStatus | null = null;
let daily: { at: number; state: string; added: number } | null = null;
const posts: Record<string, unknown>[] = [];
beforeEach(() => {
  posts.length = 0;
  onServer = null;
  daily = null;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url.includes("?job=1")) return Response.json({ job: onServer, daily, ai: true });
    if (url.includes("&log=1")) return Response.json({ run: "every gym in the world", items: [] });
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    posts.push(body);
    if (body.action === "importWorld") onServer = job();
    if (body.action === "importRetry") onServer = job({ id: "job2", label: "1 failed area", total: 1, active: ["YT, CA"] });
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
  it("is one button that runs every step on the server, follows it, and retries only what failed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const changed = vi.fn();
    render(<GymImport admin changed={changed} />);
    await userEvent.click(await screen.findByRole("button", { name: "Import every gym in the world" }));
    expect(posts[0]).toEqual({ action: "importWorld", notify: true });
    expect(await screen.findByText("Importing every gym in the world")).toBeTruthy();
    expect(screen.getByText(/this page can be closed; an email goes out when it's done/)).toBeTruthy();
    expect(screen.getByText("Now: BC, CA, AB, CA")).toBeTruthy();
    expect(screen.getByText(/1\. Gyms from the map/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Import every gym in the world" })).toBeNull();
    // The server finishes it; the page reads that on its next poll.
    onServer = finished;
    await vi.advanceTimersByTimeAsync(POLL_MS + 100);
    await waitFor(() => expect(screen.getByText(/Done: every gym in the world in 2 h 0 min/)).toBeTruthy());
    expect(screen.getByText(/850 new, 10 changed, 3 claimed or added by lifters left alone/)).toBeTruthy();
    expect(screen.getByText("400 read, 250 gyms got details")).toBeTruthy();
    expect(screen.getByText("120 read, 80 gyms got details")).toBeTruthy();
    expect(screen.getByText("12 city names or addresses fixed")).toBeTruthy();
    expect(screen.getAllByText(/YT, CA: Map servers busy \(overpass-api\.de: HTTP 504 \(server busy\)\)/).length).toBeGreaterThan(0);
    expect(changed).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Download debug log" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Retry 1 failed" }));
    expect(posts.at(-1)).toEqual({ action: "importRetry", job: "job1" });
    expect(await screen.findByText("Importing 1 failed area")).toBeTruthy();
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
    expect(await screen.findByText("Importing every gym in the world")).toBeTruthy();
    const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const before = reads;
    await vi.advanceTimersByTimeAsync(POLL_MS * 3 + 100);
    expect(reads).toBe(before);
    hidden.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(reads).toBe(before + 1));
    hidden.mockRestore();
  });

  it("shows the job still running on the server, its step and why AI stopped, and stops it", async () => {
    onServer = job({ phase: "ai", done: 248, active: [], pending: 0, web: { read: 30, filled: 20 }, note: "AI stopped: today's cap." });
    daily = { at: T0 - 3_600_000, state: "done", added: 7 };
    render(<GymImport admin changed={() => undefined} />);
    expect(await screen.findByText("AI stopped: today's cap.")).toBeTruthy();
    expect(screen.getByText("30 read, 20 gyms got details")).toBeTruthy();
    expect(screen.getByText(/Daily refresh: last ran .*, 7 new gyms\./)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(posts.at(-1)).toEqual({ action: "importStop", job: "job1" });
  });

  it("switches the AI step off and on", async () => {
    render(<GymImport admin changed={() => undefined} />);
    const sw = await screen.findByRole("switch", { name: "AI step" });
    expect(sw.getAttribute("aria-checked")).toBe("true");
    await userEvent.click(sw);
    expect(posts.at(-1)).toEqual({ action: "importAi", on: false });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText(/Off: imports and the daily refresh skip AI/)).toBeTruthy();
  });

  it("lets support staff watch but not start or stop", async () => {
    onServer = job();
    render(<GymImport admin={false} changed={() => undefined} />);
    expect(await screen.findByText("Importing every gym in the world")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
    expect((screen.getByRole("switch", { name: "AI step" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("knows where each step is", () => {
    expect(stepState({ phase: "web", state: "running" }, "map")).toBe("done");
    expect(stepState({ phase: "web", state: "running" }, "web")).toBe("now");
    expect(stepState({ phase: "web", state: "stopped" }, "web")).toBe("next");
    expect(stepState({ phase: "done", state: "done" }, "tidy")).toBe("done");
  });

  it("sums up an import error in a few words", () => {
    expect(shortError("where: Not an import item")).toBe("Not on the map");
    expect(shortError("map: overpass-api.de: HTTP 504 (server busy); maps.mail.ru: no answer in 150.0s")).toBe("Map servers busy");
    expect(shortError("map: overpass-api.de: error: answer wasn't map data")).toBe("Map error");
  });

  it("works out the time left from the areas already done", () => {
    expect(eta(0, 0, 10, 1000)).toBeNull();
    expect(eta(0, 2, 10, 60_000)).toBe(240_000);
    expect(eta(0, 10, 10, 60_000)).toBeNull();
  });
});
