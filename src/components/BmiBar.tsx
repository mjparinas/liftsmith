"use client";

// Where a BMI sits among the standard bands: a bar in four calm colours with a marker on the
// lifter's value (Melvin, 2026-11-11: "show a graph of where people are, or at least colour code the
// label"). Shared by the TDEE results (app and public calculator) and the BMI sheet on Body › Health.
// The colours run cool to warm (cyan, green, amber, ember) and never red: BMI is a rough guide, not
// an alarm. Colour is never the only cue: the band's name is written out, the cut-offs are under the
// bar, and the whole figure has a text label for screen readers.
import { num, t } from "@/lib/i18n";
import { BMI_CUTS, bmiBand, bmiCategory, type BmiCategory } from "@/lib/tdee";

/** The bar runs from 15 to 40; values past either end sit at the end. */
const LO = 15;
const HI = 40;
const pct = (v: number) => ((Math.min(HI, Math.max(LO, v)) - LO) / (HI - LO)) * 100;

/** One token per band, so light mode, colour-blind safe colours and more contrast all follow. */
export const BMI_COLOUR: Record<BmiCategory, string> = {
  under: "var(--color-cyan)",
  healthy: "var(--color-good)",
  over: "var(--color-warn)",
  obese: "var(--color-ember)",
};

const SEGMENTS: { cat: BmiCategory; from: number; to: number }[] = [
  { cat: "under", from: LO, to: BMI_CUTS[0] },
  { cat: "healthy", from: BMI_CUTS[0], to: BMI_CUTS[1] },
  { cat: "over", from: BMI_CUTS[1], to: BMI_CUTS[2] },
  { cat: "obese", from: BMI_CUTS[2], to: HI },
];

export function BmiBar({ bmi, label = true, note = false }: { bmi: number; label?: boolean; note?: boolean }) {
  const cat = bmiCategory(bmi);
  const band = bmiBand(bmi);
  const at = pct(bmi);
  return (
    <div data-testid="bmi-bar" data-band={cat}>
      {label && (
        <div className="text-sm font-semibold" style={{ color: BMI_COLOUR[cat] }} data-testid="bmi-band">
          {band}
        </div>
      )}
      <div role="img" aria-label={t("bmi.where", { bmi: num(bmi), band })} className="keep-colours relative mt-2 pt-3">
        {/* The marker: a small pointer above the bar and a line through it, in the ink colour. */}
        <span aria-hidden className="absolute top-0 -translate-x-1/2" style={{ left: `${at}%` }}>
          <svg width="12" height="9" viewBox="0 0 12 9" className="block">
            <path d="M0 0h12L6 8z" fill="var(--color-ink)" />
          </svg>
        </span>
        <div aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {SEGMENTS.map((s) => (
            <span
              key={s.cat}
              className="h-full"
              style={{
                width: `${((s.to - s.from) / (HI - LO)) * 100}%`,
                background: BMI_COLOUR[s.cat],
                opacity: s.cat === cat ? 1 : 0.45,
              }}
            />
          ))}
        </div>
        <span
          aria-hidden
          className="absolute top-2.5 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-ink ring-2 ring-surface"
          style={{ left: `${at}%` }}
        />
        {/* The cut-offs under the bar, each under its own boundary. */}
        <div aria-hidden className="num relative mt-1 h-4 text-[0.6875rem] text-faint">
          {BMI_CUTS.map((c) => (
            <span key={c} className="absolute -translate-x-1/2" style={{ left: `${pct(c)}%` }}>
              {num(c)}
            </span>
          ))}
        </div>
      </div>
      {note && <p className="mt-1 text-xs text-faint">{t("bmi.note")}</p>}
    </div>
  );
}
