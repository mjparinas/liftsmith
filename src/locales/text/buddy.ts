import type { Message } from "@/lib/i18n";

// Text for keys starting "buddy.", in every language: the check-in message sent to a coach in Liftsmith's messages
// (src/lib/buddy.ts). English is the source.

export const en = {
  "buddy.hi": "Hi {who}! ",
  "buddy.at": "I'm at the gym.",
  "buddy.atGym": "I'm at the gym at {gym}.",
  "buddy.atFocus": "I'm at the gym, training {focus} today.",
  "buddy.atGymFocus": "I'm at the gym at {gym}, training {focus} today.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "buddy.hi": "¡Hola, {who}! ",
  "buddy.at": "Estoy en el gimnasio.",
  "buddy.atGym": "Estoy en el gimnasio, en {gym}.",
  "buddy.atFocus": "Estoy en el gimnasio, hoy toca {focus}.",
  "buddy.atGymFocus": "Estoy en el gimnasio, en {gym}, hoy toca {focus}.",
};

export const fr: Partial<Record<Key, Message>> = {
  "buddy.hi": "Salut {who} ! ",
  "buddy.at": "Je suis à la salle.",
  "buddy.atGym": "Je suis à la salle, à {gym}.",
  "buddy.atFocus": "Je suis à la salle, au programme aujourd’hui : {focus}.",
  "buddy.atGymFocus": "Je suis à la salle, à {gym}, au programme aujourd’hui : {focus}.",
};

export const de: Partial<Record<Key, Message>> = {
  "buddy.hi": "Hey {who}! ",
  "buddy.at": "Ich bin im Studio.",
  "buddy.atGym": "Ich bin im Studio {gym}.",
  "buddy.atFocus": "Ich bin im Studio und trainiere heute {focus}.",
  "buddy.atGymFocus": "Ich bin im Studio {gym} und trainiere heute {focus}.",
};

export const it: Partial<Record<Key, Message>> = {
  "buddy.hi": "Ciao {who}! ",
  "buddy.at": "Sono in palestra.",
  "buddy.atGym": "Sono in palestra da {gym}.",
  "buddy.atFocus": "Sono in palestra, oggi alleno {focus}.",
  "buddy.atGymFocus": "Sono in palestra da {gym}, oggi alleno {focus}.",
};

export const ja: Partial<Record<Key, Message>> = {
  "buddy.hi": "{who}さん、",
  "buddy.at": "ジムに来ました。",
  "buddy.atGym": "{gym}に来ました。",
  "buddy.atFocus": "ジムで今日は{focus}をトレーニングします。",
  "buddy.atGymFocus": "{gym}で今日は{focus}をトレーニングします。",
};
