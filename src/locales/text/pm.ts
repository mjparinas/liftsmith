import type { Message } from "@/lib/i18n";

// Text for keys starting "pm.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "pm.same": "Same plates: no change",
  "pm.offAdd": "Take off {off}, then add {add} {unit} each side",
  "pm.off": "Take off {off} {unit} each side",
  "pm.add": "Add {add} {unit} each side",
  "pm.offAddEnd": "Take off {off}, then add {add} {unit}",
  "pm.offEnd": "Take off {off} {unit}",
  "pm.addEnd": "Add {add} {unit}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pm.same": "Mismos discos: sin cambios",
  "pm.offAdd": "Quita {off} y luego pon {add} {unit} por lado",
  "pm.off": "Quita {off} {unit} por lado",
  "pm.add": "Pon {add} {unit} por lado",
  "pm.offAddEnd": "Quita {off} y luego pon {add} {unit}",
  "pm.offEnd": "Quita {off} {unit}",
  "pm.addEnd": "Pon {add} {unit}",
};

export const fr: Partial<Record<Key, Message>> = {
  "pm.same": "Mêmes disques : aucun changement",
  "pm.offAdd": "Retirez {off}, puis ajoutez {add} {unit} de chaque côté",
  "pm.off": "Retirez {off} {unit} de chaque côté",
  "pm.add": "Ajoutez {add} {unit} de chaque côté",
  "pm.offAddEnd": "Retirez {off}, puis ajoutez {add} {unit}",
  "pm.offEnd": "Retirez {off} {unit}",
  "pm.addEnd": "Ajoutez {add} {unit}",
};

export const de: Partial<Record<Key, Message>> = {
  "pm.same": "Gleiche Scheiben: keine Änderung",
  "pm.offAdd": "{off} abnehmen, dann {add} {unit} pro Seite auflegen",
  "pm.off": "{off} {unit} pro Seite abnehmen",
  "pm.add": "{add} {unit} pro Seite auflegen",
  "pm.offAddEnd": "{off} abnehmen, dann {add} {unit} auflegen",
  "pm.offEnd": "{off} {unit} abnehmen",
  "pm.addEnd": "{add} {unit} auflegen",
};

export const it: Partial<Record<Key, Message>> = {
  "pm.same": "Stessi dischi: nessun cambio",
  "pm.offAdd": "Togli {off}, poi aggiungi {add} {unit} per lato",
  "pm.off": "Togli {off} {unit} per lato",
  "pm.add": "Aggiungi {add} {unit} per lato",
  "pm.offAddEnd": "Togli {off}, poi aggiungi {add} {unit}",
  "pm.offEnd": "Togli {off} {unit}",
  "pm.addEnd": "Aggiungi {add} {unit}",
};

export const ja: Partial<Record<Key, Message>> = {
  "pm.same": "同じプレート：変更なし",
  "pm.offAdd": "{off}を外して、片側に{add} {unit}を追加",
  "pm.off": "片側から{off} {unit}を外す",
  "pm.add": "片側に{add} {unit}を追加",
  "pm.offAddEnd": "{off}を外して、{add} {unit}を追加",
  "pm.offEnd": "{off} {unit}を外す",
  "pm.addEnd": "{add} {unit}を追加",
};

export const pt: Partial<Record<Key, Message>> = {
  "pm.same": "Mesmas anilhas: nada muda",
  "pm.offAdd": "Tire {off}, depois coloque {add} {unit} de cada lado",
  "pm.off": "Tire {off} {unit} de cada lado",
  "pm.add": "Coloque {add} {unit} de cada lado",
  "pm.offAddEnd": "Tire {off}, depois coloque {add} {unit}",
  "pm.offEnd": "Tire {off} {unit}",
  "pm.addEnd": "Coloque {add} {unit}",
};

export const ko: Partial<Record<Key, Message>> = {
  "pm.same": "원판 그대로: 변경 없음",
  "pm.offAdd": "한쪽당 {off} 빼고 {add} {unit} 추가",
  "pm.off": "한쪽당 {off} {unit} 빼기",
  "pm.add": "한쪽당 {add} {unit} 추가",
  "pm.offAddEnd": "{off} 빼고 {add} {unit} 추가",
  "pm.offEnd": "{off} {unit} 빼기",
  "pm.addEnd": "{add} {unit} 추가",
};

export const tr: Partial<Record<Key, Message>> = {
  "pm.same": "Aynı plakalar: değişiklik yok",
  "pm.offAdd": "Her yandan {off} çıkar, sonra {add} {unit} ekle",
  "pm.off": "Her yandan {off} {unit} çıkar",
  "pm.add": "Her yana {add} {unit} ekle",
  "pm.offAddEnd": "{off} çıkar, sonra {add} {unit} ekle",
  "pm.offEnd": "{off} {unit} çıkar",
  "pm.addEnd": "{add} {unit} ekle",
};

export const pl: Partial<Record<Key, Message>> = {
  "pm.same": "Te same talerze: bez zmian",
  "pm.offAdd": "Zdejmij {off}, potem dodaj {add} {unit} z każdej strony",
  "pm.off": "Zdejmij {off} {unit} z każdej strony",
  "pm.add": "Dodaj {add} {unit} z każdej strony",
  "pm.offAddEnd": "Zdejmij {off}, potem dodaj {add} {unit}",
  "pm.offEnd": "Zdejmij {off} {unit}",
  "pm.addEnd": "Dodaj {add} {unit}",
};
