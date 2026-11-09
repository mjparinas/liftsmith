import { describe, expect, it } from "vitest";
import { betterStackState, CHECKS, jobState, JOB_LATE_MS, JOB_RUNNING_MS, pageAssets, runState, SETTINGS, settingRows, siteAddressProblem, STATUS_PAGES, statuspageState, uptimeRobotStatus, worst } from "./systemHealth";

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
    expect(rows).toHaveLength(SETTINGS.length);
    expect(rows[0]).toMatchObject({ label: "Database", value: "Set (TURSO_DATABASE_URL)", state: "ok" });
    expect(rows.find((r) => r.label === "Email sending")?.state).toBe("down");
    expect(rows.find((r) => r.label === "Site address")?.state).toBe("warn");
    expect(rows.find((r) => r.label === "UptimeRobot")?.state).toBeUndefined();
    expect(JSON.stringify(rows)).not.toContain("tok-9f3a");
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
