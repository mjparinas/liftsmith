import { APP_PATH, SITE_URL } from "./site";
import { EQUIPMENT, type Bar, type Equipment, type Gym, type PlateStock } from "./types";

// Sharing a gym (Melvin, 2026-11-12: "share and find gym setups"; docs/decisions/gym-sharing.md).
// Typing in a gym's kit is the slowest part of setting up, so a lifter who already did it can send
// it: the gym's name, unit, equipment, bars, plates, dumbbells, kettlebells and machine step travel
// in the link itself, like a routine link. Never its place (where it is) or machine settings
// (those are the sender's own seat heights). Nothing is uploaded, so it works signed out and offline.

const SHARE_VERSION = "g1";
export const GYM_NAME_MAX = 40;
const MAX_BARS = 12;
const MAX_PLATES = 24;
const MAX_WEIGHTS = 120;

/** What a shared gym carries: a gym without its id, place, settings or timestamp. */
export type GymKit = Pick<Gym, "name" | "unit" | "equipment" | "bars" | "plates" | "dumbbells" | "kettlebells" | "machineStep">;

function b64urlOut(text: string): string {
  let bin = "";
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlIn(code: string): string | null {
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

const num = (x: unknown, min: number, max: number): number | null =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max ? Math.round(x * 100) / 100 : null;

const cleanName = (s: unknown) =>
  typeof s === "string"
    ? s
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, GYM_NAME_MAX)
    : "";

const weights = (list: unknown): number[] =>
  Array.isArray(list)
    ? [...new Set(list.map((w) => num(w, 0.1, 500)).filter((w): w is number => w !== null))].sort((a, b) => a - b).slice(0, MAX_WEIGHTS)
    : [];

/** The kit a gym shares: everything except where it is and the lifter's own machine settings. */
export const kitOf = (g: Gym): GymKit => ({
  name: g.name,
  unit: g.unit,
  equipment: g.equipment,
  bars: g.bars,
  plates: g.plates,
  dumbbells: g.dumbbells,
  kettlebells: g.kettlebells,
  machineStep: g.machineStep,
});

/** The link code for a gym: `g1~<base64url of a compact JSON>`. */
export function encodeGym(g: GymKit): string {
  const body = {
    n: cleanName(g.name),
    u: g.unit,
    e: g.equipment.filter((e) => (EQUIPMENT as readonly string[]).includes(e)),
    b: g.bars.slice(0, MAX_BARS).map((b) => [b.name.slice(0, GYM_NAME_MAX), b.weight]),
    p: g.plates.slice(0, MAX_PLATES).map((p) => [p.weight, p.count]),
    d: g.dumbbells.slice(0, MAX_WEIGHTS),
    k: g.kettlebells.slice(0, MAX_WEIGHTS),
    m: g.machineStep,
  };
  return `${SHARE_VERSION}~${b64urlOut(JSON.stringify(body))}`;
}

/**
 * Reads a gym code. Unknown equipment and out-of-range numbers are dropped, so a link from a newer
 * app still opens. Null when it isn't a gym code at all.
 */
export function decodeGym(code: string): GymKit | null {
  let raw = code.trim();
  if (!raw.includes("~")) {
    try {
      raw = decodeURIComponent(raw);
    } catch {
      return null;
    }
  }
  const [v, data = ""] = raw.split("~");
  if (v !== SHARE_VERSION || data.length > 20_000) return null;
  const json = b64urlIn(data);
  if (!json) return null;
  let o: unknown;
  try {
    o = JSON.parse(json);
  } catch {
    return null;
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const r = o as Record<string, unknown>;
  if (r.u !== "kg" && r.u !== "lb") return null;
  const equipment = Array.isArray(r.e)
    ? [...new Set(r.e.filter((e): e is Equipment => typeof e === "string" && (EQUIPMENT as readonly string[]).includes(e)))]
    : [];
  const bars: Bar[] = [];
  if (Array.isArray(r.b))
    r.b.slice(0, MAX_BARS).forEach((b: unknown, i) => {
      if (!Array.isArray(b)) return;
      const name = cleanName(b[0]);
      const weight = num(b[1], 0, 100);
      if (name && weight !== null) bars.push({ id: `bar-${i + 1}`, name, weight });
    });
  const plates: PlateStock[] = [];
  if (Array.isArray(r.p))
    for (const p of r.p.slice(0, MAX_PLATES) as unknown[]) {
      if (!Array.isArray(p)) continue;
      const weight = num(p[0], 0.1, 100);
      const count = num(p[1], 0, 100);
      if (weight !== null && count !== null && !plates.some((x) => x.weight === weight)) plates.push({ weight, count: Math.round(count) });
    }
  plates.sort((a, b) => b.weight - a.weight);
  const machineStep = num(r.m, 0.5, 50) ?? (r.u === "kg" ? 5 : 10);
  return {
    name: cleanName(r.n),
    unit: r.u,
    equipment,
    bars,
    plates,
    dumbbells: weights(r.d),
    kettlebells: weights(r.k),
    machineStep,
  };
}

export function gymUrl(code: string, base = SITE_URL): string {
  return `${base.replace(/\/$/, "")}${APP_PATH}#/gymlink/${code}`;
}

/** The code in a pasted gym link (or a bare code), or null when it isn't one. */
export function gymCodeFromLink(text: string): string | null {
  const s = text.trim();
  const m = /#\/gymlink\/([^\s]+)/.exec(s);
  const code = m ? m[1]! : s;
  return decodeGym(code) ? code : null;
}

const sameList = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** True when a gym already has this kit (same unit, equipment, plates, bars and weights), whatever its name. */
export function sameKit(g: Gym, k: GymKit): boolean {
  const eq = (a: readonly string[], b: readonly string[]) => [...new Set(a)].sort().join() === [...new Set(b)].sort().join();
  const plates = (list: readonly PlateStock[]) =>
    [...list]
      .filter((p) => p.count > 0)
      .sort((x, y) => y.weight - x.weight)
      .map((p) => `${p.weight}x${p.count}`)
      .join();
  return (
    g.unit === k.unit &&
    eq(g.equipment, k.equipment) &&
    plates(g.plates) === plates(k.plates) &&
    sameList(
      g.bars.map((b) => b.weight),
      k.bars.map((b) => b.weight),
    ) &&
    sameList(
      [...g.dumbbells].sort((a, b) => a - b),
      [...k.dumbbells].sort((a, b) => a - b),
    ) &&
    sameList(
      [...g.kettlebells].sort((a, b) => a - b),
      [...k.kettlebells].sort((a, b) => a - b),
    )
  );
}
