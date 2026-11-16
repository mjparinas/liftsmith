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

export const de: Partial<Record<Key, Message>> = {
  "map.front": "Vorne",
  "map.back": "Hinten",
  "map.label": "Muskeln {side}",
  "map.muscle": "{muscle}: {pct} % erholt ({band})",
  "map.legend": "Legende",
  "map.figure": "3D-Körper, nach Erholung eingefärbt. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Zum Drehen ziehen. Tippe auf einen Muskel.",
  "map.pick": "Tippe auf einen Muskel am Körper oder unten, um zu sehen, was du damit machen kannst.",
  "map.view": "Ansicht",
  "map.byBand": "Muskeln nach Erholung",
  "map.close": "Schließen",
  "map.selected": "{muscle}, {pct} % erholt",
};

export const it: Partial<Record<Key, Message>> = {
  "map.front": "Davanti",
  "map.back": "Dietro",
  "map.label": "Muscoli ({side})",
  "map.muscle": "{muscle}: recupero al {pct}% ({band})",
  "map.legend": "Legenda",
  "map.figure": "Corpo 3D colorato in base al recupero. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Trascina per ruotare. Tocca un muscolo.",
  "map.pick": "Tocca un muscolo sul corpo, o uno qui sotto, per vedere cosa farne.",
  "map.view": "Vista",
  "map.byBand": "Muscoli per recupero",
  "map.close": "Chiudi",
  "map.selected": "{muscle}, recupero al {pct}%",
};

export const ja: Partial<Record<Key, Message>> = {
  "map.front": "前面",
  "map.back": "背面",
  "map.label": "{side}の筋肉",
  "map.muscle": "{muscle}：回復 {pct}%（{band}）",
  "map.legend": "凡例",
  "map.figure": "回復度で色分けした3Dの体。{summary}",
  "map.group": "{band}：{muscles}。",
  "map.turn": "ドラッグで回転。筋肉をタップ。",
  "map.pick": "体の筋肉か下の一覧をタップすると、どうすればいいかが表示されます。",
  "map.view": "表示",
  "map.byBand": "回復度別の筋肉",
  "map.close": "閉じる",
  "map.selected": "{muscle}、回復 {pct}%",
};

export const pt: Partial<Record<Key, Message>> = {
  "map.front": "Frente",
  "map.back": "Costas",
  "map.label": "Músculos: {side}",
  "map.muscle": "{muscle}: {pct}% recuperado ({band})",
  "map.legend": "Legenda",
  "map.figure": "Corpo 3D colorido pela recuperação. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Arraste para girar. Toque num músculo.",
  "map.pick": "Toque num músculo no corpo, ou num da lista abaixo, para ver o que fazer com ele.",
  "map.view": "Vista",
  "map.byBand": "Músculos por recuperação",
  "map.close": "Fechar",
  "map.selected": "{muscle}, {pct}% recuperado",
};

export const ko: Partial<Record<Key, Message>> = {
  "map.front": "앞면",
  "map.back": "뒷면",
  "map.label": "{side} 근육",
  "map.muscle": "{muscle}: {pct}% 회복({band})",
  "map.legend": "범례",
  "map.figure": "회복 상태로 색칠된 3D 인체. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "드래그해서 돌리고, 근육을 탭하세요.",
  "map.pick": "몸이나 아래 목록에서 근육을 탭하면 어떻게 하면 좋을지 볼 수 있어요.",
  "map.view": "보기",
  "map.byBand": "회복 상태별 근육",
  "map.close": "닫기",
  "map.selected": "{muscle}, {pct}% 회복",
};

export const tr: Partial<Record<Key, Message>> = {
  "map.front": "Ön",
  "map.back": "Arka",
  "map.label": "{side} kaslar",
  "map.muscle": "{muscle}: %{pct} toparlandı ({band})",
  "map.legend": "Açıklama",
  "map.figure": "Toparlanmaya göre renklendirilmiş 3B vücut. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Döndürmek için sürükle. Bir kasa dokun.",
  "map.pick": "Ne yapacağını görmek için vücuttaki bir kasa ya da aşağıdakilerden birine dokun.",
  "map.view": "Görünüm",
  "map.byBand": "Toparlanmaya göre kaslar",
  "map.close": "Kapat",
  "map.selected": "{muscle}, %{pct} toparlandı",
};

export const pl: Partial<Record<Key, Message>> = {
  "map.front": "Przód",
  "map.back": "Tył",
  "map.label": "Mięśnie: {side}",
  "map.muscle": "{muscle}: zregenerowane w {pct}% ({band})",
  "map.legend": "Legenda",
  "map.figure": "Sylwetka 3D pokolorowana według regeneracji. {summary}",
  "map.group": "{band}: {muscles}.",
  "map.turn": "Przeciągnij, żeby obrócić. Stuknij mięsień.",
  "map.pick": "Stuknij mięsień na sylwetce lub poniżej, żeby zobaczyć, co z nim zrobić.",
  "map.view": "Widok",
  "map.byBand": "Mięśnie według regeneracji",
  "map.close": "Zamknij",
  "map.selected": "{muscle}, zregenerowane w {pct}%",
};
