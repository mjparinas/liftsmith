import type { Message } from "@/lib/i18n";

// Text for keys starting "tab.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "tab.today": "Today",
  "tab.recovery": "Body",
  "tab.progress": "Progress",
  "tab.awards": "Awards",
  "tab.gyms": "Gyms",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "tab.today": "Hoy",
  "tab.recovery": "Cuerpo",
  "tab.progress": "Progreso",
  "tab.awards": "Logros",
  "tab.gyms": "Gimnasios",
};

export const fr: Partial<Record<Key, Message>> = {
  "tab.today": "Aujourd’hui",
  "tab.recovery": "Corps",
  "tab.progress": "Progrès",
  "tab.awards": "Trophées",
  "tab.gyms": "Salles",
};

export const de: Partial<Record<Key, Message>> = {
  "tab.today": "Heute",
  "tab.recovery": "Körper",
  "tab.progress": "Fortschritt",
  "tab.awards": "Erfolge",
  "tab.gyms": "Studios",
};

export const it: Partial<Record<Key, Message>> = {
  "tab.today": "Oggi",
  "tab.recovery": "Corpo",
  "tab.progress": "Progressi",
  "tab.awards": "Premi",
  "tab.gyms": "Palestre",
};

export const ja: Partial<Record<Key, Message>> = {
  "tab.today": "今日",
  "tab.recovery": "体",
  "tab.progress": "進捗",
  "tab.awards": "実績",
  "tab.gyms": "ジム",
};
