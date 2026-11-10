import type { Message } from "@/lib/i18n";

// Text for keys starting "rarity.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "rarity.common": "Common",
  "rarity.rare": "Rare",
  "rarity.epic": "Epic",
  "rarity.legendary": "Legendary",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "rarity.common": "Común",
  "rarity.rare": "Raro",
  "rarity.epic": "Épico",
  "rarity.legendary": "Legendario",
};

export const fr: Partial<Record<Key, Message>> = {
  "rarity.common": "Commun",
  "rarity.rare": "Rare",
  "rarity.epic": "Épique",
  "rarity.legendary": "Légendaire",
};

export const de: Partial<Record<Key, Message>> = {
  "rarity.common": "Gewöhnlich",
  "rarity.rare": "Selten",
  "rarity.epic": "Episch",
  "rarity.legendary": "Legendär",
};

export const it: Partial<Record<Key, Message>> = {
  "rarity.common": "Comune",
  "rarity.rare": "Raro",
  "rarity.epic": "Epico",
  "rarity.legendary": "Leggendario",
};

export const ja: Partial<Record<Key, Message>> = {
  "rarity.common": "コモン",
  "rarity.rare": "レア",
  "rarity.epic": "エピック",
  "rarity.legendary": "レジェンダリー",
};
