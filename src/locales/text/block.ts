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

export const de: Partial<Record<Key, Message>> = {
  "block.deload": "Deload-Woche",
  "block.week": "Woche {week} von {count}",
};

export const it: Partial<Record<Key, Message>> = {
  "block.deload": "Settimana di scarico",
  "block.week": "Settimana {week} di {count}",
};

export const ja: Partial<Record<Key, Message>> = {
  "block.deload": "ディロード週",
  "block.week": "第{week}週（全{count}週）",
};
