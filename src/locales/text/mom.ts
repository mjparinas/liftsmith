import type { Message } from "@/lib/i18n";

// Text for keys starting "mom.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "mom.days": { one: "{count} day", other: "{count} days" },
  "mom.weeks": { one: "{count} week", other: "{count} weeks" },
  "mom.months": { one: "{count} month", other: "{count} months" },
  "mom.anniv": { one: "{count} year since your first workout", other: "{count} years since your first workout" },
  "mom.annivBody": "{workouts} workouts and {sets} sets since then. Happy liftiversary.",
  "mom.back": "Welcome back",
  "mom.backBody": "It’s been {time}. Today’s plan eases you back in, and your streak starts fresh this week. No catching up needed.",
  "mom.count": "Workout number {n}",
  "mom.count100": "Triple digits. That’s a habit for life.",
  "mom.countBody": "Every one of them counted.",
  "mom.ton": "You’ve now lifted {name}",
  "mom.tonBody": "About {kg} in total, one set at a time.",
  "mom.comeback": "Comeback complete",
  "mom.comebackBody": "First workout in {time}. The hardest one is done.",
  "mom.years": { one: "{count} year of lifting", other: "{count} years of lifting" },
  "mom.yearsBody": "You trained on your liftiversary. Fitting.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "mom.days": { one: "{count} día", other: "{count} días" },
  "mom.weeks": { one: "{count} semana", other: "{count} semanas" },
  "mom.months": { one: "{count} mes", other: "{count} meses" },
  "mom.anniv": { one: "{count} año desde tu primer entrenamiento", other: "{count} años desde tu primer entrenamiento" },
  "mom.annivBody": "{workouts} entrenamientos y {sets} series desde entonces. Feliz aniversario.",
  "mom.back": "Bienvenido de nuevo",
  "mom.backBody": "Han pasado {time}. El plan de hoy te ayuda a volver poco a poco, y tu racha empieza de nuevo esta semana. No hace falta recuperar nada.",
  "mom.count": "Entrenamiento número {n}",
  "mom.count100": "Tres cifras. Eso ya es un hábito para toda la vida.",
  "mom.countBody": "Cada uno contó.",
  "mom.ton": "Ya has levantado {name}",
  "mom.tonBody": "Unos {kg} en total, serie a serie.",
  "mom.comeback": "Regreso completado",
  "mom.comebackBody": "Primer entrenamiento en {time}. Lo más difícil ya está hecho.",
  "mom.years": { one: "{count} año entrenando", other: "{count} años entrenando" },
  "mom.yearsBody": "Entrenaste en tu aniversario. Muy apropiado.",
};

export const fr: Partial<Record<Key, Message>> = {
  "mom.days": { one: "{count} jour", other: "{count} jours" },
  "mom.weeks": { one: "{count} semaine", other: "{count} semaines" },
  "mom.months": { one: "{count} mois", other: "{count} mois" },
  "mom.anniv": { one: "{count} an depuis votre première séance", other: "{count} ans depuis votre première séance" },
  "mom.annivBody": "{workouts} séances et {sets} séries depuis. Joyeux anniversaire d’entraînement.",
  "mom.back": "Bon retour",
  "mom.backBody": "Ça fait {time}. Le plan du jour vous remet en douceur, et votre série repart de zéro cette semaine. Rien à rattraper.",
  "mom.count": "Séance numéro {n}",
  "mom.count100": "Trois chiffres. C’est une habitude pour la vie.",
  "mom.countBody": "Chacune a compté.",
  "mom.ton": "Vous avez maintenant soulevé {name}",
  "mom.tonBody": "Environ {kg} au total, une série à la fois.",
  "mom.comeback": "Retour réussi",
  "mom.comebackBody": "Première séance depuis {time}. Le plus dur est fait.",
  "mom.years": { one: "{count} an d’entraînement", other: "{count} ans d’entraînement" },
  "mom.yearsBody": "Vous vous êtes entraîné le jour de votre anniversaire d’entraînement. Bien vu.",
};
