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

export const de: Partial<Record<Key, Message>> = {
  "category.consistency": "Beständigkeit",
  "category.strength": "Kraft",
  "category.volume": "Volumen",
  "category.records": "Rekorde",
  "category.explore": "Entdecken",
  "category.smart": "Klug trainieren",
  "category.secret": "Geheim",
};

export const it: Partial<Record<Key, Message>> = {
  "category.consistency": "Costanza",
  "category.strength": "Forza",
  "category.volume": "Volume",
  "category.records": "Record",
  "category.explore": "Esplorazione",
  "category.smart": "Allenarsi con testa",
  "category.secret": "Segreto",
};

export const ja: Partial<Record<Key, Message>> = {
  "category.consistency": "継続",
  "category.strength": "筋力",
  "category.volume": "ボリューム",
  "category.records": "記録",
  "category.explore": "探求",
  "category.smart": "賢いトレーニング",
  "category.secret": "シークレット",
};
