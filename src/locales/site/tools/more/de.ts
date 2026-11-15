import type { MoreTools } from "./types";

// TDEE, Makros, Wilks und DOTS auf Deutsch (du). Dieselben Teile wie die englischen Seiten (src/app/tools/).
export const DE_MORE: MoreTools = {
  "tdee-calculator": {
    page: {
      title: "TDEE-Rechner: Kalorien pro Tag zum Halten, Abnehmen oder Aufbauen",
      description:
        "Berechne deinen täglichen Gesamtenergieverbrauch aus Alter, Geschlecht, Größe, Gewicht und Aktivität: Grundumsatz, BMI, Kalorien für Diät oder Aufbau und ein Proteinbereich für Kraftsportler.",
      name: "TDEE-Rechner",
      intro:
        "Wie viele Kalorien du am Tag verbrauchst und was du essen solltest, um dein Gewicht zu halten, abzunehmen oder zuzunehmen. Tippe auf + und −; halte gedrückt, um schneller zu gehen.",
      sticky: "Kalorien, die deinem Wiegen folgen",
      mid: {
        title: "Immer aktuell, ohne dass du daran denkst",
        body: "Dein TDEE ändert sich mit deinem Gewicht und deinem Training. {app} berechnet ihn selbst neu aus deinen Wiegungen und den Tagen, an denen du wirklich trainierst, und zeigt den Verlauf.",
        button: "{app} öffnen",
      },
      end: {
        title: "Dein TDEE, immer aktuell",
        body: "{app} berechnet ihn aus deinen Wiegungen und deinen Trainingstagen neu und plant dazu deine Workouts.",
      },
      faq: [
        [
          "Was ist der TDEE?",
          "Der tägliche Gesamtenergieverbrauch: die Kalorien, die du an einem Tag verbrennst, mit Ruheumsatz (BMR), Verdauung, Alltagsbewegung und Sport. Isst du ungefähr so viel, bleibt dein Gewicht stabil.",
        ],
        [
          "Welche Formel wird verwendet?",
          "Mifflin-St Jeor für den Ruheumsatz, für die meisten die genaueste der gängigen Gleichungen. Mit einem Körperfettwert wechselt der Rechner zu Katch-McArdle, die von der fettfreien Masse ausgeht und besser zu muskulösen Menschen passt. Der BMR wird dann mit einem Aktivitätsfaktor von 1,2 (sitzend) bis 1,9 (Athlet) multipliziert.",
        ],
        [
          "Wie viele Kalorien zum Ab- oder Zunehmen?",
          "Etwa 500 unter dem TDEE ergeben rund 0,5 kg weniger pro Woche. Für einen sauberen Aufbau halten etwa 250 darüber den Fettzuwachs klein, während du Muskeln aufbaust. Wiege dich ein paar Mal pro Woche und passe an, wenn der Trend nicht stimmt.",
        ],
        [
          "Wie genau ist das?",
          "Jede Formel ist eine Schätzung, für die meisten Menschen oft auf 10 % genau. Die Waage hat das letzte Wort: Passt dein Trend über zwei bis drei Wochen nicht, gehe 100 bis 200 Kalorien hoch oder runter.",
        ],
        [
          "Hält {app} meinen TDEE aktuell?",
          "Ja. In {app} berechnet sich dein TDEE neu, wenn sich Gewicht, Alter oder Training ändern, liest Gewicht, Größe und Körperfett aus Health Connect oder Apple Health, wenn du es erlaubst, setzt dein Aktivitätsniveau nach den Tagen, an denen du wirklich trainierst, und zeigt den Verlauf.",
        ],
      ],
      reading: [
        { href: "/de/tools/macro-calculator/", label: "den Makro-Rechner" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "wie viel Protein für Muskelaufbau" },
        { href: "/blog/body-recomposition/", label: "Körperrekomposition" },
      ],
    },
    ui: {
      units: "Einheiten",
      metric: "Metrisch",
      imperial: "Imperial",
      sex: "Geschlecht",
      female: "Frau",
      male: "Mann",
      age: "Alter",
      weightKg: "Gewicht (kg)",
      weightLb: "Gewicht (lb)",
      heightCm: "Größe (cm)",
      heightIn: "Größe (in)",
      fat: "Körperfett (optional)",
      skip: "Weglassen",
      add: "Hinzufügen",
      fatPct: "Körperfett (%)",
      activity: "Aktivität",
    },
  },
  "macro-calculator": {
    page: {
      title: "Makro-Rechner für Kraftsportler: Protein, Fett und Kohlenhydrate",
      description:
        "Berechne Kalorien und Makros zum Fettabbau, Halten oder Muskelaufbau aus Alter, Geschlecht, Größe, Gewicht und Aktivität, mit Protein für Kraftsportler.",
      name: "Makro-Rechner",
      intro:
        "Die Kalorien für dein Ziel aus deinem TDEE, aufgeteilt in Protein, Fett und Kohlenhydrate für jemanden, der Krafttraining macht, mit dem Grund für jede Zahl.",
      sticky: "Makros, die deinem Wiegen folgen",
      mid: {
        title: "Makros, die mit dir mitgehen",
        body: "In {app} folgen deine Kalorien und Makros deinen Wiegungen und Trainingstagen, und der Coach sagt dir, wenn das Protein knapp wird.",
        button: "Kostenlos starten",
      },
      end: {
        title: "Trainiere für das Ziel, für das du isst",
        body: "{app} plant jedes Workout nach deiner Erholung und deinem Trainingsblock, damit eine Diät die Kraft hält und ein Aufbau zu Muskeln wird.",
      },
      faq: [
        [
          "Wie viel Protein brauche ich für Muskelaufbau?",
          "Die meisten Studien mit Kraftsportlern landen bei 1,6 bis 2,2 g pro kg Körpergewicht am Tag. Dieser Rechner nimmt 1,8 g zum Halten oder Aufbauen und 2,2 g in der Diät, wo mehr Protein hilft, Muskeln zu halten.",
        ],
        [
          "Wie werden Fett und Kohlenhydrate festgelegt?",
          "Fett bekommt ein Viertel der Kalorien, aber nie unter 0,6 g pro kg, für gesunde Hormone. Kohlenhydrate füllen den Rest, weil sie harte Sätze antreiben. Wenn du lieber mehr Fett und weniger Kohlenhydrate isst, tausche sie nach Kalorien: 1 g Fett hat 9 Kalorien, 1 g Kohlenhydrate 4.",
        ],
        [
          "Wie viele Kalorien zum Fettabbau oder Muskelaufbau?",
          "Etwa 500 unter deinem TDEE ergeben rund 0,5 kg weniger pro Woche, nie unter deinem Grundumsatz. Etwa 250 darüber bauen Muskeln mit wenig Fett auf. Wiege dich ein paar Mal pro Woche und passe an, wenn der Trend nicht stimmt.",
        ],
        [
          "Muss ich meine Makros genau treffen?",
          "Nein. Erreiche dein Protein und bleib an den meisten Tagen nah an deinen Kalorien; die Aufteilung zwischen Fett und Kohlenhydraten zählt viel weniger.",
        ],
      ],
      more: {
        heading: "So wird gerechnet",
        paragraphs: [
          "Der TDEE kommt aus der Mifflin-St-Jeor-Gleichung mal einem Aktivitätsfaktor, wie beim TDEE-Rechner. Dein Ziel legt die Kalorien fest: 500 weniger (nie unter dem Grundumsatz), gleich viel oder 250 mehr. Zuerst wird das Protein pro Kilo Körpergewicht festgelegt, dann das Fett, und die Kohlenhydrate bekommen den Rest.",
        ],
      },
      reading: [
        { href: "/de/tools/tdee-calculator/", label: "den TDEE-Rechner" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "wie viel Protein für Muskelaufbau" },
        { href: "/blog/lean-bulk/", label: "einen sauberen Aufbau" },
      ],
    },
    ui: {
      units: "Einheiten",
      metric: "Metrisch",
      imperial: "Imperial",
      goal: "Ziel",
      cut: "Fett abbauen",
      maintain: "Halten",
      bulk: "Muskeln aufbauen",
      sex: "Geschlecht",
      female: "Frau",
      male: "Mann",
      age: "Alter",
      weightKg: "Gewicht (kg)",
      weightLb: "Gewicht (lb)",
      heightCm: "Größe (cm)",
      heightIn: "Größe (Zoll)",
      activity: "Aktivität",
      kcalDay: "Kalorien pro Tag",
      protein: "Protein",
      fat: "Fett",
      carbs: "Kohlenhydrate",
      proteinCut: "{perKg} g pro kg Körpergewicht: das obere Ende des Bereichs, um beim Fettabbau Muskeln zu halten.",
      proteinMaintain: "{perKg} g pro kg Körpergewicht: die Mitte des Bereichs, den Kraftsportler brauchen.",
      proteinBulk: "{perKg} g pro kg Körpergewicht: genug für Muskelaufbau, die zusätzlichen Kalorien gehen in Kohlenhydrate.",
      fatWhy: "Ein Viertel deiner Kalorien und nie unter 0,6 g pro kg, für die Hormone.",
      carbsWhy: "Der Rest deiner Kalorien, als Treibstoff für harte Sätze.",
      kcalFloor: "Dein Grundumsatz von {bmr}: Ein größeres Defizit läge darunter, und das kostet Muskeln.",
      kcalCut: "500 unter deinem TDEE von {tdee}: etwa {pace} weniger pro Woche.",
      kcalMaintain: "Dein TDEE: was du an einem normalen Tag verbrennst.",
      kcalBulk: "250 über deinem TDEE von {tdee}: etwa {pace} mehr pro Woche, vor allem Muskeln.",
      meals: "Verteile das Protein auf {meals} Mahlzeiten; in Portionen von 30 bis 40 g wird es am besten genutzt.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Wilks-Rechner, mit IPF-GL-Punkten und DOTS",
      description:
        "Bewerte dein Total aus Kniebeuge, Bankdrücken und Kreuzheben nach Körpergewicht mit der Wilks-Formel, IPF-GL-Punkten (klassisch oder mit Ausrüstung) und DOTS, in kg oder lb.",
      name: "Wilks-Rechner",
      intro:
        "Dein Powerlifting-Total, auf drei Arten nach Körpergewicht bewertet, Wilks, IPF GL und DOTS, damit du Athleten jeder Größe vergleichen und den Abstand zur nächsten Stufe sehen kannst.",
      sticky: "Dein Kraftwert, immer aktuell",
      mid: {
        title: "Alle drei Werte, aus jedem Satz, den du einträgst",
        body: "{app} schätzt deine beste Kniebeuge, dein bestes Bankdrücken und Kreuzheben aus deinem Training und hält Wilks, IPF GL und DOTS aktuell, mit der Übung, die am weitesten zurückliegt.",
        button: "Kostenlos starten",
      },
      end: {
        title: "Bau ein größeres Total auf",
        body: "{app} plant jedes Workout mit Wiederholungen in Reserve, legt eine Deload-Woche ein, wenn sich Ermüdung aufbaut, und steigert jede Übung, wenn du es dir verdient hast.",
      },
      faq: [
        [
          "Was ist der Wilks-Wert?",
          "Eine Zahl, die Powerlifting-Totals über Körpergewichte hinweg vergleicht. Dein Total wird mit einem Koeffizienten aus einer von Robert Wilks veröffentlichten Formel multipliziert, sodass leichte und schwere Athleten gemeinsam gewertet werden können. Er war jahrzehntelang der Standard und wird oft noch genannt.",
        ],
        [
          "Was sind IPF-GL-Punkte?",
          "Die eigene Formel des Internationalen Powerlifting-Verbands seit 2020, manchmal Goodlift-Punkte genannt. Es gibt getrennte Versionen für klassisch (ohne Ausrüstung) und mit Ausrüstung sowie für Bankdrücken allein. Etwa 100 Punkte sind ein Total auf Weltniveau.",
        ],
        [
          "Welchen Wert sollte ich nutzen?",
          "Im Wettkampf den deines Verbands. Für deinen eigenen Fortschritt sind DOTS und IPF GL die neueren Formeln, angepasst an aktuelle Wettkampfergebnisse. Vergleiche einen Wert nur mit derselben Formel.",
        ],
        [
          "Was ist ein guter Wilks-Wert?",
          "Grob gesagt sind etwa 300 ein solides mittleres Total, 400 fortgeschritten und 450 oder mehr Elite bei Männern; die Werte der Frauen laufen auf derselben Skala. Das sind grobe Richtwerte, keine offiziellen Stufen.",
        ],
      ],
      more: {
        heading: "So werden die Werte berechnet",
        paragraphs: [
          "Wilks teilt 500 durch ein Polynom fünften Grades des Körpergewichts in Kilo, mit eigenen Koeffizienten für Männer und Frauen, und multipliziert dein Total mit dem Ergebnis. IPF GL teilt 100 durch A − B·e^(−C·Körpergewicht), mit den von der IPF veröffentlichten A, B und C für jedes Geschlecht, jede Ausrüstung und Disziplin. DOTS nutzt ein Polynom vierten Grades. Pfund werden zuerst in Kilo umgerechnet. Die Koeffizienten sind mit einem offenen Projekt für Powerlifting-Ergebnisse abgeglichen.",
        ],
      },
      reading: [
        { href: "/de/tools/dots-calculator/", label: "den DOTS-Rechner" },
        { href: "/de/tools/one-rep-max-calculator/", label: "den 1RM-Rechner" },
        { href: "/blog/how-to-increase-your-squat/", label: "eine stärkere Kniebeuge" },
      ],
    },
    ui: {
      units: "Einheiten",
      formula: "Formel",
      men: "Formel für Männer",
      women: "Formel für Frauen",
      gear: "Ausrüstung",
      classic: "Klassisch (ohne Ausrüstung)",
      equipped: "Mit Ausrüstung",
      bw: "Körpergewicht ({unit})",
      squat: "Kniebeuge",
      bench: "Bankdrücken",
      deadlift: "Kreuzheben",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      level: "DOTS-Stufe: {level}.",
      next: "Leg etwa {weight} {unit} auf dein Total, um {level} zu erreichen (DOTS {score}).",
      elite: "Das ist ein Elite-Total.",
      note: "Wilks und DOTS ändern sich nicht mit der Ausrüstung. IPF GL hat getrennte Formeln für klassisch und mit Ausrüstung, also wähle die, in der du hebst.",
      levels: { beginner: "Anfänger", novice: "Neuling", intermediate: "Mittelstufe", advanced: "Fortgeschritten", elite: "Elite" },
    },
  },
  "dots-calculator": {
    page: {
      title: "DOTS-Rechner: bewerte dein Powerlifting-Total",
      description:
        "Berechne deinen DOTS-Wert aus Kniebeuge, Bankdrücken, Kreuzheben und Körpergewicht, in kg oder lb, um Athleten jeder Größe zu vergleichen.",
      name: "DOTS-Rechner",
      intro:
        "Dein Total aus Kniebeuge, Bankdrücken und Kreuzheben nach Körpergewicht bewertet, damit ein leichter und ein schwerer Athlet sehen, wer für seine Größe stärker ist.",
      sticky: "Dein DOTS, immer aktuell",
      mid: {
        title: "Dein DOTS, aus jedem Satz",
        body: "{app} schätzt deine beste Kniebeuge, dein bestes Bankdrücken und Kreuzheben aus den Sätzen, die du einträgst, und hält deinen DOTS-Wert aktuell, ganz ohne Maximaltest.",
        button: "Kostenlos starten",
      },
      end: {
        title: "Bau ein größeres Total auf",
        body: "{app} plant dein Training in Blöcken mit Zielen für Wiederholungen in Reserve und Deload-Wochen und steigert jede Übung, wenn du es dir verdient hast.",
      },
      faq: [
        [
          "Was ist der DOTS-Wert?",
          "Eine Art, Powerlifting-Totals über Körpergewichte hinweg zu vergleichen. Dein Total wird mit einem Koeffizienten multipliziert, der von deinem Körpergewicht abhängt, sodass Athleten mit 60 kg und 110 kg auf derselben Skala stehen. Viele Verbände nutzen ihn.",
        ],
        [
          "Was ist ein guter DOTS-Wert?",
          "Grob: 200 ist ein Neulings-Total, 300 Mittelstufe, 400 fortgeschritten und 500 oder mehr Elite. Das sind gängige Stufen, keine offizielle Skala.",
        ],
        [
          "DOTS oder Wilks?",
          "DOTS wurde 2019 als fairerer Ersatz für die ältere Wilks-Formel veröffentlicht, mit einem größeren Satz aktueller Wettkampfergebnisse. Die Werte sind nicht austauschbar, also vergleiche DOTS mit DOTS.",
        ],
        [
          "Kann ich geschätzte Maxima statt eines Wettkampf-Totals nutzen?",
          "Für deinen eigenen Fortschritt ja. Offizielle Ranglisten nutzen im Wettkampf gültige Versuche nach den Regeln des Verbands.",
        ],
      ],
      more: {
        heading: "So wird DOTS berechnet",
        paragraphs: [
          "DOTS teilt 500 durch ein Polynom vierten Grades deines Körpergewichts in Kilo, mit eigenen Koeffizienten für Männer und Frauen, und multipliziert dein Total mit dem Ergebnis. Das Körpergewicht wird bei Männern auf 40 bis 210 kg und bei Frauen auf 40 bis 150 kg begrenzt. Die Koeffizienten sind die veröffentlichten, abgeglichen mit einem offenen Projekt für Powerlifting-Ergebnisse. Pfund werden zuerst in Kilo umgerechnet.",
        ],
      },
      reading: [
        { href: "/de/tools/one-rep-max-calculator/", label: "den 1RM-Rechner" },
        { href: "/blog/how-to-increase-your-squat/", label: "eine stärkere Kniebeuge" },
        { href: "/blog/how-to-increase-your-deadlift/", label: "ein stärkeres Kreuzheben" },
      ],
    },
    ui: {
      unitsSex: "Einheiten und Geschlecht",
      men: "Formel für Männer",
      women: "Formel für Frauen",
      bw: "Körpergewicht ({unit})",
      squat: "Kniebeuge",
      bench: "Bankdrücken",
      deadlift: "Kreuzheben",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      note: "Etwa 200 ist ein Neulings-Total, 300 Mittelstufe, 400 fortgeschritten und 500 oder mehr Elite. Das sind grobe Stufen, keine offizielle Skala.",
      levels: { beginner: "Anfänger", novice: "Neuling", intermediate: "Mittelstufe", advanced: "Fortgeschritten", elite: "Elite" },
    },
  },
};
