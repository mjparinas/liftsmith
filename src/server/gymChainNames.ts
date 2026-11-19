// Gym chains, the pure part (Melvin, 2026-11-19: "logos and 'all locations' pages for gym chains"; docs/decisions/gyms.md
// "Gym chains"). Which chain a gym belongs to comes from the map first: OpenStreetMap's `brand` tag ("Planet Fitness",
// "Éconofitness"). Without one, a gym whose name is a known chain's name, or starts with it ("Planet Fitness Langley"),
// is that chain's. A name that repeats in three cities or more, and isn't only common words ("Fitness Centre", "Gym"),
// becomes a chain of its own (gymChains.ts discoverNameChains). The database side is gymChains.ts.

/** "Éconofitness" → "econofitness": accents folded, lower case, anything else between words a single space. */
export function chainKey(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A chain's address part: /gym-chains/<slug>/ ("planet-fitness"). Empty for a name with nothing to spell it with. */
export const chainSlug = (name: string) => chainKey(name).replace(/ /g, "-").slice(0, 60).replace(/-+$/, "");

/** The chain the map names on a gym: its `brand` tag (or the English one), tidied. '' when there's none. */
export function brandOf(tags: Record<string, string | undefined>): string {
  const raw = (tags.brand ?? tags["brand:en"] ?? "").replace(/[\u0000-\u001f]/g, " ").trim();
  // A brand tag sometimes lists two ("Anytime Fitness;Snap Fitness"): the first one is the gym's.
  const brand = raw.split(";")[0]!.trim().slice(0, 80);
  return chainSlug(brand) && !genericName(brand) ? brand : "";
}

// Words that say what a place is, not whose it is, in the app's languages and the map's usual ones. A name made only
// of these ("Fitness Centre", "Gimnasio Municipal", "Hotel Gym") repeats everywhere and is never a chain.
const GENERIC = new Set(
  (
    "a an the and of at in on de del des du la le les el los las l d da do das dos di der die das und im am fur zu y e et " +
    "gym gyms gymnasium gimnasio gimnasios ginasio palestra salle sala studio studios fitness fit fitnessstudio fitnesscenter " +
    "fitnesscentrum fitnessclub center centre centro centrum club clube klub sport sports sportif sportiva sportivo deportivo " +
    "deportiva polideportivo sporthalle sportcentrum sportzentrum health wellness spa training trainingszentrum crossfit box " +
    "recreation rec community leisure athletic athletics academy academia school college university campus hotel resort " +
    "municipal public city town park outdoor indoor street workout calisthenics body bodybuilding powerlifting weightlifting " +
    "strength conditioning functional personal trainer room house home place zone space hall pool piscina swimming boxing " +
    "martial arts yoga pilates dance spin cycle cycling studio24 24h open new old main north south east west " +
    "kraftraum musculation muscu academia ginastica forma gimnastyczna silownia silowania spor salonu merkezi jimu"
  ).split(/\s+/),
);

/** True when every word of the name is a common one (GENERIC), so the name says nothing about whose gym it is. */
export function genericName(name: string): boolean {
  const words = chainKey(name).split(" ").filter(Boolean);
  return !words.length || words.every((w) => GENERIC.has(w) || /^\d+$/.test(w));
}

/**
 * The chain a gym belongs to by its name, from the known chains (keyed by `chainKey` of their names): the whole name,
 * else the longest run of its first words that is a chain's name ("Planet Fitness Langley" → Planet Fitness). '' for
 * none.
 */
export function matchChain(name: string, known: ReadonlyMap<string, string>): string {
  if (!known.size) return "";
  const words = chainKey(name).split(" ").filter(Boolean);
  for (let n = words.length; n >= 1; n--) {
    const hit = known.get(words.slice(0, n).join(" "));
    if (hit) return hit;
  }
  return "";
}

/** A website's host without "www.", for telling a chain's own site from a branch's ("planetfitness.com"). */
export function siteHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export interface IconChoice {
  /** The icon's gym_photos id, and how many pixels across it is (gymEnrich.ts siteIcon). */
  id: string;
  px: number;
  website: string;
}

/**
 * A chain's own website and logo from its branches: the site host most of its branches link to (two at least), and
 * the sharpest icon read from that site. A branch with a site of its own (a franchise's local page) never gives the
 * chain its logo.
 */
export function pickChainSite(websites: readonly string[], icons: readonly IconChoice[]): { website: string; icon: string; px: number } {
  const counts = new Map<string, number>();
  const origins = new Map<string, string>();
  for (const w of websites) {
    const h = siteHost(w);
    if (!h) continue;
    counts.set(h, (counts.get(h) ?? 0) + 1);
    if (!origins.has(h)) origins.set(h, `${new URL(w).origin}/`);
  }
  const [host, n] = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? ["", 0];
  if (!host || n < 2) return { website: "", icon: "", px: 0 };
  const best = icons.filter((i) => siteHost(i.website) === host).sort((a, b) => b.px - a.px || a.id.localeCompare(b.id))[0];
  return { website: origins.get(host) ?? "", icon: best?.id ?? "", px: best?.px ?? 0 };
}
