import type { Message } from "@/lib/i18n";

// Text for keys starting "map.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "map.front": "Front",
  "map.back": "Back",
  "map.label": "{side} muscles",
  "map.muscle": "{muscle}: {pct}% recovered ({band})",
  "map.legend": "Legend",
  "map.figure": "3D body coloured by recovery. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Drag to turn. Tap a muscle.",
  "map.pick": "Tap a muscle on the body, or one below, to see what to do with it.",
  "map.view": "View",
  "map.byBand": "Muscles by recovery",
  "map.close": "Close",
  "map.selected": "{muscle}, {pct}% recovered",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "map.front": "Delante",
  "map.back": "Detrás",
  "map.label": "Músculos, {side}",
  "map.muscle": "{muscle}: {pct} % recuperado ({band})",
  "map.legend": "Leyenda",
  "map.figure": "Cuerpo en 3D coloreado por recuperación. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Arrastra para girar. Toca un músculo.",
  "map.pick": "Toca un músculo en el cuerpo, o uno de abajo, para ver qué hacer con él.",
  "map.view": "Vista",
  "map.byBand": "Músculos por recuperación",
  "map.close": "Cerrar",
  "map.selected": "{muscle}, {pct}% recuperado",
};

export const fr: Partial<Record<Key, Message>> = {
  "map.front": "Face",
  "map.back": "Dos",
  "map.label": "Muscles, {side}",
  "map.muscle": "{muscle} : {pct} % récupéré ({band})",
  "map.legend": "Légende",
  "map.figure": "Corps en 3D coloré selon la récupération. {summary}",
  "map.group": "{band} : {muscles}.",
  "map.turn": "Faites glisser pour tourner. Touchez un muscle.",
  "map.pick": "Touchez un muscle sur le corps, ou dans la liste, pour savoir quoi en faire.",
  "map.view": "Vue",
  "map.byBand": "Muscles par récupération",
  "map.close": "Fermer",
  "map.selected": "{muscle}, récupéré à {pct} %",
};
