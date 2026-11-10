import type { Message } from "@/lib/i18n";

// Text for keys starting "body.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "body.title": "Body",
  "body.views": "Body views",
  "body.muscles": "Muscles",
  "body.health": "Health",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "body.title": "Cuerpo",
  "body.views": "Vistas del cuerpo",
  "body.muscles": "Músculos",
  "body.health": "Salud",
};

export const fr: Partial<Record<Key, Message>> = {
  "body.title": "Corps",
  "body.views": "Vues du corps",
  "body.muscles": "Muscles",
  "body.health": "Santé",
};
