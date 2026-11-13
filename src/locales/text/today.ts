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
  "today.streakStart": { one: "{count} more this week to start a streak", other: "{count} more this week to start a streak" },
  "today.doneTitle": "Done for today",
  "today.doneLine": { one: "{count} set in {min} min, {volume} lifted", other: "{count} sets in {min} min, {volume} lifted" },
  "today.doneRest": "Recovery starts now. Eat well, sleep well, and the next plan builds on today.",
  "today.again": "Train again",
  "today.recovering": "Recovering now",
  "today.recoveringLine": "Lit up: the muscles you trained today. The next plan works around them until they’re ready.",
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
  "today.streakStart": { one: "{count} más esta semana para empezar una racha", other: "{count} más esta semana para empezar una racha" },
  "today.doneTitle": "Listo por hoy",
  "today.doneLine": { one: "{count} serie en {min} min, {volume} levantados", other: "{count} series en {min} min, {volume} levantados" },
  "today.doneRest": "La recuperación empieza ahora. Come bien, duerme bien, y el próximo plan parte de hoy.",
  "today.again": "Entrenar otra vez",
  "today.recovering": "Recuperándose ahora",
  "today.recoveringLine": "Resaltados: los músculos que entrenaste hoy. El próximo plan los respeta hasta que estén listos.",
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
  "today.streakStart": {
    one: "Encore {count} cette semaine pour lancer une série",
    other: "Encore {count} cette semaine pour lancer une série",
  },
  "today.doneTitle": "C’est fait pour aujourd’hui",
  "today.doneLine": { one: "{count} série en {min} min, {volume} soulevés", other: "{count} séries en {min} min, {volume} soulevés" },
  "today.doneRest": "La récupération commence maintenant. Mangez bien, dormez bien, et le prochain plan part d’aujourd’hui.",
  "today.again": "S’entraîner encore",
  "today.recovering": "En récupération",
  "today.recoveringLine":
    "En surbrillance : les muscles travaillés aujourd’hui. Le prochain plan les ménage jusqu’à ce qu’ils soient prêts.",
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
  "today.streakStart": {
    one: "Noch {count} diese Woche, dann startet deine Serie",
    other: "Noch {count} diese Woche, dann startet deine Serie",
  },
  "today.doneTitle": "Für heute geschafft",
  "today.doneLine": { one: "{count} Satz in {min} Min., {volume} bewegt", other: "{count} Sätze in {min} Min., {volume} bewegt" },
  "today.doneRest": "Jetzt beginnt die Erholung. Gut essen, gut schlafen, und der nächste Plan baut auf heute auf.",
  "today.again": "Noch mal trainieren",
  "today.recovering": "Erholt sich gerade",
  "today.recoveringLine":
    "Hervorgehoben: die Muskeln, die du heute trainiert hast. Der nächste Plan schont sie, bis sie wieder bereit sind.",
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
  "today.streakStart": {
    one: "Ancora {count} questa settimana per iniziare una serie",
    other: "Ancora {count} questa settimana per iniziare una serie",
  },
  "today.doneTitle": "Fatto per oggi",
  "today.doneLine": { one: "{count} serie in {min} min, {volume} sollevati", other: "{count} serie in {min} min, {volume} sollevati" },
  "today.doneRest": "Il recupero inizia adesso. Mangia bene, dormi bene, e il prossimo piano parte da oggi.",
  "today.again": "Allenati ancora",
  "today.recovering": "In recupero",
  "today.recoveringLine": "Evidenziati: i muscoli allenati oggi. Il prossimo piano li risparmia finché non sono pronti.",
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
  "today.streakStart": { other: "今週あと{count}回で連続記録スタート" },
  "today.doneTitle": "今日はおつかれさま",
  "today.doneLine": { other: "{min}分で{count}セット、合計{volume}" },
  "today.doneRest": "ここから回復の時間です。よく食べてよく眠れば、次のプランは今日の続きから始まります。",
  "today.again": "もう一度トレーニング",
  "today.recovering": "回復中",
  "today.recoveringLine": "光っているのは今日鍛えた筋肉です。回復するまで、次のプランはここを避けて組まれます。",
};
