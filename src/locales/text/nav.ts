import type { Message } from "@/lib/i18n";

// Text for keys starting "nav.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "nav.main": "Main",
  "nav.back.today": "Today",
  "nav.loading": "Loading",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "nav.main": "Principal",
  "nav.back.today": "Hoy",
  "nav.loading": "Cargando",
};

export const fr: Partial<Record<Key, Message>> = {
  "nav.main": "Principale",
  "nav.back.today": "Aujourd’hui",
  "nav.loading": "Chargement",
};
