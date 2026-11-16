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

export const pt: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Esse arquivo é grande demais para importar (mais de 20 MB).",
  "imp.notExport":
    "Esse arquivo não parece uma exportação do Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ou Liftsmith, nem um arquivo de peso corporal ou medidas.",
  "imp.done": {
    one: "{count} treino importado com {sets} séries.",
    other: "{count} treinos importados com {sets} séries.",
  },
  "imp.already": "Esses treinos já estão aqui.",
  "imp.fileLabel": "Arquivo CSV para importar",
  "imp.button": "Importar de outro app (CSV)",
  "imp.note":
    "Treinos do Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ou de uma exportação do Liftsmith, ou peso corporal e medidas do Hevy, FitNotes ou de um app de balança. O arquivo é lido neste aparelho e nunca é enviado.",
  "imp.title": "Importar de {source}",
  "imp.summary": {
    one: "{count} treino, {sets} séries",
    other: "{count} treinos, {sets} séries",
  },
  "imp.skipped": {
    one: "{count} linha deixada de fora (timers de descanso ou séries vazias)",
    other: "{count} linhas deixadas de fora (timers de descanso ou séries vazias)",
  },
  "imp.again": "Treinos que você já importou antes são pulados.",
  "imp.unit": "Os pesos neste arquivo estão em",
  "imp.exercises": "Exercícios",
  "imp.check": "Confira cada um. “Adicionar como meu exercício” cria um exercício personalizado com esse nome.",
  "imp.custom": "Adicionar como meu exercício",
  "imp.import": "Importar",
  "imp.cancel": "Cancelar",
  "imp.routines": "Salvar suas rotinas também",
  "imp.routinesHint": "Treinos que você fez com o mesmo nome mais de uma vez viram rotinas: {names}.",
  "imp.routinesDone": {
    one: "{count} rotina salva.",
    other: "{count} rotinas salvas.",
  },
  "imp.bodyTitle": "Importar peso corporal e medidas",
  "imp.bodySummary": {
    one: "{count} pesagem, {measures} medidas",
    other: "{count} pesagens, {measures} medidas",
  },
  "imp.bodyAgain": "Dias que já têm uma pesagem ou essa medida mantêm a sua.",
  "imp.bodyDone": {
    one: "{count} pesagem e {measures} medidas importadas.",
    other: "{count} pesagens e {measures} medidas importadas.",
  },
  "imp.bodyAlready": "Essas leituras já estão aqui.",
};

export const ko: Partial<Record<Key, Message>> = {
  "imp.tooBig": "파일이 너무 커서 가져올 수 없어요(20MB 초과).",
  "imp.notExport":
    "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes, Liftsmith에서 내보낸 파일이나 체중 또는 신체 치수 파일이 아닌 것 같아요.",
  "imp.done": {
    other: "운동 {count}개, {sets}세트를 가져왔어요.",
  },
  "imp.already": "이미 있는 운동이에요.",
  "imp.fileLabel": "가져올 CSV 파일",
  "imp.button": "다른 앱에서 가져오기(CSV)",
  "imp.note":
    "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes, Liftsmith 내보내기 파일의 운동, 또는 Hevy, FitNotes, 체중계 앱의 체중과 신체 치수를 가져와요. 파일은 이 기기에서 읽고 절대 업로드하지 않아요.",
  "imp.title": "{source}에서 가져오기",
  "imp.summary": {
    other: "운동 {count}개, {sets}세트",
  },
  "imp.skipped": {
    other: "{count}행 제외(휴식 타이머나 빈 세트)",
  },
  "imp.again": "전에 가져온 운동은 건너뛰어요.",
  "imp.unit": "이 파일의 무게 단위",
  "imp.exercises": "운동 동작",
  "imp.check": "하나씩 확인하세요. “내 운동 동작으로 추가”를 누르면 그 이름으로 직접 만든 운동 동작이 생겨요.",
  "imp.custom": "내 운동 동작으로 추가",
  "imp.import": "가져오기",
  "imp.cancel": "취소",
  "imp.routines": "루틴도 저장",
  "imp.routinesHint": "같은 이름으로 두 번 이상 한 운동은 루틴이 돼요: {names}.",
  "imp.routinesDone": {
    other: "루틴 {count}개를 저장했어요.",
  },
  "imp.bodyTitle": "체중과 신체 치수 가져오기",
  "imp.bodySummary": {
    other: "체중 기록 {count}개, 신체 치수 {measures}개",
  },
  "imp.bodyAgain": "이미 체중 기록이나 해당 치수가 있는 날은 기존 값을 유지해요.",
  "imp.bodyDone": {
    other: "체중 기록 {count}개와 신체 치수 {measures}개를 가져왔어요.",
  },
  "imp.bodyAlready": "이미 있는 기록이에요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Bu dosya içe aktarmak için çok büyük (20 MB'tan fazla).",
  "imp.notExport":
    "Bu dosya Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ya da Liftsmith dışa aktarımı veya bir vücut ağırlığı ya da ölçü dosyası gibi görünmüyor.",
  "imp.done": {
    one: "{sets} setle {count} antrenman içe aktarıldı.",
    other: "{sets} setle {count} antrenman içe aktarıldı.",
  },
  "imp.already": "Bu antrenmanlar zaten burada.",
  "imp.fileLabel": "İçe aktarılacak CSV dosyası",
  "imp.button": "Başka bir uygulamadan içe aktar (CSV)",
  "imp.note":
    "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ya da bir Liftsmith dışa aktarımından antrenmanlar; veya Hevy, FitNotes ya da bir tartı uygulamasından vücut ağırlığı ve ölçüler. Dosya bu cihazda okunur ve asla yüklenmez.",
  "imp.title": "{source} kaynağından içe aktar",
  "imp.summary": {
    one: "{count} antrenman, {sets} set",
    other: "{count} antrenman, {sets} set",
  },
  "imp.skipped": {
    one: "{count} satır dışarıda bırakıldı (dinlenme sayaçları ya da boş setler)",
    other: "{count} satır dışarıda bırakıldı (dinlenme sayaçları ya da boş setler)",
  },
  "imp.again": "Daha önce içe aktardığın antrenmanlar atlanır.",
  "imp.unit": "Bu dosyadaki ağırlıkların birimi",
  "imp.exercises": "Egzersizler",
  "imp.check": "Her birini kontrol et. “Kendi egzersizim olarak ekle” o adla özel bir egzersiz oluşturur.",
  "imp.custom": "Kendi egzersizim olarak ekle",
  "imp.import": "İçe aktar",
  "imp.cancel": "İptal",
  "imp.routines": "Rutinlerini de kaydet",
  "imp.routinesHint": "Aynı adla birden fazla kez yaptığın antrenmanlar rutin olur: {names}.",
  "imp.routinesDone": {
    one: "{count} rutin kaydedildi.",
    other: "{count} rutin kaydedildi.",
  },
  "imp.bodyTitle": "Vücut ağırlığı ve ölçüleri içe aktar",
  "imp.bodySummary": {
    one: "{count} tartı, {measures} ölçü",
    other: "{count} tartı, {measures} ölçü",
  },
  "imp.bodyAgain": "Zaten tartısı ya da o ölçüsü olan günlerde seninki kalır.",
  "imp.bodyDone": {
    one: "{count} tartı ve {measures} ölçü içe aktarıldı.",
    other: "{count} tartı ve {measures} ölçü içe aktarıldı.",
  },
  "imp.bodyAlready": "Bu ölçümler zaten burada.",
};

export const pl: Partial<Record<Key, Message>> = {
  "imp.tooBig": "Ten plik jest za duży do importu (ponad 20 MB).",
  "imp.notExport":
    "Ten plik nie wygląda na eksport ze Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes ani Liftsmith, ani na plik z masą ciała lub pomiarami.",
  "imp.done": {
    one: "Zaimportowano {count} trening (serie: {sets}).",
    few: "Zaimportowano {count} treningi (serie: {sets}).",
    many: "Zaimportowano {count} treningów (serie: {sets}).",
    other: "Zaimportowano {count} treningu (serie: {sets}).",
  },
  "imp.already": "Te treningi już tu są.",
  "imp.fileLabel": "Plik CSV do importu",
  "imp.button": "Importuj z innej aplikacji (CSV)",
  "imp.note":
    "Treningi ze Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes lub eksportu Liftsmith albo masa ciała i pomiary z Hevy, FitNotes lub aplikacji wagi. Plik jest odczytywany na tym urządzeniu i nigdy nie jest wysyłany.",
  "imp.title": "Import z {source}",
  "imp.summary": {
    one: "{count} trening, serie: {sets}",
    few: "{count} treningi, serie: {sets}",
    many: "{count} treningów, serie: {sets}",
    other: "{count} treningu, serie: {sets}",
  },
  "imp.skipped": {
    one: "Pominięto {count} wiersz (minutniki przerw lub puste serie)",
    few: "Pominięto {count} wiersze (minutniki przerw lub puste serie)",
    many: "Pominięto {count} wierszy (minutniki przerw lub puste serie)",
    other: "Pominięto {count} wiersza (minutniki przerw lub puste serie)",
  },
  "imp.again": "Treningi zaimportowane wcześniej są pomijane.",
  "imp.unit": "Ciężary w tym pliku są w",
  "imp.exercises": "Ćwiczenia",
  "imp.check": "Sprawdź każde. „Dodaj jako własne” tworzy własne ćwiczenie o tej nazwie.",
  "imp.custom": "Dodaj jako własne ćwiczenie",
  "imp.import": "Importuj",
  "imp.cancel": "Anuluj",
  "imp.routines": "Zapisz też swoje plany",
  "imp.routinesHint": "Treningi zrobione więcej niż raz pod tą samą nazwą staną się planami: {names}.",
  "imp.routinesDone": {
    one: "Zapisano {count} plan.",
    few: "Zapisano {count} plany.",
    many: "Zapisano {count} planów.",
    other: "Zapisano {count} planu.",
  },
  "imp.bodyTitle": "Importuj masę ciała i pomiary",
  "imp.bodySummary": {
    one: "{count} ważenie, pomiary: {measures}",
    few: "{count} ważenia, pomiary: {measures}",
    many: "{count} ważeń, pomiary: {measures}",
    other: "{count} ważenia, pomiary: {measures}",
  },
  "imp.bodyAgain": "Dni, które mają już ważenie lub dany pomiar, zachowują twoje dane.",
  "imp.bodyDone": {
    one: "Zaimportowano {count} ważenie (pomiary: {measures}).",
    few: "Zaimportowano {count} ważenia (pomiary: {measures}).",
    many: "Zaimportowano {count} ważeń (pomiary: {measures}).",
    other: "Zaimportowano {count} ważenia (pomiary: {measures}).",
  },
  "imp.bodyAlready": "Te odczyty już tu są.",
};
