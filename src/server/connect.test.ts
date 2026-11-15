import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { accountInfo, deleteAccount } from "./accounts";
import {
  accessToken,
  callback,
  cardioResults,
  checkWorkout,
  concept2Cardio,
  dailyReadings,
  dayAt,
  disconnect,
  forgetAll,
  garminCallback,
  garminCardio,
  garminPing,
  garminReadings,
  offsetMinutes,
  ouraReadings,
  polarReadings,
  postWorkout,
  seal,
  start,
  status,
  unseal,
  whoopReadings,
  withingsReadings,
  zonedTime,
} from "./connect";
import { query, resetDb, run } from "./db";

const NOW = 1_800_000_000_000;
const ENV = {
  STRAVA_CLIENT_ID: "123",
  STRAVA_CLIENT_SECRET: "strava-secret",
  OURA_CLIENT_ID: "oura-id",
  OURA_CLIENT_SECRET: "oura-secret",
  WITHINGS_CLIENT_ID: "w-id",
  WITHINGS_CLIENT_SECRET: "w-secret",
  POLAR_CLIENT_ID: "p-id",
  POLAR_CLIENT_SECRET: "p-secret",
  GARMIN_CLIENT_ID: "g-id",
  GARMIN_CLIENT_SECRET: "g-secret",
} as unknown as NodeJS.ProcessEnv;

type Call = { url: string; init?: RequestInit };
/** A fake fetch that answers by URL and records every call. */
function fakeFetch(answers: Record<string, () => { status?: number; body?: unknown }>) {
  const calls: Call[] = [];
  const f = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const key = Object.keys(answers).find((k) => url.startsWith(k));
    const a = key ? answers[key]!() : { status: 404, body: {} };
    return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return { f, calls };
}

const stateOf = (url: string) => new URL(url).searchParams.get("state")!;

beforeEach(async () => {
  await resetDb();
});
afterEach(async () => {
  await resetDb();
});

describe("tokens at rest", () => {
  it("round-trips, and can't be opened with another secret", () => {
    const s = seal("tok-123", "secret-a");
    expect(s).not.toContain("tok-123");
    expect(unseal(s, "secret-a")).toBe("tok-123");
    expect(unseal(s, "secret-b")).toBeNull();
    expect(unseal("junk", "secret-a")).toBeNull();
  });
});

describe("connecting", () => {
  it("says which services have keys", async () => {
    const s = await status("acc1", ENV);
    expect(s.ready).toEqual({
      strava: true,
      garmin: true,
      oura: true,
      whoop: false,
      withings: true,
      polar: true,
      concept2: false,
      sonos: false,
    });
    expect(s.linked).toEqual({});
  });

  it("gives no link for a service without keys", async () => {
    expect(await start("acc1", "whoop", "web", ENV, NOW)).toBeNull();
  });

  it("builds the sign-in link, swaps the code once and keeps the tokens sealed", async () => {
    const url = (await start("acc1", "strava", "android", ENV, NOW))!;
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://www.strava.com/oauth/authorize");
    expect(u.searchParams.get("client_id")).toBe("123");
    expect(u.searchParams.get("scope")).toBe("activity:write,read");
    expect(u.searchParams.get("redirect_uri")).toMatch(/\/api\/connect\/strava\/callback\/$/);
    const { f, calls } = fakeFetch({
      "https://www.strava.com/oauth/token": () => ({
        body: {
          access_token: "acc-tok",
          refresh_token: "ref-tok",
          expires_at: NOW / 1000 + 6 * 3600,
          athlete: { firstname: "Sam", lastname: "Lee" },
        },
      }),
    });
    expect(await callback("strava", stateOf(url), "the-code", f, ENV, NOW)).toEqual({ platform: "android" });
    expect(String(calls[0]!.init?.body)).toContain("code=the-code");
    // The state is used up.
    expect(await callback("strava", stateOf(url), "the-code", f, ENV, NOW)).toBeNull();
    const rows = await query<{ access_token: string }>("SELECT access_token FROM connections");
    expect(rows[0]!.access_token).not.toContain("acc-tok");
    expect((await status("acc1", ENV)).linked.strava).toEqual({ since: NOW, who: "Sam Lee" });
    expect(await accessToken("acc1", "strava", f, ENV, NOW)).toBe("acc-tok");
  });

  it("refuses an expired state, or one for another service", async () => {
    const url = (await start("acc1", "strava", "web", ENV, NOW))!;
    const { f } = fakeFetch({ "https://www.strava.com/oauth/token": () => ({ body: { access_token: "x" } }) });
    expect(await callback("oura", stateOf(url), "c", f, ENV, NOW)).toBeNull();
    const again = (await start("acc1", "strava", "web", ENV, NOW))!;
    expect(await callback("strava", stateOf(again), "c", f, ENV, NOW + 16 * 60_000)).toBeNull();
  });

  it("refreshes a token that's about to run out", async () => {
    const url = (await start("acc1", "oura", "ios", ENV, NOW))!;
    const first = fakeFetch({
      "https://api.ouraring.com/oauth/token": () => ({ body: { access_token: "a1", refresh_token: "r1", expires_in: 3600 } }),
    });
    await callback("oura", stateOf(url), "c", first.f, ENV, NOW);
    const later = fakeFetch({
      "https://api.ouraring.com/oauth/token": () => ({ body: { access_token: "a2", refresh_token: "r2", expires_in: 3600 } }),
    });
    expect(await accessToken("acc1", "oura", later.f, ENV, NOW + 3600_000)).toBe("a2");
    expect(String(later.calls[0]!.init?.body)).toContain("refresh_token=r1");
    expect(await accessToken("acc1", "oura", later.f, ENV, NOW + 3600_000 + 1000)).toBe("a2");
  });

  it("disconnect revokes at the service and forgets the tokens", async () => {
    const url = (await start("acc1", "strava", "web", ENV, NOW))!;
    const { f, calls } = fakeFetch({
      "https://www.strava.com/oauth/token": () => ({
        body: { access_token: "t", refresh_token: "r", expires_at: Date.now() / 1000 + 3600 },
      }),
      "https://www.strava.com/oauth/deauthorize": () => ({ body: {} }),
    });
    await callback("strava", stateOf(url), "c", f, ENV, Date.now());
    await disconnect("acc1", "strava", f, ENV);
    expect(calls.some((c) => c.url.includes("deauthorize"))).toBe(true);
    expect(await query("SELECT * FROM connections")).toEqual([]);
  });

  it("deleting the account deletes its connections", async () => {
    await run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES ('acc1', NULL, 1, 1)");
    await run(
      "INSERT INTO connections (account_id, provider, access_token, refresh_token, expires_at, who, created_at) VALUES ('acc1', 'strava', 'x', NULL, 0, NULL, 1)",
    );
    await deleteAccount("acc1", async () => null);
    expect(await accountInfo("acc1")).toBeNull();
    expect(await query("SELECT * FROM connections")).toEqual([]);
  });
});

describe("Strava workouts", () => {
  const w = {
    sessionId: "s1",
    name: "Strength training",
    description: "Bench press: 60 kg × 8",
    startLocal: "2027-01-15T08:00:00",
    seconds: 2700,
  };

  it("checks what the app sends", () => {
    expect(checkWorkout(w)).toEqual(w);
    expect(checkWorkout({ ...w, startLocal: "yesterday" })).toBeNull();
    expect(checkWorkout({ ...w, seconds: -1 })).toBeNull();
    expect(checkWorkout({ ...w, name: "" })).toBeNull();
    expect(checkWorkout(null)).toBeNull();
  });

  it("posts a workout once, however often it's sent", async () => {
    const url = (await start("acc1", "strava", "web", ENV, NOW))!;
    const { f, calls } = fakeFetch({
      "https://www.strava.com/oauth/token": () => ({ body: { access_token: "t", expires_at: NOW / 1000 + 3600 } }),
      "https://www.strava.com/api/v3/activities": () => ({ status: 201, body: { id: 987 } }),
    });
    await callback("strava", stateOf(url), "c", f, ENV, NOW);
    expect(await postWorkout("acc1", w, f, ENV, NOW)).toBe("posted");
    expect(await postWorkout("acc1", w, f, ENV, NOW)).toBe("posted");
    const posts = calls.filter((c) => c.url.includes("/activities"));
    expect(posts).toHaveLength(1);
    const body = new URLSearchParams(String(posts[0]!.init?.body));
    expect(body.get("sport_type")).toBe("WeightTraining");
    expect(body.get("start_date_local")).toBe("2027-01-15T08:00:00Z");
    expect(body.get("elapsed_time")).toBe("2700");
  });

  it("says unlinked when Strava isn't connected", async () => {
    const { f } = fakeFetch({});
    expect(await postWorkout("acc1", w, f, ENV, NOW)).toBe("unlinked");
  });
});

describe("Oura and Whoop readings", () => {
  it("time zones", () => {
    expect(offsetMinutes("-05:00", 0)).toBe(-300);
    expect(offsetMinutes("+0530", 0)).toBe(330);
    expect(offsetMinutes(undefined, 60)).toBe(60);
    expect(dayAt(Date.UTC(2027, 0, 15, 3), -300)).toBe("2027-01-14");
  });

  it("Oura: the night's total sleep, the main sleep's HRV, lowest heart rate and breathing, and finished days' steps", () => {
    const r = ouraReadings(
      [
        {
          day: "2027-01-15",
          type: "long_sleep",
          total_sleep_duration: 7 * 3600,
          average_hrv: 52,
          lowest_heart_rate: 51,
          average_breath: 14.2,
        },
        { day: "2027-01-15", type: "sleep", total_sleep_duration: 1800, average_hrv: 80, lowest_heart_rate: 60 },
      ],
      [
        { day: "2027-01-14", steps: 9000 },
        { day: "2027-01-15", steps: 1200 },
      ],
      "2027-01-15",
    );
    const get = (m: string) => r.filter((x) => x.metric === m).map((x) => [x.day, x.value]);
    expect(get("sleep")).toEqual([["2027-01-15", 7.5]]);
    expect(get("hrv")).toEqual([["2027-01-15", 52]]);
    expect(get("restingHr")).toEqual([["2027-01-15", 51]]);
    expect(get("breathing")).toEqual([["2027-01-15", 14.2]]);
    expect(get("steps")).toEqual([["2027-01-14", 9000]]);
  });

  it("Whoop: asleep time, and recovery HRV and resting heart rate on the day the night ended", () => {
    const end = "2027-01-15T12:30:00.000Z"; // 07:30 in New York
    const r = whoopReadings(
      [
        {
          id: "sl1",
          end,
          timezone_offset: "-05:00",
          score_state: "SCORED",
          score: { stage_summary: { total_in_bed_time_milli: 8 * 3_600_000, total_awake_time_milli: 3_600_000 }, respiratory_rate: 15.1 },
        },
        { id: "sl2", end: "2027-01-16T12:00:00Z", score_state: "PENDING_SCORE" },
      ],
      [
        { sleep_id: "sl1", score_state: "SCORED", score: { hrv_rmssd_milli: 61.26, resting_heart_rate: 49 } },
        {
          sleep_id: "gone",
          created_at: "2027-01-13T13:00:00Z",
          score_state: "SCORED",
          score: { hrv_rmssd_milli: 2, resting_heart_rate: 50 },
        },
      ],
      -300,
    );
    const get = (m: string) => r.filter((x) => x.metric === m).map((x) => [x.day, x.value]);
    expect(get("sleep")).toEqual([["2027-01-15", 7]]);
    expect(get("breathing")).toEqual([["2027-01-15", 15.1]]);
    expect(get("hrv")).toEqual([["2027-01-15", 61.3]]);
    // The second recovery's HRV is out of range and dropped; its resting heart rate lands on its own day.
    expect(get("restingHr")).toEqual([
      ["2027-01-13", 50],
      ["2027-01-15", 49],
    ]);
  });
});

describe("Withings, Polar and Concept2", () => {
  it("Withings: token calls carry action=requesttoken and the tokens come out of its wrapper", async () => {
    const url = (await start("acc1", "withings", "web", ENV, NOW))!;
    expect(new URL(url).searchParams.get("scope")).toBe("user.metrics,user.activity");
    const { f, calls } = fakeFetch({
      "https://wbsapi.withings.net/v2/oauth2": () => ({
        body: { status: 0, body: { access_token: "w-acc", refresh_token: "w-ref", expires_in: 10800, userid: 7 } },
      }),
    });
    expect(await callback("withings", stateOf(url), "c", f, ENV, NOW)).toEqual({ platform: "web" });
    expect(String(calls[0]!.init?.body)).toContain("action=requesttoken");
    expect(await accessToken("acc1", "withings", f, ENV, NOW)).toBe("w-acc");
    // A refused code comes back as a non-zero status with HTTP 200.
    const again = (await start("acc2", "withings", "web", ENV, NOW))!;
    const bad = fakeFetch({ "https://wbsapi.withings.net/v2/oauth2": () => ({ body: { status: 503, error: "invalid" } }) });
    expect(await callback("withings", stateOf(again), "c", bad.f, ENV, NOW)).toBeNull();
  });

  it("Polar: Basic auth on the token call, registers the lifter, and removes them on disconnect", async () => {
    const url = (await start("acc1", "polar", "ios", ENV, NOW))!;
    const { f, calls } = fakeFetch({
      "https://polarremote.com/v2/oauth2/token": () => ({ body: { access_token: "p-acc", expires_in: 315_360_000, x_user_id: 4242 } }),
      "https://www.polaraccesslink.com/v3/users/4242": () => ({ status: 204, body: {} }),
      "https://www.polaraccesslink.com/v3/users": () => ({ status: 409, body: {} }),
    });
    expect(await callback("polar", stateOf(url), "c", f, ENV, NOW)).toEqual({ platform: "ios" });
    const tokenCall = calls[0]!;
    expect((tokenCall.init?.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("p-id:p-secret").toString("base64")}`,
    );
    expect(String(tokenCall.init?.body)).not.toContain("client_secret");
    const reg = calls[1]!;
    expect(reg.url).toBe("https://www.polaraccesslink.com/v3/users");
    expect(String(reg.init?.body)).not.toContain("acc1");
    await disconnect("acc1", "polar", f, ENV);
    expect(calls.some((c) => c.url.endsWith("/users/4242") && c.init?.method === "DELETE")).toBe(true);
    expect(await query("SELECT * FROM connections")).toEqual([]);
  });

  it("Polar: a failed registration doesn't connect", async () => {
    const url = (await start("acc1", "polar", "web", ENV, NOW))!;
    const { f } = fakeFetch({
      "https://polarremote.com/v2/oauth2/token": () => ({ body: { access_token: "p-acc", x_user_id: 1 } }),
      "https://www.polaraccesslink.com/v3/users": () => ({ status: 500, body: {} }),
    });
    expect(await callback("polar", stateOf(url), "c", f, ENV, NOW)).toBeNull();
    expect((await status("acc1", ENV)).linked).toEqual({});
  });

  it("Withings readings: the day's last weigh-in and body fat, finished days' steps, and sleep", () => {
    const t = (iso: string) => Date.parse(iso) / 1000;
    const r = withingsReadings(
      [
        {
          date: t("2026-11-10T07:00:00Z"),
          category: 1,
          measures: [
            { value: 81234, type: 1, unit: -3 },
            { value: 182, type: 6, unit: -1 },
          ],
        },
        { date: t("2026-11-10T20:00:00Z"), category: 1, measures: [{ value: 8200, type: 1, unit: -2 }] },
        { date: t("2026-11-11T07:00:00Z"), category: 2, measures: [{ value: 75, type: 1, unit: 0 }] },
        { date: t("2026-11-11T07:00:00Z"), category: 1, measures: [{ value: 9, type: 1, unit: 0 }] },
      ],
      [
        { date: "2026-11-10", steps: 8123 },
        { date: "2026-11-11", steps: 400 },
      ],
      [{ date: "2026-11-10", data: { total_sleep_time: 27000, hr_min: 51, rr_average: 14 } }],
      0,
      "2026-11-11",
    );
    const by = (m: string) => r.filter((x) => x.metric === m).map((x) => [x.day, x.value]);
    expect(by("weight")).toEqual([["2026-11-10", 82]]);
    expect(by("bodyFat")).toEqual([["2026-11-10", 18.2]]);
    expect(by("steps")).toEqual([["2026-11-10", 8123]]);
    expect(by("sleep")).toEqual([["2026-11-10", 7.5]]);
    expect(by("restingHr")).toEqual([["2026-11-10", 51]]);
    expect(by("breathing")).toEqual([["2026-11-10", 14]]);
  });

  it("Polar readings: nightly recharge and sleep on the night's date", () => {
    const r = polarReadings(
      [{ date: "2026-11-10", heart_rate_avg: 55, heart_rate_variability_avg: 48, breathing_rate_avg: 13.6 }],
      [{ date: "2026-11-10", light_sleep: 14400, deep_sleep: 5400, rem_sleep: 5400, sleep_end_time: "2026-11-10T06:30:00Z" }],
    );
    expect(r.map((x) => [x.metric, x.day, x.value])).toEqual([
      ["sleep", "2026-11-10", 7],
      ["hrv", "2026-11-10", 48],
      ["restingHr", "2026-11-10", 55],
      ["breathing", "2026-11-10", 13.6],
    ]);
    expect(r[0]!.at).toBe(Date.parse("2026-11-10T06:30:00Z"));
  });

  it("Concept2: rows, ski and bike as cardio, at the logged local time in its zone", () => {
    expect(zonedTime("2026-11-10 07:30:00", "America/Toronto", 0)).toBe(Date.parse("2026-11-10T12:30:00Z"));
    expect(zonedTime("2026-11-10 07:30:00", null, -300)).toBe(Date.parse("2026-11-10T12:30:00Z"));
    expect(zonedTime("not a date", null, 0)).toBeNull();
    const c = concept2Cardio(
      [
        { id: 2, type: "skierg", date: "2026-11-11 18:00:00", timezone: "UTC", distance: 1000, time: 2405 },
        { id: 1, type: "rower", date: "2026-11-10 07:30:00", timezone: "America/Toronto", distance: 2000, time: 4801 },
        { id: 3, type: "bike", date: "2026-11-11 19:00:00", timezone: "UTC", distance: 0, time: 6000 },
        { id: 4, type: "paddle", date: "2026-11-11 19:00:00", timezone: "UTC", distance: 500, time: 1200 },
      ],
      0,
    );
    expect(c).toEqual([
      { id: "1", kind: "rower", start: Date.parse("2026-11-10T12:30:00Z"), seconds: 480, distanceM: 2000 },
      { id: "2", kind: "skierg", start: Date.parse("2026-11-11T18:00:00Z"), seconds: 241, distanceM: 1000 },
    ]);
  });
});

describe("Garmin Connect", () => {
  const G = "https://apis.garmin.com/wellness-api/rest";
  const DAY_S = Math.floor(NOW / 1000);

  async function connectGarmin(f: typeof fetch, account = "acc1") {
    const url = (await start(account, "garmin", "android", ENV, NOW))!;
    return { url, result: await callback("garmin", stateOf(url), "code1", f, ENV, NOW) };
  }

  it("signs in with PKCE, keeps Garmin's user id, asks for 30 days back, and deregisters on disconnect", async () => {
    const { f, calls } = fakeFetch({
      "https://diauth.garmin.com/di-oauth2-service/oauth/token": () => ({
        body: { access_token: "g-acc", refresh_token: "g-ref", expires_in: 86_400 },
      }),
      [`${G}/user/id`]: () => ({ body: { userId: "garmin-user-1" } }),
      [`${G}/backfill/`]: () => ({ status: 202 }),
      [`${G}/user/registration`]: () => ({ status: 204 }),
    });
    const { url, result } = await connectGarmin(f);
    const q = new URL(url).searchParams;
    expect(url.startsWith("https://connect.garmin.com/oauth2Confirm?")).toBe(true);
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(q.has("scope")).toBe(false);
    expect(result).toEqual({ platform: "android" });
    const verifier = new URLSearchParams(String(calls[0]!.init?.body)).get("code_verifier")!;
    expect(createHash("sha256").update(verifier).digest("base64url")).toBe(q.get("code_challenge"));
    expect(calls.filter((c) => c.url.startsWith(`${G}/backfill/`)).map((c) => new URL(c.url).pathname.split("/").pop())).toEqual([
      "dailies",
      "sleeps",
      "hrv",
      "bodyComps",
      "activities",
    ]);
    expect(await query("SELECT remote_user FROM connections")).toEqual([{ remote_user: "garmin-user-1" }]);
    await disconnect("acc1", "garmin", f, ENV);
    expect(calls.some((c) => c.url === `${G}/user/registration` && c.init?.method === "DELETE")).toBe(true);
    expect(await query("SELECT * FROM connections")).toEqual([]);
  });

  it("doesn't connect without Garmin's user id", async () => {
    const { f } = fakeFetch({
      "https://diauth.garmin.com/di-oauth2-service/oauth/token": () => ({ body: { access_token: "g-acc" } }),
      [`${G}/user/id`]: () => ({ status: 500 }),
    });
    expect((await connectGarmin(f)).result).toBeNull();
    expect((await status("acc1", ENV)).linked).toEqual({});
  });

  it("maps dailies, sleeps, HRV and body composition", () => {
    expect(
      garminReadings("dailies", [
        { calendarDate: "2027-01-14", steps: 9012, restingHeartRateInBeatsPerMinute: 52, startTimeInSeconds: 100 },
      ]),
    ).toEqual([
      { metric: "steps", day: "2027-01-14", value: 9012, at: 86_500_000 },
      { metric: "restingHr", day: "2027-01-14", value: 52, at: 86_500_000 },
    ]);
    expect(
      garminReadings("sleeps", [
        {
          calendarDate: "2027-01-15",
          startTimeInSeconds: 0,
          durationInSeconds: 28_800,
          deepSleepDurationInSeconds: 5400,
          lightSleepDurationInSeconds: 14_400,
          remSleepInSeconds: 5400,
        },
        { calendarDate: "2027-01-16", durationInSeconds: 27_000, awakeDurationInSeconds: 1800 },
      ]).map((r) => [r.day, r.value]),
    ).toEqual([
      ["2027-01-15", 7],
      ["2027-01-16", 7],
    ]);
    expect(
      garminReadings("hrv", [
        { calendarDate: "2027-01-15", lastNightAvg: 61 },
        { calendarDate: "2027-01-16", lastNightAvg: 999 },
      ]),
    ).toEqual([{ metric: "hrv", day: "2027-01-15", value: 61, at: Date.parse("2027-01-15T08:00:00Z") }]);
    // Measured at 23:30 UTC by someone five hours behind: it's still the 15th where they are.
    const at = Date.parse("2027-01-16T03:30:00Z") / 1000;
    expect(
      garminReadings("bodyComps", [
        { measurementTimeInSeconds: at, measurementTimeOffsetInSeconds: -18_000, weightInGrams: 81_250, bodyFatInPercent: 17.4 },
      ]),
    ).toEqual([
      { metric: "weight", day: "2027-01-15", value: 81.25, at: at * 1000 },
      { metric: "bodyFat", day: "2027-01-15", value: 17.4, at: at * 1000 },
    ]);
    expect(garminReadings("dailies", [null, "junk", { calendarDate: "yesterday", steps: 5 }])).toEqual([]);
  });

  it("maps runs, rides, rows, elliptical and stairs, and leaves strength sessions out", () => {
    const base = { startTimeInSeconds: 1000, durationInSeconds: 1800, distanceInMeters: 5000.4 };
    expect(
      garminCardio([
        { ...base, summaryId: "a", activityType: "RUNNING" },
        { ...base, summaryId: "b", activityType: "treadmill_running" },
        { ...base, summaryId: "c", activityType: "INDOOR_ROWING" },
        { ...base, activityId: 9, activityType: "STAIR_CLIMBING", distanceInMeters: undefined },
        { ...base, summaryId: "e", activityType: "STRENGTH_TRAINING" },
        { ...base, summaryId: "f", activityType: "RUNNING", durationInSeconds: 20 },
      ]),
    ).toEqual([
      { id: "a", kind: "run", start: 1_000_000, seconds: 1800, distanceM: 5000 },
      { id: "b", kind: "treadmill", start: 1_000_000, seconds: 1800, distanceM: 5000 },
      { id: "c", kind: "rower", start: 1_000_000, seconds: 1800, distanceM: 5000 },
      { id: "9", kind: "stairs", start: 1_000_000, seconds: 1800, distanceM: 0 },
    ]);
  });

  it("only follows ping callbacks to Garmin's own API", () => {
    expect(garminCallback(`${G}/dailies?uploadStartTimeInSeconds=1`)).not.toBeNull();
    expect(garminCallback("http://apis.garmin.com/wellness-api/rest/dailies")).toBeNull();
    expect(garminCallback("https://apis.garmin.com.evil.example/wellness-api/rest/dailies")).toBeNull();
    expect(garminCallback("https://apis.garmin.com/other")).toBeNull();
    expect(garminCallback(42)).toBeNull();
  });

  it("a ping fetches the summaries with the lifter's token, keeps them for the app, and ignores inline data", async () => {
    const { f, calls } = fakeFetch({
      "https://diauth.garmin.com/di-oauth2-service/oauth/token": () => ({ body: { access_token: "g-acc", expires_in: 86_400 } }),
      [`${G}/user/id`]: () => ({ body: { userId: "garmin-user-1" } }),
      [`${G}/backfill/`]: () => ({ status: 202 }),
      [`${G}/sleeps`]: () => ({ body: [{ calendarDate: dayAt(NOW, 0), durationInSeconds: 28_800 }] }),
      [`${G}/activities`]: () => ({
        body: [
          { summaryId: "run1", activityType: "RUNNING", startTimeInSeconds: DAY_S - 7200, durationInSeconds: 1800, distanceInMeters: 5000 },
        ],
      }),
    });
    await connectGarmin(f);
    const kept = await garminPing(
      {
        sleeps: [{ userId: "garmin-user-1", callbackURL: `${G}/sleeps?uploadStartTimeInSeconds=1&uploadEndTimeInSeconds=2` }],
        activities: [{ userId: "garmin-user-1", callbackURL: `${G}/activities?uploadStartTimeInSeconds=1&uploadEndTimeInSeconds=2` }],
        // Push mode (data in the notification itself) can't be checked, so it's ignored.
        hrv: [{ userId: "garmin-user-1", calendarDate: dayAt(NOW, 0), lastNightAvg: 70 }],
        // Somebody else's Garmin id, or a callback to another server: nothing fetched.
        dailies: [
          { userId: "stranger", callbackURL: `${G}/dailies?x=1` },
          { userId: "garmin-user-1", callbackURL: "https://evil.example/wellness-api/rest/dailies" },
        ],
      },
      f,
      ENV,
      NOW,
    );
    expect(kept).toBe(2);
    const fetched = calls.filter((c) => c.url.startsWith(`${G}/sleeps`) || c.url.startsWith(`${G}/activities`));
    expect(fetched.map((c) => (c.init?.headers as Record<string, string>).Authorization)).toEqual(["Bearer g-acc", "Bearer g-acc"]);
    expect(calls.some((c) => c.url.includes("evil") || c.url.includes("dailies?x=1"))).toBe(false);
    expect(await dailyReadings("acc1", "garmin", 45, 0, f, ENV, NOW)).toEqual([expect.objectContaining({ metric: "sleep", value: 8 })]);
    expect(await cardioResults("acc1", "garmin", 30, 0, f, ENV, NOW)).toEqual([
      { id: "run1", kind: "run", start: (DAY_S - 7200) * 1000, seconds: 1800, distanceM: 5000 },
    ]);
    // A ping again for the same night replaces the reading rather than adding one.
    await garminPing({ sleeps: [{ userId: "garmin-user-1", callbackURL: `${G}/sleeps?again=1` }] }, f, ENV, NOW);
    expect(await query("SELECT COUNT(*) AS n FROM cloud_readings")).toEqual([{ n: 1 }]);
  });

  it("leaves today's steps out until the day is over", async () => {
    const { f } = fakeFetch({
      "https://diauth.garmin.com/di-oauth2-service/oauth/token": () => ({ body: { access_token: "g-acc", expires_in: 86_400 } }),
      [`${G}/user/id`]: () => ({ body: { userId: "u" } }),
      [`${G}/backfill/`]: () => ({ status: 202 }),
      [`${G}/dailies`]: () => ({
        body: [
          { calendarDate: dayAt(NOW, 0), steps: 2000 },
          { calendarDate: dayAt(NOW - 86_400_000, 0), steps: 11_000 },
        ],
      }),
    });
    await connectGarmin(f);
    await garminPing({ dailies: [{ userId: "u", callbackURL: `${G}/dailies?a=1` }] }, f, ENV, NOW);
    expect((await dailyReadings("acc1", "garmin", 45, 0, f, ENV, NOW)).map((r) => r.value)).toEqual([11_000]);
  });

  it("a deregistration from Garmin forgets the connection and what was kept", async () => {
    const { f } = fakeFetch({
      "https://diauth.garmin.com/di-oauth2-service/oauth/token": () => ({ body: { access_token: "g-acc", expires_in: 86_400 } }),
      [`${G}/user/id`]: () => ({ body: { userId: "u" } }),
      [`${G}/backfill/`]: () => ({ status: 202 }),
      [`${G}/hrv`]: () => ({ body: [{ calendarDate: dayAt(NOW, 0), lastNightAvg: 60 }] }),
    });
    await connectGarmin(f);
    await garminPing({ hrv: [{ userId: "u", callbackURL: `${G}/hrv?a=1` }] }, f, ENV, NOW);
    await garminPing({ deregistrations: [{ userId: "u" }] }, f, ENV, NOW);
    expect(await query("SELECT * FROM connections")).toEqual([]);
    expect(await query("SELECT * FROM cloud_readings")).toEqual([]);
    await expect(dailyReadings("acc1", "garmin", 45, 0, f, ENV, NOW)).rejects.toThrow();
  });

  it("deleting the account deletes what Garmin sent", async () => {
    await run(
      "INSERT INTO cloud_sessions (account_id, provider, id, kind, start, seconds, distance_m) VALUES ('acc1', 'garmin', 'x', 'run', 1, 60, 0)",
    );
    await run(
      "INSERT INTO cloud_readings (account_id, provider, metric, day, value, at) VALUES ('acc1', 'garmin', 'hrv', '2027-01-01', 50, 1)",
    );
    await forgetAll("acc1", fakeFetch({}).f, ENV);
    expect(await query("SELECT * FROM cloud_sessions")).toEqual([]);
    expect(await query("SELECT * FROM cloud_readings")).toEqual([]);
  });
});
