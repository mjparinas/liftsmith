import type { Message } from "@/lib/i18n";

// Text for keys starting "tools.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "tools.back": "‹ Progress",
  "tools.backTools": "‹ Tools",
  "tools.title": "Tools",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "tools.back": "‹ Progreso",
  "tools.backTools": "‹ Herramientas",
  "tools.title": "Herramientas",
};

export const fr: Partial<Record<Key, Message>> = {
  "tools.back": "‹ Progrès",
  "tools.backTools": "‹ Outils",
  "tools.title": "Outils",
};
