import type { Message } from "@/lib/i18n";

// Text for keys starting "muscle.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "muscle.chest": "Chest",
  "muscle.frontDelts": "Front delts",
  "muscle.sideDelts": "Side delts",
  "muscle.rearDelts": "Rear delts",
  "muscle.biceps": "Biceps",
  "muscle.triceps": "Triceps",
  "muscle.forearms": "Forearms",
  "muscle.abs": "Abs",
  "muscle.obliques": "Obliques",
  "muscle.traps": "Traps",
  "muscle.upperBack": "Upper back",
  "muscle.lats": "Lats",
  "muscle.lowerBack": "Lower back",
  "muscle.glutes": "Glutes",
  "muscle.quads": "Quads",
  "muscle.hamstrings": "Hamstrings",
  "muscle.adductors": "Adductors",
  "muscle.calves": "Calves",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "muscle.chest": "Pecho",
  "muscle.frontDelts": "Deltoides anterior",
  "muscle.sideDelts": "Deltoides lateral",
  "muscle.rearDelts": "Deltoides posterior",
  "muscle.biceps": "Bíceps",
  "muscle.triceps": "Tríceps",
  "muscle.forearms": "Antebrazos",
  "muscle.abs": "Abdominales",
  "muscle.obliques": "Oblicuos",
  "muscle.traps": "Trapecios",
  "muscle.upperBack": "Espalda alta",
  "muscle.lats": "Dorsales",
  "muscle.lowerBack": "Zona lumbar",
  "muscle.glutes": "Glúteos",
  "muscle.quads": "Cuádriceps",
  "muscle.hamstrings": "Isquiotibiales",
  "muscle.adductors": "Aductores",
  "muscle.calves": "Gemelos",
};

export const fr: Partial<Record<Key, Message>> = {
  "muscle.chest": "Pectoraux",
  "muscle.frontDelts": "Deltoïdes antérieurs",
  "muscle.sideDelts": "Deltoïdes latéraux",
  "muscle.rearDelts": "Deltoïdes postérieurs",
  "muscle.biceps": "Biceps",
  "muscle.triceps": "Triceps",
  "muscle.forearms": "Avant-bras",
  "muscle.abs": "Abdominaux",
  "muscle.obliques": "Obliques",
  "muscle.traps": "Trapèzes",
  "muscle.upperBack": "Haut du dos",
  "muscle.lats": "Dorsaux",
  "muscle.lowerBack": "Bas du dos",
  "muscle.glutes": "Fessiers",
  "muscle.quads": "Quadriceps",
  "muscle.hamstrings": "Ischio-jambiers",
  "muscle.adductors": "Adducteurs",
  "muscle.calves": "Mollets",
};
