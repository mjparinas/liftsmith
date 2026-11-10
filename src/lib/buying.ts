import { available, EXERCISES } from "./exercises";
import { t } from "./i18n";
import { smallestJump } from "./plates";
import { sessionsOf } from "./progression";
import { EQUIPMENT, EQUIPMENT_LABEL, MUSCLES, type AppEvent, type Equipment, type Gym, type Muscle, type PlateStock } from "./types";
import { fmtNum, fromKg } from "./units";

// What to buy next (Melvin picked it, 2026-11-09). Uses the plate solver and the exercise library to
// say which purchase helps this lifter most: a pair of small plates that makes finer jumps possible,
// more plates before a lift outgrows the set, or the piece of home gym equipment that unlocks the
// most new exercises and muscles. Advice only: no shop links, no sponsored picks (no ads, ever).

export interface PlateTip {
  /** Plate weight in the gym's unit. */
  weight: number;
  /** Plates to buy (always a pair). */
  count: 2;
  /** Why, in plain words. */
  text: string;
  /** Extra weights you could load in your working range. */
  newLoads: number;
  /** The smallest jump before and after, in the gym's unit. */
  jumpFrom: number;
  jumpTo: number;
  /** It lifts the most the plates can load past what the lifter is close to. */
  room: boolean;
}

const CANDIDATES = { kg: [0.5, 1.25, 2.5, 5, 10, 15, 20, 25], lb: [1, 2.5, 5, 10, 25, 35, 45] } as const;

/** Distinct totals the plates can make on this bar between `lo` and `hi` (gym unit). */
export function loadableTotals(bar: number, plates: readonly PlateStock[], lo: number, hi: number): number[] {
  // Every per-side sum the pairs can make (in hundredths), then the totals in range.
  const maxSide = Math.round(((hi - bar) / 2) * 100);
  let sums = new Set<number>([0]);
  for (const p of plates) {
    const w = Math.round(p.weight * 100);
    const pairs = Math.floor(p.count / 2);
    if (w <= 0 || pairs <= 0) continue;
    const next = new Set(sums);
    for (const s of sums) for (let k = 1; k <= pairs && s + w * k <= maxSide; k++) next.add(s + w * k);
    sums = next;
  }
  return [...sums]
    .map((s) => (Math.round(bar * 100) + s * 2) / 100)
    .filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9)
    .sort((a, b) => a - b);
}

function mainBar(gym: Gym): number {
  return (gym.bars.find((b) => b.id === "olympic") ?? gym.bars[0])?.weight ?? (gym.unit === "kg" ? 20 : 45);
}

/** The heaviest barbell weight the lifter works with (kg), from their recent sessions. */
export function heaviestBarbell(events: readonly AppEvent[]): number {
  let top = 0;
  for (const ex of EXERCISES) {
    if (ex.load !== "barbell") continue;
    const last = sessionsOf(events, ex.id)[0];
    if (last) top = Math.max(top, ...last.map((s) => s.weight));
  }
  return top;
}

function withPair(plates: readonly PlateStock[], w: number): PlateStock[] {
  const has = plates.find((p) => Math.abs(p.weight - w) < 1e-9);
  return has ? plates.map((p) => (p === has ? { ...p, count: p.count + 2 } : p)) : [...plates, { weight: w, count: 2 }];
}

/** Plate pairs worth buying, best first (at most three). */
export function plateTips(gym: Gym, events: readonly AppEvent[]): PlateTip[] {
  if (!gym.equipment.includes("barbell") || !gym.plates.length) return [];
  const u = gym.unit;
  const bar = mainBar(gym);
  const top = fromKg(heaviestBarbell(events), u);
  // Working range: the bar up to a bit past the heaviest recent set (room to progress).
  const hi = Math.max(bar + (u === "kg" ? 40 : 90), top * 1.25);
  const before = loadableTotals(bar, gym.plates, bar, hi);
  const jump = smallestJump(gym.plates);
  const maxNow = bar + 2 * gym.plates.reduce((s, p) => s + p.weight * Math.floor(p.count / 2), 0);
  const tips: PlateTip[] = [];
  for (const w of CANDIDATES[u]) {
    const next = withPair(gym.plates, w);
    const after = loadableTotals(bar, next, bar, hi);
    const gained = after.length - before.length;
    const jumpTo = smallestJump(next);
    if (gained <= 0 && jumpTo >= jump) continue;
    const parts: string[] = [];
    const room = top * 1.1 > maxNow && w >= (u === "kg" ? 10 : 25);
    if (jumpTo < jump) parts.push(t("buy.jumps", { to: `${fmtNum(jumpTo)} ${u}`, from: `${fmtNum(jump)} ${u}` }));
    if (gained > 0) parts.push(t("buy.more", { count: gained, hi: `${fmtNum(Math.round(hi))} ${u}` }));
    if (room) parts.push(t("buy.room", { max: `${fmtNum(maxNow)} ${u}` }));
    tips.push({
      weight: w,
      count: 2,
      text: t("buy.pair", { w: `${fmtNum(w)} ${u}`, why: parts.join(t("buy.sep")) }),
      newLoads: gained,
      jumpFrom: jump,
      jumpTo,
      room,
    });
  }
  // Running out of plates matters most, then finer jumps, then sheer variety.
  // A 2.5 kg (5 lb) total jump suits most lifts; much finer only helps once you're already there.
  const ideal = u === "kg" ? 2.5 : 5;
  const score = (p: PlateTip) =>
    (p.room ? 1000 : 0) +
    (p.jumpTo < p.jumpFrom ? 100 + (p.jumpFrom - p.jumpTo) * 10 - 40 * Math.abs(Math.log2(p.jumpTo / ideal)) : 0) +
    p.newLoads;
  return tips.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

export interface EquipmentTip {
  item: Equipment;
  label: string;
  /** Exercises it unlocks with what's already at this gym. */
  unlocks: number;
  /** Muscles that get their first exercise with a load (beyond bodyweight). */
  newMuscles: Muscle[];
  text: string;
}

/** Equipment worth adding to this gym, best first (at most three). Machines are left out for home gyms. */
export function equipmentTips(gym: Gym): EquipmentTip[] {
  const have = new Set(available(gym.equipment).map((e) => e.id));
  const loaded = (ids: Set<string>) => new Set(EXERCISES.filter((e) => ids.has(e.id) && e.load !== "bodyweight").flatMap((e) => e.primary));
  const coveredNow = loaded(have);
  const big = new Set<Equipment>([
    "legPress",
    "legExtension",
    "legCurl",
    "chestPress",
    "pecDeck",
    "shoulderPress",
    "smith",
    "hackSquat",
    "calfMachine",
    "seatedRow",
    "latPulldown",
  ]);
  const out: EquipmentTip[] = [];
  for (const item of EQUIPMENT) {
    if (gym.equipment.includes(item) || big.has(item)) continue;
    const next = new Set(available([...gym.equipment, item]).map((e) => e.id));
    const unlocks = [...next].filter((id) => !have.has(id)).length;
    if (!unlocks) continue;
    const newMuscles = MUSCLES.filter((m) => loaded(next).has(m) && !coveredNow.has(m));
    const text = newMuscles.length
      ? t("buy.kitMuscles", { item: EQUIPMENT_LABEL[item], unlocks: t("buy.newEx", { count: unlocks }), count: newMuscles.length })
      : t("buy.kit", { item: EQUIPMENT_LABEL[item], count: unlocks });
    out.push({ item, label: EQUIPMENT_LABEL[item], unlocks, newMuscles, text });
  }
  return out.sort((a, b) => b.newMuscles.length * 4 + b.unlocks - (a.newMuscles.length * 4 + a.unlocks)).slice(0, 3);
}
