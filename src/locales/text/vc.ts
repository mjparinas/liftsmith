import type { Message } from "@/lib/i18n";

// Text for keys starting "vc.": the voice coach's spoken cues (src/lib/voice.ts), in every language.
// Written to be heard, not read: short sentences, numbers the speech engine says well. English is the source.

export const en = {
  "vc.kilos": "{n} kilos",
  "vc.pounds": "{n} pounds",
  "vc.bodyweight": "bodyweight",
  "vc.bodyweightPlus": "bodyweight plus {weight}",
  "vc.each": "{weight} each",
  "vc.what": "{load} for {reps}",
  "vc.whatTimed": "{load} for {reps} seconds",
  "vc.warmup": "Warm-up. {what}.",
  "vc.challenge": "Challenge set. {what}, as many good reps as you can.",
  "vc.failure": "Take it close to failure.",
  "vc.reserve": "{n} in reserve.",
  "vc.last": "Last set. {what}. {effort}",
  "vc.set": "Set {n} of {total}. {what}. {effort}",
  "vc.next": "Next up, {name}. {sets} sets of {reps} at {load}.",
  "vc.nextTimed": "Next up, {name}. {sets} sets of {reps} seconds at {load}.",
  "vc.ten": "Ten seconds.",
  "vc.go": "Time to lift.",
  "vc.pr": "New personal best on {name}. Nice.",
  "vc.done": "Workout done. {sets} sets. Great work.",
  "vc.doneMoved": "Workout done. {sets} sets, {moved} moved. Great work.",
  "vc.on": "Voice coach on. I'll call out each set.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "vc.kilos": "{n} kilos",
  "vc.pounds": "{n} libras",
  "vc.bodyweight": "peso corporal",
  "vc.bodyweightPlus": "peso corporal más {weight}",
  "vc.each": "{weight} cada una",
  "vc.what": "{load}, {reps} repeticiones",
  "vc.whatTimed": "{load}, {reps} segundos",
  "vc.warmup": "Calentamiento. {what}.",
  "vc.challenge": "Serie de reto. {what}, todas las repeticiones buenas que puedas.",
  "vc.failure": "Llévala cerca del fallo.",
  "vc.reserve": "Deja {n} en reserva.",
  "vc.last": "Última serie. {what}. {effort}",
  "vc.set": "Serie {n} de {total}. {what}. {effort}",
  "vc.next": "Ahora, {name}. {sets} series de {reps} con {load}.",
  "vc.nextTimed": "Ahora, {name}. {sets} series de {reps} segundos con {load}.",
  "vc.ten": "Diez segundos.",
  "vc.go": "A levantar.",
  "vc.pr": "Nueva mejor marca en {name}. Muy bien.",
  "vc.done": "Entrenamiento terminado. {sets} series. Buen trabajo.",
  "vc.doneMoved": "Entrenamiento terminado. {sets} series y {moved} movidos. Buen trabajo.",
  "vc.on": "Entrenador de voz activado. Te diré cada serie.",
};

export const fr: Partial<Record<Key, Message>> = {
  "vc.kilos": "{n} kilos",
  "vc.pounds": "{n} livres",
  "vc.bodyweight": "poids du corps",
  "vc.bodyweightPlus": "poids du corps plus {weight}",
  "vc.each": "{weight} chacun",
  "vc.what": "{load}, {reps} répétitions",
  "vc.whatTimed": "{load}, {reps} secondes",
  "vc.warmup": "Échauffement. {what}.",
  "vc.challenge": "Série défi. {what}, autant de bonnes répétitions que possible.",
  "vc.failure": "Allez près de l’échec.",
  "vc.reserve": "Gardez-en {n} en réserve.",
  "vc.last": "Dernière série. {what}. {effort}",
  "vc.set": "Série {n} sur {total}. {what}. {effort}",
  "vc.next": "À suivre, {name}. {sets} séries de {reps} à {load}.",
  "vc.nextTimed": "À suivre, {name}. {sets} séries de {reps} secondes à {load}.",
  "vc.ten": "Dix secondes.",
  "vc.go": "C’est parti.",
  "vc.pr": "Nouveau record sur {name}. Bravo.",
  "vc.done": "Séance terminée. {sets} séries. Beau travail.",
  "vc.doneMoved": "Séance terminée. {sets} séries, {moved} soulevés. Beau travail.",
  "vc.on": "Coach vocal activé. J’annoncerai chaque série.",
};
