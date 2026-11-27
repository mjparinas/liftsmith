import type { Message } from "@/lib/i18n";

// Text for keys starting "gen.", in every language: the website's free workout generator (webWorkout.ts,
// docs/decisions/workout-generator.md). The website reads the same lines (fromApp.ts `genWords`), and the app names
// the routine a generator link opens with them, so a workout has one name on the site and in the app.

export const en = {
  "gen.title": "{focus} · {minutes} min",
  "gen.focus.full": "Full body",
  "gen.focus.upper": "Upper body",
  "gen.focus.lower": "Lower body",
  "gen.focus.push": "Push",
  "gen.focus.pull": "Pull",
  "gen.focus.legs": "Legs",
  "gen.focus.chest": "Chest",
  "gen.focus.back": "Back",
  "gen.focus.shoulders": "Shoulders",
  "gen.focus.arms": "Arms",
  "gen.focus.glutes": "Glutes",
  "gen.focus.core": "Core",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} min",
  "gen.focus.full": "Cuerpo completo",
  "gen.focus.upper": "Tren superior",
  "gen.focus.lower": "Tren inferior",
  "gen.focus.push": "Empuje",
  "gen.focus.pull": "Tirón",
  "gen.focus.legs": "Piernas",
  "gen.focus.chest": "Pecho",
  "gen.focus.back": "Espalda",
  "gen.focus.shoulders": "Hombros",
  "gen.focus.arms": "Brazos",
  "gen.focus.glutes": "Glúteos",
  "gen.focus.core": "Core",
};

export const fr: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} min",
  "gen.focus.full": "Corps entier",
  "gen.focus.upper": "Haut du corps",
  "gen.focus.lower": "Bas du corps",
  "gen.focus.push": "Poussée",
  "gen.focus.pull": "Tirage",
  "gen.focus.legs": "Jambes",
  "gen.focus.chest": "Pectoraux",
  "gen.focus.back": "Dos",
  "gen.focus.shoulders": "Épaules",
  "gen.focus.arms": "Bras",
  "gen.focus.glutes": "Fessiers",
  "gen.focus.core": "Gainage",
};

export const de: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} Min.",
  "gen.focus.full": "Ganzkörper",
  "gen.focus.upper": "Oberkörper",
  "gen.focus.lower": "Unterkörper",
  "gen.focus.push": "Drücken",
  "gen.focus.pull": "Ziehen",
  "gen.focus.legs": "Beine",
  "gen.focus.chest": "Brust",
  "gen.focus.back": "Rücken",
  "gen.focus.shoulders": "Schultern",
  "gen.focus.arms": "Arme",
  "gen.focus.glutes": "Po",
  "gen.focus.core": "Rumpf",
};

export const it: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} min",
  "gen.focus.full": "Total body",
  "gen.focus.upper": "Parte superiore",
  "gen.focus.lower": "Parte inferiore",
  "gen.focus.push": "Spinta",
  "gen.focus.pull": "Tirata",
  "gen.focus.legs": "Gambe",
  "gen.focus.chest": "Petto",
  "gen.focus.back": "Schiena",
  "gen.focus.shoulders": "Spalle",
  "gen.focus.arms": "Braccia",
  "gen.focus.glutes": "Glutei",
  "gen.focus.core": "Core",
};

export const ja: Partial<Record<Key, Message>> = {
  "gen.title": "{focus}・{minutes}分",
  "gen.focus.full": "全身",
  "gen.focus.upper": "上半身",
  "gen.focus.lower": "下半身",
  "gen.focus.push": "プッシュ",
  "gen.focus.pull": "プル",
  "gen.focus.legs": "脚",
  "gen.focus.chest": "胸",
  "gen.focus.back": "背中",
  "gen.focus.shoulders": "肩",
  "gen.focus.arms": "腕",
  "gen.focus.glutes": "お尻",
  "gen.focus.core": "体幹",
};

export const pt: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} min",
  "gen.focus.full": "Corpo inteiro",
  "gen.focus.upper": "Parte superior",
  "gen.focus.lower": "Parte inferior",
  "gen.focus.push": "Empurrar",
  "gen.focus.pull": "Puxar",
  "gen.focus.legs": "Pernas",
  "gen.focus.chest": "Peito",
  "gen.focus.back": "Costas",
  "gen.focus.shoulders": "Ombros",
  "gen.focus.arms": "Braços",
  "gen.focus.glutes": "Glúteos",
  "gen.focus.core": "Core",
};

export const ko: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes}분",
  "gen.focus.full": "전신",
  "gen.focus.upper": "상체",
  "gen.focus.lower": "하체",
  "gen.focus.push": "푸시",
  "gen.focus.pull": "풀",
  "gen.focus.legs": "다리",
  "gen.focus.chest": "가슴",
  "gen.focus.back": "등",
  "gen.focus.shoulders": "어깨",
  "gen.focus.arms": "팔",
  "gen.focus.glutes": "둔근",
  "gen.focus.core": "코어",
};

export const pl: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} min",
  "gen.focus.full": "Całe ciało",
  "gen.focus.upper": "Góra ciała",
  "gen.focus.lower": "Dół ciała",
  "gen.focus.push": "Pchanie",
  "gen.focus.pull": "Przyciąganie",
  "gen.focus.legs": "Nogi",
  "gen.focus.chest": "Klatka",
  "gen.focus.back": "Plecy",
  "gen.focus.shoulders": "Barki",
  "gen.focus.arms": "Ramiona",
  "gen.focus.glutes": "Pośladki",
  "gen.focus.core": "Core",
};

export const tr: Partial<Record<Key, Message>> = {
  "gen.title": "{focus} · {minutes} dk",
  "gen.focus.full": "Tüm vücut",
  "gen.focus.upper": "Üst vücut",
  "gen.focus.lower": "Alt vücut",
  "gen.focus.push": "İtiş",
  "gen.focus.pull": "Çekiş",
  "gen.focus.legs": "Bacak",
  "gen.focus.chest": "Göğüs",
  "gen.focus.back": "Sırt",
  "gen.focus.shoulders": "Omuz",
  "gen.focus.arms": "Kol",
  "gen.focus.glutes": "Kalça",
  "gen.focus.core": "Karın ve gövde",
};
