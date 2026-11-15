// Tidying the place names and street addresses that come in from OpenStreetMap and from gyms' own websites
// (docs/decisions/gyms.md "Clean city names and addresses", Melvin 2026-11-15). Pure functions, so the import, the
// website fill-in and the repair of rows already saved all use the same rules.
//
// What went wrong before: a map entry's addr:city is sometimes a postcode or a house number ("80145", "1", "6337"), so
// gym pages were filed under cities like "80145, Campania" and "1, ON", and a few addresses carried stray commas and
// repeated parts ("12, , Park Street, Kolkata, Kolkata").

/** Postcodes we can recognize on their own: Canada, the UK, the Netherlands, Japan, Brazil, Poland and plain numbers. */
const POSTCODE = [
  /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, // Canada: V2Y 1A1
  /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, // UK: SW1A 1AA
  /^\d{4} ?[A-Z]{2}$/i, // Netherlands: 1234 AB
  /^\d{3}-\d{4}$/, // Japan: 150-0001
  /^\d{5}-\d{3}$/, // Brazil: 01310-100
  /^\d{2}-\d{3}$/, // Poland: 00-950
  /^\d{3,6}(-\d{4})?$/, // most others, and US ZIP+4
];

/** Postcodes inside a bit of text ("BC V2Y 1A1", "West Bengal 700019"). */
const POSTCODE_IN_TEXT = /\b(?:[A-Z]\d[A-Z] ?\d[A-Z]\d|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|\d{3}-\d{4}|\d{3,6}(?:-\d{4})?)\b/gi;

export const isPostcode = (x: string) => POSTCODE.some((re) => re.test(x.trim()));

const LETTER = /\p{L}/u;
const spaces = (x: string) =>
  x
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** Commas and spaces tidied: "a ,b,, c ," → "a, b, c". */
const commas = (x: string) =>
  spaces(x)
    .replace(/\s+,/g, ",")
    .replace(/,(?:\s*,)+/g, ",")
    .replace(/,(?=\S)/g, ", ")
    .replace(/^[\s,;:/\-–—.]+|[\s,;:/–—]+$/g, "");
const key = (x: string) =>
  x
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * A city name from a map tag or a page, or '' when it isn't one: "80145 Napoli" → "Napoli", "Toronto, ON" →
 * "Toronto", "80145", "1" and "V2Y 1A1" → ''. A name needs a letter (any script, so "浜松市" counts).
 */
export function cityName(raw: string | undefined, max = 60): string {
  let v = commas(raw ?? "");
  if (!v) return "";
  // "Toronto, ON", "Napoli, 80145": the city is the first part that is one.
  const parts = v
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  v = parts.find((p) => LETTER.test(p) && !isPostcode(p)) ?? "";
  // A postcode before or after the name: "80145 Napoli", "Napoli 80145", "D-10115 Berlin", "SW1A 1AA London".
  v = v
    .replace(/^(?:[A-Z]{1,2}-)?\d[\d -]*\d\s+(?=\p{L})/u, "")
    .replace(/^[A-Z]\d[A-Z] ?\d[A-Z]\d\s+/i, "")
    .replace(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\s+/i, "")
    .replace(/\s+\d[\d -]*$/, "")
    .trim();
  if (!LETTER.test(v) || isPostcode(v) || v.length < 2) return "";
  // A street isn't a city ("Main Street", "Calle 5").
  if (/^\d+\s/.test(v)) return "";
  return v.slice(0, max);
}

/** True when a saved city can't be a city's name (a postcode, a house number, nothing). */
export const badCity = (city: string) => !cityName(city) || cityName(city) !== spaces(city);

/**
 * A street address made tidy: commas and spaces fixed, repeated parts dropped, and the city, region, postcode and
 * country left off the end (the page shows those itself). A unit or number with no street ("109-", "12") gives ''.
 */
export function tidyAddress(raw: string | undefined, around: { city?: string; region?: string; postcode?: string; country?: string } = {}) {
  const v = commas(raw ?? "");
  if (!v) return "";
  const drop = new Set(
    [around.city, around.region, around.postcode, around.country]
      .filter((x): x is string => !!x)
      .map(key)
      .filter(Boolean),
  );
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const p of v.split(",")) {
    const part = p.trim().replace(/^[\s\-–—/]+|[\s\-–—/]+$/g, "");
    const k = key(part);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    parts.push(part);
  }
  // The city, region, postcode and country at the end, in any order ("…, Kolkata, West Bengal 700019, India").
  while (parts.length > 1) {
    const rest = key(parts[parts.length - 1]!.replace(POSTCODE_IN_TEXT, " "));
    const words = rest.split(" ").filter(Boolean);
    const tail = !rest || drop.has(rest) || (words.length <= 4 && words.every((w) => drop.has(w)));
    if (!tail) break;
    parts.pop();
  }
  const out = parts.join(", ");
  // Something to find: a letter, or a Japanese style block number ("1-2-3").
  if (!LETTER.test(out) && !/^\d+(-\d+){1,3}$/.test(out)) return "";
  return out.slice(0, 120);
}

/** How far apart two points are, in km. */
export function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12_742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when two city names are the same place ("Montréal" and "Montreal", "New York City" and "New York"). */
export function sameCity(a: string, b: string): boolean {
  const x = key(a);
  const y = key(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `) || x.replace(/ city$/, "") === y.replace(/ city$/, "");
}

/** The street part of a postal code check: a postcode that fits the country, when we know its shape. */
const COUNTRY_POSTCODE: Record<string, RegExp> = {
  CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
  US: /^\d{5}(-\d{4})?$/,
  GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  AU: /^\d{4}$/,
  NZ: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  IT: /^\d{5}$/,
  ES: /^\d{5}$/,
  MX: /^\d{5}$/,
  IN: /^\d{6}$/,
  JP: /^\d{3}-?\d{4}$/,
  NL: /^\d{4} ?[A-Z]{2}$/i,
  IE: /^[A-Z]\d{2} ?[A-Z\d]{4}$/i,
};

/** A postcode cleaned up and checked against the country's shape (any 3 to 10 letters and digits elsewhere), or ''. */
export function postcodeFor(raw: string | undefined, country = ""): string {
  const v = spaces(raw ?? "").toUpperCase();
  if (!v || !/\d/.test(v)) return "";
  const shape = COUNTRY_POSTCODE[country.toUpperCase()];
  if (shape) return shape.test(v) ? v : "";
  return /^[A-Z\d][A-Z\d -]{1,8}[A-Z\d]$/.test(v) ? v : "";
}
