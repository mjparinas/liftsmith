import type { Message } from "@/lib/i18n";

// Text for keys starting "block.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "block.deload": "Deload week",
  "block.week": "Week {week} of {count}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "block.deload": "Semana de descarga",
  "block.week": "Semana {week} de {count}",
};

export const fr: Partial<Record<Key, Message>> = {
  "block.deload": "Semaine de décharge",
  "block.week": "Semaine {week} sur {count}",
};
