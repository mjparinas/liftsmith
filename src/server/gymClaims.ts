// Claiming a gym (docs/decisions/gyms.md, step 3). An owner or manager proves a gym is theirs, which makes it
// official (the check mark, listed first) and lets them keep its hours, contact details, description and equipment
// up to date. Proof, cheapest first:
//   1. A six-digit code emailed to an address at the gym's own website domain (info@ironworks.ca for ironworks.ca).
//   2. The claim code printed on the poster or stand we mail to the gym (gym_places.claim_code, step 4).
//   3. Anything else waits for staff on the admin Gyms tab, who check it (a call to the gym's listed phone, say).
// One account can own up to 10 gyms. Deleting the account gives the gyms back (unclaimed, details kept).
import { createHash, randomBytes, randomInt } from "node:crypto";

import { decodeGym, encodeGym } from "@/lib/gymShare";
import { parseHours } from "@/lib/openingHours";

import { cleanEmail, type SendMail } from "./accounts";
import { query, rateLimit, run } from "./db";
import { isPlaceId } from "./gymPlaces";
import { checkText } from "./moderation";

export const CLAIM_LIMITS = {
  /** Gyms one account can own. */
  perAccount: 10,
  /** Claim requests per account per day. */
  perDay: 5,
  /** How long an emailed code works. */
  codeMs: 30 * 60_000,
  /** Wrong tries before an emailed code stops working. */
  tries: 5,
  /** Wrong poster codes per account per day. */
  posterTries: 10,
};

export const ROLES = ["owner", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const isClaimId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);

// Website hosts that many unrelated businesses share: an address there proves nothing about one gym.
const SHARED_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linktr.ee",
  "google.com",
  "business.site",
  "wixsite.com",
  "squarespace.com",
  "wordpress.com",
  "blogspot.com",
  "yelp.com",
  "mindbodyonline.com",
  "github.io",
  "vercel.app",
  "netlify.app",
];

/** The domain a gym's website lives on ("ironworks.ca"), or null when there's none or it's a shared host. */
export function siteDomain(website: string): string | null {
  let host: string;
  try {
    host = new URL(website).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  if (!host.includes(".") || SHARED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  return host;
}

/** Does this email address belong to the gym's website domain (or a subdomain of it, or the other way round)? */
export function emailMatchesSite(email: string, website: string): boolean {
  const site = siteDomain(website);
  const at = email.lastIndexOf("@");
  if (!site || at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return domain === site || domain.endsWith(`.${site}`) || site.endsWith(`.${domain}`);
}

export type ClaimStart =
  | { ok: true; claim: string; method: "email" | "review" }
  | { ok: false; error: "place" | "taken" | "email" | "name" | "role" | "full" | "slow" | "mail" | "words" | "link" | "empty" };

/**
 * Starts a claim: emails a code when the address is at the gym's website domain, else queues it for staff.
 * `mail` sends the code (null in development, where the code is handed back for testing).
 */
export async function startClaim(
  accountId: string,
  body: Record<string, unknown>,
  mail: SendMail | null,
  now = Date.now(),
): Promise<ClaimStart | { ok: true; claim: string; method: "email"; devCode: string }> {
  if (!isPlaceId(body.place)) return { ok: false, error: "place" };
  const [p] = await query("SELECT id, name, website, claimed_by FROM gym_places WHERE id = ? AND hidden = 0", [body.place]);
  if (!p) return { ok: false, error: "place" };
  if (s(p.claimed_by)) return { ok: false, error: "taken" };
  const email = cleanEmail(body.email);
  if (!email) return { ok: false, error: "email" };
  const role = ROLES.find((r) => r === body.role);
  if (!role) return { ok: false, error: "role" };
  const name = checkText(body.name, 80);
  if (!name.ok) return { ok: false, error: name.error === "empty" ? "name" : name.error };
  const phone = s(body.phone)
    .replace(/[^\d+()\-. ]/g, "")
    .slice(0, 30);
  const note = typeof body.note === "string" && body.note.trim() ? checkText(body.note, 500) : null;
  if (note && !note.ok) return { ok: false, error: note.error };
  const [owned] = await query("SELECT COUNT(*) AS n FROM gym_places WHERE claimed_by = ?", [accountId]);
  if (n(owned?.n) >= CLAIM_LIMITS.perAccount) return { ok: false, error: "full" };
  if (!(await rateLimit(`gyms:claim:${accountId}`, CLAIM_LIMITS.perDay, 86_400_000, now))) return { ok: false, error: "slow" };
  const byEmail = emailMatchesSite(email, s(p.website));
  const id = randomBytes(8).toString("hex");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // One open claim per account and gym: a new one replaces the last.
  await run("DELETE FROM gym_claims WHERE account_id = ? AND place_id = ? AND status IN ('code', 'pending')", [accountId, p.id as string]);
  await run(
    `INSERT INTO gym_claims (id, place_id, account_id, name, email, phone, role, note, method, status, code_hash, expires_at, tries, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      s(p.id),
      accountId,
      name.text,
      email,
      phone,
      role,
      note?.ok ? note.text : "",
      byEmail ? "email" : "review",
      byEmail ? "code" : "pending",
      byEmail ? hash(`${id}:${code}`) : "",
      byEmail ? now + CLAIM_LIMITS.codeMs : 0,
      now,
    ],
  );
  if (!byEmail) return { ok: true, claim: id, method: "review" };
  const text = `Your code to claim ${s(p.name)} on Liftsmith is ${code}\n\nType it in the app to make the gym official. It works for 30 minutes.\n\nIf you didn't ask for it, ignore this email: nobody can claim the gym without the code.\n\nLiftsmith · https://www.getliftsmith.com`;
  if (!mail) {
    if (process.env.NODE_ENV !== "production") return { ok: true, claim: id, method: "email", devCode: code };
    return { ok: false, error: "mail" };
  }
  const sent = await mail(email, `${code} is your code to claim ${s(p.name)}`, text).catch(() => false);
  if (!sent) return { ok: false, error: "mail" };
  return { ok: true, claim: id, method: "email" };
}

/** Makes `accountId` the gym's owner, unless someone already is. */
async function grant(placeId: string, accountId: string, now: number): Promise<boolean> {
  const done = await run("UPDATE gym_places SET claimed_by = ?, claimed_at = ?, updated_at = ? WHERE id = ? AND claimed_by = ''", [
    accountId,
    now,
    now,
    placeId,
  ]);
  return done > 0;
}

export type ClaimVerify = { ok: true; place: string } | { ok: false; error: "wrong" | "expired" | "taken" };

/** Checks an emailed code. Each try is counted before comparing, so parallel guesses can't pass the limit. */
export async function verifyClaim(accountId: string, claimId: unknown, code: unknown, now = Date.now()): Promise<ClaimVerify> {
  if (!isClaimId(claimId) || typeof code !== "string") return { ok: false, error: "wrong" };
  const counted = await query(
    `UPDATE gym_claims SET tries = tries + 1 WHERE id = ? AND account_id = ? AND status = 'code' AND tries < ? AND expires_at >= ?
     RETURNING place_id, code_hash`,
    [claimId, accountId, CLAIM_LIMITS.tries, now],
  );
  const c = counted[0];
  if (!c) return { ok: false, error: "expired" };
  if (hash(`${claimId}:${code.trim()}`) !== s(c.code_hash)) return { ok: false, error: "wrong" };
  const used = await query("UPDATE gym_claims SET status = 'approved', decided_at = ? WHERE id = ? AND status = 'code' RETURNING id", [
    now,
    claimId,
  ]);
  if (!used.length) return { ok: false, error: "expired" };
  if (!(await grant(s(c.place_id), accountId, now))) return { ok: false, error: "taken" };
  return { ok: true, place: s(c.place_id) };
}

/** The claim code printed on a gym's poster or stand (step 4). */
export async function claimWithPosterCode(accountId: string, placeId: unknown, code: unknown, now = Date.now()): Promise<ClaimVerify> {
  if (!isPlaceId(placeId) || typeof code !== "string") return { ok: false, error: "wrong" };
  if (!(await rateLimit(`gyms:poster:${accountId}`, CLAIM_LIMITS.posterTries, 86_400_000, now))) return { ok: false, error: "expired" };
  const [p] = await query("SELECT claim_code, claimed_by FROM gym_places WHERE id = ?", [placeId]);
  if (!p || !s(p.claim_code)) return { ok: false, error: "wrong" };
  if (s(p.claimed_by)) return { ok: false, error: "taken" };
  if (hash(`${placeId}:${code.trim().toUpperCase()}`) !== s(p.claim_code)) return { ok: false, error: "wrong" };
  if (!(await grant(placeId, accountId, now))) return { ok: false, error: "taken" };
  await run("UPDATE gym_places SET claim_code = '' WHERE id = ?", [placeId]);
  await run(
    `INSERT INTO gym_claims (id, place_id, account_id, name, email, phone, role, note, method, status, code_hash, expires_at, tries, created_at, decided_at)
     VALUES (?, ?, ?, '', '', '', 'owner', '', 'poster', 'approved', '', 0, 0, ?, ?)`,
    [randomBytes(8).toString("hex"), placeId, accountId, now, now],
  );
  return { ok: true, place: placeId };
}

/** A new poster claim code for a gym ("K7Q4-M2XP"): kept only as a hash, shown once to staff to print. */
export async function newPosterCode(placeId: string): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const raw = Array.from({ length: 8 }, () => alphabet[randomInt(0, alphabet.length)]).join("");
  const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  await run("UPDATE gym_places SET claim_code = ? WHERE id = ?", [hash(`${placeId}:${code}`), placeId]);
  return code;
}

// --- The owner's details ---

export interface OwnedGym {
  id: string;
  name: string;
  citySlug: string;
  slug: string;
  hours: string;
  website: string;
  phone: string;
  description: string;
  code: string;
  /** The map's address, to start the stand's mailing address. */
  address: string;
  lifters: number;
  /** The owner's results: lifters who added the gym in the last 30 days, and poster or stand scans (all time, 30 days). */
  newLifters: number;
  scans: number;
  scans30: number;
  /** The gym's own club's code (social.ts gymClubStart), '' before the owner starts it. */
  club: string;
  /** The logo's and photos' ids (gymMedia.ts). */
  logo: string;
  photos: string[];
}

/** "logo:ab12,photo:cd34" → the logo's id and the photos' ids, in order. */
function pictures(list: string): { logo: string; photos: string[] } {
  const all = list ? list.split(",").map((x) => x.split(":")) : [];
  return { logo: all.find(([k]) => k === "logo")?.[1] ?? "", photos: all.filter(([k]) => k === "photo").map(([, id]) => id!) };
}

export async function ownedGyms(accountId: string, now = Date.now()): Promise<OwnedGym[]> {
  // With the owner's results for the last 30 days: lifters who added the gym and poster or stand scans.
  const since = now - 30 * 86_400_000;
  const rows = await query(
    `SELECT p.id, p.name, p.city_slug, p.slug, p.address, p.city, p.region, p.hours, p.website, p.phone, p.description, p.code, p.lifters,
       p.qr_scans,
       (SELECT COUNT(*) FROM gym_place_lifters l WHERE l.place_id = p.id AND l.created_at > ?) AS new_lifters,
       (SELECT COALESCE(SUM(d.n), 0) FROM gym_scan_days d WHERE d.place_id = p.id AND d.day > ?) AS scans_30,
       (SELECT c.code FROM clubs c WHERE c.place_id = p.id) AS club,
       (SELECT group_concat(m.kind || ':' || m.id) FROM (SELECT kind, id FROM gym_photos WHERE place_id = p.id ORDER BY created_at, id) m)
         AS pictures
     FROM gym_places p WHERE p.claimed_by = ? ORDER BY p.name`,
    [since, Math.floor(since / 86_400_000), accountId],
  );
  return rows.map((r) => ({
    id: s(r.id),
    name: s(r.name),
    citySlug: s(r.city_slug),
    slug: s(r.slug),
    hours: s(r.hours),
    website: s(r.website),
    phone: s(r.phone),
    description: s(r.description),
    code: s(r.code),
    address: [s(r.address), [s(r.city), s(r.region)].filter(Boolean).join(" ")].filter(Boolean).join("\n"),
    lifters: n(r.lifters),
    newLifters: n(r.new_lifters),
    scans: n(r.qr_scans),
    scans30: n(r.scans_30),
    club: s(r.club),
    ...pictures(s(r.pictures)),
  }));
}

export type EditResult = { ok: true } | { ok: false; error: "owner" | "hours" | "website" | "code" | "words" | "link" | "empty" };

/** The owner changes their gym's details. Only fields sent are changed. */
export async function editGym(accountId: string, body: Record<string, unknown>, now = Date.now()): Promise<EditResult> {
  if (!isPlaceId(body.place)) return { ok: false, error: "owner" };
  const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND claimed_by = ?", [body.place, accountId]);
  if (!p) return { ok: false, error: "owner" };
  const set: [string, string][] = [];
  if (body.hours !== undefined) {
    const h = s(body.hours).trim().slice(0, 200);
    if (h && !parseHours(h)) return { ok: false, error: "hours" };
    set.push(["hours", h]);
  }
  if (body.website !== undefined) {
    const w = s(body.website).trim();
    if (w && !/^https?:\/\/[^\s]{3,290}$/i.test(w)) return { ok: false, error: "website" };
    set.push(["website", w]);
  }
  if (body.phone !== undefined)
    set.push([
      "phone",
      s(body.phone)
        .replace(/[^\d+()\-. ]/g, "")
        .slice(0, 30),
    ]);
  if (body.description !== undefined) {
    const d = s(body.description).trim();
    if (d) {
      const c = checkText(d, 500);
      if (!c.ok) return { ok: false, error: c.error };
      set.push(["description", c.text]);
    } else set.push(["description", ""]);
  }
  if (body.code !== undefined) {
    const kit = typeof body.code === "string" && body.code.length <= 20_000 ? decodeGym(body.code) : null;
    if (body.code !== "" && !kit) return { ok: false, error: "code" };
    set.push(["code", kit ? encodeGym(kit) : ""]);
  }
  if (!set.length) return { ok: true };
  await run(`UPDATE gym_places SET ${set.map(([k]) => `${k} = ?`).join(", ")}, source = 'owner', updated_at = ? WHERE id = ?`, [
    ...set.map(([, v]) => v),
    now,
    s(p.id),
  ]);
  return { ok: true };
}

/** The owner gives the gym up: it goes back to unofficial, with the details they set. */
export async function releaseGym(accountId: string, placeId: unknown, now = Date.now()): Promise<boolean> {
  if (!isPlaceId(placeId)) return false;
  const gone =
    (await run("UPDATE gym_places SET claimed_by = '', claimed_at = 0, updated_at = ? WHERE id = ? AND claimed_by = ?", [
      now,
      placeId,
      accountId,
    ])) > 0;
  // The gym's club stays with its members as an ordinary club; the next owner starts the gym's own.
  if (gone) await run("UPDATE clubs SET place_id = '' WHERE place_id = ?", [placeId]);
  return gone;
}

// --- Staff: claims waiting on the Gyms tab ---

export interface ClaimRow {
  id: string;
  placeId: string;
  placeName: string;
  placeWebsite: string;
  placePhone: string;
  city: string;
  accountId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  note: string;
  method: string;
  status: string;
  createdAt: number;
  taken: boolean;
}

export async function claimQueue(): Promise<ClaimRow[]> {
  const rows = await query(
    `SELECT c.*, p.name AS place_name, p.website AS place_website, p.phone AS place_phone, p.city AS city, p.claimed_by AS claimed_by
     FROM gym_claims c JOIN gym_places p ON p.id = c.place_id
     WHERE c.status = 'pending' OR c.decided_at > ? ORDER BY c.status = 'pending' DESC, c.created_at DESC LIMIT 200`,
    [Date.now() - 30 * 86_400_000],
  );
  return rows.map((r) => ({
    id: s(r.id),
    placeId: s(r.place_id),
    placeName: s(r.place_name),
    placeWebsite: s(r.place_website),
    placePhone: s(r.place_phone),
    city: s(r.city),
    accountId: s(r.account_id),
    name: s(r.name),
    email: s(r.email),
    phone: s(r.phone),
    role: s(r.role),
    note: s(r.note),
    method: s(r.method),
    status: s(r.status),
    createdAt: n(r.created_at),
    taken: !!s(r.claimed_by),
  }));
}

export async function pendingClaimCount(): Promise<number> {
  const [r] = await query("SELECT COUNT(*) AS n FROM gym_claims WHERE status = 'pending'");
  return n(r?.n);
}

/** Staff approve (the gym becomes theirs, if nobody owns it yet) or reject a waiting claim. */
export async function decideClaim(id: unknown, action: unknown, now = Date.now()): Promise<boolean> {
  if (!isClaimId(id) || (action !== "approve" && action !== "reject")) return false;
  const [c] = await query("SELECT place_id, account_id FROM gym_claims WHERE id = ? AND status = 'pending'", [id]);
  if (!c) return false;
  if (action === "approve" && !(await grant(s(c.place_id), s(c.account_id), now))) return false;
  await run("UPDATE gym_claims SET status = ?, decided_at = ? WHERE id = ?", [action === "approve" ? "approved" : "rejected", now, id]);
  return true;
}

/** Account deletion: claims go, and owned gyms go back to unofficial. */
export const claimDeletes = (accountId: string) => [
  { sql: "DELETE FROM gym_claims WHERE account_id = ?", args: [accountId] },
  { sql: "UPDATE gym_places SET claimed_by = '', claimed_at = 0 WHERE claimed_by = ?", args: [accountId] },
];
