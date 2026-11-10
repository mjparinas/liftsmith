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
