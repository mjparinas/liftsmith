import type { LocalTools } from "./types";

// Les calculateurs en français (vous). Mêmes parties que les pages anglaises (src/app/tools/).
export const FR_TOOLS: LocalTools = {
  frame: {
    tools: "Outils",
    questions: "Questions",
    more: "Pour aller plus loin :",
    and: " et ",
    englishLinks: "Les guides et articles en lien sont en anglais.",
  },
  "plate-calculator": {
    page: {
      title: "Calculateur de disques : quels disques mettre de chaque côté de la barre",
      description:
        "Entrez une charge et voyez exactement quels disques mettre de chaque côté de la barre, en kg ou en lb, avec les disques que vous avez. Si elle est impossible, il trouve la charge la plus proche.",
      name: "Calculateur de disques",
      intro:
        "Quels disques mettre de chaque côté de la barre pour n’importe quelle charge. Touchez + et − pour la régler ; désactivez les disques que vous n’avez pas.",
      sticky: "Les disques dessinés à chaque série",
      mid: {
        title: "Fini le calcul des disques entre les séries",
        body: "{app} dessine les disques de chaque série et vous montre quoi changer pour la suivante pendant votre repos.",
        button: "Essayer gratuitement",
      },
      end: {
        title: "Chaque série chargée pour vous",
        body: "Dites une fois à {app} quels disques a votre salle. Chaque charge prévue est une charge que vous pouvez vraiment mettre, avec les disques de chaque côté.",
      },
      faq: [
        [
          "Comment calculer les disques par côté ?",
          "Prenez la charge voulue, retirez la barre (20 kg ou 45 lb pour une barre olympique standard) et divisez par deux. C’est ce qui va de chaque côté. Mettez d’abord les disques les plus lourds.",
        ],
        [
          "Et si mes disques ne permettent pas cette charge ?",
          "Le calculateur trouve les charges possibles les plus proches, au-dessus et en dessous. Prenez la plus légère : c’est l’erreur la plus sûre.",
        ],
        [
          "Combien pèse la barre ?",
          "Une barre olympique standard pèse 20 kg ou 45 lb. Les barres femme, 15 kg ou 35 lb. Les barres EZ, hexagonales et les Smith machines varient, vérifiez la vôtre.",
        ],
        [
          "{app} le fait-il pour moi ?",
          "Oui. {app} ne propose que des charges réalisables avec les disques de votre salle, dessine les disques de chaque série et vous montre quoi changer entre les séries pendant votre repos.",
        ],
      ],
      reading: [{ href: "/blog/how-to-load-a-barbell/", label: "comment charger une barre" }],
    },
    ui: {
      units: "Unités",
      weight: "Charge sur la barre ({unit})",
      weightAria: "charge",
      bar: "Barre",
      plates: "Disques disponibles",
      loadThis: "Chargez ceci",
      cantMake: "Impossible de faire {want} avec ces disques. Le plus proche :",
      eachSide: "De chaque côté : {plates}",
      justBar: "rien, juste la barre",
      closestOne: "Le plus proche possible : {below}. Mieux vaut viser un peu plus léger.",
      closestTwo: "Le plus proche possible : {below} ou {above}. Mieux vaut viser un peu plus léger.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "Calculateur de 1RM : estimez votre maximum sur une répétition avec n’importe quelle série",
      description:
        "Estimez votre maximum sur une répétition à partir de la charge, des répétitions et des répétitions en réserve, avec un tableau charge par répétitions et le résultat d’Epley, de Brzycki et de six autres formules.",
      name: "Calculateur de 1RM",
      intro:
        "Votre maximum estimé à partir de n’importe quelle série, sans avoir à le tester. Touchez + et − pour saisir une série ; maintenez un bouton pour aller plus vite.",
      sticky: "Votre maximum, suivi à chaque série",
      mid: {
        title: "Voyez votre maximum monter, série après série",
        body: "{app} met à jour votre estimation à chaque série enregistrée et montre la tendance de chaque exercice.",
        button: "Commencer gratuitement",
      },
      end: {
        title: "Gagnez en force sans deviner",
        body: "{app} transforme votre maximum en la bonne charge pour chaque série, et l’augmente quand vous l’avez mérité.",
      },
      faq: [
        [
          "Comment le maximum sur une répétition est-il estimé ?",
          "À partir de la charge et des répétitions que vous auriez pu faire jusqu’à l’échec (vos répétitions plus celles qui vous restaient). Jusqu’à 10 répétitions à l’échec, il fait la moyenne de Brzycki, d’Epley et d’une équation de 2026 qui dépend de la charge ; au-delà de 10, il utilise Mayhew, Wathan et cette même équation, plus fiables avec plus de répétitions.",
        ],
        [
          "Pourquoi compter les répétitions qui me restaient ?",
          "Les formules supposent que vous êtes allé jusqu’à l’échec. Une série de 5 avec 2 en réserve correspond en réalité à un effort de 7, donc l’ignorer donne une estimation trop basse.",
        ],
        [
          "Quelle est sa précision ?",
          "Elle est meilleure avec des séries difficiles de 2 à 6 répétitions, reste utile jusqu’à environ 10 et devient approximative au-delà de 15. Voyez-la comme une fourchette et suivez la tendance dans le temps.",
        ],
        [
          "{app} le suit-il pour moi ?",
          "Oui. Chaque série enregistrée met à jour l’estimation de cet exercice, en donnant plus de poids aux séries récentes et proches de l’échec, et la trace dans le temps.",
        ],
      ],
      reading: [
        { href: "/blog/how-to-estimate-your-one-rep-max/", label: "estimer votre maximum sur une répétition" },
        { href: "/guides/reps-in-reserve/", label: "les répétitions en réserve" },
      ],
    },
    ui: {
      units: "Unités",
      weight: "Charge soulevée ({unit})",
      weightAria: "charge",
      reps: "Répétitions",
      repsAria: "répétitions",
      left: "Répétitions qu’il vous restait",
      failure: "0 (échec)",
      leftNote: "Compter les répétitions qu’il vous restait rend l’estimation bien plus précise.",
      rough: "Au-delà de 10 répétitions à l’échec, les estimations sont plus approximatives.",
      estimate: "Maximum estimé sur une répétition",
      tableCaption: "Charge pour chaque nombre de répétitions à l’échec",
      colReps: "Rép.",
      colWeight: "Charge",
      colPct: "% du max",
      formulas: "Ce que donne chaque formule",
      formulasNote: "L’estimation ci-dessus fait la moyenne des formules adaptées à {n} répétitions à l’échec (marquées ✓).",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Calculateur d’échauffement : les séries d’échauffement pour n’importe quelle charge de travail",
      description:
        "Entrez votre charge de travail et obtenez les séries d’échauffement pour le squat, le développé couché, le soulevé de terre, le développé militaire ou le rowing, avec les disques de chaque côté.",
      name: "Calculateur d’échauffement",
      intro:
        "Les séries d’échauffement à faire avant votre charge de travail : assez pour être prêt, pas au point de vous fatiguer. Choisissez un exercice et entrez la charge.",
      sticky: "Les échauffements prévus pour chaque exercice",
      mid: {
        title: "Ne calculez plus jamais un échauffement",
        body: "{app} ajoute les séries d’échauffement à chaque séance, avec les disques dessinés, et les saute quand le muscle est déjà chaud.",
        button: "Planifier ma séance",
      },
      end: {
        title: "Arrivez, échauffez-vous, soulevez",
        body: "{app} planifie les échauffements, les séries de travail et le repos entre elles, il ne vous reste qu’à soulever.",
      },
      faq: [
        [
          "Combien de séries d’échauffement faire ?",
          "Après la barre à vide : une série plus légère si votre charge de travail est inférieure à environ 50 kg (110 lb), deux séries de montée à partir de 50 kg et trois à partir de 100 kg (220 lb), la dernière en une seule répétition à environ 85 %.",
        ],
        [
          "Combien de répétitions par série d’échauffement ?",
          "De moins en moins à mesure que la charge monte : environ 5 à la moitié de votre charge de travail, 2 ou 3 entre 70 et 80 %, et une seule vers 85 %. Le but est de répéter le mouvement et de vous habituer à la charge, pas de vous fatiguer.",
        ],
        [
          "Combien de repos entre les séries d’échauffement ?",
          "Environ {rest} secondes suffisent pour les plus légères. Prenez votre repos habituel avant la première série de travail.",
        ],
        [
          "Faut-il s’échauffer pour chaque exercice ?",
          "Non. Le premier exercice lourd d’un muscle demande une montée. Un exercice suivant pour les mêmes muscles demande au plus une série d’essai, et le travail d’assistance léger n’en demande généralement aucune.",
        ],
      ],
      more: {
        heading: "Comment l’échauffement est calculé",
        paragraphs: [
          "Il commence par la barre à vide pour 10 répétitions faciles (sauf si votre charge de travail dépasse à peine la barre), puis monte en quelques paliers vers votre charge de travail. Chaque palier est une charge que vos disques permettent vraiment, plus lourde que la précédente et plus légère que votre charge de travail. Plus l’exercice est lourd, plus il y a de paliers, et moins il y a de répétitions dans chacun, pour vous préparer sans entamer vos séries de travail.",
          "C’est la même montée que celle de l’application {app}. Dans l’application, elle sait aussi quels muscles sont déjà chauds plus tôt dans la séance, si bien qu’un deuxième exercice de poussée n’a droit qu’à une série d’essai au lieu d’une montée complète.",
        ],
      },
      reading: [
        { href: "/blog/how-to-warm-up-for-lifting/", label: "comment s’échauffer pour la musculation" },
        { href: "/fr/tools/plate-calculator/", label: "le calculateur de disques" },
        { href: "/blog/dynamic-vs-static-stretching/", label: "étirements dynamiques ou statiques" },
      ],
    },
    ui: {
      units: "Unités",
      lift: "Exercice",
      lifts: {
        "back-squat": "Squat",
        "bench-press": "Développé couché",
        deadlift: "Soulevé de terre",
        "overhead-press": "Développé militaire",
        "barbell-row": "Rowing barre",
      },
      work: "Charge de travail ({unit})",
      workAria: "charge de travail",
      setsOne: "{n} série d’échauffement, {rest} s de repos après",
      setsMany: "{n} séries d’échauffement, {rest} s de repos après chacune",
      none: "Aucune série d’échauffement nécessaire à cette charge",
      working: "{weight} : vos séries de travail",
      eachSide: "De chaque côté : {plates}",
      empty: "Barre à vide",
    },
  },
};
