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
