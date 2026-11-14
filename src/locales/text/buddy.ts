import type { Message } from "@/lib/i18n";

// Text for keys starting "buddy.", in every language: a friend's check-in as the toast shows it (src/lib/buddy.ts).
// English is the source.

export const en = {
  "buddy.at": "{name} is at the gym. Your turn 💪",
  "buddy.atGym": "{name} is at {gym}. Your turn 💪",
  "buddy.atFocus": "{name} is at the gym, training {focus} today. Your turn 💪",
  "buddy.atGymFocus": "{name} is at {gym}, training {focus} today. Your turn 💪",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "buddy.at": "{name} está en el gimnasio. Te toca 💪",
  "buddy.atGym": "{name} está en {gym}. Te toca 💪",
  "buddy.atFocus": "{name} está en el gimnasio, hoy toca {focus}. Te toca 💪",
  "buddy.atGymFocus": "{name} está en {gym}, hoy toca {focus}. Te toca 💪",
};

export const fr: Partial<Record<Key, Message>> = {
  "buddy.at": "{name} est à la salle. À toi de jouer 💪",
  "buddy.atGym": "{name} est à {gym}. À toi de jouer 💪",
  "buddy.atFocus": "{name} est à la salle, au programme aujourd’hui : {focus}. À toi de jouer 💪",
  "buddy.atGymFocus": "{name} est à {gym}, au programme aujourd’hui : {focus}. À toi de jouer 💪",
};

export const de: Partial<Record<Key, Message>> = {
  "buddy.at": "{name} ist im Studio. Du bist dran 💪",
  "buddy.atGym": "{name} ist im Studio {gym}. Du bist dran 💪",
  "buddy.atFocus": "{name} ist im Studio und trainiert heute {focus}. Du bist dran 💪",
  "buddy.atGymFocus": "{name} ist im Studio {gym} und trainiert heute {focus}. Du bist dran 💪",
};

export const it: Partial<Record<Key, Message>> = {
  "buddy.at": "{name} è in palestra. Tocca a te 💪",
  "buddy.atGym": "{name} è in palestra da {gym}. Tocca a te 💪",
  "buddy.atFocus": "{name} è in palestra, oggi allena {focus}. Tocca a te 💪",
  "buddy.atGymFocus": "{name} è in palestra da {gym}, oggi allena {focus}. Tocca a te 💪",
};

export const ja: Partial<Record<Key, Message>> = {
  "buddy.at": "{name}さんがジムに来ました。次はあなたの番 💪",
  "buddy.atGym": "{name}さんが{gym}に来ました。次はあなたの番 💪",
  "buddy.atFocus": "{name}さんが今日はジムで{focus}をトレーニング中。次はあなたの番 💪",
  "buddy.atGymFocus": "{name}さんが今日は{gym}で{focus}をトレーニング中。次はあなたの番 💪",
};
