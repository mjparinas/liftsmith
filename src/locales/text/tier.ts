import type { Message } from "@/lib/i18n";

// Text for keys starting "tier.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "tier.bronze": "Bronze",
  "tier.silver": "Silver",
  "tier.gold": "Gold",
  "tier.platinum": "Platinum",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronce",
  "tier.silver": "Plata",
  "tier.gold": "Oro",
  "tier.platinum": "Platino",
};

export const fr: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronze",
  "tier.silver": "Argent",
  "tier.gold": "Or",
  "tier.platinum": "Platine",
};

export const de: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronze",
  "tier.silver": "Silber",
  "tier.gold": "Gold",
  "tier.platinum": "Platin",
};

export const it: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronzo",
  "tier.silver": "Argento",
  "tier.gold": "Oro",
  "tier.platinum": "Platino",
};

export const ja: Partial<Record<Key, Message>> = {
  "tier.bronze": "ブロンズ",
  "tier.silver": "シルバー",
  "tier.gold": "ゴールド",
  "tier.platinum": "プラチナ",
};

export const pt: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronze",
  "tier.silver": "Prata",
  "tier.gold": "Ouro",
  "tier.platinum": "Platina",
};

export const ko: Partial<Record<Key, Message>> = {
  "tier.bronze": "브론즈",
  "tier.silver": "실버",
  "tier.gold": "골드",
  "tier.platinum": "플래티넘",
};

export const tr: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronz",
  "tier.silver": "Gümüş",
  "tier.gold": "Altın",
  "tier.platinum": "Platin",
};

export const pl: Partial<Record<Key, Message>> = {
  "tier.bronze": "Brąz",
  "tier.silver": "Srebro",
  "tier.gold": "Złoto",
  "tier.platinum": "Platyna",
};
