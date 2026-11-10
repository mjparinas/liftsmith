import type { Message } from "@/lib/i18n";

// Text for keys starting "notes.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "notes.title": "Coach's notes",
  "notes.done": "Done. Today's plan is updated",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "notes.title": "Notas del entrenador",
  "notes.done": "Hecho. El plan de hoy está actualizado",
};

export const fr: Partial<Record<Key, Message>> = {
  "notes.title": "Notes du coach",
  "notes.done": "C’est fait. Le plan du jour est à jour",
};
