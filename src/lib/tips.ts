// One tip at a time (polish pass, Melvin 2026-11-10). Liftsmith has features that are easy to miss, so
// at most one tip shows per workout, on the rest card (never during a set), and each one shows once:
// it's marked seen as soon as it appears, and "Got it" hides it straight away. Tips that don't apply
// (the voice coach is already on, there's nothing left to reorder) are skipped. Kept on this device.

export type TipId = "undo" | "reorder" | "superset" | "swap" | "handsFree" | "voice" | "oneHand";

export interface TipContext {
  /** Native app (the hands-free tip needs the tile, widget or Back Tap). */
  native: boolean;
  voice: boolean;
  oneHanded: boolean;
  /** Exercises after this one. */
  upcoming: number;
  /** Working sets logged in this workout so far. */
  setsLogged: number;
}

/** In the order they're worth knowing. */
export const TIPS: { id: TipId; when: (c: TipContext) => boolean }[] = [
  { id: "undo", when: () => true },
  { id: "reorder", when: (c) => c.upcoming >= 2 },
  { id: "superset", when: (c) => c.upcoming >= 2 },
  { id: "swap", when: () => true },
  { id: "handsFree", when: (c) => c.native },
  { id: "voice", when: (c) => !c.voice },
  { id: "oneHand", when: (c) => !c.oneHanded },
];

export interface TipState {
  seen: TipId[];
  /** The workout that showed a tip, and which, so it stays put for that workout's rests. */
  session?: string;
  shown?: TipId;
  /** Dismissed with "Got it" in that workout. */
  hidden?: boolean;
}

const KEY = "liftsmith.tips";

export function loadTips(): TipState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as TipState | null;
    if (v && Array.isArray(v.seen)) return v;
  } catch {}
  return { seen: [] };
}

export function saveTips(s: TipState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

/**
 * The tip for this rest, and the state to save. The first rest after the first set never gets one,
 * so the opening set stays clear; after that a workout shows one tip at most.
 */
export function tipFor(state: TipState, sessionId: string, c: TipContext): { tip: TipId | null; state: TipState } {
  if (state.session === sessionId) return { tip: state.hidden ? null : (state.shown ?? null), state };
  if (c.setsLogged < 2) return { tip: null, state };
  const next = TIPS.find((x) => !state.seen.includes(x.id) && x.when(c));
  if (!next) return { tip: null, state };
  return { tip: next.id, state: { seen: [...state.seen, next.id], session: sessionId, shown: next.id } };
}
