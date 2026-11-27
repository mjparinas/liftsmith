import type { GenUi, ToolPageText } from "../types";

// Der Trainingsgenerator auf Deutsch (du). Gleiche Teile wie die englische Seite (./en.ts).
export const GEN_DE: { page: ToolPageText; ui: GenUi } = {
  page: {
    title: "Trainingsplan-Generator: ein kostenloses Workout für deine Geräte und deine Zeit",
    description:
      "Wähle deine Geräte, wie viel Zeit du hast und was du trainieren willst, und bekomme ein kostenloses Workout mit Sätzen, Wiederholungen, Pausen und einem kurzen Grund für jede Übung. Ohne Anmeldung, und jedes Workout hat einen eigenen Link.",
    name: "Trainingsplan-Generator",
    intro:
      "Sag ihm, was du hast und wie lange, und er schreibt das Workout: Übungen, die mit deinen Geräten gehen, die großen zuerst, mit Sätzen, Wiederholungen, Pausen und warum jede dabei ist.",
    sticky: "Jeden Tag ein neues Workout, für dich gemacht",
    mid: {
      title: "Das Training von morgen folgt auf das von heute",
      body: "Hier fängt jedes Workout bei null an. {app} merkt sich, was du gehoben hast, welche Muskeln sich noch erholen und wie viele Sätze jeder diese Woche hatte. So folgt jedes Training auf das letzte, und die Gewichte steigen, wenn du so weit bist.",
      button: "Meine Trainings planen",
    },
    end: {
      title: "Komm rein und wisse, was zu tun ist",
      body: "{app} schreibt jeden Tag ein Workout wie dieses aus deinem Studio, deiner Erholung und deinem Trainingsblock und lässt dich dann in Ruhe trainieren.",
    },
    faq: [
      [
        "Wie funktioniert der Trainingsplan-Generator?",
        "Er nutzt dieselbe Engine, die in der App {app} die Trainings plant. Er behält nur Übungen, die mit deinen Geräten gehen, richtet sie auf das aus, was du trainieren willst, setzt die großen Grundübungen an den Anfang, solange du frisch bist, und passt Sätze, Pausen und Aufwärmsätze in deine Minuten ein.",
      ],
      [
        "Ist er kostenlos? Brauche ich ein Konto?",
        "Er ist kostenlos, ohne Anmeldung. Deine Auswahl (Geräte, Minuten, Bereich, Ziel und Erfahrung) wird gesendet, um das Workout zu erstellen, und nichts wird gespeichert. Alles steht im Link, also ergibt derselbe Link immer dasselbe Workout.",
      ],
      [
        "Wie schwer soll ich gehen?",
        "Bei jeder Übung steht, wie viele Wiederholungen du im Tank lassen sollst. Nimm ein Gewicht, mit dem du am Ende des Satzes noch so viele saubere Wiederholungen schaffen würdest. War die letzte leicht, geh im nächsten Satz etwas höher. Die App lernt deine echten Zahlen im ersten Training und plant danach jedes Gewicht.",
      ],
      [
        "Was heißt Wiederholungen im Tank?",
        "Wie viele saubere Wiederholungen du beim Aufhören noch geschafft hättest. Ein neuer Block beginnt ein paar Wiederholungen vor dem Muskelversagen, damit du die Übungen üben und dich gut erholen kannst, und kommt ihm in den folgenden Wochen näher.",
      ],
      [
        "Warum ist mein Workout kürzer als die gewählte Zeit?",
        "Mit wenigen Geräten und einem kleinen Bereich gibt es nur ein paar sinnvolle Übungen. Statt aufzufüllen, sagt der Generator es dir. Füge Geräte hinzu, wähle einen größeren Bereich oder mach eine zweite Runde.",
      ],
      [
        "Kann ich das Workout speichern oder in der App machen?",
        "Ja. Workout teilen kopiert seinen Link. In der App starten öffnet es in {app} als Routine: Deine eigenen Gewichte füllen sich beim Training aus, der Pausentimer läuft von selbst und jeder Satz wird gespeichert.",
      ],
    ],
    more: {
      heading: "Wie das Workout entsteht",
      paragraphs: [
        "Der Generator beginnt mit allen Übungen aus der Bibliothek von {app}, die deine Geräte erlauben. Hast du einen Bereich gewählt, bleiben nur Übungen, deren Hauptmuskeln alle darin liegen. Die großen Muskeln wählen zuerst, und die erste Wahl für jeden ist eine Grundübung, die mehrere Muskeln zugleich trainiert; kleinere Übungen folgen in einer zweiten Runde, solange Zeit bleibt.",
        "Sätze und Wiederholungen folgen deinem Ziel. Für Muskelaufbau liegen Grundübungen bei 6 bis 10 Wiederholungen und kleinere bei 10 bis 15; für Kraft sind es weniger Wiederholungen und längere Pausen; für die Fitness liegt es dazwischen. Halteübungen und Tragen zählen in Sekunden. Hauptübungen bekommen Aufwärmsätze, und übrige Zeit wird zu einem Extrasatz bei den ersten Übungen.",
        "Übungen zu Supersätzen paaren macht das, was die automatischen Supersätze der App machen: zwei Übungen für verschiedene Muskeln direkt nacheinander, damit sich jeder Muskel erholt, während der andere arbeitet, und mehr in dieselbe Zeit passt.",
      ],
    },
    reading: [
      { href: "/blog/how-to-build-a-workout-routine/", label: "wie man eine Trainingsroutine aufbaut" },
      { href: "/blog/how-long-to-rest-between-sets/", label: "wie lange zwischen Sätzen pausieren" },
      { href: "/de/tools/warm-up-calculator/", label: "der Aufwärmrechner" },
    ],
  },
  ui: {
    equipment: "Geräte",
    kits: { commercial: "Ganzes Studio", home: "Heimstudio", dumbbells: "Nur Kurzhanteln", bodyweight: "Ohne Geräte" },
    custom: "Geräte wählen",
    customHint: "Tippe an, was du hast. Das Workout nutzt nur das.",
    minutes: "Zeit",
    minutesValue: "{n} Min.",
    focus: "Was trainieren",
    goal: "Ziel",
    goals: { muscle: "Muskeln aufbauen", strength: "Stärker werden", general: "Fit bleiben" },
    level: "Erfahrung",
    levels: { new: "Neu im Training", intermediate: "Etwas Erfahrung", advanced: "Erfahren" },
    pairs: "Übungen zu Supersätzen paaren",
    pairsHint: "Zwei Übungen für verschiedene Muskeln direkt nacheinander, mit weniger Pause, damit mehr hineinpasst.",
    make: "Mein Workout erstellen",
    another: "Anderes Workout",
    working: "Dein Workout wird geschrieben …",
    error: "Das Workout konnte gerade nicht erstellt werden. Prüfe deine Verbindung und versuch es noch einmal.",
    nothing: "Zu diesen Geräten und diesem Bereich passt nichts. Füge Geräte hinzu oder wähle einen anderen Bereich.",
    about: "Etwa {n} Min.",
    short:
      "Etwa {n} Minuten sind alles, was diese Geräte für diesen Bereich hergeben. Füge Geräte hinzu oder wähle einen größeren Bereich.",
    order: "Die großen Übungen zuerst, solange du frisch bist, die kleineren danach. Bei jeder Übung steht, warum sie dabei ist.",
    setsReps: "{sets} × {reps}",
    setsSecs: "{sets} × {secs} s",
    rest: "Pause {time}",
    tank: "Wiederholungen im Tank: {n}",
    holdForm: "Aufhören, wenn die Technik nachlässt",
    warmups: "Vorher Aufwärmsätze: {n}",
    superset: "Supersatz {letter}",
    whyFirst: "{muscle}: eine Grundübung zuerst, solange du frisch bist",
    whyCompound: "{muscle}: eine Grundübung, die mehrere Muskeln zugleich trainiert",
    whyIsolation: "{muscle}: eine kleinere Übung, um den Muskel fertigzumachen",
    whyBodyweight: "{muscle}: eine Grundübung mit dem eigenen Körpergewicht, ohne Last",
    whyHold: "{muscle}: eine Halte- oder Trageübung, in Sekunden",
    repsMuscle: "{lo} bis {hi} Wiederholungen für Muskelaufbau: beginne mit {reps} und steigere, wenn es leichter wird",
    repsStrength: "Schwerere Sätze mit {lo} bis {hi} Wiederholungen für Kraft",
    repsGeneral: "{lo} bis {hi} Wiederholungen, die Mitte für die Fitness",
    repsBodyweight: "{lo} bis {hi} Wiederholungen: beginne mit {reps} und steigere zuerst die Wiederholungen",
    repsHold: "{lo} bis {hi} Sekunden: beginne mit {reps} und halte jedes Mal etwas länger",
    mainSets: "{sets} Sätze für eine Hauptübung, mit der Zeit dafür",
    moreSets: "{sets} Sätze, mit der Zeit, die du hast",
    pair: "Direkt mit {other}: andere Muskeln, also eine kürzere Pause",
    share: "Workout teilen",
    copied: "Link kopiert",
    start: "In der App starten",
    startHint: "Öffnet sich in {app} als Routine. Deine eigenen Gewichte füllen sich beim Training aus.",
    example: "Ein Beispiel zum Start. Ändere oben eine beliebige Auswahl.",
    see: "Zum Workout",
  },
};
