// The words of the program pages (/programs/<id>/ and /<lang>/programs/<id>/; docs/decisions/public-pages-and-seo.md
// "Program pages"). Each program's own name, credit, summary and steps come from the app's catalogue (pgm.*, through
// fromApp.ts), so the site says exactly what the app's program picker says. Placeholders: {name} the program, {days}
// days a week, {n} a number, {app} the app's name, {equipment} a list of kit, {summary} the program's summary.
import type { SiteLang } from "@/lib/siteLang";

export type ProgramLevel = "Beginner" | "Intermediate" | "Any level";

export interface ProgramText {
  programs: string;
  title: string;
  description: string;
  days: string;
  level: string;
  levels: Record<ProgramLevel, string>;
  equipment: string;
  anyGym: string;
  price: string;
  free: string;
  pro: string;
  credit: string;
  howTitle: string;
  weekTitle: string;
  weekIntro: string;
  splitIntro: string;
  splitMuscles: string;
  restMin: string;
  restSec: string;
  hold: string;
  trainsTitle: string;
  trainsIntro: string;
  perWeek: string;
  faqTitle: string;
  qWho: string;
  aWho: Record<ProgramLevel, string>;
  qDays: string;
  aDays: string;
  /** Added to aDays for programs of four days or fewer. */
  aDaysRest: string;
  qGear: string;
  aGear: string;
  aGearNone: string;
  qFree: string;
  aFree: string;
  aPro: string;
  more: string;
  englishLinks: string;
  sticky: string;
  mid: { title: string; body: string; button: string };
  end: { title: string; body: string };
  index: { title: string; description: string; h1: string; intro: string; fixed: string; splits: string; perWeek: string };
  indexEnd: { title: string; body: string };
}

export const PROGRAM_TEXT: Record<SiteLang, ProgramText> = {
  en: {
    programs: "Programs",
    title: "{name}: a {days}-day workout program, explained",
    description: "{summary} Every workout, how the weight goes up and what it trains.",
    days: "Days a week",
    level: "Level",
    levels: { Beginner: "Beginner", Intermediate: "Intermediate", "Any level": "Any level" },
    equipment: "Equipment",
    anyGym: "Whatever your gym has",
    price: "In {app}",
    free: "Free",
    pro: "Pro",
    credit: "Credit: {text}",
    howTitle: "How it works",
    weekTitle: "The workouts",
    weekIntro:
      "The workouts rotate in this order, one per training day. Starting weights come from your own lifts, and the program's rules raise them from there.",
    splitIntro:
      "There's no fixed list: each day's exercises, sets and weights are picked for your gym and how recovered you are. These are the muscles each day trains.",
    splitMuscles: "Trains: {muscles}",
    restMin: "{n} min rest",
    restSec: "{n} s rest",
    hold: "{n} s",
    trainsTitle: "What it trains most",
    trainsIntro: "Hard sets in a typical week for each muscle, counting half a set where a muscle helps.",
    perWeek: "{n} a week",
    faqTitle: "Questions",
    qWho: "Who is {name} for?",
    aWho: {
      Beginner: "Lifters new to the barbell or coming back after a long break. Simple progress, added every session, while it lasts.",
      Intermediate: "Lifters who've stopped adding weight every session. Progress comes weekly or monthly instead.",
      "Any level": "Anyone, from new lifters to experienced ones: the volume follows your level and recovery.",
    },
    qDays: "How many days a week is {name}?",
    aDays: "{days} days a week.",
    aDaysRest: "With a rest day or two between hard sessions.",
    qGear: "What equipment do I need for {name}?",
    aGear: "The main lifts need: {equipment}. Missing something for an accessory? {app} swaps in the closest exercise your gym can do.",
    aGearNone: "Nothing in particular: each day is planned around the equipment your gym has.",
    qFree: "Can I run {name} for free?",
    aFree: "Yes. Every fixed program is free in {app}, with every weight set for you and raised when you get your reps.",
    aPro: "It's part of {app} Pro, because the adaptive engine plans each day. Free includes every fixed program and one adaptive workout a week.",
    more: "Other programs",
    englishLinks: "",
    sticky: "Run {name} in {app}",
    mid: {
      title: "Run {name} without the spreadsheet",
      body: "{app} sets every weight, raises it when you get your reps, lowers it when you stall, and starts the rest timer itself.",
      button: "Start this program",
    },
    end: {
      title: "Every workout of {name}, planned for you",
      body: "Pick it once in {app}. Each session shows up on Today with its weights, warm-ups and plates worked out.",
    },
    index: {
      title: "Workout programs, explained",
      description:
        "Classic strength programs and splits, each explained: every workout, how the weight goes up, what it trains and who it's for.",
      h1: "Workout programs",
      intro: "Proven strength programs and training splits, with every workout and the rules that move the weight.",
      fixed: "Fixed programs",
      splits: "Adaptive splits",
      perWeek: "{n} days a week",
    },
    indexEnd: {
      title: "Pick a program once, and every workout is planned",
      body: "{app} sets every weight from your own lifts and moves it by the program's rules, so you just show up and lift.",
    },
  },
  es: {
    programs: "Programas",
    title: "{name}: un programa de {days} días a la semana, explicado",
    description: "{summary} Cada entrenamiento, cómo sube el peso y qué trabaja.",
    days: "Días por semana",
    level: "Nivel",
    levels: { Beginner: "Principiante", Intermediate: "Intermedio", "Any level": "Cualquier nivel" },
    equipment: "Material",
    anyGym: "Lo que tenga tu gimnasio",
    price: "En {app}",
    free: "Gratis",
    pro: "Pro",
    credit: "Origen: {text}",
    howTitle: "Cómo funciona",
    weekTitle: "Los entrenamientos",
    weekIntro:
      "Los entrenamientos se turnan en este orden, uno por día de entreno. Los pesos iniciales salen de tus propios levantamientos y las reglas del programa los suben desde ahí.",
    splitIntro:
      "No hay una lista fija: los ejercicios, series y pesos de cada día se eligen según tu gimnasio y tu recuperación. Estos son los músculos de cada día.",
    splitMuscles: "Trabaja: {muscles}",
    restMin: "{n} min de descanso",
    restSec: "{n} s de descanso",
    hold: "{n} s",
    trainsTitle: "Lo que más trabaja",
    trainsIntro: "Series duras en una semana normal para cada músculo, contando media serie cuando un músculo ayuda.",
    perWeek: "{n} a la semana",
    faqTitle: "Preguntas",
    qWho: "¿Para quién es «{name}»?",
    aWho: {
      Beginner: "Para quien empieza con la barra o vuelve tras un parón largo. Progreso sencillo, en cada sesión, mientras dure.",
      Intermediate: "Para quien ya no sube peso en cada sesión. El progreso llega cada semana o cada mes.",
      "Any level": "Para cualquiera, de principiante a avanzado: el volumen sigue tu nivel y tu recuperación.",
    },
    qDays: "¿Cuántos días a la semana es «{name}»?",
    aDays: "{days} días a la semana.",
    aDaysRest: "Con uno o dos días de descanso entre sesiones duras.",
    qGear: "¿Qué material necesito para «{name}»?",
    aGear:
      "Los ejercicios principales necesitan: {equipment}. ¿Te falta algo para un accesorio? {app} pone el ejercicio más parecido que permita tu gimnasio.",
    aGearNone: "Nada en concreto: cada día se planifica con el material que tenga tu gimnasio.",
    qFree: "¿Puedo hacer «{name}» gratis?",
    aFree: "Sí. Todos los programas fijos son gratis en {app}, con cada peso calculado por ti y subido cuando completas tus repeticiones.",
    aPro: "Es parte de {app} Pro, porque el motor adaptativo planifica cada día. La versión gratis incluye todos los programas fijos y un entrenamiento adaptativo a la semana.",
    more: "Otros programas",
    englishLinks: "Los ejercicios enlazados están en inglés salvo las guías traducidas.",
    sticky: "Haz «{name}» con {app}",
    mid: {
      title: "Haz «{name}» sin hoja de cálculo",
      body: "{app} pone cada peso, lo sube cuando completas tus repeticiones, lo baja cuando te estancas y arranca el descanso solo.",
      button: "Empezar este programa",
    },
    end: {
      title: "Cada entrenamiento de «{name}», planificado para ti",
      body: "Elígelo una vez en {app}. Cada sesión aparece en Hoy con sus pesos, calentamientos y discos calculados.",
    },
    index: {
      title: "Programas de entrenamiento, explicados",
      description:
        "Programas clásicos de fuerza y rutinas divididas, cada uno explicado: cada entrenamiento, cómo sube el peso, qué trabaja y para quién es.",
      h1: "Programas de entrenamiento",
      intro: "Programas de fuerza probados y rutinas divididas, con cada entrenamiento y las reglas que suben el peso.",
      fixed: "Programas fijos",
      splits: "Rutinas adaptativas",
      perWeek: "{n} días a la semana",
    },
    indexEnd: {
      title: "Elige un programa una vez y cada entrenamiento queda planificado",
      body: "{app} pone cada peso a partir de tus levantamientos y lo mueve según las reglas del programa: solo tienes que entrenar.",
    },
  },
  fr: {
    programs: "Programmes",
    title: "{name} : un programme de {days} jours par semaine, expliqué",
    description: "{summary} Chaque séance, comment la charge augmente et ce qu’il travaille.",
    days: "Jours par semaine",
    level: "Niveau",
    levels: { Beginner: "Débutant", Intermediate: "Intermédiaire", "Any level": "Tous niveaux" },
    equipment: "Matériel",
    anyGym: "Ce que votre salle propose",
    price: "Dans {app}",
    free: "Gratuit",
    pro: "Pro",
    credit: "Origine : {text}",
    howTitle: "Comment ça marche",
    weekTitle: "Les séances",
    weekIntro:
      "Les séances tournent dans cet ordre, une par jour d’entraînement. Les charges de départ viennent de vos propres levées, puis les règles du programme les augmentent.",
    splitIntro:
      "Pas de liste fixe : les exercices, séries et charges de chaque jour sont choisis selon votre salle et votre récupération. Voici les muscles de chaque jour.",
    splitMuscles: "Travaille : {muscles}",
    restMin: "{n} min de repos",
    restSec: "{n} s de repos",
    hold: "{n} s",
    trainsTitle: "Ce qu’il travaille le plus",
    trainsIntro: "Séries difficiles dans une semaine type pour chaque muscle, en comptant une demi-série quand un muscle aide.",
    perWeek: "{n} par semaine",
    faqTitle: "Questions",
    qWho: "À qui s’adresse « {name} » ?",
    aWho: {
      Beginner:
        "Aux débutants à la barre ou à ceux qui reprennent après une longue pause. Une progression simple, à chaque séance, tant qu’elle dure.",
      Intermediate: "À ceux qui n’ajoutent plus de charge à chaque séance. La progression vient chaque semaine ou chaque mois.",
      "Any level": "À tout le monde, du débutant au confirmé : le volume suit votre niveau et votre récupération.",
    },
    qDays: "Combien de jours par semaine pour « {name} » ?",
    aDays: "{days} jours par semaine.",
    aDaysRest: "Avec un ou deux jours de repos entre les séances difficiles.",
    qGear: "Quel matériel faut-il pour « {name} » ?",
    aGear:
      "Les exercices principaux demandent : {equipment}. Il manque quelque chose pour un accessoire ? {app} met l’exercice le plus proche que votre salle permet.",
    aGearNone: "Rien de particulier : chaque jour est planifié avec le matériel de votre salle.",
    qFree: "Peut-on suivre « {name} » gratuitement ?",
    aFree:
      "Oui. Tous les programmes fixes sont gratuits dans {app}, avec chaque charge calculée pour vous et augmentée quand vous faites vos répétitions.",
    aPro: "Il fait partie de {app} Pro, car le moteur adaptatif planifie chaque jour. La version gratuite comprend tous les programmes fixes et une séance adaptative par semaine.",
    more: "Autres programmes",
    englishLinks: "Les exercices liés sont en anglais, sauf les guides traduits.",
    sticky: "Suivez « {name} » avec {app}",
    mid: {
      title: "Suivez « {name} » sans tableur",
      body: "{app} fixe chaque charge, l’augmente quand vous faites vos répétitions, la baisse quand vous stagnez et lance le repos tout seul.",
      button: "Commencer ce programme",
    },
    end: {
      title: "Chaque séance de « {name} », planifiée pour vous",
      body: "Choisissez-le une fois dans {app}. Chaque séance apparaît dans Aujourd’hui avec ses charges, échauffements et disques calculés.",
    },
    index: {
      title: "Programmes d’entraînement, expliqués",
      description:
        "Programmes de force classiques et splits, chacun expliqué : chaque séance, comment la charge augmente, ce qu’il travaille et pour qui.",
      h1: "Programmes d’entraînement",
      intro: "Des programmes de force éprouvés et des splits, avec chaque séance et les règles qui font monter la charge.",
      fixed: "Programmes fixes",
      splits: "Splits adaptatifs",
      perWeek: "{n} jours par semaine",
    },
    indexEnd: {
      title: "Choisissez un programme une fois, chaque séance est planifiée",
      body: "{app} fixe chaque charge à partir de vos levées et la fait évoluer selon les règles du programme : vous n’avez qu’à soulever.",
    },
  },
  de: {
    programs: "Programme",
    title: "{name}: ein Trainingsplan für {days} Tage die Woche, erklärt",
    description: "{summary} Jedes Training, wie das Gewicht steigt und was es trainiert.",
    days: "Tage pro Woche",
    level: "Level",
    levels: { Beginner: "Einsteiger", Intermediate: "Fortgeschritten", "Any level": "Jedes Level" },
    equipment: "Ausrüstung",
    anyGym: "Was dein Studio hat",
    price: "In {app}",
    free: "Kostenlos",
    pro: "Pro",
    credit: "Ursprung: {text}",
    howTitle: "So funktioniert es",
    weekTitle: "Die Trainings",
    weekIntro:
      "Die Trainings wechseln sich in dieser Reihenfolge ab, eins pro Trainingstag. Die Startgewichte kommen aus deinen eigenen Lifts, danach erhöhen die Regeln des Programms sie.",
    splitIntro:
      "Es gibt keine feste Liste: Übungen, Sätze und Gewichte jedes Tages werden für dein Studio und deine Erholung gewählt. Das sind die Muskeln jedes Tages.",
    splitMuscles: "Trainiert: {muscles}",
    restMin: "{n} Min. Pause",
    restSec: "{n} s Pause",
    hold: "{n} s",
    trainsTitle: "Was es am meisten trainiert",
    trainsIntro: "Harte Sätze in einer normalen Woche pro Muskel, mit einem halben Satz, wo ein Muskel mithilft.",
    perWeek: "{n} pro Woche",
    faqTitle: "Fragen",
    qWho: "Für wen ist „{name}“?",
    aWho: {
      Beginner:
        "Für alle, die neu an der Langhantel sind oder nach langer Pause zurückkommen. Einfacher Fortschritt in jeder Einheit, solange er hält.",
      Intermediate: "Für alle, die nicht mehr jede Einheit Gewicht draufpacken. Der Fortschritt kommt wöchentlich oder monatlich.",
      "Any level": "Für alle, vom Einsteiger bis zum Erfahrenen: Das Volumen folgt deinem Level und deiner Erholung.",
    },
    qDays: "Wie viele Tage die Woche hat „{name}“?",
    aDays: "{days} Tage pro Woche.",
    aDaysRest: "Mit ein oder zwei Ruhetagen zwischen harten Einheiten.",
    qGear: "Welche Ausrüstung brauche ich für „{name}“?",
    aGear:
      "Die Hauptübungen brauchen: {equipment}. Fehlt etwas für eine Zusatzübung? {app} setzt die ähnlichste Übung ein, die dein Studio möglich macht.",
    aGearNone: "Nichts Bestimmtes: Jeder Tag wird mit der Ausrüstung deines Studios geplant.",
    qFree: "Kann ich „{name}“ kostenlos machen?",
    aFree:
      "Ja. Alle festen Programme sind in {app} kostenlos, mit jedem Gewicht für dich berechnet und erhöht, wenn du deine Wiederholungen schaffst.",
    aPro: "Es gehört zu {app} Pro, weil die adaptive Planung jeden Tag plant. Kostenlos sind alle festen Programme und ein adaptives Training pro Woche.",
    more: "Weitere Programme",
    englishLinks: "Verlinkte Übungen sind auf Englisch, außer den übersetzten Guides.",
    sticky: "„{name}“ mit {app} trainieren",
    mid: {
      title: "„{name}“ ohne Tabelle",
      body: "{app} setzt jedes Gewicht, erhöht es, wenn du deine Wiederholungen schaffst, senkt es bei einem Stillstand und startet die Pause von selbst.",
      button: "Dieses Programm starten",
    },
    end: {
      title: "Jedes Training von „{name}“, für dich geplant",
      body: "Wähl es einmal in {app}. Jede Einheit erscheint unter Heute, mit Gewichten, Aufwärmsätzen und Scheiben schon ausgerechnet.",
    },
    index: {
      title: "Trainingsprogramme, erklärt",
      description:
        "Klassische Kraftprogramme und Splits, jedes erklärt: jedes Training, wie das Gewicht steigt, was es trainiert und für wen es ist.",
      h1: "Trainingsprogramme",
      intro: "Bewährte Kraftprogramme und Trainingssplits, mit jedem Training und den Regeln, die das Gewicht steigen lassen.",
      fixed: "Feste Programme",
      splits: "Adaptive Splits",
      perWeek: "{n} Tage pro Woche",
    },
    indexEnd: {
      title: "Einmal ein Programm wählen, und jedes Training ist geplant",
      body: "{app} setzt jedes Gewicht aus deinen eigenen Lifts und bewegt es nach den Regeln des Programms. Du musst nur noch trainieren.",
    },
  },
  it: {
    programs: "Programmi",
    title: "{name}: un programma di {days} giorni a settimana, spiegato",
    description: "{summary} Ogni allenamento, come sale il peso e cosa allena.",
    days: "Giorni a settimana",
    level: "Livello",
    levels: { Beginner: "Principiante", Intermediate: "Intermedio", "Any level": "Ogni livello" },
    equipment: "Attrezzatura",
    anyGym: "Quello che ha la tua palestra",
    price: "In {app}",
    free: "Gratis",
    pro: "Pro",
    credit: "Origine: {text}",
    howTitle: "Come funziona",
    weekTitle: "Gli allenamenti",
    weekIntro:
      "Gli allenamenti si alternano in quest’ordine, uno per giorno di allenamento. I pesi di partenza vengono dalle tue alzate e le regole del programma li fanno salire da lì.",
    splitIntro:
      "Non c’è una lista fissa: esercizi, serie e pesi di ogni giorno sono scelti per la tua palestra e il tuo recupero. Questi sono i muscoli di ogni giorno.",
    splitMuscles: "Allena: {muscles}",
    restMin: "{n} min di recupero",
    restSec: "{n} s di recupero",
    hold: "{n} s",
    trainsTitle: "Cosa allena di più",
    trainsIntro: "Serie dure in una settimana tipo per ogni muscolo, contando mezza serie quando un muscolo aiuta.",
    perWeek: "{n} a settimana",
    faqTitle: "Domande",
    qWho: "Per chi è «{name}»?",
    aWho: {
      Beginner: "Per chi è nuovo al bilanciere o riprende dopo una lunga pausa. Progressi semplici, a ogni sessione, finché durano.",
      Intermediate: "Per chi non aggiunge più peso a ogni sessione. I progressi arrivano ogni settimana o ogni mese.",
      "Any level": "Per chiunque, dal principiante all’esperto: il volume segue il tuo livello e il tuo recupero.",
    },
    qDays: "Quanti giorni a settimana è «{name}»?",
    aDays: "{days} giorni a settimana.",
    aDaysRest: "Con uno o due giorni di riposo tra le sessioni dure.",
    qGear: "Che attrezzatura serve per «{name}»?",
    aGear:
      "Gli esercizi principali richiedono: {equipment}. Manca qualcosa per un complementare? {app} mette l’esercizio più simile che la tua palestra permette.",
    aGearNone: "Niente in particolare: ogni giorno è pianificato con l’attrezzatura della tua palestra.",
    qFree: "Posso seguire «{name}» gratis?",
    aFree: "Sì. Tutti i programmi fissi sono gratis in {app}, con ogni peso calcolato per te e aumentato quando completi le ripetizioni.",
    aPro: "Fa parte di {app} Pro, perché il motore adattivo pianifica ogni giorno. La versione gratuita include tutti i programmi fissi e un allenamento adattivo a settimana.",
    more: "Altri programmi",
    englishLinks: "Gli esercizi collegati sono in inglese, tranne le guide tradotte.",
    sticky: "Segui «{name}» con {app}",
    mid: {
      title: "Segui «{name}» senza foglio di calcolo",
      body: "{app} imposta ogni peso, lo alza quando completi le ripetizioni, lo abbassa quando ti blocchi e avvia il recupero da solo.",
      button: "Inizia questo programma",
    },
    end: {
      title: "Ogni allenamento di «{name}», pianificato per te",
      body: "Sceglilo una volta in {app}. Ogni sessione compare in Oggi con pesi, riscaldamento e dischi già calcolati.",
    },
    index: {
      title: "Programmi di allenamento, spiegati",
      description: "Programmi di forza classici e split, ognuno spiegato: ogni allenamento, come sale il peso, cosa allena e per chi è.",
      h1: "Programmi di allenamento",
      intro: "Programmi di forza collaudati e split di allenamento, con ogni allenamento e le regole che fanno salire il peso.",
      fixed: "Programmi fissi",
      splits: "Split adattivi",
      perWeek: "{n} giorni a settimana",
    },
    indexEnd: {
      title: "Scegli un programma una volta e ogni allenamento è pianificato",
      body: "{app} imposta ogni peso dalle tue alzate e lo muove secondo le regole del programma: devi solo allenarti.",
    },
  },
  ja: {
    programs: "プログラム",
    title: "{name}：週{days}日のトレーニングプログラムを解説",
    description: "{summary}すべてのワークアウト、重量の上げ方、鍛えられる部位。",
    days: "週の日数",
    level: "レベル",
    levels: { Beginner: "初心者", Intermediate: "中級者", "Any level": "全レベル" },
    equipment: "器具",
    anyGym: "ジムにあるもの",
    price: "{app}では",
    free: "無料",
    pro: "Pro",
    credit: "元になったもの：{text}",
    howTitle: "やり方",
    weekTitle: "ワークアウト",
    weekIntro:
      "ワークアウトはこの順番で、トレーニング日ごとに1つずつ回します。始める重量は自分の記録から決まり、そこからプログラムのルールで上がっていきます。",
    splitIntro:
      "決まったリストはありません。毎日の種目、セット数、重量はジムと回復具合に合わせて選ばれます。各日に鍛える筋肉はこちらです。",
    splitMuscles: "鍛える部位：{muscles}",
    restMin: "休憩{n}分",
    restSec: "休憩{n}秒",
    hold: "{n}秒",
    trainsTitle: "主に鍛えられる部位",
    trainsIntro: "通常の1週間で各筋肉が行うハードセット数。補助として働く筋肉は0.5セットで数えています。",
    perWeek: "週{n}セット",
    faqTitle: "よくある質問",
    qWho: "「{name}」はどんな人向け？",
    aWho: {
      Beginner: "バーベルを始めたばかりの人や、長いブランクから戻る人向け。続く限り、毎回のセッションでシンプルに重量を伸ばせます。",
      Intermediate: "毎回重量を上げられなくなった人向け。伸びは週単位や月単位になります。",
      "Any level": "初心者から経験者まで誰でも。ボリュームはレベルと回復に合わせて変わります。",
    },
    qDays: "「{name}」は週に何日？",
    aDays: "週{days}日。",
    aDaysRest: "きついセッションの間に1〜2日の休みを入れます。",
    qGear: "「{name}」に必要な器具は？",
    aGear: "メイン種目に必要なもの：{equipment}。補助種目の器具がなくても、{app}がジムでできる一番近い種目に替えます。",
    aGearNone: "特にありません。毎日、ジムにある器具に合わせて計画されます。",
    qFree: "「{name}」は無料でできる？",
    aFree: "はい。{app}の固定プログラムはすべて無料で、重量は自動で決まり、レップを達成すると上がります。",
    aPro: "アダプティブエンジンが毎日を計画するため、{app} Proの機能です。無料版にはすべての固定プログラムと週1回のアダプティブワークアウトが含まれます。",
    more: "ほかのプログラム",
    englishLinks: "翻訳済みのガイド以外、リンク先の種目は英語です。",
    sticky: "{app}で「{name}」を始める",
    mid: {
      title: "表計算なしで「{name}」を",
      body: "{app}が毎回の重量を決め、レップを達成すれば上げ、停滞すれば下げ、休憩タイマーも自動で始めます。",
      button: "このプログラムを始める",
    },
    end: {
      title: "「{name}」の毎回のワークアウトを自動で計画",
      body: "{app}で一度選ぶだけ。毎回のセッションが重量、ウォームアップ、プレートまで計算済みで「今日」に表示されます。",
    },
    index: {
      title: "トレーニングプログラムを解説",
      description: "定番の筋力プログラムと分割法をひとつずつ解説。すべてのワークアウト、重量の上げ方、鍛えられる部位、向いている人。",
      h1: "トレーニングプログラム",
      intro: "実績のある筋力プログラムと分割法を、すべてのワークアウトと重量を上げるルールとともに紹介します。",
      fixed: "固定プログラム",
      splits: "アダプティブ分割",
      perWeek: "週{n}日",
    },
    indexEnd: {
      title: "プログラムを一度選べば、毎回のワークアウトが決まります",
      body: "{app}が自分の記録から重量を決め、プログラムのルールで調整するので、あとは挙げるだけです。",
    },
  },
};
