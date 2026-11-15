// The words of the strength standards pages drawn from real lifters (/strength-standards/ and /strength-standards/<lift>/,
// src/server/standardsPage.ts; docs/decisions/public-pages-and-seo.md "Strength standards from lifters"). The page is
// drawn in the reader's language (Accept-Language). Placeholders: {lift} a lift's name, {n} a count, {min} the smallest
// group shown, {date} a date, {kg} a weight, {app} the app's name.
import type { MsgLang } from "@/lib/messageText";

export interface StandardsText {
  crumbs: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  men: string;
  women: string;
  bodyweight: string;
  lifters: string;
  p25: string;
  p50: string;
  p75: string;
  p90: string;
  everyone: string;
  under: string;
  range: string;
  over: string;
  readTitle: string;
  read: string;
  methodTitle: string;
  method: string;
  updated: string;
  yoursTitle: string;
  yoursBody: string;
  yoursLink: string;
  oneRmLink: string;
  countTitle: string;
  countBody: string;
  others: string;
  index: { title: string; description: string; h1: string; intro: string; count: string; empty: string; emptyBody: string };
  gone: string;
  goneBody: string;
}

export const STANDARDS_TEXT: Record<MsgLang, StandardsText> = {
  en: {
    crumbs: "Strength standards",
    title: "{lift} strength standards from {n} lifters",
    description:
      "How much real lifters {lift}: the 25th, 50th, 75th and 90th percentile estimated one-rep max of {n} {app} lifters, by sex and body weight.",
    h1: "{lift} strength standards from real lifters",
    intro: "The best estimated one-rep max {n} {app} lifters reached in the past year, by sex and body weight. Real lifts, not a formula.",
    men: "Men",
    women: "Women",
    bodyweight: "Body weight",
    lifters: "Lifters",
    p25: "25th",
    p50: "Median",
    p75: "75th",
    p90: "90th",
    everyone: "Everyone",
    under: "Under {kg} kg",
    range: "{kg}–{to} kg",
    over: "{kg} kg and up",
    readTitle: "How to read it",
    read: "Half the lifters in a group lift more than the median and half less. A quarter lift more than the 75th percentile, and one in ten more than the 90th.",
    methodTitle: "Where the numbers come from",
    method:
      "Each lifter's best set of 1 to 10 reps in the past 12 months, turned into an estimated one-rep max with the Epley formula. Only lifters 18 and over who count their lifts in strength standards, with their sex and body weight set. Results no real lift reaches are left out, and a group only shows once it has at least {min} lifters. No one lifter can be picked out.",
    updated: "Updated {date}",
    yoursTitle: "Where do you stand?",
    yoursBody: "Put in your own lift to see your estimated one-rep max, then check it against the table.",
    yoursLink: "Strength standards calculator",
    oneRmLink: "One-rep max calculator",
    countTitle: "Count your lifts",
    countBody:
      "In {app}, Settings › Your data and privacy › Strength standards decides whether your lifts count here. They're never shown on their own, only inside a group of {min} or more.",
    others: "Other lifts",
    index: {
      title: "Strength standards from real lifters",
      description:
        "How much real lifters squat, bench, deadlift and press, by sex and body weight, from the lifts of people who train with {app}.",
      h1: "Strength standards from real lifters",
      intro: "Percentiles from real lifts, by sex and body weight, updated every day.",
      count: "{n} lifters",
      empty: "Not enough lifters yet",
      emptyBody:
        "A lift gets its page once at least {n} lifters count their lifts in it. Until then, the strength standards calculator estimates yours from published standards.",
    },
    gone: "No standards for this lift yet",
    goneBody: "Not enough lifters count this lift yet. It shows here once enough do.",
  },
  es: {
    crumbs: "Estándares de fuerza",
    title: "Estándares de fuerza en {lift} de {n} personas",
    description:
      "Cuánto levanta la gente real en {lift}: los percentiles 25, 50, 75 y 90 del 1RM estimado de {n} personas que usan {app}, por sexo y peso corporal.",
    h1: "Estándares de fuerza en {lift} de personas reales",
    intro:
      "El mejor 1RM estimado que {n} personas que usan {app} lograron en el último año, por sexo y peso corporal. Levantamientos reales, no una fórmula.",
    men: "Hombres",
    women: "Mujeres",
    bodyweight: "Peso corporal",
    lifters: "Personas",
    p25: "P25",
    p50: "Mediana",
    p75: "P75",
    p90: "P90",
    everyone: "Todos",
    under: "Menos de {kg} kg",
    range: "{kg}–{to} kg",
    over: "{kg} kg o más",
    readTitle: "Cómo leerlo",
    read: "La mitad del grupo levanta más que la mediana y la otra mitad menos. Una cuarta parte levanta más que el percentil 75, y una de cada diez más que el 90.",
    methodTitle: "De dónde salen los números",
    method:
      "La mejor serie de 1 a 10 repeticiones de cada persona en los últimos 12 meses, convertida en 1RM estimado con la fórmula de Epley. Solo mayores de 18 años que cuentan sus levantamientos en los estándares de fuerza, con sexo y peso corporal indicados. Se descartan los resultados que ningún levantamiento real alcanza, y un grupo solo aparece cuando tiene al menos {min} personas. Nadie puede identificarse por separado.",
    updated: "Actualizado el {date}",
    yoursTitle: "¿Dónde estás tú?",
    yoursBody: "Pon tu propio levantamiento para ver tu 1RM estimado y compáralo con la tabla.",
    yoursLink: "Calculadora de estándares de fuerza",
    oneRmLink: "Calculadora de 1RM",
    countTitle: "Cuenta tus levantamientos",
    countBody:
      "En {app}, Ajustes › Tus datos y privacidad › Estándares de fuerza decide si tus levantamientos cuentan aquí. Nunca se muestran por separado, solo dentro de un grupo de {min} o más.",
    others: "Otros ejercicios",
    index: {
      title: "Estándares de fuerza de personas reales",
      description:
        "Cuánto hace la gente real en sentadilla, press de banca, peso muerto y press militar, por sexo y peso corporal, con los levantamientos de quienes entrenan con {app}.",
      h1: "Estándares de fuerza de personas reales",
      intro: "Percentiles de levantamientos reales, por sexo y peso corporal, actualizados cada día.",
      count: "{n} personas",
      empty: "Aún no hay suficientes personas",
      emptyBody:
        "Un ejercicio tiene su página cuando al menos {n} personas cuentan sus levantamientos en él. Hasta entonces, la calculadora de estándares de fuerza estima el tuyo con estándares publicados.",
    },
    gone: "Aún no hay estándares para este ejercicio",
    goneBody: "Todavía no hay suficientes personas que cuenten este ejercicio. Aparecerá aquí cuando las haya.",
  },
  fr: {
    crumbs: "Standards de force",
    title: "Standards de force : {lift}, d’après {n} pratiquants",
    description:
      "Ce que soulèvent de vrais pratiquants : les 25e, 50e, 75e et 90e centiles du 1RM estimé de {n} utilisateurs de {app} pour {lift}, par sexe et poids de corps.",
    h1: "Standards de force : {lift}, d’après de vrais pratiquants",
    intro:
      "Le meilleur 1RM estimé atteint l’an dernier par {n} utilisateurs de {app}, par sexe et poids de corps. De vraies levées, pas une formule.",
    men: "Hommes",
    women: "Femmes",
    bodyweight: "Poids de corps",
    lifters: "Pratiquants",
    p25: "25e",
    p50: "Médiane",
    p75: "75e",
    p90: "90e",
    everyone: "Tout le monde",
    under: "Moins de {kg} kg",
    range: "{kg}–{to} kg",
    over: "{kg} kg et plus",
    readTitle: "Comment le lire",
    read: "La moitié d’un groupe soulève plus que la médiane et l’autre moitié moins. Un quart soulève plus que le 75e centile, et un sur dix plus que le 90e.",
    methodTitle: "D’où viennent les chiffres",
    method:
      "La meilleure série de 1 à 10 répétitions de chacun sur les 12 derniers mois, convertie en 1RM estimé avec la formule d’Epley. Seulement les 18 ans et plus qui comptent leurs levées dans les standards de force, avec leur sexe et leur poids de corps renseignés. Les résultats qu’aucune vraie levée n’atteint sont écartés, et un groupe n’apparaît qu’à partir de {min} pratiquants. Personne ne peut être identifié seul.",
    updated: "Mis à jour le {date}",
    yoursTitle: "Où en êtes-vous ?",
    yoursBody: "Entrez votre propre levée pour voir votre 1RM estimé, puis comparez-le au tableau.",
    yoursLink: "Calculateur de standards de force",
    oneRmLink: "Calculateur de 1RM",
    countTitle: "Comptez vos levées",
    countBody:
      "Dans {app}, Réglages › Vos données et confidentialité › Standards de force décide si vos levées comptent ici. Elles ne sont jamais montrées seules, seulement dans un groupe de {min} ou plus.",
    others: "Autres exercices",
    index: {
      title: "Standards de force de vrais pratiquants",
      description:
        "Ce que soulèvent de vrais pratiquants au squat, au développé couché, au soulevé de terre et au développé militaire, par sexe et poids de corps, avec {app}.",
      h1: "Standards de force de vrais pratiquants",
      intro: "Des centiles de vraies levées, par sexe et poids de corps, mis à jour chaque jour.",
      count: "{n} pratiquants",
      empty: "Pas encore assez de pratiquants",
      emptyBody:
        "Un exercice a sa page dès qu’au moins {n} pratiquants y comptent leurs levées. D’ici là, le calculateur de standards de force estime le vôtre à partir de standards publiés.",
    },
    gone: "Pas encore de standards pour cet exercice",
    goneBody: "Pas encore assez de pratiquants comptent cet exercice. Il apparaîtra ici dès qu’il y en aura assez.",
  },
  de: {
    crumbs: "Kraftstandards",
    title: "Kraftstandards {lift} von {n} Trainierenden",
    description:
      "Was echte Trainierende schaffen: 25., 50., 75. und 90. Perzentil des geschätzten 1RM von {n} {app}-Nutzern bei {lift}, nach Geschlecht und Körpergewicht.",
    h1: "Kraftstandards {lift} von echten Trainierenden",
    intro:
      "Das beste geschätzte 1RM, das {n} {app}-Nutzer im letzten Jahr geschafft haben, nach Geschlecht und Körpergewicht. Echte Lifts, keine Formel.",
    men: "Männer",
    women: "Frauen",
    bodyweight: "Körpergewicht",
    lifters: "Personen",
    p25: "25.",
    p50: "Median",
    p75: "75.",
    p90: "90.",
    everyone: "Alle",
    under: "Unter {kg} kg",
    range: "{kg}–{to} kg",
    over: "Ab {kg} kg",
    readTitle: "So liest du es",
    read: "Die Hälfte einer Gruppe hebt mehr als den Median, die andere Hälfte weniger. Ein Viertel hebt mehr als das 75. Perzentil, und jede zehnte Person mehr als das 90.",
    methodTitle: "Woher die Zahlen kommen",
    method:
      "Der beste Satz mit 1 bis 10 Wiederholungen jeder Person in den letzten 12 Monaten, mit der Epley-Formel in ein geschätztes 1RM umgerechnet. Nur Personen ab 18, die ihre Lifts in den Kraftstandards zählen und Geschlecht und Körpergewicht angegeben haben. Ergebnisse, die kein echter Lift erreicht, fallen weg, und eine Gruppe erscheint erst ab {min} Personen. Niemand ist einzeln erkennbar.",
    updated: "Aktualisiert am {date}",
    yoursTitle: "Wo stehst du?",
    yoursBody: "Gib deinen eigenen Lift ein, um dein geschätztes 1RM zu sehen, und vergleiche es mit der Tabelle.",
    yoursLink: "Kraftstandards-Rechner",
    oneRmLink: "1RM-Rechner",
    countTitle: "Zähl deine Lifts",
    countBody:
      "In {app} entscheidet Einstellungen › Deine Daten und Datenschutz › Kraftstandards, ob deine Lifts hier zählen. Sie erscheinen nie einzeln, nur in einer Gruppe von {min} oder mehr.",
    others: "Weitere Übungen",
    index: {
      title: "Kraftstandards von echten Trainierenden",
      description:
        "Was echte Trainierende bei Kniebeuge, Bankdrücken, Kreuzheben und Schulterdrücken schaffen, nach Geschlecht und Körpergewicht, aus den Lifts von {app}-Nutzern.",
      h1: "Kraftstandards von echten Trainierenden",
      intro: "Perzentile aus echten Lifts, nach Geschlecht und Körpergewicht, jeden Tag aktualisiert.",
      count: "{n} Personen",
      empty: "Noch nicht genug Personen",
      emptyBody:
        "Eine Übung bekommt ihre Seite, sobald mindestens {n} Personen ihre Lifts darin zählen. Bis dahin schätzt der Kraftstandards-Rechner deinen Wert aus veröffentlichten Standards.",
    },
    gone: "Noch keine Standards für diese Übung",
    goneBody: "Noch zählen nicht genug Personen diese Übung. Sie erscheint hier, sobald es genug sind.",
  },
  it: {
    crumbs: "Standard di forza",
    title: "Standard di forza per {lift} da {n} persone",
    description:
      "Quanto alzano le persone reali: 25°, 50°, 75° e 90° percentile del massimale stimato di {n} persone che usano {app} per {lift}, per sesso e peso corporeo.",
    h1: "Standard di forza per {lift} da persone reali",
    intro:
      "Il miglior massimale stimato raggiunto nell’ultimo anno da {n} persone che usano {app}, per sesso e peso corporeo. Alzate vere, non una formula.",
    men: "Uomini",
    women: "Donne",
    bodyweight: "Peso corporeo",
    lifters: "Persone",
    p25: "25°",
    p50: "Mediana",
    p75: "75°",
    p90: "90°",
    everyone: "Tutti",
    under: "Meno di {kg} kg",
    range: "{kg}–{to} kg",
    over: "{kg} kg e oltre",
    readTitle: "Come leggerlo",
    read: "Metà del gruppo alza più della mediana e metà meno. Un quarto alza più del 75° percentile, e uno su dieci più del 90°.",
    methodTitle: "Da dove vengono i numeri",
    method:
      "La miglior serie da 1 a 10 ripetizioni di ogni persona negli ultimi 12 mesi, trasformata in massimale stimato con la formula di Epley. Solo persone dai 18 anni in su che contano le loro alzate negli standard di forza, con sesso e peso corporeo indicati. I risultati che nessuna alzata reale raggiunge sono esclusi, e un gruppo compare solo con almeno {min} persone. Nessuno può essere identificato da solo.",
    updated: "Aggiornato il {date}",
    yoursTitle: "Tu dove sei?",
    yoursBody: "Inserisci la tua alzata per vedere il tuo massimale stimato e confrontalo con la tabella.",
    yoursLink: "Calcolatore degli standard di forza",
    oneRmLink: "Calcolatore del massimale",
    countTitle: "Conta le tue alzate",
    countBody:
      "In {app}, Impostazioni › I tuoi dati e la privacy › Standard di forza decide se le tue alzate contano qui. Non sono mai mostrate da sole, solo dentro un gruppo di {min} o più.",
    others: "Altri esercizi",
    index: {
      title: "Standard di forza da persone reali",
      description:
        "Quanto fanno le persone reali in squat, panca, stacco e lento avanti, per sesso e peso corporeo, dalle alzate di chi si allena con {app}.",
      h1: "Standard di forza da persone reali",
      intro: "Percentili da alzate vere, per sesso e peso corporeo, aggiornati ogni giorno.",
      count: "{n} persone",
      empty: "Non ci sono ancora abbastanza persone",
      emptyBody:
        "Un esercizio ha la sua pagina quando almeno {n} persone ci contano le loro alzate. Fino ad allora, il calcolatore degli standard di forza stima il tuo da standard pubblicati.",
    },
    gone: "Ancora nessuno standard per questo esercizio",
    goneBody: "Non abbastanza persone contano ancora questo esercizio. Comparirà qui quando saranno abbastanza.",
  },
  ja: {
    crumbs: "筋力スタンダード",
    title: "{n}人の記録による{lift}の筋力スタンダード",
    description: "実際のリフターの記録：{app}ユーザー{n}人の{lift}の推定1RMを、性別と体重別に25・50・75・90パーセンタイルで紹介。",
    h1: "実際のリフターによる{lift}の筋力スタンダード",
    intro: "{app}ユーザー{n}人が過去1年に達成した最高の推定1RMを、性別と体重別にまとめました。計算式ではなく実際の記録です。",
    men: "男性",
    women: "女性",
    bodyweight: "体重",
    lifters: "人数",
    p25: "25%",
    p50: "中央値",
    p75: "75%",
    p90: "90%",
    everyone: "全員",
    under: "{kg} kg未満",
    range: "{kg}〜{to} kg",
    over: "{kg} kg以上",
    readTitle: "見方",
    read: "グループの半分が中央値より重く、半分が軽い重量を挙げています。75パーセンタイルより重く挙げるのは4人に1人、90パーセンタイルより重いのは10人に1人です。",
    methodTitle: "数字の出どころ",
    method:
      "各リフターの過去12か月で最高の1〜10レップのセットを、Epley式で推定1RMに換算しています。対象は、筋力スタンダードへの記録の提供をオンにしていて、性別と体重を設定している18歳以上の人だけです。実際にはありえない記録は除き、グループは{min}人以上になってから表示します。個人が特定されることはありません。",
    updated: "{date}更新",
    yoursTitle: "あなたはどのあたり？",
    yoursBody: "自分の記録を入れて推定1RMを出し、表と比べてみましょう。",
    yoursLink: "筋力スタンダード計算機",
    oneRmLink: "1RM計算機",
    countTitle: "記録を提供する",
    countBody:
      "{app}の「設定 › データとプライバシー › 筋力スタンダード」で、ここに記録を含めるか選べます。個人の記録が単独で表示されることはなく、{min}人以上のグループの中でだけ使われます。",
    others: "ほかの種目",
    index: {
      title: "実際のリフターによる筋力スタンダード",
      description:
        "スクワット、ベンチプレス、デッドリフト、オーバーヘッドプレスを実際のリフターがどれだけ挙げているか。{app}ユーザーの記録から性別と体重別に。",
      h1: "実際のリフターによる筋力スタンダード",
      intro: "実際の記録から出したパーセンタイルを、性別と体重別に毎日更新しています。",
      count: "{n}人",
      empty: "まだ人数が足りません",
      emptyBody:
        "種目ごとに{n}人以上が記録を提供するとページができます。それまでは、筋力スタンダード計算機が公開されている基準からあなたの位置を推定します。",
    },
    gone: "この種目のスタンダードはまだありません",
    goneBody: "この種目の記録を提供している人がまだ足りません。十分な人数になればここに表示されます。",
  },
};
