// The words around a translated exercise guide page (/<lang>/exercises/<id>/, docs/decisions/public-pages-and-seo.md
// "Translated exercise guides"). The guide itself is in src/content/exerciseGuides/<lang>.ts, and the lift's name,
// setup, cues, muscles and equipment come from the app's own catalogues (fromApp.ts), so they read the same as in the
// app. English pages keep their own wording in src/app/exercises/[slug]/page.tsx. Placeholders: {name} the lift,
// already set in the sentence's case (inName), {app} the app's name, {kg} a body weight, {muscle} a muscle.
import type { SiteLang } from "@/lib/siteLang";

export type GuideLang = Exclude<SiteLang, "en">;

export interface ExercisePageText {
  /** Breadcrumb for the exercise library (an English page). */
  library: string;
  /** Page title (search result) and its description. */
  title: string;
  description: string;
  mainMuscles: string;
  alsoWorks: string;
  equipment: string;
  noEquipment: string;
  dragHint: string;
  howTo: string;
  setup: string;
  musclesWorked: string;
  imageAlt: string;
  mainTag: string;
  mistakes: string;
  setsReps: string;
  setsNote: string;
  startTitle: string;
  startBody: string;
  woman: string;
  man: string;
  levelNew: string;
  levelSome: string;
  experience: string;
  emptyBar: string;
  perDumbbell: string;
  kettlebell: string;
  startNote: string;
  midTitle: string;
  midBody: string;
  midButton: string;
  variations: string;
  alternatives: string;
  alternativesBody: string;
  moreOf: string;
  questions: string;
  endTitle: string;
  endBody: string;
  sticky: string;
  /** Said once near the top: links in the guide go to English pages. */
  englishLinks: string;
}

export const EXERCISE_TEXT: Record<GuideLang, ExercisePageText> = {
  es: {
    library: "Ejercicios",
    title: "{name}: técnica, errores comunes, series y repeticiones",
    description:
      "Cómo hacer {name}: preparación y claves, errores comunes, series y repeticiones, peso inicial, músculos trabajados y las mejores alternativas.",
    mainMuscles: "Músculos principales",
    alsoWorks: "También trabaja",
    equipment: "Equipo",
    noEquipment: "Sin equipo",
    dragHint: "Arrastra para girar la figura. Los músculos resaltados son los que hacen el trabajo.",
    howTo: "Cómo se hace",
    setup: "Preparación",
    musclesWorked: "Músculos trabajados",
    imageAlt: "{name}: figura 3D a mitad de repetición con los músculos que trabaja resaltados",
    mainTag: "principal",
    mistakes: "Errores comunes",
    setsReps: "Series y repeticiones",
    setsNote:
      "Termina la mayoría de las series una a tres repeticiones antes del fallo, y sube el peso cuando llegues al tope del rango en todas las series.",
    startTitle: "Peso inicial",
    startBody:
      "Un peso que podrías levantar unas 10 veces, para una mujer de {women} kg y un hombre de {men} kg. Ajústalo a tu peso corporal y empieza más ligero si dudas.",
    woman: "Mujer, {kg} kg",
    man: "Hombre, {kg} kg",
    levelNew: "Principiante",
    levelSome: "Con algo de experiencia",
    experience: "Experiencia",
    emptyBar: "La barra vacía, o una barra fija o EZ más ligera",
    perDumbbell: "por mancuerna",
    kettlebell: "pesa rusa",
    startNote:
      "Salen de los mismos porcentajes que usa {app} para tu primera sesión, que luego apunta a un par de repeticiones menos y se ajusta según lo que registres.",
    midTitle: "¿Qué peso usar en {name}?",
    midBody: "{app} lo calcula a partir de tu peso corporal y tu experiencia, y suma una repetición o un disco cuando te lo has ganado.",
    midButton: "Calcular mis pesos",
    variations: "Variantes",
    alternatives: "Alternativas",
    alternativesBody: "Ejercicios que trabajan los mismos músculos principales.",
    moreOf: "Más ejercicios: {muscle}",
    questions: "Preguntas",
    endTitle: "Pon {name} en un plan que se adapta",
    endBody:
      "{app} decide cuándo hacerlo, cuántas series y repeticiones y con qué peso, según tu recuperación y tu última sesión. Registra cada serie con un toque; el descanso empieza solo.",
    sticky: "Un plan que se adapta a ti",
    englishLinks: "Los enlaces de esta guía llevan a páginas en inglés.",
  },
  fr: {
    library: "Exercices",
    title: "{name} : technique, erreurs courantes, séries et répétitions",
    description:
      "Comment faire {name} : mise en place et repères, erreurs courantes, séries et répétitions, charge de départ, muscles travaillés et meilleures alternatives.",
    mainMuscles: "Muscles principaux",
    alsoWorks: "Travaille aussi",
    equipment: "Matériel",
    noEquipment: "Sans matériel",
    dragHint: "Faites glisser pour tourner la figure. Les muscles en surbrillance sont ceux qui travaillent.",
    howTo: "Comment le faire",
    setup: "Mise en place",
    musclesWorked: "Muscles travaillés",
    imageAlt: "{name} : figure 3D en pleine répétition, muscles travaillés en surbrillance",
    mainTag: "principal",
    mistakes: "Erreurs courantes",
    setsReps: "Séries et répétitions",
    setsNote:
      "Arrêtez la plupart des séries une à trois répétitions avant l’échec, et ajoutez du poids quand vous atteignez le haut de la fourchette à chaque série.",
    startTitle: "Charge de départ",
    startBody:
      "Une charge que vous pourriez soulever environ 10 fois, pour une femme de {women} kg et un homme de {men} kg. Adaptez-la à votre poids et commencez plus léger en cas de doute.",
    woman: "Femme, {kg} kg",
    man: "Homme, {kg} kg",
    levelNew: "Débutant",
    levelSome: "Un peu d’expérience",
    experience: "Expérience",
    emptyBar: "La barre à vide, ou une barre fixe ou EZ plus légère",
    perDumbbell: "par haltère",
    kettlebell: "kettlebell",
    startNote:
      "Ces valeurs viennent des mêmes proportions que {app} utilise pour une première séance, qui vise ensuite deux répétitions de moins et s’ajuste selon ce que vous notez.",
    midTitle: "Quelle charge pour {name} ?",
    midBody:
      "{app} la calcule à partir de votre poids et de votre expérience, puis ajoute une répétition ou un disque quand vous l’avez mérité.",
    midButton: "Calculer mes charges",
    variations: "Variantes",
    alternatives: "Alternatives",
    alternativesBody: "Des exercices qui travaillent les mêmes muscles principaux.",
    moreOf: "Plus d’exercices : {muscle}",
    questions: "Questions",
    endTitle: "Mettez {name} dans un programme qui s’adapte",
    endBody:
      "{app} décide quand le faire, combien de séries et de répétitions et avec quelle charge, selon votre récupération et votre dernière séance. Notez chaque série d’un toucher ; le repos démarre tout seul.",
    sticky: "Un programme qui s’adapte à vous",
    englishLinks: "Les liens de ce guide mènent à des pages en anglais.",
  },
  de: {
    library: "Übungen",
    title: "{name}: Technik, häufige Fehler, Sätze und Wiederholungen",
    description:
      "So machst du {name}: Ausgangsposition und Hinweise, häufige Fehler, Sätze und Wiederholungen, Startgewicht, trainierte Muskeln und die besten Alternativen.",
    mainMuscles: "Hauptmuskeln",
    alsoWorks: "Trainiert auch",
    equipment: "Ausrüstung",
    noEquipment: "Ohne Ausrüstung",
    dragHint: "Zieh, um die Figur zu drehen. Die hervorgehobenen Muskeln leisten die Arbeit.",
    howTo: "So geht’s",
    setup: "Ausgangsposition",
    musclesWorked: "Trainierte Muskeln",
    imageAlt: "{name}: 3D-Figur mitten in der Wiederholung, trainierte Muskeln hervorgehoben",
    mainTag: "Haupt",
    mistakes: "Häufige Fehler",
    setsReps: "Sätze und Wiederholungen",
    setsNote:
      "Beende die meisten Sätze ein bis drei Wiederholungen vor dem Muskelversagen und erhöhe das Gewicht, sobald du in jedem Satz das obere Ende erreichst.",
    startTitle: "Startgewicht",
    startBody:
      "Ein Gewicht, das du etwa 10-mal schaffen würdest, für eine Frau mit {women} kg und einen Mann mit {men} kg. Passe es an dein Körpergewicht an und fang im Zweifel leichter an.",
    woman: "Frau, {kg} kg",
    man: "Mann, {kg} kg",
    levelNew: "Neu im Krafttraining",
    levelSome: "Etwas Erfahrung",
    experience: "Erfahrung",
    emptyBar: "Die leere Stange oder eine leichtere Fix- oder SZ-Stange",
    perDumbbell: "pro Kurzhantel",
    kettlebell: "Kettlebell",
    startNote:
      "Die Werte stammen aus denselben Anteilen, die {app} für die erste Einheit nutzt. Danach zielt die App ein paar Wiederholungen darunter und passt sich an das an, was du einträgst.",
    midTitle: "Welches Gewicht für {name}?",
    midBody:
      "{app} berechnet es aus deinem Körpergewicht und deiner Erfahrung und legt eine Wiederholung oder eine Scheibe drauf, wenn du sie dir verdient hast.",
    midButton: "Meine Gewichte berechnen",
    variations: "Varianten",
    alternatives: "Alternativen",
    alternativesBody: "Übungen, die dieselben Hauptmuskeln trainieren.",
    moreOf: "Mehr Übungen: {muscle}",
    questions: "Fragen",
    endTitle: "{name} in einem Plan, der sich anpasst",
    endBody:
      "{app} entscheidet, wann du die Übung machst, wie viele Sätze und Wiederholungen und mit welchem Gewicht, nach deiner Erholung und deiner letzten Einheit. Jeder Satz mit einem Tippen eingetragen; die Pause startet von selbst.",
    sticky: "Ein Plan, der sich dir anpasst",
    englishLinks: "Die Links in diesem Guide führen zu englischen Seiten.",
  },
  it: {
    library: "Esercizi",
    title: "{name}: tecnica, errori comuni, serie e ripetizioni",
    description:
      "Come fare {name}: posizione di partenza e consigli, errori comuni, serie e ripetizioni, carico iniziale, muscoli allenati e le migliori alternative.",
    mainMuscles: "Muscoli principali",
    alsoWorks: "Allena anche",
    equipment: "Attrezzatura",
    noEquipment: "Senza attrezzatura",
    dragHint: "Trascina per ruotare la figura. I muscoli evidenziati sono quelli che lavorano.",
    howTo: "Come si fa",
    setup: "Posizione di partenza",
    musclesWorked: "Muscoli allenati",
    imageAlt: "{name}: figura 3D a metà ripetizione con i muscoli allenati evidenziati",
    mainTag: "principale",
    mistakes: "Errori comuni",
    setsReps: "Serie e ripetizioni",
    setsNote:
      "Chiudi la maggior parte delle serie da una a tre ripetizioni prima del cedimento, e aumenta il peso quando arrivi in cima all’intervallo in tutte le serie.",
    startTitle: "Carico iniziale",
    startBody:
      "Un peso che potresti sollevare circa 10 volte, per una donna di {women} kg e un uomo di {men} kg. Adattalo al tuo peso corporeo e parti più leggero se hai dubbi.",
    woman: "Donna, {kg} kg",
    man: "Uomo, {kg} kg",
    levelNew: "Alle prime armi",
    levelSome: "Un po’ di esperienza",
    experience: "Esperienza",
    emptyBar: "Il bilanciere scarico, o un bilanciere fisso o EZ più leggero",
    perDumbbell: "per manubrio",
    kettlebell: "kettlebell",
    startNote:
      "Vengono dalle stesse proporzioni che {app} usa per la prima sessione, che poi punta a un paio di ripetizioni in meno e si adatta a ciò che registri.",
    midTitle: "Che peso usare per {name}?",
    midBody:
      "{app} lo calcola dal tuo peso corporeo e dalla tua esperienza, poi aggiunge una ripetizione o un disco quando te lo sei guadagnato.",
    midButton: "Calcola i miei pesi",
    variations: "Varianti",
    alternatives: "Alternative",
    alternativesBody: "Esercizi che allenano gli stessi muscoli principali.",
    moreOf: "Altri esercizi: {muscle}",
    questions: "Domande",
    endTitle: "Metti {name} in un piano che si adatta",
    endBody:
      "{app} decide quando farlo, quante serie e ripetizioni e con quale peso, in base al tuo recupero e all’ultima sessione. Registri ogni serie con un tocco; il recupero parte da solo.",
    sticky: "Un piano che si adatta a te",
    englishLinks: "I link di questa guida portano a pagine in inglese.",
  },
  ja: {
    library: "エクササイズ",
    title: "{name}：フォーム、よくある間違い、セット数と回数",
    description:
      "{name}のやり方：準備とポイント、よくある間違い、セット数と回数、最初の重量、鍛えられる筋肉、おすすめの代替種目をまとめました。",
    mainMuscles: "主に使う筋肉",
    alsoWorks: "補助的に使う筋肉",
    equipment: "器具",
    noEquipment: "器具なし",
    dragHint: "ドラッグでフィギュアを回転できます。ハイライトされた筋肉が主に働きます。",
    howTo: "やり方",
    setup: "準備",
    musclesWorked: "鍛えられる筋肉",
    imageAlt: "{name}：動作中の3Dフィギュア。使う筋肉をハイライト",
    mainTag: "メイン",
    mistakes: "よくある間違い",
    setsReps: "セット数と回数",
    setsNote: "ほとんどのセットは限界の1〜3回手前で止め、すべてのセットで回数の上限に届いたら重量を上げましょう。",
    startTitle: "最初の重量",
    startBody:
      "約10回挙げられる重さの目安です（体重{women}kgの女性、{men}kgの男性の場合）。自分の体重に合わせて調整し、迷ったら軽めから始めましょう。",
    woman: "女性 {kg}kg",
    man: "男性 {kg}kg",
    levelNew: "初心者",
    levelSome: "経験あり",
    experience: "経験",
    emptyBar: "バーのみ、またはより軽い固定バーやEZバー",
    perDumbbell: "（ダンベル1個あたり）",
    kettlebell: "（ケトルベル）",
    startNote: "{app}が最初のセッションで使うのと同じ割合から出した値です。アプリはそこから数回分の余裕を残し、記録に合わせて調整します。",
    midTitle: "{name}は何kgで行うべき？",
    midBody: "{app}は体重と経験から重量を計算し、達成できたら回数やプレートを追加します。",
    midButton: "自分の重量を出す",
    variations: "バリエーション",
    alternatives: "代替種目",
    alternativesBody: "同じ主要な筋肉を鍛えるエクササイズです。",
    moreOf: "{muscle}のエクササイズをもっと見る",
    questions: "よくある質問",
    endTitle: "{name}を自動で調整されるプランに",
    endBody:
      "{app}は回復状態と前回のセッションから、いつ行うか、セット数と回数、重量を決めます。各セットはワンタップで記録、休憩タイマーも自動で始まります。",
    sticky: "あなたに合わせて変わるプラン",
    englishLinks: "このガイド内のリンク先は英語のページです。",
  },
};
