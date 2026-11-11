"use client";

import { useId } from "react";

import { num, t } from "@/lib/i18n";
import { bandOf, BANDS, type Band } from "@/lib/recovery";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";

// An original front-and-back body map. Each muscle is drawn once for the left half and mirrored.
// Colours come from the recovery bands, and every region has a title for screen readers. Colour is
// never the only cue (WCAG 1.4.1): Recovering muscles carry dots and Fatigued ones diagonal hatching,
// and the legend shows the same marks, so the map reads with any kind of colour blindness, in
// greyscale and in forced-colour modes.

/** The pattern drawn over each band, if any. */
export const BAND_MARK: Record<Band, "dots" | "hatch" | null> = { fresh: null, ready: null, recovering: "dots", fatigued: "hatch" };

function Marks({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={`${id}-dots`} width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.3" fill="var(--color-bg)" fillOpacity={0.75} />
      </pattern>
      <pattern id={`${id}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="2" height="5" fill="var(--color-bg)" fillOpacity={0.7} />
      </pattern>
    </defs>
  );
}

type Shape = { m: Muscle; d: string };

const FRONT: Shape[] = [
  { m: "frontDelts", d: "M64,70 Q50,70 44,84 Q46,94 52,96 Q60,86 70,80 Z" },
  { m: "sideDelts", d: "M46,72 Q36,78 36,96 L44,98 Q42,84 52,74 Z" },
  { m: "chest", d: "M98,74 L70,76 Q60,88 62,104 Q78,118 98,112 Z" },
  { m: "biceps", d: "M42,102 Q36,124 40,150 L54,150 Q60,124 56,102 Z" },
  { m: "forearms", d: "M38,158 Q30,190 34,226 L46,226 Q56,190 54,158 Z" },
  { m: "abs", d: "M97,118 L84,118 Q82,160 86,196 L97,198 Z" },
  { m: "obliques", d: "M81,116 L66,112 Q62,150 72,192 L83,196 Q78,150 81,116 Z" },
  { m: "quads", d: "M90,230 L70,226 Q60,270 68,320 L88,322 Q94,280 90,230 Z" },
  { m: "adductors", d: "M97,234 L93,232 Q96,262 92,296 Q99,268 97,234 Z" },
  { m: "calves", d: "M70,338 Q63,368 70,398 L84,398 Q90,368 88,338 Z" },
];

const BACK: Shape[] = [
  { m: "traps", d: "M98,50 L88,56 Q74,64 62,72 Q80,78 98,100 Z" },
  { m: "rearDelts", d: "M60,72 Q42,74 38,94 Q50,96 64,86 Z" },
  { m: "upperBack", d: "M97,104 L72,82 Q62,98 70,122 L97,132 Z" },
  { m: "lats", d: "M68,126 Q60,140 66,172 L88,190 L97,164 L97,136 Z" },
  { m: "triceps", d: "M40,100 Q34,124 40,150 L54,150 Q60,124 56,100 Z" },
  { m: "forearms", d: "M38,158 Q30,190 34,226 L46,226 Q56,190 54,158 Z" },
  { m: "lowerBack", d: "M97,168 L90,190 L86,204 L97,206 Z" },
  { m: "glutes", d: "M97,210 L72,208 Q62,228 70,250 Q86,258 97,250 Z" },
  { m: "hamstrings", d: "M95,258 L70,256 Q62,292 70,324 L90,324 Q98,292 95,258 Z" },
  { m: "calves", d: "M70,334 Q58,358 70,388 L86,388 Q96,358 88,334 Z" },
];

const SILHOUETTE =
  "M100,8 C88,8 82,18 82,30 C82,42 88,50 92,52 L92,60 Q70,62 56,68 Q36,72 32,96 Q28,128 34,156 Q26,190 30,232 L48,232 Q58,192 58,160 Q62,140 62,118 Q60,150 64,196 Q58,212 60,232 Q56,280 64,326 Q58,362 66,404 L88,404 Q94,364 92,330 Q96,290 98,250 L100,240 L102,250 Q104,290 108,330 Q106,364 112,404 L134,404 Q142,362 136,326 Q144,280 140,232 Q142,212 136,196 Q140,150 138,118 Q138,140 142,160 Q142,192 152,232 L170,232 Q174,190 166,156 Q172,128 168,96 Q164,72 144,68 Q130,62 108,60 L108,52 C112,50 118,42 118,30 C118,18 112,8 100,8 Z";

function Figure({
  shapes,
  rec,
  label,
  focus,
  picked,
}: {
  shapes: Shape[];
  rec: Record<Muscle, number>;
  label: string;
  focus?: Muscle[];
  picked?: Muscle | null;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <figure className="flex flex-1 flex-col items-center">
      <svg
        viewBox="20 0 160 412"
        className="keep-colours h-auto w-full max-w-[180px]"
        role="img"
        aria-label={t("map.label", { side: label })}
      >
        <Marks id={id} />
        <path d={SILHOUETTE} fill="var(--color-raised)" stroke="var(--color-line)" strokeWidth={1.2} />
        {[1, -1].map((side) => (
          <g key={side} transform={side === -1 ? "translate(200,0) scale(-1,1)" : undefined}>
            {shapes.map((s) => {
              const r = rec[s.m];
              const b = bandOf(r);
              const hot = picked ? picked === s.m : focus?.includes(s.m);
              // a picked muscle gets a thick outline and the rest fade back, so even a small one is obvious
              const faded = !!picked && !hot;
              const mark = BAND_MARK[b.band];
              return (
                <g key={s.m}>
                  <path
                    d={s.d}
                    fill={b.colour}
                    fillOpacity={hot ? 1 : faded ? 0.22 : 0.82}
                    stroke={hot ? "var(--color-ink)" : "var(--color-bg)"}
                    strokeWidth={hot ? (picked ? 3 : 1.6) : 1}
                    data-picked={picked === s.m || undefined}
                  >
                    <title>{t("map.muscle", { muscle: MUSCLE_LABEL[s.m], pct: r, band: b.label })}</title>
                  </path>
                  {mark && (
                    <path
                      d={s.d}
                      fill={`url(#${id}-${mark})`}
                      opacity={faded ? 0.3 : 1}
                      pointerEvents="none"
                      aria-hidden="true"
                      data-mark={mark}
                    />
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-xs uppercase tracking-wider text-faint">{label}</figcaption>
    </figure>
  );
}

export function BodyMap({
  rec,
  focus,
  picked,
  compact,
}: {
  rec: Record<Muscle, number>;
  focus?: Muscle[];
  /** The muscle the lifter tapped: outlined, with every other muscle faded back. */
  picked?: Muscle | null;
  compact?: boolean;
}) {
  return (
    <div>
      <div className={`flex gap-2 ${compact ? "max-w-[300px]" : "max-w-[380px]"} mx-auto`}>
        <Figure shapes={FRONT} rec={rec} label={t("map.front")} focus={focus} picked={picked} />
        <Figure shapes={BACK} rec={rec} label={t("map.back")} focus={focus} picked={picked} />
      </div>
      <Legend />
    </div>
  );
}

/** A legend swatch: the band's colour with the same mark the map uses. */
export function Swatch({ band, colour, hatchOnly }: { band: Band; colour: string; hatchOnly?: boolean }) {
  const id = useId().replace(/:/g, "");
  // the 3D map marks only Fatigued muscles (bright cross lines), so its legend does too
  const mark = hatchOnly ? (band === "fatigued" ? "hatch" : null) : BAND_MARK[band];
  return (
    <svg viewBox="0 0 12 12" className="keep-colours h-3.5 w-3.5 shrink-0" aria-hidden="true">
      {mark && <Marks id={id} />}
      <circle cx="6" cy="6" r="6" fill={colour} />
      {mark && <circle cx="6" cy="6" r="6" fill={`url(#${id}-${mark})`} data-mark={mark} />}
    </svg>
  );
}

export function Legend({ hatchOnly }: { hatchOnly?: boolean } = {}) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4" aria-label={t("map.legend")}>
      {BANDS.map((b) => (
        <li key={b.band} className="flex flex-wrap items-center gap-x-2">
          <Swatch band={b.band} colour={b.colour} hatchOnly={hatchOnly} />
          <span className="text-ink">{b.label}</span>
          <span className="text-faint num">
            {b.min === 0 ? `<${num(0.4, { style: "percent" })}` : `${num(b.min / 100, { style: "percent" })}+`}
          </span>
        </li>
      ))}
    </ul>
  );
}
