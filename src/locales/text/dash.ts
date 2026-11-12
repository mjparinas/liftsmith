import type { Message } from "@/lib/i18n";

// Text for keys starting "dash.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "dash.loading": "Loading…",
  "dash.workouts": "Workouts",
  "dash.level": "Level",
  "dash.levelTitle": "Level {level} · {title}",
  "dash.workoutsN": { one: "{count} workout", other: "{count} workouts" },
  "dash.prevMonth": "Previous month",
  "dash.nextMonth": "Next month",
  "dash.min": "{n} min",
  "dash.byHand": " · logged by hand",
  "dash.trainedOf": "Trained on {n} of the last {total} days",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "dash.loading": "Cargando…",
  "dash.workouts": "Entrenamientos",
  "dash.level": "Nivel",
  "dash.levelTitle": "Nivel {level} · {title}",
  "dash.workoutsN": { one: "{count} entrenamiento", other: "{count} entrenamientos" },
  "dash.prevMonth": "Mes anterior",
  "dash.nextMonth": "Mes siguiente",
  "dash.min": "{n} min",
  "dash.byHand": " · registrado a mano",
  "dash.trainedOf": "Entrenaste {n} de los últimos {total} días",
};

export const fr: Partial<Record<Key, Message>> = {
  "dash.loading": "Chargement…",
  "dash.workouts": "Séances",
  "dash.level": "Niveau",
  "dash.levelTitle": "Niveau {level} · {title}",
  "dash.workoutsN": { one: "{count} séance", other: "{count} séances" },
  "dash.prevMonth": "Mois précédent",
  "dash.nextMonth": "Mois suivant",
  "dash.min": "{n} min",
  "dash.byHand": " · ajoutée à la main",
  "dash.trainedOf": "Entraîné {n} des {total} derniers jours",
};

export const de: Partial<Record<Key, Message>> = {
  "dash.loading": "Wird geladen…",
  "dash.workouts": "Trainings",
  "dash.level": "Level",
  "dash.levelTitle": "Level {level} · {title}",
  "dash.workoutsN": { one: "{count} Training", other: "{count} Trainings" },
  "dash.prevMonth": "Vorheriger Monat",
  "dash.nextMonth": "Nächster Monat",
  "dash.min": "{n} Min.",
  "dash.byHand": " · von Hand eingetragen",
  "dash.trainedOf": "An {n} der letzten {total} Tage trainiert",
};

export const it: Partial<Record<Key, Message>> = {
  "dash.loading": "Caricamento…",
  "dash.workouts": "Allenamenti",
  "dash.level": "Livello",
  "dash.levelTitle": "Livello {level} · {title}",
  "dash.workoutsN": { one: "{count} allenamento", other: "{count} allenamenti" },
  "dash.prevMonth": "Mese precedente",
  "dash.nextMonth": "Mese successivo",
  "dash.min": "{n} min",
  "dash.byHand": " · registrato a mano",
  "dash.trainedOf": "Allenato in {n} degli ultimi {total} giorni",
};

export const ja: Partial<Record<Key, Message>> = {
  "dash.loading": "読み込み中…",
  "dash.workouts": "ワークアウト",
  "dash.level": "レベル",
  "dash.levelTitle": "レベル{level} · {title}",
  "dash.workoutsN": { other: "ワークアウト{count}回" },
  "dash.prevMonth": "前の月",
  "dash.nextMonth": "次の月",
  "dash.min": "{n}分",
  "dash.byHand": " · 手動で記録",
  "dash.trainedOf": "直近{total}日のうち{n}日トレーニング",
};
