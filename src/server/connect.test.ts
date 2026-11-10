import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { accountInfo, deleteAccount } from "./accounts";
import {
  accessToken,
  callback,
  checkWorkout,
  dayAt,
  disconnect,
  offsetMinutes,
  ouraReadings,
  postWorkout,
  seal,
  start,
  status,
  unseal,
  whoopReadings,
} from "./connect";
import { query, resetDb, run } from "./db";

const NOW = 1_800_000_000_000;
const ENV = {
  STRAVA_CLIENT_ID: "123",
  STRAVA_CLIENT_SECRET: "strava-secret",
  OURA_CLIENT_ID: "oura-id",
  OURA_CLIENT_SECRET: "oura-secret",
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
    expect(s.ready).toEqual({ strava: true, oura: true, whoop: false });
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
