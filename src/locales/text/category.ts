import type { Message } from "@/lib/i18n";

// Text for keys starting "category.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "category.consistency": "Consistency",
  "category.strength": "Strength",
  "category.volume": "Volume",
  "category.records": "Records",
  "category.explore": "Exploring",
  "category.smart": "Training smart",
  "category.secret": "Secret",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "category.consistency": "Constancia",
  "category.strength": "Fuerza",
  "category.volume": "Volumen",
  "category.records": "Récords",
  "category.explore": "Explorar",
  "category.smart": "Entrenar con cabeza",
  "category.secret": "Secretos",
};

export const fr: Partial<Record<Key, Message>> = {
  "category.consistency": "Régularité",
  "category.strength": "Force",
  "category.volume": "Volume",
  "category.records": "Records",
  "category.explore": "Exploration",
  "category.smart": "S’entraîner malin",
  "category.secret": "Secrets",
};
