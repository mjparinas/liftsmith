import type { Message } from "@/lib/i18n";

// Text for keys starting "today.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "today.morning": "Good morning",
  "today.afternoon": "Good afternoon",
  "today.evening": "Good evening",
  "today.hello": "{greeting}, {name}",
  "today.start": "Start workout",
  "today.trainingAround": "Training around: {parts}",
  "today.somethingHurts": "Something hurts?",
  "today.goalMore": { one: "{count} more this week for your goal", other: "{count} more this week for your goal" },
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "today.morning": "Buenos días",
  "today.afternoon": "Buenas tardes",
  "today.evening": "Buenas noches",
  "today.hello": "{greeting}, {name}",
  "today.start": "Empezar entrenamiento",
  "today.trainingAround": "Entrenando con cuidado de: {parts}",
  "today.somethingHurts": "¿Te duele algo?",
  "today.goalMore": { one: "{count} más esta semana para tu objetivo", other: "{count} más esta semana para tu objetivo" },
};

export const fr: Partial<Record<Key, Message>> = {
  "today.morning": "Bonjour",
  "today.afternoon": "Bon après-midi",
  "today.evening": "Bonsoir",
  "today.hello": "{greeting}, {name}",
  "today.start": "Commencer la séance",
  "today.trainingAround": "Entraînement adapté : {parts}",
  "today.somethingHurts": "Quelque chose fait mal ?",
  "today.goalMore": { one: "Encore {count} cette semaine pour votre objectif", other: "Encore {count} cette semaine pour votre objectif" },
};

export const de: Partial<Record<Key, Message>> = {
  "today.morning": "Guten Morgen",
  "today.afternoon": "Guten Tag",
  "today.evening": "Guten Abend",
  "today.hello": "{greeting}, {name}",
  "today.start": "Training starten",
  "today.trainingAround": "Training mit Rücksicht auf: {parts}",
  "today.somethingHurts": "Tut etwas weh?",
  "today.goalMore": { one: "Noch {count} diese Woche für dein Ziel", other: "Noch {count} diese Woche für dein Ziel" },
};

export const it: Partial<Record<Key, Message>> = {
  "today.morning": "Buongiorno",
  "today.afternoon": "Buon pomeriggio",
  "today.evening": "Buonasera",
  "today.hello": "{greeting}, {name}",
  "today.start": "Inizia allenamento",
  "today.trainingAround": "Allenamento che evita: {parts}",
  "today.somethingHurts": "Ti fa male qualcosa?",
  "today.goalMore": {
    one: "Ancora {count} questa settimana per il tuo obiettivo",
    other: "Ancora {count} questa settimana per il tuo obiettivo",
  },
};

export const ja: Partial<Record<Key, Message>> = {
  "today.morning": "おはようございます",
  "today.afternoon": "こんにちは",
  "today.evening": "こんばんは",
  "today.hello": "{name}さん、{greeting}",
  "today.start": "ワークアウト開始",
  "today.trainingAround": "{parts}をかばってトレーニング",
  "today.somethingHurts": "どこか痛みますか？",
  "today.goalMore": { other: "目標まで今週あと{count}回" },
};
