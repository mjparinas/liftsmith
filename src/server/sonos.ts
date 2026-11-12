// Sonos (a lab, `labSonos`; docs/decisions/sonos.md): the lifter's speakers, through Sonos's cloud Control API.
// The OAuth tokens live with the other connections (connect.ts, provider "sonos"); this file only makes the
// calls: which groups and favourites the household has, what a group is playing, and play, pause, skip,
// volume and "play this favourite". Nothing from Sonos is stored here.
import { isSonosId, type SonosCommand, type SonosFavourite, type SonosGroup, type SonosNow, type SonosState } from "@/lib/cloud";

import { accessToken, Unlinked } from "./connect";

type Fetch = typeof fetch;

export const SONOS_API = "https://api.ws.sonos.com/control/api/v1";

/** The group asked for doesn't exist any more (the lifter regrouped their speakers): the app picks again. */
export class Gone extends Error {}

async function call<T>(token: string, path: string, f: Fetch, body?: unknown): Promise<T> {
  const r = await f(`${SONOS_API}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (r.status === 401 || r.status === 403) throw new Unlinked();
  if (r.status === 404 || r.status === 410) throw new Gone();
  if (!r.ok) throw new Error(`Sonos ${r.status}`);
  return (await r.json().catch(() => ({}))) as T;
}

async function token(accountId: string, f: Fetch, env: NodeJS.ProcessEnv, now: number): Promise<string> {
  const t = await accessToken(accountId, "sonos", f, env, now);
  if (!t) throw new Unlinked();
  return t;
}

interface RawGroup {
  id?: string;
  name?: string;
  playbackState?: string;
}

const str = (v: unknown, max = 200): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const https = (v: unknown): string | null => (typeof v === "string" && /^https:\/\/[^\s"'<>]{1,1000}$/.test(v) ? v : null);
const isPlaying = (state: unknown) => state === "PLAYBACK_STATE_PLAYING" || state === "PLAYBACK_STATE_BUFFERING";

/** Raw groups and favourites to our shape. Exported for tests. */
export function toGroups(household: string, raw: readonly RawGroup[]): SonosGroup[] {
  return raw
    .filter((g) => isSonosId(g.id))
    .map((g) => ({ id: g.id!, name: str(g.name) ?? "Sonos", household, playing: isPlaying(g.playbackState) }));
}

export function toFavourites(household: string, raw: readonly { id?: string; name?: string }[]): SonosFavourite[] {
  return raw
    .filter((x) => isSonosId(x.id) && str(x.name))
    .slice(0, 50)
    .map((x) => ({ id: x.id!, name: str(x.name)!, household }));
}

interface RawMeta {
  currentItem?: { track?: { name?: string; artist?: { name?: string }; imageUrl?: string; images?: { url?: string }[] } };
  container?: { name?: string; imageUrl?: string };
}

export function toNow(
  group: string,
  playback: { playbackState?: string },
  meta: RawMeta,
  vol: { volume?: number; fixed?: boolean },
): SonosNow {
  const track = meta.currentItem?.track;
  return {
    group,
    playing: isPlaying(playback.playbackState),
    volume: vol.fixed || typeof vol.volume !== "number" ? null : Math.round(Math.min(100, Math.max(0, vol.volume))),
    // A radio station has no track; its name is the container's.
    track: str(track?.name) ?? str(meta.container?.name),
    artist: str(track?.artist?.name),
    image: https(track?.imageUrl) ?? https(track?.images?.[0]?.url) ?? https(meta.container?.imageUrl),
  };
}

/** Every group and favourite in the lifter's households, and what `group` is playing when it's given. */
export async function sonosState(
  accountId: string,
  group: string | null,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<SonosState> {
  const t = await token(accountId, f, env, now);
  const { households = [] } = await call<{ households?: { id?: string }[] }>(t, "/households", f);
  const groups: SonosGroup[] = [];
  const favourites: SonosFavourite[] = [];
  // Most homes have one household; a second (a holiday home) is rare, so they're read one after another.
  for (const h of households.slice(0, 3)) {
    if (!isSonosId(h.id)) continue;
    const id = encodeURIComponent(h.id);
    const g = await call<{ groups?: RawGroup[] }>(t, `/households/${id}/groups`, f);
    groups.push(...toGroups(h.id, g.groups ?? []));
    const fav = await call<{ items?: { id?: string; name?: string }[] }>(t, `/households/${id}/favorites`, f).catch((e: unknown) => {
      if (e instanceof Unlinked) throw e;
      return { items: [] };
    });
    favourites.push(...toFavourites(h.id, fav.items ?? []));
  }
  let nowPlaying: SonosNow | null = null;
  if (group && groups.some((g) => g.id === group)) {
    const id = encodeURIComponent(group);
    const [playback, meta, vol] = await Promise.all([
      call<{ playbackState?: string }>(t, `/groups/${id}/playback`, f),
      call<RawMeta>(t, `/groups/${id}/playbackMetadata`, f).catch(() => ({})),
      call<{ volume?: number; fixed?: boolean }>(t, `/groups/${id}/groupVolume`, f).catch(() => ({})),
    ]);
    nowPlaying = toNow(group, playback, meta, vol);
  }
  return { groups, favourites, now: nowPlaying };
}

/** The Control API call for one command. Exported for tests. */
export function commandCall(c: SonosCommand): { path: string; body: unknown } {
  switch (c.do) {
    case "play":
      return { path: "/playback/play", body: {} };
    case "pause":
      return { path: "/playback/pause", body: {} };
    case "next":
      return { path: "/playback/skipToNextTrack", body: {} };
    case "previous":
      return { path: "/playback/skipToPreviousTrack", body: {} };
    case "volume":
      return { path: "/groupVolume", body: { volume: c.level } };
    case "nudge":
      return { path: "/groupVolume/relative", body: { volumeDelta: c.delta } };
    case "favourite":
      return { path: "/favorites", body: { favoriteId: c.id, playOnCompletion: true, action: "REPLACE" } };
  }
}

/** Sends one command to a group. Throws Unlinked (connect again) or Gone (pick the speaker again). */
export async function sonosCommand(
  accountId: string,
  group: string,
  c: SonosCommand,
  f: Fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<void> {
  const t = await token(accountId, f, env, now);
  const { path, body } = commandCall(c);
  await call(t, `/groups/${encodeURIComponent(group)}${path}`, f, body);
}
