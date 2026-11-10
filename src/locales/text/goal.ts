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

export const de: Partial<Record<Key, Message>> = {
  "goal.muscle": "Muskeln aufbauen",
  "goal.strength": "Stärker werden",
  "goal.general": "Fit bleiben",
};

export const it: Partial<Record<Key, Message>> = {
  "goal.muscle": "Mettere massa",
  "goal.strength": "Diventare più forte",
  "goal.general": "Restare in forma",
};

export const ja: Partial<Record<Key, Message>> = {
  "goal.muscle": "筋肉をつける",
  "goal.strength": "強くなる",
  "goal.general": "健康を保つ",
};
