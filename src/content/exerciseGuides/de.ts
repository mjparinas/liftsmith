import type { ExerciseGuide } from "../exerciseGuides";

// Die Übungsanleitungen auf Deutsch (du). Gleiche Reihenfolge und gleiche Teile wie die englischen Anleitungen (lower.ts, upper.ts).
export const DE_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "Die Kniebeuge mit der Langhantel im Nacken ist die klassische Kraftübung für den Unterkörper. Sie trainiert Quadrizeps, Gesäß und Adduktoren intensiv, erlaubt viel Gewicht und jahrelange Fortschritte und baut nebenbei einen starken Rumpf auf.",
    mistakes: [
      [
        "Knie fallen beim Hochkommen nach innen",
        "Drück die Knie die ganze Wiederholung über die Zehen nach außen und nimm Gewicht runter, bis das klappt.",
      ],
      [
        "Weniger tief, je schwerer es wird",
        "Geh bei jeder Wiederholung gleich tief, mindestens bis die Hüftfalte auf Kniehöhe ist, wenn deine Hüfte das zulässt.",
      ],
      [
        "Spannung unten verlieren",
        "Atme vor jeder Wiederholung tief in den Bauch und halte die Luft, bis du den schwersten Teil hinter dir hast.",
      ],
      ["Fersen heben ab", "Halte dein Gewicht über der Fußmitte. Schuhe mit erhöhter Ferse oder ein etwas breiterer Stand helfen."],
    ],
    sets: [
      "**Kraft:** 3 bis 5 Sätze mit 3 bis 6 Wiederholungen, 3 bis 5 Minuten Pause.",
      "**Muskelaufbau:** 3 bis 4 Sätze mit 6 bis 10, 2 bis 3 Minuten Pause.",
      "**Für Einsteiger:** 3 Sätze mit 8 und einem Gewicht, das du 10- bis 12-mal schaffen würdest; leg jedes Training etwas drauf.",
    ],
    variations: [
      ["front-squat", "Aufrechter, mehr Quadrizeps, schonender für den unteren Rücken."],
      ["box-squat", "Bringt dir bei, nach hinten zu sitzen und jedes Mal gleich tief zu gehen."],
      ["pause-squat", "Baut Kraft aus dem tiefsten Punkt auf, wo die meisten hängen bleiben."],
      ["goblet-squat", "Der beste Weg, die Bewegung zu lernen, bevor du eine Stange belädst."],
    ],
    faq: [
      [
        "Wie tief soll ich gehen?",
        "So tief, wie du die Rückenposition halten kannst und die Fersen am Boden bleiben. Für die meisten ist das auf oder knapp unter parallel.",
      ],
      [
        "High Bar oder Low Bar?",
        "Bei High Bar liegt die Stange oben auf den Schultern und du bleibst aufrechter; bei Low Bar liegt sie tiefer und du schaffst etwas mehr Gewicht. Beides funktioniert.",
      ],
      [
        "Brauche ich einen Gürtel?",
        "Am Anfang nicht. Lern zuerst, ohne Gürtel Spannung aufzubauen; später kann er bei schweren Sätzen helfen. Siehe [lifting belt](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "Bei der Frontkniebeuge liegt die Stange vorne auf den Schultern. Dadurch bleibt der Oberkörper aufrecht und der Quadrizeps übernimmt mehr Arbeit. Sie schont den unteren Rücken mehr als die Nackenkniebeuge und lehrt eine gute Haltung.",
    mistakes: [
      [
        "Ellbogen sinken ab",
        "Schieb die Ellbogen die ganze Wiederholung nach oben und vorne. Rollt die Stange, sind zuerst die Ellbogen gefallen.",
      ],
      [
        "Die Stange mit den Händen halten",
        "Die Stange liegt auf den Schultern, die Finger halten sie nur in Position. Bei steifen Handgelenken hilft der Kreuzgriff oder Zughilfen.",
      ],
      [
        "Oberer Rücken rundet sich",
        "Halte die Brust hoch und spann fest an. Weniger Gewicht mit aufrechter Brust ist besser als mehr Gewicht im Zusammenklappen.",
      ],
    ],
    sets: ["**Kraft:** 3 bis 5 Sätze mit 3 bis 5.", "**Muskelaufbau:** 3 Sätze mit 6 bis 10."],
    variations: [
      ["goblet-squat", "Gleiche aufrechte Haltung mit einer Kurzhantel, leichter zu lernen."],
      ["back-squat", "Insgesamt mehr Gewicht möglich."],
      ["db-front-squat", "Kein Rack nötig und keine Dehnung im Handgelenk."],
    ],
    faq: [
      [
        "Ist die Frontkniebeuge besser als die Nackenkniebeuge?",
        "Keine ist besser. Die Frontkniebeuge betont den Quadrizeps und schont den Rücken; die Nackenkniebeuge erlaubt mehr Gewicht.",
      ],
      [
        "Warum tun mir dabei die Handgelenke weh?",
        "Steife Handgelenke und ein steifer Latissimus. Leg nur zwei oder drei Finger unter die Stange oder nimm den Kreuzgriff.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "Bei der Goblet-Kniebeuge hältst du eine Kurzhantel oder Kettlebell vor der Brust. Das Gewicht vorne macht es leicht, aufrecht zu bleiben und tief zu sitzen. So lernst du die Kniebeuge am besten, und zu Hause ist sie eine tolle Beinübung.",
    mistakes: [
      ["Das Gewicht zieht dich nach vorne", "Halt das Gewicht an der Brust und die Ellbogen eng darunter."],
      ["Zu wenig tief", "Setz dich zwischen deine Fersen; unten sollten die Ellbogen an den Knien vorbeistreifen."],
      ["Zu schnelle Wiederholungen", "Senk dich zwei bis drei Sekunden lang ab. Das macht ein leichtes Gewicht viel schwerer."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 15.", "**Zu Hause mit leichten Gewichten:** 3 Sätze mit 15 bis 20, langsam absenken."],
    variations: [
      ["kb-goblet-squat", "Die gleiche Übung mit einer Kettlebell, an den Griffseiten gehalten."],
      ["db-goblet-squat-heels", "Fersen erhöht für mehr Quadrizeps und eine tiefere Kniebeuge."],
      ["back-squat", "Der nächste Schritt, wenn die Kurzhanteln zu leicht werden."],
    ],
    faq: [
      [
        "Baut die Goblet-Kniebeuge Beinmuskeln auf?",
        "Ja, bis deine schwerste Kurzhantel leicht wird. Dann mach die Wiederholungen langsamer, pausier unten oder wechsle zur Langhantel.",
      ],
      ["Kurzhantel oder Kettlebell?", "Beides. Halt die Kurzhantel senkrecht an einem Ende oder die Kettlebell an den Griffseiten."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "Beim bulgarischen Split Squat steht der hintere Fuß auf einer Bank, sodass das vordere Bein fast die ganze Arbeit macht. Er baut Quadrizeps und Gesäß Bein für Bein auf, mit einem Bruchteil des Gewichts einer Kniebeuge, und schont so den unteren Rücken.",
    mistakes: [
      [
        "Vorderer Fuß zu nah an der Bank",
        "Geh so weit nach vorne, dass das vordere Schienbein ungefähr senkrecht bleibt und sich das Knie unten frei beugen kann.",
      ],
      [
        "Mit dem hinteren Fuß abdrücken",
        "Der hintere Fuß ist nur fürs Gleichgewicht. Halt das meiste Gewicht auf Ferse und Mitte des vorderen Fußes.",
      ],
      ["Gleichgewicht verlieren", "Halt dich mit einer Hand fest oder nimm eine niedrigere Bank, bis du sicher stehst."],
    ],
    sets: [
      "**Muskelaufbau:** 3 Sätze mit 8 bis 12 pro Bein, beginnend mit der schwächeren Seite.",
      "**Zu Hause:** 3 Sätze mit 12 bis 20 pro Bein, mit Körpergewicht oder leichten Kurzhanteln.",
    ],
    variations: [
      ["split-squat", "Beide Füße am Boden: leichter zu balancieren."],
      ["front-foot-elevated-split-squat", "Eine tiefere Dehnung für das vordere Bein."],
      ["barbell-bulgarian-split-squat", "Mehr Gewicht, wenn Kurzhanteln unhandlich werden."],
    ],
    faq: [
      [
        "Quadrizeps oder Gesäß?",
        "Beides. Ein aufrechter Oberkörper und ein kürzerer Stand betonen den Quadrizeps; nach vorne gelehnt mit längerem Stand arbeitet das Gesäß mehr.",
      ],
      [
        "Warum ist das so schwer?",
        "Ein Bein macht die Arbeit von zweien, und das Gleichgewicht kommt dazu. Fang leicht an; du wirst staunen, wie schnell das Gewicht steigt.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "Die Beinpresse trainiert Quadrizeps und Gesäß, ohne die Wirbelsäule zu belasten oder Gleichgewicht zu brauchen. So kannst du die Beine hart und sicher fordern, auch wenn Rücken oder Technik eine Kniebeuge begrenzen würden.",
    mistakes: [
      ["Unterer Rücken hebt vom Polster ab", "Geh nur so tief, wie Hüfte und unterer Rücken auf dem Sitz bleiben."],
      ["Knie oben hart durchdrücken", "Stopp kurz vor dem Durchstrecken und geh direkt in die nächste Wiederholung."],
      [
        "Den Weg verkürzen, um mehr Gewicht zu nehmen",
        "Ein voller, kontrollierter Bewegungsweg mit weniger Gewicht baut mehr Muskeln auf als halbe Wiederholungen mit dem ganzen Stapel.",
      ],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 8 bis 15.", "**Zum Abschluss:** 1 bis 2 Sätze mit 15 bis 25 nach den Kniebeugen."],
    variations: [
      ["narrow-leg-press", "Füße tiefer und enger: mehr Quadrizeps."],
      ["wide-leg-press", "Füße höher und breiter: mehr Gesäß und Adduktoren."],
      ["single-leg-press", "Ein Bein nach dem anderen, um Unterschiede auszugleichen."],
    ],
    faq: [
      [
        "Ist die Beinpresse so gut wie Kniebeugen?",
        "Für den Muskelaufbau kommt sie nah dran. Kniebeugen trainieren auch Gleichgewicht und Rumpf; die Beinpresse fordert die Beine stärker bei weniger Ermüdung.",
      ],
      [
        "Wohin mit den Füßen?",
        "Mitte der Plattform, etwa schulterbreit, ist ein guter Standard. Höher für das Gesäß, tiefer für den Quadrizeps.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "Die Hackenschmidt-Maschine führt dich auf einem Schlitten durch die Kniebeuge, mit gestütztem Rücken. Sie ist einer der besten Quadrizeps-Aufbauer, weil du tief gehen und hart drücken kannst, ohne eine Stange zu balancieren.",
    mistakes: [
      ["Füße zu hoch auf der Plattform", "Stell die Füße in die Mitte oder etwas tiefer für mehr Quadrizeps, Fersen flach."],
      ["Unten abfedern", "Senk dich kontrolliert ab und pausier kurz, bevor du hochdrückst."],
      ["Teilwiederholungen", "Geh so tief, wie deine Hüfte es zulässt, ohne dass sich der untere Rücken vom Polster löst."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 6 bis 12.", "**Kraft:** 3 Sätze mit 5 bis 8, nach deiner Hauptkniebeuge."],
    variations: [
      ["pendulum-squat", "Eine ähnliche Maschine mit tieferem Bogen."],
      ["leg-press", "Gar keine Last auf den Schultern."],
      ["back-squat", "Freies Gewicht, trainiert Gleichgewicht und Rumpf."],
    ],
    faq: [
      [
        "Ist die Hackenschmidt-Kniebeuge schlecht für die Knie?",
        "Nein. Dass die Knie über die Zehen nach vorne wandern, ist normal. Steiger das Gewicht nach und nach und bleib schmerzfrei.",
      ],
      [
        "Hackenschmidt oder Beinpresse?",
        "Die Hackenschmidt trifft den Quadrizeps meist etwas stärker; die Beinpresse schont Schultern und Rücken mehr. Beide sind gut.",
      ],
    ],
  },
  deadlift: {
    intro:
      "Beim Kreuzheben hebst du eine beladene Stange vom Boden. Es trainiert die ganze Körperrückseite, also Gesäß, Beinbeuger, Rücken und Griff, und ist meist die Übung, bei der man das meiste Gewicht bewegt.",
    mistakes: [
      [
        "Stange entfernt sich von den Beinen",
        "Halt die Stange auf dem ganzen Weg an Schienbeinen und Oberschenkeln. Starte mit ihr über der Fußmitte.",
      ],
      ["Unterer Rücken rundet sich", "Spann fest an, bevor du ziehst, und nimm Gewicht runter, wenn der Rücken die Position nicht hält."],
      [
        "Die Stange vom Boden reißen",
        "Nimm zuerst das Spiel raus: spann an, bis die Stange an den Scheiben klickt, dann drück den Boden weg.",
      ],
      ["Oben weit nach hinten lehnen", "Steh am Ende aufrecht mit angespanntem Gesäß. Nach hinten lehnen musst du nicht."],
    ],
    sets: [
      "**Kraft:** 2 bis 4 Sätze mit 2 bis 5, 3 bis 5 Minuten Pause.",
      "**Muskelaufbau:** 3 Sätze mit 5 bis 8. Kreuzheben ist ermüdend, deshalb machen es die meisten einmal pro Woche.",
    ],
    variations: [
      ["trap-bar-deadlift", "Leichter zu lernen, aufrechter, schonender für den Rücken."],
      ["sumo-deadlift", "Ein breiter Stand, der manchen Körperbauten besser liegt."],
      ["romanian-deadlift", "Startet oben und belastet die Beinbeuger stärker."],
      ["paused-deadlift", "Baut Kontrolle knapp über dem Boden auf."],
    ],
    faq: [
      [
        "Wie oft sollte ich Kreuzheben machen?",
        "Einmal pro Woche reicht den meisten, mit einer leichteren Hüftbeuge wie dem rumänischen Kreuzheben an einem anderen Tag.",
      ],
      [
        "Darf ich die Stange oben fallen lassen?",
        "Senk sie kontrolliert ab. Von oben fallen lassen ist hart für Scheiben und Boden und spart die Hälfte der Wiederholung aus.",
      ],
      [
        "Soll ich Zughilfen nehmen?",
        "Bei deinen schwersten Sätzen, wenn der Griff zuerst nachgibt. Trainier den Griff in den Aufwärmsätzen. Siehe [grip strength](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "Beim Sumo-Kreuzheben stehst du breit und greifst innerhalb der Knie. Das verkürzt den Weg der Stange und hält dich aufrechter, sodass Hüfte, Quadrizeps und Adduktoren mehr arbeiten.",
    mistakes: [
      ["Stand zu breit", "Geh nur so breit, dass die Schienbeine ungefähr senkrecht bleiben und die Knie über den Zehen laufen."],
      ["Hüfte schießt zuerst hoch", "Drück die Knie nach außen und den Boden auseinander, damit Hüfte und Brust gemeinsam steigen."],
      ["Mit lockeren Armen starten", "Nimm das Spiel aus der Stange, bevor sie den Boden verlässt."],
    ],
    sets: ["**Kraft:** 3 bis 5 Sätze mit 2 bis 5.", "**Muskelaufbau:** 3 Sätze mit 5 bis 8."],
    variations: [
      ["deadlift", "Der klassische Stand, mehr Beinbeuger und Rücken."],
      ["kb-sumo-deadlift", "Eine leichte Art, den Stand zu lernen."],
      ["trap-bar-deadlift", "Aufrecht wie Sumo, einfacher aufzubauen."],
    ],
    faq: [
      [
        "Ist Sumo geschummelt?",
        "Nein. Es ist ein anerkannter Stil im Kraftdreikampf. Wähl den Stand, der zu deinem Körper passt und mit dem du gut hebst.",
      ],
      ["Sumo oder klassisch?", "Probier beides ein paar Wochen. Wer längere Beine und kürzere Arme hat, mag oft Sumo lieber."],
    ],
  },
  "romanian-deadlift": {
    intro:
      "Das rumänische Kreuzheben startet im Stand und senkt die Stange, indem du die Hüfte mit fast gestreckten Beinen nach hinten schiebst. Es ist einer der besten Aufbauer für Beinbeuger und Gesäß, weil es sie über eine lange Dehnung belastet.",
    mistakes: [
      [
        "Knie zu stark beugen",
        "Halt eine leichte Beugung, die sich nicht verändert. Beugen sich die Knie beim Absenken mehr, wird eine Kniebeuge daraus.",
      ],
      ["Zu tief gehen", "Senk nur so weit ab, wie die Hüfte nach hinten wandert und der Rücken gerade bleibt, meist bis Mitte Schienbein."],
      [
        "Stange weg von den Beinen",
        "Lass sie an den Oberschenkeln entlanggleiten. Je näher sie bleibt, desto schonender für den unteren Rücken.",
      ],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 6 bis 12, langsam absenken.", "**Nach dem Kreuzheben:** 2 bis 3 Sätze mit 8 bis 10, leichter."],
    variations: [
      ["db-rdl", "Mit Kurzhanteln, ideal zu Hause."],
      ["single-leg-rdl", "Ein Bein: Gleichgewicht und weniger Gewicht nötig."],
      ["stiff-leg-deadlift", "Startet bei jeder Wiederholung am Boden."],
    ],
    faq: [
      [
        "Rumänisches Kreuzheben oder Kreuzheben?",
        "Das rumänische startet oben und belastet die Beinbeuger stärker; das klassische startet am Boden und erlaubt mehr Gewicht.",
      ],
      [
        "Wo sollte ich es spüren?",
        "Hinten in den Oberschenkeln und im Gesäß. Spürst du es vor allem im unteren Rücken, nimm weniger Gewicht und schieb die Hüfte weiter nach hinten.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "Beim Trap-Bar-Kreuzheben stehst du in einer sechseckigen Stange mit Griffen an den Seiten. Du bleibst aufrechter, was den unteren Rücken entlastet. So ist es das Kreuzheben, das sich am leichtesten lernen und schwer beladen lässt.",
    mistakes: [
      [
        "Eine Kniebeuge daraus machen",
        "Es bleibt eine Hüftbeuge. Schieb die Hüfte nach hinten, um die Griffe zu erreichen, dann drück den Boden weg.",
      ],
      ["Nicht mittig in der Stange", "Stell dich so hin, dass die Griffe auf Höhe deiner Fußmitte sind."],
      ["Unten die Spannung verlieren", "Setz zwischen den Wiederholungen neu an oder tipp leicht auf; lass die Scheiben nicht abfedern."],
    ],
    sets: ["**Kraft:** 3 bis 5 Sätze mit 3 bis 5.", "**Muskelaufbau oder Sport:** 3 Sätze mit 5 bis 8."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Hohe Griffe: ein kürzerer Weg für Einsteiger oder große Menschen."],
      ["deadlift", "Die gerade Stange, mehr Rücken und Beinbeuger."],
      ["trap-bar-rdl", "Eine Variante mit Fokus auf die Beinbeuger."],
    ],
    faq: [
      [
        "Ist das Trap-Bar-Kreuzheben leichter?",
        "Die meisten lernen es leichter und schaffen etwas mehr Gewicht, weil man aufrechter bleibt.",
      ],
      [
        "Trainiert es dieselben Muskeln?",
        "Größtenteils. Es nutzt etwas mehr Quadrizeps und etwas weniger unteren Rücken als das Kreuzheben mit gerader Stange.",
      ],
    ],
  },
  "hip-thrust": {
    intro:
      "Beim Hip Thrust lehnst du den oberen Rücken an eine Bank und drückst eine beladene Stange mit der Hüfte nach oben. Er belastet das Gesäß bei voller Hüftstreckung stärker als fast jede andere Übung.",
    mistakes: [
      [
        "Oben ins Hohlkreuz gehen",
        "Zieh das Kinn an und halt die Rippen unten; beende die Bewegung mit angespanntem Gesäß, nicht mit einem Hohlkreuz.",
      ],
      [
        "Füße an der falschen Stelle",
        "Oben sollten deine Schienbeine ungefähr senkrecht sein. Zu nah und der Quadrizeps übernimmt; zu weit und die Beinbeuger tun es.",
      ],
      ["Oben zu schnell", "Halt oben bei jeder Wiederholung eine Sekunde."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 8 bis 12.", "**Kraft:** 3 Sätze mit 5 bis 8, mit Pause oben."],
    variations: [
      ["glute-bridge", "Vom Boden: einfacher aufzubauen, kürzerer Weg."],
      ["db-hip-thrust", "Eine Kurzhantel auf der Hüfte, gut für zu Hause."],
      ["single-leg-hip-thrust", "Ein Bein nach dem anderen, ohne Zusatzgewicht."],
    ],
    faq: [
      ["Brauche ich ein Polster?", "Ein Stangenpolster oder eine gefaltete Matte macht schwere Sätze viel angenehmer."],
      [
        "Hip Thrust oder Kniebeuge für das Gesäß?",
        "Beides. Kniebeugen fordern das Gesäß in tiefer Dehnung; Hip Thrusts fordern es oben am stärksten. Siehe [glute workout](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "Bei der Glute Bridge hebst du die Hüfte vom Boden, während der Rücken flach liegt. Eine einfache Gesäßübung für überall und ein guter Weg, das Gesäß einsetzen zu lernen, bevor du Hip Thrusts machst.",
    mistakes: [
      ["Über die Zehen drücken", "Drück über die Fersen, damit die Arbeit beim Gesäß bleibt."],
      ["Ins Hohlkreuz gehen, um höher zu kommen", "Stopp, wenn Hüfte und Oberschenkel eine gerade Linie bilden. Spann dort das Gesäß an."],
      ["Durch die Wiederholungen hetzen", "Halt oben ein bis zwei Sekunden."],
    ],
    sets: [
      "**Zu Hause:** 3 Sätze mit 15 bis 25, mit Pause oben.",
      "**Mit Gewicht:** 3 Sätze mit 10 bis 15, mit Kurzhantel oder Stange auf der Hüfte.",
    ],
    variations: [
      ["single-leg-glute-bridge", "Doppelte Arbeit für jede Seite."],
      ["hip-thrust", "Rücken auf einer Bank für einen längeren Weg und mehr Gewicht."],
      ["marching-glute-bridge", "Mehr Stabilität für Rumpf und Hüfte."],
    ],
    faq: [
      [
        "Glute Bridge oder Hip Thrust?",
        "Die Bridge ist leichter und braucht nichts; der Hip Thrust hat einen längeren Weg und verträgt mehr Gewicht.",
      ],
      ["Warum spüre ich es in den Beinbeugern?", "Stell die Füße etwas näher an die Hüfte und drück über die Fersen."],
    ],
  },
  "walking-lunge": {
    intro:
      "Bei Walking Lunges machst du einen Ausfallschritt nach dem anderen nach vorne. Sie trainieren Quadrizeps und Gesäß Bein für Bein, fordern dein Gleichgewicht und bringen den Puls hoch.",
    mistakes: [
      ["Zu kurze Schritte", "Mach den Schritt so lang, dass beide Knie unten etwa 90 Grad gebeugt sind."],
      ["Vorderes Knie fällt nach innen", "Halt das vordere Knie in einer Linie mit den Zehen."],
      ["Hinteres Knie knallt auf", "Senk dich kontrolliert ab, bis das hintere Knie fast den Boden berührt."],
    ],
    sets: [
      "**Muskelaufbau:** 3 Sätze mit 10 bis 12 Schritten pro Bein.",
      "**Kondition:** 2 bis 3 Sätze mit 20 bis 30 Schritten insgesamt, kurze Pausen.",
    ],
    variations: [
      ["reverse-lunge", "Der Schritt nach hinten schont Knie und Gleichgewicht."],
      ["barbell-walking-lunge", "Mehr Gewicht, wenn Kurzhanteln schwer zu halten werden."],
      ["bulgarian-split-squat", "Bleibt am Platz und isoliert jedes Bein stärker."],
    ],
    faq: [
      [
        "Walking Lunges oder Ausfallschritte nach hinten?",
        "Nach hinten ist leichter zu kontrollieren und schont die Knie; Walking Lunges bringen Gleichgewicht und Kondition dazu.",
      ],
      [
        "Wie viel Platz brauche ich?",
        "Etwa 10 Meter pro Satz. Hast du den Platz nicht, dreh um oder wechsle zu Ausfallschritten nach hinten.",
      ],
    ],
  },
  "reverse-lunge": {
    intro:
      "Beim Ausfallschritt nach hinten trittst du rückwärts in den Ausfallschritt. Dein Gewicht bleibt über dem vorderen Fuß, deshalb ist das Gleichgewicht leichter und die Knie werden mehr geschont als beim Ausfallschritt nach vorne.",
    mistakes: [
      ["Zu schmal treten", "Tritt nach hinten wie auf Schienen, nicht wie auf einem Seil, damit du stabil bleibst."],
      ["Mit dem hinteren Fuß abdrücken", "Drück dich über die vordere Ferse hoch; das hintere Bein hilft nur beim Gleichgewicht."],
      ["Stark nach vorne lehnen", "Bleib ziemlich aufrecht, mit einer leichten Vorlage für mehr Gesäß."],
    ],
    sets: ["**Körpergewicht:** 3 Sätze mit 12 bis 20 pro Bein.", "**Mit Gewicht:** 3 Sätze mit 8 bis 12 pro Bein mit Kurzhanteln."],
    variations: [
      ["db-reverse-lunge", "Kurzhanteln für mehr Gewicht."],
      ["deficit-reverse-lunge", "Vorderer Fuß auf einer Stufe für einen tieferen Weg."],
      ["walking-lunge", "Bringt Gleichgewicht und Kondition dazu."],
    ],
    faq: [
      [
        "Sind Ausfallschritte nach hinten gut bei empfindlichen Knien?",
        "Sie sind meist der angenehmste Ausfallschritt für empfindliche Knie. Bleib im schmerzfreien Bereich.",
      ],
      [
        "Beine abwechseln oder eine Seite nach der anderen?",
        "Beides geht. Eine Seite nach der anderen ist härter und hält die Wiederholungen gleich.",
      ],
    ],
  },
  "leg-extension": {
    intro:
      "Am Beinstrecker streckst du das Knie gegen Widerstand. Er isoliert den Quadrizeps, auch den Teil, den Kniebeugen kaum trainieren, und lässt sich sicher bis nah ans Muskelversagen fahren.",
    mistakes: [
      [
        "Knie nicht auf Höhe der Drehachse",
        "Stell den Sitz so ein, dass dein Kniegelenk auf einer Linie mit der Achse der Maschine liegt.",
      ],
      ["Das Gewicht hochschwingen", "Heb kontrolliert und halt oben kurz."],
      ["Hüfte hebt vom Sitz ab", "Halt dich an den Griffen fest und lass die Hüfte unten."],
    ],
    sets: [
      "**Muskelaufbau:** 2 bis 3 Sätze mit 10 bis 15, nach Kniebeugen oder Beinpresse.",
      "**Zum Abschluss:** 1 Satz mit 15 bis 20 bis nah ans Versagen.",
    ],
    variations: [
      ["single-leg-extension", "Ein Bein nach dem anderen, um Unterschiede auszugleichen."],
      ["sissy-squat", "Quadrizeps-Isolation mit Körpergewicht."],
      ["leg-press", "Eine Mehrgelenksübung für den Quadrizeps."],
    ],
    faq: [
      [
        "Ist der Beinstrecker schlecht für die Knie?",
        "Nicht mit vernünftigem Gewicht. Er wird oft in der Knie-Reha eingesetzt. Hör auf, wenn du Gelenkschmerzen spürst.",
      ],
      [
        "Brauche ich den Beinstrecker, wenn ich Kniebeugen mache?",
        "Nicht unbedingt, aber er bringt Quadrizeps-Arbeit ohne viel Ermüdung und trainiert den geraden Oberschenkelmuskel, den Kniebeugen kaum dehnen.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "Beim liegenden Beinbeuger beugst du in Bauchlage die Knie gegen ein Polster. Er isoliert die Beinbeuger, die Hüftbeugen wie das Kreuzheben vor allem an der Hüfte trainieren.",
    mistakes: [
      ["Hüfte hebt von der Bank ab", "Drück die Hüfte ins Polster und lass sie dort."],
      ["Mit Schwung arbeiten", "Beug gleichmäßig und senk langsam ab, zwei bis drei Sekunden."],
      ["Zu kurzer Weg", "Senk ab, bis die Beine fast gestreckt sind, bevor die nächste Wiederholung kommt."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 15."],
    variations: [
      ["seated-leg-curl", "Gebeugte Hüfte, sodass die Beinbeuger aus einer längeren Dehnung arbeiten."],
      ["nordic-curl", "Körpergewicht und sehr hart; super für Sprinter."],
      ["slider-leg-curl", "Zu Hause mit einem Handtuch oder Gleitscheiben."],
    ],
    faq: [
      [
        "Liegender oder sitzender Beinbeuger?",
        "Der sitzende dehnt die Beinbeuger stärker und baut vielleicht etwas mehr Muskeln auf. Nimm, was dein Studio hat.",
      ],
      [
        "Brauche ich Beinbeuger, wenn ich Kreuzheben mache?",
        "Sie trainieren die Kniebeugung der Beinbeuger, die beim Kreuzheben fehlt. Eine Beinbeuger-Übung pro Woche hilft.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "Beim sitzenden Beinbeuger beugst du im Sitzen die Knie gegen ein Polster. Im Sitzen sind die Beinbeuger lang gedehnt, deshalb ist er eine der besten Übungen für Muskelaufbau an der Oberschenkelrückseite.",
    mistakes: [
      ["Oberschenkelpolster zu locker", "Stell das Oberschenkelpolster fest ein, damit die Beine nicht abheben."],
      ["Zum Schummeln nach hinten lehnen", "Sitz aufrecht oder lehn dich leicht nach vorne, um die Dehnung zu halten."],
      ["Zu schnell absenken", "Kontrollier es zwei bis drei Sekunden lang."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 15."],
    variations: [
      ["lying-leg-curl", "Gestreckte Hüfte, wenn die sitzende Maschine belegt ist."],
      ["single-leg-curl", "Ein Bein nach dem anderen."],
      ["romanian-deadlift", "Trainiert die Beinbeuger an der Hüfte statt am Knie."],
    ],
    faq: [
      [
        "Ist der sitzende Beinbeuger besser als der liegende?",
        "Er fordert die Beinbeuger aus einer längeren Dehnung, was vielleicht etwas mehr Muskeln aufbaut. Beide sind gut.",
      ],
      [
        "Wie schwer sollten Beinbeuger sein?",
        "So schwer, dass die letzten Wiederholungen jedes Satzes hart sind, du das Absenken aber noch kontrollierst.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "Beim stehenden Wadenheben drückst du dich mit gestreckten Knien gegen Widerstand auf die Zehenspitzen. Es trainiert den größeren Wadenmuskel, den Gastrocnemius, am besten.",
    mistakes: [
      ["Unten abfedern", "Halt in der Dehnung unten bei jeder Wiederholung eine Sekunde."],
      ["Halbe Wiederholungen", "Geh von einer tiefen Dehnung so hoch auf die Zehen, wie du kannst."],
      ["Knie beugen", "Halt die Knie gestreckt, aber nicht durchgedrückt, damit die Waden heben."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 8 bis 15, langsam, zwei- bis dreimal pro Woche."],
    variations: [
      ["seated-calf-raise", "Gebeugte Knie, für den Schollenmuskel darunter."],
      ["single-leg-calf-raise", "Zu Hause auf einer Stufe, ein Bein nach dem anderen."],
      ["calf-press", "An der Beinpresse."],
    ],
    faq: [
      [
        "Warum wachsen meine Waden nicht?",
        "Die meisten federn durch kurze Wiederholungen. Nutz den vollen Weg mit Pause in der Dehnung und trainier sie öfter. Siehe [calf workout](/blog/calf-workout/).",
      ],
      ["Stehendes oder sitzendes Wadenheben?", "Beides. Stehend arbeitet mehr der Gastrocnemius, sitzend der Schollenmuskel."],
    ],
  },
  plank: {
    intro:
      "Beim Unterarmstütz hältst du den Körper auf Unterarmen und Zehen in einer geraden Linie. Er trainiert Bauch und Rumpf darin, sich nicht zu verbiegen, und das hilft beim Anspannen unter einer schweren Stange.",
    mistakes: [
      ["Hüfte hängt durch", "Spann das Gesäß an und zieh die Rippen Richtung Hüfte."],
      ["Hüfte zu hoch", "Senk sie, bis dein Körper von Kopf bis Ferse eine gerade Linie ist."],
      ["Minutenlang halten", "Sobald du 60 Sekunden schaffst, mach es schwerer statt länger."],
    ],
    sets: ["**Rumpf:** 2 bis 3 Halteübungen von 20 bis 60 Sekunden, zwei- bis dreimal pro Woche."],
    variations: [
      ["side-plank", "Trainiert die schrägen Bauchmuskeln und die Seiten der Hüfte."],
      ["long-lever-plank", "Ellbogen weiter vorne: viel schwerer."],
      ["ab-wheel", "Eine bewegte Variante, wenn der Unterarmstütz leicht wird."],
    ],
    faq: [
      [
        "Wie lange sollte ich den Unterarmstütz halten?",
        "20 bis 60 Sekunden mit perfekter Haltung. Darüber hinaus bringt eine schwerere Variante mehr.",
      ],
      [
        "Verbrennt der Unterarmstütz Bauchfett?",
        "Keine Übung verbrennt Fett an einer bestimmten Stelle. Siehe [how to lose belly fat](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "Beim hängenden Beinheben hängst du an einer Stange und hebst die Beine. Es ist eine der härtesten Bauchübungen und trainiert den unteren Bauch, die Hüftbeuger und dazu den Griff.",
    mistakes: [
      ["Schwingen", "Start aus einem ruhigen Hang und senk langsam ab. Pausier unten, wenn du ins Schwingen kommst."],
      ["Nur die Beine heben", "Roll oben das Becken ein, damit der Bauch arbeitet und nicht nur die Hüftbeuger."],
      ["Der Griff gibt zuerst nach", "Nimm Schlaufen für die Arme oder trainier den Griff separat."],
    ],
    sets: ["**Rumpf:** 3 Sätze mit 6 bis 15."],
    variations: [
      ["hanging-knee-raise", "Gebeugte Knie: der leichtere erste Schritt."],
      ["parallel-bar-knee-raise", "Am Dip-Barren, ohne Griff."],
      ["lying-leg-raise", "Auf dem Boden, noch leichter."],
    ],
    faq: [
      ["Wie höre ich auf zu schwingen?", "Senk langsam ab, pausier unten und halt die Schultern aktiv."],
      ["Zu schwer?", "Fang mit hängendem Knieheben an und wechsle zu gestreckten Beinen, wenn du 3 Sätze mit 12 schaffst."],
    ],
  },
  "ab-wheel": {
    intro:
      "Mit dem Bauchroller rollst du nach vorne aus und wieder zurück. Es ist eine der anspruchsvollsten Bauchübungen und trainiert den Bauch darin, ein Hohlkreuz zu verhindern, während die Arme über den Kopf reichen.",
    mistakes: [
      ["Unterer Rücken hängt durch", "Roll nur so weit, wie du kein Hohlkreuz machst. Kipp das Becken und spann das Gesäß an."],
      ["Die Hüfte führt beim Zurückkommen", "Zieh dich mit Bauch und Armen gemeinsam zurück, nicht indem du die Hüfte hochstreckst."],
      ["Zu früh zu weit", "Roll zuerst bis zu einer Wand oder nur ein kurzes Stück und geh jede Woche etwas weiter."],
    ],
    sets: ["**Rumpf:** 3 Sätze mit 5 bis 12 von den Knien aus, später im Stand, wenn du stark genug bist."],
    variations: [
      ["plank", "Die statische Variante zum Hinarbeiten."],
      ["plank-reach", "Ein sanfterer Weg, dieselbe Fähigkeit zu trainieren."],
      ["dead-bug", "In Rückenlage, um zu lernen, den unteren Rücken unten zu halten."],
    ],
    faq: [
      [
        "Ist der Bauchroller schlecht für den Rücken?",
        "Nicht, wenn du in dem Bereich bleibst, in dem du kein Hohlkreuz machst. Verkürz den Weg, wenn du es im unteren Rücken spürst.",
      ],
      ["Von den Knien oder im Stand?", "Für die meisten von den Knien. Ausrollen im Stand ist ein Ziel für Fortgeschrittene."],
    ],
  },
  "kb-swing": {
    intro:
      "Beim Kettlebell-Swing schnellt die Hüfte nach vorne und schwingt die Kettlebell auf Brusthöhe. Er trainiert Gesäß und Beinbeuger explosiv und ist zugleich Konditionstraining.",
    mistakes: [
      ["Den Swing hocken", "Es ist eine Hüftbeuge: Schieb die Hüfte nach hinten, mit nur leicht gebeugten Knien."],
      ["Mit den Armen heben", "Die Hüfte schickt die Kugel nach oben; die Arme halten nur fest."],
      ["Oben nach hinten lehnen", "Steh am Ende aufrecht mit festem Gesäß und Bauch, wie im Unterarmstütz."],
    ],
    sets: [
      "**Schnellkraft:** 5 bis 10 Sätze mit 10, Pause nach Bedarf.",
      "**Kondition:** 10 bis 20 Swings zu Beginn jeder Minute, 10 Minuten lang.",
    ],
    variations: [
      ["kb-single-swing", "Eine Hand: bringt eine Drehung, gegen die der Rumpf arbeiten muss."],
      ["db-swing", "Mit einer Kurzhantel, wenn du keine Kettlebell hast."],
      ["kb-deadlift", "Lern die Hüftbeuge, bevor du schwingst."],
    ],
    faq: [
      [
        "Wie schwer sollte meine Kettlebell sein?",
        "So schwer, dass der Swing knackig ist, nicht langsam. Viele Frauen starten mit 12 kg, viele Männer mit 16 bis 20 kg.",
      ],
      ["Wie hoch sollte ich schwingen?", "Bis etwa Brusthöhe. Höher bringt nicht viel mehr."],
    ],
  },
  "farmers-carry": {
    intro:
      "Beim Farmer's Walk nimmst du zwei schwere Gewichte und gehst los. Er trainiert Griff, Trapezmuskel, Rumpf und Haltung auf einmal und hilft direkt im Alltag.",
    mistakes: [
      ["Zur Seite lehnen oder verdrehen", "Geh aufrecht, Schultern hinten und unten, mit kurzen, schnellen Schritten."],
      ["Zu leichte Gewichte", "Die Strecke zu schaffen, sollte schwer sein. Der Griff soll die Grenze sein."],
      ["Mit rundem Rücken aufheben", "Heb die Gewichte wie beim Kreuzheben auf und stell sie genauso wieder ab."],
    ],
    sets: ["**Kraft:** 3 bis 5 Strecken von 20 bis 40 Metern, 1 bis 2 Minuten Pause."],
    variations: [
      ["db-suitcase-carry", "Nur eine Seite: trainiert die schrägen Bauchmuskeln."],
      ["trap-bar-carry", "Schwerere Lasten in einer Stange."],
      ["kb-rack-carry", "Kugeln an den Schultern, für den oberen Rücken."],
    ],
    faq: [
      ["Wie schwer für den Farmer's Walk?", "Fang mit etwa einem Viertel deines Körpergewichts in jeder Hand an und steiger dich."],
      ["Wie weit sollte ich gehen?", "20 bis 40 Meter pro Strecke oder 30 bis 60 Sekunden."],
    ],
  },
  "good-morning": {
    intro:
      "Beim Good Morning liegt die Stange auf deinem Rücken und du beugst dich aus der Hüfte nach vorne. Er stärkt Beinbeuger, Gesäß und unteren Rücken und lehrt eine kräftige Hüftbeuge.",
    mistakes: [
      ["Zu schwer", "Fang leicht an. Diese Übung ist hart für den unteren Rücken, wenn die Technik bricht."],
      ["Rücken rundet sich", "Halt den Rücken gerade und die Brust stolz; geh nur so tief, wie du das halten kannst."],
      ["Knie zu stark beugen", "Halt die Knie leicht gebeugt und schieb die Hüfte gerade nach hinten."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 12, leicht."],
    variations: [
      ["romanian-deadlift", "Dieselbe Hüftbeuge mit dem Gewicht in den Händen."],
      ["band-good-morning", "Leicht und gut zum Lernen."],
      ["seated-good-morning", "Im Sitzen: vor allem der untere Rücken."],
    ],
    faq: [
      ["Sind Good Mornings gefährlich?", "Nicht mit vernünftigem Gewicht und guter Technik. Fang leicht an und steiger langsam."],
      [
        "Wie tief sollte ich gehen?",
        "Bis dein Oberkörper ungefähr parallel zum Boden ist, oder weniger, wenn sich der Rücken zu runden beginnt.",
      ],
    ],
  },
  "step-up": {
    intro:
      "Beim Step-up drückst du dich mit einem Bein auf eine Box oder Bank. Er baut Quadrizeps und Gesäß Seite für Seite auf und hilft direkt beim Treppensteigen, Wandern und Sport.",
    mistakes: [
      ["Mit dem hinteren Fuß abdrücken", "Halt den hinteren Fuß leicht; lass das vordere Bein dich hochheben."],
      ["Box zu hoch", "Fang mit einer Box auf Kniehöhe oder etwas darunter an."],
      ["Runterfallen lassen", "Senk dich langsam ab. Der Weg nach unten trainiert das Bein auch."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 12 pro Bein.", "**Körpergewicht:** 3 Sätze mit 15 bis 20 pro Bein."],
    variations: [
      ["db-step-up", "Kurzhanteln für mehr Gewicht."],
      ["db-lateral-step-up", "Seitlich auf die Box, für das Gesäß."],
      ["box-step-down", "Langsames Absteigen für die Kniekontrolle."],
    ],
    faq: [
      [
        "Wie hoch sollte die Box sein?",
        "Kniehöhe oder darunter. Höhere Boxen fordern das Gesäß mehr, sind aber schwerer zu kontrollieren.",
      ],
      [
        "Step-ups oder Ausfallschritte?",
        "Beide trainieren dieselben Muskeln. Step-ups sind leichter zu balancieren; Ausfallschritte haben einen längeren Weg.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "Das Bankdrücken ist die wichtigste Kraftübung für den Oberkörper. Es trainiert Brust, vordere Schultern und Trizeps, verträgt viel Gewicht und ist eine der Übungen, bei denen sich Fortschritt am leichtesten verfolgen lässt.",
    mistakes: [
      [
        "Flache, lockere Schultern",
        "Zieh die Schulterblätter nach hinten und unten, bevor du die Stange aushebst, und halt sie den ganzen Satz fest.",
      ],
      ["Ellbogen weit nach außen", "Halt sie etwa 45 bis 70 Grad vom Körper. Das ist stärker und schont die Schultern."],
      ["Die Stange von der Brust abfedern", "Berühr die untere Brust leicht, dann drück. Eine kurze Pause lehrt Kontrolle."],
      ["Füße in der Luft", "Stell die Füße fest auf und drück in den Boden, damit dein Körper gespannt bleibt."],
    ],
    sets: [
      "**Kraft:** 3 bis 5 Sätze mit 3 bis 6, 3 bis 5 Minuten Pause.",
      "**Muskelaufbau:** 3 bis 4 Sätze mit 6 bis 10, 2 bis 3 Minuten Pause.",
      "**Für Einsteiger:** 3 Sätze mit 8; leg jedes Training etwas Gewicht drauf.",
    ],
    variations: [
      ["db-bench-press", "Mehr Bewegungsweg und jede Seite arbeitet für sich."],
      ["incline-bench-press", "Mehr obere Brust und vordere Schulter."],
      ["close-grip-bench", "Verlagert die Arbeit Richtung Trizeps."],
      ["spoto-press", "Pause knapp über der Brust für mehr Kontrolle."],
    ],
    faq: [
      [
        "Brauche ich einen Sicherungspartner?",
        "Für schwere Sätze nimm einen Partner oder ein Rack mit Sicherheitsablagen knapp unter Brusthöhe.",
      ],
      [
        "Wie breit sollte ich greifen?",
        "Die meisten drücken am besten, wenn die Unterarme unten senkrecht sind, meist etwas breiter als schulterbreit.",
      ],
      [
        "Soll ich ein Hohlkreuz machen?",
        "Ein leichter Bogen durch das Zurückziehen der Schulterblätter ist normal. Lass das Gesäß auf der Bank.",
      ],
    ],
  },
  "incline-bench-press": {
    intro:
      "Beim Schrägbankdrücken drückst du eine Langhantel auf einer Bank mit etwa 30 Grad Neigung. Es verlagert mehr Arbeit auf die obere Brust und die vorderen Schultern als die Flachbank.",
    mistakes: [
      ["Bank zu steil", "Etwa 30 Grad reichen. Steiler wird es zum Schulterdrücken."],
      ["Stange zu tief geführt", "Senk die Stange zur oberen Brust ab, knapp unter die Schlüsselbeine."],
      ["Schultern rollen nach vorne", "Halt die Schulterblätter hinten und unten, wie auf der Flachbank."],
    ],
    sets: ["**Kraft:** 3 bis 4 Sätze mit 4 bis 6.", "**Muskelaufbau:** 3 Sätze mit 6 bis 12."],
    variations: [
      ["db-incline-press", "Kurzhanteln: mehr Bewegungsweg, schonender für die Schultern."],
      ["smith-incline-press", "Eine feste Bahn, um sicher hart zu drücken."],
      ["bench-press", "Flach: insgesamt mehr Gewicht."],
    ],
    faq: [
      ["Welcher Winkel für die Schrägbank?", "Etwa 30 Grad. Viele verstellbare Bänke haben eine Stufe nah an diesem Wert."],
      [
        "Brauche ich Flach- und Schrägbank?",
        "Nicht unbedingt, aber beides trainiert die Brust aus zwei Winkeln. Viele Pläne nutzen eine als Hauptübung und die andere als zweite Drückübung.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "Beim Kurzhantel-Bankdrücken drückst du zwei Kurzhanteln auf einer Flachbank. Jeder Arm arbeitet für sich und die Hanteln können tiefer gehen als eine Stange, deshalb ist es super für Brustmasse und um Seitenunterschiede auszugleichen.",
    mistakes: [
      [
        "Schlecht in Position kommen",
        "Setz dich mit den Hanteln auf den Oberschenkeln hin, leg dich dann zurück und bring sie mit den Knien hoch.",
      ],
      ["Hanteln wandern zu weit nach außen", "Senk sie neben die Brust ab, mit den Ellbogen bei etwa 45 Grad."],
      ["Oben zusammenschlagen", "Drück nach oben und leicht nach innen und stopp kurz bevor sich die Hanteln berühren."],
    ],
    sets: [
      "**Muskelaufbau:** 3 bis 4 Sätze mit 6 bis 12.",
      "**Zu Hause:** 3 Sätze mit 10 bis 20, langsam absenken, wenn deine Hanteln leicht sind.",
    ],
    variations: [
      ["db-incline-press", "Fokus auf die obere Brust."],
      ["db-floor-press", "Keine Bank nötig; kürzerer Weg."],
      ["db-neutral-press", "Handflächen zueinander: schonender für die Schultern."],
    ],
    faq: [
      [
        "Kurzhantel oder Langhantel?",
        "Mit der Langhantel schaffst du mehr Gewicht; Kurzhanteln geben mehr Weg und gleichen Seiten aus. Beides baut die Brust auf.",
      ],
      [
        "Wie lege ich die Hanteln sicher ab?",
        "Führ sie zur Brust, dann senk sie auf die Oberschenkel, während du dich aufsetzt. Lass sie nicht seitlich fallen.",
      ],
    ],
  },
  "db-incline-press": {
    intro:
      "Beim Kurzhantel-Schrägbankdrücken drückst du zwei Kurzhanteln auf einer schrägen Bank. Es ist eine der besten Übungen für die obere Brust und schont die Schultern mehr als die Langhantel auf der Schrägbank.",
    mistakes: [
      ["Bank zu steil", "Nimm etwa 30 Grad, damit die Brust die Hauptarbeit macht."],
      ["Den Weg verkürzen", "Lass die Hanteln kontrolliert bis auf Brusthöhe kommen, für eine volle Dehnung."],
      ["Von der Bank abheben", "Lass die Hüfte unten und drück den oberen Rücken ins Polster."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 12."],
    variations: [
      ["db-low-incline-press", "Ein flacherer Winkel, zwischen flach und schräg."],
      ["incline-bench-press", "Die Langhantel-Variante für mehr Gewicht."],
      ["incline-machine-press", "Eine Maschine, um hart zu drücken, ohne zu balancieren."],
    ],
    faq: [
      ["Baut das Schrägbankdrücken die obere Brust auf?", "Ja. Die Neigung verlagert mehr Arbeit auf die oberen Fasern der Brust."],
      ["Wie schwer im Vergleich zur Flachbank?", "Meist 10 bis 20 % weniger als dein Kurzhantel-Bankdrücken auf der Flachbank."],
    ],
  },
  "push-up": {
    intro:
      "Beim Liegestütz drückst du deinen Körper vom Boden hoch. Er trainiert Brust, Schultern und Trizeps überall, und mit schwereren Varianten bringt er dich weit.",
    mistakes: [
      ["Hüfte hängt durch", "Spann Gesäß und Bauch an, damit dein Körper eine Linie bleibt."],
      ["Ellbogen nach außen", "Halt die Ellbogen etwa 45 Grad vom Körper."],
      ["Halbe Wiederholungen", "Senk dich ab, bis die Brust eine Faust breit über dem Boden ist, dann drück dich ganz hoch."],
    ],
    sets: [
      "**Muskelaufbau:** 3 Sätze, ein bis zwei Wiederholungen vor dem Versagen aufhören.",
      "**Zu leicht?** Füße erhöhen, langsamer absenken oder einen Rucksack aufsetzen.",
    ],
    variations: [
      ["incline-push-up", "Hände auf einer Bank: leichter, der erste Schritt."],
      ["decline-push-up", "Füße erhöht: schwerer, mehr obere Brust."],
      ["archer-push-up", "Verlagert die Arbeit auf einen Arm."],
      ["deficit-push-up", "Hände auf Blöcken für eine tiefere Dehnung."],
    ],
    faq: [
      [
        "Wie viele Liegestütze sollte ich machen?",
        "So viele saubere, wie du schaffst, minus ein oder zwei, für 3 Sätze. Mach sie schwerer, sobald du über etwa 20 kommst.",
      ],
      [
        "Bauen Liegestütze Muskeln auf?",
        "Ja, solange die Sätze hart sind. Nimm schwerere Varianten, wenn du stärker wirst. Siehe [calisthenics progressions](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "Beim Dip senkst du deinen Körper zwischen zwei parallelen Holmen ab und drückst ihn wieder hoch. Es ist eine der besten Körpergewichtsübungen für Brust und Trizeps.",
    mistakes: [
      ["Zu tief gehen", "Senk dich ab, bis die Oberarme etwa parallel zum Boden sind, oder weniger, wenn die Schultern sich melden."],
      ["Schultern hochziehen", "Halt die Schultern unten, weg von den Ohren."],
      ["Schwingen", "Kreuz die Knöchel und halt den Körper ruhig."],
    ],
    sets: [
      "**Muskelaufbau:** 3 Sätze mit 6 bis 12.",
      "**Zu leicht?** Häng Gewicht an einen Gürtel oder klemm eine Kurzhantel zwischen die Füße.",
    ],
    variations: [
      ["negative-dip", "Nur langsames Absenken, der erste Schritt."],
      ["band-assisted-dip", "Ein Band nimmt dir etwas Gewicht ab."],
      ["ring-dip", "Viel schwerer: Die Ringe bewegen sich."],
    ],
    faq: [
      ["Brust oder Trizeps?", "Lehn dich nach vorne für mehr Brust; bleib aufrecht für mehr Trizeps."],
      [
        "Sind Dips schlecht für die Schultern?",
        "Für die meisten nicht, wenn du die Tiefe kontrollierst. Hör vor dem Bereich auf, der wehtut.",
      ],
    ],
  },
  "cable-fly": {
    intro:
      "Beim Kabelzug-Flys führst du die Hände gegen zwei Kabel in einem umarmenden Bogen zusammen. Die Übung isoliert die Brust und hält die Spannung über die ganze Wiederholung, besonders in der Dehnung.",
    mistakes: [
      ["Eine Drückübung daraus machen", "Halt eine feste, leichte Beugung in den Ellbogen. Beweg dich nur in den Schultern."],
      ["Zu schwer", "Wähl ein Gewicht, das du durch die volle Dehnung kontrollieren kannst."],
      ["Schultern rollen nach vorne", "Halt die Brust hoch und die Schulterblätter hinten."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 3 Sätze mit 10 bis 15, nach deinen Drückübungen."],
    variations: [
      ["low-cable-fly", "Von unten nach oben: obere Brust."],
      ["pec-deck", "Eine Maschine mit fester Bahn."],
      ["db-fly", "Mit Kurzhanteln, ohne Kabelzug."],
    ],
    faq: [
      [
        "Kabel von oben oder von unten?",
        "Von oben nach unten arbeitet mehr die untere Brust; von unten nach oben mehr die obere. Beides ist gut.",
      ],
      [
        "Kabel oder Kurzhantel-Flys?",
        "Kabel halten die Spannung oben in der Bewegung; Kurzhanteln sind in der Dehnung am schwersten. Beides funktioniert.",
      ],
    ],
  },
  "overhead-press": {
    intro:
      "Beim Überkopfdrücken drückst du eine Langhantel im Stand von den Schultern über den Kopf. Es baut Schultern und Trizeps auf, und der ganze Körper muss Spannung halten.",
    mistakes: [
      ["Weit nach hinten lehnen", "Spann Gesäß und Bauch an, damit dein Körper gestapelt bleibt."],
      [
        "Stange um das Gesicht herumführen",
        "Zieh das Kinn zurück, drück gerade nach oben und schieb den Kopf durch, sobald die Stange vorbei ist.",
      ],
      ["Ellbogen am Start nach außen", "Starte mit den Ellbogen leicht vor der Stange."],
    ],
    sets: ["**Kraft:** 3 bis 5 Sätze mit 3 bis 6.", "**Muskelaufbau:** 3 Sätze mit 6 bis 10."],
    variations: [
      ["db-shoulder-press", "Im Sitzen mit Kurzhanteln: schonender für den unteren Rücken."],
      ["push-press", "Etwas Schwung aus den Beinen, um mehr Gewicht zu bewegen."],
      ["landmine-press", "Ein schräges Drücken für empfindliche Schultern."],
    ],
    faq: [
      [
        "Warum stagniert mein Überkopfdrücken so oft?",
        "Es ist eine kleinere Übung, deshalb sind Sprünge relativ groß. Nimm kleine Scheiben oder steiger erst die Wiederholungen, dann das Gewicht. Siehe [linear vs double progression](/blog/linear-vs-double-progression/).",
      ],
      [
        "Im Stehen oder im Sitzen?",
        "Im Stehen trainiert auch den Rumpf; im Sitzen können die Schultern mehr drücken. Beides funktioniert.",
      ],
    ],
  },
  "db-shoulder-press": {
    intro:
      "Beim Kurzhantel-Schulterdrücken drückst du zwei Kurzhanteln über den Kopf, meist im Sitzen mit Rückenlehne. Es baut vordere und seitliche Schultern auf und belastet den unteren Rücken weniger als das Langhanteldrücken im Stand.",
    mistakes: [
      ["Bank ganz senkrecht", "Stell sie knapp unter senkrecht, damit dein Rücken gestützt ist."],
      ["Zu wenig absenken", "Führ die Hanteln bis etwa auf Ohr- oder Kinnhöhe."],
      ["Die Hanteln zusammenschlagen", "Drück nach oben und leicht nach innen und stopp, bevor sie sich berühren."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 6 bis 12."],
    variations: [
      ["db-arnold-press", "Drehende Handflächen für mehr vordere Schulter."],
      ["machine-shoulder-press", "Eine feste Bahn, um sicher hart zu drücken."],
      ["overhead-press", "Langhantel, im Stand."],
    ],
    faq: [
      ["Im Sitzen oder im Stehen?", "Im Sitzen drückst du mehr; im Stehen trainierst du Gleichgewicht und Rumpf."],
      [
        "Handflächen nach vorne oder nach innen?",
        "Leicht nach innen ist für viele Schultern angenehmer. Nimm, was sich am besten anfühlt.",
      ],
    ],
  },
  "lateral-raise": {
    intro:
      "Beim Seitheben hebst du zwei Kurzhanteln seitlich an. Es isoliert die seitlichen Schultern, die den Schultern Breite geben und von Drückübungen kaum trainiert werden.",
    mistakes: [
      ["Das Gewicht hochschwingen", "Nimm ein Gewicht, das du ohne Lehnen oder Schulterzucken heben kannst."],
      ["Schultern hochziehen", "Denk daran, die Hanteln nach außen, weg von dir zu schieben, nicht nach oben."],
      ["Zu schwer", "Leichte Gewichte für 12 bis 20 saubere Wiederholungen schlagen schwere, geschwungene."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 12 bis 20, zwei- bis dreimal pro Woche."],
    variations: [
      ["cable-lateral-raise", "Ständige Spannung, ein Arm nach dem anderen."],
      ["lean-away-lateral-raise", "An einem Pfosten festhalten für einen längeren Weg."],
      ["machine-lateral-raise", "Eine feste Bahn, leicht bis zum Versagen zu fahren."],
    ],
    faq: [
      ["Wie schwer sollte Seitheben sein?", "Leicht. Die meisten nehmen für saubere Wiederholungen Kurzhanteln von 4 bis 10 kg."],
      ["Wie hoch sollte ich heben?", "Bis etwa Schulterhöhe. Höher arbeitet der Trapezmuskel mit."],
    ],
  },
  "face-pull": {
    intro:
      "Beim Face Pull ziehst du ein Seil am oberen Kabelzug mit auseinandergehenden Händen zum Gesicht. Er trainiert hintere Schultern und oberen Rücken, gleicht die Drückübungen aus und hilft der Haltung.",
    mistakes: [
      ["Mit dem unteren Rücken ziehen", "Steh aufrecht und spann an; lehn dich nur leicht zurück."],
      ["Hände zu tief", "Zieh zur Stirn oder zu den Augen; die Hände enden neben den Ohren."],
      ["Zu schwer", "Nimm ein Gewicht, mit dem du am Ende jeder Wiederholung kurz halten kannst."],
    ],
    sets: ["**Muskelaufbau und gesunde Schultern:** 2 bis 3 Sätze mit 12 bis 20."],
    variations: [
      ["band-face-pull", "Mit einem Band, zu Hause."],
      ["rear-delt-fly", "Mit Kurzhanteln, vorgebeugt."],
      ["reverse-pec-deck", "Eine Maschine mit fester Bahn."],
    ],
    faq: [
      [
        "Sind Face Pulls gut für die Schultern?",
        "Sie trainieren hintere Schultern und oberen Rücken, die die Drückübungen ausgleichen. Viele machen sie in jedem Oberkörpertraining.",
      ],
      ["Seil oder Stange?", "Mit dem Seil können die Hände am Ende auseinandergehen, das trainiert die hinteren Schultern stärker."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "Beim Reverse Fly beugst du dich vor und hebst zwei Kurzhanteln seitlich an. Er isoliert die hinteren Schultern, die die meisten Drück- und selbst Ruderübungen kaum trainieren.",
    mistakes: [
      ["Eine Ruderübung daraus machen", "Halt die Ellbogen leicht und fest gebeugt und beweg dich in den Schultern."],
      ["Die Schulterblätter zusammendrücken", "Lass die Schultern arbeiten; die Schulterblätter bleiben ziemlich ruhig."],
      ["Zu schwer", "Sehr leichte Gewichte mit Kontrolle funktionieren am besten."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 12 bis 20."],
    variations: [
      ["reverse-pec-deck", "Eine Maschine, leichter sauber zu halten."],
      ["cable-rear-delt-fly", "Kabel für ständige Spannung."],
      ["face-pull", "Ein Zug, der auch den oberen Rücken trainiert."],
    ],
    faq: [
      [
        "Im Sitzen oder im Stehen?",
        "Im Sitzen mit der Brust auf den Knien oder bäuchlings auf einer Schrägbank bleibst du leichter sauber.",
      ],
      [
        "Warum die hinteren Schultern trainieren?",
        "Sie runden die Schultern ab und gleichen das viele Drücken aus, das die meisten Pläne enthalten.",
      ],
    ],
  },
  "pull-up": {
    intro:
      "Beim Klimmzug hängst du mit den Handflächen nach vorne an einer Stange und ziehst das Kinn darüber. Es ist die klassische Rückenübung mit Körpergewicht und trainiert Latissimus, oberen Rücken und Bizeps.",
    mistakes: [
      ["Kippen oder Schwingen", "Starte jede Wiederholung aus einem ruhigen Hang."],
      ["Halbe Wiederholungen", "Geh von gestreckten Armen bis das Kinn über der Stange ist."],
      ["Oben die Schultern hochziehen", "Zieh die Schultern beim Ziehen nach unten und hinten."],
    ],
    sets: [
      "**Muskelaufbau:** 3 bis 4 Sätze, ein bis zwei Wiederholungen vor dem Versagen aufhören.",
      "**Zu leicht?** Häng Gewicht an einen Gürtel oder klemm eine Kurzhantel zwischen die Füße.",
    ],
    variations: [
      ["negative-pull-up", "Hochspringen und langsam absenken, der erste Schritt."],
      ["band-assisted-pull-up", "Ein Band nimmt dir etwas Gewicht ab."],
      ["chin-up", "Handflächen zu dir: etwas leichter, mehr Bizeps."],
      ["neutral-grip-pull-up", "Handflächen zueinander, schonend für die Ellbogen."],
    ],
    faq: [
      [
        "Wie schaffe ich meinen ersten Klimmzug?",
        "Langsame Negative, Wiederholungen mit Band und Latziehen, dreimal pro Woche. Die meisten schaffen den ersten in ein paar Monaten.",
      ],
      [
        "Klimmzug oder Latziehen?",
        "Beide trainieren den Latissimus. Klimmzüge fordern auch den Rumpf; beim Latziehen wählst du jedes Gewicht.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "Beim Chin-up hängst du mit den Handflächen zu dir an einer Stange und ziehst das Kinn darüber. Er trainiert den Latissimus, fordert den Bizeps stärker als der Klimmzug, und die meisten schaffen ein paar mehr.",
    mistakes: [
      ["Nicht ganz aushängen", "Streck die Arme unten bei jeder Wiederholung."],
      ["Mit dem Kinn voran", "Zieh die Brust zur Stange, statt den Hals zu strecken."],
      ["Schwingen", "Halt die Beine ruhig und den Rumpf fest."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze, ein bis zwei Wiederholungen vor dem Versagen aufhören."],
    variations: [
      ["pull-up", "Handflächen nach vorne: mehr oberer Rücken."],
      ["reverse-grip-pulldown", "Derselbe Griff an der Maschine."],
      ["negative-pull-up", "Langsames Absenken, um dich hinzuarbeiten."],
    ],
    faq: [
      [
        "Chin-up oder Klimmzug?",
        "Chin-ups nutzen mehr Bizeps und sind etwas leichter; Klimmzüge mehr oberen Rücken. Beide bauen den Latissimus auf.",
      ],
      ["Wie breit sollte ich greifen?", "Etwa schulterbreit."],
    ],
  },
  "lat-pulldown": {
    intro:
      "Beim Latziehen ziehst du eine Stange vom oberen Kabelzug zur oberen Brust. Es trainiert den Latissimus wie ein Klimmzug, aber du wählst das Gewicht, sodass jeder es machen kann.",
    mistakes: [
      ["Weit nach hinten lehnen", "Lehn dich nur leicht zurück und halt die Brust hoch."],
      ["Mit den Armen ziehen", "Denk daran, die Ellbogen nach unten an die Seiten zu führen."],
      ["In den Nacken ziehen", "Zieh zur oberen Brust."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 8 bis 12."],
    variations: [
      ["close-grip-pulldown", "Ein enger Griff, ein längerer Weg."],
      ["one-arm-cable-pulldown", "Eine Seite nach der anderen."],
      ["pull-up", "Dein eigenes Körpergewicht."],
    ],
    faq: [
      [
        "Breiter oder enger Griff?",
        "Beide trainieren den Latissimus. Ein mittlerer Griff, etwas breiter als die Schultern, passt den meisten.",
      ],
      ["Hilft Latziehen für den Klimmzug?", "Ja, besonders mit langsamen Negativen. Siehe [back workout](/blog/back-workout/)."],
    ],
  },
  "barbell-row": {
    intro:
      "Beim Langhantelrudern beugst du dich vor und ziehst eine Stange zum Bauch. Es baut den ganzen oberen Rücken, den Latissimus und die hinteren Schultern auf und verträgt schwere Gewichte.",
    mistakes: [
      ["Beim Rudern aufrichten", "Halt den Oberkörper in einem festen Winkel, etwa 30 bis 45 Grad zum Boden."],
      ["Das Gewicht reißen", "Zieh gleichmäßig und senk kontrolliert ab."],
      ["Unterer Rücken rundet sich", "Spann an und halt den Rücken gerade. Nimm Gewicht runter, wenn er sich rundet."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 6 bis 12.", "**Kraft:** 3 Sätze mit 5 bis 8."],
    variations: [
      ["pendlay-row", "Jede Wiederholung vom Boden, gerader Rücken."],
      ["chest-supported-row", "Gar keine Belastung für den unteren Rücken."],
      ["db-row", "Ein Arm nach dem anderen, mit Abstützen."],
    ],
    faq: [
      [
        "Obergriff oder Untergriff?",
        "Obergriff arbeitet mehr der obere Rücken; Untergriff mehr Latissimus und Bizeps. Beides ist in Ordnung.",
      ],
      [
        "Warum tut mir beim Rudern der untere Rücken weh?",
        "Dein Oberkörper ist nicht gestützt. Nimm weniger Gewicht oder wechsle zum Rudern mit Brustauflage.",
      ],
    ],
  },
  "db-row": {
    intro:
      "Beim einarmigen Kurzhantelrudern stützt du Hand und Knie auf einer Bank ab und ziehst eine Kurzhantel zur Hüfte. Es trainiert Latissimus und oberen Rücken Seite für Seite, mit gestütztem Rücken.",
    mistakes: [
      ["Zum Heben verdrehen", "Halt Schultern und Hüfte parallel zum Boden."],
      ["Zur Brust ziehen", "Zieh Richtung Hüfte, um den Latissimus zu treffen."],
      ["Zu kurzer Weg", "Lass die Hantel bei jeder Wiederholung ganz nach unten hängen, für eine Dehnung."],
    ],
    sets: ["**Muskelaufbau:** 3 Sätze mit 8 bis 12 pro Arm."],
    variations: [
      ["db-chest-supported-row", "Beide Arme, Brust auf einer Schrägbank."],
      ["kb-row", "Mit einer Kettlebell."],
      ["seal-row", "Bäuchlings auf einer hohen Bank: sehr sauber."],
    ],
    faq: [
      [
        "Brauche ich eine Bank?",
        "Mit Bank ist es am einfachsten. Ohne stütz dich mit einer Hand auf einem stabilen Stuhl oder deinem Knie ab.",
      ],
      [
        "Wie schwer sollte das Kurzhantelrudern sein?",
        "So schwer, dass die letzten Wiederholungen hart sind, ohne dass du dich verdrehst.",
      ],
    ],
  },
  "seated-cable-row": {
    intro:
      "Beim sitzenden Kabelrudern ziehst du im Sitzen einen Griff vom unteren Kabelzug zum Bauch. Es trainiert oberen Rücken und Latissimus mit gleichmäßiger Spannung und ohne Last auf dem unteren Rücken.",
    mistakes: [
      ["Vor und zurück schaukeln", "Halt den Oberkörper ruhig und lehn dich am Ende nur leicht zurück."],
      ["Schultern hochziehen", "Zieh die Schulterblätter nach hinten und unten, nicht nach oben."],
      ["Zu schnell zurück", "Lass die Arme kontrolliert gestreckt werden und spür die Dehnung."],
    ],
    sets: ["**Muskelaufbau:** 3 bis 4 Sätze mit 8 bis 15."],
    variations: [
      ["cable-row-wide", "Eine breite Stange: mehr oberer Rücken."],
      ["single-arm-cable-row", "Eine Seite nach der anderen."],
      ["machine-row", "Eine Maschine mit Brustauflage."],
    ],
    faq: [
      [
        "Welcher Griff ist am besten?",
        "Ein enger V-Griff arbeitet mehr der Latissimus; eine breite Stange mehr der obere Rücken. Nutz mit der Zeit beide.",
      ],
      ["Soll ich mich nach vorne lehnen?", "Am Anfang ein wenig für die Dehnung, dann sitz beim Ziehen aufrecht."],
    ],
  },
  "barbell-curl": {
    intro:
      "Beim Langhantelcurl beugst du eine Stange von den Oberschenkeln bis zu den Schultern. Es ist die klassische Bizepsübung und erlaubt das meiste Gewicht aller Curls.",
    mistakes: [
      ["Mit dem Rücken schwingen", "Steh aufrecht mit den Ellbogen an den Seiten. Nimm Gewicht runter, wenn du schwingen musst."],
      ["Ellbogen wandern nach vorne", "Halt sie die ganze Wiederholung nah am Körper."],
      ["Die Stange fallen lassen", "Senk sie kontrolliert zwei bis drei Sekunden lang ab."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 4 Sätze mit 8 bis 12."],
    variations: [
      ["ez-curl", "Eine gekröpfte Stange, schonender für die Handgelenke."],
      ["db-curl", "Jeder Arm für sich."],
      ["drag-curl", "Zieht die Stange am Körper hoch, für mehr Bizepsspitze."],
    ],
    faq: [
      ["Gerade Stange oder SZ-Stange?", "Die SZ-Stange schont die Handgelenke. Die gerade Stange trainiert den Bizeps etwas mehr."],
      [
        "Wie viele Curls sollte ich machen?",
        "Etwa 6 bis 12 harte Sätze Bizepsarbeit pro Woche, Chin-ups und Rudern mitgezählt. Siehe [arm workout](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "Beim Kurzhantelcurl beugst du in jeder Hand eine Kurzhantel. Jeder Arm arbeitet für sich, und du kannst die Handflächen beim Heben nach oben drehen, was den Bizeps vollständig fordert.",
    mistakes: [
      ["Schwingen", "Halt die Ellbogen an den Seiten und den Körper ruhig."],
      ["Zu spät drehen", "Starte mit den Handflächen nach innen und dreh sie beim Beugen nach oben."],
      ["Zu kurzer Weg", "Streck die Arme unten ganz."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 4 Sätze mit 8 bis 15."],
    variations: [
      ["incline-db-curl", "Auf einer Schrägbank für eine lange Dehnung."],
      ["hammer-curl", "Handflächen nach innen: mehr Unterarm und Oberarmmuskel."],
      ["db-preacher-curl", "Arm auf einem Polster für saubere Wiederholungen."],
    ],
    faq: [
      ["Abwechselnd oder beide Arme gleichzeitig?", "Beides. Abwechselnd konzentrierst du dich auf jeden Arm; gleichzeitig spart Zeit."],
      ["Im Stehen oder im Sitzen?", "Im Sitzen kannst du schwerer schwingen."],
    ],
  },
  "hammer-curl": {
    intro:
      "Beim Hammercurl beugst du Kurzhanteln mit den Handflächen zueinander. Er trainiert den Oberarmmuskel und die Unterarme stärker als ein normaler Curl und macht den Arm dicker.",
    mistakes: [
      ["Das Gewicht schwingen", "Steh aufrecht und halt die Ellbogen ruhig."],
      ["Die Handflächen drehen", "Halt die Handflächen die ganze Wiederholung zueinander."],
      ["Hetzen", "Senk kontrolliert ab."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 3 Sätze mit 8 bis 15."],
    variations: [
      ["rope-hammer-curl", "Am Kabelzug mit einem Seil."],
      ["incline-hammer-curl", "Auf einer Schrägbank für eine Dehnung."],
      ["reverse-curl", "Handflächen nach unten für die Unterarme."],
    ],
    faq: [
      ["Hammercurl oder normaler Curl?", "Mach beides: normale Curls für den Bizeps, Hammercurls für den Oberarmmuskel und die Unterarme."],
      [
        "Quer vor dem Körper oder gerade?",
        "Beides funktioniert. Quer vor dem Körper ist eine häufige Variante, die manche angenehmer finden.",
      ],
    ],
  },
  "cable-pushdown": {
    intro:
      "Beim Trizepsdrücken am Kabel drückst du eine Stange oder ein Seil vom oberen Kabelzug nach unten. Es isoliert den Trizeps, ist leicht zu lernen, schont die Ellbogen und lässt sich gut steigern.",
    mistakes: [
      ["Ellbogen bewegen sich", "Halt die Ellbogen an den Seiten fest; nur die Unterarme bewegen sich."],
      ["Über das Gewicht beugen", "Steh aufrecht mit leichter Vorlage, nicht gekrümmt."],
      ["Zu kurzer Weg", "Streck unten ganz durch und lass die Unterarme über die Waagerechte hochkommen."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 4 Sätze mit 10 bis 15."],
    variations: [
      ["rope-pushdown", "Mit dem Seil gehen die Hände unten auseinander."],
      ["cable-overhead-extension", "Über Kopf: der lange Kopf des Trizeps."],
      ["reverse-grip-pushdown", "Handflächen nach oben, ein anderes Gefühl."],
    ],
    faq: [
      ["Seil oder Stange?", "Mit der Stange schaffst du mehr; mit dem Seil gehen die Hände auseinander. Nimm, was du magst."],
      [
        "Brauche ich auch Trizepsübungen über Kopf?",
        "Eine Überkopfstreckung trainiert den langen Kopf des Trizeps in der Dehnung, was vielleicht mehr Muskeln aufbaut.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "Bei den French Press senkst du auf einer Bank liegend eine SZ-Stange zur Stirn und streckst dann die Arme. Sie trainieren alle drei Köpfe des Trizeps mit einer guten Dehnung.",
    mistakes: [
      ["Ellbogen gehen nach außen", "Lass sie zur Decke zeigen, etwa schulterbreit."],
      ["Zur Stirn absenken", "Senk Richtung Scheitel oder knapp dahinter ab, für mehr Dehnung und weniger Risiko."],
      ["Zu schwer", "Wähl ein Gewicht, das du bis ganz unten kontrollieren kannst."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 3 Sätze mit 8 bis 12."],
    variations: [
      ["db-skull-crusher", "Kurzhanteln, schonender für die Handgelenke."],
      ["incline-skull-crusher", "Auf einer Schrägbank für eine längere Dehnung."],
      ["jm-press", "Zwischen French Press und engem Bankdrücken."],
    ],
    faq: [
      [
        "Sind French Press schlecht für die Ellbogen?",
        "Manche Ellbogen mögen sie nicht. Nimm weniger Gewicht, probier Kurzhanteln oder wechsle zum Kabelzug, wenn es wehtut.",
      ],
      ["SZ-Stange oder gerade Stange?", "Die SZ-Stange schont die Handgelenke."],
    ],
  },
  "close-grip-bench": {
    intro:
      "Beim engen Bankdrücken liegen die Hände etwa schulterbreit. Es verlagert mehr Arbeit auf den Trizeps und erlaubt trotzdem schweres Gewicht.",
    mistakes: [
      ["Griff zu eng", "Etwa schulterbreit. Wenn sich die Hände berühren, leiden die Handgelenke."],
      ["Ellbogen gehen nach außen", "Halt sie eng an den Seiten."],
      ["Zu hoch aufsetzen", "Senk zur unteren Brust ab."],
    ],
    sets: ["**Kraft:** 3 bis 4 Sätze mit 5 bis 8.", "**Muskelaufbau:** 3 Sätze mit 8 bis 12."],
    variations: [
      ["bench-press", "Breiterer Griff, mehr Brust."],
      ["db-close-press", "Kurzhanteln, gegeneinander gedrückt."],
      ["diamond-push-up", "Die Variante mit Körpergewicht."],
    ],
    faq: [
      ["Ist das eine Brust- oder Trizepsübung?", "Beides, mit mehr Trizeps als beim normalen Bankdrücken."],
      ["Wie viel weniger als beim Bankdrücken?", "Meist etwa 10 bis 15 % weniger."],
    ],
  },
  "preacher-curl": {
    intro:
      "Beim Scottcurl liegen die Oberarme auf einem schrägen Polster und du beugst eine SZ-Stange. Das Polster verhindert Schwung und belastet den Bizeps unten in der Dehnung stark.",
    mistakes: [
      ["Nicht in die volle Dehnung gehen", "Senk kontrolliert ab, bis die Arme fast gestreckt sind."],
      ["Ellbogen vom Polster heben", "Lass die Oberarme flach auf dem Polster."],
      ["Unten reinfallen lassen", "Werd im letzten Teil des Absenkens langsamer, dort ist die Dehnung."],
    ],
    sets: ["**Muskelaufbau:** 2 bis 3 Sätze mit 8 bis 12."],
    variations: [
      ["db-preacher-curl", "Ein Arm nach dem anderen mit einer Kurzhantel."],
      ["machine-preacher-curl", "Eine feste Bahn, leicht hart zu fahren."],
      ["cable-preacher-curl", "Auch oben Spannung."],
    ],
    faq: [
      [
        "Ist der Scottcurl besser als der Curl im Stehen?",
        "Er ist sauberer und belastet die gedehnte Position stärker. Beide bauen den Bizeps auf.",
      ],
      [
        "Warum tut es unten weh?",
        "Nimm weniger Gewicht und werd langsamer. Hör vor dem vollen Durchstrecken auf, wenn sich die Ellbogen melden.",
      ],
    ],
  },
};
