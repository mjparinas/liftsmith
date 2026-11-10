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
