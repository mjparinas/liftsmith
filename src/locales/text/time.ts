import type { Message } from "@/lib/i18n";

// Text for keys starting "time.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "time.today": "Today",
  "time.yesterday": "Yesterday",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "time.today": "Hoy",
  "time.yesterday": "Ayer",
};

export const fr: Partial<Record<Key, Message>> = {
  "time.today": "Aujourd’hui",
  "time.yesterday": "Hier",
};
