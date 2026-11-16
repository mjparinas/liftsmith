import type { Message } from "@/lib/i18n";

// Text for keys starting "notes.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "notes.title": "Coach's notes",
  "notes.done": "Done. Today's plan is updated",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "notes.title": "Notas del entrenador",
  "notes.done": "Hecho. El plan de hoy está actualizado",
};

export const fr: Partial<Record<Key, Message>> = {
  "notes.title": "Notes du coach",
  "notes.done": "C’est fait. Le plan du jour est à jour",
};

export const de: Partial<Record<Key, Message>> = {
  "notes.title": "Coach-Notizen",
  "notes.done": "Erledigt. Der heutige Plan ist aktualisiert",
};

export const it: Partial<Record<Key, Message>> = {
  "notes.title": "Note del coach",
  "notes.done": "Fatto. Il piano di oggi è aggiornato",
};

export const ja: Partial<Record<Key, Message>> = {
  "notes.title": "コーチのメモ",
  "notes.done": "完了。今日のプランを更新しました",
};

export const pt: Partial<Record<Key, Message>> = {
  "notes.title": "Notas do coach",
  "notes.done": "Pronto. O plano de hoje foi atualizado",
};

export const ko: Partial<Record<Key, Message>> = {
  "notes.title": "코치 노트",
  "notes.done": "완료. 오늘 계획을 업데이트했어요",
};

export const tr: Partial<Record<Key, Message>> = {
  "notes.title": "Koç notları",
  "notes.done": "Tamam. Bugünün planı güncellendi",
};

export const pl: Partial<Record<Key, Message>> = {
  "notes.title": "Notatki trenera",
  "notes.done": "Gotowe. Dzisiejszy plan jest zaktualizowany",
};
