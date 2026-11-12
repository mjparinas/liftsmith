// Find a gym near you (src/server/gymDirectory.ts, docs/decisions/gym-sharing.md). Server build only.
// GET ?lat=&lon=[&studios=1]: real gyms (gymPlaces.ts, official ones first) and listed setups near a position the
// app already rounded to about 1 km. Anyone, rate-limited. `gyms` stays as it was for older apps; `places` is new.
// POST {op}: publish, unpublish, mine and the claim ops (claimStart, claimVerify, claimPoster, owned, edit, release)
// need a signed-in account; added and report work signed out too.
import { hasDb, preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { resendMail, sessionOf } from "@/server/accounts";
import { rateLimit } from "@/server/db";
import { claimWithPosterCode, editGym, ownedGyms, releaseGym, startClaim, verifyClaim } from "@/server/gymClaims";
import { added, addressKey, LIMITS, mine, nearby, publish, report, unpublish } from "@/server/gymDirectory";
import { joinPlace, nearbyPlaces, placeById } from "@/server/gymPlaces";

export const OPTIONS = preflight;

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

export async function GET(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "The gym list isn't set up yet." });
  if (!(await rateLimit(`gyms:search:${ipOf(req)}`, LIMITS.searchesPerHour, 3_600_000))) return reply(req, 429, { error: "slow" });
  const u = new URL(req.url).searchParams;
  // ?place=<id>: one real gym, for its page in the app (GymPlace.tsx, the QR code's target).
  if (u.has("place")) {
    const place = await placeById(u.get("place"));
    return place ? reply(req, 200, { place }) : reply(req, 404, { error: "gone" });
  }
  const lat = Number(u.get("lat") ?? NaN);
  const lon = Number(u.get("lon") ?? NaN);
  const gyms = await nearby(lat, lon);
  const places = await nearbyPlaces(lat, lon, { studios: u.get("studios") === "1" });
  if (!gyms || !places) return reply(req, 400, { error: "Bad request." });
  return reply(req, 200, { gyms, places });
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
    default:
      return reply(req, 400, { error: "Unknown op." });
  }
}
