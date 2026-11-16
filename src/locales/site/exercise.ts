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
  pt: {
    library: "Exercícios",
    title: "{name}: técnica, erros comuns, séries e repetições",
    description:
      "Como fazer {name}: posição inicial e dicas, erros comuns, séries e repetições, peso inicial, músculos trabalhados e as melhores alternativas.",
    mainMuscles: "Músculos principais",
    alsoWorks: "Também trabalha",
    equipment: "Equipamento",
    noEquipment: "Sem equipamento",
    dragHint: "Arraste para girar a figura. Os músculos destacados são os que fazem o trabalho.",
    howTo: "Como fazer",
    setup: "Posição inicial",
    musclesWorked: "Músculos trabalhados",
    imageAlt: "{name}: figura 3D no meio da repetição com os músculos trabalhados destacados",
    mainTag: "principal",
    mistakes: "Erros comuns",
    setsReps: "Séries e repetições",
    setsNote:
      "Termine a maioria das séries uma a três repetições antes da falha, e aumente o peso quando chegar ao topo da faixa em todas as séries.",
    startTitle: "Peso inicial",
    startBody:
      "Um peso que você conseguiria levantar umas 10 vezes, para uma mulher de {women} kg e um homem de {men} kg. Ajuste ao seu peso corporal e comece mais leve se estiver em dúvida.",
    woman: "Mulher, {kg} kg",
    man: "Homem, {kg} kg",
    levelNew: "Iniciante",
    levelSome: "Com alguma experiência",
    experience: "Experiência",
    emptyBar: "A barra vazia, ou uma barra fixa ou W mais leve",
    perDumbbell: "por halter",
    kettlebell: "kettlebell",
    startNote:
      "Vêm das mesmas porcentagens que o {app} usa na sua primeira sessão, que depois mira um par de repetições a menos e se ajusta conforme o que você registra.",
    midTitle: "Que peso usar em {name}?",
    midBody:
      "O {app} calcula a partir do seu peso corporal e da sua experiência, e soma uma repetição ou uma anilha quando você conquista.",
    midButton: "Calcular meus pesos",
    variations: "Variações",
    alternatives: "Alternativas",
    alternativesBody: "Exercícios que trabalham os mesmos músculos principais.",
    moreOf: "Mais exercícios: {muscle}",
    questions: "Perguntas",
    endTitle: "Coloque {name} num plano que se adapta",
    endBody:
      "O {app} decide quando fazer, quantas séries e repetições e com que peso, conforme sua recuperação e sua última sessão. Registre cada série com um toque; o descanso começa sozinho.",
    sticky: "Um plano que se adapta a você",
    englishLinks: "Os links deste guia levam a páginas em inglês.",
  },
  ko: {
    library: "운동 동작",
    title: "{name}: 자세, 흔한 실수, 세트와 반복 횟수",
    description:
      "{name} 하는 방법: 준비 자세와 핵심 포인트, 흔한 실수, 세트와 반복 횟수, 시작 무게, 사용하는 근육, 가장 좋은 대체 운동까지 알아보세요.",
    mainMuscles: "주요 근육",
    alsoWorks: "보조 근육",
    equipment: "장비",
    noEquipment: "장비 없음",
    dragHint: "드래그해서 인물을 돌려 보세요. 강조된 근육이 실제로 일하는 근육이에요.",
    howTo: "하는 방법",
    setup: "준비 자세",
    musclesWorked: "사용하는 근육",
    imageAlt: "{name}: 반복 동작 중간의 3D 인물, 사용하는 근육 강조",
    mainTag: "주동근",
    mistakes: "흔한 실수",
    setsReps: "세트와 반복 횟수",
    setsNote: "대부분의 세트는 실패 지점보다 1~3회 남기고 끝내고, 모든 세트에서 반복 범위의 상한에 도달하면 무게를 올리세요.",
    startTitle: "시작 무게",
    startBody:
      "체중 {women} kg 여성과 {men} kg 남성이 10회 정도 들 수 있는 무게예요. 내 체중에 맞게 조절하고, 확신이 없으면 더 가볍게 시작하세요.",
    woman: "여성, {kg} kg",
    man: "남성, {kg} kg",
    levelNew: "초보자",
    levelSome: "어느 정도 경험 있음",
    experience: "경험",
    emptyBar: "빈 바, 또는 더 가벼운 고정 바나 EZ 바",
    perDumbbell: "덤벨 하나당",
    kettlebell: "케틀벨",
    startNote:
      "{app}가 첫 운동에 쓰는 것과 같은 비율에서 나온 값이에요. 첫 운동은 이보다 몇 회 적게 목표를 잡고, 기록한 내용에 따라 조정돼요.",
    midTitle: "{name}, 몇 kg으로 해야 할까요?",
    midBody: "{app}가 체중과 경험으로 무게를 계산하고, 해낼 때마다 반복 1회나 원판 하나를 더해 줘요.",
    midButton: "내 무게 계산하기",
    variations: "변형 동작",
    alternatives: "대체 운동",
    alternativesBody: "같은 주요 근육을 쓰는 운동이에요.",
    moreOf: "더 많은 운동: {muscle}",
    questions: "자주 묻는 질문",
    endTitle: "{name}, 나에게 맞춰 바뀌는 계획에 넣기",
    endBody:
      "{app}가 회복 상태와 지난 운동을 바탕으로 언제 할지, 몇 세트 몇 회를 할지, 어떤 무게로 할지 정해요. 세트마다 한 번 탭으로 기록하면 휴식은 알아서 시작돼요.",
    sticky: "나에게 맞춰 바뀌는 계획",
    englishLinks: "이 가이드의 링크는 영어 페이지로 연결돼요.",
  },
  pl: {
    library: "Ćwiczenia",
    title: "{name}: technika, typowe błędy, serie i powtórzenia",
    description:
      "Jak wykonać ćwiczenie {name}: ustawienie i wskazówki, typowe błędy, serie i powtórzenia, ciężar na start, pracujące mięśnie i najlepsze alternatywy.",
    mainMuscles: "Główne mięśnie",
    alsoWorks: "Angażuje też",
    equipment: "Sprzęt",
    noEquipment: "Bez sprzętu",
    dragHint: "Przeciągnij, by obrócić postać. Podświetlone mięśnie wykonują pracę.",
    howTo: "Jak to zrobić",
    setup: "Ustawienie",
    musclesWorked: "Pracujące mięśnie",
    imageAlt: "{name}: postać 3D w połowie powtórzenia z podświetlonymi pracującymi mięśniami",
    mainTag: "główny",
    mistakes: "Typowe błędy",
    setsReps: "Serie i powtórzenia",
    setsNote:
      "Kończ większość serii jedno do trzech powtórzeń przed upadkiem mięśniowym i dokładaj ciężar, gdy we wszystkich seriach dojdziesz do górnej granicy zakresu.",
    startTitle: "Ciężar na start",
    startBody:
      "Ciężar, który podniesiesz około 10 razy, dla kobiety ważącej {women} kg i mężczyzny ważącego {men} kg. Dopasuj go do swojej masy ciała, a jeśli masz wątpliwości, zacznij lżej.",
    woman: "Kobieta, {kg} kg",
    man: "Mężczyzna, {kg} kg",
    levelNew: "Początkujący",
    levelSome: "Z pewnym doświadczeniem",
    experience: "Doświadczenie",
    emptyBar: "Pusta sztanga albo lżejsza sztanga stała lub łamana",
    perDumbbell: "na hantel",
    kettlebell: "kettlebell",
    startNote:
      "Wynikają z tych samych procentów, których {app} używa przy twoim pierwszym treningu; potem celuje w parę powtórzeń mniej i dopasowuje się do tego, co zapiszesz.",
    midTitle: "Jaki ciężar w ćwiczeniu {name}?",
    midBody: "{app} wylicza go z twojej masy ciała i doświadczenia, a gdy na to zapracujesz, dokłada powtórzenie albo talerz.",
    midButton: "Wylicz moje ciężary",
    variations: "Warianty",
    alternatives: "Alternatywy",
    alternativesBody: "Ćwiczenia, które angażują te same główne mięśnie.",
    moreOf: "Więcej ćwiczeń: {muscle}",
    questions: "Pytania",
    endTitle: "Dodaj ćwiczenie {name} do planu, który się dopasowuje",
    endBody:
      "{app} decyduje, kiedy je robić, ile serii i powtórzeń i z jakim ciężarem, na podstawie twojej regeneracji i ostatniego treningu. Zapisuj każdą serię jednym dotknięciem; przerwa włącza się sama.",
    sticky: "Plan, który dopasowuje się do ciebie",
    englishLinks: "Linki w tym poradniku prowadzą do stron po angielsku.",
  },
  tr: {
    library: "Egzersizler",
    title: "{name}: teknik, sık yapılan hatalar, set ve tekrar",
    description:
      "{name} nasıl yapılır: hazırlık ve ipuçları, sık yapılan hatalar, set ve tekrar, başlangıç ağırlığı, çalışan kaslar ve en iyi alternatifler.",
    mainMuscles: "Ana kaslar",
    alsoWorks: "Ayrıca çalıştırır",
    equipment: "Ekipman",
    noEquipment: "Ekipmansız",
    dragHint: "Figürü döndürmek için sürükle. Vurgulanan kaslar işi yapan kaslardır.",
    howTo: "Nasıl yapılır",
    setup: "Hazırlık",
    musclesWorked: "Çalışan kaslar",
    imageAlt: "{name}: tekrarın ortasında, çalıştırdığı kaslar vurgulanmış 3D figür",
    mainTag: "ana",
    mistakes: "Sık yapılan hatalar",
    setsReps: "Set ve tekrar",
    setsNote: "Setlerin çoğunu tükenişe bir ila üç tekrar kala bitir; tüm setlerde aralığın üst sınırına ulaştığında ağırlığı artır.",
    startTitle: "Başlangıç ağırlığı",
    startBody:
      "{women} kg bir kadın ve {men} kg bir erkek için yaklaşık 10 kez kaldırabileceğin bir ağırlık. Kendi vücut ağırlığına göre ayarla, emin değilsen daha hafif başla.",
    woman: "Kadın, {kg} kg",
    man: "Erkek, {kg} kg",
    levelNew: "Yeni başlayan",
    levelSome: "Biraz deneyimli",
    experience: "Deneyim",
    emptyBar: "Boş bar ya da daha hafif bir sabit bar veya EZ bar",
    perDumbbell: "dambıl başına",
    kettlebell: "kettlebell",
    startNote:
      "Bunlar {app} uygulamasının ilk antrenmanın için kullandığı yüzdelerden gelir; sonra birkaç tekrar daha azını hedefler ve kaydettiklerine göre ayarlanır.",
    midTitle: "{name} için hangi ağırlığı kullanmalı?",
    midBody: "{app} bunu vücut ağırlığından ve deneyiminden hesaplar, hak ettiğinde bir tekrar ya da bir plaka ekler.",
    midButton: "Ağırlıklarımı hesapla",
    variations: "Varyasyonlar",
    alternatives: "Alternatifler",
    alternativesBody: "Aynı ana kasları çalıştıran egzersizler.",
    moreOf: "Daha fazla egzersiz: {muscle}",
    questions: "Sorular",
    endTitle: "{name} hareketini sana uyum sağlayan bir plana ekle",
    endBody:
      "{app} toparlanmana ve son antrenmanına göre ne zaman yapacağını, kaç set ve tekrar yapacağını ve hangi ağırlıkla yapacağını belirler. Her seti tek dokunuşla kaydet; dinlenme kendiliğinden başlar.",
    sticky: "Sana uyum sağlayan bir plan",
    englishLinks: "Bu rehberdeki bağlantılar İngilizce sayfalara gider.",
  },
};
