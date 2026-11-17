// The "plates per side" chart on the plate calculator page: what a bar weighs with 1 to 8 plates on each side, the
// question people type as "3 plates", "2 plates and a 25" or "7 plates on each side" (docs/decisions/seo.md).
// Pounds assume a 45 lb bar and 45 lb plates; kilograms a 20 kg bar with 20 kg or 25 kg plates.

export const LB_BAR = 45;
export const KG_BAR = 20;

export interface PlateRow {
  /** Plates on each side. */
  n: number;
  lb: number;
  /** The same with a 25 lb plate added to each side. */
  lbPlus25: number;
  /** The same with a 10 lb plate added to each side. */
  lbPlus10: number;
  /** 20 kg plates on each side of a 20 kg bar. */
  kg20: number;
  /** 25 kg plates on each side of a 20 kg bar. */
  kg25: number;
}

/** Total on the bar with `n` plates of `plate` on each side, plus `extra` on each side. */
export const barTotal = (bar: number, plate: number, n: number, extra = 0) => bar + 2 * (plate * n + extra);

export const plateChart = (max = 8): PlateRow[] =>
  Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    return {
      n,
      lb: barTotal(LB_BAR, 45, n),
      lbPlus25: barTotal(LB_BAR, 45, n, 25),
      lbPlus10: barTotal(LB_BAR, 45, n, 10),
      kg20: barTotal(KG_BAR, 20, n),
      kg25: barTotal(KG_BAR, 25, n),
    };
  });

const kgOf = (lb: number) => Math.round(lb * 0.45359237);
const plates = (n: number) =>
  n === 1 ? "one 45 lb plate" : `${["", "", "two", "three", "four", "five", "six", "seven", "eight"][n]} 45 lb plates`;

/** The plate questions people search, answered from the chart. */
export function plateQuestions(): [string, string][] {
  const row = (n: number) => plateChart()[n - 1]!;
  return [
    [
      "How much is 3 plates?",
      `${row(3).lb} lb (about ${kgOf(row(3).lb)} kg): ${plates(3)} on each side of a ${LB_BAR} lb bar. "Plates" means 45s per side, so 1 plate is ${row(1).lb} lb, 2 plates ${row(2).lb} lb and 4 plates ${row(4).lb} lb.`,
    ],
    [
      "How much is 2 plates and a 25 on each side?",
      `${row(2).lbPlus25} lb (about ${kgOf(row(2).lbPlus25)} kg): a ${LB_BAR} lb bar with ${plates(2)} and a 25 on each side. With a 10 instead of the 25 it's ${row(2).lbPlus10} lb.`,
    ],
    [
      "How much is 7 plates on each side?",
      `${row(7).lb} lb (about ${kgOf(row(7).lb)} kg) on a ${LB_BAR} lb bar. In kilograms, 7 red 25 kg plates a side on a ${KG_BAR} kg bar is ${row(7).kg25} kg.`,
    ],
    [
      "How much is a plate in kg?",
      `A full-size bumper or competition plate is 20 kg (blue) or 25 kg (red). With a ${KG_BAR} kg bar, one 20 kg plate a side is ${row(1).kg20} kg and one 25 kg plate a side is ${row(1).kg25} kg.`,
    ],
  ];
}
