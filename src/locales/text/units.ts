import type { Message } from "@/lib/i18n";

// Text for keys starting "units.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "units.kg": "Kilograms",
  "units.lb": "Pounds",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "units.kg": "Kilogramos",
  "units.lb": "Libras",
};

export const fr: Partial<Record<Key, Message>> = {
  "units.kg": "Kilogrammes",
  "units.lb": "Livres",
};

export const de: Partial<Record<Key, Message>> = {
  "units.kg": "Kilogramm",
  "units.lb": "Pfund",
};

export const it: Partial<Record<Key, Message>> = {
  "units.kg": "Chilogrammi",
  "units.lb": "Libbre",
};

export const ja: Partial<Record<Key, Message>> = {
  "units.kg": "キログラム",
  "units.lb": "ポンド",
};
