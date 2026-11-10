import type { Message } from "@/lib/i18n";

// Text for keys starting "activity.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "activity.sedentary": "Sedentary",
  "activity.light": "Light exercise",
  "activity.moderate": "Moderate exercise",
  "activity.heavy": "Heavy exercise",
  "activity.athlete": "Athlete",
  "activity.sedentary.detail": "Desk job, little or no exercise",
  "activity.light.detail": "1 to 2 days a week",
  "activity.moderate.detail": "3 to 5 days a week",
  "activity.heavy.detail": "6 to 7 days a week",
  "activity.athlete.detail": "Twice a day, or a physical job plus training",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sedentario",
  "activity.light": "Ejercicio ligero",
  "activity.moderate": "Ejercicio moderado",
  "activity.heavy": "Ejercicio intenso",
  "activity.athlete": "Atleta",
  "activity.sedentary.detail": "Trabajo de oficina, poco o ningún ejercicio",
  "activity.light.detail": "1 a 2 días a la semana",
  "activity.moderate.detail": "3 a 5 días a la semana",
  "activity.heavy.detail": "6 a 7 días a la semana",
  "activity.athlete.detail": "Dos veces al día, o un trabajo físico más entrenamiento",
};

export const fr: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sédentaire",
  "activity.light": "Exercice léger",
  "activity.moderate": "Exercice modéré",
  "activity.heavy": "Exercice intense",
  "activity.athlete": "Athlète",
  "activity.sedentary.detail": "Travail de bureau, peu ou pas d’exercice",
  "activity.light.detail": "1 à 2 jours par semaine",
  "activity.moderate.detail": "3 à 5 jours par semaine",
  "activity.heavy.detail": "6 à 7 jours par semaine",
  "activity.athlete.detail": "Deux fois par jour, ou un travail physique plus l’entraînement",
};
