import type { Message } from "@/lib/i18n";

// Text for keys starting "info.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "info.whatIs": "What is {term}?",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "info.whatIs": "¿Qué es {term}?",
};

export const fr: Partial<Record<Key, Message>> = {
  "info.whatIs": "Qu’est-ce que : {term} ?",
};

export const de: Partial<Record<Key, Message>> = {
  "info.whatIs": "Was ist {term}?",
};

export const it: Partial<Record<Key, Message>> = {
  "info.whatIs": "Che cos’è {term}?",
};

export const ja: Partial<Record<Key, Message>> = {
  "info.whatIs": "{term}とは？",
};

export const pt: Partial<Record<Key, Message>> = {
  "info.whatIs": "O que é {term}?",
};

export const ko: Partial<Record<Key, Message>> = {
  "info.whatIs": "{term}이란?",
};

export const tr: Partial<Record<Key, Message>> = {
  "info.whatIs": "{term} nedir?",
};

export const pl: Partial<Record<Key, Message>> = {
  "info.whatIs": "Co to jest {term}?",
};
