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

export const de: Partial<Record<Key, Message>> = {
  "league.bronze": "Bronze",
  "league.silver": "Silber",
  "league.gold": "Gold",
  "league.sapphire": "Saphir",
  "league.ruby": "Rubin",
  "league.emerald": "Smaragd",
  "league.diamond": "Diamant",
};

export const it: Partial<Record<Key, Message>> = {
  "league.bronze": "Bronzo",
  "league.silver": "Argento",
  "league.gold": "Oro",
  "league.sapphire": "Zaffiro",
  "league.ruby": "Rubino",
  "league.emerald": "Smeraldo",
  "league.diamond": "Diamante",
};

export const ja: Partial<Record<Key, Message>> = {
  "league.bronze": "ブロンズ",
  "league.silver": "シルバー",
  "league.gold": "ゴールド",
  "league.sapphire": "サファイア",
  "league.ruby": "ルビー",
  "league.emerald": "エメラルド",
  "league.diamond": "ダイヤモンド",
};
