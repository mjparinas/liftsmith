import type { FeaturesText } from "./types";

// The features page in French (vous). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.
// A no-break space goes before ? ! : % and inside « », as French typography asks.

export const fr: FeaturesText = {
  chrome: {
    title: "Fonctionnalités de {name} et compatibilité",
    description:
      "Toutes les fonctionnalités de {name}, celles qui sont gratuites, les plus récentes, et un tableau des montres, applis santé, balances et services compatibles sur Android, iPhone et le Web.",
    crumb: "Fonctionnalités",
    h1: "Toutes les fonctionnalités de {name}",
    intro:
      "Les {count} fonctionnalités, celles qui sont gratuites, ce qui marche avec quoi et les nouveautés. Presque tout est gratuit ; consultez les {pricing} pour voir ce qu’ajoute Pro.",
    pricing: "tarifs",
    onThisPage: "Sur cette page",
    newestNav: "Nouveautés",
    worksWithNav: "Compatibilité",
    newestH: "Les plus récentes",
    newestIntro: "Ajoutées récemment, par catégorie. Chaque changement, correctifs compris, est dans {whatsNew}.",
    whatsNew: "Quoi de neuf",
    midTitle: "Voyez par vous-même",
    midBody: "Gratuit, sans compte. Votre première séance est planifiée en moins d’une minute.",
    midButton: "Commencer gratuitement",
    worksH: "Ce avec quoi {name} fonctionne",
    worksIntro:
      "Applis, montres et appareils, et où chacun fonctionne. « Via Santé » signifie que les données arrivent dans {name} par Health Connect sur Android ou Apple Santé sur iPhone. « Chrome » désigne l’appli Web dans Chrome, qui gère le Web Bluetooth.",
    tableLabel: "Tableau de compatibilité",
    cols: { connection: "Connexion", does: "Ce qu’elle fait", android: "Android", iphone: "iPhone", web: "Web", plan: "Offre" },
    footnote:
      "« Bientôt » signifie que c’est prêt et attend sa fiche sur la boutique. « À l’étude » signifie que nous y travaillons sans pouvoir le promettre, car cela dépend de l’accord de l’autre entreprise. Les services de fitness se connectent via un compte {name} gratuit. Les Labs sont des expériences de Pro à activer dans Réglages › Labs. Les noms de produits sont des marques de leurs propriétaires.",
    endTitle: "Commencez gratuitement, sans compte",
    endBody: "Votre première séance est planifiée en moins d’une minute. Jamais de pub.",
  },
  tiers: { free: "Gratuit", pro: "Pro", both: "Gratuit + Pro", lab: "Labs (Pro)" },
  where: { all: "Android, iPhone et Web", phones: "Applis Android et iPhone" },
  support: { yes: "Oui", no: "Non", soon: "Bientôt", investigating: "À l’étude", chrome: "Chrome", health: "Via Santé" },
  groups: {
    plan: {
      title: "Un plan qui s’adapte",
      intro:
        "La séance du jour est construite d’après votre salle, votre récupération et votre bloc d’entraînement, et chaque chiffre dit pourquoi.",
    },
    workout: { title: "La séance", intro: "Une touche valide une série comme prévu. Tout le reste attend votre repos." },
    progress: {
      title: "Progrès et coaching",
      intro: "D’abord quoi faire ensuite. Les chiffres apparaissent quand vous pouvez agir dessus.",
    },
    body: {
      title: "Corps et santé",
      intro: "Pesées, masse grasse et données de santé arrivent seules quand c’est possible, et deviennent des conseils.",
    },
    programs: {
      title: "Programmes, routines et exercices",
      intro: "Suivez un programme classique, créez vos routines ou laissez l’appli planifier. Le tout depuis une seule bibliothèque.",
    },
    gyms: { title: "Salles et matériel", intro: "Chaque plan part du matériel que vous avez vraiment." },
    friends: { title: "Amis et partage", intro: "Entraînez-vous avec des gens, pas pour un public. Amis est gratuit." },
    coaches: { title: "Pour les coachs", intro: "Être le client de quelqu’un est gratuit pour tous." },
    fun: { title: "Récompenses", intro: "Un peu de jeu qui ne gêne jamais une série." },
    phone: { title: "Sur votre téléphone et votre poignet", intro: "Liftsmith tire parti de ce que chaque téléphone fait de mieux." },
    data: { title: "Vos données", intro: "Fonctionne hors ligne, sans compte, et vos données restent à vous." },
    access: {
      title: "Apparence, confort et langues",
      intro: "Confortable pour tous, d’une main à la salle ou sur un grand écran à la maison.",
    },
    labs: {
      title: "Labs",
      intro: "Des expériences que les membres Pro activent dans Réglages › Labs. Elles peuvent changer ou disparaître.",
    },
  },
  features: {
    adaptive: {
      name: "Séances adaptatives quotidiennes",
      body: "Choisit des exercices que votre salle permet et pour lesquels vos muscles sont prêts, puis fixe chaque charge et chaque répétition d’après vos dernières séances.",
      proPart: "Sans Pro, vous avez une séance adaptative par semaine en plus de votre programme gratuit ; Pro planifie chaque jour.",
    },
    splits: {
      name: "Splits adaptatifs",
      body: "Poussée, tirage, jambes ou haut et bas du corps, toujours ajustés à votre récupération chaque jour.",
    },
    readiness: {
      name: "La décision du jour",
      body: "À fond, comme prévu ou en douceur, selon votre récupération, les répétitions manquées et la difficulté de vos dernières séries. Vous pouvez toujours la changer.",
    },
    "health-readiness": {
      name: "Le sommeil et la VFC orientent la décision",
      body: "Le sommeil, la variabilité de la fréquence cardiaque, le pouls au repos et la fréquence respiratoire de l’appli santé de votre téléphone font monter ou baisser la décision du jour.",
    },
    blocks: {
      name: "Blocs d’entraînement et décharges",
      body: "Des blocs de quatre semaines avec un objectif de répétitions en réserve qui mènent à une semaine plus légère, pour progresser sans vous épuiser.",
    },
    why: {
      name: "Chaque recommandation dit pourquoi",
      body: "Chaque exercice, nombre de séries, objectif de répétitions et charge porte une courte raison, affichée à l’écran, jamais cachée derrière une touche.",
    },
    "short-on-time": {
      name: "Peu de temps",
      body: "Dites à la séance que vous avez moins de temps et elle retire ce qui compte le moins.",
      proPart: "Contourner un banc ou un rack occupé par quelqu’un d’autre est réservé à Pro.",
    },
    injury: {
      name: "Mode blessure",
      body: "Indiquez ce qui fait mal : l’appli écarte ce qui l’aggraverait, vous avertit des mouvements à risque et suit une douleur de 0 à 10 dans le temps.",
    },
    cycle: { name: "Forme selon le cycle", body: "Si vous le souhaitez, notez votre cycle et la décision du jour en tient compte." },
    "goal-planner": {
      name: "Planificateur d’objectifs",
      body: "Choisissez un mouvement et une cible : l’appli calcule une date réaliste et le chemin pour y arriver.",
    },
    logger: {
      name: "Valider une série d’une touche",
      body: "La série suivante est toujours préremplie. Des boutons qui se répètent quand on les maintient changent la charge et les répétitions ; la saisie n’est qu’un recours.",
    },
    "rest-timer": {
      name: "Minuteur de repos sur l’écran verrouillé",
      body: "Il démarre seul après chaque série et décompte sur l’écran verrouillé avec la série suivante, les disques, le pouls et des boutons Valider la série et +30 s qui marchent appli fermée.",
      note: "Android : une notification permanente, une Live Update sur Android 16 et la Now Bar de Samsung. iPhone : une Activité en direct sur l’écran verrouillé et dans la Dynamic Island. Web : une notification tant que la page est ouverte.",
    },
    plates: {
      name: "Calcul des disques",
      body: "Montre quels disques mettre de chaque côté, calculé avec les disques de votre salle, chaque taille dans sa couleur.",
    },
    warmups: {
      name: "Séries d’échauffement",
      body: "Des séries de montée calculées pour chaque mouvement lourd, pour arriver prêt à votre charge de travail.",
    },
    demos: {
      name: "Démonstrations d’exercices en 3D",
      body: "Chaque exercice a une silhouette 3D qui montre le mouvement avec son matériel, avec les étapes de mise en place et des consignes.",
    },
    "set-types": {
      name: "Séries dégressives et rest-pause",
      body: "Ajoutez une série dégressive ou une série rest-pause entre les séries.",
    },
    "timed-sets": {
      name: "Minuteur pour gainages, portés et cardio",
      body: "Les exercices chronométrés comme la planche, les portés, les suspensions et le cardio ont un minuteur de série, aussi sur l’écran verrouillé et les montres.",
    },
    "each-side": {
      name: "Par côté et par main",
      body: "Les exercices faits un côté à la fois l’indiquent, et la charge des haltères est affichée par main.",
    },
    swaps: {
      name: "Remplacer un exercice",
      body: "Remplacez n’importe quel exercice par un autre qui travaille les mêmes muscles avec le matériel de votre salle.",
    },
    "heart-rate": {
      name: "Fréquence cardiaque en direct",
      body: "Connectez une ceinture cardio Bluetooth ou votre montre et voyez votre pouls à chaque série et chaque repos.",
      note: "Web : Chrome uniquement.",
    },
    breathing: {
      name: "Respiration carrée pendant le repos",
      body: "Un guide de respiration sur l’écran de repos, avec des préréglages ou votre propre rythme.",
    },
    "voice-coach": {
      name: "Coach vocal",
      body: "Il parle pendant la séance, par exemple à la fin du repos, pour que vous n’ayez pas à regarder le téléphone.",
      note: "Android annonce la fin du repos écran verrouillé ; l’iPhone et le Web tant que l’appli est ouverte.",
    },
    stretching: {
      name: "Étirements",
      body: "48 étirements avec démonstrations en 3D : un échauffement facultatif avant, un retour au calme après, ou une routine d’étirements n’importe quel jour.",
    },
    notes: {
      name: "Notes du coach",
      body: "Signale une fatigue qui s’accumule, un mouvement qui stagne, un muscle qui manque de séries, un objectif de la semaine menacé ou une masse grasse qui grimpe, chaque fois avec une chose à faire, souvent en une touche.",
    },
    plateau: {
      name: "Détective des plateaux",
      body: "Quand un mouvement stagne, il donne la cause probable et un correctif de trois semaines en une touche, puis vous dit s’il a marché.",
    },
    "recovery-map": {
      name: "Carte de récupération",
      body: "Vos muscles s’illuminent sur une silhouette 3D selon leur récupération. Touchez-en un pour voir ce que cela veut dire pour aujourd’hui.",
    },
    "advanced-stats": {
      name: "Statistiques avancées",
      body: "Séries par muscle et par semaine face à l’objectif, courbes du maximum sur une répétition et la direction de chaque mouvement.",
    },
    bests: {
      name: "Records personnels et historique",
      body: "Chaque record, maximum estimé sur une répétition, score de force et séance passée, sans limite d’historique.",
    },
    "calendar-history": {
      name: "Calendrier des séances",
      body: "Un calendrier mensuel des séances passées dans Progrès, avec le nom de chaque jour.",
    },
    "edit-history": {
      name: "Modifier les séances passées et les refaire",
      body: "Corrigez une série, ajoutez une note, nommez une séance ou refaites-la, et chaque mouvement a sa page avec son historique.",
    },
    "log-past": {
      name: "Saisir une séance passée",
      body: "Téléphone oublié ? Saisissez la séance après coup : elle compte comme les autres.",
    },
    recap: { name: "Bilan du mois", body: "Un court retour sur votre mois, prêt à partager." },
    body: {
      name: "Pesées, masse grasse et photos",
      body: "Notez votre poids et votre masse grasse, ou laissez-les venir de votre balance via l’appli santé du téléphone, et gardez vos photos de progrès sur votre téléphone.",
    },
    measurements: {
      name: "Mensurations",
      body: "Neuf zones en centimètres ou en pouces. Un tour de taille qui augmente ou diminue devient une note du coach quand il n’y a pas de mesure de masse grasse.",
    },
    "body-figure": {
      name: "Une silhouette 3D à votre forme",
      body: "Activez-la et la silhouette de Santé prend votre gabarit d'après votre taille, poids, masse grasse et mensurations.",
    },
    "health-twin": {
      name: "Jumeau santé et âge physique",
      body: "Sommeil, VFC, pouls au repos, pas, fréquence respiratoire et VO₂ max au même endroit, avec votre tendance et un âge physique tiré de votre VO₂ max.",
      note: "Les données de santé viennent de Health Connect sur Android et d’Apple Santé sur iPhone. L’appli Web affiche les pesées, la masse grasse, l’IMC et les calories.",
    },
    "fitness-tests": {
      name: "Tests de forme",
      body: "Suspension à la barre, équilibre sur une jambe et lever de chaise en 30 secondes, chacun avec un minuteur, une plage habituelle et ce qui aide.",
    },
    food: {
      name: "Notes du coach d’après votre appli de nutrition",
      body: "Les calories et protéines notées dans une appli de nutrition arrivent dans Liftsmith via l’appli santé du téléphone et deviennent des notes comme « protéines insuffisantes trois jours de suite ». L’appli ne fait pas de suivi alimentaire.",
    },
    "your-stats": {
      name: "Vos données",
      body: "Un seul endroit pour le sexe, l’âge et la taille, lu par tous les outils, rempli depuis Apple Santé sur iPhone.",
    },
    "fixed-programs": {
      name: "Programmes classiques",
      body: "5×5 classique, 3×5 débutant, 5×5 avec bras, 5×5 progressif, progression par paliers, vagues de maximum d’entraînement, figures au poids du corps et corps entier aux haltères. Le programme gratuit s’adapte à votre salle.",
    },
    routines: {
      name: "Vos propres routines",
      body: "Créez des routines depuis le catalogue d’exercices, sans limite de nombre, et partagez-les par lien.",
    },
    library: {
      name: "1 000 exercices",
      body: "Force, poids du corps, machines, élastiques, kettlebells et cardio, avec recherche, filtres par muscle et un filtre pour cette salle. Le cardio enregistre la durée et la distance.",
    },
    remix: { name: "Liens de séance", body: "Envoyez une séance à un ami sous forme de lien qu’il peut faire lui-même." },
    gyms: {
      name: "Vos salles et leur matériel",
      body: "Configurez chaque salle une fois : barres, disques, haltères et kettlebells tels qu’ils sont, machines et leurs réglages.",
    },
    "gym-location": { name: "Salle selon le lieu", body: "Choisit la bonne salle quand vous arrivez." },
    "gym-share": {
      name: "Partager le matériel d’une salle",
      body: "Envoyez le matériel de votre salle par lien, pour qu’un partenaire d’entraînement démarre avec le même équipement.",
    },
    "gym-finder": {
      name: "Recherche de salles et pages de salle",
      body: "Trouvez des salles près de chez vous, les officielles d’abord, chacune avec sa page : matériel, horaires, carte et membres. Les gérants peuvent revendiquer leur salle et ajouter un logo et des photos. Une salle manque ? Ajoutez-la. Les gérants voient combien de sportifs l’ont ajoutée ou ont scanné l’affiche, et quoi faire ensuite. Les salles officielles peuvent animer un club avec un classement hebdomadaire.",
    },
    "buy-next": {
      name: "Quoi acheter ensuite",
      body: "Pour les salles à la maison : l’équipement qui ouvrirait le plus d’exercices.",
    },
    feed: {
      name: "Fil des amis",
      body: "Suivez des gens et voyez leurs séances, avec j’aime, commentaires, réponses et @mentions, et choisissez qui voit chacune des vôtres.",
    },
    cheers: {
      name: "En séance maintenant et encouragements",
      body: "Voyez qui s’entraîne en ce moment et envoyez un encouragement qui flotte sur son écran de séance.",
    },
    challenges: {
      name: "Défis, clubs et classements",
      body: "Défiez un ami, rejoignez un club ou l’équipe de votre salle avec un classement hebdomadaire, et relevez le défi du mois avec tout le monde.",
    },
    profiles: { name: "Profils publics", body: "Une page publique facultative avec vos meilleures charges et vos séances." },
    share: {
      name: "Cartes et liens de partage",
      body: "Partagez une séance, un nouveau record ou une étape en image, ou en lien public avec aperçu.",
    },
    coaching: {
      name: "Coacher des clients",
      body: "Associez des clients, voyez leurs résultats et attribuez-leur des routines, sur le téléphone ou sur grand écran.",
    },
    "coach-chat": {
      name: "Messages, alertes et données corporelles",
      body: "Écrivez à chaque client, recevez une notification quand il s'entraîne ou n'a pas fait de séance depuis une semaine, et voyez ses pesées, mensurations et une silhouette 3D à sa forme s'il choisit de les partager.",
      note: "Les notifications sont sur Android et iPhone. L'app web affiche les nouveaux messages quand elle est ouverte.",
    },
    "coach-nutrition": {
      name: "Objectifs nutritionnels pour les clients",
      body: "Fixez les calories et protéines quotidiennes de chaque client. Ses notes du coach comparent sa semaine à ces objectifs, et vous voyez comment il mange s'il le partage.",
    },
    awards: {
      name: "Succès, niveaux et séries de jours",
      body: "Badges par paliers, 50 niveaux avec récompenses, quêtes hebdomadaires, gels de série et ligues honnêtes.",
    },
    locker: {
      name: "Thèmes, couleurs et icônes d’appli",
      body: "Gagnez des thèmes et des couleurs d’accent et, sur les téléphones, une icône d’appli aux couleurs de votre thème.",
      note: "Les icônes d’appli gagnées existent sur Android et iPhone seulement.",
    },
    watch: {
      name: "Applis pour montres",
      body: "La séance sur Wear OS et Apple Watch : la série ou le décompte du repos, le pouls de la montre, Valider la série et +30 s, et une vibration à la fin du repos.",
    },
    widgets: {
      name: "Widget d’écran d’accueil",
      body: "La décision du jour, votre objectif de la semaine, une note du coach et Démarrer ou Valider la série sur l’écran d’accueil.",
      note: "L’appli Web propose à la place des raccourcis sur son icône d’accueil.",
    },
    shortcuts: {
      name: "Réglages rapides, Siri et raccourcis",
      body: "Lancez une séance depuis une vignette des Réglages rapides sur Android, ou depuis le Centre de contrôle et Siri sur iPhone.",
    },
    calendar: {
      name: "Calendrier",
      body: "Place vos jours d’entraînement dans votre calendrier et peut raccourcir une séance pour qu’elle tienne avant votre prochaine réunion.",
      note: "L’appli Web télécharge un fichier .ics à la place.",
    },
    reminders: {
      name: "Rappels",
      body: "De petits rappels les jours d’entraînement, en notifications sur les téléphones et par e-mail.",
    },
    cloud: {
      name: "Connexions aux services de fitness",
      body: "Oura envoie sommeil, VFC, pouls au repos et pas, via un compte gratuit. Nous étudions Strava, WHOOP, Withings, Polar et Concept2.",
    },
    "health-save": {
      name: "Séances enregistrées dans votre appli santé",
      body: "Chaque séance terminée est enregistrée dans Health Connect ou Apple Santé comme séance de musculation, avec les calories et le pouls.",
    },
    offline: {
      name: "Fonctionne hors ligne",
      body: "Tout tourne sur votre appareil : pas de réseau au sous-sol de la salle, pas de souci.",
    },
    sync: {
      name: "Comptes et synchronisation",
      body: "Une connexion facultative avec Google, Apple ou un code par e-mail garde votre téléphone, votre tablette et l’appli Web à jour.",
    },
    backup: {
      name: "Sauvegarde et export",
      body: "Enregistrez un fichier de sauvegarde ou exportez vos séances en tableur quand vous voulez.",
    },
    import: {
      name: "Importer depuis une autre appli",
      body: "Récupérez votre historique depuis Strong, Hevy, Fitbod, StrongLifts, JEFIT ou FitNotes grâce à leur fichier d’export, cardio compris.",
    },
    importExtras: {
      name: "Routines et mesures corporelles d’une autre appli",
      body: "Un import transforme en routines les séances répétées sous le même nom, et récupère le poids, la masse grasse et les mensurations de Hevy, FitNotes ou d’une appli de balance.",
    },
    languages: {
      name: "Six langues",
      body: "Anglais, espagnol, français, allemand, italien et japonais, selon la langue de votre téléphone.",
    },
    appearance: {
      name: "Sombre, clair ou comme votre téléphone",
      body: "Un thème sombre par défaut, un thème clair, ou celui de votre téléphone.",
    },
    a11y: {
      name: "Accessibilité",
      body: "Texte agrandi jusqu’à 150 %, couleurs adaptées au daltonisme, plus de contraste, lecteur d’écran et usage complet au clavier, vérifiés selon WCAG 2.2 AA.",
    },
    "one-hand": {
      name: "Commandes à une main",
      body: "Placez les boutons de charge et de répétitions à côté de Valider la série, sous votre pouce gauche ou droit.",
    },
    lean: {
      name: "Mode sobre, sons et vibrations",
      body: "Coupez les animations et les confettis, les sons ou les vibrations, chacun avec un interrupteur.",
    },
    "lite-demos": {
      name: "Économie de batterie pour les figures 3D",
      body: "Affichez les démonstrations d'exercices et la carte de récupération avec une résolution et une fréquence d'images plus basses, pour les téléphones anciens et plus d'autonomie.",
    },
    desktop: {
      name: "Affichage ordinateur",
      body: "Sur ordinateur, l’appli Web a une barre latérale, des pages larges, des raccourcis clavier pendant la séance (L valide la série) et un éditeur de routines large.",
      note: "Appli Web dans une fenêtre large avec une souris ; téléphones et tablettes gardent l’affichage téléphone.",
    },
    "lab-rep-count": {
      name: "Comptage des répétitions par caméra",
      body: "Posez votre téléphone et la caméra compte vos répétitions, avec le squelette dessiné sur l’image. Rien ne quitte votre téléphone.",
    },
    "lab-bar-speed": {
      name: "Vitesse de barre par caméra",
      body: "Montre la vitesse de la barre et quand elle a assez ralenti pour arrêter la série.",
    },
    "lab-form": {
      name: "Contrôle de la technique par caméra",
      body: "Repère les squats au-dessus de la parallèle, les répétitions écourtées et le penchement d’un côté, et donne un conseil entre les séries.",
    },
    "lab-speed-max": {
      name: "Le max du jour d’après l’échauffement",
      body: "Utilise la vitesse de barre de vos séries d’échauffement pour suggérer une première charge de travail un peu plus lourde ou plus légère.",
    },
    "lab-bar-path": {
      name: "Replay de la trajectoire de barre",
      body: "Rejoue une répétition de squat, de soulevé de terre ou de développé militaire avec la trajectoire de la barre, et une consigne si elle a dévié.",
    },
    "lab-motion": {
      name: "Comptage par les capteurs du téléphone",
      body: "Compte les répétitions avec les capteurs de mouvement du téléphone quand il bouge avec vous.",
      note: "Téléphones et tablettes avec capteurs de mouvement.",
    },
    "lab-watch-reps": {
      name: "Comptage des répétitions par la montre",
      body: "Votre montre Wear OS ou Apple Watch compte les répétitions depuis votre poignet.",
    },
    "lab-hands-free": {
      name: "Séries mains libres",
      body: "Pendant qu’un compteur de répétitions compte, la série se valide seule quelques secondes après votre dernière répétition.",
    },
    "lab-voice": {
      name: "Valider une série à la voix",
      body: "Dites « 100 pour 8 » ou « trop facile » pour valider une série. Reconnu sur votre appareil ; aucun son n’en sort.",
      note: "Web : Chrome 139 ou plus récent.",
    },
    "lab-volume": {
      name: "Le bouton de volume valide une série",
      body: "Appuyez sur volume + du téléphone ou de vos écouteurs pour valider la série.",
    },
    "lab-tempo": {
      name: "Coach de tempo",
      body: "Sur les mouvements avec tempo ou pause, compte la descente, le maintien et la montée de chaque répétition par le son et la vibration.",
    },
    "lab-hr-rest": {
      name: "Repos guidé par le pouls",
      body: "Termine le repos plus tôt une fois votre pouls redescendu, jamais sous 60 % du repos prévu.",
    },
    "lab-machines": {
      name: "Machines de salle Bluetooth",
      body: "Vélos, rameurs, tapis de course et vélos elliptiques remplissent la durée, la distance et la puissance d’une série de cardio.",
      note: "Web : Chrome uniquement.",
    },
    "lab-scale": {
      name: "Balance connectée Bluetooth",
      body: "Montez sur une balance compatible et la pesée se remplit avec votre poids et votre masse grasse, à vérifier puis enregistrer.",
      note: "Web : Chrome uniquement.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Pilotez une enceinte Sonos depuis la séance, avec un volume pour les séries et un autre pour le repos.",
    },
  },
  connectionGroups: {
    health: "Applis santé",
    watches: "Montres et fréquence cardiaque",
    bluetooth: "Matériel Bluetooth (Labs)",
    services: "Services de fitness (compte gratuit requis)",
    music: "Musique et enceintes",
    other: "Calendriers et autres applis",
  },
  connections: {
    "health-connect": {
      does: "Pesées, masse grasse, sommeil, VFC, pouls, pas et alimentation en entrée ; séances terminées en sortie",
    },
    "apple-health": {
      name: "Apple Santé",
      does: "Pesées, masse grasse, sommeil, VFC, pouls, pas, alimentation, taille, âge et sexe en entrée ; séances terminées en sortie",
    },
    "samsung-health": { does: "Ses données, une fois partagées avec Health Connect" },
    "health-devices": {
      name: "Fitbit, Garmin Connect, balances connectées, Hume Body Pod",
      does: "Tout ce qu’ils écrivent dans l’appli santé de votre téléphone",
    },
    "wear-os": { name: "Montres Wear OS", does: "La séance au poignet, le pouls, Valider la série et +30 s" },
    "apple-watch": { does: "La séance au poignet, le pouls, Valider la série et +30 s" },
    garmin: { name: "Montres Garmin (Connect IQ)", does: "La séance au poignet avec l’appli montre Liftsmith" },
    "hr-strap": {
      name: "Ceintures cardio Bluetooth",
      does: "Pouls en direct pendant les séries et le repos (toute ceinture ou brassard qui partage la fréquence cardiaque Bluetooth standard)",
    },
    scale: {
      name: "Balances connectées Bluetooth",
      does: "Poids et masse grasse sur la pesée (balances qui partagent le service standard Weight Scale ou Body Composition)",
      link: "Balances compatibles",
    },
    machines: {
      name: "Machines de salle Bluetooth",
      does: "Durée, distance et puissance des vélos, rameurs, tapis et elliptiques qui partagent le service standard Fitness Machine",
    },
    oura: { does: "Sommeil, VFC, pouls au repos et pas en entrée" },
    strava: { does: "Chaque séance terminée publiée sur Strava" },
    whoop: { does: "Sommeil, récupération, VFC et pouls au repos en entrée" },
    withings: { does: "Pesées, masse grasse, sommeil et pas en entrée" },
    polar: { does: "Nightly Recharge, VFC et sommeil en entrée" },
    concept2: { does: "Sessions RowErg, SkiErg et BikeErg importées comme séances de cardio" },
    sonos: { does: "Lecture, pause, morceau suivant et volume depuis la séance ; la musique suit les séries et le repos" },
    calendar: {
      name: "Calendrier du téléphone (Google, iCloud, Outlook)",
      does: "Jours d’entraînement dans votre calendrier, et séances ajustées autour de vos créneaux occupés",
    },
    ics: { name: "N’importe quel calendrier (fichier .ics)", does: "Jours d’entraînement en fichier de calendrier" },
    import: { does: "Votre historique de séances importé depuis leur fichier d’export", link: "Comment changer d’appli" },
  },
};
