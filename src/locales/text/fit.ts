import type { Message } from "@/lib/i18n";

// Text for keys starting "fit.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "fit.title": "Fitness age",
  "fit.value": "About {age}",
  "fit.floor": "{age} or younger",
  "fit.ceiling": "{age} or older",
  "fit.range": "Likely {low} to {high}, you're {age}",
  "fit.chip.younger": "Fitter than typical for your age",
  "fit.chip.typical": "About typical for your age",
  "fit.chip.older": "Room to build",
  "fit.from": "From your watch's VO₂ max of {vo2} (newest reading {date}). A typical healthy {who} of {age} has about {expected}.",
  "fit.man": "man",
  "fit.woman": "woman",
  "fit.todo.younger":
    "Keep it there: two hard cardio sessions a week, like intervals, hill walks or rowing, hold VO₂ max as the years go by.",
  "fit.todo.typical":
    "Two 20-minute hard cardio sessions a week, like intervals, hill walks or rowing, usually raise VO₂ max within 6 to 8 weeks, and this number comes down with it.",
  "fit.todo.older":
    "This is the number that moves fastest with training. Two 20-minute hard cardio sessions a week, like intervals, hill walks or rowing, usually raise VO₂ max within 6 to 8 weeks. Lifting barely moves it.",
  "fit.strength": {
    one: "Strength training in the last 7 days: {count} day, {minutes} min. Guidelines suggest muscle-strengthening work on 2 or more days a week.",
    other:
      "Strength training in the last 7 days: {count} days, {minutes} min. Guidelines suggest muscle-strengthening work on 2 or more days a week.",
  },
  "fit.score": "Strength score: {score} ({band}), against typical lifters your weight.",
  "fit.seeProgress": "See Progress",
  "fit.how": "How is this worked out?",
  "fit.missing.vo2":
    "Needs a VO₂ max reading from a watch (Apple Watch, Fitbit, Pixel Watch or Garmin) through {source}. Watches record it after outdoor walks or runs.",
  "fit.missing.web": "Comes from your watch's VO₂ max through your phone's health app. Open Liftsmith on your phone to see it.",
  "fit.missing.profile": "Add your age and sex to compare your VO₂ max with healthy people like you.",
  "fit.addProfile": "Add age and sex",
  "fit.disclaimer":
    "A fitness estimate for general wellness. It isn't medical advice and can't tell you about any health condition. If you have concerns about your health, a doctor may be helpful.",
  "fit.how.1": "Your fitness age is the age at which a typical healthy person of your sex has your VO₂ max.",
  "fit.how.2":
    "The typical values come from the HUNT Fitness Study in Norway, which measured VO₂ max on a treadmill in 3,816 healthy adults (Loe and others, 2013). The idea of fitness age comes from the same research group (Nes and others, 2014).",
  "fit.how.3":
    "Your VO₂ max is your watch's estimate, the middle of your last few readings. Watch estimates are often 5 to 15% off a lab test, so the range shows your fitness age if the reading were 8% higher or lower.",
  "fit.how.4":
    "It follows cardio fitness. Intervals, hill walks, rowing and runs raise it; lifting barely changes it, so it isn't a score of your strength training.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "fit.title": "Edad física",
  "fit.value": "Unos {age}",
  "fit.floor": "{age} o menos",
  "fit.ceiling": "{age} o más",
  "fit.range": "Probablemente entre {low} y {high}; tienes {age}",
  "fit.chip.younger": "Más en forma de lo típico para tu edad",
  "fit.chip.typical": "Lo típico para tu edad",
  "fit.chip.older": "Margen para mejorar",
  "fit.from":
    "Según el VO₂ máx de tu reloj, {vo2} (última lectura {date}). Una persona sana típica ({who}) de {age} años tiene unos {expected}.",
  "fit.man": "hombre",
  "fit.woman": "mujer",
  "fit.todo.younger":
    "Mantenlo así: dos sesiones de cardio intenso a la semana, como intervalos, caminar cuesta arriba o remo, sostienen el VO₂ máx con los años.",
  "fit.todo.typical":
    "Dos sesiones de cardio intenso de 20 minutos a la semana, como intervalos, caminar cuesta arriba o remo, suelen subir el VO₂ máx en 6 a 8 semanas, y este número baja con él.",
  "fit.todo.older":
    "Es el número que más rápido cambia con el entrenamiento. Dos sesiones de cardio intenso de 20 minutos a la semana, como intervalos, caminar cuesta arriba o remo, suelen subir el VO₂ máx en 6 a 8 semanas. Las pesas apenas lo mueven.",
  "fit.strength": {
    one: "Fuerza en los últimos 7 días: {count} día, {minutes} min. Las guías recomiendan trabajo de fuerza 2 o más días a la semana.",
    other: "Fuerza en los últimos 7 días: {count} días, {minutes} min. Las guías recomiendan trabajo de fuerza 2 o más días a la semana.",
  },
  "fit.score": "Puntuación de fuerza: {score} ({band}), frente a levantadores típicos de tu peso.",
  "fit.seeProgress": "Ver Progreso",
  "fit.how": "¿Cómo se calcula?",
  "fit.missing.vo2":
    "Necesita una lectura de VO₂ máx de un reloj (Apple Watch, Fitbit, Pixel Watch o Garmin) a través de {source}. Los relojes la registran tras caminar o correr al aire libre.",
  "fit.missing.web": "Viene del VO₂ máx de tu reloj a través de la app de salud del móvil. Abre Liftsmith en el móvil para verla.",
  "fit.missing.profile": "Añade tu edad y sexo para comparar tu VO₂ máx con personas sanas como tú.",
  "fit.addProfile": "Añadir edad y sexo",
  "fit.disclaimer":
    "Una estimación de forma física para el bienestar general. No es consejo médico y no puede decirte nada sobre ninguna condición de salud. Si te preocupa tu salud, un médico puede ayudarte.",
  "fit.how.1": "Tu edad física es la edad a la que una persona sana típica de tu sexo tiene tu VO₂ máx.",
  "fit.how.2":
    "Los valores típicos vienen del estudio HUNT Fitness de Noruega, que midió el VO₂ máx en cinta a 3816 adultos sanos (Loe y otros, 2013). La idea de edad física es del mismo grupo de investigación (Nes y otros, 2014).",
  "fit.how.3":
    "Tu VO₂ máx es la estimación de tu reloj, el valor medio de tus últimas lecturas. Las estimaciones de reloj suelen desviarse un 5 a 15 % de una prueba de laboratorio, así que el rango muestra tu edad física si la lectura fuera un 8 % mayor o menor.",
  "fit.how.4":
    "Sigue a la forma cardiovascular. Los intervalos, caminar cuesta arriba, el remo y correr la suben; las pesas apenas la cambian, así que no mide tu entrenamiento de fuerza.",
};

export const fr: Partial<Record<Key, Message>> = {
  "fit.title": "Âge physique",
  "fit.value": "Environ {age}",
  "fit.floor": "{age} ou moins",
  "fit.ceiling": "{age} ou plus",
  "fit.range": "Probablement entre {low} et {high} ; vous avez {age} ans",
  "fit.chip.younger": "Plus en forme que la moyenne de votre âge",
  "fit.chip.typical": "Dans la moyenne de votre âge",
  "fit.chip.older": "Marge de progression",
  "fit.from":
    "D’après la VO₂ max de votre montre, {vo2} (dernière mesure {date}). Une personne en bonne santé typique ({who}) de {age} ans a environ {expected}.",
  "fit.man": "homme",
  "fit.woman": "femme",
  "fit.todo.younger":
    "Gardez le cap : deux séances de cardio intense par semaine, comme des fractionnés, de la marche en côte ou du rameur, maintiennent la VO₂ max au fil des ans.",
  "fit.todo.typical":
    "Deux séances de cardio intense de 20 minutes par semaine, comme des fractionnés, de la marche en côte ou du rameur, font en général monter la VO₂ max en 6 à 8 semaines, et ce chiffre baisse avec elle.",
  "fit.todo.older":
    "C’est le chiffre qui bouge le plus vite avec l’entraînement. Deux séances de cardio intense de 20 minutes par semaine, comme des fractionnés, de la marche en côte ou du rameur, font en général monter la VO₂ max en 6 à 8 semaines. La musculation la fait à peine bouger.",
  "fit.strength": {
    one: "Musculation sur les 7 derniers jours : {count} jour, {minutes} min. Les recommandations conseillent du renforcement musculaire 2 jours par semaine ou plus.",
    other:
      "Musculation sur les 7 derniers jours : {count} jours, {minutes} min. Les recommandations conseillent du renforcement musculaire 2 jours par semaine ou plus.",
  },
  "fit.score": "Score de force : {score} ({band}), par rapport aux pratiquants typiques de votre poids.",
  "fit.seeProgress": "Voir Progrès",
  "fit.how": "Comment est-ce calculé ?",
  "fit.missing.vo2":
    "Nécessite une mesure de VO₂ max d’une montre (Apple Watch, Fitbit, Pixel Watch ou Garmin) via {source}. Les montres la mesurent après une marche ou une course en extérieur.",
  "fit.missing.web": "Vient de la VO₂ max de votre montre via l’app santé du téléphone. Ouvrez Liftsmith sur votre téléphone pour la voir.",
  "fit.missing.profile": "Ajoutez votre âge et votre sexe pour comparer votre VO₂ max à des personnes en bonne santé comme vous.",
  "fit.addProfile": "Ajouter l’âge et le sexe",
  "fit.disclaimer":
    "Une estimation de la forme physique pour le bien-être général. Ce n’est pas un avis médical et elle ne peut rien dire sur un problème de santé. Si votre santé vous préoccupe, un médecin peut vous aider.",
  "fit.how.1": "Votre âge physique est l’âge auquel une personne en bonne santé typique de votre sexe a votre VO₂ max.",
  "fit.how.2":
    "Les valeurs typiques viennent de l’étude HUNT Fitness en Norvège, qui a mesuré la VO₂ max sur tapis de course chez 3816 adultes en bonne santé (Loe et coll., 2013). L’idée d’âge physique vient du même groupe de recherche (Nes et coll., 2014).",
  "fit.how.3":
    "Votre VO₂ max est l’estimation de votre montre, la valeur médiane de vos dernières mesures. Les estimations des montres s’écartent souvent de 5 à 15 % d’un test en laboratoire ; la fourchette montre donc votre âge physique si la mesure était 8 % plus haute ou plus basse.",
  "fit.how.4":
    "Il suit la forme cardio. Les fractionnés, la marche en côte, le rameur et la course le font baisser ; la musculation le change à peine, ce n’est donc pas un score de votre entraînement de force.",
};
