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

  it("checks settings by name and flags a bare-domain site address", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://getliftsmith.com");
    vi.stubEnv("VERCEL_TOKEN", "");
    const c = await settingsCheck();
    expect(c.rows.find((r) => r.label === "Site address format")).toMatchObject({ state: "warn" });
    expect(JSON.stringify(c)).not.toContain('https://getliftsmith.com"');
  });

  it("says which Vercel environments hold each setting, and lists ones the code doesn't read, without values", async () => {
    vi.stubEnv("VERCEL_TOKEN", "tok");
    vi.stubEnv("VERCEL_PROJECT_ID", "prj_1");
    vi.stubEnv("MAPBOX_TOKEN", "pk.secret-value");
    const f = vi.fn(async () =>
      Response.json({
        envs: [
          { key: "MAPBOX_TOKEN", target: ["production"], value: "pk.secret-value" },
          { key: "MAPBOX_TOKEN", target: ["preview"], value: "pk.secret-value" },
          { key: "OLD_THING_KEY", target: ["production"], value: "leftover-secret" },
        ],
      }),
    );
    vi.stubGlobal("fetch", f);
    const c = await settingsCheck();
    expect(String(f.mock.calls[0]?.[0 as never])).toContain("/v10/projects/prj_1/env");
    expect(c.rows.find((r) => r.label === "Mapbox")).toMatchObject({ state: "ok", value: "Set (MAPBOX_TOKEN) · Production and Preview" });
    expect(c.rows.find((r) => r.label === "OLD_THING_KEY")).toMatchObject({ state: "warn", value: "Production only" });
    expect(c.setup).toBeUndefined();
    expect(JSON.stringify(c)).not.toContain("secret-value");
    expect(JSON.stringify(c)).not.toContain("leftover-secret");
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

  it("shows only Liftsmith monitors on the uptime card", async () => {
    vi.stubEnv("UPTIMEROBOT_API_KEY", "key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          stat: "ok",
          monitors: [
            {
              id: 1,
              friendly_name: "Liftsmith health",
              url: "https://www.getliftsmith.com/api/health/",
              status: 2,
              custom_uptime_ratio: "100-100-100",
            },
            { id: 2, friendly_name: "Site", url: "https://www.getliftsmith.com/", status: 2 },
            { id: 3, friendly_name: "Gradelings", url: "https://www.gradelings.com/", status: 9 },
          ],
        }),
      ),
    );
    const { result } = await runCheck("uptime", { now: NOW });
    expect(result.rows.map((r) => r.label)).toEqual(["Liftsmith health", "Site"]);
    expect(result.state).toBe("ok");
    expect(JSON.stringify(result)).not.toContain("Gradelings");
  });

  it("says when the account has no Liftsmith monitors", async () => {
    vi.stubEnv("UPTIMEROBOT_API_KEY", "key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ stat: "ok", monitors: [{ id: 3, friendly_name: "Gradelings", url: "https://www.gradelings.com/", status: 2 }] }),
      ),
    );
    const { result } = await runCheck("uptime", { now: NOW });
    expect(result.summary).toBe("UptimeRobot has no Liftsmith monitors yet.");
    expect(result.rows).toEqual([]);
  });
});
