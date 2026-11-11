import type { Message } from "@/lib/i18n";

// Text for keys starting "buddy.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "buddy.crew": "crew",
  "buddy.hi": "Hey {who}! ",
  "buddy.at": "I'm at the gym. Your turn 💪",
  "buddy.atGym": "I'm at the gym at {gym}. Your turn 💪",
  "buddy.atFocus": "I'm at the gym, training {focus} today. Your turn 💪",
  "buddy.atGymFocus": "I'm at the gym at {gym}, training {focus} today. Your turn 💪",
  "buddy.shareTitle": "Tell your gym buddies",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "buddy.crew": "equipo",
  "buddy.hi": "¡Hola, {who}! ",
  "buddy.at": "Estoy en el gimnasio. Te toca 💪",
  "buddy.atGym": "Estoy en el gimnasio, en {gym}. Te toca 💪",
  "buddy.atFocus": "Estoy en el gimnasio, hoy toca {focus}. Te toca 💪",
  "buddy.atGymFocus": "Estoy en el gimnasio, en {gym}, hoy toca {focus}. Te toca 💪",
  "buddy.shareTitle": "Avisa a tus compañeros de gimnasio",
};

export const fr: Partial<Record<Key, Message>> = {
  "buddy.crew": "l’équipe",
  "buddy.hi": "Salut {who} ! ",
  "buddy.at": "Je suis à la salle. À ton tour 💪",
  "buddy.atGym": "Je suis à la salle, à {gym}. À ton tour 💪",
  "buddy.atFocus": "Je suis à la salle, au programme aujourd’hui : {focus}. À ton tour 💪",
  "buddy.atGymFocus": "Je suis à la salle, à {gym}, au programme aujourd’hui : {focus}. À ton tour 💪",
  "buddy.shareTitle": "Prévenez vos partenaires de salle",
};

export const de: Partial<Record<Key, Message>> = {
  "buddy.crew": "Crew",
  "buddy.hi": "Hey {who}!",
  "buddy.at": "Ich bin im Studio. Du bist dran 💪",
  "buddy.atGym": "Ich bin im Studio {gym}. Du bist dran 💪",
  "buddy.atFocus": "Ich bin im Studio und trainiere heute {focus}. Du bist dran 💪",
  "buddy.atGymFocus": "Ich bin im Studio {gym} und trainiere heute {focus}. Du bist dran 💪",
  "buddy.shareTitle": "Sag es deinen Trainingspartnern",
};

export const it: Partial<Record<Key, Message>> = {
  "buddy.crew": "squadra",
  "buddy.hi": "Ciao {who}!",
  "buddy.at": "Sono in palestra. Tocca a te 💪",
  "buddy.atGym": "Sono in palestra da {gym}. Tocca a te 💪",
  "buddy.atFocus": "Sono in palestra, oggi alleno {focus}. Tocca a te 💪",
  "buddy.atGymFocus": "Sono in palestra da {gym}, oggi alleno {focus}. Tocca a te 💪",
  "buddy.shareTitle": "Dillo ai tuoi compagni di palestra",
};

export const ja: Partial<Record<Key, Message>> = {
  "buddy.crew": "仲間",
  "buddy.hi": "{who}さん、",
  "buddy.at": "ジムに来たよ。次はあなたの番 💪",
  "buddy.atGym": "{gym}に来たよ。次はあなたの番 💪",
  "buddy.atFocus": "ジムで今日は{focus}をトレーニング中。次はあなたの番 💪",
  "buddy.atGymFocus": "{gym}で今日は{focus}をトレーニング中。次はあなたの番 💪",
  "buddy.shareTitle": "ジム仲間に知らせる",
};
