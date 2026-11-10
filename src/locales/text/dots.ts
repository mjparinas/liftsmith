import type { Message } from "@/lib/i18n";

// Text for keys starting "dots.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "dots.title": "DOTS score",
  "dots.body": "Your squat, bench and deadlift total scaled for body weight, so lifters of any size compare. Worked out from your estimated maxes.",
  "dots.missing": "Needs an estimated max for {names}. Log a heavy set of each, or enter them below.",
  "dots.total": "Total",
  "dots.bw": "Body weight",
  "dots.sex": "Formula",
  "dots.male": "Men's",
  "dots.female": "Women's",
  "dots.calc": "Change the numbers",
  "dots.reset": "Use my data",
  "dots.note": "Estimated maxes, not meet lifts. Bands are a rough guide: under 200 beginner, 300 intermediate, 400 advanced, 500 elite.",
  "dots.lift.squat": "Squat",
  "dots.lift.bench": "Bench",
  "dots.lift.deadlift": "Deadlift",
  "dots.band.elite": "Elite",
  "dots.band.advanced": "Advanced",
  "dots.band.intermediate": "Intermediate",
  "dots.band.novice": "Novice",
  "dots.band.beginner": "Beginner",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "dots.title": "Puntuación DOTS",
  "dots.body": "El total de sentadilla, press de banca y peso muerto ajustado al peso corporal, para comparar a personas de cualquier tamaño. Calculado con tus máximos estimados.",
  "dots.missing": "Necesita un máximo estimado de {names}. Registra una serie pesada de cada uno, o ponlos abajo.",
  "dots.total": "Total",
  "dots.bw": "Peso corporal",
  "dots.sex": "Fórmula",
  "dots.male": "Hombres",
  "dots.female": "Mujeres",
  "dots.calc": "Cambiar los números",
  "dots.reset": "Usar mis datos",
  "dots.note": "Máximos estimados, no levantamientos de competición. Las franjas son orientativas: menos de 200 principiante, 300 intermedio, 400 avanzado, 500 élite.",
  "dots.lift.squat": "Sentadilla",
  "dots.lift.bench": "Banca",
  "dots.lift.deadlift": "Peso muerto",
  "dots.band.elite": "Élite",
  "dots.band.advanced": "Avanzado",
  "dots.band.intermediate": "Intermedio",
  "dots.band.novice": "Novato",
  "dots.band.beginner": "Principiante",
};

export const fr: Partial<Record<Key, Message>> = {
  "dots.title": "Score DOTS",
  "dots.body": "Votre total squat, développé couché et soulevé de terre rapporté au poids de corps, pour comparer des gabarits différents. Calculé à partir de vos maximums estimés.",
  "dots.missing": "Il faut un maximum estimé pour {names}. Enregistrez une série lourde de chacun, ou saisissez-les ci-dessous.",
  "dots.total": "Total",
  "dots.bw": "Poids de corps",
  "dots.sex": "Formule",
  "dots.male": "Hommes",
  "dots.female": "Femmes",
  "dots.calc": "Changer les chiffres",
  "dots.reset": "Utiliser mes données",
  "dots.note": "Maximums estimés, pas des barres de compétition. Les paliers sont indicatifs : moins de 200 débutant, 300 intermédiaire, 400 avancé, 500 élite.",
  "dots.lift.squat": "Squat",
  "dots.lift.bench": "Développé couché",
  "dots.lift.deadlift": "Soulevé de terre",
  "dots.band.elite": "Élite",
  "dots.band.advanced": "Avancé",
  "dots.band.intermediate": "Intermédiaire",
  "dots.band.novice": "Novice",
  "dots.band.beginner": "Débutant",
};
