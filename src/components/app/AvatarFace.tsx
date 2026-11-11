"use client";

// The picture beside a name on Friends (Melvin, 2026-11-11: "unlock different avatars through locker but have a
// few default ones"). Each avatar is one of our own icons on a tinted disc, or the mascot; with none picked it's
// the name's first letter. The ids are in socialTypes.ts (AVATAR_IDS) and unlock in game.ts like other Locker items.
import type { AvatarId } from "@/lib/socialTypes";

import { Icon, type IconName } from "./icons";
import { Mascot } from "./Mascot";
import { HUE } from "./theme";

const FACES: Record<AvatarId, { icon: IconName | "mascot"; hue: string }> = {
  "av-dumbbell": { icon: "dumbbell", hue: HUE.accent },
  "av-bolt": { icon: "bolt", hue: HUE.cyan },
  "av-leaf": { icon: "leaf", hue: HUE.mint },
  "av-moon": { icon: "moon", hue: HUE.violet },
  "av-target": { icon: "target", hue: HUE.ember },
  "av-heart": { icon: "heart", hue: "var(--color-bad)" },
  "av-stretch": { icon: "stretch", hue: HUE.mint },
  "av-mascot": { icon: "mascot", hue: HUE.violet },
  "av-trophy": { icon: "trophy", hue: HUE.gold },
  "av-flame": { icon: "flame", hue: HUE.ember },
  "av-pro": { icon: "sparkle", hue: "var(--color-violet)" },
};

export const isAvatar = (id: string | undefined): id is AvatarId => !!id && id in FACES;

export function Avatar({ name, avatar, size = 40, dim = false }: { name: string; avatar?: string; size?: number; dim?: boolean }) {
  const face = isAvatar(avatar) ? FACES[avatar] : null;
  const letter = [...(name.trim() || "?")][0]!.toLocaleUpperCase();
  const tint = face?.hue ?? "var(--grad-a)";
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold ${dim ? "opacity-45" : ""}`}
      style={{
        width: size,
        height: size,
        background: face
          ? `color-mix(in srgb, ${tint} 24%, var(--color-surface))`
          : "linear-gradient(135deg, color-mix(in srgb, var(--grad-a) 30%, transparent), color-mix(in srgb, var(--grad-c) 30%, transparent))",
        boxShadow: face ? `inset 0 0 0 1.5px color-mix(in srgb, ${tint} 55%, transparent)` : undefined,
        color: "var(--color-ink)",
      }}
    >
      {face ? (
        face.icon === "mascot" ? (
          <Mascot size={Math.round(size * 0.86)} />
        ) : (
          <Icon name={face.icon} size={Math.round(size * 0.5)} />
        )
      ) : (
        letter
      )}
    </span>
  );
}
