import type { Message } from "@/lib/i18n";

// Text for keys starting "tier.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "tier.bronze": "Bronze",
  "tier.silver": "Silver",
  "tier.gold": "Gold",
  "tier.platinum": "Platinum",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronce",
  "tier.silver": "Plata",
  "tier.gold": "Oro",
  "tier.platinum": "Platino",
};

export const fr: Partial<Record<Key, Message>> = {
  "tier.bronze": "Bronze",
  "tier.silver": "Argent",
  "tier.gold": "Or",
  "tier.platinum": "Platine",
};
