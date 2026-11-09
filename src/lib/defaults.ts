import { EQUIPMENT, type Equipment, type Gym, type Profile, type Unit } from "./types";

export const PLATE_SETS: Record<Unit, { weight: number; count: number }[]> = {
  kg: [
    { weight: 25, count: 4 },
    { weight: 20, count: 4 },
    { weight: 15, count: 2 },
    { weight: 10, count: 4 },
    { weight: 5, count: 4 },
    { weight: 2.5, count: 4 },
    { weight: 1.25, count: 2 },
  ],
  lb: [
    { weight: 45, count: 8 },
    { weight: 35, count: 2 },
    { weight: 25, count: 4 },
    { weight: 10, count: 4 },
    { weight: 5, count: 4 },
    { weight: 2.5, count: 2 },
  ],
};

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

export function defaultBars(unit: Unit) {
  return unit === "kg"
    ? [
        { id: "olympic", name: "Olympic bar", weight: 20 },
        { id: "ez", name: "EZ curl bar", weight: 10 },
        { id: "trap", name: "Trap bar", weight: 25 },
      ]
    : [
        { id: "olympic", name: "Olympic bar", weight: 45 },
        { id: "ez", name: "EZ curl bar", weight: 25 },
        { id: "trap", name: "Trap bar", weight: 55 },
      ];
}

export type GymPreset = "commercial" | "home" | "dumbbells" | "bodyweight";

export const PRESETS: { id: GymPreset; name: string; blurb: string; equipment: Equipment[] }[] = [
  { id: "commercial", name: "Commercial gym", blurb: "Racks, machines and cables", equipment: EQUIPMENT.filter((e) => e !== "rings" && e !== "abWheel") },
  { id: "home", name: "Home gym", blurb: "Rack, barbell, bench, dumbbells", equipment: ["barbell", "dumbbells", "bench", "inclineBench", "rack", "pullupBar", "bands", "box"] },
  { id: "dumbbells", name: "Dumbbells only", blurb: "A set of dumbbells and a bench", equipment: ["dumbbells", "bench", "inclineBench"] },
  { id: "bodyweight", name: "Bodyweight", blurb: "Hotel rooms, parks, travel", equipment: [] },
];

export function makeGym(preset: GymPreset, unit: Unit, id = crypto.randomUUID()): Gym {
  const p = PRESETS.find((x) => x.id === preset)!;
  const home = preset === "home" || preset === "dumbbells";
  return {
    id,
    name: p.name,
    unit,
    equipment: [...p.equipment],
    bars: defaultBars(unit),
    plates: PLATE_SETS[unit].map((x) => ({ ...x })),
    dumbbells: unit === "kg" ? range(2, home ? 30 : 50, 2) : range(5, home ? 60 : 120, 5),
    kettlebells: unit === "kg" ? [8, 12, 16, 20, 24, 28, 32] : [15, 25, 35, 45, 55, 70],
    machineStep: unit === "kg" ? 5 : 10,
    updatedAt: Date.now(),
  };
}

/**
 * Switches a gym's plates between kg and lb. Plates, bars, dumbbells and kettlebells are real objects
 * that don't convert (a 20 kg plate isn't a 45 lb plate), so they're replaced with the standard kit in
 * the new unit; equipment, name and place are kept. The lifter can then edit the kit as usual.
 */
export function switchGymUnit(gym: Gym, unit: Unit): Gym {
  if (gym.unit === unit) return gym;
  const heaviest = gym.dumbbells.at(-1) ?? 0;
  const big = gym.unit === "kg" ? heaviest > 35 : heaviest > 75;
  const kit = makeGym(big ? "commercial" : "home", unit, gym.id);
  return { ...gym, unit, bars: kit.bars, plates: kit.plates, dumbbells: gym.dumbbells.length ? kit.dumbbells : [], kettlebells: gym.kettlebells.length ? kit.kettlebells : [], machineStep: kit.machineStep, updatedAt: Date.now() };
}

export function defaultProfile(now = Date.now()): Profile {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // Blocks start on a Monday.
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return {
    name: "",
    goal: "muscle",
    experience: "intermediate",
    daysPerWeek: 4,
    unit: "kg",
    bodyweight: 80,
    minutes: 45,
    variability: "balanced",
    activeGymId: "",
    blockStart: d.getTime(),
    blockWeeks: 4,
    restSounds: true,
    onboarded: false,
    updatedAt: now,
  };
}
