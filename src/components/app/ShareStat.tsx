"use client";

// A small share icon for one stat: an estimated max, a heaviest set, a best for some rep count, a recent personal
// best (Melvin, 2026-11-27: "for those 1rm, heaviest set, or other achievements … a subtle share button on each
// of them"). It opens the one share sheet (ShareSheet.tsx) with that stat's card, which carries the logo, the
// website (or the lifter's invite link) and the app's look. Muted and 44 px to tap, beside the stat, never in
// place of a row's own button. The card is built only when it's tapped, so long lists draw nothing extra.
// Pure web code: the image goes out through the native share sheet on Android and iOS, Web Share or a download
// on the web (shareCanvas).
import { useState } from "react";

import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import type { Shareable, ShareContext } from "@/lib/shareCards";

import { useGame } from "./Achievements";
import { Icon } from "./icons";
import { ShareSheet, useShareContext } from "./ShareSheet";

export function ShareStat({
  label,
  items,
  className = "",
}: {
  /** What's shared, for the button's spoken name ("Share Bench press max"). */
  label: string;
  items: (ctx: ShareContext) => Shareable[];
  className?: string;
}) {
  const g = useGame();
  const ctx = useShareContext(g);
  const [open, setOpen] = useState<Shareable[] | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic("tick");
          setOpen(items(ctx));
        }}
        aria-label={t("card.shareBadge", { name: label })}
        aria-haspopup="dialog"
        data-testid="share-stat"
        className={`press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-faint hover:text-ink ${className}`}
      >
        <Icon name="share" size={18} />
      </button>
      {open && <ShareSheet open onClose={() => setOpen(null)} items={open} />}
    </>
  );
}
