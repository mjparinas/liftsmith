import type { Message } from "@/lib/i18n";

// Text for keys starting "lvl.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "lvl.rookie": "Rookie",
  "lvl.regular": "Regular",
  "lvl.grinder": "Grinder",
  "lvl.iron": "Iron",
  "lvl.steel": "Steel",
  "lvl.titan": "Titan",
  "lvl.legend": "Legend",
  "lvl.mythic": "Mythic",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Novato",
  "lvl.regular": "Habitual",
  "lvl.grinder": "Currante",
  "lvl.iron": "Hierro",
  "lvl.steel": "Acero",
  "lvl.titan": "Titán",
  "lvl.legend": "Leyenda",
  "lvl.mythic": "Mítico",
};

export const fr: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Débutant",
  "lvl.regular": "Habitué",
  "lvl.grinder": "Bosseur",
  "lvl.iron": "Fer",
  "lvl.steel": "Acier",
  "lvl.titan": "Titan",
  "lvl.legend": "Légende",
  "lvl.mythic": "Mythique",
};
