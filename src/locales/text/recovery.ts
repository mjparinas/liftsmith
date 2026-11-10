import type { Message } from "@/lib/i18n";

// Text for keys starting "recovery.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "recovery.title": "Recovery",
  "recovery.lead": "Colours and marks show how recovered each muscle is from your recent sets.",
  "recovery.muscles": "Muscles · this week vs {goal}-set goal",
  "recovery.setsOf": "{done} of {goal} sets this week",
  "recovery.locked.title": "The recovery map is part of Pro",
  "recovery.locked.body": "See how recovered each muscle is, and which are ready to train today.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "recovery.title": "Recuperación",
  "recovery.lead": "Los colores y las marcas muestran cuánto se ha recuperado cada músculo de tus series recientes.",
  "recovery.muscles": "Músculos · esta semana frente al objetivo de {goal} series",
  "recovery.setsOf": "{done} de {goal} series esta semana",
  "recovery.locked.title": "El mapa de recuperación es parte de Pro",
  "recovery.locked.body": "Mira cuánto se ha recuperado cada músculo y cuáles están listos para entrenar hoy.",
};

export const fr: Partial<Record<Key, Message>> = {
  "recovery.title": "Récupération",
  "recovery.lead": "Les couleurs et les motifs montrent la récupération de chaque muscle après vos séries récentes.",
  "recovery.muscles": "Muscles · cette semaine face à l’objectif de {goal} séries",
  "recovery.setsOf": "{done} séries sur {goal} cette semaine",
  "recovery.locked.title": "La carte de récupération fait partie de Pro",
  "recovery.locked.body": "Voyez où en est la récupération de chaque muscle, et lesquels sont prêts pour aujourd’hui.",
};
