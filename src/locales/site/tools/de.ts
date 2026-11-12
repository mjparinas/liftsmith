import type { LocalTools } from "./types";

// Die Rechner auf Deutsch (du). Gleiche Teile wie die englischen Seiten (src/app/tools/).
export const DE_TOOLS: LocalTools = {
  frame: {
    tools: "Tools",
    questions: "Fragen",
    more: "Mehr dazu:",
    and: " und ",
    englishLinks: "Die verlinkten Anleitungen und Artikel sind auf Englisch.",
  },
  "plate-calculator": {
    page: {
      title: "Scheibenrechner: welche Hantelscheiben auf jede Seite der Stange",
      description:
        "Gib ein Gewicht ein und sieh genau, welche Scheiben auf jede Seite der Langhantel kommen, in kg oder lb, mit den Scheiben, die du hast. Geht es nicht genau, findet er das nächste Gewicht.",
      name: "Scheibenrechner",
      intro:
        "Welche Scheiben für jedes Gewicht auf jede Seite der Stange kommen. Tippe auf + und −, um es einzustellen; schalte Scheiben ab, die du nicht hast.",
      sticky: "Scheiben für jeden Satz gezeichnet",
      mid: {
        title: "Schluss mit Scheibenrechnen zwischen den Sätzen",
        body: "{app} zeichnet die Scheiben für jeden Satz und zeigt dir in der Pause, was du für den nächsten ändern musst.",
        button: "Kostenlos testen",
      },
      end: {
        title: "Jeder Satz für dich beladen",
        body: "Sag {app} einmal, welche Scheiben dein Studio hat. Jedes geplante Gewicht kannst du dann wirklich auflegen, mit den Scheiben für jede Seite.",
      },
      faq: [
        [
          "Wie rechne ich die Scheiben pro Seite aus?",
          "Nimm das gewünschte Gewicht, zieh die Stange ab (20 kg oder 45 lb bei einer olympischen Standardstange) und teil durch zwei. Das kommt auf jede Seite. Leg die schwersten Scheiben zuerst auf.",
        ],
        [
          "Was, wenn meine Scheiben das Gewicht nicht hergeben?",
          "Der Rechner findet die nächsten möglichen Gewichte darüber und darunter. Nimm das leichtere: Das ist der sicherere Fehler.",
        ],
        [
          "Wie schwer ist die Stange?",
          "Eine olympische Standardstange wiegt 20 kg oder 45 lb, Frauenstangen 15 kg oder 35 lb. SZ-Stangen, Trap Bars und Multipressen sind unterschiedlich, also prüf deine.",
        ],
        [
          "Macht {app} das für mich?",
          "Ja. {app} schlägt nur Gewichte vor, die die Scheiben deines Studios hergeben, zeichnet die Scheiben für jeden Satz und zeigt dir in der Pause, was du zwischen den Sätzen ändern musst.",
        ],
      ],
      reading: [{ href: "/blog/how-to-load-a-barbell/", label: "eine Langhantel beladen" }],
    },
    ui: {
      units: "Einheiten",
      weight: "Gewicht auf der Stange ({unit})",
      weightAria: "Gewicht",
      bar: "Stange",
      plates: "Deine Scheiben",
      loadThis: "Leg das auf",
      cantMake: "{want} lassen sich mit diesen Scheiben nicht machen. Am nächsten:",
      eachSide: "Pro Seite: {plates}",
      justBar: "nichts, nur die Stange",
      closestOne: "Am nächsten kommst du mit {below}. Leichter ist der sicherere Fehler.",
      closestTwo: "Am nächsten kommst du mit {below} oder {above}. Leichter ist der sicherere Fehler.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "1RM-Rechner: dein Maximalgewicht aus jedem Satz schätzen",
      description:
        "Schätze dein Maximalgewicht für eine Wiederholung aus Gewicht, Wiederholungen und Wiederholungen in Reserve, mit einer Tabelle Gewicht pro Wiederholungen und den Ergebnissen von Epley, Brzycki und sechs weiteren Formeln.",
      name: "1RM-Rechner",
      intro:
        "Dein geschätztes Maximum aus jedem Satz, ohne es zu testen. Tippe auf + und −, um einen Satz einzugeben; halt eine Taste gedrückt, um schneller zu sein.",
      sticky: "Dein Maximum, aus jedem Satz verfolgt",
      mid: {
        title: "Sieh dein Maximum Satz für Satz steigen",
        body: "{app} aktualisiert deine Schätzung mit jedem Satz, den du einträgst, und zeigt den Verlauf für jede Übung.",
        button: "Kostenlos starten",
      },
      end: {
        title: "Stärker werden ohne Raten",
        body: "{app} macht aus deinem Maximum das richtige Gewicht für jeden Satz und erhöht es, wenn du es dir verdient hast.",
      },
      faq: [
        [
          "Wie wird das Maximalgewicht geschätzt?",
          "Aus dem Gewicht und den Wiederholungen, die du bis zum Muskelversagen geschafft hättest (deine Wiederholungen plus die, die du noch übrig hattest). Bis 10 Wiederholungen bis zum Versagen ist es der Mittelwert aus Brzycki, Epley und einer gewichtsabhängigen Gleichung von 2026; über 10 nutzt es Mayhew, Wathan und dieselbe neuere Gleichung, die bei mehr Wiederholungen besser passen.",
        ],
        [
          "Warum die übrigen Wiederholungen zählen?",
          "Die Formeln gehen davon aus, dass du bis zum Versagen gegangen bist. Ein Satz mit 5 und 2 in Reserve ist eigentlich eine Anstrengung von 7, also fällt die Schätzung ohne sie zu niedrig aus.",
        ],
        [
          "Wie genau ist das?",
          "Am genauesten bei harten Sätzen mit 2 bis 6 Wiederholungen, bis etwa 10 noch brauchbar und ab 15 grob. Sieh es als Bereich und achte auf den Verlauf über die Zeit.",
        ],
        [
          "Verfolgt {app} das für mich?",
          "Ja. Jeder eingetragene Satz aktualisiert die Schätzung für diese Übung, wobei neuere und näher am Versagen liegende Sätze mehr zählen, und zeigt sie im Verlauf.",
        ],
      ],
      reading: [
        { href: "/blog/how-to-estimate-your-one-rep-max/", label: "das Maximalgewicht schätzen" },
        { href: "/guides/reps-in-reserve/", label: "Wiederholungen in Reserve" },
      ],
    },
    ui: {
      units: "Einheiten",
      weight: "Gehobenes Gewicht ({unit})",
      weightAria: "Gewicht",
      reps: "Wiederholungen",
      repsAria: "Wiederholungen",
      left: "Übrige Wiederholungen",
      failure: "0 (Versagen)",
      leftNote: "Wenn du die übrigen Wiederholungen mitzählst, wird die Schätzung viel genauer.",
      rough: "Über 10 Wiederholungen bis zum Versagen sind die Schätzungen gröber.",
      estimate: "Geschätztes Maximalgewicht",
      tableCaption: "Gewicht für jede Anzahl Wiederholungen bis zum Versagen",
      colReps: "Wdh.",
      colWeight: "Gewicht",
      colPct: "% vom Max",
      formulas: "Was jede Formel ergibt",
      formulasNote:
        "Die Schätzung oben ist der Mittelwert der Formeln, die zu {n} Wiederholungen bis zum Versagen passen (mit ✓ markiert).",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Aufwärmrechner: Aufwärmsätze für jedes Arbeitsgewicht",
      description:
        "Gib dein Arbeitsgewicht ein und erhalte die Aufwärmsätze für Kniebeuge, Bankdrücken, Kreuzheben, Überkopfdrücken oder Rudern, mit den Scheiben für jede Seite.",
      name: "Aufwärmrechner",
      intro:
        "Die Aufwärmsätze vor deinem Arbeitsgewicht: genug, um bereit zu sein, aber nicht so viele, dass sie dich ermüden. Wähl eine Übung und gib das Gewicht ein.",
      sticky: "Aufwärmen für jede Übung geplant",
      mid: {
        title: "Nie wieder ein Aufwärmen ausrechnen",
        body: "{app} fügt jedem Training die Aufwärmsätze hinzu, mit den Scheiben gezeichnet, und lässt sie weg, wenn der Muskel schon warm ist.",
        button: "Mein Training planen",
      },
      end: {
        title: "Reinkommen, aufwärmen, heben",
        body: "{app} plant das Aufwärmen, die Arbeitssätze und die Pausen dazwischen, du musst nur noch heben.",
      },
      faq: [
        [
          "Wie viele Aufwärmsätze sollte ich machen?",
          "Nach der leeren Stange: ein leichterer Satz, wenn dein Arbeitsgewicht unter etwa 50 kg (110 lb) liegt, zwei Steigerungssätze ab 50 kg und drei ab 100 kg (220 lb), der letzte eine einzelne Wiederholung bei etwa 85 %.",
        ],
        [
          "Wie viele Wiederholungen pro Aufwärmsatz?",
          "Je schwerer, desto weniger: etwa 5 bei der Hälfte deines Arbeitsgewichts, 2 oder 3 bei 70 bis 80 % und eine einzelne bei etwa 85 %. Es geht darum, die Bewegung zu üben und dich an die Last zu gewöhnen, nicht darum, müde zu werden.",
        ],
        [
          "Wie lange Pause zwischen den Aufwärmsätzen?",
          "Etwa {rest} Sekunden reichen für die leichten. Vor dem ersten Arbeitssatz machst du deine normale Pause.",
        ],
        [
          "Muss ich mich für jede Übung aufwärmen?",
          "Nein. Die erste schwere Übung für einen Muskel braucht eine Steigerung. Eine spätere Übung für dieselben Muskeln braucht höchstens einen Probesatz, und leichte Ergänzungsübungen meist gar keinen.",
        ],
      ],
      more: {
        heading: "So wird das Aufwärmen berechnet",
        paragraphs: [
          "Es beginnt mit der leeren Stange für 10 leichte Wiederholungen (außer dein Arbeitsgewicht liegt kaum über der Stange) und steigt dann in wenigen Schritten zu deinem Arbeitsgewicht. Jeder Schritt ist ein Gewicht, das deine Scheiben wirklich hergeben, schwerer als der letzte und leichter als dein Arbeitsgewicht. Je schwerer die Übung, desto mehr Schritte und desto weniger Wiederholungen pro Schritt, damit dich das Aufwärmen vorbereitet, ohne an deinen Arbeitssätzen zu zehren.",
          "Es ist dieselbe Steigerung, die die App {app} nutzt. In der App weiß sie außerdem, welche Muskeln von früher im Training schon warm sind, sodass eine zweite Drückübung nur einen Probesatz statt einer ganzen Steigerung bekommt.",
        ],
      },
      reading: [
        { href: "/blog/how-to-warm-up-for-lifting/", label: "richtig aufwärmen fürs Krafttraining" },
        { href: "/de/tools/plate-calculator/", label: "der Scheibenrechner" },
        { href: "/blog/dynamic-vs-static-stretching/", label: "dynamisches oder statisches Dehnen" },
      ],
    },
    ui: {
      units: "Einheiten",
      lift: "Übung",
      lifts: {
        "back-squat": "Kniebeuge",
        "bench-press": "Bankdrücken",
        deadlift: "Kreuzheben",
        "overhead-press": "Überkopfdrücken",
        "barbell-row": "Langhantelrudern",
      },
      work: "Arbeitsgewicht ({unit})",
      workAria: "Arbeitsgewicht",
      setsOne: "{n} Aufwärmsatz, danach {rest} s Pause",
      setsMany: "{n} Aufwärmsätze, nach jedem {rest} s Pause",
      none: "Bei diesem Gewicht brauchst du keine Aufwärmsätze",
      working: "{weight}: deine Arbeitssätze",
      eachSide: "Pro Seite: {plates}",
      empty: "Leere Stange",
    },
  },
};
