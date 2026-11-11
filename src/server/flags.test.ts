import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as experimentsRoute from "@/app/api/admin/experiments/route.api";
import * as adminFlagsRoute from "@/app/api/admin/flags/route.api";
import * as flagsRoute from "@/app/api/flags/route.api";

import { finishSignIn, startSignIn } from "./adminAuth";
import { query, resetDb, run } from "./db";
import { createExperiment, experimentResults, flagsFor, getExperiment, setFlag, startExperiment, stopExperiment } from "./flags";

const NOW = Date.UTC(2026, 10, 10, 12);
const SITE = "https://www.getliftsmith.com";

async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const post = (path: string, cookie: string, body: unknown) =>
  new Request(`${SITE}${path}`, { method: "POST", headers: { cookie, origin: SITE }, body: JSON.stringify(body) });
const install = (id: string, test = 0) =>
  run("INSERT INTO installs (id, first_seen, last_seen, platform, test) VALUES (?, ?, ?, 'android', ?)", [id, NOW, NOW, test]);

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("flags for an install", () => {
  it("answers the defaults until an admin changes one, and a test wins over the flag", async () => {
    expect(await flagsFor(null)).toEqual({
      trialDays: 14,
      labRepCount: false,
      repMotion: false,
      labBarSpeed: false,
      labHrRest: false,
      labFormCheck: false,
      labTrainer: false,
      labVoiceLog: false,
      labSpeedMax: false,
      labWatchReps: false,
      labHandsFree: false,
      labTempo: false,
      social: true,
    });
    await setFlag("repMotion", true, 100, "owner@example.com");
    expect((await flagsFor("install-aaaa-1")).repMotion).toBe(true);
    await setFlag("trialDays", 7, 100, "owner@example.com");
    await createExperiment("trialDays", "", [
      { value: 14, weight: 1 },
      { value: 7, weight: 99 },
    ]);
    // A draft changes nothing.
    expect((await flagsFor("install-aaaa-1")).trialDays).toBe(7);
    await startExperiment("trialDays");
    expect((await flagsFor(null)).trialDays).toBe(14);
  });

  it("records a running test's assignment once, and only for installs we know", async () => {
    await install("install-aaaa-1");
    await createExperiment("trialDays", "", [
      { value: 14, weight: 50 },
      { value: 7, weight: 50 },
    ]);
    await startExperiment("trialDays", NOW);
    const first = (await flagsFor("install-aaaa-1", NOW)).trialDays;
    expect((await flagsFor("install-aaaa-1", NOW + 1)).trialDays).toBe(first);
    await flagsFor("install-unknown-9", NOW);
    expect(await query("SELECT install_id, variant FROM experiment_assignments")).toEqual([
      { install_id: "install-aaaa-1", variant: String(first) },
    ]);
  });

  it("counts trials, payments and workouts per variant after joining, leaving test installs out", async () => {
    await createExperiment("trialDays", "", [
      { value: 14, weight: 50 },
      { value: 7, weight: 50 },
    ]);
    await startExperiment("trialDays", NOW);
    const rows: [string, string, number][] = [
      ["install-a1", "14", 0],
      ["install-a2", "14", 0],
      ["install-b1", "7", 0],
      ["install-b2", "7", 1],
    ];
    for (const [id, v, test] of rows) {
      await install(id, test);
      await run("INSERT INTO experiment_assignments (flag, install_id, variant, at) VALUES ('trialDays', ?, ?, ?)", [id, v, NOW]);
    }
    await run(
      "INSERT INTO events (id, install_id, name, at, received_at, platform) VALUES ('e1', 'install-b1', 'trial_start', ?, ?, 'android')",
      [NOW + 1, NOW],
    );
    await run(
      "INSERT INTO events (id, install_id, name, at, received_at, platform) VALUES ('e0', 'install-a1', 'trial_start', ?, ?, 'android')",
      [NOW - 1, NOW],
    );
    await run(
      "INSERT INTO subscription_events (id, at, install_id, store, kind, source) VALUES ('s1', ?, 'install-b1', 'play', 'trial_convert', 'store')",
      [NOW + 2],
    );
    await run(
      "INSERT INTO events (id, install_id, name, at, received_at, platform) VALUES ('e2', 'install-a2', 'workout_finish', ?, ?, 'android')",
      [NOW, NOW],
    );
    const r = await experimentResults((await getExperiment("trialDays"))!, NOW + 3);
    expect(r.rows.map(({ variant, installs, trials, paid, active }) => ({ variant, installs, trials, paid, active }))).toEqual([
      { variant: 14, installs: 2, trials: 0, paid: 0, active: 1 },
      { variant: 7, installs: 1, trials: 1, paid: 1, active: 0 },
    ]);
    expect(r.verdict.message).toMatch(/Too early/);
    expect(await stopExperiment("trialDays", 7)).toBe(true);
    expect((await flagsFor("install-a1")).trialDays).toBe(7);
  });
});

describe("the flag routes", () => {
  it("serves flags publicly, with CORS for the native apps", async () => {
    const r = await flagsRoute.GET(new Request(`${SITE}/api/flags/?install=bad id`, { headers: { origin: "capacitor://localhost" } }));
    expect(await r.json()).toEqual({
      flags: {
        trialDays: 14,
        labRepCount: false,
        repMotion: false,
        labBarSpeed: false,
        labHrRest: false,
        labTrainer: false,
        labFormCheck: false,
        labVoiceLog: false,
        labSpeedMax: false,
        labWatchReps: false,
        labHandsFree: false,
        labTempo: false,
        social: true,
      },
    });
    expect(r.headers.get("access-control-allow-origin")).toBe("capacitor://localhost");
    expect(r.headers.get("cache-control")).toBe("no-store");
  });

  it("lets admins set and reset flags and run tests, and support only look", async () => {
    const help = await cookieFor("help@example.com");
    expect((await adminFlagsRoute.POST(post("/api/admin/flags/", help, { name: "repMotion", value: true }))).status).toBe(404);
    const owner = await cookieFor("owner@example.com");
    expect((await adminFlagsRoute.POST(post("/api/admin/flags/", owner, { name: "trialDays", value: 30 }))).status).toBe(400);
    expect((await adminFlagsRoute.POST(post("/api/admin/flags/", owner, { name: "trialDays", value: 7, rollout: 101 }))).status).toBe(400);
    expect((await adminFlagsRoute.POST(post("/api/admin/flags/", owner, { name: "trialDays", value: 7, rollout: 25 }))).status).toBe(200);
    const list = (await (await adminFlagsRoute.GET(new Request(`${SITE}/api/admin/flags/`, { headers: { cookie: help } }))).json()) as {
      flags: { name: string; state: { value: number; rollout: number } | null }[];
    };
    expect(list.flags.find((f) => f.name === "trialDays")!.state).toMatchObject({ value: 7, rollout: 25 });
    expect((await adminFlagsRoute.POST(post("/api/admin/flags/", owner, { name: "trialDays", reset: true }))).status).toBe(200);
    expect(await query("SELECT * FROM feature_flags")).toHaveLength(0);

    const variants = [
      { value: 14, weight: 50 },
      { value: 7, weight: 50 },
    ];
    expect(
      (
        await experimentsRoute.POST(
          post("/api/admin/experiments/", owner, { action: "create", flag: "trialDays", description: "7 vs 14", variants }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await experimentsRoute.POST(
          post("/api/admin/experiments/", owner, { action: "create", flag: "trialDays", description: "", variants }),
        )
      ).status,
    ).toBe(409);
    expect((await experimentsRoute.POST(post("/api/admin/experiments/", owner, { action: "stop", flag: "trialDays" }))).status).toBe(409);
    expect((await experimentsRoute.POST(post("/api/admin/experiments/", owner, { action: "start", flag: "trialDays" }))).status).toBe(200);
    expect((await experimentsRoute.POST(post("/api/admin/experiments/", owner, { action: "delete", flag: "trialDays" }))).status).toBe(409);
    expect(
      (await experimentsRoute.POST(post("/api/admin/experiments/", owner, { action: "stop", flag: "trialDays", winner: 30 }))).status,
    ).toBe(400);
    expect(
      (await experimentsRoute.POST(post("/api/admin/experiments/", owner, { action: "stop", flag: "trialDays", winner: 7 }))).status,
    ).toBe(200);
    expect((await experimentsRoute.POST(post("/api/admin/experiments/", owner, { action: "delete", flag: "trialDays" }))).status).toBe(200);
    const actions = (
      await query("SELECT action FROM admin_audit WHERE action LIKE 'flag.%' OR action LIKE 'experiment.%' ORDER BY id")
    ).map((r) => r.action);
    expect(actions).toEqual(["flag.set", "flag.reset", "experiment.create", "experiment.start", "experiment.stop", "experiment.delete"]);
  });
});
