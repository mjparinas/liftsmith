import type { Message } from "@/lib/i18n";

// Text for keys starting "sband.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "sband.elite": "Elite",
  "sband.advanced": "Advanced",
  "sband.intermediate": "Intermediate",
  "sband.novice": "Novice",
  "sband.start": "Starting out",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "sband.elite": "Élite",
  "sband.advanced": "Avanzado",
  "sband.intermediate": "Intermedio",
  "sband.novice": "Principiante",
  "sband.start": "Empezando",
};

export const fr: Partial<Record<Key, Message>> = {
  "sband.elite": "Élite",
  "sband.advanced": "Avancé",
  "sband.intermediate": "Intermédiaire",
  "sband.novice": "Débutant",
  "sband.start": "Premiers pas",
};
