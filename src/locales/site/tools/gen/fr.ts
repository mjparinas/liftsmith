import type { GenUi, ToolPageText } from "../types";

// Le générateur d’entraînements en français (vous). Mêmes parties que la page anglaise (./en.ts).
export const GEN_FR: { page: ToolPageText; ui: GenUi } = {
  page: {
    title: "Générateur d’entraînement : une séance gratuite pour votre matériel et votre temps",
    description:
      "Choisissez votre matériel, le temps dont vous disposez et ce que vous voulez travailler, et obtenez une séance gratuite avec séries, répétitions, repos et une courte raison pour chaque exercice. Sans inscription, et chaque séance a son propre lien.",
    name: "Générateur d’entraînement",
    intro:
      "Dites-lui ce que vous avez et combien de temps, et il écrit la séance : des exercices adaptés à votre matériel, les gros d’abord, avec séries, répétitions, repos et la raison de chacun.",
    sticky: "Une nouvelle séance chaque jour, faite pour vous",
    mid: {
      title: "La séance de demain suit celle d’aujourd’hui",
      body: "Ici, chaque séance repart de zéro. {app} retient ce que vous avez soulevé, les muscles encore en récupération et le nombre de séries de chacun cette semaine : chaque séance suit la précédente et les charges montent quand vous êtes prêt.",
      button: "Planifier mes séances",
    },
    end: {
      title: "Arrivez en sachant quoi faire",
      body: "{app} écrit une séance comme celle-ci chaque jour selon votre salle, votre récupération et votre bloc d’entraînement, puis vous laisse soulever.",
    },
    faq: [
      [
        "Comment fonctionne le générateur d’entraînement ?",
        "Il utilise le même moteur que celui qui planifie les séances dans l’application {app}. Il ne garde que les exercices permis par votre matériel, les oriente vers ce que vous avez choisi, place les gros exercices polyarticulaires en premier quand vous êtes frais et fait tenir les séries, les repos et les séries d’échauffement dans vos minutes.",
      ],
      [
        "C’est gratuit ? Faut-il un compte ?",
        "C’est gratuit, sans inscription. Vos choix (matériel, minutes, zone, objectif et expérience) sont envoyés pour créer la séance et rien n’est conservé. Ils sont tous dans le lien : le même lien donne toujours la même séance.",
      ],
      [
        "Quelle charge choisir ?",
        "Chaque exercice indique combien de répétitions garder en réserve. Prenez une charge avec laquelle vous pourriez en faire encore autant à la fin de la série, avec une bonne technique. Si la dernière était facile, montez un peu à la série suivante. L’application apprend vos vrais chiffres dès votre première séance et planifie ensuite chaque charge.",
      ],
      [
        "Que veulent dire les répétitions en réserve ?",
        "Le nombre de bonnes répétitions que vous auriez encore pu faire en vous arrêtant. Un nouveau bloc commence à quelques répétitions de l’échec, pour apprendre les mouvements et bien récupérer, puis s’en rapproche au fil des semaines.",
      ],
      [
        "Pourquoi ma séance est-elle plus courte que le temps choisi ?",
        "Avec peu de matériel et une petite zone, seuls quelques exercices valent la peine. Plutôt que de remplir, le générateur vous le dit. Ajoutez du matériel, choisissez une zone plus large ou faites un deuxième tour.",
      ],
      [
        "Puis-je garder la séance ou la suivre dans l’application ?",
        "Oui. Partager cette séance copie son lien. Commencer dans l’application l’ouvre dans {app} comme routine : vos propres charges se remplissent au fil des séries, le minuteur de repos démarre seul et chaque série est enregistrée.",
      ],
    ],
    more: {
      heading: "Comment la séance est construite",
      paragraphs: [
        "Le générateur part de tous les exercices de la bibliothèque {app} que votre matériel permet. Si vous avez choisi une zone, seuls restent les exercices dont tous les muscles principaux en font partie. Les gros muscles choisissent en premier, et le premier choix de chacun est un exercice polyarticulaire qui travaille plusieurs muscles à la fois ; les exercices plus petits suivent dans un deuxième tour tant qu’il reste du temps.",
        "Les séries et répétitions suivent votre objectif. Pour le muscle, les polyarticulaires vont de 6 à 10 répétitions et les petits exercices de 10 à 15 ; pour la force, moins de répétitions et des repos plus longs ; pour la forme, entre les deux. Les gainages et les portés se comptent en secondes. Les exercices principaux ont des séries d’échauffement, et le temps restant ajoute une série aux premiers exercices.",
        "Associer les exercices en supersets fait comme les supersets automatiques de l’application : deux exercices pour des muscles différents, enchaînés, pour que chaque muscle se repose pendant que l’autre travaille et qu’il en tienne plus dans le même temps.",
      ],
    },
    reading: [
      { href: "/blog/how-to-build-a-workout-routine/", label: "comment construire une routine" },
      { href: "/blog/how-long-to-rest-between-sets/", label: "combien de repos entre les séries" },
      { href: "/fr/tools/warm-up-calculator/", label: "le calculateur d’échauffement" },
    ],
  },
  ui: {
    equipment: "Matériel",
    kits: { commercial: "Salle complète", home: "Salle à la maison", dumbbells: "Haltères seulement", bodyweight: "Sans matériel" },
    custom: "Choisir le matériel",
    customHint: "Touchez ce que vous avez. La séance n’utilise que cela.",
    minutes: "Temps",
    minutesValue: "{n} min",
    focus: "Quoi travailler",
    goal: "Objectif",
    goals: { muscle: "Prendre du muscle", strength: "Gagner en force", general: "Rester en forme" },
    level: "Expérience",
    levels: { new: "Je débute", intermediate: "Un peu d’expérience", advanced: "Expérimenté" },
    pairs: "Associer les exercices en supersets",
    pairsHint: "Deux exercices pour des muscles différents enchaînés, avec moins de repos, pour en faire plus.",
    make: "Créer ma séance",
    another: "Une autre séance",
    working: "Rédaction de votre séance…",
    error: "La séance n’a pas pu être créée pour l’instant. Vérifiez votre connexion et réessayez.",
    nothing: "Rien ne correspond à ce matériel et à cette zone. Ajoutez du matériel ou choisissez une autre zone.",
    about: "Environ {n} min",
    short:
      "Environ {n} minutes, c’est tout ce que ce matériel permet pour cette zone. Ajoutez du matériel ou choisissez une zone plus large.",
    order: "Les gros exercices d’abord quand vous êtes frais, les petits ensuite. Chaque exercice dit pourquoi il est là.",
    setsReps: "{sets} × {reps}",
    setsSecs: "{sets} × {secs} s",
    rest: "Repos {time}",
    tank: "Répétitions en réserve : {n}",
    holdForm: "Arrêtez quand la technique lâche",
    warmups: "D’abord, séries d’échauffement : {n}",
    superset: "Superset {letter}",
    whyFirst: "{muscle} : un polyarticulaire en premier, quand vous êtes frais",
    whyCompound: "{muscle} : un polyarticulaire qui travaille plusieurs muscles à la fois",
    whyIsolation: "{muscle} : un petit exercice pour finir le muscle",
    whyBodyweight: "{muscle} : un polyarticulaire au poids du corps, sans charge",
    whyHold: "{muscle} : un maintien ou un porté, en secondes",
    repsMuscle: "{lo} à {hi} répétitions pour le muscle : commencez à {reps} et ajoutez-en quand ça devient facile",
    repsStrength: "Des séries plus lourdes de {lo} à {hi} répétitions pour la force",
    repsGeneral: "{lo} à {hi} répétitions, le juste milieu pour la forme",
    repsBodyweight: "{lo} à {hi} répétitions : commencez à {reps} et ajoutez des répétitions avant tout",
    repsHold: "{lo} à {hi} secondes : commencez à {reps} et tenez un peu plus à chaque fois",
    mainSets: "{sets} séries pour un exercice principal, avec le temps de les faire",
    moreSets: "{sets} séries, avec le temps dont vous disposez",
    pair: "Enchaîné avec {other} : des muscles différents, donc un repos plus court",
    share: "Partager cette séance",
    copied: "Lien copié",
    start: "Commencer dans l’application",
    startHint: "S’ouvre dans {app} comme routine. Vos propres charges se remplissent au fil des séries.",
    example: "Un exemple pour commencer. Modifiez n’importe quel choix ci-dessus.",
    see: "Voir votre séance",
  },
};
