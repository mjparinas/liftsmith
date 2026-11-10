import type { Message } from "@/lib/i18n";

// Text for keys starting "game.": the game card on Today (streak at risk, this week's quests, the closest
// badge), in every language. English is the source.

export const en = {
  "game.freezeSaves": {
    one: "🧊 This week's goal is out of reach. A freeze will save your {count}-week streak.",
    other: "🧊 This week's goal is out of reach. A freeze will save your {count}-week streak.",
  },
  "game.streakResets": {
    one: "🔥 This week's goal is out of reach, so your {count}-week streak starts again on Monday. Every 4 goal weeks earns a freeze.",
    other: "🔥 This week's goal is out of reach, so your {count}-week streak starts again on Monday. Every 4 goal weeks earns a freeze.",
  },
  "game.thisWeek": "This week",
  "game.almost": "Almost there:",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "🧊 El objetivo de esta semana ya no se puede cumplir. Un congelador salvará tu racha de {count} semana.",
    other: "🧊 El objetivo de esta semana ya no se puede cumplir. Un congelador salvará tu racha de {count} semanas.",
  },
  "game.streakResets": {
    one: "🔥 El objetivo de esta semana ya no se puede cumplir, así que tu racha de {count} semana vuelve a empezar el lunes. Cada 4 semanas con el objetivo cumplido ganas un congelador.",
    other:
      "🔥 El objetivo de esta semana ya no se puede cumplir, así que tu racha de {count} semanas vuelve a empezar el lunes. Cada 4 semanas con el objetivo cumplido ganas un congelador.",
  },
  "game.thisWeek": "Esta semana",
  "game.almost": "Casi lo tienes:",
};

export const fr: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "🧊 L’objectif de cette semaine est hors de portée. Un gel sauvera votre série de {count} semaine.",
    other: "🧊 L’objectif de cette semaine est hors de portée. Un gel sauvera votre série de {count} semaines.",
  },
  "game.streakResets": {
    one: "🔥 L’objectif de cette semaine est hors de portée, votre série de {count} semaine repart donc à zéro lundi. Chaque tranche de 4 semaines d’objectif atteint vous rapporte un gel.",
    other:
      "🔥 L’objectif de cette semaine est hors de portée, votre série de {count} semaines repart donc à zéro lundi. Chaque tranche de 4 semaines d’objectif atteint vous rapporte un gel.",
  },
  "game.thisWeek": "Cette semaine",
  "game.almost": "Presque :",
};
