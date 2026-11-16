import type { Message } from "@/lib/i18n";

// Text for keys starting "sband.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "sband.elite": "Elite",
  "sband.advanced": "Advanced",
  "sband.intermediate": "Intermediate",
  "sband.novice": "Novice",
  "sband.start": "Starting out",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "sband.elite": "Élite",
  "sband.advanced": "Avanzado",
  "sband.intermediate": "Intermedio",
  "sband.novice": "Principiante",
  "sband.start": "Empezando",
};

export const fr: Partial<Record<Key, Message>> = {
  "sband.elite": "Élite",
  "sband.advanced": "Avancé",
  "sband.intermediate": "Intermédiaire",
  "sband.novice": "Débutant",
  "sband.start": "Premiers pas",
};

export const de: Partial<Record<Key, Message>> = {
  "sband.elite": "Elite",
  "sband.advanced": "Fortgeschritten",
  "sband.intermediate": "Mittelstufe",
  "sband.novice": "Anfänger",
  "sband.start": "Einsteiger",
};

export const it: Partial<Record<Key, Message>> = {
  "sband.elite": "Élite",
  "sband.advanced": "Avanzato",
  "sband.intermediate": "Intermedio",
  "sband.novice": "Principiante",
  "sband.start": "Agli inizi",
};

export const ja: Partial<Record<Key, Message>> = {
  "sband.elite": "エリート",
  "sband.advanced": "上級",
  "sband.intermediate": "中級",
  "sband.novice": "初級",
  "sband.start": "入門",
};

export const pt: Partial<Record<Key, Message>> = {
  "sband.elite": "Elite",
  "sband.advanced": "Avançado",
  "sband.intermediate": "Intermediário",
  "sband.novice": "Novato",
  "sband.start": "Começando",
};

export const ko: Partial<Record<Key, Message>> = {
  "sband.elite": "엘리트",
  "sband.advanced": "상급",
  "sband.intermediate": "중급",
  "sband.novice": "초급",
  "sband.start": "입문",
};

export const tr: Partial<Record<Key, Message>> = {
  "sband.elite": "Elit",
  "sband.advanced": "İleri",
  "sband.intermediate": "Orta",
  "sband.novice": "Acemi",
  "sband.start": "Yeni başlayan",
};

export const pl: Partial<Record<Key, Message>> = {
  "sband.elite": "Elita",
  "sband.advanced": "Zaawansowany",
  "sband.intermediate": "Średniozaawansowany",
  "sband.novice": "Nowicjusz",
  "sband.start": "Początkujący",
};
