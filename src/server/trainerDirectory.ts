// The trainer, coach and physio directory by city (/trainers/ and /trainers/<city>/; trainerPage.ts,
// docs/decisions/public-pages-and-seo.md "Trainer directory"). It shows only people who listed themselves as a trainer
// at a gym (gym_trainers, status 'listed': approved by the gym, or on a gym nobody has claimed), so a gym's page and the
// directory always agree. Only adults: a profile without a birth year saying 18 or over is left out, whatever else it
// says, and so is a profile without a name. Grouped by person, with every gym in the city they train at.
import { roleOf, type Role } from "./coach";
import { ratingOf, reviewsOf, type Rating, type Review } from "./coachReviews";
import { query } from "./db";

/** People a city needs before its directory page is indexed and in the sitemap. */
export const DIRECTORY_MIN = 2;

export interface DirectoryGym {
  name: string;
  citySlug: string;
  slug: string;
}

export interface DirectoryPerson {
  code: string;
  name: string;
  role: Role | "";
  bio: string;
  gyms: DirectoryGym[];
  /** Their rating, how their clients are training, and their latest reviews (none until they have enough; coachReviews.ts). */
  rating?: Rating;
  reviews?: Review[];
}

export interface DirectoryCity {
  citySlug: string;
  city: string;
  region: string;
  people: number;
}

const s = (x: unknown) => (typeof x === "string" ? x : "");

/** A listed trainer's name, if their profile has one and says they're an adult. */
export function adultName(body: string, now: number): string {
  try {
    const p = JSON.parse(body || "{}") as { name?: unknown; birthYear?: unknown };
    const year = typeof p.birthYear === "number" ? p.birthYear : NaN;
    if (!Number.isFinite(year) || new Date(now).getUTCFullYear() - year < 18) return "";
    return typeof p.name === "string" ? p.name.trim().slice(0, 60) : "";
  } catch {
    return "";
  }
}

interface Listing {
  account: string;
  code: string;
  bio: string;
  name: string;
  citySlug: string;
  city: string;
  region: string;
  gym: DirectoryGym;
}

async function listings(citySlug: string | null, now: number): Promise<Listing[]> {
  const rows = await query(
    `SELECT t.account_id, t.code, t.bio, r.body AS profile, p.city_slug, p.slug, p.name, p.city, p.region
       FROM gym_trainers t
       JOIN gym_places p ON p.id = t.place_id AND p.hidden = 0
       JOIN sync_records r ON r.account_id = t.account_id AND r.key = 'profile'
      WHERE t.status = 'listed'${citySlug ? " AND p.city_slug = ?" : ""}
      ORDER BY t.created_at LIMIT 20000`,
    citySlug ? [citySlug] : [],
  );
  return rows.flatMap((r) => {
    const name = adultName(s(r.profile), now);
    if (!name) return [];
    const gym = { name: s(r.name), citySlug: s(r.city_slug), slug: s(r.slug) };
    return [
      { account: s(r.account_id), code: s(r.code), bio: s(r.bio), name, citySlug: gym.citySlug, city: s(r.city), region: s(r.region), gym },
    ];
  });
}

/** Every city with at least one listed adult trainer, most people first. */
export async function trainerCities(now = Date.now()): Promise<DirectoryCity[]> {
  const byCity = new Map<string, { city: string; region: string; people: Set<string> }>();
  for (const l of await listings(null, now)) {
    const c = byCity.get(l.citySlug) ?? { city: l.city, region: l.region, people: new Set<string>() };
    c.people.add(l.account);
    byCity.set(l.citySlug, c);
  }
  return [...byCity]
    .map(([citySlug, c]) => ({ citySlug, city: c.city, region: c.region, people: c.people.size }))
    .sort((a, b) => b.people - a.people || a.city.localeCompare(b.city));
}

/** The people who train at a city's gyms, each once with all their gyms there, earliest listed first. */
export async function cityTrainers(
  citySlug: string,
  now = Date.now(),
): Promise<{ city: string; region: string; people: DirectoryPerson[] }> {
  if (!/^[a-z0-9-]{1,90}$/.test(citySlug)) return { city: "", region: "", people: [] };
  const list = await listings(citySlug, now);
  const people = new Map<string, DirectoryPerson>();
  for (const l of list) {
    const p = people.get(l.account);
    if (p) {
      p.gyms.push(l.gym);
      if (!p.bio) p.bio = l.bio;
    } else people.set(l.account, { code: l.code, name: l.name, role: "", bio: l.bio, gyms: [l.gym] });
  }
  await Promise.all(
    [...people].map(async ([account, p]) => {
      p.role = (await roleOf(account)) ?? "";
      p.rating = await ratingOf(account, now);
      p.reviews = await reviewsOf(account, null, 3);
    }),
  );
  return { city: list[0]?.city ?? "", region: list[0]?.region ?? "", people: [...people.values()] };
}
