import type { Message } from "@/lib/i18n";

// Text for keys starting "gloss.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "gloss.fitnessAge.title": "Fitness age",
  "gloss.fitnessAge.body":
    "The age at which a typical healthy person of your sex has your VO₂ max, from a large Norwegian study of healthy adults.\nIt's a fitness estimate, not a health check. Hard cardio lowers it within weeks.",
  "gloss.deloadWeeks.title": "Build weeks before a deload",
  "gloss.deloadWeeks.body":
    "Your training runs in blocks. During the build weeks the plan gets a little harder each week: more sets and fewer reps left in the tank.\nThen comes one deload week: lighter, about half the sets. It lets your joints and nerves catch up, so you come back stronger. Pick fewer build weeks if you're new or busy, more if you recover well.",
  "gloss.deload.title": "Deload week",
  "gloss.deload.body":
    "An easier week after a block of hard training: lighter weights and about half the sets. It isn't lost progress. It's when your body absorbs the work, so the next block starts stronger.",
  "gloss.rir.title": "RIR: reps in reserve",
  "gloss.rir.body":
    "How many more reps you could have done when you stop the set. RIR 2 means you finish the set feeling you had about two more good reps in you.\nThe plan starts with more in the tank and moves closer to failure across the block.",
  "gloss.rpe.title": "RPE: rate of perceived exertion",
  "gloss.rpe.body":
    "How hard a set felt on a 1 to 10 scale, where 10 is all you had. An 8 means you had about two more good reps in you, the same as 2 reps in reserve.\nPick this scale or reps in reserve in Settings › Workout preferences. The plan works the same either way.",
  "gloss.blockWeek.title": "Training block",
  "gloss.blockWeek.body":
    "Where you are in your block: which build week (or the deload), and how many reps to leave in the tank this week. You can change the block length in Settings.",
  "gloss.readiness.title": "Readiness",
  "gloss.readiness.body":
    "A score from 0 to 100, with 50 as a normal day. It comes from how recovered your big muscles are, how recent workouts went (reps hit, how sets felt, rep speed and heart rate), and rest days.\n65 or more is a push day, 35 or less is an easy day. You can always overrule it.",
  "gloss.call.title": "Today's call",
  "gloss.call.body":
    "Push: your first big lift goes one rep closer to failure. As planned: the normal plan. Go easy: a set fewer, a step lighter and one more rep in reserve. Your choice is saved.",
  "gloss.volume.title": "Volume",
  "gloss.volume.body":
    "Weight × reps, added up over every working set. It's a rough measure of how much total work you did. Warm-ups aren't counted.",
  "gloss.e1rm.title": "Estimated one-rep max",
  "gloss.e1rm.body":
    "The most you could probably lift once, worked out from your sets with the reps you had left added. It uses the formulas research found most accurate for each rep range (Brzycki and Epley up to 10 reps to failure, Mayhew and Wathan above), each averaged with a 2026 weight-based equation fitted on over 300,000 sets. Recent, heavy, close-to-failure sets count most and sets past 20 reps are ignored. It lets you compare a set of 5 with a set of 8, so you can see real strength trends without testing a true max.",
  "gloss.weeklySets.title": "Sets per muscle this week",
  "gloss.weeklySets.body":
    "Hard sets that worked each muscle this week. Secondary muscles count as half a set. The green band, 10 to 20, is the range most research supports for growth. The plan aims at the muscles furthest below it.",
  "gloss.variety.title": "Exercise variety",
  "gloss.variety.body":
    "How often the plan keeps the same exercise for a muscle. More consistent is better for tracking progress on a lift. More variety keeps things fresh and spreads the stress.",
  "gloss.recovery.title": "Recovery",
  "gloss.recovery.body":
    "Each set tires the muscles it works. That fatigue fades over 2 to 3 days. Fresh is 90% or more, Ready 70%, Recovering 40%, and Fatigued is below 40%. The plan avoids muscles that are still fatigued.",
  "gloss.superset.title": "Superset",
  "gloss.superset.body":
    "Two or more exercises done back to back: one set of the first, then straight to one set of the next, then the rest. It saves time, and works best for exercises that don't tire the same muscles, like a row with a press.\nTap the link between two exercises to pair them, and again to split them.",
  "gloss.warmup.title": "Warm-up sets",
  "gloss.warmup.body":
    "Lighter sets that build up to your working weight. They aren't counted in your stats or progress. Skip them if you're already warm.",
  "gloss.firstWeights.title": "Why we ask",
  "gloss.firstWeights.body":
    "Only to suggest a safe first weight for each lift. We start on the light side and adjust after your first session. It stays on your phone.",
  "gloss.healthTwin.title": "Health",
  "gloss.healthTwin.body":
    "Your body's numbers in one place: weight, body fat, energy, sleep, heart and steps, from Liftsmith and your phone's health app.\nEach one is compared with your own normal over the last 30 days, never with other people, and says what to do about it. It isn't medical advice.",
  "gloss.hrv.title": "HRV: heart rate variability",
  "gloss.hrv.body":
    "The tiny changes in time between heartbeats, measured by a watch or ring, mostly overnight. Higher than your own normal usually means you've recovered; lower means stress from training, poor sleep or illness.\nOnly your own trend matters: phones and watches measure it differently, so don't compare your number with anyone else's.",
  "gloss.restingHr.title": "Resting heart rate",
  "gloss.restingHr.body":
    "Your heart rate when you're fully at rest, usually measured while you sleep. A few beats over your own normal for a day or two is an early sign to take it easier.",
  "gloss.breathingRate.title": "Breathing rate",
  "gloss.breathingRate.body":
    "Breaths a minute while you sleep, from a watch or ring. It stays very steady, so a jump of two or more over your normal is often one of the first signs of getting ill.",
  "gloss.vo2max.title": "VO₂ max",
  "gloss.vo2max.body":
    "How much oxygen your body can use at full effort, in millilitres per kilogram a minute. Watches estimate it from walks and runs. It's the best single measure of heart fitness.\nLifting barely moves it. Two 20-minute hard cardio sessions a week do.",
  "gloss.bodyFat.title": "Body fat",
  "gloss.bodyFat.body":
    "The share of your weight that's fat, from a smart scale, a body scanner or a calipers check. Every method reads differently, so stick to one and measure at the same time of day, ideally in the morning before eating.\nOne reading means little. Three or more over a few weeks show the trend, and coach's notes tell you when it's moving the wrong way for your goal.",
  "gloss.leanMass.title": "Lean mass",
  "gloss.leanMass.body":
    "Everything in your body that isn't fat: muscle, bone, organs and water. Your weight times the share that isn't fat. Lean mass rising while body fat holds or falls means training is building muscle.",
  "gloss.bmi.title": "BMI: body mass index",
  "gloss.bmi.body":
    "Weight divided by height squared. It's a rough guide for people who don't lift: it can't tell muscle from fat, so muscular lifters often read as overweight. When you have a body fat reading, trust that instead.",
  "gloss.restDrop.title": "Heart rate drop in rest",
  "gloss.restDrop.body":
    "How many beats a minute your heart rate falls in the first minute after a set, from your heart rate monitor. A bigger drop over the months means a fitter heart; a smaller one than usual can mean you're tired.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "gloss.fitnessAge.title": "Edad física",
  "gloss.fitnessAge.body":
    "La edad a la que una persona sana típica de tu sexo tiene tu VO₂ máx, según un gran estudio noruego con adultos sanos.\nEs una estimación de forma física, no un chequeo de salud. El cardio intenso la baja en semanas.",
  "gloss.deloadWeeks.title": "Semanas de carga antes de una descarga",
  "gloss.deloadWeeks.body":
    "Tu entrenamiento va por bloques. Durante las semanas de carga el plan se vuelve un poco más duro cada semana: más series y menos repeticiones en reserva.\nLuego llega una semana de descarga: más ligera, con la mitad de series aproximadamente. Deja que articulaciones y sistema nervioso se pongan al día, para que vuelvas más fuerte. Elige menos semanas de carga si eres nuevo o vas con poco tiempo, y más si te recuperas bien.",
  "gloss.deload.title": "Semana de descarga",
  "gloss.deload.body":
    "Una semana más fácil tras un bloque de entrenamiento duro: pesos más ligeros y la mitad de series aproximadamente. No es progreso perdido. Es cuando tu cuerpo asimila el trabajo, para que el siguiente bloque empiece más fuerte.",
  "gloss.rir.title": "RIR: repeticiones en reserva",
  "gloss.rir.body":
    "Cuántas repeticiones más podrías haber hecho al terminar la serie. RIR 2 significa que acabas la serie sintiendo que te quedaban unas dos buenas repeticiones.\nEl plan empieza con más reserva y se acerca al fallo a lo largo del bloque.",
  "gloss.rpe.title": "RPE: esfuerzo percibido",
  "gloss.rpe.body":
    "Lo dura que se sintió una serie en una escala del 1 al 10, donde 10 es todo lo que tenías. Un 8 significa que te quedaban unas dos buenas repeticiones, lo mismo que 2 repeticiones en reserva.\nElige esta escala o las repeticiones en reserva en Ajustes › Preferencias de entrenamiento. El plan funciona igual con ambas.",
  "gloss.blockWeek.title": "Bloque de entrenamiento",
  "gloss.blockWeek.body":
    "En qué punto del bloque estás: qué semana de carga (o la descarga) y cuántas repeticiones dejar en reserva esta semana. Puedes cambiar la duración del bloque en Ajustes.",
  "gloss.readiness.title": "Preparación",
  "gloss.readiness.body":
    "Una puntuación de 0 a 100, donde 50 es un día normal. Sale de lo recuperados que están tus músculos grandes, cómo fueron los últimos entrenamientos (repeticiones logradas, sensaciones, velocidad de las repeticiones y frecuencia cardiaca) y los días de descanso.\n65 o más es un día para apretar; 35 o menos, un día suave. Siempre puedes decidir tú.",
  "gloss.call.title": "La decisión de hoy",
  "gloss.call.body":
    "Apretar: tu primer ejercicio grande va una repetición más cerca del fallo. Según el plan: el plan normal. Suave: una serie menos, un escalón más ligero y una repetición más en reserva. Tu elección se guarda.",
  "gloss.volume.title": "Volumen",
  "gloss.volume.body":
    "Peso × repeticiones, sumado en todas las series de trabajo. Es una medida aproximada del trabajo total que hiciste. Las series de calentamiento no cuentan.",
  "gloss.e1rm.title": "1RM estimado",
  "gloss.e1rm.body":
    "Lo máximo que probablemente podrías levantar una vez, calculado a partir de tus series sumando las repeticiones que te quedaban. Usa las fórmulas que la investigación encontró más precisas para cada rango de repeticiones (Brzycki y Epley hasta 10 repeticiones al fallo, Mayhew y Wathan por encima), cada una promediada con una ecuación de 2026 basada en el peso y ajustada con más de 300.000 series. Las series recientes, pesadas y cercanas al fallo cuentan más, y las de más de 20 repeticiones se ignoran. Permite comparar una serie de 5 con una de 8, para ver tu tendencia de fuerza real sin probar un máximo.",
  "gloss.weeklySets.title": "Series por músculo esta semana",
  "gloss.weeklySets.body":
    "Series duras que trabajaron cada músculo esta semana. Los músculos secundarios cuentan como media serie. La franja verde, de 10 a 20, es el rango que más respalda la investigación para ganar músculo. El plan se centra en los músculos más alejados de ella.",
  "gloss.variety.title": "Variedad de ejercicios",
  "gloss.variety.body":
    "Con qué frecuencia el plan mantiene el mismo ejercicio para un músculo. Más constancia ayuda a seguir el progreso de un ejercicio. Más variedad lo mantiene fresco y reparte el estrés.",
  "gloss.recovery.title": "Recuperación",
  "gloss.recovery.body":
    "Cada serie cansa los músculos que trabaja. Esa fatiga desaparece en 2 o 3 días. Fresco es el 90% o más, Listo el 70%, Recuperándose el 40%, y Fatigado está por debajo del 40%. El plan evita los músculos que siguen fatigados.",
  "gloss.superset.title": "Superserie",
  "gloss.superset.body":
    "Dos o más ejercicios seguidos: una serie del primero, directamente una serie del siguiente, y luego el descanso. Ahorra tiempo y funciona mejor con ejercicios que no cansan los mismos músculos, como un remo con un press.\nToca el enlace entre dos ejercicios para unirlos, y otra vez para separarlos.",
  "gloss.warmup.title": "Series de calentamiento",
  "gloss.warmup.body":
    "Series más ligeras que van subiendo hasta tu peso de trabajo. No cuentan en tus estadísticas ni en tu progreso. Sáltalas si ya estás caliente.",
  "gloss.firstWeights.title": "Por qué lo preguntamos",
  "gloss.firstWeights.body":
    "Solo para sugerir un primer peso seguro para cada ejercicio. Empezamos por lo ligero y ajustamos tras tu primera sesión. No sale de tu teléfono.",
  "gloss.healthTwin.title": "Salud",
  "gloss.healthTwin.body":
    "Los números de tu cuerpo en un solo lugar: peso, grasa corporal, energía, sueño, corazón y pasos, de Liftsmith y de la app de salud de tu teléfono.\nCada uno se compara con tu propia normalidad de los últimos 30 días, nunca con otras personas, y dice qué hacer al respecto. No es consejo médico.",
  "gloss.hrv.title": "VFC: variabilidad de la frecuencia cardiaca",
  "gloss.hrv.body":
    "Los pequeños cambios en el tiempo entre latidos, medidos por un reloj o un anillo, sobre todo de noche. Más alta que tu normalidad suele indicar que te has recuperado; más baja, estrés por el entrenamiento, mal sueño o enfermedad.\nSolo importa tu propia tendencia: teléfonos y relojes la miden de forma distinta, así que no compares tu número con el de nadie.",
  "gloss.restingHr.title": "Frecuencia cardiaca en reposo",
  "gloss.restingHr.body":
    "Tu frecuencia cardiaca en reposo total, normalmente medida mientras duermes. Unas pocas pulsaciones por encima de tu normalidad durante uno o dos días es una señal temprana para tomártelo con más calma.",
  "gloss.breathingRate.title": "Frecuencia respiratoria",
  "gloss.breathingRate.body":
    "Respiraciones por minuto mientras duermes, de un reloj o un anillo. Es muy estable, así que un salto de dos o más sobre tu normalidad suele ser una de las primeras señales de que te estás poniendo enfermo.",
  "gloss.vo2max.title": "VO₂ máx",
  "gloss.vo2max.body":
    "Cuánto oxígeno puede usar tu cuerpo al máximo esfuerzo, en mililitros por kilo y minuto. Los relojes lo estiman a partir de paseos y carreras. Es la mejor medida única de la forma del corazón.\nLevantar pesas apenas lo mueve. Dos sesiones de cardio intenso de 20 minutos a la semana, sí.",
  "gloss.bodyFat.title": "Grasa corporal",
  "gloss.bodyFat.body":
    "La parte de tu peso que es grasa, según una báscula inteligente, un escáner corporal o un plicómetro. Cada método da valores distintos, así que usa siempre el mismo y mide a la misma hora, mejor por la mañana antes de comer.\nUna sola lectura dice poco. Tres o más en unas semanas muestran la tendencia, y las notas del entrenador te avisan cuando va en la dirección equivocada para tu objetivo.",
  "gloss.leanMass.title": "Masa magra",
  "gloss.leanMass.body":
    "Todo lo que hay en tu cuerpo que no es grasa: músculo, hueso, órganos y agua. Tu peso por la parte que no es grasa. Si la masa magra sube mientras la grasa se mantiene o baja, el entrenamiento está construyendo músculo.",
  "gloss.bmi.title": "IMC: índice de masa corporal",
  "gloss.bmi.body":
    "El peso dividido por la altura al cuadrado. Es una guía aproximada para quien no entrena con pesas: no distingue músculo de grasa, así que muchos levantadores musculados salen con sobrepeso. Si tienes una medida de grasa corporal, fíate de ella.",
  "gloss.restDrop.title": "Bajada de pulsaciones en el descanso",
  "gloss.restDrop.body":
    "Cuántas pulsaciones por minuto baja tu frecuencia cardiaca en el primer minuto tras una serie, según tu pulsómetro. Una bajada mayor con los meses indica un corazón más en forma; una menor de lo habitual puede indicar cansancio.",
};

export const fr: Partial<Record<Key, Message>> = {
  "gloss.fitnessAge.title": "Âge physique",
  "gloss.fitnessAge.body":
    "L’âge auquel une personne en bonne santé typique de votre sexe a votre VO₂ max, d’après une grande étude norvégienne sur des adultes en bonne santé.\nC’est une estimation de la forme physique, pas un bilan de santé. Le cardio intense le fait baisser en quelques semaines.",
  "gloss.deloadWeeks.title": "Semaines de progression avant une décharge",
  "gloss.deloadWeeks.body":
    "Votre entraînement est organisé en blocs. Pendant les semaines de progression, le plan devient un peu plus dur chaque semaine : plus de séries et moins de répétitions en réserve.\nVient ensuite une semaine de décharge : plus légère, avec environ la moitié des séries. Elle laisse vos articulations et votre système nerveux récupérer, pour revenir plus fort. Choisissez moins de semaines de progression si vous débutez ou manquez de temps, plus si vous récupérez bien.",
  "gloss.deload.title": "Semaine de décharge",
  "gloss.deload.body":
    "Une semaine plus facile après un bloc d’entraînement dur : des charges plus légères et environ la moitié des séries. Ce n’est pas du progrès perdu. C’est le moment où votre corps assimile le travail, pour que le bloc suivant commence plus fort.",
  "gloss.rir.title": "RIR : répétitions en réserve",
  "gloss.rir.body":
    "Combien de répétitions de plus vous auriez pu faire en arrêtant la série. RIR 2 signifie que vous terminez la série en sentant qu’il vous restait environ deux bonnes répétitions.\nLe plan commence avec plus de réserve et se rapproche de l’échec au fil du bloc.",
  "gloss.rpe.title": "RPE : effort perçu",
  "gloss.rpe.body":
    "La difficulté ressentie d’une série sur une échelle de 1 à 10, où 10 est tout ce que vous aviez. Un 8 signifie qu’il vous restait environ deux bonnes répétitions, comme 2 répétitions en réserve.\nChoisissez cette échelle ou les répétitions en réserve dans Réglages › Préférences d’entraînement. Le plan fonctionne de la même façon dans les deux cas.",
  "gloss.blockWeek.title": "Bloc d’entraînement",
  "gloss.blockWeek.body":
    "Où vous en êtes dans votre bloc : quelle semaine de progression (ou la décharge), et combien de répétitions garder en réserve cette semaine. Vous pouvez changer la durée du bloc dans Réglages.",
  "gloss.readiness.title": "Forme du jour",
  "gloss.readiness.body":
    "Un score de 0 à 100, où 50 est une journée normale. Il vient de la récupération de vos grands muscles, du déroulé des dernières séances (répétitions réussies, ressenti, vitesse des répétitions et fréquence cardiaque) et des jours de repos.\n65 ou plus, c’est un jour pour pousser ; 35 ou moins, un jour tranquille. Vous pouvez toujours passer outre.",
  "gloss.call.title": "Le choix du jour",
  "gloss.call.body":
    "Pousser : votre premier gros exercice va une répétition plus près de l’échec. Comme prévu : le plan normal. Tranquille : une série de moins, un cran plus léger et une répétition de plus en réserve. Votre choix est enregistré.",
  "gloss.volume.title": "Volume",
  "gloss.volume.body":
    "Charge × répétitions, additionnées sur toutes les séries de travail. C’est une mesure approximative du travail total effectué. Les échauffements ne comptent pas.",
  "gloss.e1rm.title": "1RM estimé",
  "gloss.e1rm.body":
    "Le maximum que vous pourriez sans doute soulever une fois, calculé à partir de vos séries en ajoutant les répétitions qu’il vous restait. Il utilise les formules que la recherche a trouvées les plus précises pour chaque fourchette de répétitions (Brzycki et Epley jusqu’à 10 répétitions à l’échec, Mayhew et Wathan au-delà), chacune moyennée avec une équation de 2026 fondée sur la charge et ajustée sur plus de 300 000 séries. Les séries récentes, lourdes et proches de l’échec comptent le plus, et celles de plus de 20 répétitions sont ignorées. Il permet de comparer une série de 5 et une série de 8, pour voir votre vraie tendance de force sans tester un maximum.",
  "gloss.weeklySets.title": "Séries par muscle cette semaine",
  "gloss.weeklySets.body":
    "Les séries difficiles qui ont travaillé chaque muscle cette semaine. Les muscles secondaires comptent pour une demi-série. La bande verte, de 10 à 20, est la fourchette que la recherche soutient le plus pour la prise de muscle. Le plan vise les muscles les plus en dessous.",
  "gloss.variety.title": "Variété des exercices",
  "gloss.variety.body":
    "La fréquence à laquelle le plan garde le même exercice pour un muscle. Plus de régularité aide à suivre les progrès sur un exercice. Plus de variété garde les choses fraîches et répartit le stress.",
  "gloss.recovery.title": "Récupération",
  "gloss.recovery.body":
    "Chaque série fatigue les muscles qu’elle travaille. Cette fatigue s’efface en 2 à 3 jours. Frais, c’est 90 % ou plus, Prêt 70 %, En récupération 40 %, et Fatigué est sous 40 %. Le plan évite les muscles encore fatigués.",
  "gloss.superset.title": "Superset",
  "gloss.superset.body":
    "Deux exercices ou plus enchaînés : une série du premier, directement une série du suivant, puis le repos. Cela fait gagner du temps, et marche mieux avec des exercices qui ne fatiguent pas les mêmes muscles, comme un tirage avec un développé.\nTouchez le lien entre deux exercices pour les associer, et de nouveau pour les séparer.",
  "gloss.warmup.title": "Séries d’échauffement",
  "gloss.warmup.body":
    "Des séries plus légères qui montent jusqu’à votre charge de travail. Elles ne comptent ni dans vos statistiques ni dans vos progrès. Passez-les si vous êtes déjà échauffé.",
  "gloss.firstWeights.title": "Pourquoi nous le demandons",
  "gloss.firstWeights.body":
    "Uniquement pour proposer une première charge sûre pour chaque exercice. Nous commençons léger et ajustons après votre première séance. Cela reste sur votre téléphone.",
  "gloss.healthTwin.title": "Santé",
  "gloss.healthTwin.body":
    "Les chiffres de votre corps au même endroit : poids, masse grasse, énergie, sommeil, cœur et pas, depuis Liftsmith et l’app santé de votre téléphone.\nChacun est comparé à votre propre normale des 30 derniers jours, jamais à d’autres personnes, et dit quoi faire. Ce n’est pas un avis médical.",
  "gloss.hrv.title": "VFC : variabilité de la fréquence cardiaque",
  "gloss.hrv.body":
    "Les infimes variations du temps entre deux battements, mesurées par une montre ou une bague, surtout la nuit. Plus haute que votre normale, elle indique en général que vous avez récupéré ; plus basse, du stress lié à l’entraînement, un mauvais sommeil ou une maladie.\nSeule votre propre tendance compte : téléphones et montres la mesurent différemment, alors ne comparez pas votre chiffre à celui des autres.",
  "gloss.restingHr.title": "Fréquence cardiaque au repos",
  "gloss.restingHr.body":
    "Votre fréquence cardiaque au repos complet, en général mesurée pendant le sommeil. Quelques battements au-dessus de votre normale pendant un jour ou deux sont un signe précoce qu’il faut lever le pied.",
  "gloss.breathingRate.title": "Fréquence respiratoire",
  "gloss.breathingRate.body":
    "Le nombre de respirations par minute pendant le sommeil, mesuré par une montre ou une bague. Elle est très stable, donc une hausse de deux ou plus au-dessus de votre normale est souvent l’un des premiers signes d’une maladie.",
  "gloss.vo2max.title": "VO₂ max",
  "gloss.vo2max.body":
    "La quantité d’oxygène que votre corps peut utiliser à l’effort maximal, en millilitres par kilo et par minute. Les montres l’estiment à partir de la marche et de la course. C’est la meilleure mesure unique de la forme cardiaque.\nLa musculation la fait à peine bouger. Deux séances de cardio intense de 20 minutes par semaine, si.",
  "gloss.bodyFat.title": "Masse grasse",
  "gloss.bodyFat.body":
    "La part de votre poids qui est de la graisse, mesurée par une balance connectée, un scanner corporel ou une pince à plis cutanés. Chaque méthode donne des valeurs différentes : gardez la même et mesurez à la même heure, idéalement le matin à jeun.\nUne seule mesure dit peu de chose. Trois ou plus sur quelques semaines montrent la tendance, et les notes du coach vous préviennent quand elle va dans le mauvais sens pour votre objectif.",
  "gloss.leanMass.title": "Masse maigre",
  "gloss.leanMass.body":
    "Tout ce qui, dans votre corps, n’est pas de la graisse : muscles, os, organes et eau. Votre poids multiplié par la part qui n’est pas de la graisse. Si la masse maigre monte pendant que la masse grasse se maintient ou baisse, l’entraînement construit du muscle.",
  "gloss.bmi.title": "IMC : indice de masse corporelle",
  "gloss.bmi.body":
    "Le poids divisé par la taille au carré. C’est un repère approximatif pour les personnes qui ne font pas de musculation : il ne distingue pas le muscle de la graisse, donc les pratiquants musclés paraissent souvent en surpoids. Si vous avez une mesure de masse grasse, fiez-vous plutôt à elle.",
  "gloss.restDrop.title": "Baisse du rythme cardiaque au repos",
  "gloss.restDrop.body":
    "De combien de battements par minute votre fréquence cardiaque baisse dans la première minute après une série, d’après votre cardiofréquencemètre. Une baisse plus grande au fil des mois signifie un cœur plus en forme ; une baisse plus faible que d’habitude peut signaler de la fatigue.",
};

export const de: Partial<Record<Key, Message>> = {
  "gloss.fitnessAge.title": "Fitnessalter",
  "gloss.fitnessAge.body":
    "Das Alter, in dem ein typischer gesunder Mensch deines Geschlechts deinen VO₂max hat, nach einer großen norwegischen Studie mit gesunden Erwachsenen.\nEs ist eine Fitness-Schätzung, keine Gesundheitsuntersuchung. Hartes Ausdauertraining senkt es innerhalb weniger Wochen.",
  "gloss.deloadWeeks.title": "Aufbauwochen vor einem Deload",
  "gloss.deloadWeeks.body":
    "Dein Training läuft in Blöcken. In den Aufbauwochen wird der Plan jede Woche etwas härter: mehr Sätze und weniger Wiederholungen im Tank.\nDann kommt eine Deload-Woche: leichter, etwa die Hälfte der Sätze. So können Gelenke und Nerven aufholen, und du kommst stärker zurück. Wähle weniger Aufbauwochen, wenn du neu oder viel beschäftigt bist, mehr, wenn du dich gut erholst.",
  "gloss.deload.title": "Deload-Woche",
  "gloss.deload.body":
    "Eine leichtere Woche nach einem Block harten Trainings: weniger Gewicht und etwa die Hälfte der Sätze. Das ist kein verlorener Fortschritt. In dieser Zeit verarbeitet dein Körper die Arbeit, damit der nächste Block stärker beginnt.",
  "gloss.rir.title": "RIR: Wiederholungen in Reserve",
  "gloss.rir.body":
    "Wie viele Wiederholungen du noch geschafft hättest, als du den Satz beendest. RIR 2 heißt: Du beendest den Satz mit dem Gefühl, dass noch etwa zwei saubere Wiederholungen drin gewesen wären.\nDer Plan beginnt mit mehr Reserve und geht im Lauf des Blocks näher ans Muskelversagen.",
  "gloss.rpe.title": "RPE: wahrgenommene Anstrengung",
  "gloss.rpe.body":
    "Wie schwer sich ein Satz angefühlt hat, auf einer Skala von 1 bis 10, wobei 10 alles ist, was du hattest. Eine 8 heißt, dass noch etwa zwei saubere Wiederholungen drin waren, also dasselbe wie 2 Wiederholungen in Reserve.\nWähle diese Skala oder Wiederholungen in Reserve unter Einstellungen › Trainingsvorlieben. Der Plan funktioniert in beiden Fällen gleich.",
  "gloss.blockWeek.title": "Trainingsblock",
  "gloss.blockWeek.body":
    "Wo du in deinem Block stehst: welche Aufbauwoche (oder der Deload) und wie viele Wiederholungen du diese Woche in Reserve lassen sollst. Die Blocklänge kannst du in den Einstellungen ändern.",
  "gloss.readiness.title": "Bereitschaft",
  "gloss.readiness.body":
    "Ein Wert von 0 bis 100, wobei 50 ein normaler Tag ist. Er ergibt sich daraus, wie erholt deine großen Muskeln sind, wie die letzten Trainings liefen (geschaffte Wiederholungen, wie sich die Sätze anfühlten, Wiederholungstempo und Herzfrequenz) und aus Ruhetagen.\nAb 65 ist ein Gas-geben-Tag, bei 35 oder weniger ein lockerer Tag. Du kannst ihn immer überstimmen.",
  "gloss.call.title": "Die Empfehlung für heute",
  "gloss.call.body":
    "Gas geben: Deine erste große Übung geht eine Wiederholung näher ans Muskelversagen. Wie geplant: der normale Plan. Locker: ein Satz weniger, eine Stufe leichter und eine Wiederholung mehr in Reserve. Deine Wahl wird gespeichert.",
  "gloss.volume.title": "Volumen",
  "gloss.volume.body":
    "Gewicht × Wiederholungen, über alle Arbeitssätze addiert. Ein grobes Maß dafür, wie viel Arbeit du insgesamt geleistet hast. Aufwärmsätze zählen nicht.",
  "gloss.e1rm.title": "Geschätztes Einwiederholungsmaximum",
  "gloss.e1rm.body":
    "Das Gewicht, das du vermutlich einmal heben könntest, berechnet aus deinen Sätzen plus den Wiederholungen, die du noch übrig hattest. Es nutzt die Formeln, die laut Forschung für jeden Wiederholungsbereich am genauesten sind (Brzycki und Epley bis 10 Wiederholungen bis zum Versagen, Mayhew und Wathan darüber), jeweils gemittelt mit einer gewichtsbasierten Gleichung von 2026, die an über 300.000 Sätzen angepasst wurde. Neue, schwere Sätze nahe am Versagen zählen am meisten, Sätze über 20 Wiederholungen werden ignoriert. So kannst du einen Fünfersatz mit einem Achtersatz vergleichen und echte Kraftentwicklung sehen, ohne ein echtes Maximum zu testen.",
  "gloss.weeklySets.title": "Sätze pro Muskel diese Woche",
  "gloss.weeklySets.body":
    "Harte Sätze, die diese Woche jeden Muskel trainiert haben. Mitbeteiligte Muskeln zählen als halber Satz. Der grüne Bereich, 10 bis 20, ist die Spanne, die die meiste Forschung für Muskelaufbau stützt. Der Plan zielt auf die Muskeln, die am weitesten darunter liegen.",
  "gloss.variety.title": "Übungsvielfalt",
  "gloss.variety.body":
    "Wie oft der Plan für einen Muskel bei derselben Übung bleibt. Beständiger ist besser, um den Fortschritt bei einer Übung zu verfolgen. Mehr Abwechslung hält das Training frisch und verteilt die Belastung.",
  "gloss.recovery.title": "Erholung",
  "gloss.recovery.body":
    "Jeder Satz ermüdet die Muskeln, die er trainiert. Diese Ermüdung lässt über 2 bis 3 Tage nach. Frisch ist ab 90 %, Bereit ab 70 %, In Erholung ab 40 %, und Ermüdet liegt unter 40 %. Der Plan meidet Muskeln, die noch ermüdet sind.",
  "gloss.superset.title": "Supersatz",
  "gloss.superset.body":
    "Zwei oder mehr Übungen direkt hintereinander: ein Satz der ersten, dann sofort ein Satz der nächsten, dann die Pause. Das spart Zeit und funktioniert am besten mit Übungen, die nicht dieselben Muskeln ermüden, etwa Rudern mit Drücken.\nTippe auf die Verbindung zwischen zwei Übungen, um sie zu koppeln, und noch einmal, um sie zu trennen.",
  "gloss.warmup.title": "Aufwärmsätze",
  "gloss.warmup.body":
    "Leichtere Sätze, die dich an dein Arbeitsgewicht heranführen. Sie zählen nicht zu deinen Statistiken oder deinem Fortschritt. Lass sie weg, wenn du schon warm bist.",
  "gloss.firstWeights.title": "Warum wir fragen",
  "gloss.firstWeights.body":
    "Nur um für jede Übung ein sicheres erstes Gewicht vorzuschlagen. Wir fangen eher leicht an und passen nach deinem ersten Training an. Die Angaben bleiben auf deinem Handy.",
  "gloss.healthTwin.title": "Gesundheit",
  "gloss.healthTwin.body":
    "Die Werte deines Körpers an einem Ort: Gewicht, Körperfett, Energie, Schlaf, Herz und Schritte, aus Liftsmith und der Gesundheits-App deines Handys.\nJeder Wert wird mit deinem eigenen Normalwert der letzten 30 Tage verglichen, nie mit anderen Menschen, und sagt dir, was zu tun ist. Das ist keine medizinische Beratung.",
  "gloss.hrv.title": "HRV: Herzfrequenzvariabilität",
  "gloss.hrv.body":
    "Die winzigen Schwankungen der Zeit zwischen zwei Herzschlägen, gemessen von einer Uhr oder einem Ring, meist über Nacht. Höher als dein eigener Normalwert heißt meist, dass du erholt bist; niedriger deutet auf Stress durch Training, schlechten Schlaf oder Krankheit hin.\nNur dein eigener Verlauf zählt: Handys und Uhren messen sie unterschiedlich, also vergleiche deinen Wert nicht mit dem anderer.",
  "gloss.restingHr.title": "Ruhepuls",
  "gloss.restingHr.body":
    "Deine Herzfrequenz in völliger Ruhe, meist im Schlaf gemessen. Ein paar Schläge über deinem Normalwert für ein, zwei Tage sind ein frühes Zeichen, es ruhiger angehen zu lassen.",
  "gloss.breathingRate.title": "Atemfrequenz",
  "gloss.breathingRate.body":
    "Atemzüge pro Minute im Schlaf, gemessen von einer Uhr oder einem Ring. Sie ist sehr stabil, daher ist ein Anstieg um zwei oder mehr über deinen Normalwert oft eines der ersten Anzeichen einer Erkrankung.",
  "gloss.vo2max.title": "VO₂max",
  "gloss.vo2max.body":
    "Wie viel Sauerstoff dein Körper bei voller Anstrengung nutzen kann, in Millilitern pro Kilogramm und Minute. Uhren schätzen ihn aus Spaziergängen und Läufen. Er ist das beste Einzelmaß für die Fitness deines Herzens.\nKrafttraining bewegt ihn kaum. Zwei harte Ausdauereinheiten von 20 Minuten pro Woche schon.",
  "gloss.bodyFat.title": "Körperfett",
  "gloss.bodyFat.body":
    "Der Anteil deines Gewichts, der Fett ist, gemessen mit einer smarten Waage, einem Körperscanner oder einer Hautfaltenzange. Jede Methode misst anders, also bleib bei einer und miss immer zur selben Tageszeit, am besten morgens vor dem Essen.\nEine einzelne Messung sagt wenig. Drei oder mehr über ein paar Wochen zeigen den Trend, und die Coach-Notizen sagen dir, wenn er sich für dein Ziel in die falsche Richtung bewegt.",
  "gloss.leanMass.title": "Magermasse",
  "gloss.leanMass.body":
    "Alles in deinem Körper, was kein Fett ist: Muskeln, Knochen, Organe und Wasser. Dein Gewicht mal dem Anteil, der kein Fett ist. Steigt die Magermasse, während das Körperfett gleich bleibt oder sinkt, baut das Training Muskeln auf.",
  "gloss.bmi.title": "BMI: Body-Mass-Index",
  "gloss.bmi.body":
    "Gewicht geteilt durch Größe zum Quadrat. Ein grober Richtwert für Menschen, die kein Krafttraining machen: Er kann Muskeln nicht von Fett unterscheiden, daher gelten muskulöse Kraftsportler oft als übergewichtig. Wenn du einen Körperfettwert hast, verlass dich lieber darauf.",
  "gloss.restDrop.title": "Herzfrequenzabfall in der Pause",
  "gloss.restDrop.body":
    "Um wie viele Schläge pro Minute deine Herzfrequenz in der ersten Minute nach einem Satz fällt, gemessen von deinem Herzfrequenzmesser. Ein größerer Abfall über die Monate bedeutet ein fitteres Herz; ein kleinerer als sonst kann heißen, dass du müde bist.",
};

export const it: Partial<Record<Key, Message>> = {
  "gloss.fitnessAge.title": "Età fitness",
  "gloss.fitnessAge.body":
    "L’età in cui una persona sana tipica del tuo sesso ha il tuo VO₂ max, secondo un grande studio norvegese su adulti sani.\nÈ una stima della forma fisica, non un controllo medico. Il cardio intenso la abbassa nel giro di qualche settimana.",
  "gloss.deloadWeeks.title": "Settimane di carico prima dello scarico",
  "gloss.deloadWeeks.body":
    "Il tuo allenamento procede a blocchi. Nelle settimane di carico il piano diventa un po’ più duro ogni settimana: più serie e meno ripetizioni di riserva.\nPoi arriva una settimana di scarico: più leggera, con circa metà delle serie. Dà tempo ad articolazioni e sistema nervoso di recuperare, così torni più forte. Scegli meno settimane di carico se sei alle prime armi o hai poco tempo, di più se recuperi bene.",
  "gloss.deload.title": "Settimana di scarico",
  "gloss.deload.body":
    "Una settimana più facile dopo un blocco di allenamento duro: pesi più leggeri e circa metà delle serie. Non è un progresso perso. È il momento in cui il corpo assorbe il lavoro, così il blocco successivo parte più forte.",
  "gloss.rir.title": "RIR: ripetizioni di riserva",
  "gloss.rir.body":
    "Quante ripetizioni in più avresti potuto fare quando chiudi la serie. RIR 2 significa che finisci la serie sentendo di avere ancora circa due buone ripetizioni.\nIl piano parte con più riserva e si avvicina al cedimento nel corso del blocco.",
  "gloss.rpe.title": "RPE: sforzo percepito",
  "gloss.rpe.body":
    "Quanto è stata dura una serie su una scala da 1 a 10, dove 10 è tutto quello che avevi. Un 8 significa che avevi ancora circa due buone ripetizioni, come 2 ripetizioni di riserva.\nScegli questa scala o le ripetizioni di riserva in Impostazioni › Preferenze di allenamento. Il piano funziona allo stesso modo in entrambi i casi.",
  "gloss.blockWeek.title": "Blocco di allenamento",
  "gloss.blockWeek.body":
    "A che punto sei del blocco: quale settimana di carico (o lo scarico) e quante ripetizioni lasciare di riserva questa settimana. Puoi cambiare la durata del blocco nelle Impostazioni.",
  "gloss.readiness.title": "Prontezza",
  "gloss.readiness.body":
    "Un punteggio da 0 a 100, dove 50 è una giornata normale. Dipende da quanto sono recuperati i muscoli principali, da come sono andati gli ultimi allenamenti (ripetizioni completate, sensazioni sulle serie, velocità delle ripetizioni e frequenza cardiaca) e dai giorni di riposo.\nDa 65 in su è un giorno da spingere, 35 o meno un giorno leggero. Puoi sempre ignorarlo.",
  "gloss.call.title": "La scelta di oggi",
  "gloss.call.body":
    "Spingi: il primo esercizio principale va una ripetizione più vicino al cedimento. Come previsto: il piano normale. Leggero: una serie in meno, un gradino più leggero e una ripetizione di riserva in più. La tua scelta viene salvata.",
  "gloss.volume.title": "Volume",
  "gloss.volume.body":
    "Peso × ripetizioni, sommato su tutte le serie allenanti. È una misura approssimativa del lavoro totale svolto. Le serie di riscaldamento non contano.",
  "gloss.e1rm.title": "Massimale stimato",
  "gloss.e1rm.body":
    "Il peso che probabilmente riusciresti a sollevare una volta, calcolato dalle tue serie aggiungendo le ripetizioni che ti restavano. Usa le formule che la ricerca ha trovato più precise per ogni intervallo di ripetizioni (Brzycki ed Epley fino a 10 ripetizioni a cedimento, Mayhew e Wathan oltre), ciascuna mediata con un’equazione del 2026 basata sul peso e calibrata su oltre 300.000 serie. Le serie recenti, pesanti e vicine al cedimento contano di più, quelle oltre le 20 ripetizioni vengono ignorate. Così puoi confrontare una serie da 5 con una da 8 e vedere i veri progressi di forza senza testare un massimale.",
  "gloss.weeklySets.title": "Serie per muscolo questa settimana",
  "gloss.weeklySets.body":
    "Le serie impegnative che hanno allenato ogni muscolo questa settimana. I muscoli secondari contano mezza serie. La fascia verde, da 10 a 20, è l’intervallo che la maggior parte della ricerca indica per la crescita. Il piano punta ai muscoli più lontani da questa fascia.",
  "gloss.variety.title": "Varietà degli esercizi",
  "gloss.variety.body":
    "Quanto spesso il piano mantiene lo stesso esercizio per un muscolo. Più costanza aiuta a seguire i progressi su un esercizio. Più varietà rende l’allenamento meno monotono e distribuisce lo stress.",
  "gloss.recovery.title": "Recupero",
  "gloss.recovery.body":
    "Ogni serie affatica i muscoli che allena. Questa fatica si smaltisce in 2-3 giorni. Fresco è dal 90 % in su, Pronto dal 70 %, In recupero dal 40 %, e Affaticato è sotto il 40 %. Il piano evita i muscoli ancora affaticati.",
  "gloss.superset.title": "Superserie",
  "gloss.superset.body":
    "Due o più esercizi eseguiti di seguito: una serie del primo, poi subito una serie del successivo, poi il riposo. Fa risparmiare tempo e funziona meglio con esercizi che non affaticano gli stessi muscoli, come un rematore con una spinta.\nTocca il collegamento tra due esercizi per abbinarli, e di nuovo per separarli.",
  "gloss.warmup.title": "Serie di riscaldamento",
  "gloss.warmup.body":
    "Serie più leggere che ti portano gradualmente al peso di lavoro. Non contano nelle statistiche né nei progressi. Saltale se sei già caldo.",
  "gloss.firstWeights.title": "Perché te lo chiediamo",
  "gloss.firstWeights.body":
    "Solo per suggerire un primo peso sicuro per ogni esercizio. Partiamo leggeri e aggiustiamo dopo il primo allenamento. Resta sul tuo telefono.",
  "gloss.healthTwin.title": "Salute",
  "gloss.healthTwin.body":
    "I numeri del tuo corpo in un solo posto: peso, grasso corporeo, energia, sonno, cuore e passi, da Liftsmith e dall’app salute del telefono.\nOgnuno è confrontato con la tua normalità degli ultimi 30 giorni, mai con altre persone, e ti dice cosa fare. Non è un consiglio medico.",
  "gloss.hrv.title": "HRV: variabilità della frequenza cardiaca",
  "gloss.hrv.body":
    "Le minime variazioni del tempo tra un battito e l’altro, misurate da un orologio o da un anello, soprattutto di notte. Un valore più alto della tua normalità di solito indica che hai recuperato; più basso indica stress da allenamento, sonno scarso o malattia.\nConta solo il tuo andamento: telefoni e orologi la misurano in modo diverso, quindi non confrontare il tuo numero con quello di altri.",
  "gloss.restingHr.title": "Frequenza cardiaca a riposo",
  "gloss.restingHr.body":
    "La frequenza cardiaca quando sei completamente a riposo, di solito misurata mentre dormi. Qualche battito sopra la tua normalità per un giorno o due è un primo segnale per andarci più piano.",
  "gloss.breathingRate.title": "Frequenza respiratoria",
  "gloss.breathingRate.body":
    "Respiri al minuto mentre dormi, da un orologio o un anello. È molto stabile, quindi un aumento di due o più rispetto alla tua normalità è spesso uno dei primi segnali di una malattia in arrivo.",
  "gloss.vo2max.title": "VO₂ max",
  "gloss.vo2max.body":
    "Quanto ossigeno il corpo riesce a usare al massimo sforzo, in millilitri per chilo al minuto. Gli orologi lo stimano da camminate e corse. È la migliore misura singola della forma del cuore.\nI pesi lo spostano appena. Due sessioni di cardio intenso da 20 minuti a settimana sì.",
  "gloss.bodyFat.title": "Grasso corporeo",
  "gloss.bodyFat.body":
    "La parte del tuo peso che è grasso, da una bilancia smart, uno scanner corporeo o una plicometria. Ogni metodo misura in modo diverso, quindi usane sempre uno e misura alla stessa ora, meglio al mattino prima di mangiare.\nUna sola misurazione dice poco. Tre o più nell’arco di qualche settimana mostrano l’andamento, e le note del coach ti avvisano quando va nella direzione sbagliata per il tuo obiettivo.",
  "gloss.leanMass.title": "Massa magra",
  "gloss.leanMass.body":
    "Tutto ciò che nel corpo non è grasso: muscoli, ossa, organi e acqua. Il tuo peso moltiplicato per la parte che non è grasso. Se la massa magra sale mentre il grasso corporeo resta uguale o scende, l’allenamento sta costruendo muscolo.",
  "gloss.bmi.title": "IMC: indice di massa corporea",
  "gloss.bmi.body":
    "Il peso diviso per l’altezza al quadrato. È un’indicazione approssimativa per chi non si allena con i pesi: non distingue il muscolo dal grasso, quindi chi è muscoloso risulta spesso in sovrappeso. Se hai una misura del grasso corporeo, fidati di quella.",
  "gloss.restDrop.title": "Calo della frequenza cardiaca nel riposo",
  "gloss.restDrop.body":
    "Di quanti battiti al minuto scende la frequenza cardiaca nel primo minuto dopo una serie, dal tuo cardiofrequenzimetro. Un calo più ampio nel corso dei mesi indica un cuore più in forma; uno più piccolo del solito può voler dire che sei stanco.",
};

export const ja: Partial<Record<Key, Message>> = {
  "gloss.fitnessAge.title": "フィットネス年齢",
  "gloss.fitnessAge.body":
    "ノルウェーの健康な成人を対象にした大規模な研究にもとづき、同じ性別の健康な人があなたと同じ VO₂max を持つ年齢です。\n健康診断ではなく、体力の目安です。きつめの有酸素運動を続ければ数週間で下がります。",
  "gloss.deloadWeeks.title": "ディロード前の強化週",
  "gloss.deloadWeeks.body":
    "トレーニングはブロック単位で進みます。強化週のあいだ、プランは毎週少しずつきつくなります。セット数が増え、余力のレップ数が減ります。\nその後にディロード週が1週あります。重量を軽くし、セット数はおよそ半分です。関節や神経が追いつく時間になり、より強くなって戻れます。初心者や忙しい人は強化週を少なめに、回復が早い人は多めにしましょう。",
  "gloss.deload.title": "ディロード週",
  "gloss.deload.body":
    "きついトレーニングのブロックの後に入れる軽めの週です。重量を下げ、セット数はおよそ半分にします。進歩が失われるわけではありません。体がそれまでの負荷を吸収する期間で、次のブロックをより強い状態で始められます。",
  "gloss.rir.title": "RIR：余力レップ数",
  "gloss.rir.body":
    "セットを終えた時点で、あと何回できたかを表します。RIR 2 は、あと2回ほどきれいにできそうな余力を残してセットを終えるという意味です。\nプランは余力を多めに残して始まり、ブロックが進むにつれて限界に近づいていきます。",
  "gloss.rpe.title": "RPE：主観的運動強度",
  "gloss.rpe.body":
    "セットのきつさを1〜10で表します。10は出し切った状態です。8なら、あと2回ほどきれいにできる余力があったという意味で、余力レップ数2と同じです。\nこの尺度と余力レップ数のどちらを使うかは、設定 › ワークアウトの設定で選べます。どちらでもプランの動きは同じです。",
  "gloss.blockWeek.title": "トレーニングブロック",
  "gloss.blockWeek.body":
    "ブロックの中で今どこにいるかを示します。何週目の強化週か（またはディロード週か）と、今週どれだけ余力を残すかです。ブロックの長さは設定で変更できます。",
  "gloss.readiness.title": "コンディション",
  "gloss.readiness.body":
    "0〜100のスコアで、50が普段どおりの日です。大きな筋肉の回復具合、最近のワークアウトの内容（達成したレップ数、セットのきつさ、レップの速度、心拍数）、休養日から算出します。\n65以上は攻める日、35以下は軽めの日です。判断はいつでも自分で変えられます。",
  "gloss.call.title": "今日の判断",
  "gloss.call.body":
    "攻める：最初の主要種目を1レップ限界に近づけます。予定どおり：通常のプランです。軽めに：1セット減らし、1段階軽くして、余力を1レップ増やします。選んだ内容は保存されます。",
  "gloss.volume.title": "ボリューム",
  "gloss.volume.body":
    "重量 × レップ数を、すべての本番セットで合計したものです。こなした仕事量の大まかな目安です。ウォームアップは含みません。",
  "gloss.e1rm.title": "推定1RM",
  "gloss.e1rm.body":
    "1回だけ挙げられるであろう最大重量です。各セットに、残っていた余力レップ数を足して計算します。レップ数の範囲ごとに研究で最も正確とされた式（限界まで10レップ以下は Brzycki と Epley、それ以上は Mayhew と Wathan）を使い、それぞれを30万セット以上で調整した2026年の体重ベースの式と平均します。最近の、重い、限界に近いセットほど重視し、20レップを超えるセットは使いません。5レップのセットと8レップのセットを比べられるので、本当の最大重量を測らなくても筋力の推移がわかります。",
  "gloss.weeklySets.title": "今週の部位別セット数",
  "gloss.weeklySets.body":
    "今週、各部位を鍛えたきついセットの数です。補助的に使われた部位は0.5セットとして数えます。緑の帯（10〜20）は、筋肥大に効果的だとする研究が最も多い範囲です。プランはこの範囲から最も下回っている部位を優先します。",
  "gloss.variety.title": "種目のバリエーション",
  "gloss.variety.body":
    "ある部位に対して、プランが同じ種目をどのくらい続けるかを決めます。固定するほど種目ごとの進歩を追いやすくなります。変化をつけるほど新鮮さが保たれ、負担も分散します。",
  "gloss.recovery.title": "回復",
  "gloss.recovery.body":
    "セットをこなすと、使った筋肉は疲労します。その疲労は2〜3日かけて抜けていきます。90%以上は「万全」、70%以上は「準備OK」、40%以上は「回復中」、40%未満は「疲労」です。プランはまだ疲労している部位を避けます。",
  "gloss.superset.title": "スーパーセット",
  "gloss.superset.body":
    "2つ以上の種目を続けて行う方法です。1つ目を1セット、すぐに次の種目を1セット行い、それから休憩します。時間の節約になり、ロウとプレスのように同じ筋肉を疲れさせない組み合わせで特に効果的です。\n2つの種目の間のリンクをタップすると組み合わせ、もう一度タップすると分けられます。",
  "gloss.warmup.title": "ウォームアップセット",
  "gloss.warmup.body":
    "本番の重量まで段階的に上げていく軽めのセットです。記録や進歩には含まれません。すでに体が温まっていればスキップしてかまいません。",
  "gloss.firstWeights.title": "お聞きする理由",
  "gloss.firstWeights.body":
    "各種目で安全な最初の重量を提案するためだけに使います。軽めから始め、最初のワークアウトの後に調整します。情報はスマートフォンの中だけに保存されます。",
  "gloss.healthTwin.title": "ヘルス",
  "gloss.healthTwin.body":
    "体重、体脂肪、エネルギー、睡眠、心臓、歩数など、体の数値を Liftsmith とスマートフォンのヘルスケアアプリからまとめて表示します。\nどの数値も他人とではなく、直近30日間のあなた自身の普段の値と比べ、何をすべきかを伝えます。医学的な助言ではありません。",
  "gloss.hrv.title": "HRV：心拍変動",
  "gloss.hrv.body":
    "心拍と心拍の間隔のわずかな揺らぎで、主に夜間にウォッチやリングで測定します。普段より高ければ回復できていることが多く、低ければトレーニングの負担、睡眠不足、体調不良などのストレスを示します。\n大事なのは自分自身の推移だけです。スマートフォンやウォッチによって測り方が違うので、他人の数値とは比べないでください。",
  "gloss.restingHr.title": "安静時心拍数",
  "gloss.restingHr.body":
    "完全に安静にしているときの心拍数で、通常は睡眠中に測ります。普段より数拍高い日が1〜2日続いたら、ペースを落とす早めのサインです。",
  "gloss.breathingRate.title": "呼吸数",
  "gloss.breathingRate.body":
    "睡眠中の1分あたりの呼吸数で、ウォッチやリングで測ります。とても安定した値なので、普段より2回以上増えたら、体調を崩す最初のサインであることがよくあります。",
  "gloss.vo2max.title": "VO₂max",
  "gloss.vo2max.body":
    "全力を出したときに体が使える酸素の量で、体重1kgあたり1分間のミリリットルで表します。ウォッチがウォーキングやランニングから推定します。心肺の体力を表す最も優れた単一の指標です。\n筋トレではほとんど変わりません。週2回、20分のきつめの有酸素運動なら変わります。",
  "gloss.bodyFat.title": "体脂肪",
  "gloss.bodyFat.body":
    "体重のうち脂肪が占める割合で、スマート体重計、ボディスキャナー、キャリパーなどで測ります。方法によって数値が違うので、1つの方法に決めて毎回同じ時間帯、できれば朝食前の朝に測りましょう。\n1回の測定ではあまり意味がありません。数週間で3回以上測ると傾向がわかり、目標に対して悪い方向に動いているとコーチのメモが知らせます。",
  "gloss.leanMass.title": "除脂肪量",
  "gloss.leanMass.body":
    "体の中で脂肪以外のすべて、つまり筋肉、骨、内臓、水分です。体重に脂肪以外の割合を掛けて求めます。体脂肪が横ばいか減っている間に除脂肪量が増えていれば、トレーニングで筋肉がついています。",
  "gloss.bmi.title": "BMI：体格指数",
  "gloss.bmi.body":
    "体重を身長の2乗で割った値です。筋トレをしない人向けの大まかな目安で、筋肉と脂肪を区別できないため、筋肉量の多い人は肥満と判定されがちです。体脂肪の測定値があれば、そちらを信頼してください。",
  "gloss.restDrop.title": "休憩中の心拍数の低下",
  "gloss.restDrop.body":
    "セット後の最初の1分間で心拍数が1分あたり何拍下がるかを、心拍計で測ったものです。数か月かけて下がり幅が大きくなれば心肺が鍛えられた証拠で、いつもより小さければ疲れているのかもしれません。",
};
