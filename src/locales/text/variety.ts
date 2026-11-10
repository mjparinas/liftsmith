import type { Message } from "@/lib/i18n";

// Text for keys starting "variety.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "variety.consistent": "More consistent",
  "variety.balanced": "Balanced",
  "variety.variable": "More variety",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "variety.consistent": "Más constante",
  "variety.balanced": "Equilibrado",
  "variety.variable": "Más variedad",
};

export const fr: Partial<Record<Key, Message>> = {
  "variety.consistent": "Plus régulier",
  "variety.balanced": "Équilibré",
  "variety.variable": "Plus varié",
};

export const de: Partial<Record<Key, Message>> = {
  "variety.consistent": "Beständiger",
  "variety.balanced": "Ausgewogen",
  "variety.variable": "Mehr Abwechslung",
};

export const it: Partial<Record<Key, Message>> = {
  "variety.consistent": "Più costante",
  "variety.balanced": "Equilibrato",
  "variety.variable": "Più varietà",
};

export const ja: Partial<Record<Key, Message>> = {
  "variety.consistent": "一定を重視",
  "variety.balanced": "バランス",
  "variety.variable": "変化を重視",
};
