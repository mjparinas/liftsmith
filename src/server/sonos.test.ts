import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { checkSonosCommand } from "@/lib/cloud";

import { callback, start, Unlinked } from "./connect";
import { resetDb } from "./db";
import { commandCall, Gone, SONOS_API, sonosCommand, sonosState, toNow } from "./sonos";

const NOW = 1_800_000_000_000;
const ENV = { SONOS_CLIENT_ID: "sonos-key", SONOS_CLIENT_SECRET: "sonos-secret" } as unknown as NodeJS.ProcessEnv;

type Call = { url: string; init?: RequestInit };
function fakeFetch(answers: Record<string, () => { status?: number; body?: unknown }>) {
  const calls: Call[] = [];
  const f = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    // Longest match first, so /groups/g1/playback doesn't answer for /groups/g1/playbackMetadata.
    const key = Object.keys(answers)
      .sort((a, b) => b.length - a.length)
      .find((k) => url.startsWith(k));
    const a = key ? answers[key]!() : { status: 404, body: {} };
    return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return { f, calls };
}

const TOKEN = {
  "https://api.sonos.com/login/v3/oauth/access": () => ({ body: { access_token: "s-acc", refresh_token: "s-ref", expires_in: 86_400 } }),
};

async function link() {
  const url = (await start("acc1", "sonos", "android", ENV, NOW))!;
  const { f, calls } = fakeFetch(TOKEN);
  expect(await callback("sonos", new URL(url).searchParams.get("state")!, "code", f, ENV, NOW)).toEqual({ platform: "android" });
  return { url, calls };
}

beforeEach(async () => {
  await resetDb();
});
afterEach(async () => {
  await resetDb();
});

describe("connecting Sonos", () => {
  it("asks for playback control and sends the key and secret as Basic auth", async () => {
    const { url, calls } = await link();
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://api.sonos.com/login/v3/oauth");
    expect(u.searchParams.get("scope")).toBe("playback-control-all");
    expect(u.searchParams.get("redirect_uri")).toMatch(/\/api\/connect\/sonos\/callback\/$/);
    const headers = calls[0]!.init!.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("sonos-key:sonos-secret").toString("base64")}`);
    expect(String(calls[0]!.init!.body)).not.toContain("client_secret");
  });
});

describe("Sonos state", () => {
  it("lists groups and favourites and reads what the chosen group is playing", async () => {
    await link();
    const { f, calls } = fakeFetch({
      [`${SONOS_API}/households`]: () => ({ body: { households: [{ id: "Sonos_H1" }] } }),
      [`${SONOS_API}/households/Sonos_H1/groups`]: () => ({
        body: {
          groups: [
            { id: "RINCON_A:1", name: "Garage", playbackState: "PLAYBACK_STATE_PLAYING" },
            { id: "RINCON_B:2", name: "Kitchen", playbackState: "PLAYBACK_STATE_IDLE" },
            { id: "bad id with spaces", name: "Nope" },
          ],
        },
      }),
      [`${SONOS_API}/households/Sonos_H1/favorites`]: () => ({ body: { items: [{ id: "7", name: "Heavy day" }, { id: "8" }] } }),
      [`${SONOS_API}/groups/RINCON_A%3A1/playback`]: () => ({ body: { playbackState: "PLAYBACK_STATE_PLAYING" } }),
      [`${SONOS_API}/groups/RINCON_A%3A1/playbackMetadata`]: () => ({
        body: { currentItem: { track: { name: "Lift Off", artist: { name: "The Plates" }, imageUrl: "https://img.example/a.jpg" } } },
      }),
      [`${SONOS_API}/groups/RINCON_A%3A1/groupVolume`]: () => ({ body: { volume: 34, fixed: false } }),
    });
    const s = await sonosState("acc1", "RINCON_A:1", f, ENV, NOW);
    expect(s.groups).toEqual([
      { id: "RINCON_A:1", name: "Garage", household: "Sonos_H1", playing: true },
      { id: "RINCON_B:2", name: "Kitchen", household: "Sonos_H1", playing: false },
    ]);
    expect(s.favourites).toEqual([{ id: "7", name: "Heavy day", household: "Sonos_H1" }]);
    expect(s.now).toEqual({
      group: "RINCON_A:1",
      playing: true,
      volume: 34,
      track: "Lift Off",
      artist: "The Plates",
      image: "https://img.example/a.jpg",
    });
    expect((calls[0]!.init!.headers as Record<string, string>).Authorization).toBe("Bearer s-acc");
  });

  it("skips now playing for a group that's gone", async () => {
    await link();
    const { f } = fakeFetch({
      [`${SONOS_API}/households`]: () => ({ body: { households: [{ id: "H" }] } }),
      [`${SONOS_API}/households/H/groups`]: () => ({ body: { groups: [{ id: "G2", name: "Den" }] } }),
      [`${SONOS_API}/households/H/favorites`]: () => ({ body: { items: [] } }),
    });
    expect((await sonosState("acc1", "G1", f, ENV, NOW)).now).toBeNull();
  });

  it("says Unlinked when not connected or the token is refused", async () => {
    await expect(sonosState("acc1", null, fakeFetch({}).f, ENV, NOW)).rejects.toBeInstanceOf(Unlinked);
    await link();
    const { f } = fakeFetch({ [`${SONOS_API}/households`]: () => ({ status: 401 }) });
    await expect(sonosState("acc1", null, f, ENV, NOW)).rejects.toBeInstanceOf(Unlinked);
  });

  it("keeps a fixed-volume speaker's volume out, and only https art", () => {
    const n = toNow(
      "G",
      { playbackState: "PLAYBACK_STATE_PAUSED" },
      { container: { name: "Radio One", imageUrl: "http://x/y.png" } },
      { fixed: true, volume: 50 },
    );
    expect(n).toEqual({ group: "G", playing: false, volume: null, track: "Radio One", artist: null, image: null });
  });
});

describe("Sonos commands", () => {
  it("maps each command to its Control API call", () => {
    expect(commandCall({ do: "next" })).toEqual({ path: "/playback/skipToNextTrack", body: {} });
    expect(commandCall({ do: "volume", level: 40 })).toEqual({ path: "/groupVolume", body: { volume: 40 } });
    expect(commandCall({ do: "nudge", delta: -5 })).toEqual({ path: "/groupVolume/relative", body: { volumeDelta: -5 } });
    expect(commandCall({ do: "favourite", id: "7" })).toEqual({
      path: "/favorites",
      body: { favoriteId: "7", playOnCompletion: true, action: "REPLACE" },
    });
  });

  it("posts to the group, and says Gone when the group has changed", async () => {
    await link();
    const { f, calls } = fakeFetch({
      [`${SONOS_API}/groups/RINCON_A%3A1/groupVolume`]: () => ({ body: {} }),
      [`${SONOS_API}/groups/OLD`]: () => ({ status: 410 }),
    });
    await sonosCommand("acc1", "RINCON_A:1", { do: "volume", level: 30 }, f, ENV, NOW);
    expect(calls[0]!.init!.method).toBe("POST");
    expect(JSON.parse(String(calls[0]!.init!.body))).toEqual({ volume: 30 });
    await expect(sonosCommand("acc1", "OLD", { do: "pause" }, f, ENV, NOW)).rejects.toBeInstanceOf(Gone);
  });

  it("checks commands from the app", () => {
    expect(checkSonosCommand({ do: "volume", level: 140 })).toEqual({ do: "volume", level: 100 });
    expect(checkSonosCommand({ do: "nudge", delta: 0 })).toBeNull();
    expect(checkSonosCommand({ do: "favourite", id: "../../x y" })).toBeNull();
    expect(checkSonosCommand({ do: "rm -rf" })).toBeNull();
    expect(checkSonosCommand(null)).toBeNull();
  });
});
