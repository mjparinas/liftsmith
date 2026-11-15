// The words of the muscle pages ("best exercises for <muscle>", /muscles/<muscle>/ and /<lang>/muscles/<muscle>/;
// docs/decisions/public-pages-and-seo.md "Best exercises for each muscle"). Muscle, lift and equipment names come from
// the app's catalogues (fromApp.ts). Placeholders: {muscle} the muscle inside a sentence, {Muscle} at the start of one,
// {name} a lift, {others} other muscles, {n} a count, {app} the app's name.
import type { Setup } from "@/lib/bestFor";
import type { SiteLang } from "@/lib/siteLang";
import type { Muscle } from "@/lib/types";

export interface MuscleText {
  muscles: string;
  title: string;
  description: string;
  h1: string;
  about: Record<Muscle, string>;
  stillAlt: string;
  topTitle: string;
  topIntro: string;
  why: {
    staple: string;
    common: string;
    niche: string;
    main: string;
    shared: string;
    compound: string;
    isolation: string;
    guided: string;
  };
  setupTitle: string;
  setups: Record<Setup, string>;
  allTitle: string;
  compoundTitle: string;
  compoundBody: string;
  isoTitle: string;
  isoBody: string;
  byEquipment: string;
  noEquipment: string;
  setsTitle: string;
  setsBody: string;
  reading: string;
  readSets: string;
  readRir: string;
  englishLinks: string;
  sticky: string;
  mid: { title: string; body: string; button: string };
  end: { title: string; body: string };
  index: { title: string; description: string; h1: string; intro: string; count: string };
  /** Index page's call to action. */
  indexMid: { title: string; body: string; button: string };
  /** Index page's closing banner. */
  indexEnd: { title: string; body: string };
}

export const MUSCLE_TEXT: Record<SiteLang, MuscleText> = {
  en: {
    muscles: "Muscles",
    title: "The {n} best {muscle} exercises, ranked",
    description:
      "The best {muscle} exercises, ranked and explained: the top picks, the best one for no equipment, dumbbells, a barbell or machines, and how many sets a week.",
    h1: "The best {muscle} exercises",
    about: {
      chest: "Your chest (pectorals) pushes your arms forward and across your body. It drives every press and push-up.",
      frontDelts: "The front of the shoulder lifts your arm forward and overhead, and helps in every press.",
      sideDelts: "The side of the shoulder lifts your arm out to the side. It's what makes shoulders look broad.",
      rearDelts: "The back of the shoulder pulls your arm back. It balances all the pressing and keeps shoulders healthy.",
      biceps: "Your biceps bend the elbow and turn the palm up. They work in every pull and row too.",
      triceps: "Your triceps straighten the elbow. They're two thirds of your upper arm and finish every press.",
      forearms: "Your forearms run your grip. A stronger grip holds heavier pulls, carries and rows.",
      abs: "Your abs brace your trunk and curl your spine. A strong brace protects your back under a heavy bar.",
      obliques: "Your obliques twist and side-bend your trunk, and stop it from twisting when you don't want it to.",
      traps: "Your traps lift and steady the shoulder blades. They hold heavy deadlifts, carries and shrugs.",
      upperBack: "The upper back (rhomboids and mid traps) squeezes your shoulder blades together, for posture and big rows.",
      lats: "Your lats pull your arms down and back. They're the widest muscle of your back and power every pull-up.",
      lowerBack: "The muscles along your spine hold it straight when you hinge, squat or pick something heavy up.",
      glutes: "Your glutes extend the hip. They're the biggest muscle in the body, and drive squats, hinges and sprints.",
      quads: "Your quads straighten the knee. They do most of the work in squats, lunges, leg presses and stairs.",
      hamstrings: "Your hamstrings bend the knee and extend the hip. They power hinges and protect the knee.",
      adductors: "Your inner thighs pull your legs together and steady the hip in wide squats and lunges.",
      calves: "Your calves point the foot. They push you off the ground in every step, jump and sprint.",
    },
    stillAlt: "The {name}, with the muscles it works lit up",
    topTitle: "Top picks",
    topIntro:
      "Ranked by how many gyms have the kit and how many lifters know the lift, then by how squarely it aims at the {muscle}. The reasons are under each one.",
    why: {
      staple: "A staple most gyms can do",
      common: "A well-known variation",
      niche: "Less common, good for variety",
      main: "aims squarely at the {muscle}",
      shared: "works the {muscle} with the {others}",
      compound: "compound, several muscles at once",
      isolation: "isolation, easy to add without much fatigue",
      guided: "full guide with starting weights",
    },
    setupTitle: "The best one for your setup",
    setups: { none: "No equipment", dumbbells: "Dumbbells and a bench", barbell: "Barbell", machine: "Machines and cables" },
    allTitle: "Every {muscle} exercise ({n})",
    compoundTitle: "Compound lifts",
    compoundBody: "Several muscles at once. Do these first, while you're fresh.",
    isoTitle: "Isolation exercises",
    isoBody: "One muscle, one joint. Good for adding sets without much extra fatigue.",
    byEquipment: "By equipment:",
    noEquipment: "No equipment",
    setsTitle: "How much to train your {muscle}",
    setsBody:
      "About 8 to 12 hard sets a week to start, up to 12 to 20 as you get more experienced, split over two or more sessions, each set ending 1 to 3 reps short of failure.",
    reading: "More:",
    readSets: "how many sets per week",
    readRir: "reps in reserve",
    englishLinks: "",
    sticky: "Build your {muscle} with a plan",
    mid: {
      title: "How many {muscle} sets should you do this week?",
      body: "{app} counts them for you, plans the rest, and trains your {muscle} again only once they're ready.",
      button: "Plan my week",
    },
    end: {
      title: "A {muscle} plan that adapts to you",
      body: "{app} picks {muscle} exercises your gym can do, sets the weight for every set, and only trains them again once they've recovered.",
    },
    index: {
      title: "Exercises by muscle",
      description:
        "Find the best exercises for every muscle: chest, back, shoulders, arms, legs, glutes and core, ranked and explained, with form cues and 3D demos.",
      h1: "Exercises by muscle",
      intro: "Pick a muscle to see what it does and the best exercises for it, ranked, with the reason for each.",
      count: "{n} exercises",
    },
    indexMid: {
      title: "See which muscles are ready today",
      body: "{app}'s 3D recovery map shows how recovered each muscle is, and plans today's workout around the ones that are.",
      button: "See my recovery map",
    },
    indexEnd: {
      title: "Train every muscle, in the right amount",
      body: "{app} counts your weekly sets for each muscle and aims them at the right target for your experience, so nothing gets skipped or overdone.",
    },
  },
  es: {
    muscles: "Músculos",
    title: "Los {n} mejores ejercicios para {muscle}, en orden",
    description:
      "Los mejores ejercicios para {muscle}, en orden y explicados: los imprescindibles, el mejor sin material, con mancuernas, con barra o en máquinas, y cuántas series a la semana.",
    h1: "Los mejores ejercicios para {muscle}",
    about: {
      chest: "El pecho (pectorales) lleva los brazos hacia delante y cruzando el cuerpo. Mueve cada press y cada flexión.",
      frontDelts: "La parte delantera del hombro sube el brazo hacia delante y por encima de la cabeza, y ayuda en cada press.",
      sideDelts: "La parte lateral del hombro separa el brazo hacia el lado. Es lo que da hombros anchos.",
      rearDelts: "La parte trasera del hombro lleva el brazo hacia atrás. Equilibra todo el empuje y cuida los hombros.",
      biceps: "Los bíceps doblan el codo y giran la palma hacia arriba. También trabajan en cada tirón y remo.",
      triceps: "Los tríceps estiran el codo. Son dos tercios del brazo y terminan cada press.",
      forearms: "Los antebrazos mandan en el agarre. Un agarre más fuerte aguanta tirones, acarreos y remos más pesados.",
      abs: "Los abdominales fijan el tronco y flexionan la columna. Un buen bloqueo protege la espalda bajo una barra pesada.",
      obliques: "Los oblicuos giran e inclinan el tronco, y evitan que gire cuando no quieres.",
      traps: "Los trapecios suben y estabilizan los omóplatos. Sostienen pesos muertos, acarreos y encogimientos pesados.",
      upperBack: "La parte alta de la espalda (romboides y trapecio medio) junta los omóplatos, para la postura y los remos grandes.",
      lats: "Los dorsales llevan los brazos hacia abajo y atrás. Son el músculo más ancho de la espalda y mueven cada dominada.",
      lowerBack: "Los músculos a lo largo de la columna la mantienen recta al hacer bisagra, sentadilla o levantar algo pesado.",
      glutes: "Los glúteos extienden la cadera. Son el músculo más grande del cuerpo y mueven sentadillas, bisagras y sprints.",
      quads: "Los cuádriceps estiran la rodilla. Hacen casi todo el trabajo en sentadillas, zancadas, prensa y escaleras.",
      hamstrings: "Los isquiotibiales doblan la rodilla y extienden la cadera. Mueven las bisagras y protegen la rodilla.",
      adductors: "Los aductores juntan las piernas y estabilizan la cadera en sentadillas abiertas y zancadas.",
      calves: "Los gemelos estiran el pie. Te impulsan del suelo en cada paso, salto y sprint.",
    },
    stillAlt: "{name}, con los músculos que trabaja iluminados",
    topTitle: "Los imprescindibles",
    topIntro:
      "En orden según cuántos gimnasios tienen el material y cuánta gente conoce el ejercicio, y después según lo directamente que trabaja {muscle}. El porqué está debajo de cada uno.",
    why: {
      staple: "Un básico que se puede hacer en casi cualquier gimnasio",
      common: "Una variante muy conocida",
      niche: "Menos común, bueno para variar",
      main: "trabaja {muscle} de forma directa",
      shared: "trabaja {muscle} junto con {others}",
      compound: "compuesto, varios músculos a la vez",
      isolation: "aislamiento, fácil de añadir sin mucha fatiga",
      guided: "guía completa con pesos para empezar",
    },
    setupTitle: "El mejor según tu material",
    setups: { none: "Sin material", dumbbells: "Mancuernas y banco", barbell: "Barra", machine: "Máquinas y poleas" },
    allTitle: "Todos los ejercicios para {muscle} ({n})",
    compoundTitle: "Ejercicios compuestos",
    compoundBody: "Varios músculos a la vez. Hazlos primero, mientras estás fresco.",
    isoTitle: "Ejercicios de aislamiento",
    isoBody: "Un músculo, una articulación. Sirven para sumar series sin mucha fatiga extra.",
    byEquipment: "Por material:",
    noEquipment: "Sin material",
    setsTitle: "Cuánto entrenar {muscle}",
    setsBody:
      "Unas 8 a 12 series duras a la semana para empezar, hasta 12 a 20 con más experiencia, repartidas en dos o más sesiones, y cada serie a 1 a 3 repeticiones del fallo.",
    reading: "Más:",
    readSets: "cuántas series por semana",
    readRir: "repeticiones en reserva",
    englishLinks: "Los ejercicios y artículos enlazados están en inglés salvo las guías traducidas.",
    sticky: "Entrena {muscle} con un plan",
    mid: {
      title: "¿Cuántas series para {muscle} te tocan esta semana?",
      body: "{app} las cuenta por ti y planifica el resto, y solo vuelve a entrenar {muscle} tras recuperarse.",
      button: "Planifica mi semana",
    },
    end: {
      title: "Un plan para {muscle} que se adapta a ti",
      body: "{app} elige ejercicios para {muscle} que tu gimnasio permite, pone el peso de cada serie y no vuelve a entrenarlos hasta que se recuperan.",
    },
    index: {
      title: "Ejercicios por músculo",
      description:
        "Los mejores ejercicios para cada músculo: pecho, espalda, hombros, brazos, piernas, glúteos y core, en orden y explicados, con técnica y demos en 3D.",
      h1: "Ejercicios por músculo",
      intro: "Elige un músculo para ver qué hace y sus mejores ejercicios, en orden y con el porqué de cada uno.",
      count: "{n} ejercicios",
    },
    indexMid: {
      title: "Mira qué músculos están listos hoy",
      body: "El mapa de recuperación en 3D de {app} muestra cuánto se ha recuperado cada músculo y planifica el entrenamiento de hoy con los que están listos.",
      button: "Ver mi mapa",
    },
    indexEnd: {
      title: "Entrena cada músculo en su justa medida",
      body: "{app} cuenta tus series semanales de cada músculo y las ajusta a tu experiencia, para que nada se quede corto ni se pase.",
    },
  },
  fr: {
    muscles: "Muscles",
    title: "Les {n} meilleurs exercices pour {muscle}, classés",
    description:
      "Les meilleurs exercices pour {muscle}, classés et expliqués : les incontournables, le meilleur sans matériel, aux haltères, à la barre ou aux machines, et combien de séries par semaine.",
    h1: "Les meilleurs exercices pour {muscle}",
    about: {
      chest: "Les pectoraux poussent les bras vers l’avant et en travers du corps. Ils mènent chaque développé et chaque pompe.",
      frontDelts: "L’avant de l’épaule lève le bras devant et au-dessus de la tête, et aide dans chaque développé.",
      sideDelts: "Le côté de l’épaule écarte le bras sur le côté. C’est ce qui donne des épaules larges.",
      rearDelts: "L’arrière de l’épaule tire le bras vers l’arrière. Il équilibre toutes les poussées et garde les épaules en bonne santé.",
      biceps: "Les biceps plient le coude et tournent la paume vers le haut. Ils travaillent aussi dans chaque tirage.",
      triceps: "Les triceps tendent le coude. Ils font deux tiers du bras et finissent chaque développé.",
      forearms: "Les avant-bras font la prise. Une prise plus forte tient des tirages, portés et rowings plus lourds.",
      abs: "Les abdominaux gainent le tronc et enroulent la colonne. Un bon gainage protège le dos sous une barre lourde.",
      obliques: "Les obliques tournent et inclinent le tronc, et l’empêchent de tourner quand vous ne le voulez pas.",
      traps: "Les trapèzes montent et stabilisent les omoplates. Ils tiennent les soulevés de terre, portés et haussements lourds.",
      upperBack: "Le haut du dos (rhomboïdes et trapèzes moyens) serre les omoplates, pour la posture et les gros rowings.",
      lats: "Les dorsaux tirent les bras vers le bas et l’arrière. C’est le muscle le plus large du dos, moteur de chaque traction.",
      lowerBack: "Les muscles le long de la colonne la gardent droite en charnière, en squat ou en soulevant une charge lourde.",
      glutes: "Les fessiers étendent la hanche. Ce sont les plus gros muscles du corps, moteurs des squats, charnières et sprints.",
      quads: "Les quadriceps tendent le genou. Ils font l’essentiel du travail en squat, fente, presse et escaliers.",
      hamstrings: "Les ischio-jambiers plient le genou et étendent la hanche. Ils mènent les charnières et protègent le genou.",
      adductors: "Les adducteurs rapprochent les jambes et stabilisent la hanche en squat large et en fente.",
      calves: "Les mollets tendent le pied. Ils vous poussent du sol à chaque pas, saut et sprint.",
    },
    stillAlt: "{name}, avec les muscles travaillés en surbrillance",
    topTitle: "Les incontournables",
    topIntro:
      "Classés selon le nombre de salles qui ont le matériel et de pratiquants qui connaissent l’exercice, puis selon s’il vise directement {muscle}. Les raisons sont sous chacun.",
    why: {
      staple: "Un classique faisable dans presque toutes les salles",
      common: "Une variante bien connue",
      niche: "Moins courant, bien pour varier",
      main: "vise directement {muscle}",
      shared: "travaille {muscle} avec {others}",
      compound: "polyarticulaire, plusieurs muscles à la fois",
      isolation: "isolation, facile à ajouter sans trop de fatigue",
      guided: "guide complet avec charges de départ",
    },
    setupTitle: "Le meilleur selon votre matériel",
    setups: { none: "Sans matériel", dumbbells: "Haltères et banc", barbell: "Barre", machine: "Machines et poulies" },
    allTitle: "Tous les exercices pour {muscle} ({n})",
    compoundTitle: "Exercices polyarticulaires",
    compoundBody: "Plusieurs muscles à la fois. Faites-les d’abord, quand vous êtes frais.",
    isoTitle: "Exercices d’isolation",
    isoBody: "Un muscle, une articulation. Utiles pour ajouter des séries sans trop de fatigue.",
    byEquipment: "Par matériel :",
    noEquipment: "Sans matériel",
    setsTitle: "Combien entraîner {muscle}",
    setsBody:
      "Environ 8 à 12 séries difficiles par semaine pour commencer, jusqu’à 12 à 20 avec l’expérience, réparties sur deux séances ou plus, chaque série finie à 1 à 3 répétitions de l’échec.",
    reading: "Plus :",
    readSets: "combien de séries par semaine",
    readRir: "les répétitions en réserve",
    englishLinks: "Les exercices et articles liés sont en anglais, sauf les guides traduits.",
    sticky: "Entraînez {muscle} avec un plan",
    mid: {
      title: "Combien de séries pour {muscle} cette semaine ?",
      body: "{app} les compte pour vous et planifie la suite, et ne retravaille {muscle} qu’après récupération.",
      button: "Planifier ma semaine",
    },
    end: {
      title: "Un plan pour {muscle} qui s’adapte à vous",
      body: "{app} choisit des exercices pour {muscle} faisables dans votre salle, fixe la charge de chaque série et ne les retravaille qu’une fois récupérés.",
    },
    index: {
      title: "Exercices par muscle",
      description:
        "Les meilleurs exercices pour chaque muscle : pectoraux, dos, épaules, bras, jambes, fessiers et gainage, classés et expliqués, avec technique et démos 3D.",
      h1: "Exercices par muscle",
      intro: "Choisissez un muscle pour voir son rôle et ses meilleurs exercices, classés, avec la raison de chacun.",
      count: "{n} exercices",
    },
    indexMid: {
      title: "Voyez quels muscles sont prêts aujourd’hui",
      body: "La carte de récupération 3D de {app} montre où en est chaque muscle et planifie la séance du jour avec ceux qui sont prêts.",
      button: "Voir ma carte",
    },
    indexEnd: {
      title: "Entraînez chaque muscle, dans la bonne mesure",
      body: "{app} compte vos séries de la semaine pour chaque muscle et vise la bonne cible pour votre niveau, pour que rien ne soit oublié ni en trop.",
    },
  },
  de: {
    muscles: "Muskeln",
    title: "Die {n} besten Übungen für {muscle}, nach Rang",
    description:
      "Die besten Übungen für {muscle}, sortiert und erklärt: die Favoriten, die beste ohne Ausrüstung, mit Kurzhanteln, Langhantel oder an Maschinen, und wie viele Sätze pro Woche.",
    h1: "Die besten Übungen für {muscle}",
    about: {
      chest: "Die Brust führt die Arme nach vorn und quer vor den Körper. Sie treibt jedes Drücken und jeden Liegestütz an.",
      frontDelts: "Die vordere Schulter hebt den Arm nach vorn und über den Kopf und hilft bei jedem Drücken.",
      sideDelts: "Die seitliche Schulter hebt den Arm zur Seite. Sie macht die Schultern breit.",
      rearDelts: "Die hintere Schulter zieht den Arm nach hinten. Sie gleicht das viele Drücken aus und hält die Schultern gesund.",
      biceps: "Der Bizeps beugt den Ellbogen und dreht die Handfläche nach oben. Er arbeitet auch bei jedem Zug und Rudern.",
      triceps: "Der Trizeps streckt den Ellbogen. Er macht zwei Drittel des Oberarms aus und beendet jedes Drücken.",
      forearms: "Die Unterarme steuern den Griff. Ein stärkerer Griff hält schwereres Ziehen, Tragen und Rudern.",
      abs: "Der Bauch spannt den Rumpf an und rollt die Wirbelsäule ein. Gute Spannung schützt den Rücken unter einer schweren Stange.",
      obliques: "Die schrägen Bauchmuskeln drehen und neigen den Rumpf und halten ihn stabil, wenn er sich nicht drehen soll.",
      traps: "Der Trapezmuskel hebt und stabilisiert die Schulterblätter. Er hält schweres Kreuzheben, Tragen und Shrugs.",
      upperBack:
        "Der obere Rücken (Rautenmuskeln und mittlerer Trapez) zieht die Schulterblätter zusammen, für Haltung und schweres Rudern.",
      lats: "Der Latissimus zieht die Arme nach unten und hinten. Er ist der breiteste Rückenmuskel und treibt jeden Klimmzug an.",
      lowerBack: "Die Muskeln entlang der Wirbelsäule halten sie gerade, wenn du dich beugst, kniebeugst oder etwas Schweres hebst.",
      glutes: "Der Po streckt die Hüfte. Er ist der größte Muskel des Körpers und treibt Kniebeugen, Hüftbeugen und Sprints an.",
      quads:
        "Die Oberschenkelvorderseite streckt das Knie. Sie leistet die meiste Arbeit bei Kniebeugen, Ausfallschritten, Beinpresse und Treppen.",
      hamstrings: "Die Oberschenkelrückseite beugt das Knie und streckt die Hüfte. Sie treibt Hüftbeugen an und schützt das Knie.",
      adductors: "Die Adduktoren ziehen die Beine zusammen und stabilisieren die Hüfte bei breiten Kniebeugen und Ausfallschritten.",
      calves: "Die Waden strecken den Fuß. Sie drücken dich bei jedem Schritt, Sprung und Sprint vom Boden ab.",
    },
    stillAlt: "{name}, mit den trainierten Muskeln hervorgehoben",
    topTitle: "Die Favoriten",
    topIntro:
      "Sortiert danach, wie viele Studios die Ausrüstung haben und wie viele Leute die Übung kennen, dann danach, wie direkt sie {muscle} trifft. Die Gründe stehen unter jeder Übung.",
    why: {
      staple: "Ein Klassiker, den fast jedes Studio möglich macht",
      common: "Eine bekannte Variante",
      niche: "Seltener, gut für Abwechslung",
      main: "trifft {muscle} direkt",
      shared: "trainiert {muscle} und dazu {others}",
      compound: "mehrgelenkig, mehrere Muskeln auf einmal",
      isolation: "Isolation, leicht hinzuzufügen ohne viel Ermüdung",
      guided: "ganzer Guide mit Startgewichten",
    },
    setupTitle: "Die beste für deine Ausrüstung",
    setups: { none: "Ohne Ausrüstung", dumbbells: "Kurzhanteln und Bank", barbell: "Langhantel", machine: "Maschinen und Kabelzug" },
    allTitle: "Alle Übungen für {muscle} ({n})",
    compoundTitle: "Mehrgelenkige Übungen",
    compoundBody: "Mehrere Muskeln auf einmal. Mach sie zuerst, solange du frisch bist.",
    isoTitle: "Isolationsübungen",
    isoBody: "Ein Muskel, ein Gelenk. Gut, um Sätze ohne viel zusätzliche Ermüdung hinzuzufügen.",
    byEquipment: "Nach Ausrüstung:",
    noEquipment: "Ohne Ausrüstung",
    setsTitle: "Wie viel du {muscle} trainierst",
    setsBody:
      "Zu Beginn etwa 8 bis 12 harte Sätze pro Woche, mit mehr Erfahrung bis zu 12 bis 20, verteilt auf zwei oder mehr Einheiten, jeder Satz 1 bis 3 Wiederholungen vor dem Muskelversagen.",
    reading: "Mehr:",
    readSets: "wie viele Sätze pro Woche",
    readRir: "Wiederholungen in Reserve",
    englishLinks: "Verlinkte Übungen und Artikel sind auf Englisch, außer den übersetzten Guides.",
    sticky: "{Muscle} mit Plan trainieren",
    mid: {
      title: "Wie viele Sätze für {muscle} diese Woche?",
      body: "{app} zählt sie für dich und plant den Rest und trainiert {muscle} erst nach der Erholung wieder.",
      button: "Meine Woche planen",
    },
    end: {
      title: "Ein Plan für {muscle}, der sich anpasst",
      body: "{app} wählt Übungen für {muscle}, die dein Studio möglich macht, setzt das Gewicht für jeden Satz und trainiert sie erst wieder, wenn sie erholt sind.",
    },
    index: {
      title: "Übungen nach Muskel",
      description:
        "Die besten Übungen für jeden Muskel: Brust, Rücken, Schultern, Arme, Beine, Po und Rumpf, sortiert und erklärt, mit Technik und 3D-Demos.",
      h1: "Übungen nach Muskel",
      intro: "Wähle einen Muskel und sieh, was er macht und welche Übungen am besten sind, sortiert und mit Grund.",
      count: "{n} Übungen",
    },
    indexMid: {
      title: "Sieh, welche Muskeln heute bereit sind",
      body: "Die 3D-Erholungskarte von {app} zeigt, wie erholt jeder Muskel ist, und plant das heutige Workout um die bereiten herum.",
      button: "Meine Karte ansehen",
    },
    indexEnd: {
      title: "Jeden Muskel trainieren, im richtigen Maß",
      body: "{app} zählt deine Wochensätze für jeden Muskel und richtet sie nach deiner Erfahrung aus, damit nichts zu kurz kommt oder übertrieben wird.",
    },
  },
  it: {
    muscles: "Muscoli",
    title: "I {n} migliori esercizi per {muscle}, in classifica",
    description:
      "I migliori esercizi per {muscle}, in classifica e spiegati: i preferiti, il migliore senza attrezzi, con manubri, bilanciere o macchine, e quante serie a settimana.",
    h1: "I migliori esercizi per {muscle}",
    about: {
      chest: "Il petto (pettorali) porta le braccia avanti e davanti al corpo. Guida ogni distensione e ogni piegamento.",
      frontDelts: "La parte anteriore della spalla alza il braccio in avanti e sopra la testa, e aiuta in ogni spinta.",
      sideDelts: "La parte laterale della spalla apre il braccio di lato. È ciò che rende le spalle larghe.",
      rearDelts: "La parte posteriore della spalla porta il braccio indietro. Bilancia tutte le spinte e tiene sane le spalle.",
      biceps: "I bicipiti piegano il gomito e girano il palmo verso l’alto. Lavorano anche in ogni tirata e rematore.",
      triceps: "I tricipiti stendono il gomito. Sono due terzi del braccio e chiudono ogni spinta.",
      forearms: "Gli avambracci comandano la presa. Una presa più forte regge tirate, trasporti e rematori più pesanti.",
      abs: "Gli addominali bloccano il tronco e flettono la colonna. Un buon blocco protegge la schiena sotto un bilanciere pesante.",
      obliques: "Gli obliqui ruotano e piegano di lato il tronco, e gli impediscono di ruotare quando non vuoi.",
      traps: "I trapezi alzano e stabilizzano le scapole. Reggono stacchi, trasporti e scrollate pesanti.",
      upperBack: "La parte alta della schiena (romboidi e trapezio medio) avvicina le scapole, per la postura e i rematori pesanti.",
      lats: "I dorsali portano le braccia in basso e indietro. Sono il muscolo più largo della schiena e guidano ogni trazione.",
      lowerBack: "I muscoli lungo la colonna la tengono dritta quando fai una cerniera, uno squat o sollevi qualcosa di pesante.",
      glutes: "I glutei estendono l’anca. Sono il muscolo più grande del corpo e guidano squat, cerniere e scatti.",
      quads: "I quadricipiti stendono il ginocchio. Fanno quasi tutto il lavoro in squat, affondi, pressa e scale.",
      hamstrings: "I femorali piegano il ginocchio ed estendono l’anca. Guidano le cerniere e proteggono il ginocchio.",
      adductors: "Gli adduttori avvicinano le gambe e stabilizzano l’anca negli squat larghi e negli affondi.",
      calves: "I polpacci stendono il piede. Ti spingono da terra a ogni passo, salto e scatto.",
    },
    stillAlt: "{name}, con i muscoli allenati evidenziati",
    topTitle: "I preferiti",
    topIntro:
      "In classifica per quante palestre hanno l’attrezzatura e quante persone conoscono l’esercizio, poi per quanto colpisce in pieno {muscle}. I motivi sono sotto ognuno.",
    why: {
      staple: "Un classico che si fa in quasi ogni palestra",
      common: "Una variante molto nota",
      niche: "Meno comune, buono per variare",
      main: "colpisce in pieno {muscle}",
      shared: "allena {muscle} e anche {others}",
      compound: "multiarticolare, più muscoli insieme",
      isolation: "isolamento, facile da aggiungere senza molta fatica",
      guided: "guida completa con pesi di partenza",
    },
    setupTitle: "Il migliore per la tua attrezzatura",
    setups: { none: "Senza attrezzi", dumbbells: "Manubri e panca", barbell: "Bilanciere", machine: "Macchine e cavi" },
    allTitle: "Tutti gli esercizi per {muscle} ({n})",
    compoundTitle: "Esercizi multiarticolari",
    compoundBody: "Più muscoli insieme. Falli per primi, quando sei fresco.",
    isoTitle: "Esercizi di isolamento",
    isoBody: "Un muscolo, un’articolazione. Utili per aggiungere serie senza molta fatica in più.",
    byEquipment: "Per attrezzatura:",
    noEquipment: "Senza attrezzi",
    setsTitle: "Quanto allenare {muscle}",
    setsBody:
      "Circa 8-12 serie dure a settimana per iniziare, fino a 12-20 con più esperienza, divise in due o più sedute, ogni serie a 1-3 ripetizioni dal cedimento.",
    reading: "Altro:",
    readSets: "quante serie a settimana",
    readRir: "le ripetizioni in riserva",
    englishLinks: "Esercizi e articoli collegati sono in inglese, tranne le guide tradotte.",
    sticky: "Allena {muscle} con un piano",
    mid: {
      title: "Quante serie per {muscle} questa settimana?",
      body: "{app} le conta per te e pianifica il resto, e riallena {muscle} solo dopo il recupero.",
      button: "Pianifica la mia settimana",
    },
    end: {
      title: "Un piano per {muscle} che si adatta a te",
      body: "{app} sceglie esercizi per {muscle} che la tua palestra permette, imposta il peso di ogni serie e li riallena solo quando hanno recuperato.",
    },
    index: {
      title: "Esercizi per muscolo",
      description:
        "I migliori esercizi per ogni muscolo: petto, schiena, spalle, braccia, gambe, glutei e core, in classifica e spiegati, con tecnica e demo 3D.",
      h1: "Esercizi per muscolo",
      intro: "Scegli un muscolo per vedere cosa fa e i suoi esercizi migliori, in classifica e con il motivo di ognuno.",
      count: "{n} esercizi",
    },
    indexMid: {
      title: "Guarda quali muscoli sono pronti oggi",
      body: "La mappa di recupero 3D di {app} mostra quanto ha recuperato ogni muscolo e pianifica l’allenamento di oggi con quelli pronti.",
      button: "Vedi la mia mappa",
    },
    indexEnd: {
      title: "Allena ogni muscolo, nella giusta misura",
      body: "{app} conta le tue serie settimanali per ogni muscolo e le punta al giusto obiettivo per la tua esperienza, così niente resta indietro o si esagera.",
    },
  },
  ja: {
    muscles: "筋肉",
    title: "{muscle}のおすすめ種目ベスト{n}",
    description:
      "{muscle}を鍛えるおすすめ種目をランキングで解説。定番種目、器具なし・ダンベル・バーベル・マシン別のベスト、週に何セットやるかがわかります。",
    h1: "{muscle}のおすすめ種目",
    about: {
      chest: "胸（大胸筋）は腕を前へ、体の前を横切るように動かします。すべてのプレスと腕立て伏せを支えます。",
      frontDelts: "肩の前側は腕を前と頭上に上げ、すべてのプレスを助けます。",
      sideDelts: "肩の横側は腕を横に上げます。肩幅を広く見せる筋肉です。",
      rearDelts: "肩の後ろ側は腕を後ろへ引きます。押す動きとのバランスをとり、肩を健康に保ちます。",
      biceps: "上腕二頭筋はひじを曲げ、手のひらを上に返します。引く種目やローイングでも働きます。",
      triceps: "上腕三頭筋はひじを伸ばします。上腕の3分の2を占め、すべてのプレスの最後を押し切ります。",
      forearms: "前腕は握力を担います。握力が強いほど、重い引く種目、キャリー、ローイングを支えられます。",
      abs: "腹筋は体幹を固め、背骨を丸めます。しっかり固めることで、重いバーの下で腰を守ります。",
      obliques: "腹斜筋は体幹をひねったり横に倒したりし、ひねりたくないときには止めます。",
      traps: "僧帽筋は肩甲骨を持ち上げて安定させます。重いデッドリフト、キャリー、シュラッグを支えます。",
      upperBack: "背中上部（菱形筋と僧帽筋中部）は肩甲骨を寄せ、姿勢と重いローイングを支えます。",
      lats: "広背筋は腕を下と後ろへ引きます。背中でいちばん広い筋肉で、懸垂の主役です。",
      lowerBack: "背骨に沿った筋肉は、ヒンジやスクワット、重い物を持ち上げるときに背骨をまっすぐ保ちます。",
      glutes: "お尻（大殿筋）は股関節を伸ばします。体でいちばん大きな筋肉で、スクワット、ヒンジ、ダッシュを支えます。",
      quads: "大腿四頭筋はひざを伸ばします。スクワット、ランジ、レッグプレス、階段のほとんどの仕事をします。",
      hamstrings: "ハムストリングはひざを曲げ、股関節を伸ばします。ヒンジ種目を支え、ひざを守ります。",
      adductors: "内もも（内転筋）は脚を閉じ、ワイドスクワットやランジで股関節を安定させます。",
      calves: "ふくらはぎは足首を伸ばします。歩く、跳ぶ、走るたびに地面を押し出します。",
    },
    stillAlt: "{name}（鍛える筋肉を強調表示）",
    topTitle: "定番のおすすめ",
    topIntro: "器具があるジムの多さと種目の知名度、次に{muscle}をどれだけ直接鍛えるかで順位をつけています。理由はそれぞれの下にあります。",
    why: {
      staple: "ほとんどのジムでできる定番種目",
      common: "よく知られたバリエーション",
      niche: "あまり一般的でなく、変化をつけたいときに",
      main: "{muscle}を直接鍛える",
      shared: "{others}と一緒に{muscle}を鍛える",
      compound: "多関節種目で、一度に複数の筋肉を使う",
      isolation: "単関節種目で、疲れを増やさずに追加しやすい",
      guided: "始める重さ付きの詳しいガイドあり",
    },
    setupTitle: "器具別のベスト",
    setups: { none: "器具なし", dumbbells: "ダンベルとベンチ", barbell: "バーベル", machine: "マシンとケーブル" },
    allTitle: "{muscle}の種目一覧（{n}）",
    compoundTitle: "多関節種目",
    compoundBody: "一度に複数の筋肉を使います。疲れていない最初のうちに行いましょう。",
    isoTitle: "単関節種目",
    isoBody: "一つの筋肉と一つの関節。疲れをあまり増やさずにセットを足せます。",
    byEquipment: "器具別：",
    noEquipment: "器具なし",
    setsTitle: "{muscle}をどれくらい鍛えるか",
    setsBody:
      "始めは週に8〜12のきついセット、経験を積んだら12〜20まで。2回以上のトレーニングに分け、各セットは限界の1〜3レップ手前で終えます。",
    reading: "関連記事：",
    readSets: "週に何セットやるか",
    readRir: "余力レップ（RIR）",
    englishLinks: "翻訳済みのガイド以外、リンク先の種目と記事は英語です。",
    sticky: "プランで{muscle}を鍛える",
    mid: {
      title: "今週、{muscle}は何セット？",
      body: "{app}がセット数を数え、{muscle}が回復してから残りを組み立てます。",
      button: "今週のプランを作る",
    },
    end: {
      title: "あなたに合わせて変わる{muscle}のプラン",
      body: "{app}はジムでできる{muscle}の種目を選び、各セットの重さを決め、回復してから次に鍛えます。",
    },
    index: {
      title: "筋肉別のエクササイズ",
      description: "胸、背中、肩、腕、脚、お尻、体幹など、筋肉ごとのおすすめ種目をランキングで解説。フォームのポイントと3Dデモ付きです。",
      h1: "筋肉別のエクササイズ",
      intro: "筋肉を選ぶと、その働きとおすすめ種目が理由付きのランキングで見られます。",
      count: "{n}種目",
    },
    indexMid: {
      title: "今日鍛えられる筋肉をチェック",
      body: "{app}の3D回復マップは筋肉ごとの回復度を表示し、回復した筋肉で今日のワークアウトを組み立てます。",
      button: "回復マップを見る",
    },
    indexEnd: {
      title: "どの筋肉も、ちょうどいい量で",
      body: "{app}は筋肉ごとの週のセット数を数え、経験に合った目標に合わせるので、やり残しもやりすぎもありません。",
    },
  },
};

/** Each muscle inside a sentence, with its article where the language needs one (German in the accusative, since
 * every German line uses it after "für" or as an object). {muscle} and {others} use these; English and Japanese use
 * the app's own label. */
export const MUSCLE_THE: Partial<Record<SiteLang, Record<Muscle, string>>> = {
  es: {
    chest: "el pecho",
    frontDelts: "el deltoides anterior",
    sideDelts: "el deltoides lateral",
    rearDelts: "el deltoides posterior",
    biceps: "los bíceps",
    triceps: "los tríceps",
    forearms: "los antebrazos",
    abs: "los abdominales",
    obliques: "los oblicuos",
    traps: "los trapecios",
    upperBack: "la espalda alta",
    lats: "los dorsales",
    lowerBack: "la zona lumbar",
    glutes: "los glúteos",
    quads: "los cuádriceps",
    hamstrings: "los isquiotibiales",
    adductors: "los aductores",
    calves: "los gemelos",
  },
  fr: {
    chest: "les pectoraux",
    frontDelts: "les deltoïdes antérieurs",
    sideDelts: "les deltoïdes latéraux",
    rearDelts: "les deltoïdes postérieurs",
    biceps: "les biceps",
    triceps: "les triceps",
    forearms: "les avant-bras",
    abs: "les abdominaux",
    obliques: "les obliques",
    traps: "les trapèzes",
    upperBack: "le haut du dos",
    lats: "les dorsaux",
    lowerBack: "le bas du dos",
    glutes: "les fessiers",
    quads: "les quadriceps",
    hamstrings: "les ischio-jambiers",
    adductors: "les adducteurs",
    calves: "les mollets",
  },
  de: {
    chest: "die Brust",
    frontDelts: "die vordere Schulter",
    sideDelts: "die seitliche Schulter",
    rearDelts: "die hintere Schulter",
    biceps: "den Bizeps",
    triceps: "den Trizeps",
    forearms: "die Unterarme",
    abs: "den Bauch",
    obliques: "die seitlichen Bauchmuskeln",
    traps: "den Trapez",
    upperBack: "den oberen Rücken",
    lats: "den Latissimus",
    lowerBack: "den unteren Rücken",
    glutes: "das Gesäß",
    quads: "den Quadrizeps",
    hamstrings: "die Beinbeuger",
    adductors: "die Adduktoren",
    calves: "die Waden",
  },
  it: {
    chest: "il petto",
    frontDelts: "i deltoidi anteriori",
    sideDelts: "i deltoidi laterali",
    rearDelts: "i deltoidi posteriori",
    biceps: "i bicipiti",
    triceps: "i tricipiti",
    forearms: "gli avambracci",
    abs: "gli addominali",
    obliques: "gli obliqui",
    traps: "i trapezi",
    upperBack: "la parte alta della schiena",
    lats: "i dorsali",
    lowerBack: "la zona lombare",
    glutes: "i glutei",
    quads: "i quadricipiti",
    hamstrings: "i femorali",
    adductors: "gli adduttori",
    calves: "i polpacci",
  },
};
