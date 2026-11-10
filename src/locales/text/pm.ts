import type { Message } from "@/lib/i18n";

// Text for keys starting "pm.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "pm.same": "Same plates: no change",
  "pm.offAdd": "Take off {off}, then add {add} {unit} each side",
  "pm.off": "Take off {off} {unit} each side",
  "pm.add": "Add {add} {unit} each side",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pm.same": "Mismos discos: sin cambios",
  "pm.offAdd": "Quita {off} y luego pon {add} {unit} por lado",
  "pm.off": "Quita {off} {unit} por lado",
  "pm.add": "Pon {add} {unit} por lado",
};

export const fr: Partial<Record<Key, Message>> = {
  "pm.same": "Mêmes disques : aucun changement",
  "pm.offAdd": "Retirez {off}, puis ajoutez {add} {unit} de chaque côté",
  "pm.off": "Retirez {off} {unit} de chaque côté",
  "pm.add": "Ajoutez {add} {unit} de chaque côté",
};
