// Find a gym near you (src/server/gymDirectory.ts, docs/decisions/gym-sharing.md). Server build only.
// GET ?lat=&lon=[&studios=1]: real gyms (gymPlaces.ts, official ones first) and listed setups near a position the
// app already rounded to about 1 km. Anyone, rate-limited. `gyms` stays as it was for older apps; `places` is new.
// POST {op}: publish, unpublish, mine, suggest (add a gym the map doesn't have), the claim ops (claimStart, claimVerify, claimPoster, owned, edit, release), gymClub and
// the poster ops (posters, posterStatus)
// need a signed-in account; added and report work signed out too.
import { hasDb, preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { resendMail, sessionOf } from "@/server/accounts";
import { rateLimit } from "@/server/db";
import { claimWithPosterCode, editGym, ownedGyms, releaseGym, startClaim, verifyClaim } from "@/server/gymClaims";
import { added, addressKey, LIMITS, mine, nearby, publish, report, unpublish } from "@/server/gymDirectory";
import { areaMapPath } from "@/server/gymMedia";
import { joinPlace, nearbyPlaces, placeById, suggestPlace } from "@/server/gymPlaces";
import { latestOrder, requestPosters } from "@/server/gymPosters";
import { gymClubStart } from "@/server/social";

export const OPTIONS = preflight;

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

export async function GET(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "The gym list isn't set up yet." });
  const u = new URL(req.url).searchParams;
  const allowed = rateLimit(`gyms:search:${ipOf(req)}`, LIMITS.searchesPerHour, 3_600_000);
  // ?place=<id>: one real gym, for its page in the app (GymPlace.tsx, the QR code's target).
  if (u.has("place")) {
    const [ok, place] = await Promise.all([allowed, placeById(u.get("place"))]);
    if (!ok) return reply(req, 429, { error: "slow" });
    return place ? reply(req, 200, { place }) : reply(req, 404, { error: "gone" });
  }
  const lat = Number(u.get("lat") ?? NaN);
  const lon = Number(u.get("lon") ?? NaN);
  // The limit, the listed setups and the real gyms in one go: each is a trip to the database, and one after another
  // they were most of the wait (2026-11-13, "Find a gym near me feels slow").
  const [ok, gyms, places] = await Promise.all([allowed, nearby(lat, lon), nearbyPlaces(lat, lon, { studios: u.get("studios") === "1" })]);
  if (!ok) return reply(req, 429, { error: "slow" });
  if (!gyms || !places) return reply(req, 400, { error: "Bad request." });
  // The same rounded spot asked again within two minutes (a second tap, the setup wizard then Gyms) comes from the
  // phone's own cache. Private, because the answer carries the CORS header for the asking app.
  const res = reply(req, 200, {
    gyms,
    places,
    map: areaMapPath(
      places.map((p) => p.id),
      { lat, lon },
    ),
  });
  res.headers.set("Cache-Control", "private, max-age=120");
  return res;
}

export async function POST(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "The gym list isn't set up yet." });
  const body = await readJson(req, 24_000);
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  const b = body as Record<string, unknown>;
  if (b.op === "added" || b.op === "report") {
    const s = await sessionOf(req).catch(() => null);
    const who = s ? `acc:${s.accountId}` : addressKey(ipOf(req));
    if (!(await rateLimit(`gyms:${b.op}:${who}`, 30, 3_600_000))) return reply(req, 429, { error: "slow" });
    if (b.op === "added") {
      if (b.id !== undefined) await added(who, b.id);
      if (b.place !== undefined) await joinPlace(who, b.place);
      return reply(req, 200, { ok: true });
    }
    return (await report(who, b.id, b.reason)) ? reply(req, 200, { ok: true }) : reply(req, 400, { error: "Bad request." });
  }
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  switch (b.op) {
    case "publish": {
      const r = await publish(s.accountId, b);
      if (r.ok) return reply(req, 200, { id: r.id });
      return reply(req, r.error === "slow" ? 429 : r.error === "full" ? 409 : 400, { error: r.error });
    }
    case "unpublish":
      await unpublish(s.accountId, b.localId);
      return reply(req, 200, { ok: true });
    case "mine":
      return reply(req, 200, { gyms: await mine(s.accountId) });
    // A gym the map doesn't have, checked by staff before it shows (gymPlaces.ts suggestPlace).
    case "suggest": {
      const r = await suggestPlace(s.accountId, b);
      if (r.ok) return reply(req, 200, r);
      return reply(req, r.error === "slow" ? 429 : r.error === "exists" ? 409 : 400, { error: r.error });
    }
    // Claiming a gym and keeping its details (src/server/gymClaims.ts, docs/decisions/gyms.md step 3).
    case "claimStart": {
      const r = await startClaim(s.accountId, b, resendMail());
      if (r.ok) return reply(req, 200, r);
      const status = r.error === "slow" ? 429 : r.error === "taken" || r.error === "full" ? 409 : r.error === "mail" ? 502 : 400;
      return reply(req, status, { error: r.error });
    }
    case "claimVerify":
    case "claimPoster": {
      const r =
        b.op === "claimVerify" ? await verifyClaim(s.accountId, b.claim, b.code) : await claimWithPosterCode(s.accountId, b.place, b.code);
      return r.ok ? reply(req, 200, r) : reply(req, r.error === "taken" ? 409 : 400, { error: r.error });
    }
    case "owned":
      return reply(req, 200, { gyms: await ownedGyms(s.accountId) });
    case "edit": {
      const r = await editGym(s.accountId, b);
      return r.ok ? reply(req, 200, { ok: true }) : reply(req, r.error === "owner" ? 403 : 400, { error: r.error });
    }
    case "release":
      return (await releaseGym(s.accountId, b.place)) ? reply(req, 200, { ok: true }) : reply(req, 403, { error: "owner" });
    // A free poster and table stand for the gym (src/server/gymPosters.ts, docs/decisions/gyms.md step 4).
    case "posters": {
      const r = await requestPosters(s.accountId, b);
      if (r.ok) return reply(req, 200, r);
      return reply(req, r.error === "slow" ? 429 : r.error === "owner" ? 403 : r.error === "open" ? 409 : 400, { error: r.error });
    }
    // The gym's own club and weekly leaderboard, started by its owner (social.ts gymClubStart).
    case "gymClub": {
      const r = await gymClubStart(s.accountId, b.place);
      return reply(req, r.code, r.body);
    }
    case "posterStatus":
      return reply(req, 200, { order: await latestOrder(s.accountId, b.place) });
    default:
      return reply(req, 400, { error: "Unknown op." });
  }
}
