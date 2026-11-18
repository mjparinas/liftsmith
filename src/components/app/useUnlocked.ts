import { useApp } from "@/lib/store";
import { isUnlocked, type UnlockId } from "@/lib/unlocks";

/** Whether a feature has appeared for this lifter yet (src/lib/unlocks.ts). */
export function useUnlocked(id: UnlockId): boolean {
  return useApp((s) => isUnlocked(id, s.profile, s.stats.sessions.length));
}
