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

export const de: Partial<Record<Key, Message>> = {
  "time.today": "Heute",
  "time.yesterday": "Gestern",
};

export const it: Partial<Record<Key, Message>> = {
  "time.today": "Oggi",
  "time.yesterday": "Ieri",
};

export const ja: Partial<Record<Key, Message>> = {
  "time.today": "今日",
  "time.yesterday": "昨日",
};
