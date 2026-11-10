import type { Message } from "@/lib/i18n";

// Text for keys starting "quest.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "quest.days": { one: "Train {n} day this week", other: "Train {n} days this week" },
  "quest.pr": "Set a personal record",
  "quest.new-ex": "Try an exercise you've never done",
  "quest.on-target": "Hit every target rep in a workout",
  "quest.sets": "Log {n} sets",
  "quest.legs": "Do a workout with legs in it",
  "quest.muscles": "Train {n} different muscles",
  "quest.reps": "Do {n} reps",
  "quest.rest": "Take the full rest before {n} sets",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "quest.days": { one: "Entrena {n} día esta semana", other: "Entrena {n} días esta semana" },
  "quest.pr": "Logra un récord personal",
  "quest.new-ex": "Prueba un ejercicio que nunca hayas hecho",
  "quest.on-target": "Cumple todas las repeticiones objetivo en un entrenamiento",
  "quest.sets": "Registra {n} series",
  "quest.legs": "Haz un entrenamiento con piernas",
  "quest.muscles": "Entrena {n} músculos distintos",
  "quest.reps": "Haz {n} repeticiones",
  "quest.rest": "Descansa el tiempo completo antes de {n} series",
};

export const fr: Partial<Record<Key, Message>> = {
  "quest.days": { one: "Entraînez-vous {n} jour cette semaine", other: "Entraînez-vous {n} jours cette semaine" },
  "quest.pr": "Battez un record personnel",
  "quest.new-ex": "Essayez un exercice jamais fait",
  "quest.on-target": "Atteignez toutes les répétitions cibles en une séance",
  "quest.sets": "Enregistrez {n} séries",
  "quest.legs": "Faites une séance avec des jambes",
  "quest.muscles": "Travaillez {n} muscles différents",
  "quest.reps": "Faites {n} répétitions",
  "quest.rest": "Prenez tout le repos avant {n} séries",
};

export const de: Partial<Record<Key, Message>> = {
  "quest.days": { one: "Trainiere diese Woche an {n} Tag", other: "Trainiere diese Woche an {n} Tagen" },
  "quest.pr": "Stelle einen persönlichen Rekord auf",
  "quest.new-ex": "Probiere eine Übung, die du noch nie gemacht hast",
  "quest.on-target": "Schaffe in einem Training jede Ziel-Wiederholung",
  "quest.sets": "Trage {n} Sätze ein",
  "quest.legs": "Mach ein Training mit Beinen",
  "quest.muscles": "Trainiere {n} verschiedene Muskeln",
  "quest.reps": "Mach {n} Wiederholungen",
  "quest.rest": "Halte vor {n} Sätzen die volle Pause ein",
};

export const it: Partial<Record<Key, Message>> = {
  "quest.days": { one: "Allenati {n} giorno questa settimana", other: "Allenati {n} giorni questa settimana" },
  "quest.pr": "Stabilisci un record personale",
  "quest.new-ex": "Prova un esercizio che non hai mai fatto",
  "quest.on-target": "Completa tutte le ripetizioni previste in un allenamento",
  "quest.sets": "Registra {n} serie",
  "quest.legs": "Fai un allenamento con le gambe",
  "quest.muscles": "Allena {n} muscoli diversi",
  "quest.reps": "Fai {n} ripetizioni",
  "quest.rest": "Fai il riposo completo prima di {n} serie",
};

export const ja: Partial<Record<Key, Message>> = {
  "quest.days": { other: "今週{n}日トレーニングする" },
  "quest.pr": "自己ベストを更新する",
  "quest.new-ex": "やったことのない種目に挑戦する",
  "quest.on-target": "1回のワークアウトで目標レップをすべて達成する",
  "quest.sets": "{n}セット記録する",
  "quest.legs": "脚を含むワークアウトをする",
  "quest.muscles": "{n}種類の筋肉を鍛える",
  "quest.reps": "{n}回レップする",
  "quest.rest": "{n}セットの前に休憩を最後まで取る",
};
