import type { Message } from "@/lib/i18n";

// Text for keys starting "imp.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "imp.tooBig": "That file is too big to import (over 20 MB).",
  "imp.notExport": "That file doesn't look like a workout export from Strong, Hevy or Liftsmith.",
  "imp.done": { one: "Imported {count} workout with {sets} sets.", other: "Imported {count} workouts with {sets} sets." },
  "imp.already": "Those workouts are already here.",
  "imp.fileLabel": "CSV file to import",
  "imp.button": "Import workouts (CSV)",
  "imp.note": "From Strong, Hevy, or a Liftsmith export. The file is read on this device and never uploaded.",
  "imp.title": "Import from {source}",
  "imp.summary": { one: "{count} workout, {sets} sets", other: "{count} workouts, {sets} sets" },
  "imp.skipped": {
    one: "{count} row left out (cardio, rest timers or empty sets)",
    other: "{count} rows left out (cardio, rest timers or empty sets)",
  },
  "imp.again": "Workouts you've imported before are skipped.",
  "imp.unit": "Weights in this file are in",
  "imp.exercises": "Exercises",
  "imp.check": 'Check each one. "Add as my own" creates a custom exercise with that name.',
  "imp.custom": "Add as my own exercise",
  "imp.import": "Import",
  "imp.cancel": "Cancel",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Ese archivo es demasiado grande para importarlo (más de 20 MB).",
  "imp.notExport": "Ese archivo no parece una exportación de entrenamientos de Strong, Hevy o Liftsmith.",
  "imp.done": { one: "Importado {count} entrenamiento con {sets} series.", other: "Importados {count} entrenamientos con {sets} series." },
  "imp.already": "Esos entrenamientos ya están aquí.",
  "imp.fileLabel": "Archivo CSV para importar",
  "imp.button": "Importar entrenamientos (CSV)",
  "imp.note": "De Strong, Hevy o una exportación de Liftsmith. El archivo se lee en este dispositivo y nunca se sube.",
  "imp.title": "Importar de {source}",
  "imp.summary": { one: "{count} entrenamiento, {sets} series", other: "{count} entrenamientos, {sets} series" },
  "imp.skipped": {
    one: "{count} fila omitida (cardio, temporizadores de descanso o series vacías)",
    other: "{count} filas omitidas (cardio, temporizadores de descanso o series vacías)",
  },
  "imp.again": "Los entrenamientos que ya importaste se saltan.",
  "imp.unit": "Los pesos de este archivo están en",
  "imp.exercises": "Ejercicios",
  "imp.check": "Revisa cada uno. «Añadir como propio» crea un ejercicio personalizado con ese nombre.",
  "imp.custom": "Añadir como ejercicio propio",
  "imp.import": "Importar",
  "imp.cancel": "Cancelar",
};

export const fr: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Ce fichier est trop gros pour être importé (plus de 20 Mo).",
  "imp.notExport": "Ce fichier ne ressemble pas à un export de séances de Strong, Hevy ou Liftsmith.",
  "imp.done": { one: "{count} séance importée avec {sets} séries.", other: "{count} séances importées avec {sets} séries." },
  "imp.already": "Ces séances sont déjà là.",
  "imp.fileLabel": "Fichier CSV à importer",
  "imp.button": "Importer des séances (CSV)",
  "imp.note": "Depuis Strong, Hevy ou un export Liftsmith. Le fichier est lu sur cet appareil et n’est jamais envoyé.",
  "imp.title": "Importer depuis {source}",
  "imp.summary": { one: "{count} séance, {sets} séries", other: "{count} séances, {sets} séries" },
  "imp.skipped": {
    one: "{count} ligne écartée (cardio, minuteurs de repos ou séries vides)",
    other: "{count} lignes écartées (cardio, minuteurs de repos ou séries vides)",
  },
  "imp.again": "Les séances déjà importées sont ignorées.",
  "imp.unit": "Les charges de ce fichier sont en",
  "imp.exercises": "Exercices",
  "imp.check": "Vérifiez chacun. « Ajouter comme le mien » crée un exercice personnalisé de ce nom.",
  "imp.custom": "Ajouter comme mon propre exercice",
  "imp.import": "Importer",
  "imp.cancel": "Annuler",
};
