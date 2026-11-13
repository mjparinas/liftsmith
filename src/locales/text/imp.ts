import type { Message } from "@/lib/i18n";

// Text for keys starting "imp.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "imp.tooBig": "That file is too big to import (over 20 MB).",
  "imp.notExport":
    "That file doesn't look like an export from Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes or Liftsmith, or a body weight or measurements file.",
  "imp.done": { one: "Imported {count} workout with {sets} sets.", other: "Imported {count} workouts with {sets} sets." },
  "imp.already": "Those workouts are already here.",
  "imp.fileLabel": "CSV file to import",
  "imp.button": "Import from another app (CSV)",
  "imp.note":
    "Workouts from Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes or a Liftsmith export, or body weight and measurements from Hevy, FitNotes or a scale app. The file is read on this device and never uploaded.",
  "imp.title": "Import from {source}",
  "imp.summary": { one: "{count} workout, {sets} sets", other: "{count} workouts, {sets} sets" },
  "imp.skipped": { one: "{count} row left out (rest timers or empty sets)", other: "{count} rows left out (rest timers or empty sets)" },
  "imp.again": "Workouts you've imported before are skipped.",
  "imp.unit": "Weights in this file are in",
  "imp.exercises": "Exercises",
  "imp.check": 'Check each one. "Add as my own" creates a custom exercise with that name.',
  "imp.custom": "Add as my own exercise",
  "imp.import": "Import",
  "imp.cancel": "Cancel",
  "imp.routines": "Save your routines too",
  "imp.routinesHint": "Workouts you did under the same name more than once become routines: {names}.",
  "imp.routinesDone": { one: "Saved {count} routine.", other: "Saved {count} routines." },
  "imp.bodyTitle": "Import body weight and measurements",
  "imp.bodySummary": { one: "{count} weigh-in, {measures} measurements", other: "{count} weigh-ins, {measures} measurements" },
  "imp.bodyAgain": "Days that already have a weigh-in or that measurement keep yours.",
  "imp.bodyDone": {
    one: "Imported {count} weigh-in and {measures} measurements.",
    other: "Imported {count} weigh-ins and {measures} measurements.",
  },
  "imp.bodyAlready": "Those readings are already here.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Ese archivo es demasiado grande para importarlo (más de 20 MB).",
  "imp.notExport":
    "Ese archivo no parece una exportación de Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes o Liftsmith, ni un archivo de peso corporal o medidas.",
  "imp.done": { one: "Importado {count} entrenamiento con {sets} series.", other: "Importados {count} entrenamientos con {sets} series." },
  "imp.already": "Esos entrenamientos ya están aquí.",
  "imp.fileLabel": "Archivo CSV para importar",
  "imp.button": "Importar desde otra app (CSV)",
  "imp.note":
    "Entrenamientos de Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes o una exportación de Liftsmith, o peso corporal y medidas de Hevy, FitNotes o una app de báscula. El archivo se lee en este dispositivo y nunca se sube.",
  "imp.title": "Importar de {source}",
  "imp.summary": { one: "{count} entrenamiento, {sets} series", other: "{count} entrenamientos, {sets} series" },
  "imp.skipped": {
    one: "{count} fila omitida (temporizadores de descanso o series vacías)",
    other: "{count} filas omitidas (temporizadores de descanso o series vacías)",
  },
  "imp.again": "Los entrenamientos que ya importaste se saltan.",
  "imp.unit": "Los pesos de este archivo están en",
  "imp.exercises": "Ejercicios",
  "imp.check": "Revisa cada uno. «Añadir como propio» crea un ejercicio personalizado con ese nombre.",
  "imp.custom": "Añadir como ejercicio propio",
  "imp.import": "Importar",
  "imp.cancel": "Cancelar",
  "imp.routines": "Guardar también tus rutinas",
  "imp.routinesHint": "Los entrenamientos que hiciste más de una vez con el mismo nombre se convierten en rutinas: {names}.",
  "imp.routinesDone": { one: "{count} rutina guardada.", other: "{count} rutinas guardadas." },
  "imp.bodyTitle": "Importar peso corporal y medidas",
  "imp.bodySummary": { one: "{count} pesaje, {measures} medidas", other: "{count} pesajes, {measures} medidas" },
  "imp.bodyAgain": "Los días que ya tienen un pesaje o esa medida conservan los tuyos.",
  "imp.bodyDone": { one: "Importado {count} pesaje y {measures} medidas.", other: "Importados {count} pesajes y {measures} medidas." },
  "imp.bodyAlready": "Esos datos ya están aquí.",
};

export const fr: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Ce fichier est trop gros pour être importé (plus de 20 Mo).",
  "imp.notExport":
    "Ce fichier ne ressemble pas à un export de Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ou Liftsmith, ni à un fichier de poids ou de mensurations.",
  "imp.done": { one: "{count} séance importée avec {sets} séries.", other: "{count} séances importées avec {sets} séries." },
  "imp.already": "Ces séances sont déjà là.",
  "imp.fileLabel": "Fichier CSV à importer",
  "imp.button": "Importer depuis une autre app (CSV)",
  "imp.note":
    "Des séances de Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ou d’un export Liftsmith, ou le poids et les mensurations de Hevy, FitNotes ou d’une app de balance. Le fichier est lu sur cet appareil et n’est jamais envoyé.",
  "imp.title": "Importer depuis {source}",
  "imp.summary": { one: "{count} séance, {sets} séries", other: "{count} séances, {sets} séries" },
  "imp.skipped": {
    one: "{count} ligne écartée (minuteurs de repos ou séries vides)",
    other: "{count} lignes écartées (minuteurs de repos ou séries vides)",
  },
  "imp.again": "Les séances déjà importées sont ignorées.",
  "imp.unit": "Les charges de ce fichier sont en",
  "imp.exercises": "Exercices",
  "imp.check": "Vérifiez chacun. « Ajouter comme le mien » crée un exercice personnalisé de ce nom.",
  "imp.custom": "Ajouter comme mon propre exercice",
  "imp.import": "Importer",
  "imp.cancel": "Annuler",
  "imp.routines": "Enregistrer aussi vos routines",
  "imp.routinesHint": "Les séances faites plus d’une fois sous le même nom deviennent des routines : {names}.",
  "imp.routinesDone": { one: "{count} routine enregistrée.", other: "{count} routines enregistrées." },
  "imp.bodyTitle": "Importer le poids et les mensurations",
  "imp.bodySummary": { one: "{count} pesée, {measures} mensurations", other: "{count} pesées, {measures} mensurations" },
  "imp.bodyAgain": "Les jours qui ont déjà une pesée ou cette mensuration gardent les vôtres.",
  "imp.bodyDone": {
    one: "{count} pesée et {measures} mensurations importées.",
    other: "{count} pesées et {measures} mensurations importées.",
  },
  "imp.bodyAlready": "Ces mesures sont déjà là.",
};

export const de: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Diese Datei ist zu groß für den Import (über 20 MB).",
  "imp.notExport":
    "Diese Datei sieht nicht nach einem Export aus Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes oder Liftsmith aus, und auch nicht nach einer Datei mit Körpergewicht oder Maßen.",
  "imp.done": { one: "{count} Training mit {sets} Sätzen importiert.", other: "{count} Trainings mit {sets} Sätzen importiert." },
  "imp.already": "Diese Trainings sind schon da.",
  "imp.fileLabel": "CSV-Datei zum Importieren",
  "imp.button": "Aus einer anderen App importieren (CSV)",
  "imp.note":
    "Trainings aus Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes oder einem Liftsmith-Export, oder Körpergewicht und Maße aus Hevy, FitNotes oder einer Waagen-App. Die Datei wird auf diesem Gerät gelesen und nie hochgeladen.",
  "imp.title": "Import aus {source}",
  "imp.summary": { one: "{count} Training, {sets} Sätze", other: "{count} Trainings, {sets} Sätze" },
  "imp.skipped": {
    one: "{count} Zeile weggelassen (Pausentimer oder leere Sätze)",
    other: "{count} Zeilen weggelassen (Pausentimer oder leere Sätze)",
  },
  "imp.again": "Bereits importierte Trainings werden übersprungen.",
  "imp.unit": "Gewichte in dieser Datei sind in",
  "imp.exercises": "Übungen",
  "imp.check": "Prüfe jede einzelne. „Als eigene hinzufügen“ legt eine eigene Übung mit diesem Namen an.",
  "imp.custom": "Als eigene Übung hinzufügen",
  "imp.import": "Importieren",
  "imp.cancel": "Abbrechen",
  "imp.routines": "Auch deine Routinen speichern",
  "imp.routinesHint": "Trainings, die du mehr als einmal unter demselben Namen gemacht hast, werden zu Routinen: {names}.",
  "imp.routinesDone": { one: "{count} Routine gespeichert.", other: "{count} Routinen gespeichert." },
  "imp.bodyTitle": "Körpergewicht und Maße importieren",
  "imp.bodySummary": { one: "{count} Wiegen, {measures} Maße", other: "{count} Wiegungen, {measures} Maße" },
  "imp.bodyAgain": "Tage, die schon ein Wiegen oder dieses Maß haben, behalten deine Werte.",
  "imp.bodyDone": { one: "{count} Wiegen und {measures} Maße importiert.", other: "{count} Wiegungen und {measures} Maße importiert." },
  "imp.bodyAlready": "Diese Werte sind schon da.",
};

export const it: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Il file è troppo grande da importare (oltre 20 MB).",
  "imp.notExport":
    "Questo file non sembra un’esportazione da Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes o Liftsmith, né un file di peso corporeo o misure.",
  "imp.done": { one: "Importato {count} allenamento con {sets} serie.", other: "Importati {count} allenamenti con {sets} serie." },
  "imp.already": "Questi allenamenti ci sono già.",
  "imp.fileLabel": "File CSV da importare",
  "imp.button": "Importa da un’altra app (CSV)",
  "imp.note":
    "Allenamenti da Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes o un’esportazione di Liftsmith, oppure peso corporeo e misure da Hevy, FitNotes o un’app della bilancia. Il file viene letto su questo dispositivo e mai caricato.",
  "imp.title": "Importa da {source}",
  "imp.summary": { one: "{count} allenamento, {sets} serie", other: "{count} allenamenti, {sets} serie" },
  "imp.skipped": {
    one: "{count} riga esclusa (timer di riposo o serie vuote)",
    other: "{count} righe escluse (timer di riposo o serie vuote)",
  },
  "imp.again": "Gli allenamenti già importati vengono saltati.",
  "imp.unit": "I pesi in questo file sono in",
  "imp.exercises": "Esercizi",
  "imp.check": "Controllali uno per uno. «Aggiungi come mio» crea un esercizio personalizzato con quel nome.",
  "imp.custom": "Aggiungi come mio esercizio",
  "imp.import": "Importa",
  "imp.cancel": "Annulla",
  "imp.routines": "Salva anche le tue routine",
  "imp.routinesHint": "Gli allenamenti fatti più di una volta con lo stesso nome diventano routine: {names}.",
  "imp.routinesDone": { one: "{count} routine salvata.", other: "{count} routine salvate." },
  "imp.bodyTitle": "Importa peso corporeo e misure",
  "imp.bodySummary": { one: "{count} pesata, {measures} misure", other: "{count} pesate, {measures} misure" },
  "imp.bodyAgain": "I giorni che hanno già una pesata o quella misura tengono i tuoi valori.",
  "imp.bodyDone": { one: "Importata {count} pesata e {measures} misure.", other: "Importate {count} pesate e {measures} misure." },
  "imp.bodyAlready": "Questi valori ci sono già.",
};

export const ja: Partial<Record<Key, Message>> = {
  "imp.tooBig": "ファイルが大きすぎて読み込めません（20 MB 超）。",
  "imp.notExport":
    "このファイルは Strong、Hevy、Fitbod、StrongLifts、JEFIT、FitNotes、Liftsmith の書き出しでも、体重や体のサイズのファイルでもないようです。",
  "imp.done": { other: "{count}回のワークアウト（{sets}セット）を読み込みました。" },
  "imp.already": "これらのワークアウトはすでにあります。",
  "imp.fileLabel": "読み込む CSV ファイル",
  "imp.button": "ほかのアプリから読み込む（CSV）",
  "imp.note":
    "Strong、Hevy、Fitbod、StrongLifts、JEFIT、FitNotes、Liftsmith の書き出しからワークアウトを、Hevy、FitNotes、体重計アプリから体重と体のサイズを読み込めます。ファイルはこの端末で読み取り、アップロードしません。",
  "imp.title": "{source}から読み込む",
  "imp.summary": { other: "ワークアウト{count}回、{sets}セット" },
  "imp.skipped": { other: "{count}行を除外（休憩タイマー、空のセット）" },
  "imp.again": "以前読み込んだワークアウトはスキップします。",
  "imp.unit": "このファイルの重量の単位",
  "imp.exercises": "種目",
  "imp.check": "1つずつ確認してください。「自分の種目として追加」を選ぶと、その名前でカスタム種目を作ります。",
  "imp.custom": "自分の種目として追加",
  "imp.import": "読み込む",
  "imp.cancel": "キャンセル",
  "imp.routines": "ルーティンも保存する",
  "imp.routinesHint": "同じ名前で2回以上行ったワークアウトをルーティンにします：{names}。",
  "imp.routinesDone": { other: "ルーティンを{count}件保存しました。" },
  "imp.bodyTitle": "体重と体のサイズを読み込む",
  "imp.bodySummary": { other: "体重{count}回、サイズ{measures}件" },
  "imp.bodyAgain": "すでに体重やそのサイズの記録がある日は、今の記録を残します。",
  "imp.bodyDone": { other: "体重{count}回とサイズ{measures}件を読み込みました。" },
  "imp.bodyAlready": "これらの記録はすでにあります。",
};
