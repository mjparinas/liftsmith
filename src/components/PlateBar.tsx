"use client";
import { plateStyle, type Loading } from "@/lib/plates";
import type { Unit } from "@/lib/types";
import { fmtNum } from "@/lib/units";

// A barbell with the plates to load on each side, heaviest nearest the collar. The point is that
// nobody has to do plate maths between sets.

export function PlateBar({ loading, bar, unit, compact }: { loading: Loading; bar: number; unit: Unit; compact?: boolean }) {
  const plates = loading.perSide;
  const W = 360;
  const cy = 60;
  const collar = 118; // x where the left sleeve's collar sits
  let x = collar;
  const left = plates.map((w) => {
    const s = plateStyle(w, unit);
    x -= s.width + 1.5;
    return { w, s, x };
  });
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} 120`} className="w-full" role="img" aria-label={`Load ${plates.length ? plates.map(fmtNum).join(", ") : "no plates"} ${unit} on each side of a ${fmtNum(bar)} ${unit} bar`}>
        <defs>
          <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d1db" />
            <stop offset="0.5" stopColor="#8e99a6" />
            <stop offset="1" stopColor="#5e6873" />
          </linearGradient>
        </defs>
        {/* shaft */}
        <rect x={collar} y={cy - 3} width={W - collar * 2} height={6} rx={2} fill="url(#steel)" />
        <rect x={W / 2 - 34} y={cy - 3.5} width={68} height={7} rx={2} fill="#6f7a87" opacity={0.5} />
        {/* sleeves */}
        <rect x={6} y={cy - 6} width={collar - 6} height={12} rx={3} fill="url(#steel)" />
        <rect x={W - collar} y={cy - 6} width={collar - 6} height={12} rx={3} fill="url(#steel)" />
        <rect x={collar - 2} y={cy - 11} width={6} height={22} rx={2} fill="#aeb7c2" />
        <rect x={W - collar - 4} y={cy - 11} width={6} height={22} rx={2} fill="#aeb7c2" />
        {[false, true].map((mirror) => (
          <g key={String(mirror)} transform={mirror ? `translate(${W},0) scale(-1,1)` : undefined}>
            {left.map(({ w, s, x }, i) => (
              <g key={i}>
                <rect x={x} y={cy - s.height / 2} width={s.width} height={s.height} rx={2.5} fill={s.fill} stroke="#0a0d12" strokeWidth={1} />
                {!mirror && s.height > 48 && (
                  <text x={x + s.width / 2} y={cy + 3.5} fontSize={9} fontWeight={700} textAnchor="middle" fill={s.text} transform={`rotate(-90 ${x + s.width / 2} ${cy})`}>
                    {fmtNum(w)}
                  </text>
                )}
              </g>
            ))}
          </g>
        ))}
        {!compact && (
          <text x={W / 2} y={cy + 30} fontSize={11} textAnchor="middle" fill="#8a97a8">
            {`${fmtNum(bar)} ${unit} bar`}
          </text>
        )}
      </svg>
      <p className="text-center text-sm text-muted num">
        {plates.length ? (
          <>
            Each side: <span className="font-semibold text-ink">{plates.map(fmtNum).join(" + ")}</span> {unit}
          </>
        ) : (
          "Empty bar"
        )}
        {!loading.exact && <span className="ml-2 text-warn">nearest you can load</span>}
      </p>
    </div>
  );
}
