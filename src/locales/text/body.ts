import type { Message } from "@/lib/i18n";

// Text for keys starting "body.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "body.title": "Body",
  "body.views": "Body views",
  "body.muscles": "Muscles",
  "body.health": "Health",
  "body.fat.label": "Body fat % (optional)",
  "body.fat.field": "body fat percent",
  "body.fat.placeholder": "Body fat %",
  "body.fat.last": "Body fat {pct}%",
  "body.fat.range": "Body fat needs to be between 3 and 60%.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "body.title": "Cuerpo",
  "body.views": "Vistas del cuerpo",
  "body.muscles": "Músculos",
  "body.health": "Salud",
  "body.fat.label": "Grasa corporal % (opcional)",
  "body.fat.field": "grasa corporal en porcentaje",
  "body.fat.placeholder": "Grasa %",
  "body.fat.last": "Grasa corporal {pct}%",
  "body.fat.range": "La grasa corporal tiene que estar entre 3 y 60%.",
};

export const fr: Partial<Record<Key, Message>> = {
  "body.title": "Corps",
  "body.views": "Vues du corps",
  "body.muscles": "Muscles",
  "body.health": "Santé",
  "body.fat.label": "Masse grasse % (facultatif)",
  "body.fat.field": "masse grasse en pourcentage",
  "body.fat.placeholder": "Masse grasse %",
  "body.fat.last": "Masse grasse {pct} %",
  "body.fat.range": "La masse grasse doit être comprise entre 3 et 60 %.",
};

export const de: Partial<Record<Key, Message>> = {
  "body.title": "Körper",
  "body.views": "Körperansichten",
  "body.muscles": "Muskeln",
  "body.health": "Gesundheit",
  "body.fat.label": "Körperfett % (optional)",
  "body.fat.field": "Körperfett in Prozent",
  "body.fat.placeholder": "Körperfett %",
  "body.fat.last": "Körperfett {pct} %",
  "body.fat.range": "Das Körperfett muss zwischen 3 und 60 % liegen.",
};

export const it: Partial<Record<Key, Message>> = {
  "body.title": "Corpo",
  "body.views": "Viste del corpo",
  "body.muscles": "Muscoli",
  "body.health": "Salute",
  "body.fat.label": "Massa grassa % (facoltativa)",
  "body.fat.field": "percentuale di massa grassa",
  "body.fat.placeholder": "Massa grassa %",
  "body.fat.last": "Massa grassa {pct}%",
  "body.fat.range": "La massa grassa deve essere tra il 3 e il 60%.",
};

export const ja: Partial<Record<Key, Message>> = {
  "body.title": "体",
  "body.views": "体のビュー",
  "body.muscles": "筋肉",
  "body.health": "健康",
  "body.fat.label": "体脂肪率 %（任意）",
  "body.fat.field": "体脂肪率",
  "body.fat.placeholder": "体脂肪率 %",
  "body.fat.last": "体脂肪率 {pct}%",
  "body.fat.range": "体脂肪率は3〜60%の範囲で入力してください。",
};
