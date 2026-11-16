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

export const de: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Neuling",
  "lvl.regular": "Stammgast",
  "lvl.grinder": "Malocher",
  "lvl.iron": "Eisen",
  "lvl.steel": "Stahl",
  "lvl.titan": "Titan",
  "lvl.legend": "Legende",
  "lvl.mythic": "Mythisch",
};

export const it: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Esordiente",
  "lvl.regular": "Habitué",
  "lvl.grinder": "Instancabile",
  "lvl.iron": "Ferro",
  "lvl.steel": "Acciaio",
  "lvl.titan": "Titano",
  "lvl.legend": "Leggenda",
  "lvl.mythic": "Mitico",
};

export const ja: Partial<Record<Key, Message>> = {
  "lvl.rookie": "ルーキー",
  "lvl.regular": "レギュラー",
  "lvl.grinder": "努力家",
  "lvl.iron": "アイアン",
  "lvl.steel": "スチール",
  "lvl.titan": "タイタン",
  "lvl.legend": "レジェンド",
  "lvl.mythic": "ミシック",
};

export const pt: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Novato",
  "lvl.regular": "Frequente",
  "lvl.grinder": "Ralador",
  "lvl.iron": "Ferro",
  "lvl.steel": "Aço",
  "lvl.titan": "Titã",
  "lvl.legend": "Lenda",
  "lvl.mythic": "Mítico",
};

export const ko: Partial<Record<Key, Message>> = {
  "lvl.rookie": "루키",
  "lvl.regular": "레귤러",
  "lvl.grinder": "그라인더",
  "lvl.iron": "아이언",
  "lvl.steel": "스틸",
  "lvl.titan": "타이탄",
  "lvl.legend": "레전드",
  "lvl.mythic": "미시컬",
};

export const tr: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Çaylak",
  "lvl.regular": "Müdavim",
  "lvl.grinder": "Azimli",
  "lvl.iron": "Demir",
  "lvl.steel": "Çelik",
  "lvl.titan": "Titan",
  "lvl.legend": "Efsane",
  "lvl.mythic": "Mitik",
};

export const pl: Partial<Record<Key, Message>> = {
  "lvl.rookie": "Nowicjusz",
  "lvl.regular": "Bywalec",
  "lvl.grinder": "Harownik",
  "lvl.iron": "Żelazo",
  "lvl.steel": "Stal",
  "lvl.titan": "Tytan",
  "lvl.legend": "Legenda",
  "lvl.mythic": "Mityczny",
};
