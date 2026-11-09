import type { Message } from "@/lib/i18n";

// Text for keys starting "today.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "today.morning": "Good morning",
  "today.afternoon": "Good afternoon",
  "today.evening": "Good evening",
  "today.hello": "{greeting}, {name}",
  "today.start": "Start workout",
  "today.trainingAround": "Training around: {parts}",
  "today.somethingHurts": "Something hurts?",
  "today.goalMore": { one: "{count} more this week for your goal", other: "{count} more this week for your goal" },
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "today.morning": "Buenos días",
  "today.afternoon": "Buenas tardes",
  "today.evening": "Buenas noches",
  "today.hello": "{greeting}, {name}",
  "today.start": "Empezar entrenamiento",
  "today.trainingAround": "Entrenando con cuidado de: {parts}",
  "today.somethingHurts": "¿Te duele algo?",
  "today.goalMore": { one: "{count} más esta semana para tu objetivo", other: "{count} más esta semana para tu objetivo" },
};

export const fr: Partial<Record<Key, Message>> = {
  "today.morning": "Bonjour",
  "today.afternoon": "Bon après-midi",
  "today.evening": "Bonsoir",
  "today.hello": "{greeting}, {name}",
  "today.start": "Commencer la séance",
  "today.trainingAround": "Entraînement adapté : {parts}",
  "today.somethingHurts": "Quelque chose fait mal ?",
  "today.goalMore": { one: "Encore {count} cette semaine pour votre objectif", other: "Encore {count} cette semaine pour votre objectif" },
};
