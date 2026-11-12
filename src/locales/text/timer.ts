import type { Message } from "@/lib/i18n";

// Text for keys starting "timer.": the set timer for holds, carries, hangs and cardio, in every language. English is the source.

export const en = {
  "timer.start": "Start timer · {time}",
  "timer.startSides": "Start timer · {time} a side",
  "timer.startUp": "Start the clock",
  "timer.getSet": "Get set",
  "timer.left": "Time left",
  "timer.side1": "First side",
  "timer.side2": "Second side",
  "timer.switch": "Switch sides",
  "timer.target": "Target {time}",
  "timer.logNote": "Log set saves {time}",
  "timer.logPlan": "Log set saves the planned time",
  "timer.cancel": "Cancel",
  "timer.cancelLabel": "Cancel the timer without logging the set",
  "timer.over": "Time’s up",
  "timer.vc.switch": "Switch sides.",
};

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "timer.start": "Iniciar temporizador · {time}",
  "timer.startSides": "Iniciar temporizador · {time} por lado",
  "timer.startUp": "Poner el reloj en marcha",
  "timer.getSet": "Prepárate",
  "timer.left": "Tiempo restante",
  "timer.side1": "Primer lado",
  "timer.side2": "Segundo lado",
  "timer.switch": "Cambia de lado",
  "timer.target": "Objetivo {time}",
  "timer.logNote": "Registrar serie guarda {time}",
  "timer.logPlan": "Registrar serie guarda el tiempo previsto",
  "timer.cancel": "Cancelar",
  "timer.cancelLabel": "Cancelar el temporizador sin registrar la serie",
  "timer.over": "Se acabó el tiempo",
  "timer.vc.switch": "Cambia de lado.",
};

export const fr: Partial<Record<Key, Message>> = {
  "timer.start": "Lancer le minuteur · {time}",
  "timer.startSides": "Lancer le minuteur · {time} par côté",
  "timer.startUp": "Lancer le chrono",
  "timer.getSet": "En place",
  "timer.left": "Temps restant",
  "timer.side1": "Premier côté",
  "timer.side2": "Second côté",
  "timer.switch": "Change de côté",
  "timer.target": "Objectif {time}",
  "timer.logNote": "Valider la série enregistre {time}",
  "timer.logPlan": "Valider la série enregistre le temps prévu",
  "timer.cancel": "Annuler",
  "timer.cancelLabel": "Annuler le minuteur sans enregistrer la série",
  "timer.over": "Temps écoulé",
  "timer.vc.switch": "Change de côté.",
};

export const de: Partial<Record<Key, Message>> = {
  "timer.start": "Timer starten · {time}",
  "timer.startSides": "Timer starten · {time} pro Seite",
  "timer.startUp": "Uhr starten",
  "timer.getSet": "Bereit machen",
  "timer.left": "Restzeit",
  "timer.side1": "Erste Seite",
  "timer.side2": "Zweite Seite",
  "timer.switch": "Seite wechseln",
  "timer.target": "Ziel {time}",
  "timer.logNote": "Satz eintragen speichert {time}",
  "timer.logPlan": "Satz eintragen speichert die geplante Zeit",
  "timer.cancel": "Abbrechen",
  "timer.cancelLabel": "Timer abbrechen, ohne den Satz einzutragen",
  "timer.over": "Zeit um",
  "timer.vc.switch": "Seite wechseln.",
};

export const it: Partial<Record<Key, Message>> = {
  "timer.start": "Avvia il timer · {time}",
  "timer.startSides": "Avvia il timer · {time} per lato",
  "timer.startUp": "Avvia il cronometro",
  "timer.getSet": "Preparati",
  "timer.left": "Tempo rimasto",
  "timer.side1": "Primo lato",
  "timer.side2": "Secondo lato",
  "timer.switch": "Cambia lato",
  "timer.target": "Obiettivo {time}",
  "timer.logNote": "Registra serie salva {time}",
  "timer.logPlan": "Registra serie salva il tempo previsto",
  "timer.cancel": "Annulla",
  "timer.cancelLabel": "Annulla il timer senza registrare la serie",
  "timer.over": "Tempo scaduto",
  "timer.vc.switch": "Cambia lato.",
};

export const ja: Partial<Record<Key, Message>> = {
  "timer.start": "タイマー開始・{time}",
  "timer.startSides": "タイマー開始・片側{time}",
  "timer.startUp": "計測を開始",
  "timer.getSet": "準備",
  "timer.left": "残り時間",
  "timer.side1": "1側目",
  "timer.side2": "2側目",
  "timer.switch": "反対側へ",
  "timer.target": "目標 {time}",
  "timer.logNote": "セットを記録で{time}を保存します",
  "timer.logPlan": "セットを記録で予定の時間を保存します",
  "timer.cancel": "キャンセル",
  "timer.cancelLabel": "セットを記録せずにタイマーをキャンセル",
  "timer.over": "時間です",
  "timer.vc.switch": "反対側に替えてください。",
};
