import type { Message } from "@/lib/i18n";

// Text for keys starting "cause.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cause.missed": "{missed} of your last {count} sets fell short of the target reps. The weight has got ahead of you.",
  "cause.hard": {
    one: "You rated it too hard {count} time since your last best.",
    other: "You rated it too hard {count} times since your last best.",
  },
  "cause.volume": "It's had about {sets} hard sets a week, against {want} for this block.",
  "cause.rest": "You've rested about {sec} seconds between sets, against {planned} planned.",
  "cause.readiness":
    "Your readiness has averaged {avg}, below the 50 baseline. Recovery may be the limit: sleep, food and stress count too.",
  "cause.sameReps": "Every session since your best has been in the same {lo}–{hi} rep range.",
  "cause.none": "Nothing in your data stands out. Effort, sets and rest all look fine, so a change of exercise is the best next step.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} de tus últimas {count} series se quedaron por debajo de las repeticiones objetivo. El peso te ha adelantado.",
  "cause.hard": {
    one: "Lo marcaste como demasiado duro {count} vez desde tu última mejor marca.",
    other: "Lo marcaste como demasiado duro {count} veces desde tu última mejor marca.",
  },
  "cause.volume": "Ha tenido unas {sets} series duras por semana, frente a {want} en este bloque.",
  "cause.rest": "Has descansado unos {sec} segundos entre series, frente a {planned} previstos.",
  "cause.readiness":
    "Tu preparación ha promediado {avg}, por debajo de la base de 50. El límite puede ser la recuperación: el sueño, la comida y el estrés también cuentan.",
  "cause.sameReps": "Todas las sesiones desde tu mejor marca han sido en el mismo rango de {lo}–{hi} repeticiones.",
  "cause.none":
    "Nada destaca en tus datos. Esfuerzo, series y descanso parecen correctos, así que cambiar de ejercicio es el mejor siguiente paso.",
};

export const fr: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} de vos {count} dernières séries sont restées sous les répétitions cibles. La charge vous a devancé.",
  "cause.hard": {
    one: "Vous l’avez jugé trop dur {count} fois depuis votre dernier record.",
    other: "Vous l’avez jugé trop dur {count} fois depuis votre dernier record.",
  },
  "cause.volume": "Il a eu environ {sets} séries difficiles par semaine, pour {want} prévues dans ce bloc.",
  "cause.rest": "Vous vous êtes reposé environ {sec} secondes entre les séries, pour {planned} prévues.",
  "cause.readiness":
    "Votre forme a été en moyenne de {avg}, sous la base de 50. La récupération peut être la limite : le sommeil, l’alimentation et le stress comptent aussi.",
  "cause.sameReps": "Chaque séance depuis votre record s’est faite dans la même fourchette de {lo} à {hi} répétitions.",
  "cause.none":
    "Rien ne ressort de vos données. Effort, séries et repos semblent corrects, donc changer d’exercice est la meilleure prochaine étape.",
};

export const de: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} deiner letzten {count} Sätze blieben unter den Ziel-Wiederholungen. Das Gewicht ist dir davongelaufen.",
  "cause.hard": {
    one: "Du hast es seit deiner letzten Bestleistung {count} Mal als zu schwer bewertet.",
    other: "Du hast es seit deiner letzten Bestleistung {count} Mal als zu schwer bewertet.",
  },
  "cause.volume": "Es hatte etwa {sets} harte Sätze pro Woche, gegenüber {want} für diesen Block.",
  "cause.rest": "Du hast zwischen den Sätzen etwa {sec} Sekunden pausiert, geplant waren {planned}.",
  "cause.readiness":
    "Deine Bereitschaft lag im Schnitt bei {avg}, unter dem Ausgangswert 50. Die Erholung könnte die Grenze sein: Schlaf, Ernährung und Stress zählen auch.",
  "cause.sameReps": "Jede Einheit seit deiner Bestleistung lag im selben Bereich von {lo}–{hi} Wiederholungen.",
  "cause.none":
    "In deinen Daten fällt nichts auf. Einsatz, Sätze und Pausen sehen gut aus, also ist ein Übungswechsel der beste nächste Schritt.",
};

export const it: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} delle tue ultime {count} serie sono rimaste sotto le ripetizioni previste. Il peso ti ha superato.",
  "cause.hard": {
    one: "L’hai valutato troppo duro {count} volta dal tuo ultimo record.",
    other: "L’hai valutato troppo duro {count} volte dal tuo ultimo record.",
  },
  "cause.volume": "Ha avuto circa {sets} serie impegnative a settimana, contro le {want} di questo blocco.",
  "cause.rest": "Hai riposato circa {sec} secondi tra le serie, contro i {planned} previsti.",
  "cause.readiness":
    "La tua prontezza è stata in media {avg}, sotto la base di 50. Il limite potrebbe essere il recupero: contano anche sonno, alimentazione e stress.",
  "cause.sameReps": "Ogni seduta dal tuo record è stata nello stesso intervallo di {lo}–{hi} ripetizioni.",
  "cause.none": "Nei tuoi dati non spicca nulla. Impegno, serie e riposo sembrano a posto, quindi cambiare esercizio è il passo migliore.",
};

export const ja: Partial<Record<Key, Message>> = {
  "cause.missed": "直近{count}セットのうち{missed}セットで目標レップに届きませんでした。重量が今の力を上回っています。",
  "cause.hard": { other: "前回のベスト以降、{count}回「きつすぎる」と評価しています。" },
  "cause.volume": "週あたりのハードセットは約{sets}で、このブロックの目安は{want}です。",
  "cause.rest": "セット間の休憩は約{sec}秒で、予定は{planned}でした。",
  "cause.readiness":
    "コンディションの平均は{avg}で、基準の50を下回っています。回復が限界かもしれません。睡眠、食事、ストレスも影響します。",
  "cause.sameReps": "ベスト以降のセッションはすべて同じ{lo}〜{hi}レップの範囲でした。",
  "cause.none": "データに目立った問題はありません。強度、セット数、休憩はどれも問題ないので、種目を変えるのが次の一手です。",
};
