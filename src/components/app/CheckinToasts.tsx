"use client";

// Friends' check-ins (Check in on Today, Melvin 2026-11-14: "when they open the app, a permanent but dismisable toast
// message"): each one stays at the top of every screen (in the page, not over it), not during a workout, until the lifter closes it with ✕.
// Closing it here closes it on their other devices too (src/lib/buddy.ts). A tap on the words opens the friend.
import { checkinText, dismissCheckin, useCheckins } from "@/lib/buddy";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";

import { Avatar } from "./AvatarFace";
import { ago } from "./format";
import { go } from "./router";

/** How many show at once; the rest wait behind them. */
const SHOWN = 2;

export function CheckinToasts({ hidden }: { hidden: boolean }) {
  const checkins = useCheckins((s) => s.checkins);
  if (hidden || !checkins.length) return null;
  return (
    <div className="flex flex-col gap-2 pt-3" data-testid="checkin-toasts">
      {checkins.slice(0, SHOWN).map((c) => (
        <div key={c.id} role="status" className="toast animate-rise flex w-full items-center gap-2 !rounded-2xl py-1.5 pl-3 pr-1">
          <button
            type="button"
            onClick={() => go("person", c.handle)}
            className="press flex min-h-11 min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <Avatar name={c.name} avatar={c.avatar} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-semibold">{checkinText(c)}</span>
              <span className="block text-xs text-muted">{ago(c.at)}</span>
            </span>
          </button>
          <button
            type="button"
            aria-label={t("x.dismiss")}
            onClick={() => {
              haptic("tick");
              dismissCheckin(c.id);
            }}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:text-ink"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
