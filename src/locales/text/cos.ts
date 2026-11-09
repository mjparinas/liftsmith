import type { Message } from "@/lib/i18n";

// Text for keys starting "cos.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cos.accent-blue": "Liftsmith blue",
  "cos.accent-teal": "Teal",
  "cos.accent-lime": "Lime",
  "cos.accent-violet": "Violet",
  "cos.accent-orange": "Ember",
  "cos.accent-pink": "Flamingo",
  "cos.accent-gold": "Gold rush",
  "cos.sound-classic": "Classic beeps",
  "cos.sound-chime": "Chime",
  "cos.sound-arcade": "Arcade",
  "cos.sound-gong": "Gong",
  "cos.plates-classic": "Competition colours",
  "cos.plates-black": "Matte black",
  "cos.plates-chrome": "Chrome",
  "cos.plates-neon": "Neon",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cos.accent-blue": "Azul Liftsmith",
  "cos.accent-teal": "Verde azulado",
  "cos.accent-lime": "Lima",
  "cos.accent-violet": "Violeta",
  "cos.accent-orange": "Brasa",
  "cos.accent-pink": "Flamenco",
  "cos.accent-gold": "Fiebre del oro",
  "cos.sound-classic": "Pitidos clásicos",
  "cos.sound-chime": "Campanilla",
  "cos.sound-arcade": "Arcade",
  "cos.sound-gong": "Gong",
  "cos.plates-classic": "Colores de competición",
  "cos.plates-black": "Negro mate",
  "cos.plates-chrome": "Cromo",
  "cos.plates-neon": "Neón",
};

export const fr: Partial<Record<Key, Message>> = {
  "cos.accent-blue": "Bleu Liftsmith",
  "cos.accent-teal": "Sarcelle",
  "cos.accent-lime": "Citron vert",
  "cos.accent-violet": "Violet",
  "cos.accent-orange": "Braise",
  "cos.accent-pink": "Flamant rose",
  "cos.accent-gold": "Ruée vers l’or",
  "cos.sound-classic": "Bips classiques",
  "cos.sound-chime": "Carillon",
  "cos.sound-arcade": "Arcade",
  "cos.sound-gong": "Gong",
  "cos.plates-classic": "Couleurs de compétition",
  "cos.plates-black": "Noir mat",
  "cos.plates-chrome": "Chrome",
  "cos.plates-neon": "Néon",
};
