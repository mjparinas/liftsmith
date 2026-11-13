// More on a real gym's page (Melvin, 2026-11-13, docs/decisions/gyms.md "Round 3"): what the gym has besides
// equipment and what a visit costs (amenities and prices), the owner's announcements, equipment lifters reported
// broken or missing, and the trainers who coach there. Shared by the app and the server, so both read the same lists.
import { EQUIPMENT, type Equipment } from "./types";

/** Things a gym has that aren't equipment, in the order they're shown. */
export const AMENITIES = [
  "allHours",
  "showers",
  "lockers",
  "towels",
  "parking",
  "wheelchair",
  "womensArea",
  "childcare",
  "sauna",
  "pool",
  "classes",
  "personalTraining",
  "platforms",
  "turf",
  "freeTrial",
] as const;
export type Amenity = (typeof AMENITIES)[number];

export const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** What a visit costs, in the currency's main unit (dollars, euros, yen). A price left out isn't shown. */
export interface Prices {
  currency: Currency;
  day?: number;
  week?: number;
  month?: number;
}
export const PRICE_KINDS = ["day", "week", "month"] as const;
export type PriceKind = (typeof PRICE_KINDS)[number];

const EURO = new Set([
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "IE",
  "PT",
  "FI",
  "GR",
  "LU",
  "SK",
  "SI",
  "EE",
  "LV",
  "LT",
  "MT",
  "CY",
  "HR",
]);

/** The usual currency for a gym's country code ("CA" → CAD), CAD when it's not known. */
export function currencyFor(country: string): Currency {
  const c = country.toUpperCase();
  if (c === "US") return "USD";
  if (c === "GB" || c === "UK") return "GBP";
  if (c === "AU") return "AUD";
  if (c === "JP") return "JPY";
  if (EURO.has(c)) return "EUR";
  return "CAD";
}

/** "showers,parking" (or a list) → the known amenities in their shown order, without repeats. */
export function cleanAmenities(v: unknown): Amenity[] {
  const list = typeof v === "string" ? v.split(",") : Array.isArray(v) ? v : [];
  const want = new Set(list.map((x) => String(x).trim()));
  return AMENITIES.filter((a) => want.has(a));
}

/** A price between 0 and 100,000 with at most two decimals, or undefined when it isn't one. */
const price = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100_000) return undefined;
  return Math.round(n * 100) / 100;
};

/** Prices as saved (JSON) or sent by the app, tidied; null when none is set. */
export function cleanPrices(v: unknown, fallback: Currency = "CAD"): Prices | null {
  let raw: unknown = v;
  if (typeof v === "string") {
    try {
      raw = v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const currency = CURRENCIES.find((c) => c === r.currency) ?? fallback;
  const out: Prices = { currency };
  for (const k of PRICE_KINDS) {
    const p = price(r[k]);
    if (p !== undefined) out[k] = p;
  }
  return PRICE_KINDS.some((k) => out[k] !== undefined) ? out : null;
}

/** "$15" in the reader's language, without cents when it's a whole amount. */
export function money(amount: number, currency: Currency, lang: string): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency,
    // "$15", not "CA$15": the gym's page already says where it is.
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

/** An announcement from the gym's owner. */
export interface GymNews {
  id: string;
  text: string;
  at: number;
}

export const ISSUE_KINDS = ["broken", "missing"] as const;
export type IssueKind = (typeof ISSUE_KINDS)[number];

/** Equipment a lifter reported broken or missing, until someone says it works again or it runs out. */
export interface GymIssue {
  id: string;
  equipment: Equipment;
  kind: IssueKind;
  note: string;
  at: number;
  /** How many lifters reported it. */
  reports: number;
}

export const isEquipment = (x: unknown): x is Equipment => typeof x === "string" && (EQUIPMENT as readonly string[]).includes(x);

/** A trainer or coach who trains clients at the gym, as the gym's page lists them. */
export interface GymTrainer {
  /** Their join code for this gym (#/trainer/<code>): opens the usual "Share my workouts" screen. */
  code: string;
  name: string;
  /** "trainer", "coach" or "physio" (the coach's own pick), "" before they pick. */
  role: string;
  bio: string;
}

export const EXTRA_LIMITS = {
  /** Characters in an announcement, and announcements a gym can post a day. */
  news: 280,
  newsPerDay: 3,
  /** Announcements shown, and how long one shows. */
  newsShown: 3,
  newsMs: 60 * 86_400_000,
  /** Characters in a problem report's note; reports per lifter a day; a report shows this long unless fixed. */
  issueNote: 200,
  issuesPerDay: 10,
  issueMs: 14 * 86_400_000,
  /** Characters in a trainer's line about themselves, gyms one coach can list, trainers shown on a gym. */
  bio: 200,
  trainerGyms: 5,
  trainersShown: 30,
};
