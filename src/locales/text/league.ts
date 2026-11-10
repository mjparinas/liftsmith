import type { Message } from "@/lib/i18n";

// Text for keys starting "league.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "league.bronze": "Bronze",
  "league.silver": "Silver",
  "league.gold": "Gold",
  "league.sapphire": "Sapphire",
  "league.ruby": "Ruby",
  "league.emerald": "Emerald",
  "league.diamond": "Diamond",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "league.bronze": "Bronce",
  "league.silver": "Plata",
  "league.gold": "Oro",
  "league.sapphire": "Zafiro",
  "league.ruby": "Rubí",
  "league.emerald": "Esmeralda",
  "league.diamond": "Diamante",
};

export const fr: Partial<Record<Key, Message>> = {
  "league.bronze": "Bronze",
  "league.silver": "Argent",
  "league.gold": "Or",
  "league.sapphire": "Saphir",
  "league.ruby": "Rubis",
  "league.emerald": "Émeraude",
  "league.diamond": "Diamant",
};
