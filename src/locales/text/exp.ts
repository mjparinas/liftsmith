import type { Message } from "@/lib/i18n";

// Text for keys starting "exp.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "exp.new": "New",
  "exp.intermediate": "Some",
  "exp.advanced": "Experienced",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "exp.new": "Principiante",
  "exp.intermediate": "Algo",
  "exp.advanced": "Con experiencia",
};

export const fr: Partial<Record<Key, Message>> = {
  "exp.new": "Débutant",
  "exp.intermediate": "Un peu",
  "exp.advanced": "Confirmé",
};

export const de: Partial<Record<Key, Message>> = {
  "exp.new": "Neu",
  "exp.intermediate": "Etwas",
  "exp.advanced": "Erfahren",
};

export const it: Partial<Record<Key, Message>> = {
  "exp.new": "Principiante",
  "exp.intermediate": "Un po’",
  "exp.advanced": "Esperto",
};

export const ja: Partial<Record<Key, Message>> = {
  "exp.new": "初心者",
  "exp.intermediate": "少し経験あり",
  "exp.advanced": "経験者",
};
