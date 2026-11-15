import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as adminFlagsRoute from "@/app/api/admin/flags/route.api";
import * as flagsRoute from "@/app/api/flags/route.api";

import { finishSignIn, startSignIn } from "./adminAuth";
import { query, resetDb } from "./db";
import { flagsFor, setFlag } from "./flags";

const SITE = "https://www.getliftsmith.com";

async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const post = (path: string, cookie: string, body: unknown) =>
  new Request(`${SITE}${path}`, { method: "POST", headers: { cookie, origin: SITE }, body: JSON.stringify(body) });

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("flags for an install", () => {
  it("answers the defaults until an admin changes one, then a full rollout reaches everyone", async () => {
    expect(await flagsFor(null)).toEqual({
      trialDays: 14,
      labRepCount: false,
      repMotion: false,
      labBarSpeed: false,
      labHrRest: false,
      labFormCheck: false,
      labVoiceLog: false,
      labSpeedMax: false,
      labBarPath: false,
      labWatchReps: false,
      labGymMachines: false,
      labScale: false,
      labHandsFree: false,
      labTempo: false,
      labVolumeLog: false,
      coachPlans: false,
      coachProClients: 3,
      coachClients: 25,
      labSonos: false,
      referralReward: true,
      social: true,
    });
    await setFlag("repMotion", true, 100, "owner@example.com");
    expect((await flagsFor("install-aaaa-1")).repMotion).toBe(true);
    await setFlag("trialDays", 7, 100, "owner@example.com");
    expect((await flagsFor(null)).trialDays).toBe(7);
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
        labFormCheck: false,
        labVoiceLog: false,
        labSpeedMax: false,
        labBarPath: false,
        labWatchReps: false,
        labGymMachines: false,
        labScale: false,
        labHandsFree: false,
        labTempo: false,
        labVolumeLog: false,
        coachPlans: false,
        coachProClients: 3,
        coachClients: 25,
        labSonos: false,
        referralReward: true,
        social: true,
      },
    });
    expect(r.headers.get("access-control-allow-origin")).toBe("capacitor://localhost");
    expect(r.headers.get("cache-control")).toBe("no-store");
  });

  it("lets admins set and reset flags, and support only look", async () => {
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

    const actions = (await query("SELECT action FROM admin_audit WHERE action LIKE 'flag.%' ORDER BY id")).map((r) => r.action);
    expect(actions).toEqual(["flag.set", "flag.reset"]);
  });
});
