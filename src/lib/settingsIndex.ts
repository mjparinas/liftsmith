// The search box on Settings (Melvin, 2026-11-19; an idea borrowed from an open-source sat-nav app, our own code):
// every setting a lifter might look for, by the words its own screen already shows, so the index speaks every
// language the app does with no new text. Picking one opens its page and brings that setting into view
// (settingsJump.ts). docs/decisions/settings-screen.md "Search".
//
// Keep it current: a new setting gets a line here in the same change (`settingsIndex.test.ts` checks every key is a
// real catalogue line and every place exists).

import type { MessageKey } from "@/locales/en";

/** Where a setting lives: a Settings group page, Labs, Plan details or a screen of its own. */
export type Place =
  | "training"
  | "workout"
  | "reminders"
  | "look"
  | "body"
  | "data"
  | "labs"
  | "plan"
  | "account"
  | "gym"
  | "connections"
  | "trainer"
  | "injuries"
  | "feedback"
  | "community"
  | "pro";

export interface SettingRef {
  /** The setting's own label, as its screen shows it (and the text the jump looks for there). */
  key: MessageKey;
  place: Place;
  /** Other words on the same control that someone might search for (its choices, its note). */
  also?: MessageKey[];
}

const S = (key: MessageKey, place: Place, also?: MessageKey[]): SettingRef => ({ key, place, ...(also ? { also } : {}) });

export const SETTINGS_INDEX: SettingRef[] = [
  // Screens of their own, reached from Settings' main list
  S("pro.settings", "pro"),
  S("account.row", "account", ["account.row.out"]),
  S("gym.row", "gym", ["gym.rowNote"]),
  S("conn.row", "connections", ["conn.rowNote"]),
  S("trn.row", "trainer", ["trn.rowNote"]),
  S("settings.injuries", "injuries"),
  S("settings.feedback", "feedback"),
  S("cmty.title", "community"),
  // Training
  S("settings.program", "training"),
  S("settings.goal", "training"),
  S("settings.experience", "training"),
  S("train.adapt", "training"),
  S("train.ss", "training"),
  S("train.bigAlone", "training"),
  S("train.warmups", "training"),
  S("settings.variety", "training"),
  S("settings.schedule", "training"),
  S("settings.block", "training"),
  S("settings.newBlock", "training", ["settings.trainingBlock"]),
  S("settings.rerun", "training"),
  // Workout
  S("a11y.hand", "workout"),
  S("a11y.big", "workout"),
  S("settings.sounds", "workout"),
  S("settings.vibration", "workout"),
  S("train.autoRest", "workout"),
  S("train.awake", "workout"),
  S("train.alertEnd", "workout"),
  S("train.warn", "workout"),
  S("str.warmSetting", "workout"),
  S("str.coolSetting", "workout"),
  S("str.readySetting", "workout"),
  S("pol.hf.title", "workout"),
  S("delight.voice", "workout"),
  S("delight.ghost", "workout"),
  S("delight.plates", "workout"),
  S("ff.setting", "workout"),
  S("delight.rest", "workout", ["delight.pattern"]),
  // Plan details (Workout › Plan details)
  S("train.rest", "plan"),
  S("train.reps", "plan"),
  S("train.sets", "plan"),
  S("train.effort", "plan"),
  S("train.length", "plan"),
  S("train.week", "plan"),
  S("train.priorities", "plan"),
  S("train.favourites", "plan"),
  S("train.lessOften", "plan"),
  S("train.overrides", "plan"),
  // Reminders
  S("msg.push", "reminders", ["msg.title"]),
  S("msg.emailMe", "reminders"),
  S("msg.badge", "reminders", ["msg.badgeBlurb"]),
  // Look and feel
  S("settings.appearance", "look", ["appearance.dark", "appearance.light", "appearance.system"]),
  S("delight.icon", "look"),
  S("settings.quote", "look"),
  S("ssn.setting", "look"),
  S("unl.all", "look"),
  S("settings.language", "look"),
  S("a11y.text", "look"),
  S("a11y.colours", "look"),
  S("a11y.contrast", "look"),
  S("settings.lean", "look"),
  S("settings.liteDemos", "look"),
  // Body and units
  S("stats.title", "body"),
  S("settings.units", "body", ["units.kg", "units.lb"]),
  S("settings.bodyweight.label", "body"),
  S("cycle.title", "body"),
  // Your data and privacy
  S("settings.data", "data"),
  S("settings.stats", "data", ["settings.stats.on"]),
  S("settings.standards", "data"),
  S("card.shot.settingTitle", "data", ["card.shot.setting"]),
  S("settings.erase", "data"),
  // Labs (Pro): the whole page is one place; each experiment is found by its name.
  S("lab.row", "labs"),
];

/** Lowercase, accents off, so "senal" finds "señal" and "Ubersicht" finds "Übersicht". */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * The settings whose words hold every word of the query, best first: a label that starts with the query, then one
 * with a word starting with it, then any match. `say` gives a key's words (in the app's language and, as a fallback,
 * English), so this stays pure and testable.
 */
export function searchSettings<T extends { key: MessageKey; also?: MessageKey[] }>(
  query: string,
  index: readonly T[],
  say: (key: MessageKey) => string[],
): T[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: [T, number][] = [];
  for (const ref of index) {
    const label = say(ref.key).map(fold);
    const hay = [...label, ...(ref.also ?? []).flatMap((k) => say(k).map(fold))].join(" \n ");
    if (!words.every((w) => hay.includes(w))) continue;
    const q = words.join(" ");
    const score = label.some((l) => l.startsWith(q))
      ? 0
      : label.some((l) => l.split(/[\s\-'’]+/).some((w) => w.startsWith(words[0]!)))
        ? 1
        : 2;
    scored.push([ref, score]);
  }
  return scored.sort((a, b) => a[1] - b[1]).map(([r]) => r);
}
