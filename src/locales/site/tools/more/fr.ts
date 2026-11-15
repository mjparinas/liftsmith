import type { MoreTools } from "./types";

// TDEE, macros, Wilks et DOTS en français (vous). Mêmes parties que les pages anglaises (src/app/tools/).
export const FR_MORE: MoreTools = {
  "tdee-calculator": {
    page: {
      title: "Calculateur de TDEE : calories par jour pour maintenir, sécher ou prendre",
      description:
        "Calculez votre dépense énergétique quotidienne totale à partir de votre âge, sexe, taille, poids et activité : métabolisme de base, IMC, calories pour sécher ou prendre du muscle et une plage de protéines pour les pratiquants.",
      name: "Calculateur de TDEE",
      intro:
        "Combien de calories vous brûlez par jour, et quoi manger pour garder, perdre ou prendre du poids. Touchez + et − pour régler vos chiffres ; maintenez pour aller plus vite.",
      sticky: "Des calories qui suivent vos pesées",
      mid: {
        title: "À jour sans y penser",
        body: "Votre TDEE bouge avec votre poids et votre entraînement. {app} le recalcule seul à partir de vos pesées et des jours où vous vous entraînez vraiment, et montre son évolution.",
        button: "Ouvrir {app}",
      },
      end: {
        title: "Votre TDEE, toujours à jour",
        body: "{app} le recalcule à partir de vos pesées et des jours où vous vous entraînez, et planifie aussi vos séances.",
      },
      faq: [
        [
          "Qu’est-ce que le TDEE ?",
          "La dépense énergétique quotidienne totale : les calories brûlées en une journée, en comptant le métabolisme de repos (BMR), la digestion, les mouvements du quotidien et le sport. Mangez à peu près autant et votre poids reste stable.",
        ],
        [
          "Quelle formule est utilisée ?",
          "Mifflin-St Jeor pour la dépense au repos, la plus précise des équations courantes pour la plupart des gens. Avec un taux de masse grasse, elle passe à Katch-McArdle, qui part de la masse maigre et convient mieux aux personnes musclées. Le BMR est ensuite multiplié par un facteur d’activité de 1,2 (sédentaire) à 1,9 (athlète).",
        ],
        [
          "Combien de calories pour perdre ou prendre du poids ?",
          "Environ 500 sous le TDEE font perdre à peu près 0,5 kg par semaine. Pour une prise de masse propre, environ 250 au-dessus limitent la graisse pendant que vous construisez du muscle. Pesez-vous quelques fois par semaine et ajustez si la tendance ne suit pas.",
        ],
        [
          "Quelle est sa précision ?",
          "Toute formule est une estimation, souvent à 10 % près pour la plupart des gens. La balance a le dernier mot : si votre tendance sur deux ou trois semaines ne correspond pas, montez ou baissez de 100 à 200 calories.",
        ],
        [
          "{app} garde-t-il mon TDEE à jour ?",
          "Oui. Dans {app}, votre TDEE se recalcule quand votre poids, votre âge ou votre entraînement changent, lit poids, taille et masse grasse dans Health Connect ou Apple Health si vous l’autorisez, règle votre niveau d’activité d’après les jours où vous vous entraînez vraiment et montre son évolution.",
        ],
      ],
      reading: [
        { href: "/fr/tools/macro-calculator/", label: "le calculateur de macros" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "combien de protéines pour prendre du muscle" },
        { href: "/blog/body-recomposition/", label: "la recomposition corporelle" },
      ],
    },
    ui: {
      units: "Unités",
      metric: "Métrique",
      imperial: "Impérial",
      sex: "Sexe",
      female: "Femme",
      male: "Homme",
      age: "Âge",
      weightKg: "Poids (kg)",
      weightLb: "Poids (lb)",
      heightCm: "Taille (cm)",
      heightIn: "Taille (po)",
      fat: "Masse grasse (facultatif)",
      skip: "Passer",
      add: "Ajouter",
      fatPct: "Masse grasse (%)",
      activity: "Activité",
    },
  },
  "macro-calculator": {
    page: {
      title: "Calculateur de macros pour la musculation : protéines, lipides, glucides",
      description:
        "Calculez calories et macros pour perdre du gras, maintenir ou prendre du muscle selon votre âge, sexe, taille, poids et activité, avec des protéines pensées pour la musculation.",
      name: "Calculateur de macros",
      intro:
        "Les calories pour votre objectif à partir de votre TDEE, réparties en protéines, lipides et glucides pour quelqu’un qui fait de la musculation, avec la raison de chaque chiffre.",
      sticky: "Des macros qui suivent vos pesées",
      mid: {
        title: "Des macros qui suivent votre rythme",
        body: "Dans {app}, vos calories et vos macros suivent vos pesées et vos jours d’entraînement, et le coach vous prévient quand les protéines manquent.",
        button: "Commencer gratuitement",
      },
      end: {
        title: "Entraînez-vous pour l’objectif de votre assiette",
        body: "{app} planifie chaque séance selon votre récupération et votre bloc, pour qu’une sèche garde sa force et qu’une prise de masse devienne du muscle.",
      },
      faq: [
        [
          "Combien de protéines pour prendre du muscle ?",
          "La plupart des études sur les pratiquants donnent entre 1,6 et 2,2 g par kg de poids de corps et par jour. Ce calculateur prend 1,8 g pour maintenir ou prendre et 2,2 g en sèche, où plus de protéines aide à garder le muscle.",
        ],
        [
          "Comment sont fixés les lipides et les glucides ?",
          "Les lipides prennent un quart des calories, jamais moins de 0,6 g par kg, pour les hormones. Les glucides remplissent le reste, car ils alimentent les séries difficiles. Si vous préférez plus de lipides et moins de glucides, échangez-les en calories : 1 g de lipides fait 9 calories, 1 g de glucides 4.",
        ],
        [
          "Combien de calories pour perdre du gras ou prendre du muscle ?",
          "Environ 500 sous votre TDEE font perdre à peu près 0,5 kg par semaine, sans jamais passer sous votre métabolisme de base. Environ 250 au-dessus construisent du muscle avec peu de gras. Pesez-vous quelques fois par semaine et ajustez si la tendance ne suit pas.",
        ],
        [
          "Faut-il atteindre ses macros exactement ?",
          "Non. Atteignez vos protéines et restez proche de vos calories la plupart des jours ; la répartition entre lipides et glucides compte bien moins.",
        ],
      ],
      more: {
        heading: "Comment c’est calculé",
        paragraphs: [
          "Le TDEE vient de l’équation de Mifflin-St Jeor multipliée par un facteur d’activité, comme dans le calculateur de TDEE. Votre objectif fixe les calories : 500 de moins (jamais sous le métabolisme de base), autant, ou 250 de plus. Les protéines sont fixées d’abord par kilo de poids de corps, puis les lipides, et les glucides prennent le reste.",
        ],
      },
      reading: [
        { href: "/fr/tools/tdee-calculator/", label: "le calculateur de TDEE" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "combien de protéines pour prendre du muscle" },
        { href: "/blog/lean-bulk/", label: "la prise de masse propre" },
      ],
    },
    ui: {
      units: "Unités",
      metric: "Métrique",
      imperial: "Impérial",
      goal: "Objectif",
      cut: "Perdre du gras",
      maintain: "Maintenir",
      bulk: "Prendre du muscle",
      sex: "Sexe",
      female: "Femme",
      male: "Homme",
      age: "Âge",
      weightKg: "Poids (kg)",
      weightLb: "Poids (lb)",
      heightCm: "Taille (cm)",
      heightIn: "Taille (pouces)",
      activity: "Activité",
      kcalDay: "calories par jour",
      protein: "Protéines",
      fat: "Lipides",
      carbs: "Glucides",
      proteinCut: "{perKg} g par kg de poids de corps : le haut de la plage, pour garder le muscle pendant la perte de gras.",
      proteinMaintain: "{perKg} g par kg de poids de corps : le milieu de la plage utile en musculation.",
      proteinBulk: "{perKg} g par kg de poids de corps : assez pour construire du muscle, les calories en plus allant aux glucides.",
      fatWhy: "Un quart de vos calories, et jamais moins de 0,6 g par kg, pour les hormones.",
      carbsWhy: "Le reste de vos calories, pour alimenter les séries difficiles.",
      kcalFloor: "Votre métabolisme de base de {bmr} : un déficit plus grand passerait en dessous, ce qui coûte du muscle.",
      kcalCut: "500 sous votre TDEE de {tdee} : environ {pace} de moins par semaine.",
      kcalMaintain: "Votre TDEE : ce que vous brûlez un jour ordinaire.",
      kcalBulk: "250 au-dessus de votre TDEE de {tdee} : environ {pace} de plus par semaine, surtout du muscle.",
      meals: "Répartissez les protéines sur {meals} repas ; elles servent mieux par portions de 30 à 40 g.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Calculateur de Wilks, avec points IPF GL et DOTS",
      description:
        "Notez votre total de squat, développé couché et soulevé de terre selon votre poids de corps avec la formule de Wilks, les points IPF GL (classique ou équipé) et DOTS, en kg ou lb.",
      name: "Calculateur de Wilks",
      intro:
        "Votre total de force athlétique noté selon le poids de trois façons, Wilks, IPF GL et DOTS, pour comparer des pratiquants de tous gabarits et voir l’écart avec le niveau suivant.",
      sticky: "Votre score de force, toujours à jour",
      mid: {
        title: "Les trois scores, à chaque série enregistrée",
        body: "{app} estime vos meilleurs squat, développé couché et soulevé de terre d’après votre entraînement et garde Wilks, IPF GL et DOTS à jour, avec le mouvement le plus en retard.",
        button: "Commencer gratuitement",
      },
      end: {
        title: "Construisez un plus gros total",
        body: "{app} planifie chaque séance avec des répétitions en réserve, prévoit une décharge quand la fatigue s’accumule et fait progresser chaque mouvement quand vous l’avez mérité.",
      },
      faq: [
        [
          "Qu’est-ce que le score Wilks ?",
          "Un nombre qui compare les totaux de force athlétique entre poids de corps. Votre total est multiplié par un coefficient issu d’une formule publiée par Robert Wilks, pour classer ensemble un athlète léger et un lourd. Ce fut la référence pendant des décennies et beaucoup le citent encore.",
        ],
        [
          "Que sont les points IPF GL ?",
          "La formule de la Fédération internationale de force athlétique depuis 2020, parfois appelée points Goodlift. Elle a des versions séparées pour le classique (sans équipement) et l’équipé, et pour le développé couché seul. Environ 100 points, c’est un total de niveau mondial.",
        ],
        [
          "Quel score utiliser ?",
          "Celui de votre fédération si vous êtes en compétition. Pour suivre vos propres progrès, DOTS et IPF GL sont les formules les plus récentes, ajustées sur des résultats de compétition récents. Ne comparez un score qu’avec la même formule.",
        ],
        [
          "Qu’est-ce qu’un bon score Wilks ?",
          "En gros, environ 300 est un total intermédiaire solide, 400 avancé et 450 ou plus élite chez les hommes ; les scores des femmes sont sur la même échelle. Ce sont des repères, pas des niveaux officiels.",
        ],
      ],
      more: {
        heading: "Comment les scores sont calculés",
        paragraphs: [
          "Wilks divise 500 par un polynôme du cinquième degré du poids de corps en kilos, avec des coefficients différents pour les hommes et les femmes, et multiplie votre total par le résultat. IPF GL divise 100 par A − B·e^(−C·poids de corps), avec les A, B et C publiés par l’IPF pour chaque sexe, équipement et épreuve. DOTS utilise un polynôme du quatrième degré. Les livres sont d’abord converties en kilos. Les coefficients sont vérifiés avec un projet ouvert de résultats de force athlétique.",
        ],
      },
      reading: [
        { href: "/fr/tools/dots-calculator/", label: "le calculateur de DOTS" },
        { href: "/fr/tools/one-rep-max-calculator/", label: "le calculateur de 1RM" },
        { href: "/blog/how-to-increase-your-squat/", label: "comment progresser au squat" },
      ],
    },
    ui: {
      units: "Unités",
      formula: "Formule",
      men: "Formule hommes",
      women: "Formule femmes",
      gear: "Équipement",
      classic: "Classique (sans équipement)",
      equipped: "Équipé",
      bw: "Poids de corps ({unit})",
      squat: "Squat",
      bench: "Développé couché",
      deadlift: "Soulevé de terre",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      level: "Niveau DOTS : {level}.",
      next: "Ajoutez environ {weight} {unit} à votre total pour atteindre {level} (DOTS {score}).",
      elite: "C’est un total d’élite.",
      note: "Wilks et DOTS ne changent pas avec l’équipement. IPF GL a des formules séparées pour le classique et l’équipé : choisissez celle de votre pratique.",
      levels: { beginner: "Débutant", novice: "Novice", intermediate: "Intermédiaire", advanced: "Avancé", elite: "Élite" },
    },
  },
  "dots-calculator": {
    page: {
      title: "Calculateur de DOTS : notez votre total de force athlétique",
      description:
        "Calculez votre score DOTS à partir de votre squat, développé couché, soulevé de terre et poids de corps, en kg ou lb, pour comparer des pratiquants de tous gabarits.",
      name: "Calculateur de DOTS",
      intro:
        "Votre total de squat, développé couché et soulevé de terre noté selon le poids, pour qu’un athlète léger et un lourd voient qui est le plus fort pour son gabarit.",
      sticky: "Votre DOTS, toujours à jour",
      mid: {
        title: "Votre DOTS, à chaque série",
        body: "{app} estime vos meilleurs squat, développé couché et soulevé de terre d’après les séries enregistrées et garde votre DOTS à jour, sans journée de test de max.",
        button: "Commencer gratuitement",
      },
      end: {
        title: "Construisez un plus gros total",
        body: "{app} planifie votre entraînement par blocs avec des objectifs de répétitions en réserve et des décharges, et fait progresser chaque mouvement quand vous l’avez mérité.",
      },
      faq: [
        [
          "Qu’est-ce que le score DOTS ?",
          "Une façon de comparer les totaux de force athlétique entre poids de corps. Votre total est multiplié par un coefficient qui dépend de votre poids, pour classer sur la même échelle un athlète de 60 kg et un de 110 kg. Beaucoup de fédérations l’utilisent.",
        ],
        [
          "Qu’est-ce qu’un bon score DOTS ?",
          "En gros : 200 est un total novice, 300 intermédiaire, 400 avancé et 500 ou plus élite. Ce sont les niveaux couramment utilisés, pas une échelle officielle.",
        ],
        [
          "DOTS ou Wilks ?",
          "DOTS a été publié en 2019 pour remplacer plus équitablement l’ancienne formule de Wilks, avec un plus grand ensemble de résultats de compétition récents. Les scores ne sont pas interchangeables : comparez un DOTS avec un DOTS.",
        ],
        [
          "Puis-je utiliser des max estimés plutôt qu’un total de compétition ?",
          "Pour suivre vos propres progrès, oui. Les classements officiels utilisent des barres réussies en compétition, selon les règles de la fédération.",
        ],
      ],
      more: {
        heading: "Comment le DOTS est calculé",
        paragraphs: [
          "DOTS divise 500 par un polynôme du quatrième degré de votre poids de corps en kilos, avec des coefficients différents pour les hommes et les femmes, et multiplie votre total par le résultat. Le poids de corps est limité à 40-210 kg chez les hommes et 40-150 kg chez les femmes. Les coefficients sont ceux publiés, vérifiés avec un projet ouvert de résultats de force athlétique. Les livres sont d’abord converties en kilos.",
        ],
      },
      reading: [
        { href: "/fr/tools/one-rep-max-calculator/", label: "le calculateur de 1RM" },
        { href: "/blog/how-to-increase-your-squat/", label: "comment progresser au squat" },
        { href: "/blog/how-to-increase-your-deadlift/", label: "comment progresser au soulevé de terre" },
      ],
    },
    ui: {
      unitsSex: "Unités et sexe",
      men: "Formule hommes",
      women: "Formule femmes",
      bw: "Poids de corps ({unit})",
      squat: "Squat",
      bench: "Développé couché",
      deadlift: "Soulevé de terre",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      note: "Environ 200 est un total novice, 300 intermédiaire, 400 avancé et 500 ou plus élite. Ce sont des repères courants, pas une échelle officielle.",
      levels: { beginner: "Débutant", novice: "Novice", intermediate: "Intermédiaire", advanced: "Avancé", elite: "Élite" },
    },
  },
};
