import type { Message } from "@/lib/i18n";

// Text for keys starting "msgKind.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "msgKind.reminder": "Workout reminders",
  "msgKind.reminder.blurb": "On your training days at your workout time. By email, one note on Monday with your week.",
  "msgKind.missed": "Missed workouts",
  "msgKind.missed.blurb": "A nudge the day after a missed training day, and a check-in if a week goes by.",
  "msgKind.streak": "Streak alerts",
  "msgKind.streak.blurb": "When this week's goal is still reachable but only just.",
  "msgKind.milestone": "Milestones",
  "msgKind.milestone.blurb": "Your first workout, and streaks of 4, 8, 12, 26 and 52 weeks.",
  "msgKind.pro": "Pro trial and offers",
  "msgKind.pro.blurb": "When your trial is about to end, and now and then what Pro adds. Never more than one every two weeks.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "msgKind.reminder": "Recordatorios de entrenamiento",
  "msgKind.reminder.blurb": "En tus días de entrenamiento, a la hora de tu entrenamiento. Por correo, una nota el lunes con tu semana.",
  "msgKind.missed": "Entrenamientos perdidos",
  "msgKind.missed.blurb": "Un aviso el día después de un día de entrenamiento perdido, y un mensaje si pasa una semana.",
  "msgKind.streak": "Avisos de racha",
  "msgKind.streak.blurb": "Cuando el objetivo de la semana todavía se puede cumplir, pero por poco.",
  "msgKind.milestone": "Hitos",
  "msgKind.milestone.blurb": "Tu primer entrenamiento y rachas de 4, 8, 12, 26 y 52 semanas.",
  "msgKind.pro": "Prueba de Pro y ofertas",
  "msgKind.pro.blurb": "Cuando tu prueba está a punto de acabar y, de vez en cuando, lo que añade Pro. Nunca más de uno cada dos semanas.",
};

export const fr: Partial<Record<Key, Message>> = {
  "msgKind.reminder": "Rappels de séance",
  "msgKind.reminder.blurb": "Vos jours d’entraînement, à l’heure de votre séance. Par e-mail, une note le lundi avec votre semaine.",
  "msgKind.missed": "Séances manquées",
  "msgKind.missed.blurb": "Un petit rappel le lendemain d’un jour d’entraînement manqué, et un message si une semaine passe.",
  "msgKind.streak": "Alertes de série",
  "msgKind.streak.blurb": "Quand l’objectif de la semaine est encore atteignable, mais de justesse.",
  "msgKind.milestone": "Étapes",
  "msgKind.milestone.blurb": "Votre première séance, et des séries de 4, 8, 12, 26 et 52 semaines.",
  "msgKind.pro": "Essai Pro et offres",
  "msgKind.pro.blurb":
    "Quand votre essai se termine bientôt, et de temps en temps ce qu’apporte Pro. Jamais plus d’un toutes les deux semaines.",
};

export const de: Partial<Record<Key, Message>> = {
  "msgKind.reminder": "Trainingserinnerungen",
  "msgKind.reminder.blurb": "An deinen Trainingstagen zu deiner Trainingszeit. Per E-Mail eine Nachricht am Montag mit deiner Woche.",
  "msgKind.missed": "Verpasste Trainings",
  "msgKind.missed.blurb": "Ein Stups am Tag nach einem verpassten Trainingstag und eine Nachfrage, wenn eine Woche vergeht.",
  "msgKind.streak": "Serien-Hinweise",
  "msgKind.streak.blurb": "Wenn das Wochenziel noch zu schaffen ist, aber nur knapp.",
  "msgKind.milestone": "Meilensteine",
  "msgKind.milestone.blurb": "Dein erstes Training und Serien von 4, 8, 12, 26 und 52 Wochen.",
  "msgKind.pro": "Pro-Testphase und Angebote",
  "msgKind.pro.blurb": "Wenn deine Testphase bald endet und ab und zu, was Pro bietet. Nie öfter als einmal in zwei Wochen.",
};

export const it: Partial<Record<Key, Message>> = {
  "msgKind.reminder": "Promemoria di allenamento",
  "msgKind.reminder.blurb":
    "Nei tuoi giorni di allenamento all’ora dell’allenamento. Via email, un messaggio il lunedì con la tua settimana.",
  "msgKind.missed": "Allenamenti saltati",
  "msgKind.missed.blurb": "Una spinta il giorno dopo un allenamento saltato, e un saluto se passa una settimana.",
  "msgKind.streak": "Avvisi sulla serie",
  "msgKind.streak.blurb": "Quando l’obiettivo della settimana è ancora raggiungibile, ma per poco.",
  "msgKind.milestone": "Traguardi",
  "msgKind.milestone.blurb": "Il tuo primo allenamento e le serie di 4, 8, 12, 26 e 52 settimane.",
  "msgKind.pro": "Prova Pro e offerte",
  "msgKind.pro.blurb": "Quando la prova sta per finire e, ogni tanto, cosa aggiunge Pro. Mai più di una ogni due settimane.",
};

export const ja: Partial<Record<Key, Message>> = {
  "msgKind.reminder": "ワークアウトのリマインダー",
  "msgKind.reminder.blurb": "トレーニング日のワークアウト時刻にお知らせ。メールでは月曜日に1週間分をまとめて1通。",
  "msgKind.missed": "逃したワークアウト",
  "msgKind.missed.blurb": "トレーニング日を逃した翌日にひと声、1週間空いたら様子をうかがいます。",
  "msgKind.streak": "連続記録のお知らせ",
  "msgKind.streak.blurb": "今週の目標がぎりぎり達成できるときに。",
  "msgKind.milestone": "マイルストーン",
  "msgKind.milestone.blurb": "初めてのワークアウトと、4・8・12・26・52週の連続記録。",
  "msgKind.pro": "Pro のお試しとお得な情報",
  "msgKind.pro.blurb": "お試し期間の終了前と、ときどき Pro でできること。2週間に1回まで。",
};
