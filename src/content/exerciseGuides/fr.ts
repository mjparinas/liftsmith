import type { ExerciseGuide } from "../exerciseGuides";

// Les guides d’exercices en français (vous). Même ordre et mêmes parties que les guides anglais (lower.ts, upper.ts).
export const FR_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "Le squat arrière est le grand mouvement de force du bas du corps. Il sollicite fortement les quadriceps, les fessiers et les adducteurs, permet de charger lourd et de progresser pendant des années, et renforce le tronc au passage.",
    mistakes: [
      [
        "Genoux qui rentrent à la montée",
        "Poussez les genoux vers l’extérieur, au-dessus des pieds, pendant toute la répétition, et allégez la barre tant que vous n’y arrivez pas.",
      ],
      [
        "Descendre moins à mesure que la charge monte",
        "Gardez la même profondeur à chaque répétition, au moins le pli de la hanche au niveau du genou si vos hanches le permettent.",
      ],
      [
        "Perdre le gainage en bas",
        "Prenez une grande inspiration dans le ventre avant chaque répétition et gardez-la jusqu’à passer le plus dur.",
      ],
      [
        "Talons qui décollent",
        "Gardez le poids au milieu du pied. Des chaussures à talon surélevé ou une position un peu plus large aident.",
      ],
    ],
    sets: [
      "**Force :** 3 à 5 séries de 3 à 6, avec 3 à 5 minutes de repos.",
      "**Muscle :** 3 à 4 séries de 6 à 10, avec 2 à 3 minutes de repos.",
      "**Si vous débutez :** 3 séries de 8 avec une charge que vous pourriez soulever 10 à 12 fois, en ajoutant un peu à chaque séance.",
    ],
    variations: [
      ["front-squat", "Plus droit, plus de quadriceps, plus doux pour le bas du dos."],
      ["box-squat", "Apprend à s’asseoir en arrière et à garder la même profondeur."],
      ["pause-squat", "Renforce la sortie du bas, là où presque tout le monde bloque."],
      ["goblet-squat", "La meilleure façon d’apprendre le mouvement avant de charger une barre."],
    ],
    faq: [
      [
        "Jusqu’où descendre ?",
        "Aussi bas que possible en gardant la position du dos et les talons au sol. Pour la plupart, à la parallèle ou juste en dessous.",
      ],
      [
        "Barre haute ou barre basse ?",
        "La barre haute repose sur le haut des épaules et vous garde plus droit ; la barre basse se place plus bas et permet de soulever un peu plus. Les deux fonctionnent.",
      ],
      [
        "Faut-il une ceinture ?",
        "Pas pour commencer. Apprenez d’abord à vous gainer sans ; une ceinture peut aider plus tard sur les séries lourdes. Voir [lifting belt](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "Le squat avant porte la barre devant les épaules, ce qui garde le buste droit et met davantage les quadriceps au travail. Il ménage plus le bas du dos que le squat arrière et enseigne très bien la bonne posture.",
    mistakes: [
      [
        "Coudes qui tombent",
        "Montez les coudes vers l’avant pendant toute la répétition. Si la barre roule, ce sont les coudes qui ont baissé d’abord.",
      ],
      [
        "Tenir la barre avec les mains",
        "La barre repose sur les épaules ; les doigts la maintiennent seulement en place. Prenez une prise croisée ou des sangles si vos poignets manquent de souplesse.",
      ],
      ["Arrondir le haut du dos", "Poitrine haute et gainage fort. Mieux vaut plus léger poitrine haute que plus lourd en se pliant."],
    ],
    sets: ["**Force :** 3 à 5 séries de 3 à 5.", "**Muscle :** 3 séries de 6 à 10."],
    variations: [
      ["goblet-squat", "La même position droite avec un haltère, plus facile à apprendre."],
      ["back-squat", "Permet de soulever plus lourd au total."],
      ["db-front-squat", "Sans rack et sans étirer les poignets."],
    ],
    faq: [
      [
        "Le squat avant est-il meilleur que le squat arrière ?",
        "Aucun n’est meilleur. Le squat avant cible les quadriceps et ménage le dos ; le squat arrière permet de soulever plus.",
      ],
      [
        "Pourquoi j’ai mal aux poignets ?",
        "Poignets et grands dorsaux raides. Gardez seulement deux ou trois doigts sous la barre, ou prenez une prise croisée.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "Le squat goblet tient un haltère ou un kettlebell contre la poitrine. Le poids devant aide à rester droit et à descendre bas : c’est la meilleure façon d’apprendre le squat et un excellent exercice de jambes à la maison.",
    mistakes: [
      ["Se laisser tirer vers l’avant", "Gardez le poids contre la poitrine et les coudes rentrés dessous."],
      ["Descendre trop peu", "Asseyez-vous entre vos talons, en visant à frôler les genoux avec les coudes en bas."],
      ["Aller trop vite", "Descendez en deux ou trois secondes. Une charge légère devient bien plus dure."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 15.", "**À la maison avec des charges légères :** 3 séries de 15 à 20, descente lente."],
    variations: [
      ["kb-goblet-squat", "Le même mouvement avec un kettlebell tenu par les cornes."],
      ["db-goblet-squat-heels", "Talons surélevés pour plus de quadriceps et plus de profondeur."],
      ["back-squat", "L’étape suivante quand les haltères deviennent trop légers."],
    ],
    faq: [
      [
        "Le squat goblet suffit-il pour prendre des jambes ?",
        "Oui, jusqu’à ce que votre haltère le plus lourd devienne facile. Ralentissez alors les répétitions, marquez une pause en bas ou passez au squat à la barre.",
      ],
      ["Haltère ou kettlebell ?", "Les deux. Tenez l’haltère vertical par une extrémité, ou le kettlebell par les cornes."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "Le squat bulgare pose le pied arrière sur un banc pour que la jambe avant fasse presque tout le travail. Il développe quadriceps et fessiers une jambe à la fois avec une fraction de la charge d’un squat arrière, ce qui ménage le bas du dos.",
    mistakes: [
      [
        "Pied avant trop près du banc",
        "Avancez assez pour que le tibia avant reste à peu près vertical et que le genou plie librement en bas.",
      ],
      [
        "Pousser avec le pied arrière",
        "Le pied arrière sert seulement à l’équilibre. Gardez l’essentiel du poids sur le talon et le milieu du pied avant.",
      ],
      ["Perdre l’équilibre", "Tenez-vous d’une main, ou prenez un banc plus bas, jusqu’à être stable."],
    ],
    sets: [
      "**Muscle :** 3 séries de 8 à 12 par jambe, en commençant par le côté le plus faible.",
      "**À la maison :** 3 séries de 12 à 20 par jambe au poids du corps ou avec des haltères légers.",
    ],
    variations: [
      ["split-squat", "Les deux pieds au sol : plus facile à équilibrer."],
      ["front-foot-elevated-split-squat", "Un étirement plus profond pour la jambe avant."],
      ["barbell-bulgarian-split-squat", "Plus de charge quand les haltères deviennent difficiles à tenir."],
    ],
    faq: [
      [
        "Quadriceps ou fessiers ?",
        "Les deux. Buste plus droit et pas plus court : plus de quadriceps ; penché en avant avec un pas plus long : plus de fessiers.",
      ],
      ["Pourquoi est-ce si dur ?", "Une jambe fait le travail de deux, et l’équilibre s’ajoute. Commencez léger ; la charge montera vite."],
    ],
  },
  "leg-press": {
    intro:
      "La presse à cuisses travaille quadriceps et fessiers sans charger la colonne ni demander d’équilibre : vous pouvez pousser fort et en sécurité, même quand le dos ou la technique limiteraient un squat.",
    mistakes: [
      ["Bas du dos qui décolle du dossier", "Ne descendez que jusqu’où les hanches et le bas du dos restent sur le siège."],
      ["Verrouiller fort les genoux en haut", "Arrêtez-vous juste avant le verrouillage et enchaînez la répétition suivante."],
      [
        "Raccourcir l’amplitude pour charger plus",
        "Une amplitude complète et contrôlée avec moins de charge construit plus de muscle que des demi-répétitions avec toute la pile.",
      ],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 8 à 15.", "**En finition :** 1 à 2 séries de 15 à 25 après les squats."],
    variations: [
      ["narrow-leg-press", "Pieds plus bas et plus serrés : plus de quadriceps."],
      ["wide-leg-press", "Pieds plus hauts et plus écartés : plus de fessiers et d’adducteurs."],
      ["single-leg-press", "Une jambe à la fois pour équilibrer les côtés."],
    ],
    faq: [
      [
        "La presse vaut-elle le squat ?",
        "Pour prendre du muscle aux jambes, elle s’en approche. Le squat entraîne aussi l’équilibre et le tronc ; la presse permet de pousser les jambes plus fort avec moins de fatigue.",
      ],
      [
        "Où placer les pieds ?",
        "Au milieu du plateau, à largeur d’épaules, c’est un bon départ. Montez-les pour les fessiers, descendez-les pour les quadriceps.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "La machine à hack squat vous guide dans un squat sur un chariot, le dos soutenu. C’est l’un des meilleurs exercices pour les quadriceps, car on peut descendre bas et pousser fort sans équilibrer une barre.",
    mistakes: [
      ["Pieds trop hauts sur le plateau", "Placez-les au milieu ou un peu plus bas pour plus de quadriceps, talons à plat."],
      ["Rebondir en bas", "Contrôlez la descente et marquez une brève pause avant de remonter."],
      ["Répétitions partielles", "Descendez aussi bas que vos hanches le permettent sans que le bas du dos décolle."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 6 à 12.", "**Force :** 3 séries de 5 à 8, après votre squat principal."],
    variations: [
      ["pendulum-squat", "Une machine proche avec un arc plus profond."],
      ["leg-press", "Aucune charge sur les épaules."],
      ["back-squat", "Charge libre : entraîne l’équilibre et le tronc."],
    ],
    faq: [
      [
        "Le hack squat est-il mauvais pour les genoux ?",
        "Non. Que les genoux passent devant les orteils est normal. Montez la charge progressivement et sans douleur.",
      ],
      [
        "Hack squat ou presse ?",
        "Le hack squat cible souvent un peu plus les quadriceps ; la presse ménage épaules et dos. Les deux sont bons.",
      ],
    ],
  },
  deadlift: {
    intro:
      "Le soulevé de terre décolle une barre chargée du sol. Il travaille toute la chaîne arrière, fessiers, ischios, dos et prise, et c’est souvent le mouvement où l’on soulève le plus lourd.",
    mistakes: [
      [
        "Barre qui s’éloigne des jambes",
        "Gardez la barre au contact des tibias et des cuisses jusqu’en haut. Partez avec la barre au-dessus du milieu du pied.",
      ],
      ["Arrondir le bas du dos", "Gainez fort avant de tirer, et allégez si le dos ne tient pas la position."],
      [
        "Arracher la barre du sol",
        "Supprimez d’abord le jeu : mettez-vous en tension jusqu’à ce que la barre claque contre les disques, puis repoussez le sol.",
      ],
      ["Se pencher en arrière en haut", "Terminez debout, grand, fessiers serrés. Inutile de basculer en arrière."],
    ],
    sets: [
      "**Force :** 2 à 4 séries de 2 à 5, avec 3 à 5 minutes de repos.",
      "**Muscle :** 3 séries de 5 à 8. Le soulevé de terre fatigue beaucoup, la plupart le font une fois par semaine.",
    ],
    variations: [
      ["trap-bar-deadlift", "Plus facile à apprendre, plus droit, plus doux pour le dos."],
      ["sumo-deadlift", "Une position large qui convient mieux à certaines morphologies."],
      ["romanian-deadlift", "Part du haut et charge davantage les ischios."],
      ["paused-deadlift", "Donne du contrôle juste au décollage."],
    ],
    faq: [
      [
        "À quelle fréquence faire du soulevé de terre ?",
        "Une fois par semaine suffit à la plupart, avec une charnière plus légère comme le soulevé de terre roumain un autre jour.",
      ],
      [
        "Peut-on lâcher la barre en haut ?",
        "Redescendez-la sous contrôle. La lâcher abîme les disques et le sol, et supprime la moitié de la répétition.",
      ],
      [
        "Faut-il des sangles ?",
        "Sur vos séries les plus lourdes, si la prise lâche en premier. Travaillez la prise pendant l’échauffement. Voir [grip strength](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "Le soulevé de terre sumo se fait pieds très écartés, mains à l’intérieur des genoux. Il raccourcit la course de la barre et permet de rester plus droit, en sollicitant davantage hanches, quadriceps et adducteurs.",
    mistakes: [
      ["Position trop large", "Écartez seulement tant que les tibias restent à peu près verticaux et les genoux au-dessus des orteils."],
      [
        "Hanches qui montent en premier",
        "Poussez les genoux vers l’extérieur et écartez le sol, pour que hanches et poitrine montent ensemble.",
      ],
      ["Partir bras mous", "Supprimez le jeu de la barre avant qu’elle ne quitte le sol."],
    ],
    sets: ["**Force :** 3 à 5 séries de 2 à 5.", "**Muscle :** 3 séries de 5 à 8."],
    variations: [
      ["deadlift", "La position classique : plus d’ischios et de dos."],
      ["kb-sumo-deadlift", "Une façon légère d’apprendre la position."],
      ["trap-bar-deadlift", "Droit comme le sumo, plus simple à mettre en place."],
    ],
    faq: [
      [
        "Le sumo, c’est de la triche ?",
        "Non. C’est un style reconnu en force athlétique. Choisissez la position qui convient à votre corps et vous permet de bien soulever.",
      ],
      [
        "Sumo ou classique ?",
        "Essayez les deux quelques semaines. Les personnes aux jambes longues et aux bras courts préfèrent souvent le sumo.",
      ],
    ],
  },
  "romanian-deadlift": {
    intro:
      "Le soulevé de terre roumain part debout et descend la barre en reculant les hanches, jambes presque tendues. C’est l’un des meilleurs exercices pour les ischios et les fessiers, car il les charge dans un long étirement.",
    mistakes: [
      [
        "Trop plier les genoux",
        "Gardez une légère flexion qui ne change pas. Si les genoux plient plus en descendant, cela devient un squat.",
      ],
      ["Descendre trop bas", "Ne descendez que tant que les hanches reculent et que le dos reste plat, en général jusqu’à mi-tibia."],
      ["Barre loin des jambes", "Faites-la glisser le long des cuisses. Plus elle reste près, plus le bas du dos est ménagé."],
    ],
    sets: ["**Muscle :** 3 séries de 6 à 12, descente lente.", "**Après le soulevé de terre :** 2 à 3 séries de 8 à 10, plus léger."],
    variations: [
      ["db-rdl", "Avec des haltères, idéal à la maison."],
      ["single-leg-rdl", "Sur une jambe : équilibre, et moins de charge nécessaire."],
      ["stiff-leg-deadlift", "Repart du sol à chaque répétition."],
    ],
    faq: [
      [
        "Roumain ou soulevé de terre classique ?",
        "Le roumain part du haut et charge plus les ischios ; le classique part du sol et permet de soulever plus.",
      ],
      [
        "Où dois-je le sentir ?",
        "À l’arrière des cuisses et dans les fessiers. Si vous le sentez surtout dans le bas du dos, allégez et reculez davantage les hanches.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "Le soulevé de terre à la trap bar vous place à l’intérieur d’une barre hexagonale, poignées sur les côtés. Vous restez plus droit, ce qui soulage le bas du dos : c’est le soulevé de terre le plus facile à apprendre et à charger lourd.",
    mistakes: [
      ["En faire un squat", "C’est toujours une charnière. Reculez les hanches pour atteindre les poignées, puis repoussez le sol."],
      ["Décentré dans la barre", "Placez-vous de sorte que les poignées soient alignées avec le milieu du pied."],
      ["Perdre la tension en bas", "Replacez-vous entre les répétitions ou touchez légèrement ; ne faites pas rebondir les disques."],
    ],
    sets: ["**Force :** 3 à 5 séries de 3 à 5.", "**Muscle ou sport :** 3 séries de 5 à 8."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Poignées hautes : moins d’amplitude pour les débutants ou les grands."],
      ["deadlift", "La barre droite : plus de dos et d’ischios."],
      ["trap-bar-rdl", "Une version centrée sur les ischios."],
    ],
    faq: [
      [
        "Le soulevé à la trap bar est-il plus facile ?",
        "La plupart le trouvent plus facile à apprendre et y soulèvent un peu plus, car on reste plus droit.",
      ],
      [
        "Travaille-t-il les mêmes muscles ?",
        "En grande partie. Un peu plus de quadriceps et un peu moins de bas du dos qu’avec une barre droite.",
      ],
    ],
  },
  "hip-thrust": {
    intro:
      "Le hip thrust appuie le haut du dos sur un banc et pousse une barre chargée avec les hanches. Il charge les fessiers en extension complète de hanche plus que presque tout autre exercice.",
    mistakes: [
      [
        "Cambrer le bas du dos en haut",
        "Rentrez le menton et gardez les côtes basses ; finissez en serrant les fessiers, pas en vous cambrant.",
      ],
      [
        "Pieds mal placés",
        "En haut, les tibias doivent être à peu près verticaux. Trop près, les quadriceps prennent le relais ; trop loin, les ischios.",
      ],
      ["Passer vite en haut", "Tenez une seconde en haut à chaque répétition."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 8 à 12.", "**Force :** 3 séries de 5 à 8 avec une pause en haut."],
    variations: [
      ["glute-bridge", "Au sol : plus simple à installer, amplitude plus courte."],
      ["db-hip-thrust", "Un haltère sur les hanches, bien à la maison."],
      ["single-leg-hip-thrust", "Une jambe à la fois, sans charge."],
    ],
    faq: [
      ["Faut-il une protection ?", "Une mousse de barre ou un tapis plié rendent les séries lourdes bien plus confortables."],
      [
        "Hip thrust ou squat pour les fessiers ?",
        "Les deux. Le squat les travaille en étirement profond ; le hip thrust les travaille le plus en haut. Voir [glute workout](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "Le pont fessier soulève les hanches du sol, dos à plat. C’est un exercice simple, faisable partout, et une bonne façon d’apprendre à utiliser les fessiers avant le hip thrust.",
    mistakes: [
      ["Pousser sur les orteils", "Poussez dans les talons pour garder le travail sur les fessiers."],
      ["Se cambrer pour monter plus haut", "Arrêtez-vous quand hanches et cuisses forment une ligne droite. Serrez les fessiers là."],
      ["Enchaîner trop vite", "Marquez une pause d’une à deux secondes en haut."],
    ],
    sets: [
      "**À la maison :** 3 séries de 15 à 25, avec une pause en haut.",
      "**Avec charge :** 3 séries de 10 à 15 avec un haltère ou une barre sur les hanches.",
    ],
    variations: [
      ["single-leg-glute-bridge", "Deux fois plus de travail pour chaque côté."],
      ["hip-thrust", "Dos sur un banc pour plus d’amplitude et des charges plus lourdes."],
      ["marching-glute-bridge", "Ajoute de la stabilité du tronc et des hanches."],
    ],
    faq: [
      [
        "Pont fessier ou hip thrust ?",
        "Le pont est plus facile et ne demande rien ; le hip thrust a plus d’amplitude et accepte plus de charge.",
      ],
      ["Pourquoi je le sens dans les ischios ?", "Rapprochez un peu les pieds des hanches et poussez dans les talons."],
    ],
  },
  "walking-lunge": {
    intro:
      "Les fentes marchées enchaînent les pas en avant jusqu’à la fente. Elles travaillent quadriceps et fessiers une jambe à la fois, sollicitent l’équilibre et font monter le cardio.",
    mistakes: [
      ["Pas trop courts", "Faites un pas assez long pour que les deux genoux soient pliés à environ 90 degrés en bas."],
      ["Genou avant qui rentre", "Gardez le genou avant aligné avec les orteils."],
      ["Genou arrière qui frappe le sol", "Descendez sous contrôle jusqu’à ce que le genou arrière frôle le sol."],
    ],
    sets: ["**Muscle :** 3 séries de 10 à 12 pas par jambe.", "**Cardio :** 2 à 3 séries de 20 à 30 pas au total, repos courts."],
    variations: [
      ["reverse-lunge", "Reculer ménage les genoux et facilite l’équilibre."],
      ["barbell-walking-lunge", "Plus de charge quand les haltères deviennent lourds à tenir."],
      ["bulgarian-split-squat", "Sur place, et isole davantage chaque jambe."],
    ],
    faq: [
      [
        "Fentes marchées ou arrière ?",
        "Les fentes arrière sont plus faciles à contrôler et ménagent les genoux ; les fentes marchées ajoutent équilibre et cardio.",
      ],
      ["Combien de place faut-il ?", "Une dizaine de mètres par série. Sinon, faites demi-tour ou passez aux fentes arrière."],
    ],
  },
  "reverse-lunge": {
    intro:
      "La fente arrière recule d’un pas jusqu’à la fente. Le poids reste sur le pied avant, ce qui la rend plus facile à équilibrer et plus douce pour les genoux que la fente avant.",
    mistakes: [
      ["Pas trop étroit", "Reculez comme sur des rails, pas sur une corde raide, pour rester équilibré."],
      ["Pousser avec le pied arrière", "Remontez en poussant dans le talon avant ; la jambe arrière aide seulement à l’équilibre."],
      ["Trop se pencher en avant", "Restez assez droit, avec une légère inclinaison pour plus de fessiers."],
    ],
    sets: ["**Au poids du corps :** 3 séries de 12 à 20 par jambe.", "**Avec charge :** 3 séries de 8 à 12 par jambe avec des haltères."],
    variations: [
      ["db-reverse-lunge", "Des haltères pour plus de charge."],
      ["deficit-reverse-lunge", "Pied avant sur une marche pour plus d’amplitude."],
      ["walking-lunge", "Ajoute équilibre et cardio."],
    ],
    faq: [
      [
        "Les fentes arrière conviennent-elles aux genoux sensibles ?",
        "C’est souvent la fente la plus confortable pour eux. Restez dans une amplitude sans douleur.",
      ],
      ["Alterner ou faire un côté à la fois ?", "Les deux. Un côté à la fois est plus dur et garde les répétitions égales."],
    ],
  },
  "leg-extension": {
    intro:
      "La machine à extension des jambes tend le genou contre une résistance. Elle isole les quadriceps, y compris la partie que le squat travaille peu, et se pousse facilement près de l’échec en sécurité.",
    mistakes: [
      ["Genou mal aligné avec l’axe", "Réglez le siège pour que l’articulation du genou soit alignée avec l’axe de la machine."],
      ["Lancer la charge", "Montez sous contrôle et marquez une brève pause en haut."],
      ["Décoller les hanches du siège", "Tenez les poignées et gardez les hanches en bas."],
    ],
    sets: ["**Muscle :** 2 à 3 séries de 10 à 15, après squats ou presses.", "**En finition :** 1 série de 15 à 20 proche de l’échec."],
    variations: [
      ["single-leg-extension", "Une jambe à la fois pour équilibrer les côtés."],
      ["sissy-squat", "Isolation des quadriceps au poids du corps."],
      ["leg-press", "Un exercice polyarticulaire pour les quadriceps."],
    ],
    faq: [
      [
        "Les extensions sont-elles mauvaises pour les genoux ?",
        "Pas avec une charge raisonnable. Elles servent souvent en rééducation du genou. Arrêtez en cas de douleur articulaire.",
      ],
      [
        "Faut-il des extensions si je fais du squat ?",
        "Pas obligatoirement, mais elles ajoutent du travail de quadriceps sans grande fatigue et entraînent le droit fémoral, que le squat étire peu.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "Le leg curl allongé plie les genoux contre un boudin, à plat ventre. Il isole les ischios, que les charnières comme le soulevé de terre travaillent surtout depuis la hanche.",
    mistakes: [
      ["Hanches qui décollent du banc", "Plaquez les hanches contre le banc et gardez-les là."],
      ["Utiliser l’élan", "Montez en douceur et descendez lentement, deux ou trois secondes."],
      ["Amplitude courte", "Redescendez jusqu’à ce que les jambes soient presque tendues avant la répétition suivante."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 15."],
    variations: [
      ["seated-leg-curl", "Hanches fléchies : les ischios travaillent depuis un étirement plus long."],
      ["nordic-curl", "Au poids du corps et très dur ; idéal pour les sprinteurs."],
      ["slider-leg-curl", "À la maison avec une serviette ou des patins."],
    ],
    faq: [
      [
        "Leg curl allongé ou assis ?",
        "La version assise étire plus les ischios et peut construire un peu plus de muscle. Prenez celle de votre salle.",
      ],
      [
        "Faut-il des leg curls si je fais du soulevé de terre ?",
        "Ils travaillent la flexion du genou par les ischios, ce que le soulevé de terre ne fait pas. Un exercice de curl par semaine aide.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "Le leg curl assis plie les genoux contre un boudin, en position assise. Assis, les ischios sont en long étirement, ce qui en fait l’un des meilleurs exercices pour y prendre du muscle.",
    mistakes: [
      ["Boudin des cuisses trop lâche", "Serrez bien le boudin des cuisses pour que les jambes ne se soulèvent pas."],
      ["Se pencher en arrière pour tricher", "Restez droit ou penchez-vous légèrement en avant pour garder l’étirement."],
      ["Descendre trop vite", "Contrôlez la descente sur deux ou trois secondes."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 15."],
    variations: [
      ["lying-leg-curl", "Hanches tendues, si la machine assise est prise."],
      ["single-leg-curl", "Une jambe à la fois."],
      ["romanian-deadlift", "Travaille les ischios depuis la hanche plutôt que le genou."],
    ],
    faq: [
      [
        "Le leg curl assis est-il meilleur qu’allongé ?",
        "Il travaille les ischios depuis un étirement plus long, ce qui peut construire un peu plus de muscle. Les deux sont bons.",
      ],
      [
        "Quelle charge pour les leg curls ?",
        "Assez pour que les deux dernières répétitions de chaque série soient dures, tout en contrôlant la descente.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "L’extension des mollets debout monte sur la pointe des pieds contre une résistance, genoux tendus. C’est elle qui travaille le mieux le plus gros muscle du mollet, le gastrocnémien.",
    mistakes: [
      ["Rebondir en bas", "Marquez une pause d’une seconde dans l’étirement en bas de chaque répétition."],
      ["Demi-répétitions", "Allez d’un étirement profond jusqu’au plus haut possible sur la pointe des pieds."],
      ["Plier les genoux", "Genoux tendus sans être verrouillés, pour que les mollets fassent le travail."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 8 à 15, lentement, deux ou trois fois par semaine."],
    variations: [
      ["seated-calf-raise", "Genoux pliés, pour le soléaire en dessous."],
      ["single-leg-calf-raise", "À la maison sur une marche, une jambe à la fois."],
      ["calf-press", "Sur la presse à cuisses."],
    ],
    faq: [
      [
        "Pourquoi mes mollets ne grossissent pas ?",
        "La plupart rebondissent sur des répétitions courtes. Prenez toute l’amplitude avec une pause dans l’étirement, et entraînez-les plus souvent. Voir [calf workout](/blog/calf-workout/).",
      ],
      ["Debout ou assis ?", "Les deux. Debout cible plus le gastrocnémien ; assis, le soléaire."],
    ],
  },
  plank: {
    intro:
      "La planche tient le corps en ligne droite sur les avant-bras et les orteils. Elle apprend aux abdominaux et au tronc à résister à la flexion, ce qui aide à se gainer sous une barre lourde.",
    mistakes: [
      ["Hanches qui s’affaissent", "Serrez les fessiers et rapprochez les côtes des hanches."],
      ["Hanches trop hautes", "Abaissez-les jusqu’à former une ligne droite de la tête aux talons."],
      ["Tenir plusieurs minutes", "Une fois 60 secondes atteintes, rendez-la plus difficile plutôt que plus longue."],
    ],
    sets: ["**Tronc :** 2 à 3 maintiens de 20 à 60 secondes, deux ou trois fois par semaine."],
    variations: [
      ["side-plank", "Travaille les obliques et les côtés des hanches."],
      ["long-lever-plank", "Coudes plus en avant : bien plus dur."],
      ["ab-wheel", "Une version en mouvement quand la planche devient facile."],
    ],
    faq: [
      ["Combien de temps tenir la planche ?", "20 à 60 secondes avec une forme parfaite. Au-delà, une version plus dure apporte plus."],
      [
        "La planche fait-elle perdre du ventre ?",
        "Aucun exercice ne brûle la graisse d’une zone précise. Voir [how to lose belly fat](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "La relevée de jambes suspendu se fait pendu à une barre en montant les jambes. C’est l’un des exercices d’abdominaux les plus durs : bas des abdos, fléchisseurs de hanche, et la prise en plus.",
    mistakes: [
      ["Se balancer", "Partez d’une suspension immobile et redescendez lentement. Marquez une pause en bas si vous vous balancez."],
      [
        "Monter seulement les jambes",
        "Enroulez le bassin en haut pour que les abdos travaillent, pas seulement les fléchisseurs de hanche.",
      ],
      ["La prise lâche avant", "Utilisez des sangles pour abdos, ou travaillez la prise à part."],
    ],
    sets: ["**Tronc :** 3 séries de 6 à 15."],
    variations: [
      ["hanging-knee-raise", "Genoux pliés : la première étape, plus facile."],
      ["parallel-bar-knee-raise", "Aux barres parallèles, sans prise à tenir."],
      ["lying-leg-raise", "Au sol, encore plus facile."],
    ],
    faq: [
      ["Comment arrêter de me balancer ?", "Redescendez lentement, faites une pause en bas et gardez les épaules actives."],
      ["Trop dur ?", "Commencez par les relevés de genoux suspendu, et passez aux jambes tendues à 3 séries de 12."],
    ],
  },
  "ab-wheel": {
    intro:
      "La roue abdominale roule devant vous puis revient. C’est l’un des exercices d’abdos les plus exigeants : il leur apprend à empêcher le dos de se cambrer pendant que les bras s’allongent au-dessus de la tête.",
    mistakes: [
      ["Bas du dos qui se creuse", "Ne roulez que tant que le dos ne se cambre pas. Rétroversez le bassin et serrez les fessiers."],
      ["Revenir en levant les hanches", "Revenez avec les abdos et les bras ensemble, pas en remontant les hanches."],
      ["Aller trop loin trop tôt", "Roulez d’abord jusqu’à un mur ou sur une courte distance, puis allez plus loin chaque semaine."],
    ],
    sets: ["**Tronc :** 3 séries de 5 à 12 à genoux, puis debout une fois fort."],
    variations: [
      ["plank", "La version statique pour s’y préparer."],
      ["plank-reach", "Une façon plus douce d’entraîner la même chose."],
      ["dead-bug", "Sur le dos, pour apprendre à garder le bas du dos au sol."],
    ],
    faq: [
      [
        "La roue abdominale est-elle mauvaise pour le dos ?",
        "Non si vous restez dans l’amplitude où le dos ne se cambre pas. Raccourcissez si vous le sentez dans le bas du dos.",
      ],
      ["À genoux ou debout ?", "À genoux pour la plupart. Debout est un objectif avancé."],
    ],
  },
  "kb-swing": {
    intro:
      "Le swing au kettlebell projette les hanches vers l’avant pour balancer le kettlebell à hauteur de poitrine. Il travaille fessiers et ischios de façon explosive et sert aussi de cardio.",
    mistakes: [
      ["En faire un squat", "C’est une charnière : reculez les hanches, avec seulement un peu de flexion des genoux."],
      ["Monter avec les bras", "Les hanches envoient le kettlebell ; les bras ne font que le tenir."],
      ["Se pencher en arrière en haut", "Finissez droit, fessiers et abdos serrés, comme en planche."],
    ],
    sets: ["**Puissance :** 5 à 10 séries de 10, repos à la demande.", "**Cardio :** 10 à 20 swings chaque minute pendant 10 minutes."],
    variations: [
      ["kb-single-swing", "À une main : ajoute une rotation que le tronc doit retenir."],
      ["db-swing", "Avec un haltère si vous n’avez pas de kettlebell."],
      ["kb-deadlift", "Apprenez la charnière avant de faire des swings."],
    ],
    faq: [
      [
        "Quel poids de kettlebell ?",
        "Assez lourd pour que le swing soit vif, pas lent. Beaucoup de femmes commencent à 12 kg et beaucoup d’hommes à 16 à 20 kg.",
      ],
      ["Jusqu’où monter ?", "À peu près à hauteur de poitrine. Plus haut n’apporte pas grand-chose."],
    ],
  },
  "farmers-carry": {
    intro:
      "La marche du fermier soulève deux charges lourdes et marche. Elle travaille la prise, les trapèzes, le tronc et la posture en même temps, et se transfère directement à la vie quotidienne.",
    mistakes: [
      ["Se pencher ou se tordre", "Marchez grand, épaules en arrière et basses, à petits pas rapides."],
      ["Charges trop légères", "Finir la distance doit être dur. La prise est censée être la limite."],
      ["Ramasser dos rond", "Soulevez les charges comme un soulevé de terre et reposez-les de la même façon."],
    ],
    sets: ["**Force :** 3 à 5 trajets de 20 à 40 mètres, avec 1 à 2 minutes de repos."],
    variations: [
      ["db-suitcase-carry", "D’un seul côté : travaille les obliques."],
      ["trap-bar-carry", "Plus de charge dans une seule barre."],
      ["kb-rack-carry", "Kettlebells aux épaules, pour le haut du dos."],
    ],
    faq: [
      [
        "Quelle charge pour la marche du fermier ?",
        "Commencez vers un quart de votre poids de corps dans chaque main et montez progressivement.",
      ],
      ["Sur quelle distance ?", "20 à 40 mètres par trajet, ou 30 à 60 secondes."],
    ],
  },
  "good-morning": {
    intro:
      "Le good morning tient une barre sur le dos et bascule vers l’avant depuis les hanches. Il renforce ischios, fessiers et bas du dos, et enseigne une charnière de hanche solide.",
    mistakes: [
      ["Charger trop lourd", "Commencez léger. Ce mouvement est dur pour le bas du dos si la technique casse."],
      ["Arrondir le dos", "Dos plat et poitrine fière ; descendez seulement tant que vous tenez cette position."],
      ["Trop plier les genoux", "Gardez une légère flexion et reculez les hanches bien droit."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 12, léger."],
    variations: [
      ["romanian-deadlift", "La même charnière avec la charge dans les mains."],
      ["band-good-morning", "Léger et bon pour apprendre."],
      ["seated-good-morning", "Assis : surtout le bas du dos."],
    ],
    faq: [
      [
        "Le good morning est-il dangereux ?",
        "Pas avec des charges raisonnables et une bonne technique. Commencez léger et montez lentement.",
      ],
      ["Jusqu’où descendre ?", "Jusqu’à ce que le buste soit à peu près parallèle au sol, ou moins si le dos commence à s’arrondir."],
    ],
  },
  "step-up": {
    intro:
      "La montée sur banc vous hisse sur une box ou un banc avec une jambe. Elle développe quadriceps et fessiers un côté à la fois et se transfère directement aux escaliers, à la randonnée et au sport.",
    mistakes: [
      ["Pousser avec le pied arrière", "Gardez le pied arrière léger ; laissez la jambe avant vous monter."],
      ["Box trop haute", "Commencez avec une box à hauteur de genou ou un peu plus bas."],
      ["Se laisser tomber", "Redescendez lentement. La descente entraîne aussi la jambe."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 12 par jambe.", "**Au poids du corps :** 3 séries de 15 à 20 par jambe."],
    variations: [
      ["db-step-up", "Des haltères pour plus de charge."],
      ["db-lateral-step-up", "Montée par le côté, pour les fessiers."],
      ["box-step-down", "Descentes lentes pour le contrôle du genou."],
    ],
    faq: [
      ["Quelle hauteur de box ?", "À hauteur de genou ou plus bas. Plus haut travaille plus les fessiers mais se contrôle moins bien."],
      [
        "Montées ou fentes ?",
        "Elles travaillent les mêmes muscles. Les montées sont plus faciles à équilibrer ; les fentes ont plus d’amplitude.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "Le développé couché est le grand mouvement de force du haut du corps. Il travaille pectoraux, avant des épaules et triceps, accepte de lourdes charges et c’est l’un des plus simples pour suivre ses progrès.",
    mistakes: [
      [
        "Épaules relâchées",
        "Serrez les omoplates en arrière et vers le bas avant de décrocher la barre, et gardez-les fixées toute la série.",
      ],
      ["Coudes complètement ouverts", "Rentrez-les à environ 45 à 70 degrés du corps. C’est plus fort et plus doux pour les épaules."],
      [
        "Faire rebondir la barre sur la poitrine",
        "Touchez légèrement le bas des pectoraux, puis poussez. Une courte pause apprend le contrôle.",
      ],
      ["Pieds flottants", "Ancrez les pieds et poussez dans le sol pour garder le corps gainé."],
    ],
    sets: [
      "**Force :** 3 à 5 séries de 3 à 6, avec 3 à 5 minutes de repos.",
      "**Muscle :** 3 à 4 séries de 6 à 10, avec 2 à 3 minutes de repos.",
      "**Si vous débutez :** 3 séries de 8, en ajoutant un peu de charge à chaque séance.",
    ],
    variations: [
      ["db-bench-press", "Plus d’amplitude, et chaque côté travaille seul."],
      ["incline-bench-press", "Plus de haut des pectoraux et d’avant des épaules."],
      ["close-grip-bench", "Déplace le travail vers les triceps."],
      ["spoto-press", "Pause juste au-dessus de la poitrine pour gagner en contrôle."],
    ],
    faq: [
      [
        "Faut-il un pareur ?",
        "Pour les séries lourdes, prenez un pareur ou un rack avec les sécurités juste sous la hauteur de la poitrine.",
      ],
      [
        "Quel écartement de prise ?",
        "La plupart poussent mieux avec les avant-bras verticaux en bas, en général un peu plus large que les épaules.",
      ],
      ["Faut-il cambrer le dos ?", "Une légère cambrure due aux omoplates serrées est normale. Gardez les fessiers sur le banc."],
    ],
  },
  "incline-bench-press": {
    intro:
      "Le développé incliné pousse une barre sur un banc réglé à environ 30 degrés. Il déplace plus de travail vers le haut des pectoraux et l’avant des épaules que le développé couché.",
    mistakes: [
      ["Banc trop incliné", "Environ 30 degrés suffisent. Plus raide, cela devient un développé épaules."],
      ["Trajectoire trop basse", "Descendez la barre en haut de la poitrine, juste sous les clavicules."],
      ["Épaules qui partent en avant", "Omoplates en arrière et vers le bas, comme au développé couché."],
    ],
    sets: ["**Force :** 3 à 4 séries de 4 à 6.", "**Muscle :** 3 séries de 6 à 12."],
    variations: [
      ["db-incline-press", "Haltères : plus d’amplitude, plus doux pour les épaules."],
      ["smith-incline-press", "Une trajectoire guidée pour pousser fort en sécurité."],
      ["bench-press", "À plat : plus de charge au total."],
    ],
    faq: [
      ["Quel angle pour le banc incliné ?", "Environ 30 degrés. Beaucoup de bancs réglables ont un cran proche."],
      [
        "Faut-il faire couché et incliné ?",
        "Pas forcément, mais les deux travaillent les pectoraux sous deux angles. Beaucoup de programmes prennent l’un comme mouvement principal et l’autre comme second développé.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "Le développé couché aux haltères pousse deux haltères allongé sur un banc plat. Chaque bras travaille seul et les haltères descendent plus bas qu’une barre : idéal pour le volume des pectoraux et pour équilibrer les côtés.",
    mistakes: [
      ["Mal se mettre en place", "Asseyez-vous haltères sur les cuisses, allongez-vous et montez-les d’un coup de genoux."],
      ["Haltères trop écartés", "Descendez-les sur les côtés de la poitrine, coudes à environ 45 degrés."],
      ["Les entrechoquer en haut", "Poussez vers le haut et légèrement vers l’intérieur, en vous arrêtant juste avant qu’ils se touchent."],
    ],
    sets: [
      "**Muscle :** 3 à 4 séries de 6 à 12.",
      "**À la maison :** 3 séries de 10 à 20 avec une descente lente si vos haltères sont légers.",
    ],
    variations: [
      ["db-incline-press", "Accent sur le haut des pectoraux."],
      ["db-floor-press", "Sans banc ; amplitude plus courte."],
      ["db-neutral-press", "Paumes face à face : plus doux pour les épaules."],
    ],
    faq: [
      [
        "Haltères ou barre ?",
        "La barre permet de soulever plus ; les haltères offrent plus d’amplitude et équilibrent les côtés. Les deux construisent les pectoraux.",
      ],
      [
        "Comment reposer les haltères en sécurité ?",
        "Ramenez-les sur la poitrine, puis sur les cuisses en vous redressant. Ne les lâchez pas sur les côtés.",
      ],
    ],
  },
  "db-incline-press": {
    intro:
      "Le développé incliné aux haltères pousse deux haltères sur un banc incliné. C’est l’un des meilleurs exercices pour le haut des pectoraux, et il ménage plus les épaules que la version à la barre.",
    mistakes: [
      ["Inclinaison trop forte", "Environ 30 degrés pour que les pectoraux restent aux commandes."],
      ["Raccourcir l’amplitude", "Laissez les haltères descendre au niveau de la poitrine pour un étirement complet, sous contrôle."],
      ["Se cambrer sur le banc", "Hanches en bas et haut du dos plaqué contre le dossier."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 12."],
    variations: [
      ["db-low-incline-press", "Un angle plus bas, entre couché et incliné."],
      ["incline-bench-press", "La version à la barre pour des charges plus lourdes."],
      ["incline-machine-press", "Une machine pour pousser fort sans équilibrer."],
    ],
    faq: [
      [
        "Le développé incliné construit-il le haut des pectoraux ?",
        "Oui. L’inclinaison déplace plus de travail vers les fibres supérieures.",
      ],
      ["Quelle charge par rapport au couché ?", "En général 10 à 20 % de moins que votre développé couché aux haltères."],
    ],
  },
  "push-up": {
    intro:
      "La pompe pousse votre corps depuis le sol. Elle travaille pectoraux, épaules et triceps n’importe où, et avec des versions plus dures elle peut vous mener loin.",
    mistakes: [
      ["Hanches qui s’affaissent", "Serrez fessiers et abdos pour que le corps reste une seule ligne."],
      ["Coudes écartés", "Gardez les coudes à environ 45 degrés du corps."],
      ["Demi-répétitions", "Descendez jusqu’à un poing du sol, puis poussez jusqu’en haut."],
    ],
    sets: [
      "**Muscle :** 3 séries, en s’arrêtant une ou deux répétitions avant l’échec.",
      "**Trop facile ?** Surélevez les pieds, ralentissez la descente ou ajoutez un sac à dos.",
    ],
    variations: [
      ["incline-push-up", "Mains sur un banc : plus facile, la première étape."],
      ["decline-push-up", "Pieds surélevés : plus dur, plus de haut des pectoraux."],
      ["archer-push-up", "Déplace le travail sur un bras."],
      ["deficit-push-up", "Mains sur des blocs pour un étirement plus profond."],
    ],
    faq: [
      [
        "Combien de pompes faire ?",
        "Autant de bonnes répétitions que possible moins une ou deux, sur 3 séries. Rendez-les plus dures au-delà d’environ 20.",
      ],
      [
        "Les pompes font-elles prendre du muscle ?",
        "Oui, tant que les séries sont dures. Passez à des versions plus difficiles en progressant. Voir [calisthenics progressions](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "Le dip descend et pousse votre corps entre deux barres parallèles. C’est l’un des meilleurs exercices au poids du corps pour les pectoraux et les triceps.",
    mistakes: [
      ["Descendre trop bas", "Descendez jusqu’à ce que les bras soient à peu près parallèles au sol, ou moins si les épaules protestent."],
      ["Hausser les épaules", "Gardez les épaules basses, loin des oreilles."],
      ["Se balancer", "Croisez les chevilles et gardez le corps immobile."],
    ],
    sets: ["**Muscle :** 3 séries de 6 à 12.", "**Trop facile ?** Ajoutez du poids avec une ceinture ou un haltère entre les pieds."],
    variations: [
      ["negative-dip", "Seulement la descente lente, la première étape."],
      ["band-assisted-dip", "Un élastique porte une partie de votre poids."],
      ["ring-dip", "Bien plus dur : les anneaux bougent."],
    ],
    faq: [
      ["Pectoraux ou triceps ?", "Penchez-vous en avant pour plus de pectoraux ; restez droit pour plus de triceps."],
      [
        "Les dips sont-ils mauvais pour les épaules ?",
        "Pas pour la plupart, si vous contrôlez la profondeur. Arrêtez avant l’amplitude qui fait mal.",
      ],
    ],
  },
  "cable-fly": {
    intro:
      "L’écarté à la poulie rapproche les mains en arc, comme une étreinte, contre deux poulies. Il isole les pectoraux et garde la tension sur toute la répétition, surtout dans l’étirement.",
    mistakes: [
      ["En faire un développé", "Gardez une légère flexion fixe des coudes. Ne bougez qu’aux épaules."],
      ["Trop lourd", "Choisissez une charge que vous contrôlez sur tout l’étirement."],
      ["Épaules qui partent en avant", "Poitrine haute et omoplates en arrière."],
    ],
    sets: ["**Muscle :** 2 à 3 séries de 10 à 15, après les développés."],
    variations: [
      ["low-cable-fly", "Du bas vers le haut : haut des pectoraux."],
      ["pec-deck", "Une machine à trajectoire guidée."],
      ["db-fly", "Aux haltères, sans poulie."],
    ],
    faq: [
      [
        "Poulie haute ou basse ?",
        "Du haut vers le bas cible plus le bas des pectoraux ; du bas vers le haut, le haut. Les deux sont bons.",
      ],
      [
        "Poulie ou haltères ?",
        "La poulie garde la tension en haut ; les haltères sont plus lourds dans l’étirement. Les deux conviennent.",
      ],
    ],
  },
  "overhead-press": {
    intro:
      "Le développé militaire pousse une barre des épaules jusqu’au-dessus de la tête, debout. Il développe épaules et triceps, et tout le corps doit se gainer pour la tenir.",
    mistakes: [
      ["Trop se pencher en arrière", "Serrez les fessiers et gainez, pour garder le corps aligné."],
      [
        "Barre qui contourne le visage",
        "Reculez le menton, poussez droit vers le haut, puis passez la tête dessous une fois la barre passée.",
      ],
      ["Coudes écartés au départ", "Partez coudes légèrement devant la barre."],
    ],
    sets: ["**Force :** 3 à 5 séries de 3 à 6.", "**Muscle :** 3 séries de 6 à 10."],
    variations: [
      ["db-shoulder-press", "Assis, aux haltères : plus doux pour le bas du dos."],
      ["push-press", "Un peu d’impulsion des jambes pour des charges plus lourdes."],
      ["landmine-press", "Un développé en angle pour les épaules sensibles."],
    ],
    faq: [
      [
        "Pourquoi mon développé militaire stagne-t-il si souvent ?",
        "C’est un mouvement plus petit, donc les sauts de charge sont relativement grands. Prenez de petits disques ou ajoutez des répétitions avant la charge. Voir [linear vs double progression](/blog/linear-vs-double-progression/).",
      ],
      ["Debout ou assis ?", "Debout entraîne aussi le tronc ; assis laisse les épaules pousser plus. Les deux fonctionnent."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "Le développé épaules aux haltères pousse deux haltères au-dessus de la tête, en général assis avec un dossier. Il développe l’avant et le côté des épaules en chargeant moins le bas du dos qu’un développé debout à la barre.",
    mistakes: [
      ["Dossier tout droit", "Réglez-le juste avant la verticale pour que le dos soit soutenu."],
      ["Descendre trop peu", "Ramenez les haltères à hauteur des oreilles ou du menton."],
      ["Entrechoquer les haltères", "Poussez vers le haut et légèrement vers l’intérieur, en vous arrêtant avant qu’ils se touchent."],
    ],
    sets: ["**Muscle :** 3 séries de 6 à 12."],
    variations: [
      ["db-arnold-press", "Rotation des paumes pour plus d’avant d’épaule."],
      ["machine-shoulder-press", "Une trajectoire guidée pour pousser fort en sécurité."],
      ["overhead-press", "À la barre, debout."],
    ],
    faq: [
      ["Assis ou debout ?", "Assis permet de pousser plus ; debout entraîne l’équilibre et le tronc."],
      [
        "Paumes vers l’avant ou face à face ?",
        "Un peu tournées vers l’intérieur, c’est plus confortable pour beaucoup d’épaules. Faites ce qui vous convient.",
      ],
    ],
  },
  "lateral-raise": {
    intro:
      "L’élévation latérale monte deux haltères sur les côtés. Elle isole le deltoïde latéral, qui donne de la largeur aux épaules et que les développés travaillent peu.",
    mistakes: [
      ["Lancer la charge", "Prenez une charge que vous montez sans vous pencher ni hausser les épaules."],
      ["Hausser les épaules", "Pensez à pousser les haltères vers l’extérieur, loin de vous, pas vers le haut."],
      ["Trop lourd", "Des charges légères pour 12 à 20 bonnes répétitions valent mieux que des répétitions lourdes et lancées."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 12 à 20, deux ou trois fois par semaine."],
    variations: [
      ["cable-lateral-raise", "Tension constante, un bras à la fois."],
      ["lean-away-lateral-raise", "En se tenant à un poteau pour plus d’amplitude."],
      ["machine-lateral-raise", "Une trajectoire guidée, facile à pousser à l’échec."],
    ],
    faq: [
      [
        "Quelle charge pour les élévations latérales ?",
        "Légère. La plupart utilisent des haltères de 4 à 10 kg pour de bonnes répétitions.",
      ],
      ["Jusqu’où monter ?", "À peu près à hauteur d’épaule. Plus haut fait entrer les trapèzes."],
    ],
  },
  "face-pull": {
    intro:
      "Le face pull tire une corde sur une poulie haute vers le visage, mains écartées. Il travaille l’arrière des épaules et le haut du dos, qui équilibrent les poussées et aident la posture.",
    mistakes: [
      ["Tirer avec le bas du dos", "Restez droit et gainé ; penchez-vous seulement un peu en arrière."],
      ["Mains trop basses", "Tirez vers le front ou les yeux, mains finissant à côté des oreilles."],
      ["Trop lourd", "Prenez une charge qui permet une pause en fin de répétition."],
    ],
    sets: ["**Muscle et santé des épaules :** 2 à 3 séries de 12 à 20."],
    variations: [
      ["band-face-pull", "Avec un élastique, à la maison."],
      ["rear-delt-fly", "Aux haltères, penché en avant."],
      ["reverse-pec-deck", "Une machine à trajectoire guidée."],
    ],
    faq: [
      [
        "Les face pulls sont-ils bons pour les épaules ?",
        "Ils travaillent l’arrière des épaules et le haut du dos, qui équilibrent les poussées. Beaucoup en font à chaque séance du haut du corps.",
      ],
      ["Corde ou barre ?", "La corde laisse les mains s’écarter en fin de mouvement, ce qui travaille plus l’arrière des épaules."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "L’oiseau se penche en avant et monte deux haltères sur les côtés. Il isole l’arrière des épaules, que la plupart des développés et même des rowings travaillent peu.",
    mistakes: [
      ["En faire un rowing", "Gardez une légère flexion fixe des coudes et bougez aux épaules."],
      ["Serrer les omoplates", "Laissez les épaules faire le travail ; les omoplates restent assez immobiles."],
      ["Trop lourd", "Des charges très légères et contrôlées fonctionnent le mieux."],
    ],
    sets: ["**Muscle :** 3 séries de 12 à 20."],
    variations: [
      ["reverse-pec-deck", "Une machine, plus facile à garder strict."],
      ["cable-rear-delt-fly", "Aux poulies pour une tension constante."],
      ["face-pull", "Un tirage qui travaille aussi le haut du dos."],
    ],
    faq: [
      ["Assis ou debout ?", "Assis poitrine sur les genoux, ou poitrine sur un banc incliné, aide à rester strict."],
      [
        "Pourquoi travailler l’arrière des épaules ?",
        "Il complète l’épaule et équilibre toutes les poussées de la plupart des programmes.",
      ],
    ],
  },
  "pull-up": {
    intro:
      "La traction pronation se suspend à une barre, paumes vers l’avant, et monte le menton au-dessus. C’est l’exercice de dos au poids du corps par excellence : grands dorsaux, haut du dos et biceps.",
    mistakes: [
      ["Kipping ou balancement", "Partez de chaque répétition suspendu et immobile."],
      ["Demi-répétitions", "Allez des bras tendus au menton au-dessus de la barre."],
      ["Hausser les épaules en haut", "Tirez les épaules vers le bas et l’arrière pendant la traction."],
    ],
    sets: [
      "**Muscle :** 3 à 4 séries, en s’arrêtant une ou deux répétitions avant l’échec.",
      "**Trop facile ?** Ajoutez du poids avec une ceinture ou un haltère entre les pieds.",
    ],
    variations: [
      ["negative-pull-up", "Sautez en haut et descendez lentement, la première étape."],
      ["band-assisted-pull-up", "Un élastique porte une partie de votre poids."],
      ["chin-up", "Paumes vers vous : un peu plus facile, plus de biceps."],
      ["neutral-grip-pull-up", "Paumes face à face, doux pour les coudes."],
    ],
    faq: [
      [
        "Comment réussir ma première traction ?",
        "Négatives lentes, répétitions assistées par élastique et tirages verticaux, trois fois par semaine. La plupart y arrivent en quelques mois.",
      ],
      [
        "Traction ou tirage vertical ?",
        "Les deux travaillent les dorsaux. Les tractions sollicitent aussi le tronc ; le tirage permet de régler n’importe quelle charge.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "La traction supination se suspend à une barre, paumes vers vous, et monte le menton au-dessus. Elle travaille les dorsaux et davantage les biceps que la traction pronation, et la plupart en font quelques-unes de plus.",
    mistakes: [
      ["Ne pas aller en suspension complète", "Tendez les bras en bas de chaque répétition."],
      ["Tendre le menton", "Amenez la poitrine vers la barre plutôt que de tendre le cou."],
      ["Se balancer", "Jambes immobiles et tronc gainé."],
    ],
    sets: ["**Muscle :** 3 à 4 séries, en s’arrêtant une ou deux répétitions avant l’échec."],
    variations: [
      ["pull-up", "Paumes vers l’avant : plus de haut du dos."],
      ["reverse-grip-pulldown", "La même prise à la machine."],
      ["negative-pull-up", "Descente lente pour y arriver."],
    ],
    faq: [
      [
        "Supination ou pronation ?",
        "La supination sollicite plus les biceps et est un peu plus facile ; la pronation plus le haut du dos. Les deux construisent les dorsaux.",
      ],
      ["Quel écartement ?", "À peu près largeur d’épaules."],
    ],
  },
  "lat-pulldown": {
    intro:
      "Le tirage vertical tire une barre d’une poulie haute jusqu’au haut de la poitrine. Il travaille les dorsaux comme une traction mais vous laisse choisir la charge : tout le monde peut le faire.",
    mistakes: [
      ["Trop se pencher en arrière", "Penchez-vous seulement un peu et gardez la poitrine haute."],
      ["Tirer avec les bras", "Pensez à ramener les coudes vers les flancs."],
      ["Tirer derrière la nuque", "Tirez vers le haut de la poitrine."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 8 à 12."],
    variations: [
      ["close-grip-pulldown", "Une poignée serrée, plus d’amplitude."],
      ["one-arm-cable-pulldown", "Un côté à la fois."],
      ["pull-up", "Au poids du corps."],
    ],
    faq: [
      [
        "Prise large ou serrée ?",
        "Les deux travaillent les dorsaux. Une prise moyenne, un peu plus large que les épaules, convient à la plupart.",
      ],
      ["Le tirage aide-t-il à réussir une traction ?", "Oui, surtout avec des négatives lentes. Voir [back workout](/blog/back-workout/)."],
    ],
  },
  "barbell-row": {
    intro:
      "Le rowing barre se penche en avant et tire une barre vers le ventre. Il développe tout le haut du dos, les dorsaux et l’arrière des épaules, et accepte de lourdes charges.",
    mistakes: [
      ["Se redresser en tirant", "Gardez le buste à un angle fixe, environ 30 à 45 degrés du sol."],
      ["Tirer par à-coups", "Tirez de façon fluide et redescendez sous contrôle."],
      ["Arrondir le bas du dos", "Gainez et gardez le dos plat. Allégez la barre s’il s’arrondit."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 6 à 12.", "**Force :** 3 séries de 5 à 8."],
    variations: [
      ["pendlay-row", "Depuis le sol à chaque répétition, dos plat."],
      ["chest-supported-row", "Aucune contrainte sur le bas du dos."],
      ["db-row", "Un bras à la fois avec appui."],
    ],
    faq: [
      [
        "Prise pronation ou supination ?",
        "La pronation travaille plus le haut du dos ; la supination plus les dorsaux et les biceps. Les deux conviennent.",
      ],
      [
        "Pourquoi le rowing me fait mal au bas du dos ?",
        "Le buste n’est pas soutenu. Prenez moins de charge, ou passez à un rowing poitrine appuyée.",
      ],
    ],
  },
  "db-row": {
    intro:
      "Le rowing haltère à un bras appuie une main et un genou sur un banc et tire l’haltère vers la hanche. Il travaille dorsaux et haut du dos un côté à la fois, dos soutenu.",
    mistakes: [
      ["Pivoter pour monter", "Gardez épaules et hanches parallèles au sol."],
      ["Tirer vers la poitrine", "Tirez vers la hanche pour travailler les dorsaux."],
      ["Amplitude courte", "Laissez l’haltère pendre tout en bas pour un étirement à chaque répétition."],
    ],
    sets: ["**Muscle :** 3 séries de 8 à 12 par bras."],
    variations: [
      ["db-chest-supported-row", "Les deux bras, poitrine sur un banc incliné."],
      ["kb-row", "Avec un kettlebell."],
      ["seal-row", "Allongé sur un banc haut : très strict."],
    ],
    faq: [
      ["Faut-il un banc ?", "Avec un banc c’est plus simple. Sans, appuyez une main sur une chaise solide ou sur votre genou."],
      ["Quelle charge pour le rowing haltère ?", "Assez pour que les deux dernières répétitions soient dures sans pivoter."],
    ],
  },
  "seated-cable-row": {
    intro:
      "Le tirage horizontal assis tire une poignée vers le ventre depuis une poulie basse, assis. Il travaille le haut du dos et les dorsaux avec une tension constante et sans charge sur le bas du dos.",
    mistakes: [
      ["Se balancer d’avant en arrière", "Gardez le buste immobile, en vous penchant seulement un peu en arrière à la fin."],
      ["Hausser les épaules", "Ramenez les omoplates en arrière et vers le bas, pas vers le haut."],
      ["Revenir trop vite", "Laissez les bras se tendre sous contrôle et sentez l’étirement."],
    ],
    sets: ["**Muscle :** 3 à 4 séries de 8 à 15."],
    variations: [
      ["cable-row-wide", "Une barre large : plus de haut du dos."],
      ["single-arm-cable-row", "Un côté à la fois."],
      ["machine-row", "Une machine poitrine appuyée."],
    ],
    faq: [
      ["Quelle poignée choisir ?", "Le triangle serré cible plus les dorsaux ; la barre large, le haut du dos. Alternez avec le temps."],
      ["Faut-il se pencher en avant ?", "Un peu au départ pour l’étirement, puis restez droit en tirant."],
    ],
  },
  "barbell-curl": {
    intro:
      "Le curl barre monte une barre des cuisses jusqu’aux épaules. C’est l’exercice de biceps classique, et le curl qui permet le plus de charge.",
    mistakes: [
      ["Se balancer avec le dos", "Restez droit, coudes le long du corps. Allégez la barre si vous devez vous balancer."],
      ["Coudes qui avancent", "Gardez-les près du corps pendant toute la répétition."],
      ["Laisser tomber la barre", "Redescendez-la sous contrôle en deux ou trois secondes."],
    ],
    sets: ["**Muscle :** 2 à 4 séries de 8 à 12."],
    variations: [
      ["ez-curl", "Une barre coudée, plus douce pour les poignets."],
      ["db-curl", "Chaque bras travaille seul."],
      ["drag-curl", "Remonte la barre le long du corps pour plus de pic du biceps."],
    ],
    faq: [
      ["Barre droite ou barre EZ ?", "La barre EZ est plus douce pour les poignets. La barre droite sollicite un peu plus les biceps."],
      [
        "Combien de curls faire ?",
        "Environ 6 à 12 séries dures de biceps par semaine, en comptant tractions et rowings. Voir [arm workout](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "Le curl haltères monte un haltère dans chaque main. Chaque bras travaille seul et vous pouvez tourner les paumes vers le haut en montant, ce qui travaille complètement le biceps.",
    mistakes: [
      ["Se balancer", "Coudes le long du corps et corps immobile."],
      ["Tourner trop tard", "Partez paumes vers l’intérieur et tournez-les vers le haut en montant."],
      ["Amplitude courte", "Tendez complètement les bras en bas."],
    ],
    sets: ["**Muscle :** 2 à 4 séries de 8 à 15."],
    variations: [
      ["incline-db-curl", "Sur banc incliné pour un long étirement."],
      ["hammer-curl", "Paumes vers l’intérieur : plus d’avant-bras et de brachial."],
      ["db-preacher-curl", "Bras sur un pupitre pour des répétitions strictes."],
    ],
    faq: [
      [
        "En alterné ou les deux bras ensemble ?",
        "Les deux. L’alterné aide à se concentrer sur chaque bras ; ensemble fait gagner du temps.",
      ],
      ["Debout ou assis ?", "Assis, il est plus difficile de se balancer."],
    ],
  },
  "hammer-curl": {
    intro:
      "Le curl marteau monte les haltères paumes face à face. Il travaille le brachial et les muscles de l’avant-bras plus qu’un curl classique, ce qui épaissit le bras.",
    mistakes: [
      ["Lancer la charge", "Restez droit et gardez les coudes immobiles."],
      ["Tourner les paumes", "Gardez les paumes face à face pendant toute la répétition."],
      ["Aller trop vite", "Redescendez sous contrôle."],
    ],
    sets: ["**Muscle :** 2 à 3 séries de 8 à 15."],
    variations: [
      ["rope-hammer-curl", "À la poulie avec une corde."],
      ["incline-hammer-curl", "Sur banc incliné pour l’étirement."],
      ["reverse-curl", "Paumes vers le bas pour les avant-bras."],
    ],
    faq: [
      [
        "Curl marteau ou curl classique ?",
        "Faites les deux : le classique pour les biceps, le marteau pour le brachial et les avant-bras.",
      ],
      [
        "En travers du corps ou droit ?",
        "Les deux fonctionnent. En travers du corps est une variante courante que certains trouvent plus confortable.",
      ],
    ],
  },
  "cable-pushdown": {
    intro:
      "L’extension triceps à la poulie pousse une barre ou une corde vers le bas depuis une poulie haute. Elle isole les triceps, s’apprend vite, ménage les coudes et progresse facilement.",
    mistakes: [
      ["Coudes qui bougent", "Collez les coudes aux flancs ; seuls les avant-bras bougent."],
      ["Se pencher sur la charge", "Restez droit avec une légère inclinaison, sans vous voûter."],
      ["Amplitude courte", "Tendez complètement en bas et laissez les avant-bras remonter au-delà de l’horizontale."],
    ],
    sets: ["**Muscle :** 2 à 4 séries de 10 à 15."],
    variations: [
      ["rope-pushdown", "La corde laisse les mains s’écarter en bas."],
      ["cable-overhead-extension", "Au-dessus de la tête : la longue portion du triceps."],
      ["reverse-grip-pushdown", "Paumes vers le haut, une autre sensation."],
    ],
    faq: [
      ["Corde ou barre ?", "La barre permet plus de charge ; la corde laisse les mains s’écarter. Les deux conviennent."],
      [
        "Faut-il aussi un exercice au-dessus de la tête ?",
        "Une extension au-dessus de la tête travaille la longue portion du triceps en étirement, ce qui peut construire plus de muscle.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "Les barres au front descendent une barre EZ vers le front, allongé sur un banc, puis tendent les bras. Elles travaillent les trois portions du triceps avec un bon étirement.",
    mistakes: [
      ["Coudes qui s’écartent", "Gardez-les pointés vers le plafond, à largeur d’épaules."],
      ["Descendre sur le front", "Descendez vers le sommet du crâne ou juste derrière, pour plus d’étirement et moins de risque."],
      ["Trop lourd", "Choisissez une charge que vous contrôlez jusqu’en bas."],
    ],
    sets: ["**Muscle :** 2 à 3 séries de 8 à 12."],
    variations: [
      ["db-skull-crusher", "Aux haltères, plus doux pour les poignets."],
      ["incline-skull-crusher", "Sur banc incliné pour un étirement plus long."],
      ["jm-press", "Entre barre au front et développé serré."],
    ],
    faq: [
      [
        "Les barres au front sont-elles mauvaises pour les coudes ?",
        "Elles gênent certains coudes. Allégez, essayez les haltères ou passez à la poulie si ça fait mal.",
      ],
      ["Barre EZ ou droite ?", "La barre EZ est plus douce pour les poignets."],
    ],
  },
  "close-grip-bench": {
    intro:
      "Le développé couché prise serrée est un développé couché mains à largeur d’épaules. Il déplace plus de travail vers les triceps tout en permettant de charger lourd.",
    mistakes: [
      ["Prise trop serrée", "À peu près largeur d’épaules. Mains collées, les poignets souffrent."],
      ["Coudes écartés", "Gardez-les rentrés près des flancs."],
      ["Toucher trop haut", "Descendez sur le bas de la poitrine."],
    ],
    sets: ["**Force :** 3 à 4 séries de 5 à 8.", "**Muscle :** 3 séries de 8 à 12."],
    variations: [
      ["bench-press", "Une prise plus large, plus de pectoraux."],
      ["db-close-press", "Haltères serrés l’un contre l’autre."],
      ["diamond-push-up", "La version au poids du corps."],
    ],
    faq: [
      ["Pectoraux ou triceps ?", "Les deux, avec plus de triceps qu’un développé couché classique."],
      ["Combien de moins que mon développé couché ?", "En général 10 à 15 % de moins."],
    ],
  },
  "preacher-curl": {
    intro:
      "Le curl au pupitre pose le haut des bras sur un pupitre incliné et monte une barre EZ. Le pupitre empêche de se balancer et charge fort le biceps en bas, dans l’étirement.",
    mistakes: [
      ["Ne pas aller jusqu’à l’étirement", "Descendez jusqu’à ce que les bras soient presque tendus, sous contrôle."],
      ["Décoller les coudes du pupitre", "Gardez le haut des bras à plat sur le pupitre."],
      ["Se laisser tomber en bas", "Ralentissez la fin de la descente, là où se trouve l’étirement."],
    ],
    sets: ["**Muscle :** 2 à 3 séries de 8 à 12."],
    variations: [
      ["db-preacher-curl", "Un bras à la fois avec un haltère."],
      ["machine-preacher-curl", "Une trajectoire guidée, facile à pousser fort."],
      ["cable-preacher-curl", "De la tension aussi en haut."],
    ],
    faq: [
      [
        "Le curl au pupitre est-il meilleur que le curl debout ?",
        "Il est plus strict et charge davantage la position étirée. Les deux construisent les biceps.",
      ],
      ["Pourquoi ça fait mal en bas ?", "Allégez et ralentissez. Ne verrouillez pas complètement si les coudes protestent."],
    ],
  },
};
