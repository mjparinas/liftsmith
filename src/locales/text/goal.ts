import type { Message } from "@/lib/i18n";

// Text for keys starting "goal.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "goal.muscle": "Build muscle",
  "goal.strength": "Get stronger",
  "goal.general": "Stay fit",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "goal.muscle": "Ganar músculo",
  "goal.strength": "Ganar fuerza",
  "goal.general": "Mantenerme en forma",
};

export const fr: Partial<Record<Key, Message>> = {
  "goal.muscle": "Prendre du muscle",
  "goal.strength": "Gagner en force",
  "goal.general": "Rester en forme",
};
