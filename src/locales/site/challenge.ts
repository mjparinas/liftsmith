// The words of the 30-day challenge pages (/challenges/<slug>/ and /<lang>/challenges/<slug>/;
// docs/decisions/thirty-day-challenges.md). Each challenge's own name and one-line why come from the app's
// catalogue (c30.*, through fromApp.ts), so the page and the app say the same thing. Placeholders: {name} the
// challenge, {why} its line, {app} the app's name, {start} and {end} day 1's and day 30's amounts, {total} the
// whole month's, {n} a number, {lift} an exercise, {site} the site's address.
import type { SiteLang } from "@/lib/siteLang";
import type { ThirtyLevel } from "@/lib/thirtyDay";

export interface ChallengeText {
  challenges: string;
  title: string;
  description: string;
  intro: string;
  level: string;
  levels: Record<ThirtyLevel, string>;
  reps: string;
  secs: string;
  perLeg: string;
  rest: string;
  day: string;
  calTitle: string;
  calIntro: string;
  print: string;
  printNote: string;
  sheetName: string;
  sheetStart: string;
  sheetFoot: string;
  qr: string;
  join: string;
  joinBody: string;
  levelsTitle: string;
  levelLine: string;
  howTitle: string;
  rulesTitle: string;
  rules: string[];
  rulesHold: string;
  faqTitle: string;
  qWorks: string;
  aWorks: string;
  qMiss: string;
  aMiss: string;
  qDaily: string;
  aDaily: string;
  qAfter: string;
  aAfter: string;
  more: string;
  sticky: string;
  end: { title: string; body: string };
  index: { title: string; description: string; h1: string; intro: string; range: string };
}

export const CHALLENGE_TEXT: Record<SiteLang, ChallengeText> = {
  en: {
    challenges: "30-day challenges",
    title: "{name}: free printable calendar",
    description: "{why} A 30-day plan at three levels, a calendar to print and a free app that counts every day for you.",
    intro: "{why} Pick your level, print the calendar and tick off one day at a time, or join in the {app} app and it counts for you.",
    level: "Your level",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    reps: "reps",
    secs: "seconds",
    perLeg: "each leg",
    rest: "Rest",
    day: "Day {n}",
    calTitle: "Your 30-day calendar",
    calIntro: "Day 1 is {start} and day 30 is {end}. Every fourth day is a rest day. {total} in all.",
    print: "Print the calendar",
    printNote: "It prints on one page, at the level you picked, with a box to tick each day.",
    sheetName: "Name",
    sheetStart: "Start date",
    sheetFoot: "Free from {site}",
    qr: "Scan to track it in the app",
    join: "Join in the app",
    joinBody: "{app} shows today's number, ticks the day off and waits for you after a missed day. Free on Android, iPhone and the web.",
    levelsTitle: "Which level is for you?",
    levelLine: "{level}: {lift}, from {start} on day 1 to {end} on day 30.",
    howTitle: "How to do it",
    rulesTitle: "The rules",
    rules: [
      "Do the day's number once a day, in as many sets as you like.",
      "Every fourth day is a rest day: your muscles get stronger while they recover.",
      "Missed a day? Pick up where you left off, not where the calendar has got to.",
      "Good form beats a bigger number. End a set when your form slips.",
    ],
    rulesHold: "Hold for the day's seconds, in as many goes as you need. The seconds add up.",
    faqTitle: "Questions",
    qWorks: "Does a {name} work?",
    aWorks:
      "Thirty days of steady practice makes the move easier and builds muscular endurance, and the daily habit is the bigger prize. For more strength after it, add weight and fewer reps: {app} plans that for you from your gym and your recovery.",
    qMiss: "What if I miss a day?",
    aMiss:
      "Nothing is lost. Do the day you're on next time, rather than jumping ahead to catch up. The app works the same way: a missed day waits for you.",
    qDaily: "Is it safe to do it every day?",
    aDaily:
      "These numbers are fine for most people most days, and every fourth day is a rest. Stop if something hurts in a sharp or lasting way, and ask a doctor or physiotherapist if it keeps hurting.",
    qAfter: "What should I do after 30 days?",
    aAfter: "Go again at the next level, try another challenge, or move on to a program with weights. {app} builds each workout for you.",
    more: "More 30-day challenges",
    sticky: "Track your 30 days in {app}",
    end: {
      title: "One move a day, counted for you",
      body: "{app} keeps your challenge on Today with the day's number and a one-tap Done, then plans real workouts when you want more.",
    },
    index: {
      title: "30-day fitness challenges: free printable calendars",
      description:
        "Free 30-day challenges for squats, push-ups, planks, pull-ups and more, each at three levels with a printable calendar and an app that tracks every day.",
      h1: "30-day challenges",
      intro:
        "One move a day for 30 days, a little more each day, with a rest day every fourth day. Each challenge comes at three levels, with a calendar to print and a free app that counts the days for you.",
      range: "{start} to {end}",
    },
  },
  es: {
    challenges: "Retos de 30 días",
    title: "{name}: calendario gratis para imprimir",
    description: "{why} Un plan de 30 días en tres niveles, un calendario para imprimir y una app gratis que cuenta cada día por ti.",
    intro: "{why} Elige tu nivel, imprime el calendario y marca un día cada vez, o únete en la app {app} y ella lleva la cuenta.",
    level: "Tu nivel",
    levels: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" },
    reps: "repeticiones",
    secs: "segundos",
    perLeg: "por pierna",
    rest: "Descanso",
    day: "Día {n}",
    calTitle: "Tu calendario de 30 días",
    calIntro: "El día 1 son {start} y el día 30 son {end}. Cada cuarto día es de descanso. {total} en total.",
    print: "Imprimir el calendario",
    printNote: "Se imprime en una página, con el nivel que elegiste y una casilla para marcar cada día.",
    sheetName: "Nombre",
    sheetStart: "Fecha de inicio",
    sheetFoot: "Gratis en {site}",
    qr: "Escanea para seguirlo en la app",
    join: "Unirme en la app",
    joinBody: "{app} te muestra la cifra de hoy, marca el día y te espera si te saltas uno. Gratis en Android, iPhone y la web.",
    levelsTitle: "¿Qué nivel es el tuyo?",
    levelLine: "{level}: {lift}, de {start} el día 1 a {end} el día 30.",
    howTitle: "Cómo se hace",
    rulesTitle: "Las reglas",
    rules: [
      "Haz la cifra del día una vez al día, en las series que quieras.",
      "Cada cuarto día es de descanso: los músculos se fortalecen mientras se recuperan.",
      "¿Te saltaste un día? Sigue por donde lo dejaste, no por donde va el calendario.",
      "La buena técnica vale más que una cifra mayor. Termina la serie cuando la técnica falle.",
    ],
    rulesHold: "Aguanta los segundos del día en tantos intentos como necesites. Los segundos se suman.",
    faqTitle: "Preguntas",
    qWorks: "¿Funciona el {name}?",
    aWorks:
      "Treinta días de práctica constante hacen el ejercicio más fácil y mejoran la resistencia muscular, y el hábito diario es el mayor premio. Para ganar más fuerza después, añade peso y menos repeticiones: {app} lo planifica por ti según tu gimnasio y tu recuperación.",
    qMiss: "¿Y si me salto un día?",
    aMiss:
      "No pierdes nada. La próxima vez haz el día en el que vas, sin saltar para recuperar. La app funciona igual: un día perdido te espera.",
    qDaily: "¿Es seguro hacerlo todos los días?",
    aDaily:
      "Estas cifras van bien a casi todo el mundo casi todos los días, y cada cuarto día es de descanso. Para si algo duele de forma aguda o persistente, y consulta a un médico o fisioterapeuta si sigue doliendo.",
    qAfter: "¿Qué hago después de los 30 días?",
    aAfter: "Repite en el siguiente nivel, prueba otro reto o pasa a un programa con pesas. {app} prepara cada entrenamiento por ti.",
    more: "Más retos de 30 días",
    sticky: "Sigue tus 30 días en {app}",
    end: {
      title: "Un ejercicio al día, contado por ti",
      body: "{app} tiene tu reto en Hoy con la cifra del día y un Hecho de un toque, y planifica entrenamientos de verdad cuando quieras más.",
    },
    index: {
      title: "Retos fitness de 30 días: calendarios gratis",
      description:
        "Retos gratis de 30 días de sentadillas, flexiones, plancha, dominadas y más, cada uno en tres niveles con calendario para imprimir y una app que sigue cada día.",
      h1: "Retos de 30 días",
      intro:
        "Un ejercicio al día durante 30 días, un poco más cada día, con un día de descanso cada cuatro. Cada reto tiene tres niveles, un calendario para imprimir y una app gratis que cuenta los días por ti.",
      range: "De {start} a {end}",
    },
  },
  fr: {
    challenges: "Défis de 30 jours",
    title: "{name} : calendrier gratuit à imprimer",
    description:
      "{why} Un programme de 30 jours sur trois niveaux, un calendrier à imprimer et une appli gratuite qui compte chaque jour pour vous.",
    intro:
      "{why} Choisissez votre niveau, imprimez le calendrier et cochez un jour à la fois, ou rejoignez le défi dans l’appli {app}, qui compte pour vous.",
    level: "Votre niveau",
    levels: { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" },
    reps: "répétitions",
    secs: "secondes",
    perLeg: "par jambe",
    rest: "Repos",
    day: "Jour {n}",
    calTitle: "Votre calendrier de 30 jours",
    calIntro: "Le jour 1, c’est {start}, et le jour 30, {end}. Un jour sur quatre est un jour de repos. {total} au total.",
    print: "Imprimer le calendrier",
    printNote: "Il tient sur une page, au niveau choisi, avec une case à cocher pour chaque jour.",
    sheetName: "Nom",
    sheetStart: "Date de début",
    sheetFoot: "Gratuit sur {site}",
    qr: "Scannez pour le suivre dans l’appli",
    join: "Rejoindre dans l’appli",
    joinBody:
      "{app} affiche le chiffre du jour, coche la journée et vous attend après un jour manqué. Gratuit sur Android, iPhone et le Web.",
    levelsTitle: "Quel niveau choisir ?",
    levelLine: "{level} : {lift}, de {start} le jour 1 à {end} le jour 30.",
    howTitle: "Comment le faire",
    rulesTitle: "Les règles",
    rules: [
      "Faites le chiffre du jour une fois par jour, en autant de séries que vous voulez.",
      "Un jour sur quatre est un jour de repos : les muscles se renforcent pendant qu’ils récupèrent.",
      "Un jour manqué ? Reprenez là où vous en étiez, pas là où en est le calendrier.",
      "Une bonne technique vaut mieux qu’un plus gros chiffre. Arrêtez la série quand la technique se dégrade.",
    ],
    rulesHold: "Tenez les secondes du jour en autant de fois qu’il le faut. Les secondes s’additionnent.",
    faqTitle: "Questions",
    qWorks: "Le {name}, ça marche ?",
    aWorks:
      "Trente jours de pratique régulière rendent le mouvement plus facile et améliorent l’endurance musculaire, et l’habitude quotidienne est le vrai gain. Pour plus de force ensuite, ajoutez de la charge et moins de répétitions : {app} le planifie pour vous selon votre salle et votre récupération.",
    qMiss: "Et si je manque un jour ?",
    aMiss:
      "Rien n’est perdu. La fois suivante, faites le jour où vous en êtes, sans sauter pour rattraper. L’appli fonctionne pareil : un jour manqué vous attend.",
    qDaily: "Est-ce sans risque tous les jours ?",
    aDaily:
      "Ces chiffres conviennent à la plupart des gens presque tous les jours, et un jour sur quatre est un jour de repos. Arrêtez si une douleur est vive ou dure, et consultez un médecin ou un kinésithérapeute si elle persiste.",
    qAfter: "Que faire après les 30 jours ?",
    aAfter:
      "Recommencez au niveau suivant, essayez un autre défi ou passez à un programme avec charges. {app} prépare chaque séance pour vous.",
    more: "Plus de défis de 30 jours",
    sticky: "Suivez vos 30 jours dans {app}",
    end: {
      title: "Un mouvement par jour, compté pour vous",
      body: "{app} garde votre défi sur Aujourd’hui avec le chiffre du jour et un bouton Fait, puis planifie de vraies séances quand vous en voulez plus.",
    },
    index: {
      title: "Défis fitness de 30 jours : calendriers à imprimer",
      description:
        "Défis gratuits de 30 jours pour squats, pompes, gainage, tractions et plus, chacun sur trois niveaux, avec calendrier à imprimer et appli qui suit chaque jour.",
      h1: "Défis de 30 jours",
      intro:
        "Un mouvement par jour pendant 30 jours, un peu plus chaque jour, avec un jour de repos tous les quatre jours. Chaque défi existe en trois niveaux, avec un calendrier à imprimer et une appli gratuite qui compte les jours pour vous.",
      range: "De {start} à {end}",
    },
  },
  de: {
    challenges: "30-Tage-Challenges",
    title: "{name}: kostenloser Kalender zum Ausdrucken",
    description:
      "{why} Ein 30-Tage-Plan in drei Stufen, ein Kalender zum Ausdrucken und eine kostenlose App, die jeden Tag für dich zählt.",
    intro:
      "{why} Wähl deine Stufe, druck den Kalender aus und hak einen Tag nach dem anderen ab, oder mach in der {app}-App mit, die für dich mitzählt.",
    level: "Deine Stufe",
    levels: { beginner: "Einsteiger", intermediate: "Fortgeschritten", advanced: "Profi" },
    reps: "Wiederholungen",
    secs: "Sekunden",
    perLeg: "pro Bein",
    rest: "Ruhe",
    day: "Tag {n}",
    calTitle: "Dein 30-Tage-Kalender",
    calIntro: "Tag 1 sind {start}, Tag 30 sind {end}. Jeder vierte Tag ist ein Ruhetag. {total} insgesamt.",
    print: "Kalender drucken",
    printNote: "Er passt auf eine Seite, in der gewählten Stufe, mit einem Kästchen zum Abhaken für jeden Tag.",
    sheetName: "Name",
    sheetStart: "Startdatum",
    sheetFoot: "Kostenlos von {site}",
    qr: "Scannen und in der App verfolgen",
    join: "In der App mitmachen",
    joinBody:
      "{app} zeigt die Zahl für heute, hakt den Tag ab und wartet nach einem verpassten Tag auf dich. Kostenlos für Android, iPhone und im Web.",
    levelsTitle: "Welche Stufe passt zu dir?",
    levelLine: "{level}: {lift}, von {start} an Tag 1 bis {end} an Tag 30.",
    howTitle: "So geht’s",
    rulesTitle: "Die Regeln",
    rules: [
      "Mach die Zahl des Tages einmal am Tag, in so vielen Sätzen, wie du willst.",
      "Jeder vierte Tag ist ein Ruhetag: Muskeln werden stärker, während sie sich erholen.",
      "Einen Tag verpasst? Mach dort weiter, wo du aufgehört hast, nicht dort, wo der Kalender steht.",
      "Saubere Technik ist mehr wert als eine größere Zahl. Beende den Satz, wenn die Technik nachlässt.",
    ],
    rulesHold: "Halte die Sekunden des Tages in so vielen Anläufen, wie du brauchst. Die Sekunden zählen zusammen.",
    faqTitle: "Fragen",
    qWorks: "Bringt die {name} etwas?",
    aWorks:
      "Dreißig Tage regelmäßiges Üben machen die Übung leichter und verbessern die Kraftausdauer, und die tägliche Gewohnheit ist der größere Gewinn. Für mehr Kraft danach nimm Gewicht dazu und mach weniger Wiederholungen: {app} plant das für dich nach deinem Studio und deiner Erholung.",
    qMiss: "Was, wenn ich einen Tag verpasse?",
    aMiss:
      "Nichts ist verloren. Mach beim nächsten Mal den Tag, an dem du bist, statt aufzuholen. Die App macht es genauso: Ein verpasster Tag wartet auf dich.",
    qDaily: "Ist das jeden Tag unbedenklich?",
    aDaily:
      "Diese Zahlen passen für die meisten an den meisten Tagen, und jeder vierte Tag ist ein Ruhetag. Hör auf, wenn etwas stechend oder anhaltend schmerzt, und frag eine Ärztin oder einen Physiotherapeuten, wenn es nicht besser wird.",
    qAfter: "Was mache ich nach den 30 Tagen?",
    aAfter:
      "Mach sie noch einmal auf der nächsten Stufe, probier eine andere Challenge oder steig auf ein Programm mit Gewichten um. {app} stellt jedes Training für dich zusammen.",
    more: "Weitere 30-Tage-Challenges",
    sticky: "Verfolge deine 30 Tage in {app}",
    end: {
      title: "Eine Übung am Tag, für dich gezählt",
      body: "{app} zeigt deine Challenge unter Heute mit der Zahl des Tages und einem Tipp auf Geschafft, und plant echte Trainings, wenn du mehr willst.",
    },
    index: {
      title: "30-Tage-Fitness-Challenges: Kalender zum Ausdrucken",
      description:
        "Kostenlose 30-Tage-Challenges für Kniebeugen, Liegestütze, Plank, Klimmzüge und mehr, je in drei Stufen, mit Kalender zum Ausdrucken und einer App für jeden Tag.",
      h1: "30-Tage-Challenges",
      intro:
        "Eine Übung am Tag, 30 Tage lang, jeden Tag ein bisschen mehr, mit einem Ruhetag an jedem vierten Tag. Jede Challenge gibt es in drei Stufen, mit einem Kalender zum Ausdrucken und einer kostenlosen App, die die Tage für dich zählt.",
      range: "{start} bis {end}",
    },
  },
  it: {
    challenges: "Sfide di 30 giorni",
    title: "{name}: calendario gratis da stampare",
    description: "{why} Un piano di 30 giorni su tre livelli, un calendario da stampare e un’app gratuita che conta ogni giorno per te.",
    intro:
      "{why} Scegli il livello, stampa il calendario e spunta un giorno alla volta, oppure partecipa nell’app {app}, che tiene il conto per te.",
    level: "Il tuo livello",
    levels: { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzato" },
    reps: "ripetizioni",
    secs: "secondi",
    perLeg: "per gamba",
    rest: "Riposo",
    day: "Giorno {n}",
    calTitle: "Il tuo calendario di 30 giorni",
    calIntro: "Il giorno 1 sono {start} e il giorno 30 sono {end}. Un giorno su quattro è di riposo. {total} in tutto.",
    print: "Stampa il calendario",
    printNote: "Sta in una pagina, al livello scelto, con una casella da spuntare per ogni giorno.",
    sheetName: "Nome",
    sheetStart: "Data di inizio",
    sheetFoot: "Gratis su {site}",
    qr: "Inquadra per seguirlo nell’app",
    join: "Partecipa nell’app",
    joinBody: "{app} ti mostra il numero di oggi, spunta il giorno e ti aspetta se ne salti uno. Gratis su Android, iPhone e sul web.",
    levelsTitle: "Qual è il tuo livello?",
    levelLine: "{level}: {lift}, da {start} il giorno 1 a {end} il giorno 30.",
    howTitle: "Come si fa",
    rulesTitle: "Le regole",
    rules: [
      "Fai il numero del giorno una volta al giorno, in tutte le serie che vuoi.",
      "Un giorno su quattro è di riposo: i muscoli si rafforzano mentre recuperano.",
      "Hai saltato un giorno? Riprendi da dove eri rimasto, non da dove è arrivato il calendario.",
      "Una buona tecnica vale più di un numero più alto. Chiudi la serie quando la tecnica cede.",
    ],
    rulesHold: "Tieni i secondi del giorno in quanti tentativi ti servono. I secondi si sommano.",
    faqTitle: "Domande",
    qWorks: "La {name} funziona?",
    aWorks:
      "Trenta giorni di pratica costante rendono l’esercizio più facile e migliorano la resistenza muscolare, e l’abitudine quotidiana è il premio più grande. Per più forza dopo, aggiungi peso e fai meno ripetizioni: {app} lo pianifica per te in base alla tua palestra e al tuo recupero.",
    qMiss: "E se salto un giorno?",
    aMiss:
      "Non perdi nulla. La volta dopo fai il giorno a cui sei arrivato, senza saltare avanti per recuperare. L’app funziona allo stesso modo: un giorno saltato ti aspetta.",
    qDaily: "È sicuro farlo ogni giorno?",
    aDaily:
      "Questi numeri vanno bene per quasi tutti quasi ogni giorno, e un giorno su quattro è di riposo. Fermati se senti un dolore acuto o persistente, e chiedi a un medico o a un fisioterapista se continua.",
    qAfter: "Cosa faccio dopo i 30 giorni?",
    aAfter: "Rifalla al livello successivo, prova un’altra sfida o passa a un programma con i pesi. {app} prepara ogni allenamento per te.",
    more: "Altre sfide di 30 giorni",
    sticky: "Segui i tuoi 30 giorni in {app}",
    end: {
      title: "Un esercizio al giorno, contato per te",
      body: "{app} tiene la tua sfida in Oggi con il numero del giorno e un Fatto con un tocco, e pianifica allenamenti veri quando vuoi di più.",
    },
    index: {
      title: "Sfide fitness di 30 giorni: calendari da stampare",
      description:
        "Sfide gratuite di 30 giorni per squat, piegamenti, plank, trazioni e altro, ognuna su tre livelli con calendario da stampare e un’app che segue ogni giorno.",
      h1: "Sfide di 30 giorni",
      intro:
        "Un esercizio al giorno per 30 giorni, un po’ di più ogni giorno, con un giorno di riposo ogni quattro. Ogni sfida ha tre livelli, un calendario da stampare e un’app gratuita che conta i giorni per te.",
      range: "Da {start} a {end}",
    },
  },
  ja: {
    challenges: "30日チャレンジ",
    title: "{name}：無料で印刷できるカレンダー",
    description: "{why} 3つのレベルの30日プランと印刷用カレンダー、毎日を数えてくれる無料アプリ。",
    intro: "{why} レベルを選んでカレンダーを印刷し、1日ずつチェックしましょう。{app}アプリで参加すれば、アプリが数えてくれます。",
    level: "レベル",
    levels: { beginner: "初級", intermediate: "中級", advanced: "上級" },
    reps: "回",
    secs: "秒",
    perLeg: "片脚",
    rest: "休養",
    day: "{n}日目",
    calTitle: "30日カレンダー",
    calIntro: "1日目は{start}、30日目は{end}。4日ごとに休養日があります。合計{total}。",
    print: "カレンダーを印刷",
    printNote: "選んだレベルで1ページに収まり、毎日チェックする欄があります。",
    sheetName: "名前",
    sheetStart: "開始日",
    sheetFoot: "{site}から無料",
    qr: "スキャンしてアプリで記録",
    join: "アプリで参加",
    joinBody: "{app}は今日の回数を表示し、その日をチェックし、できなかった日も待っていてくれます。Android、iPhone、Webで無料。",
    levelsTitle: "どのレベルにする？",
    levelLine: "{level}：{lift}、1日目の{start}から30日目の{end}まで。",
    howTitle: "やり方",
    rulesTitle: "ルール",
    rules: [
      "その日の回数を1日1回。何セットに分けてもかまいません。",
      "4日ごとに休養日。筋肉は回復するあいだに強くなります。",
      "できなかった日は？カレンダーの日付ではなく、止まったところから再開します。",
      "回数より正しいフォーム。フォームが崩れたらセットを終えましょう。",
    ],
    rulesHold: "その日の秒数を、何回に分けてもかまいません。秒数は合計されます。",
    faqTitle: "よくある質問",
    qWorks: "{name}は効果がある？",
    aWorks:
      "30日間続けると動きが楽になり、筋持久力がつきます。そして毎日の習慣こそ一番の成果です。その後さらに筋力をつけるなら、重さを足して回数を減らしましょう。{app}がジムと回復具合に合わせて計画します。",
    qMiss: "1日できなかったら？",
    aMiss: "何も失いません。次は追いつこうとせず、今いる日をやりましょう。アプリも同じで、できなかった日は待っていてくれます。",
    qDaily: "毎日やっても大丈夫？",
    aDaily:
      "この回数はほとんどの人にとってたいてい問題なく、4日ごとに休養日があります。鋭い痛みや続く痛みがあればやめ、続くなら医師や理学療法士に相談してください。",
    qAfter: "30日が終わったら？",
    aAfter: "次のレベルでもう一度、別のチャレンジ、または重さを使うプログラムへ。{app}が毎回のトレーニングを組み立てます。",
    more: "ほかの30日チャレンジ",
    sticky: "{app}で30日を記録",
    end: {
      title: "1日1種目、数えるのはアプリ",
      body: "{app}は「今日」にチャレンジとその日の回数を表示し、ワンタップで完了。もっとやりたくなったら本格的なトレーニングも計画します。",
    },
    index: {
      title: "30日フィットネスチャレンジ：印刷できるカレンダー",
      description:
        "スクワット、腕立て伏せ、プランク、懸垂などの無料30日チャレンジ。それぞれ3レベル、印刷用カレンダーと毎日を記録するアプリ付き。",
      h1: "30日チャレンジ",
      intro:
        "1日1種目を30日間、毎日少しずつ増やし、4日ごとに休養日。どのチャレンジも3つのレベルがあり、印刷用カレンダーと日数を数えてくれる無料アプリが使えます。",
      range: "{start}〜{end}",
    },
  },
  pt: {
    challenges: "Desafios de 30 dias",
    title: "{name}: calendário grátis para imprimir",
    description: "{why} Um plano de 30 dias em três níveis, um calendário para imprimir e um app grátis que conta cada dia para você.",
    intro: "{why} Escolha seu nível, imprima o calendário e marque um dia de cada vez, ou entre no app {app} e ele conta para você.",
    level: "Seu nível",
    levels: { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" },
    reps: "repetições",
    secs: "segundos",
    perLeg: "por perna",
    rest: "Descanso",
    day: "Dia {n}",
    calTitle: "Seu calendário de 30 dias",
    calIntro: "O dia 1 são {start} e o dia 30 são {end}. A cada quatro dias tem um descanso. {total} no total.",
    print: "Imprimir o calendário",
    printNote: "Cabe em uma página, no nível que você escolheu, com um quadradinho para marcar cada dia.",
    sheetName: "Nome",
    sheetStart: "Data de início",
    sheetFoot: "Grátis em {site}",
    qr: "Escaneie para acompanhar no app",
    join: "Entrar pelo app",
    joinBody:
      "O {app} mostra o número de hoje, marca o dia e espera por você depois de um dia perdido. Grátis no Android, iPhone e na web.",
    levelsTitle: "Qual nível é o seu?",
    levelLine: "{level}: {lift}, de {start} no dia 1 a {end} no dia 30.",
    howTitle: "Como fazer",
    rulesTitle: "As regras",
    rules: [
      "Faça o número do dia uma vez por dia, em quantas séries quiser.",
      "A cada quatro dias tem um descanso: os músculos ficam mais fortes enquanto se recuperam.",
      "Perdeu um dia? Continue de onde parou, não de onde o calendário está.",
      "Boa técnica vale mais que um número maior. Termine a série quando a técnica cair.",
    ],
    rulesHold: "Segure os segundos do dia em quantas tentativas precisar. Os segundos se somam.",
    faqTitle: "Perguntas",
    qWorks: "O {name} funciona?",
    aWorks:
      "Trinta dias de prática constante deixam o movimento mais fácil e melhoram a resistência muscular, e o hábito diário é o maior prêmio. Para ganhar mais força depois, coloque peso e faça menos repetições: o {app} planeja isso para você pela sua academia e sua recuperação.",
    qMiss: "E se eu perder um dia?",
    aMiss:
      "Nada se perde. Na próxima vez, faça o dia em que você está, sem pular para recuperar. O app funciona igual: um dia perdido espera por você.",
    qDaily: "É seguro fazer todo dia?",
    aDaily:
      "Esses números servem para a maioria das pessoas na maioria dos dias, e a cada quatro dias tem um descanso. Pare se algo doer de forma aguda ou persistente, e procure um médico ou fisioterapeuta se continuar doendo.",
    qAfter: "O que fazer depois dos 30 dias?",
    aAfter: "Faça de novo no próximo nível, tente outro desafio ou passe para um programa com pesos. O {app} monta cada treino para você.",
    more: "Mais desafios de 30 dias",
    sticky: "Acompanhe seus 30 dias no {app}",
    end: {
      title: "Um exercício por dia, contado para você",
      body: "O {app} deixa seu desafio em Hoje com o número do dia e um Feito com um toque, e planeja treinos de verdade quando você quiser mais.",
    },
    index: {
      title: "Desafios fitness de 30 dias: calendários para imprimir",
      description:
        "Desafios grátis de 30 dias de agachamento, flexão, prancha, barra fixa e mais, cada um em três níveis, com calendário para imprimir e um app que acompanha cada dia.",
      h1: "Desafios de 30 dias",
      intro:
        "Um exercício por dia durante 30 dias, um pouco mais a cada dia, com um descanso a cada quatro dias. Cada desafio tem três níveis, um calendário para imprimir e um app grátis que conta os dias para você.",
      range: "De {start} a {end}",
    },
  },
  ko: {
    challenges: "30일 챌린지",
    title: "{name}: 무료 인쇄용 달력",
    description: "{why} 세 가지 레벨의 30일 플랜, 인쇄용 달력, 매일을 세어 주는 무료 앱.",
    intro: "{why} 레벨을 고르고 달력을 인쇄해 하루씩 체크하세요. {app} 앱에서 참여하면 앱이 대신 세어 줍니다.",
    level: "레벨",
    levels: { beginner: "초급", intermediate: "중급", advanced: "상급" },
    reps: "회",
    secs: "초",
    perLeg: "한쪽 다리",
    rest: "휴식",
    day: "{n}일째",
    calTitle: "30일 달력",
    calIntro: "1일째는 {start}, 30일째는 {end}. 4일마다 쉬는 날이 있어요. 총 {total}.",
    print: "달력 인쇄",
    printNote: "고른 레벨로 한 페이지에 인쇄되며, 날마다 체크할 칸이 있어요.",
    sheetName: "이름",
    sheetStart: "시작일",
    sheetFoot: "{site}에서 무료",
    qr: "스캔해서 앱에서 기록하기",
    join: "앱에서 참여",
    joinBody: "{app}가 오늘의 숫자를 보여 주고, 그날을 체크하고, 놓친 날에는 기다려 줍니다. Android, iPhone, 웹에서 무료.",
    levelsTitle: "어떤 레벨이 맞을까요?",
    levelLine: "{level}: {lift}, 1일째 {start}에서 30일째 {end}까지.",
    howTitle: "하는 방법",
    rulesTitle: "규칙",
    rules: [
      "그날의 숫자를 하루에 한 번, 원하는 만큼 세트로 나눠서 하세요.",
      "4일마다 쉬는 날: 근육은 회복하는 동안 강해집니다.",
      "하루 놓쳤나요? 달력 날짜가 아니라 멈춘 곳부터 이어 가세요.",
      "큰 숫자보다 좋은 자세가 먼저. 자세가 무너지면 세트를 끝내세요.",
    ],
    rulesHold: "그날의 초를 필요한 만큼 나눠서 버티세요. 초는 합산돼요.",
    faqTitle: "자주 묻는 질문",
    qWorks: "{name}는 효과가 있나요?",
    aWorks:
      "30일 동안 꾸준히 하면 동작이 쉬워지고 근지구력이 생기며, 매일의 습관이 가장 큰 성과예요. 그 뒤에 더 강해지려면 무게를 더하고 횟수를 줄이세요. {app}가 헬스장과 회복 상태에 맞춰 계획해 줍니다.",
    qMiss: "하루 놓치면요?",
    aMiss: "잃는 건 없어요. 다음에는 따라잡으려 건너뛰지 말고 지금 있는 날을 하세요. 앱도 똑같이, 놓친 날은 기다려 줍니다.",
    qDaily: "매일 해도 괜찮나요?",
    aDaily:
      "이 숫자는 대부분의 사람에게 대부분의 날에 괜찮고, 4일마다 쉬는 날이 있어요. 찌르거나 오래가는 통증이 있으면 멈추고, 계속 아프면 의사나 물리치료사와 상의하세요.",
    qAfter: "30일이 끝나면 뭘 하나요?",
    aAfter: "다음 레벨로 다시 하거나, 다른 챌린지를 하거나, 무게를 쓰는 프로그램으로 넘어가세요. {app}가 매번 운동을 짜 줍니다.",
    more: "다른 30일 챌린지",
    sticky: "{app}에서 30일 기록하기",
    end: {
      title: "하루 한 동작, 세는 건 앱이",
      body: "{app}는 오늘 화면에 챌린지와 그날의 숫자, 한 번에 누르는 완료를 보여 주고, 더 원하면 제대로 된 운동도 계획해 줍니다.",
    },
    index: {
      title: "30일 피트니스 챌린지: 무료 인쇄용 달력",
      description: "스쿼트, 푸시업, 플랭크, 턱걸이 등 무료 30일 챌린지. 각각 세 가지 레벨, 인쇄용 달력, 매일을 기록하는 앱.",
      h1: "30일 챌린지",
      intro:
        "하루 한 동작을 30일 동안, 매일 조금씩 더하고 4일마다 쉽니다. 모든 챌린지에 세 가지 레벨이 있고, 인쇄용 달력과 날짜를 세어 주는 무료 앱이 있어요.",
      range: "{start}~{end}",
    },
  },
  pl: {
    challenges: "Wyzwania 30-dniowe",
    title: "{name}: darmowy kalendarz do druku",
    description: "{why} 30-dniowy plan na trzech poziomach, kalendarz do wydruku i darmowa aplikacja, która liczy za ciebie każdy dzień.",
    intro:
      "{why} Wybierz poziom, wydrukuj kalendarz i odhaczaj dzień po dniu albo dołącz w aplikacji {app}, a ona będzie liczyć za ciebie.",
    level: "Twój poziom",
    levels: { beginner: "Początkujący", intermediate: "Średniozaawansowany", advanced: "Zaawansowany" },
    reps: "powtórzeń",
    secs: "sekund",
    perLeg: "na nogę",
    rest: "Odpoczynek",
    day: "Dzień {n}",
    calTitle: "Twój 30-dniowy kalendarz",
    calIntro: "Dzień 1 to {start}, a dzień 30 to {end}. Co czwarty dzień to odpoczynek. Łącznie {total}.",
    print: "Wydrukuj kalendarz",
    printNote: "Mieści się na jednej stronie, na wybranym poziomie, z kratką do odhaczenia na każdy dzień.",
    sheetName: "Imię",
    sheetStart: "Data startu",
    sheetFoot: "Za darmo z {site}",
    qr: "Zeskanuj, żeby śledzić w aplikacji",
    join: "Dołącz w aplikacji",
    joinBody:
      "{app} pokazuje dzisiejszą liczbę, odhacza dzień i czeka na ciebie po opuszczonym dniu. Za darmo na Androidzie, iPhonie i w przeglądarce.",
    levelsTitle: "Który poziom dla ciebie?",
    levelLine: "{level}: {lift}, od {start} w dniu 1 do {end} w dniu 30.",
    howTitle: "Jak to robić",
    rulesTitle: "Zasady",
    rules: [
      "Zrób liczbę dnia raz dziennie, w tylu seriach, ile chcesz.",
      "Co czwarty dzień to odpoczynek: mięśnie stają się silniejsze, kiedy się regenerują.",
      "Opuściłeś dzień? Wróć tam, gdzie skończyłeś, a nie tam, gdzie jest kalendarz.",
      "Dobra technika jest ważniejsza niż większa liczba. Skończ serię, gdy technika się psuje.",
    ],
    rulesHold: "Wytrzymaj sekundy dnia w tylu podejściach, ilu potrzebujesz. Sekundy się sumują.",
    faqTitle: "Pytania",
    qWorks: "Czy {name} działa?",
    aWorks:
      "Trzydzieści dni regularnej praktyki sprawia, że ćwiczenie staje się łatwiejsze, a wytrzymałość mięśni rośnie, ale największą nagrodą jest codzienny nawyk. Żeby potem zyskać więcej siły, dodaj ciężar i zrób mniej powtórzeń: {app} zaplanuje to za ciebie według twojej siłowni i regeneracji.",
    qMiss: "Co jeśli opuszczę dzień?",
    aMiss:
      "Nic nie tracisz. Następnym razem zrób dzień, na którym jesteś, zamiast nadrabiać. Aplikacja działa tak samo: opuszczony dzień na ciebie czeka.",
    qDaily: "Czy to bezpieczne codziennie?",
    aDaily:
      "Te liczby są w porządku dla większości osób w większość dni, a co czwarty dzień to odpoczynek. Przerwij, jeśli coś boli ostro lub długo, i zapytaj lekarza albo fizjoterapeutę, jeśli ból nie mija.",
    qAfter: "Co robić po 30 dniach?",
    aAfter:
      "Zrób to jeszcze raz na wyższym poziomie, spróbuj innego wyzwania albo przejdź na plan z ciężarami. {app} układa każdy trening za ciebie.",
    more: "Więcej wyzwań 30-dniowych",
    sticky: "Śledź swoje 30 dni w {app}",
    end: {
      title: "Jedno ćwiczenie dziennie, policzone za ciebie",
      body: "{app} trzyma twoje wyzwanie na ekranie Dziś z liczbą dnia i przyciskiem Zrobione, a gdy zechcesz więcej, planuje prawdziwe treningi.",
    },
    index: {
      title: "Wyzwania fitness na 30 dni: kalendarze do druku",
      description:
        "Darmowe 30-dniowe wyzwania: przysiady, pompki, deska, podciąganie i więcej, każde na trzech poziomach, z kalendarzem do druku i aplikacją do śledzenia dni.",
      h1: "Wyzwania 30-dniowe",
      intro:
        "Jedno ćwiczenie dziennie przez 30 dni, każdego dnia trochę więcej, z odpoczynkiem co czwarty dzień. Każde wyzwanie ma trzy poziomy, kalendarz do wydruku i darmową aplikację, która liczy dni za ciebie.",
      range: "Od {start} do {end}",
    },
  },
  tr: {
    challenges: "30 günlük meydan okumalar",
    title: "{name}: ücretsiz yazdırılabilir takvim",
    description: "{why} Üç seviyede 30 günlük plan, yazdırılabilir takvim ve her günü senin için sayan ücretsiz bir uygulama.",
    intro: "{why} Seviyeni seç, takvimi yazdır ve günleri tek tek işaretle ya da {app} uygulamasında katıl, senin için saysın.",
    level: "Seviyen",
    levels: { beginner: "Başlangıç", intermediate: "Orta", advanced: "İleri" },
    reps: "tekrar",
    secs: "saniye",
    perLeg: "her bacak",
    rest: "Dinlenme",
    day: "{n}. gün",
    calTitle: "30 günlük takvimin",
    calIntro: "1. gün {start}, 30. gün {end}. Her dördüncü gün dinlenme günü. Toplam {total}.",
    print: "Takvimi yazdır",
    printNote: "Seçtiğin seviyede tek sayfaya sığar ve her gün için işaretlenecek bir kutusu vardır.",
    sheetName: "Ad",
    sheetStart: "Başlangıç tarihi",
    sheetFoot: "{site} adresinden ücretsiz",
    qr: "Uygulamada takip etmek için tara",
    join: "Uygulamada katıl",
    joinBody: "{app} bugünün sayısını gösterir, günü işaretler ve kaçırdığın günden sonra seni bekler. Android, iPhone ve web'de ücretsiz.",
    levelsTitle: "Hangi seviye sana uygun?",
    levelLine: "{level}: {lift}, 1. günde {start} ile 30. günde {end} arası.",
    howTitle: "Nasıl yapılır",
    rulesTitle: "Kurallar",
    rules: [
      "Günün sayısını günde bir kez, istediğin kadar sete bölerek yap.",
      "Her dördüncü gün dinlenme günü: kaslar toparlanırken güçlenir.",
      "Bir günü mü kaçırdın? Takvimin geldiği yerden değil, kaldığın yerden devam et.",
      "İyi form, daha büyük bir sayıdan önemlidir. Formun bozulunca seti bitir.",
    ],
    rulesHold: "Günün saniyelerini gerektiği kadar parçaya bölerek tut. Saniyeler toplanır.",
    faqTitle: "Sorular",
    qWorks: "{name} işe yarar mı?",
    aWorks:
      "Otuz gün düzenli pratik hareketi kolaylaştırır ve kas dayanıklılığını artırır; asıl kazanç ise günlük alışkanlıktır. Sonrasında daha fazla güç için ağırlık ekle ve tekrarı azalt: {app} bunu salonuna ve toparlanmana göre senin için planlar.",
    qMiss: "Bir günü kaçırırsam ne olur?",
    aMiss:
      "Hiçbir şey kaybolmaz. Bir dahaki sefere yetişmek için atlamak yerine bulunduğun günü yap. Uygulama da aynı şekilde çalışır: kaçırdığın gün seni bekler.",
    qDaily: "Her gün yapmak güvenli mi?",
    aDaily:
      "Bu sayılar çoğu kişi için çoğu gün uygundur ve her dördüncü gün dinlenme günüdür. Keskin ya da geçmeyen bir ağrı olursa dur, devam ederse bir doktora veya fizyoterapiste danış.",
    qAfter: "30 günden sonra ne yapmalıyım?",
    aAfter:
      "Bir sonraki seviyede yeniden yap, başka bir meydan okuma dene ya da ağırlıklı bir programa geç. {app} her antrenmanı senin için hazırlar.",
    more: "Diğer 30 günlük meydan okumalar",
    sticky: "30 gününü {app} ile takip et",
    end: {
      title: "Günde bir hareket, senin için sayılır",
      body: "{app} meydan okumanı Bugün ekranında günün sayısı ve tek dokunuşla Tamam ile tutar, daha fazlasını istediğinde gerçek antrenmanlar planlar.",
    },
    index: {
      title: "30 günlük fitness meydan okumaları: yazdırılabilir takvimler",
      description:
        "Squat, şınav, plank, barfiks ve daha fazlası için ücretsiz 30 günlük meydan okumalar; her biri üç seviyede, yazdırılabilir takvim ve her günü takip eden uygulamayla.",
      h1: "30 günlük meydan okumalar",
      intro:
        "30 gün boyunca günde bir hareket, her gün biraz daha fazla ve her dördüncü gün dinlenme. Her meydan okumanın üç seviyesi, yazdırılabilir bir takvimi ve günleri senin için sayan ücretsiz bir uygulaması var.",
      range: "{start} - {end}",
    },
  },
};
