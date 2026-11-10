import type { Message } from "@/lib/i18n";

// Text for keys starting "cause.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cause.missed": "{missed} of your last {count} sets fell short of the target reps. The weight has got ahead of you.",
  "cause.hard": { one: "You rated it too hard {count} time since your last best.", other: "You rated it too hard {count} times since your last best." },
  "cause.volume": "It's had about {sets} hard sets a week, against {want} for this block.",
  "cause.rest": "You've rested about {sec} seconds between sets, against {planned} planned.",
  "cause.readiness": "Your readiness has averaged {avg}, below the 50 baseline. Recovery may be the limit: sleep, food and stress count too.",
  "cause.sameReps": "Every session since your best has been in the same {lo}–{hi} rep range.",
  "cause.none": "Nothing in your data stands out. Effort, sets and rest all look fine, so a change of exercise is the best next step.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} de tus últimas {count} series se quedaron por debajo de las repeticiones objetivo. El peso te ha adelantado.",
  "cause.hard": { one: "Lo marcaste como demasiado duro {count} vez desde tu última mejor marca.", other: "Lo marcaste como demasiado duro {count} veces desde tu última mejor marca." },
  "cause.volume": "Ha tenido unas {sets} series duras por semana, frente a {want} en este bloque.",
  "cause.rest": "Has descansado unos {sec} segundos entre series, frente a {planned} previstos.",
  "cause.readiness": "Tu preparación ha promediado {avg}, por debajo de la base de 50. El límite puede ser la recuperación: el sueño, la comida y el estrés también cuentan.",
  "cause.sameReps": "Todas las sesiones desde tu mejor marca han sido en el mismo rango de {lo}–{hi} repeticiones.",
  "cause.none": "Nada destaca en tus datos. Esfuerzo, series y descanso parecen correctos, así que cambiar de ejercicio es el mejor siguiente paso.",
};

export const fr: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} de vos {count} dernières séries sont restées sous les répétitions cibles. La charge vous a devancé.",
  "cause.hard": { one: "Vous l’avez jugé trop dur {count} fois depuis votre dernier record.", other: "Vous l’avez jugé trop dur {count} fois depuis votre dernier record." },
  "cause.volume": "Il a eu environ {sets} séries difficiles par semaine, pour {want} prévues dans ce bloc.",
  "cause.rest": "Vous vous êtes reposé environ {sec} secondes entre les séries, pour {planned} prévues.",
  "cause.readiness": "Votre forme a été en moyenne de {avg}, sous la base de 50. La récupération peut être la limite : le sommeil, l’alimentation et le stress comptent aussi.",
  "cause.sameReps": "Chaque séance depuis votre record s’est faite dans la même fourchette de {lo} à {hi} répétitions.",
  "cause.none": "Rien ne ressort de vos données. Effort, séries et repos semblent corrects, donc changer d’exercice est la meilleure prochaine étape.",
};
