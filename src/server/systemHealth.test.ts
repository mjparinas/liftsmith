import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDb } from "./db";
import { clearSystemCache, isCheckId, isStatusPageName, runCheck, runStatusPage, settingsCheck } from "./systemHealth";

const NOW = Date.UTC(2026, 10, 9, 12);

beforeEach(async () => {
  await resetDb();
  clearSystemCache();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("System page checks", () => {
  it("knows its cards", () => {
    expect(isCheckId("database")).toBe(true);
    expect(isCheckId("nope")).toBe(false);
    expect(isStatusPageName("GitHub")).toBe(true);
    expect(isStatusPageName("github")).toBe(false);
  });

  it("checks settings by name and flags a bare-domain site address", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://getliftsmith.com");
    const c = settingsCheck();
    expect(c.rows.find((r) => r.label === "Site address format")).toMatchObject({ state: "warn" });
    expect(JSON.stringify(c)).not.toContain('https://getliftsmith.com"');
  });

  it("reads a status page, and caches it for a minute", async () => {
    const f = vi.fn(async () =>
      Response.json({
        status: { indicator: "minor", description: "Partially degraded" },
        incidents: [
          { name: "Slow builds", started_at: "2026-11-09T10:00:00Z", status: "investigating", shortlink: "https://stspg.io/x" },
          { name: "Old", status: "resolved" },
        ],
      }),
    );
    vi.stubGlobal("fetch", f);
    const a = await runStatusPage("Vercel", { now: NOW });
    expect(a.result).toMatchObject({
      state: "warn",
      description: "Partially degraded",
      incidents: [{ name: "Slow builds", href: "https://stspg.io/x" }],
    });
    await runStatusPage("Vercel", { now: NOW + 30_000 });
    expect(f).toHaveBeenCalledTimes(1);
    await runStatusPage("Vercel", { now: NOW + 30_000, refresh: true });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("says a status page couldn't be read instead of failing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    const { result } = await runStatusPage("GitHub", { now: NOW });
    expect(result.state).toBe("warn");
    expect(result.description).toMatch(/Couldn't read/);
  });

  it("reports the database and an unset job", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await runCheck("database", { now: NOW })).result.state).not.toBe("down");
    expect((await runCheck("job", { now: NOW })).result.state).toBe("off");
  });
});
