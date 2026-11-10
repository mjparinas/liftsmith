import type { Message } from "@/lib/i18n";

// Text for keys starting "callText.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "callText.push": "Push day",
  "callText.push.blurb": "You're fresh. One rep closer to failure on your first lift.",
  "callText.normal": "Train as planned",
  "callText.normal.blurb": "Steady progress from last time.",
  "callText.recover": "Easy day",
  "callText.recover.blurb": "One set fewer and a step lighter, so you recover for next time.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "callText.push": "Día para apretar",
  "callText.push.blurb": "Estás fresco. Una repetición más cerca del fallo en tu primer ejercicio.",
  "callText.normal": "Según el plan",
  "callText.normal.blurb": "Progreso constante desde la última vez.",
  "callText.recover": "Día suave",
  "callText.recover.blurb": "Una serie menos y un escalón más ligero, para que te recuperes para la próxima.",
};

export const fr: Partial<Record<Key, Message>> = {
  "callText.push": "Jour pour pousser",
  "callText.push.blurb": "Vous êtes frais. Une répétition plus près de l’échec sur votre premier exercice.",
  "callText.normal": "Comme prévu",
  "callText.normal.blurb": "Une progression régulière depuis la dernière fois.",
  "callText.recover": "Jour tranquille",
  "callText.recover.blurb": "Une série de moins et un cran plus léger, pour bien récupérer d’ici la prochaine fois.",
};

export const de: Partial<Record<Key, Message>> = {
  "callText.push": "Push-Tag",
  "callText.push.blurb": "Du bist frisch. Bei deiner ersten Übung eine Wiederholung näher am Muskelversagen.",
  "callText.normal": "Wie geplant trainieren",
  "callText.normal.blurb": "Stetiger Fortschritt seit dem letzten Mal.",
  "callText.recover": "Lockerer Tag",
  "callText.recover.blurb": "Ein Satz weniger und etwas leichter, damit du dich fürs nächste Mal erholst.",
};

export const it: Partial<Record<Key, Message>> = {
  "callText.push": "Giorno da spingere",
  "callText.push.blurb": "Sei fresco. Una ripetizione più vicino al cedimento nel primo esercizio.",
  "callText.normal": "Allenati come previsto",
  "callText.normal.blurb": "Progressi costanti dall’ultima volta.",
  "callText.recover": "Giorno leggero",
  "callText.recover.blurb": "Una serie in meno e un po’ più leggero, così recuperi per la prossima volta.",
};

export const ja: Partial<Record<Key, Message>> = {
  "callText.push": "プッシュデー",
  "callText.push.blurb": "体は万全です。最初の種目は限界まであと1回近づけましょう。",
  "callText.normal": "予定どおりトレーニング",
  "callText.normal.blurb": "前回から着実に前進。",
  "callText.recover": "軽めの日",
  "callText.recover.blurb": "セットを1つ減らして少し軽めに。次回に向けて回復しましょう。",
};
