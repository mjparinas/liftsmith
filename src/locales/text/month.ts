import type { Message } from "@/lib/i18n";

// Text for keys starting "month.", in every language: the monthly challenge for everyone (src/lib/monthly.ts,
// MonthChallenge.tsx; docs/decisions/friends.md). English is the source: add a key here first.

export const en = {
  "month.title": "Challenge of the month",
  "month.goal.workouts": { one: "{month}: finish {count} workout", other: "{month}: finish {count} workouts" },
  "month.goal.sets": { one: "{month}: log {count} set", other: "{month}: log {count} sets" },
  "month.goal.minutes": { one: "{month}: train for {count} minute", other: "{month}: train for {count} minutes" },
  "month.unit.workouts": { one: "{count} workout", other: "{count} workouts" },
  "month.unit.sets": { one: "{count} set", other: "{count} sets" },
  "month.unit.minutes": { one: "{count} minute", other: "{count} minutes" },
  "month.left": { one: "{count} day left", other: "{count} days left" },
  "month.toGo": "{left} to go: about {per} a week finishes it.",
  "month.done": "Finished. The {month} medal is yours.",
  "month.everyone":
    "The same challenge for every lifter, new each month. Finishing earns that month's medal and counts toward the Monthly challenger badge.",
  "month.medals": "Medals",
  "month.medal": "{month}, finished",
  "month.friends": "Friends on this month’s challenge",
  "month.friendsHint": "From workouts posted to Friends, so it can trail what’s on your phone.",
  "month.finished": "Finished",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "month.title": "Reto del mes",
  "month.goal.workouts": { one: "{month}: termina {count} entrenamiento", other: "{month}: termina {count} entrenamientos" },
  "month.goal.sets": { one: "{month}: registra {count} serie", other: "{month}: registra {count} series" },
  "month.goal.minutes": { one: "{month}: entrena {count} minuto", other: "{month}: entrena {count} minutos" },
  "month.unit.workouts": { one: "{count} entrenamiento", other: "{count} entrenamientos" },
  "month.unit.sets": { one: "{count} serie", other: "{count} series" },
  "month.unit.minutes": { one: "{count} minuto", other: "{count} minutos" },
  "month.left": { one: "Queda {count} día", other: "Quedan {count} días" },
  "month.toGo": "Faltan {left}: con unos {per} por semana lo terminas.",
  "month.done": "Terminado. La medalla de {month} es tuya.",
  "month.everyone": "El mismo reto para todos, nuevo cada mes. Terminarlo te da la medalla del mes y cuenta para la insignia Reto del mes.",
  "month.medals": "Medallas",
  "month.medal": "{month}, terminado",
  "month.friends": "Amigos en el reto de este mes",
  "month.friendsHint": "Según los entrenamientos publicados en Amigos, así que puede ir por detrás de lo que hay en tu teléfono.",
  "month.finished": "Terminado",
};

export const fr: Partial<Record<Key, Message>> = {
  "month.title": "Défi du mois",
  "month.goal.workouts": { one: "{month} : terminez {count} séance", other: "{month} : terminez {count} séances" },
  "month.goal.sets": { one: "{month} : enregistrez {count} série", other: "{month} : enregistrez {count} séries" },
  "month.goal.minutes": { one: "{month} : entraînez-vous {count} minute", other: "{month} : entraînez-vous {count} minutes" },
  "month.unit.workouts": { one: "{count} séance", other: "{count} séances" },
  "month.unit.sets": { one: "{count} série", other: "{count} séries" },
  "month.unit.minutes": { one: "{count} minute", other: "{count} minutes" },
  "month.left": { one: "{count} jour restant", other: "{count} jours restants" },
  "month.toGo": "Encore {left} : environ {per} par semaine et c’est fait.",
  "month.done": "Terminé. La médaille de {month} est à vous.",
  "month.everyone":
    "Le même défi pour tout le monde, nouveau chaque mois. Le réussir vous donne la médaille du mois et compte pour le badge Défi du mois.",
  "month.medals": "Médailles",
  "month.medal": "{month}, réussi",
  "month.friends": "Vos amis sur le défi du mois",
  "month.friendsHint": "D’après les séances publiées dans Amis, donc parfois en retard sur votre téléphone.",
  "month.finished": "Réussi",
};

export const de: Partial<Record<Key, Message>> = {
  "month.title": "Challenge des Monats",
  "month.goal.workouts": { one: "{month}: {count} Training schaffen", other: "{month}: {count} Trainings schaffen" },
  "month.goal.sets": { one: "{month}: {count} Satz eintragen", other: "{month}: {count} Sätze eintragen" },
  "month.goal.minutes": { one: "{month}: {count} Minute trainieren", other: "{month}: {count} Minuten trainieren" },
  "month.unit.workouts": { one: "{count} Training", other: "{count} Trainings" },
  "month.unit.sets": { one: "{count} Satz", other: "{count} Sätze" },
  "month.unit.minutes": { one: "{count} Minute", other: "{count} Minuten" },
  "month.left": { one: "Noch {count} Tag", other: "Noch {count} Tage" },
  "month.toGo": "Noch {left}: mit etwa {per} pro Woche schaffst du es.",
  "month.done": "Geschafft. Die Medaille für {month} gehört dir.",
  "month.everyone":
    "Dieselbe Challenge für alle, jeden Monat neu. Wer sie schafft, bekommt die Medaille des Monats, und sie zählt für das Abzeichen Monatschallenge.",
  "month.medals": "Medaillen",
  "month.medal": "{month}, geschafft",
  "month.friends": "Freunde bei der Challenge des Monats",
  "month.friendsHint": "Aus den Trainings, die in Freunde gepostet wurden, daher manchmal hinter deinem Handy.",
  "month.finished": "Geschafft",
};

export const it: Partial<Record<Key, Message>> = {
  "month.title": "Sfida del mese",
  "month.goal.workouts": { one: "{month}: completa {count} allenamento", other: "{month}: completa {count} allenamenti" },
  "month.goal.sets": { one: "{month}: registra {count} serie", other: "{month}: registra {count} serie" },
  "month.goal.minutes": { one: "{month}: allenati per {count} minuto", other: "{month}: allenati per {count} minuti" },
  "month.unit.workouts": { one: "{count} allenamento", other: "{count} allenamenti" },
  "month.unit.sets": { one: "{count} serie", other: "{count} serie" },
  "month.unit.minutes": { one: "{count} minuto", other: "{count} minuti" },
  "month.left": { one: "Manca {count} giorno", other: "Mancano {count} giorni" },
  "month.toGo": "Ne mancano {left}: con circa {per} a settimana la completi.",
  "month.done": "Completata. La medaglia di {month} è tua.",
  "month.everyone":
    "La stessa sfida per tutti, nuova ogni mese. Completarla ti dà la medaglia del mese e conta per il badge Sfida del mese.",
  "month.medals": "Medaglie",
  "month.medal": "{month}, completata",
  "month.friends": "Amici nella sfida di questo mese",
  "month.friendsHint": "Dagli allenamenti pubblicati in Amici, quindi può restare indietro rispetto al telefono.",
  "month.finished": "Completata",
};

export const ja: Partial<Record<Key, Message>> = {
  "month.title": "今月のチャレンジ",
  "month.goal.workouts": { other: "{month}:ワークアウトを{count}回" },
  "month.goal.sets": { other: "{month}:{count}セットを記録" },
  "month.goal.minutes": { other: "{month}:{count}分トレーニング" },
  "month.unit.workouts": { other: "ワークアウト{count}回" },
  "month.unit.sets": { other: "{count}セット" },
  "month.unit.minutes": { other: "{count}分" },
  "month.left": { other: "残り{count}日" },
  "month.toGo": "あと{left}:週に{per}ほどで達成できます。",
  "month.done": "達成しました。{month}のメダルを獲得です。",
  "month.everyone":
    "毎月変わる、全員共通のチャレンジです。達成するとその月のメダルがもらえ、マンスリーチャレンジャーのバッジにも加算されます。",
  "month.medals": "メダル",
  "month.medal": "{month}、達成",
  "month.friends": "今月のチャレンジに挑む友達",
  "month.friendsHint": "フレンドに投稿されたワークアウトから集計するため、スマホの記録より遅れることがあります。",
  "month.finished": "達成",
};
