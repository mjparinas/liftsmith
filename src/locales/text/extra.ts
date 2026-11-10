import type { Message } from "@/lib/i18n";

// Text for keys starting "extra.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "extra.group": "While you rest",
  "extra.breathe": "Breathe",
  "extra.game": "Plate math",
  "extra.off": "Neither",
  "extra.in": "Breathe in through the nose",
  "extra.out": "Long breath out",
  "extra.why": "Slow breaths bring your heart rate down for the next set",
  "extra.quiz": "What’s on the bar?",
  "extra.streak": "Streak {count}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "extra.group": "Mientras descansas",
  "extra.breathe": "Respirar",
  "extra.game": "Cálculo de discos",
  "extra.off": "Ninguno",
  "extra.in": "Inspira por la nariz",
  "extra.out": "Espira largo",
  "extra.why": "Respirar despacio baja el pulso para la siguiente serie",
  "extra.quiz": "¿Cuánto hay en la barra?",
  "extra.streak": "Racha {count}",
};

export const fr: Partial<Record<Key, Message>> = {
  "extra.group": "Pendant le repos",
  "extra.breathe": "Respirer",
  "extra.game": "Calcul des disques",
  "extra.off": "Aucun",
  "extra.in": "Inspirez par le nez",
  "extra.out": "Longue expiration",
  "extra.why": "Respirer lentement fait baisser le pouls avant la série suivante",
  "extra.quiz": "Combien sur la barre ?",
  "extra.streak": "Série {count}",
};

export const de: Partial<Record<Key, Message>> = {
  "extra.group": "Während der Pause",
  "extra.breathe": "Atmen",
  "extra.game": "Scheiben-Rechnen",
  "extra.off": "Keins",
  "extra.in": "Durch die Nase einatmen",
  "extra.out": "Lange ausatmen",
  "extra.why": "Langsames Atmen senkt deine Herzfrequenz für den nächsten Satz",
  "extra.quiz": "Was ist auf der Stange?",
  "extra.streak": "Serie {count}",
};

export const it: Partial<Record<Key, Message>> = {
  "extra.group": "Mentre riposi",
  "extra.breathe": "Respira",
  "extra.game": "Calcolo dischi",
  "extra.off": "Nessuno",
  "extra.in": "Inspira dal naso",
  "extra.out": "Espira a lungo",
  "extra.why": "Respiri lenti abbassano la frequenza cardiaca per la prossima serie",
  "extra.quiz": "Cosa c’è sul bilanciere?",
  "extra.streak": "Serie {count}",
};

export const ja: Partial<Record<Key, Message>> = {
  "extra.group": "休憩中に",
  "extra.breathe": "呼吸",
  "extra.game": "プレート計算",
  "extra.off": "なし",
  "extra.in": "鼻から吸って",
  "extra.out": "長く吐いて",
  "extra.why": "ゆっくり呼吸すると、次のセットに向けて心拍数が下がります",
  "extra.quiz": "バーの重さは？",
  "extra.streak": "{count}連続",
};
