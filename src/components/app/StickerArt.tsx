"use client";

// The gym stickers in coach chat (src/lib/stickers.ts): our own kettlebell mascot or one of our icons on a tile tinted
// with one of the supporting hues, and a short caption from the language catalogues (`trn.stk.<id>`). Drawn, never an
// image, so they follow the theme, light mode and the accent, and weigh nothing.
import { t } from "@/lib/i18n";
import type { StickerId } from "@/lib/stickers";

import { Icon, type IconName } from "./icons";
import { Mascot } from "./Mascot";

type Art =
  { mascot: "happy" | "cheer" | "sleepy" | "curious"; tint: string } | { icon: IconName; tint: string } | { path: string; tint: string };

// A water bottle and a shaker, in the same 24-unit grid and 2 px stroke as icons.tsx.
const WATER = "M12 3c3 4.2 6 7.6 6 11.2a6 6 0 0 1-12 0C6 10.6 9 7.2 12 3zM9.5 15a2.5 2.5 0 0 0 2.5 2.5";
const SHAKER = "M8 3h8l-.8 3H8.8zM8.6 6h6.8l-1.2 15H9.8zM9.1 11h5.8";

const ART: Record<StickerId, Art> = {
  pr: { icon: "trophy", tint: "var(--color-ember)" },
  letsgo: { icon: "bolt", tint: "var(--color-accent)" },
  light: { icon: "dumbbell", tint: "var(--color-violet)" },
  fire: { icon: "flame", tint: "var(--color-ember)" },
  proud: { mascot: "cheer", tint: "var(--color-mint)" },
  morning: { mascot: "happy", tint: "var(--color-cyan)" },
  thinking: { mascot: "curious", tint: "var(--color-violet)" },
  rest: { mascot: "sleepy", tint: "var(--color-cyan)" },
  water: { path: WATER, tint: "var(--color-cyan)" },
  protein: { path: SHAKER, tint: "var(--color-mint)" },
  form: { icon: "camera", tint: "var(--color-accent)" },
  deload: { icon: "leaf", tint: "var(--color-mint)" },
};

/** One sticker, `size` px square. Spoken as its caption. `bare` leaves the caption off the tile (the picker writes it
 * underneath, where long captions can wrap). */
export function StickerArt({ id, size = 112, bare = false }: { id: StickerId; size?: number; bare?: boolean }) {
  const art = ART[id];
  const caption = t(`trn.stk.${id}`);
  const mark = Math.round(size * 0.5);
  return (
    <span
      role={bare ? undefined : "img"}
      aria-label={bare ? undefined : caption}
      aria-hidden={bare || undefined}
      className={`relative inline-flex shrink-0 flex-col items-center rounded-[28%] border border-line/60 ${bare ? "justify-center" : "justify-start"}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${art.tint} 34%, transparent), color-mix(in srgb, ${art.tint} 10%, var(--color-surface)) 70%)`,
        color: art.tint,
      }}
    >
      <span className={`flex items-center justify-center ${bare ? "" : "mt-[9%]"}`} style={{ height: mark, width: mark }}>
        {"mascot" in art ? (
          <Mascot mood={art.mascot} size={mark} />
        ) : "icon" in art ? (
          <Icon name={art.icon} size={mark} strokeWidth={2.2} />
        ) : (
          <svg
            width={mark}
            height={mark}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d={art.path} />
          </svg>
        )}
      </span>
      {!bare && (
        <span
          aria-hidden
          className="absolute inset-x-1.5 bottom-[9%] truncate rounded-full bg-bg/85 px-1.5 py-0.5 text-center text-xs font-extrabold leading-tight text-ink"
        >
          {caption}
        </span>
      )}
    </span>
  );
}
