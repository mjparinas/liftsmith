import type { Message } from "@/lib/i18n";

// Text for keys starting "pr.": personal record moments (the banner during a workout, the "PR in reach"
// line on the rest card, and the PR replay on the summary), in every language. English is the source.

export const en = {
  "pr.banner": "New personal record",
  "pr.isNew": "🏆 {reps} reps at {weight} is a new PR.",
  "pr.inReach": "🏆 PR in reach: {reps} reps at {weight} beats your best.",
  "pr.replay": "▶ Replay {name}",
  "pr.replayTitle": "PR replay",
  "pr.newBest": "New personal best",
  "pr.demoLabel": "New best: {weight} × {reps}",
  "pr.allReps": { one: "{count} rep. Every one of them yours.", other: "{count} reps. Every one of them yours." },
  "pr.rep": "Rep {n}",
  "pr.estMax": "Estimated max now {weight}",
  "pr.again": "Play again",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pr.banner": "Nueva mejor marca",
  "pr.isNew": "🏆 {reps} repeticiones con {weight} es una nueva mejor marca.",
  "pr.inReach": "🏆 Mejor marca a tu alcance: {reps} repeticiones con {weight} superan tu récord.",
  "pr.replay": "▶ Repetir {name}",
  "pr.replayTitle": "Repetición de tu mejor marca",
  "pr.newBest": "Nueva mejor marca",
  "pr.demoLabel": "Nueva mejor marca: {weight} × {reps}",
  "pr.allReps": { one: "{count} repetición. Toda tuya.", other: "{count} repeticiones. Todas tuyas." },
  "pr.rep": "Repetición {n}",
  "pr.estMax": "Máximo estimado ahora {weight}",
  "pr.again": "Ver otra vez",
};

export const fr: Partial<Record<Key, Message>> = {
  "pr.banner": "Nouveau record personnel",
  "pr.isNew": "🏆 {reps} répétitions à {weight}, c’est un nouveau record.",
  "pr.inReach": "🏆 Record à portée : {reps} répétitions à {weight} battent votre meilleur.",
  "pr.replay": "▶ Revoir {name}",
  "pr.replayTitle": "Revoir le record",
  "pr.newBest": "Nouveau record personnel",
  "pr.demoLabel": "Nouveau record : {weight} × {reps}",
  "pr.allReps": { one: "{count} répétition. Elle est toute à vous.", other: "{count} répétitions. Chacune est à vous." },
  "pr.rep": "Répétition {n}",
  "pr.estMax": "Max estimé maintenant {weight}",
  "pr.again": "Revoir",
};
