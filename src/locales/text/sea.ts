import type { Message } from "@/lib/i18n";

// Text for keys starting "sea.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "sea.new-year": "Fresh start week",
  "sea.new-year.d": "Three workouts in the first week of the year.",
  "sea.valentine": "Heart pumping",
  "sea.valentine.d": "60 hard sets between 10 and 16 February. Any muscles, your plan picks.",
  "sea.spring": "Spring into it",
  "sea.spring.d": "Six workouts in the two weeks after the spring equinox.",
  "sea.solstice": "Longest day",
  "sea.solstice.d": "Train on four different days around the June solstice (18 to 24 June).",
  "sea.back-to-it": "Back to it",
  "sea.back-to-it.d": "Eight workouts from 1 to 21 September.",
  "sea.halloween": "Spooky strong",
  "sea.halloween.d": "Lift 6,660 kg (6.66 t) between 25 and 31 October.",
  "sea.twelve-days": "Twelve days of lifting",
  "sea.twelve-days.d": "Six workouts from 13 to 24 December.",
  "sea.last-rep": "Last rep of the year",
  "sea.last-rep.d": "One workout between Boxing Day and New Year’s Eve.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "sea.new-year": "Semana de nuevo comienzo",
  "sea.new-year.d": "Tres entrenamientos en la primera semana del año.",
  "sea.valentine": "Corazón a tope",
  "sea.valentine.d": "60 series duras entre el 10 y el 16 de febrero. Cualquier músculo, tu plan elige.",
  "sea.spring": "Salta a la primavera",
  "sea.spring.d": "Seis entrenamientos en las dos semanas después del equinoccio de primavera.",
  "sea.solstice": "El día más largo",
  "sea.solstice.d": "Entrena cuatro días distintos alrededor del solsticio de junio (del 18 al 24 de junio).",
  "sea.back-to-it": "Vuelta a la rutina",
  "sea.back-to-it.d": "Ocho entrenamientos del 1 al 21 de septiembre.",
  "sea.halloween": "Fuerza de miedo",
  "sea.halloween.d": "Levanta 6660 kg (6,66 t) entre el 25 y el 31 de octubre.",
  "sea.twelve-days": "Doce días de entrenamiento",
  "sea.twelve-days.d": "Seis entrenamientos del 13 al 24 de diciembre.",
  "sea.last-rep": "Última repetición del año",
  "sea.last-rep.d": "Un entrenamiento entre el 26 y el 31 de diciembre.",
};

export const fr: Partial<Record<Key, Message>> = {
  "sea.new-year": "Semaine du nouveau départ",
  "sea.new-year.d": "Trois séances la première semaine de l’année.",
  "sea.valentine": "Cœur qui bat",
  "sea.valentine.d": "60 séries difficiles entre le 10 et le 16 février. Tous les muscles, votre plan choisit.",
  "sea.spring": "Élan de printemps",
  "sea.spring.d": "Six séances dans les deux semaines après l’équinoxe de printemps.",
  "sea.solstice": "Le jour le plus long",
  "sea.solstice.d": "Entraînez-vous quatre jours différents autour du solstice de juin (du 18 au 24 juin).",
  "sea.back-to-it": "La rentrée",
  "sea.back-to-it.d": "Huit séances du 1er au 21 septembre.",
  "sea.halloween": "Force effrayante",
  "sea.halloween.d": "Soulevez 6 660 kg (6,66 t) entre le 25 et le 31 octobre.",
  "sea.twelve-days": "Douze jours d’entraînement",
  "sea.twelve-days.d": "Six séances du 13 au 24 décembre.",
  "sea.last-rep": "Dernière rep de l’année",
  "sea.last-rep.d": "Une séance entre le 26 et le 31 décembre.",
};
