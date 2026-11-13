import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  betterStackState,
  CHECKS,
  JOB_LATE_MS,
  JOB_RUNNING_MS,
  jobState,
  NOT_SETTINGS,
  pageAssets,
  runState,
  settingRows,
  SETTINGS,
  siteAddressProblem,
  STATUS_PAGES,
  statuspageState,
  uptimeRobotStatus,
  worst,
} from "./systemHealth";

const NOW = Date.UTC(2026, 10, 9, 12);

describe("System page", () => {
  it("takes the worst state, ignoring checks that aren't set up", () => {
    expect(worst([])).toBe("ok");
    expect(worst(["off", "off"])).toBe("ok");
    expect(worst(["ok", "warn", "off"])).toBe("warn");
    expect(worst(["warn", "down", "ok"])).toBe("down");
  });

  it("reads status pages and UptimeRobot", () => {
    expect(statuspageState("none")).toBe("ok");
    expect(statuspageState("minor")).toBe("warn");
    expect(statuspageState("maintenance")).toBe("warn");
    expect(statuspageState("critical")).toBe("down");
    expect(betterStackState("operational")).toBe("ok");
    expect(betterStackState("degraded")).toBe("warn");
    expect(betterStackState("downtime")).toBe("down");
    expect(uptimeRobotStatus(2)).toEqual({ state: "ok", label: "Up" });
    expect(uptimeRobotStatus(9).state).toBe("down");
    expect(uptimeRobotStatus(0).label).toBe("Paused");
  });

  it("judges the daily job from its last run", () => {
    expect(jobState([], NOW)).toBe("warn");
    expect(jobState([{ startedAt: NOW - 3_600_000, finishedAt: NOW - 3_500_000, ok: true }], NOW)).toBe("ok");
    expect(jobState([{ startedAt: NOW - JOB_LATE_MS - 1, finishedAt: NOW - JOB_LATE_MS, ok: true }], NOW)).toBe("warn");
    expect(jobState([{ startedAt: NOW - 3_600_000, finishedAt: NOW, ok: false }], NOW)).toBe("down");
    expect(jobState([{ startedAt: NOW - 60_000, finishedAt: null, ok: null }], NOW)).toBe("ok");
    expect(jobState([{ startedAt: NOW - JOB_RUNNING_MS - 1, finishedAt: null, ok: null }], NOW)).toBe("down");
  });

  it("judges GitHub Actions runs", () => {
    expect(runState({ status: "in_progress", conclusion: null })).toBe("ok");
    expect(runState({ status: "completed", conclusion: "success" })).toBe("ok");
    expect(runState({ status: "completed", conclusion: "cancelled" })).toBe("warn");
    expect(runState({ status: "completed", conclusion: "failure" })).toBe("down");
  });

  it("finds a page's own build files", () => {
    const html = `<script src="/_next/static/chunks/a.js"></script><link href="/_next/static/css/b.css?v=1" rel="stylesheet"><script src="https://cdn.example.com/x.js"></script><script src="/_next/static/chunks/a.js"></script>`;
    expect(pageAssets(html)).toEqual(["/_next/static/chunks/a.js", "/_next/static/css/b.css?v=1"]);
    expect(pageAssets(html, 1)).toHaveLength(1);
  });

  it("reports settings by name only, never their values", () => {
    const rows = settingRows((n) => (n === "TURSO_DATABASE_URL" ? "libsql://tok-9f3a" : ""));
    expect(rows.filter((r) => SETTINGS.some((s) => s.label === r.label))).toHaveLength(SETTINGS.length);
    expect(rows[0]).toMatchObject({ label: "Database", value: "Set (TURSO_DATABASE_URL)", state: "ok", group: "Core" });
    expect(rows.find((r) => r.label === "Email sending")?.state).toBe("down");
    expect(rows.find((r) => r.label === "Site address")?.state).toBe("warn");
    expect(rows.find((r) => r.label === "UptimeRobot")?.state).toBeUndefined();
    expect(JSON.stringify(rows)).not.toContain("tok-9f3a");
  });

  it("needs every half of a pair, and warns when only one half is set", () => {
    const only = (set: string[]) => settingRows((n) => (set.includes(n) ? "x" : ""));
    expect(only([]).find((r) => r.label === "Sonos")).toMatchObject({ value: "Missing: SONOS_CLIENT_ID and SONOS_CLIENT_SECRET" });
    expect(only([]).find((r) => r.label === "Sonos")?.state).toBeUndefined();
    expect(only(["SONOS_CLIENT_ID"]).find((r) => r.label === "Sonos")).toMatchObject({
      state: "warn",
      value: "Missing SONOS_CLIENT_SECRET",
    });
    expect(only(["SONOS_CLIENT_ID", "SONOS_CLIENT_SECRET"]).find((r) => r.label === "Sonos")).toMatchObject({ state: "ok" });
    expect(only(["STRIPE_SECRET_KEY"]).find((r) => r.label.startsWith("Stripe"))?.state).toBe("warn");
  });

  it("lists every environment variable the code reads", () => {
    // Every way the code reads one: process.env.X, env.X, env("X"), process.env["X"], e.X in a reader of
    // process.env, and the connected apps' `${KEY}_CLIENT_ID` pairs. A new key must be on SETTINGS (shown on the
    // System tab) or NOT_SETTINGS (set by Vercel or CI, or a build switch).
    const files = execSync("git ls-files src next.config.ts", { encoding: "utf8" })
      .split("\n")
      .filter((f) => /\.(ts|tsx|mjs)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.startsWith("src/test/"));
    const read = new Set<string>();
    const pattern = /\b(?:process\.env|env|e)(?:\.([A-Z][A-Z0-9_]+)\b|\(\s*["']([A-Z][A-Z0-9_]+)["']|\[\s*["']([A-Z][A-Z0-9_]+)["'])/g;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (!/process\.env/.test(src) && !/env[.(]/.test(src)) continue;
      for (const m of src.matchAll(pattern)) read.add((m[1] ?? m[2] ?? m[3])!);
    }
    const clouds = readFileSync("src/server/connect.ts", "utf8").match(/const ENV: Record<Cloud, string> = \{([^}]*)\}/)?.[1] ?? "";
    for (const [, key] of clouds.matchAll(/"([A-Z0-9]+)"/g)) read.add(`${key}_CLIENT_ID`).add(`${key}_CLIENT_SECRET`);
    expect(read.size).toBeGreaterThan(40);
    const listed = new Set([...SETTINGS.flatMap((s) => s.names), ...NOT_SETTINGS]);
    expect([...read].filter((n) => !listed.has(n)).sort()).toEqual([]);
    // And nothing listed that the code no longer reads.
    expect(SETTINGS.flatMap((s) => s.names).filter((n) => !read.has(n))).toEqual([]);
  });

  it("holds the site address to the www rule", () => {
    expect(siteAddressProblem("https://www.getliftsmith.com")).toBeNull();
    expect(siteAddressProblem("https://getliftsmith.com")).toMatch(/www/);
    expect(siteAddressProblem("http://www.getliftsmith.com")).toMatch(/https/);
    expect(siteAddressProblem("https://www.getliftsmith.com/app/")).toMatch(/path/);
    expect(siteAddressProblem("nope")).toMatch(/web address/);
  });

  it("has unique check ids and status page names", () => {
    expect(new Set(CHECKS.map((c) => c.id)).size).toBe(CHECKS.length);
    expect(new Set(STATUS_PAGES.map((p) => p.name)).size).toBe(STATUS_PAGES.length);
    for (const p of STATUS_PAGES) expect(p.url).toMatch(/^https:\/\//);
  });
});
