import type { Message } from "@/lib/i18n";

// Text for keys starting "bmi.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "bmi.under": "Underweight",
  "bmi.healthy": "Healthy range",
  "bmi.over": "Overweight",
  "bmi.obese": "Obese",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "bmi.under": "Bajo peso",
  "bmi.healthy": "Rango saludable",
  "bmi.over": "Sobrepeso",
  "bmi.obese": "Obesidad",
};

export const fr: Partial<Record<Key, Message>> = {
  "bmi.under": "Insuffisance pondérale",
  "bmi.healthy": "Zone saine",
  "bmi.over": "Surpoids",
  "bmi.obese": "Obésité",
};

export const de: Partial<Record<Key, Message>> = {
  "bmi.under": "Untergewicht",
  "bmi.healthy": "Gesunder Bereich",
  "bmi.over": "Übergewicht",
  "bmi.obese": "Adipositas",
};

export const it: Partial<Record<Key, Message>> = {
  "bmi.under": "Sottopeso",
  "bmi.healthy": "Normopeso",
  "bmi.over": "Sovrappeso",
  "bmi.obese": "Obesità",
};

export const ja: Partial<Record<Key, Message>> = {
  "bmi.under": "低体重",
  "bmi.healthy": "標準範囲",
  "bmi.over": "過体重",
  "bmi.obese": "肥満",
};
