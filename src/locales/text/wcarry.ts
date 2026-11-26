import type { Message } from "@/lib/i18n";

// Text for keys starting "wcarry.": phone-free workouts on the watch (workout/watchCarry.ts, WatchCarry.ts), in every
// language. English is the source. The watches show these as the phone sends them.

export const en = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Tap Finish to save it",
  "wcarry.saved": { one: "Workout from your watch saved: {count} set.", other: "Workout from your watch saved: {count} sets." },
};

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Toca Terminar para guardarlo",
  "wcarry.saved": { one: "Entrenamiento del reloj guardado: {count} serie.", other: "Entrenamiento del reloj guardado: {count} series." },
};

export const fr: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Touchez Terminer pour l’enregistrer",
  "wcarry.saved": { one: "Séance de la montre enregistrée : {count} série.", other: "Séance de la montre enregistrée : {count} séries." },
};

export const de: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Tippe auf Beenden, um es zu speichern",
  "wcarry.saved": { one: "Training von der Uhr gespeichert: {count} Satz.", other: "Training von der Uhr gespeichert: {count} Sätze." },
};

export const it: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Tocca Fine per salvarlo",
  "wcarry.saved": { one: "Allenamento dall’orologio salvato: {count} serie.", other: "Allenamento dall’orologio salvato: {count} serie." },
};

export const ja: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "秒",
  "wcarry.finishToSave": "「終了」をタップして保存",
  "wcarry.saved": { other: "ウォッチのワークアウトを保存しました：{count}セット" },
};

export const pt: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Toque em Concluir para salvar",
  "wcarry.saved": { one: "Treino do relógio salvo: {count} série.", other: "Treino do relógio salvo: {count} séries." },
};

export const ko: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "초",
  "wcarry.finishToSave": "완료를 탭해 저장하세요",
  "wcarry.saved": { other: "워치 운동을 저장했어요: {count}세트" },
};

export const tr: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "sn",
  "wcarry.finishToSave": "Kaydetmek için Bitir'e dokun",
  "wcarry.saved": { one: "Saatten antrenman kaydedildi: {count} set.", other: "Saatten antrenman kaydedildi: {count} set." },
};

export const pl: Partial<Record<Key, Message>> = {
  "wcarry.seconds": "s",
  "wcarry.finishToSave": "Dotknij Zakończ, aby zapisać",
  "wcarry.saved": {
    one: "Zapisano trening z zegarka: {count} seria.",
    few: "Zapisano trening z zegarka: {count} serie.",
    many: "Zapisano trening z zegarka: {count} serii.",
    other: "Zapisano trening z zegarka: {count} serii.",
  },
};
