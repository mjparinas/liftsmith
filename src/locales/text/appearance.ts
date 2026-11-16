import type { Message } from "@/lib/i18n";

// Text for keys starting "appearance.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "appearance.dark": "Dark",
  "appearance.light": "Light",
  "appearance.system": "Match system",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "appearance.dark": "Oscuro",
  "appearance.light": "Claro",
  "appearance.system": "Igual que el sistema",
};

export const fr: Partial<Record<Key, Message>> = {
  "appearance.dark": "Sombre",
  "appearance.light": "Clair",
  "appearance.system": "Comme le système",
};

export const de: Partial<Record<Key, Message>> = {
  "appearance.dark": "Dunkel",
  "appearance.light": "Hell",
  "appearance.system": "Wie das System",
};

export const it: Partial<Record<Key, Message>> = {
  "appearance.dark": "Scuro",
  "appearance.light": "Chiaro",
  "appearance.system": "Come il sistema",
};

export const ja: Partial<Record<Key, Message>> = {
  "appearance.dark": "ダーク",
  "appearance.light": "ライト",
  "appearance.system": "システムに合わせる",
};

export const pt: Partial<Record<Key, Message>> = {
  "appearance.dark": "Escuro",
  "appearance.light": "Claro",
  "appearance.system": "Igual ao sistema",
};

export const ko: Partial<Record<Key, Message>> = {
  "appearance.dark": "다크",
  "appearance.light": "라이트",
  "appearance.system": "시스템 설정 따르기",
};

export const tr: Partial<Record<Key, Message>> = {
  "appearance.dark": "Koyu",
  "appearance.light": "Açık",
  "appearance.system": "Sisteme uy",
};

export const pl: Partial<Record<Key, Message>> = {
  "appearance.dark": "Ciemny",
  "appearance.light": "Jasny",
  "appearance.system": "Jak w systemie",
};
