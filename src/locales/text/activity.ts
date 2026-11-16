import type { Message } from "@/lib/i18n";

// Text for keys starting "activity.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "activity.sedentary": "Sedentary",
  "activity.light": "Light exercise",
  "activity.moderate": "Moderate exercise",
  "activity.heavy": "Heavy exercise",
  "activity.athlete": "Athlete",
  "activity.sedentary.detail": "Desk job, little or no exercise",
  "activity.light.detail": "1 to 2 days a week",
  "activity.moderate.detail": "3 to 5 days a week",
  "activity.heavy.detail": "6 to 7 days a week",
  "activity.athlete.detail": "Twice a day, or a physical job plus training",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sedentario",
  "activity.light": "Ejercicio ligero",
  "activity.moderate": "Ejercicio moderado",
  "activity.heavy": "Ejercicio intenso",
  "activity.athlete": "Atleta",
  "activity.sedentary.detail": "Trabajo de oficina, poco o ningún ejercicio",
  "activity.light.detail": "1 a 2 días a la semana",
  "activity.moderate.detail": "3 a 5 días a la semana",
  "activity.heavy.detail": "6 a 7 días a la semana",
  "activity.athlete.detail": "Dos veces al día, o un trabajo físico más entrenamiento",
};

export const fr: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sédentaire",
  "activity.light": "Exercice léger",
  "activity.moderate": "Exercice modéré",
  "activity.heavy": "Exercice intense",
  "activity.athlete": "Athlète",
  "activity.sedentary.detail": "Travail de bureau, peu ou pas d’exercice",
  "activity.light.detail": "1 à 2 jours par semaine",
  "activity.moderate.detail": "3 à 5 jours par semaine",
  "activity.heavy.detail": "6 à 7 jours par semaine",
  "activity.athlete.detail": "Deux fois par jour, ou un travail physique plus l’entraînement",
};

export const de: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sitzend",
  "activity.light": "Leichte Bewegung",
  "activity.moderate": "Mäßige Bewegung",
  "activity.heavy": "Viel Bewegung",
  "activity.athlete": "Athlet",
  "activity.sedentary.detail": "Bürojob, wenig oder keine Bewegung",
  "activity.light.detail": "1 bis 2 Tage pro Woche",
  "activity.moderate.detail": "3 bis 5 Tage pro Woche",
  "activity.heavy.detail": "6 bis 7 Tage pro Woche",
  "activity.athlete.detail": "Zweimal täglich oder körperliche Arbeit plus Training",
};

export const it: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sedentario",
  "activity.light": "Attività leggera",
  "activity.moderate": "Attività moderata",
  "activity.heavy": "Attività intensa",
  "activity.athlete": "Atleta",
  "activity.sedentary.detail": "Lavoro d’ufficio, poco o nessun esercizio",
  "activity.light.detail": "Da 1 a 2 giorni a settimana",
  "activity.moderate.detail": "Da 3 a 5 giorni a settimana",
  "activity.heavy.detail": "Da 6 a 7 giorni a settimana",
  "activity.athlete.detail": "Due volte al giorno, o lavoro fisico più allenamento",
};

export const ja: Partial<Record<Key, Message>> = {
  "activity.sedentary": "座りがち",
  "activity.light": "軽い運動",
  "activity.moderate": "適度な運動",
  "activity.heavy": "激しい運動",
  "activity.athlete": "アスリート",
  "activity.sedentary.detail": "デスクワーク、運動はほぼなし",
  "activity.light.detail": "週1〜2日",
  "activity.moderate.detail": "週3〜5日",
  "activity.heavy.detail": "週6〜7日",
  "activity.athlete.detail": "1日2回、または肉体労働とトレーニング",
};

export const pt: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Sedentário",
  "activity.light": "Exercício leve",
  "activity.moderate": "Exercício moderado",
  "activity.heavy": "Exercício intenso",
  "activity.athlete": "Atleta",
  "activity.sedentary.detail": "Trabalho sentado, pouco ou nenhum exercício",
  "activity.light.detail": "1 a 2 dias por semana",
  "activity.moderate.detail": "3 a 5 dias por semana",
  "activity.heavy.detail": "6 a 7 dias por semana",
  "activity.athlete.detail": "Duas vezes por dia, ou trabalho físico mais treino",
};

export const ko: Partial<Record<Key, Message>> = {
  "activity.sedentary": "좌식 생활",
  "activity.light": "가벼운 운동",
  "activity.moderate": "보통 운동",
  "activity.heavy": "강도 높은 운동",
  "activity.athlete": "운동선수",
  "activity.sedentary.detail": "사무직, 운동을 거의 또는 전혀 안 함",
  "activity.light.detail": "주 1~2일",
  "activity.moderate.detail": "주 3~5일",
  "activity.heavy.detail": "주 6~7일",
  "activity.athlete.detail": "하루 두 번, 또는 육체노동과 운동 병행",
};

export const tr: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Hareketsiz",
  "activity.light": "Hafif egzersiz",
  "activity.moderate": "Orta düzey egzersiz",
  "activity.heavy": "Yoğun egzersiz",
  "activity.athlete": "Sporcu",
  "activity.sedentary.detail": "Masa başı iş, az ya da hiç egzersiz",
  "activity.light.detail": "Haftada 1-2 gün",
  "activity.moderate.detail": "Haftada 3-5 gün",
  "activity.heavy.detail": "Haftada 6-7 gün",
  "activity.athlete.detail": "Günde iki kez ya da fiziksel bir iş artı antrenman",
};

export const pl: Partial<Record<Key, Message>> = {
  "activity.sedentary": "Siedzący tryb życia",
  "activity.light": "Lekka aktywność",
  "activity.moderate": "Umiarkowana aktywność",
  "activity.heavy": "Duża aktywność",
  "activity.athlete": "Sportowiec",
  "activity.sedentary.detail": "Praca przy biurku, mało lub brak ruchu",
  "activity.light.detail": "1–2 dni w tygodniu",
  "activity.moderate.detail": "3–5 dni w tygodniu",
  "activity.heavy.detail": "6–7 dni w tygodniu",
  "activity.athlete.detail": "Dwa razy dziennie lub praca fizyczna plus trening",
};
