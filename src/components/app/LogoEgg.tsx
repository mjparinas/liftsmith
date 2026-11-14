"use client";

// The logo easter egg (eggs.ts): seven quick taps on the app logo open a card with the lifetime total in
// elephants, buses and friends. Sits in Settings' footer and the desktop sidebar. Hidden on purpose, so it's
// out of the Tab order and away from screen readers; the card itself is an ordinary sheet once it's open.
import { useRef, useState } from "react";

import { inUnits, logoTaps } from "@/lib/eggs";
import { num, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { fmtTonnage } from "@/lib/moments";
import { useApp } from "@/lib/store";

import { Sheet } from "./ui";

export function LogoEgg({ size = 32, className = "" }: { size?: number; className?: string }) {
  const taps = useRef<number[]>([]);
  const [open, setOpen] = useState(false);
  const tap = () => {
    const r = logoTaps(taps.current, Date.now());
    taps.current = r.taps;
    if (!r.open) return;
    haptic("celebrate");
    sound.badge();
    setOpen(true);
  };
  return (
    <>
      <button type="button" tabIndex={-1} aria-hidden onClick={tap} className={`press shrink-0 rounded-lg ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" width={size} height={size} className="block rounded-lg" style={{ width: size, height: size }} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("egg.title")}>
        <LifetimeUnits />
      </Sheet>
    </>
  );
}

function LifetimeUnits() {
  const total = useApp((s) => s.stats.totalVolume);
  const unit = useApp((s) => s.profile.unit);
  if (!(total > 0)) return <p className="text-muted">{t("egg.empty")}</p>;
  return (
    <div>
      <p className="text-muted">{t("egg.lead", { total: fmtTonnage(total, unit) })}</p>
      <ul className="mt-4 space-y-2">
        {/* Units too big to reach one tenth yet (a blue whale early on) wait until they do. */}
        {inUnits(total)
          .filter((u) => u.n > 0)
          .map((u) => (
            <li key={u.id} className="card flex items-center gap-3 px-4 py-3">
              <span aria-hidden className="text-2xl">
                {u.emoji}
              </span>
              <span className="font-semibold tabular-nums">
                {t(`egg.unit.${u.id}`, { count: u.n, n: num(u.n, { maximumFractionDigits: 1 }) })}
              </span>
            </li>
          ))}
      </ul>
      <p className="mt-4 text-center text-xs text-faint">{t("egg.note")}</p>
    </div>
  );
}
