import type { Message } from "@/lib/i18n";

// Text for keys starting "buy.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "buy.title": "What to buy next",
  "buy.got": "I got them",
  "buy.have": "I have it",
  "buy.note": "Based on your plates, equipment and the weights you lift. No ads or sponsored picks.",
  "buy.pair": "A pair of {w} plates: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "jumps of {to} instead of {from}, so slow lifts like the press keep moving",
  "buy.more": { one: "{count} more weight you can load up to {hi}", other: "{count} more weights you can load up to {hi}" },
  "buy.room": "room past your current {max} limit",
  "buy.kit": { one: "{item}: {count} new exercise.", other: "{item}: {count} new exercises." },
  "buy.kitMuscles": { one: "{item}: {unlocks}, and the first loaded work for {count} muscle.", other: "{item}: {unlocks}, and the first loaded work for {count} muscles." },
  "buy.newEx": { one: "{count} new exercise", other: "{count} new exercises" },
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "buy.title": "Qué comprar ahora",
  "buy.got": "Ya los tengo",
  "buy.have": "Ya lo tengo",
  "buy.note": "Según tus discos, tu equipo y los pesos que levantas. Sin anuncios ni recomendaciones patrocinadas.",
  "buy.pair": "Un par de discos de {w}: {why}.",
  "buy.sep": "; ",
  "buy.jumps": "saltos de {to} en vez de {from}, para que los ejercicios lentos como el press sigan avanzando",
  "buy.more": { one: "{count} peso más que puedes cargar hasta {hi}", other: "{count} pesos más que puedes cargar hasta {hi}" },
  "buy.room": "margen por encima de tu límite actual de {max}",
  "buy.kit": { one: "{item}: {count} ejercicio nuevo.", other: "{item}: {count} ejercicios nuevos." },
  "buy.kitMuscles": { one: "{item}: {unlocks}, y el primer trabajo con carga para {count} músculo.", other: "{item}: {unlocks}, y el primer trabajo con carga para {count} músculos." },
  "buy.newEx": { one: "{count} ejercicio nuevo", other: "{count} ejercicios nuevos" },
};

export const fr: Partial<Record<Key, Message>> = {
  "buy.title": "Quoi acheter ensuite",
  "buy.got": "Je les ai",
  "buy.have": "Je l’ai",
  "buy.note": "D’après vos disques, votre matériel et les charges que vous soulevez. Pas de pub ni de choix sponsorisés.",
  "buy.pair": "Une paire de disques de {w} : {why}.",
  "buy.sep": " ; ",
  "buy.jumps": "des sauts de {to} au lieu de {from}, pour que les mouvements lents comme le développé militaire continuent de progresser",
  "buy.more": { one: "{count} charge de plus possible jusqu’à {hi}", other: "{count} charges de plus possibles jusqu’à {hi}" },
  "buy.room": "de la marge au-delà de votre limite actuelle de {max}",
  "buy.kit": { one: "{item} : {count} nouvel exercice.", other: "{item} : {count} nouveaux exercices." },
  "buy.kitMuscles": { one: "{item} : {unlocks}, et le premier travail chargé pour {count} muscle.", other: "{item} : {unlocks}, et le premier travail chargé pour {count} muscles." },
  "buy.newEx": { one: "{count} nouvel exercice", other: "{count} nouveaux exercices" },
};
