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

export const de: Partial<Record<Key, Message>> = {
  "pm.same": "Gleiche Scheiben: keine Änderung",
  "pm.offAdd": "{off} abnehmen, dann {add} {unit} pro Seite auflegen",
  "pm.off": "{off} {unit} pro Seite abnehmen",
  "pm.add": "{add} {unit} pro Seite auflegen",
};

export const it: Partial<Record<Key, Message>> = {
  "pm.same": "Stessi dischi: nessun cambio",
  "pm.offAdd": "Togli {off}, poi aggiungi {add} {unit} per lato",
  "pm.off": "Togli {off} {unit} per lato",
  "pm.add": "Aggiungi {add} {unit} per lato",
};

export const ja: Partial<Record<Key, Message>> = {
  "pm.same": "同じプレート：変更なし",
  "pm.offAdd": "{off}を外して、片側に{add} {unit}を追加",
  "pm.off": "片側から{off} {unit}を外す",
  "pm.add": "片側に{add} {unit}を追加",
};
