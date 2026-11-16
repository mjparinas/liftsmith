import type { Message } from "@/lib/i18n";

// Text for keys starting "gloss.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "gloss.barPath.title": "Bar path",
  "gloss.barPath.body":
    "The line the bar takes on each rep, seen side-on. On squats, deadlifts and overhead presses it works best going about straight up and down over the middle of your foot.\nAfter the set, the replay shows the rep worth seeing: the blue line is the bar, and the dashed line is straight up from where it started. If the bar drifted forward or back on a quarter of your reps or more, you get one cue. It's a rough read from one camera (your shoulders stand in for the bar on a squat, your hands on the other lifts), so it stays quiet unless it's clear.",
  "gloss.formCheck.title": "Form check",
  "gloss.formCheck.body":
    "While it counts reps, the camera also looks at how each rep moved: on squats, whether your hips got down level with your knees; on every lift, whether some reps were cut short of your best; and on squats, deadlifts and overhead presses, whether you leaned to one side.\nBetween sets it gives the one thing most worth fixing, with how many reps it saw it on, and the figure shows it: where your short reps stopped, or the way you leaned. It's a rough check from one camera, so it stays quiet unless it's clear. Side-on shows depth best; facing the camera shows a lean.",
  "gloss.speedMax.title": "Today's max from bar speed",
  "gloss.speedMax.body":
    "The heavier the weight, the slower it moves, and every lift has a speed at which a rep is about as heavy as you can go. Your warm-ups give a few weights and their speeds, and the line through them points to the weight you'd move at that speed: today's estimated max.\nWhen it's well above or below what today's plan expects, we suggest a small change, at most 5% heavier or 10% lighter. It's a camera estimate, so let your first set have the last word.\nThat speed differs a little from person to person, and the camera measures your body rather than the bar. So when you take a working set to failure while the camera counts (a rep that doesn't make it, no reps left, or fewer reps than planned), its last good rep's speed is kept, and after three such sets the estimate uses your own speed instead of the usual one.",
  "gloss.barSpeed.title": "Bar speed",
  "gloss.barSpeed.body":
    "How fast the bar goes up on each rep, measured by the camera. As a set gets hard, the bar slows down, even when the reps still feel fine.\nWhen it's about a third slower than your fastest rep, you have roughly one good rep left, so ending the set there keeps the work hard without grinding. It's an estimate: a side-on view and good light help.",
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
    "How hard a set felt on a 1 to 10 scale, where 10 is all you had. An 8 means you had about two more good reps in you, the same as 2 reps in reserve.",
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
  "gloss.experience.title": "Experience",
  "gloss.experience.body":
    "How long you've been lifting regularly. New is under a year, Some is 1 to 3 years, and Experienced is 3 years or more.\nIt sets how many hard sets each muscle gets a week (8 to 12 for New, 10 to 16 for Some, 12 to 20 for Experienced) and how heavy the first weights are on lifts you haven't logged yet. After you log a lift, your own sets set its weights.\nIt also picks the starting step in bodyweight programs and how fast your lift goals are forecast to move. Not sure? Pick the lower one; the plan catches up quickly.",
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
  "gloss.breathPattern.title": "Breathing patterns",
  "gloss.breathPattern.body":
    "A guide for the rest between sets: follow the dot round the box, and the square as it grows and shrinks. Each change of step gives a soft sound and a light buzz, so you can follow it with your eyes closed.\nBox breathing: in, hold, out and hold, 4 seconds each. Steady and calming.\n4-7-8: in for 4, hold for 7, out for 8. The long breath out slows the heart the most.\nDouble sigh: a breath in, a short second sip on top, then a long breath out. The quickest way to settle.\nSlow breaths: in for 4, out for 6.\nYour own: set each side of the box yourself. A hold of 0 leaves it out.",
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
  "gloss.liftScores.title": "DOTS, Wilks and IPF GL",
  "gloss.liftScores.body":
    "Three ways to score a squat, bench and deadlift total for body weight, so a light lifter and a heavy one can be compared.\nDOTS (2019) and IPF GL (2020) are the newer, fairer formulas; Wilks is the older one many lifters still know. Compare a score only with the same formula.",
  "gloss.ffmi.title": "FFMI: fat-free mass index",
  "gloss.ffmi.body":
    "Your lean mass (everything but fat) divided by your height squared, adjusted to a standard height of 1.8 m. It shows how much muscle you carry, which BMI can't.\nMost men who lift land between 19 and 23, and women about 4 lower. A study of drug-free lifters found few above 25.",
  "gloss.hrZones.title": "Heart rate zones",
  "gloss.hrZones.body":
    "Five bands of effort set from your maximum heart rate, from easy (zone 1) to all-out (zone 5).\nWith a resting heart rate, they use your heart rate reserve (the gap between resting and maximum), which follows your fitness better.",
  "gloss.restDrop.title": "Heart rate drop in rest",
  "gloss.restDrop.body":
    "How many beats a minute your heart rate falls in the first minute after a set, from your heart rate monitor. A bigger drop over the months means a fitter heart; a smaller one than usual can mean you're tired.",
  "gloss.setTypes.title": "Drop sets and rest-pause",
  "gloss.setTypes.body":
    "Bonus sets you can add between sets, once the planned set is logged.\nA drop set takes the weight down by about a quarter and goes again straight away. A rest-pause set keeps the same weight, pauses for 15 seconds, then squeezes out a few more reps.\nBoth add work for the muscle without a full extra set. They count in your volume, but the plan's next weights only read your planned sets.",
  "gloss.stretching.title": "Warm-up moves and cool-down holds",
  "gloss.stretching.body":
    "Warm-up moves are moving stretches and drills. They raise your heart rate and take your joints through their range, so the first sets feel better.\nCool-down holds are still stretches you hold for 30 seconds or more while breathing slowly. They suit the end of a workout or a rest day, when muscles are warm. Stretch to mild tension, never to pain.",
  "gloss.crate.title": "Crates and the Locker",
  "gloss.crate.body":
    "Every finished workout gives you a crate on the Done screen. It holds one accent colour, rest timer sound or plate finish, picked at random: commons turn up most often and legendaries least.\nSome levels give a set item, and each new title gives a bonus crate, so even the rarest items have a sure path. Tap a locked item to see how to get it.\nIf you get something you already own, it turns into 25 bonus XP. Pick what you use here in the Locker.",
  "gloss.badges.title": "Achievements and badges",
  "gloss.badges.body":
    "An achievement is a goal, like finishing workouts or setting personal bests. Each one has up to four badges, bronze, silver, gold and platinum, earned at bigger and bigger numbers.\nSome badges also unlock a colour theme for the app; the badge says which. Every badge gives XP, which raises your level.",
  "gloss.monthly.title": "The monthly challenge",
  "gloss.monthly.body":
    "Every lifter gets the same challenge each month: a number of workouts, sets or minutes, rotating month to month. Your own finished workouts count, so it works offline.\nFinish it before the month ends to earn that month's medal. Each finished month counts toward the Monthly challenger badge. Friends › Board shows how the people you follow are doing.",
  "gloss.schoolTeams.title": "School teams",
  "gloss.schoolTeams.body":
    "High school coaches get Pro free once they confirm an email address from their school or district. Their athletes aged 13 to 18 get Pro free too, for as long as they're on the team.\nThe coach sees your workouts, not your body data. Teammates see only your first name and how many workouts and sets you did this week.",
  "gloss.strengthStandards.title": "Strength standards",
  "gloss.strengthStandards.body":
    "Typical estimated one-rep maxes for trained lifters, scaled to body weight and adjusted for age and sex when you've added them, from the shape of published strength standards and masters coefficients.\nThe percentage is a rough share of trained lifters your estimate beats, not a ranking of real Liftsmith users. Height and BMI aren't used.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Trayectoria de la barra",
  "gloss.barPath.body":
    "La línea que sigue la barra en cada repetición, vista de perfil. En sentadilla, peso muerto y press militar funciona mejor si sube y baja casi recta sobre el centro del pie.\nTras la serie, la repetición muestra la que vale la pena ver: la línea azul es la barra y la discontinua sube recta desde donde empezó. Si la barra se desvió hacia delante o hacia atrás en una cuarta parte de tus repeticiones o más, recibes un consejo. Es una lectura aproximada con una sola cámara (en la sentadilla tus hombros hacen de barra y en los demás ejercicios tus manos), así que no dice nada salvo que esté claro.",
  "gloss.formCheck.title": "Revisión de técnica",
  "gloss.formCheck.body":
    "Mientras cuenta repeticiones, la cámara también mira cómo se movió cada una: en sentadillas, si la cadera bajó hasta la altura de las rodillas; en todos los ejercicios, si algunas repeticiones fueron más cortas que tu mejor; y en sentadillas, pesos muertos y presses por encima de la cabeza, si te inclinaste hacia un lado.\nEntre series te da lo que más vale la pena corregir, con en cuántas repeticiones lo vio, y la figura lo muestra: dónde se quedaron tus repeticiones cortas o hacia dónde te inclinaste. Es una revisión aproximada con una sola cámara, así que solo habla cuando está claro. De lado se ve mejor la profundidad; de frente, la inclinación.",
  "gloss.speedMax.title": "Tu máximo de hoy según la velocidad",
  "gloss.speedMax.body":
    "Cuanto más pesa la barra, más despacio sube, y cada ejercicio tiene una velocidad a la que una repetición es casi lo máximo que puedes. Tu calentamiento da unos cuantos pesos con sus velocidades, y la línea que los une apunta al peso que moverías a esa velocidad: tu máximo estimado de hoy.\nSi queda bastante por encima o por debajo de lo que espera el plan, sugerimos un pequeño cambio, como mucho un 5 % más o un 10 % menos. Es una estimación de la cámara, así que la primera serie tiene la última palabra.\nEsa velocidad cambia un poco de una persona a otra, y la cámara mide tu cuerpo y no la barra. Por eso, cuando llevas una serie de trabajo al fallo mientras cuenta la cámara (una repetición que no sale, ninguna en reserva o menos de las previstas), se guarda la velocidad de su última repetición buena, y tras tres series así la estimación usa tu propia velocidad en lugar de la habitual.",
  "gloss.barSpeed.title": "Velocidad de la barra",
  "gloss.barSpeed.body":
    "Lo rápido que sube la barra en cada repetición, medido por la cámara. Cuando la serie se pone dura, la barra se frena, aunque las repeticiones aún se sientan bien.\nCuando va un tercio más lenta que tu repetición más rápida, te queda más o menos una buena repetición, así que terminar ahí mantiene el trabajo duro sin forzar. Es una estimación: ayuda verte de lado y tener buena luz.",
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
    "Lo dura que se sintió una serie en una escala del 1 al 10, donde 10 es todo lo que tenías. Un 8 significa que te quedaban unas dos buenas repeticiones, lo mismo que 2 repeticiones en reserva.",
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
  "gloss.experience.title": "Experiencia",
  "gloss.experience.body":
    "Cuánto tiempo llevas entrenando con pesas de forma regular. Principiante es menos de un año, Algo es de 1 a 3 años y Con experiencia es 3 años o más.\nDefine cuántas series duras recibe cada músculo por semana (8 a 12 para Principiante, 10 a 16 para Algo, 12 a 20 para Con experiencia) y qué tan pesados son los primeros pesos en los ejercicios que aún no has registrado. Cuando registras un ejercicio, tus propias series fijan sus pesos.\nTambién elige el paso inicial en los programas con peso corporal y la rapidez con la que se prevé que avancen tus objetivos. ¿No lo tienes claro? Elige el nivel más bajo; el plan se pone al día rápido.",
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
  "gloss.breathPattern.title": "Patrones de respiración",
  "gloss.breathPattern.body":
    "Una guía para el descanso entre series: sigue el punto alrededor del cuadrado y el cuadrado que crece y se encoge. Cada cambio de paso suena suave y vibra un poco, para que puedas seguirla con los ojos cerrados.\nRespiración cuadrada: inspira, mantén, espira y mantén, 4 segundos cada uno. Constante y calmante.\n4-7-8: inspira 4, mantén 7, espira 8. La espiración larga es lo que más frena el corazón.\nDoble suspiro: una inspiración, un segundo sorbo corto encima y luego una espiración larga. La forma más rápida de calmarte.\nRespiración lenta: inspira 4, espira 6.\nPersonalizada: elige tú cada lado del cuadrado. Un 0 en una pausa la quita.",
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
  "gloss.liftScores.title": "DOTS, Wilks e IPF GL",
  "gloss.liftScores.body":
    "Tres formas de puntuar un total de sentadilla, banca y peso muerto según el peso corporal, para comparar a alguien ligero con alguien pesado.\nDOTS (2019) e IPF GL (2020) son las fórmulas más nuevas y justas; Wilks es la antigua que mucha gente aún conoce. Compara una puntuación solo con la misma fórmula.",
  "gloss.ffmi.title": "FFMI: índice de masa libre de grasa",
  "gloss.ffmi.body":
    "Tu masa magra (todo menos la grasa) dividida por tu altura al cuadrado, ajustada a una altura estándar de 1,8 m. Muestra cuánto músculo tienes, cosa que el IMC no puede.\nLa mayoría de los hombres que entrenan está entre 19 y 23, y las mujeres unos 4 menos. Un estudio con personas sin fármacos encontró pocas por encima de 25.",
  "gloss.hrZones.title": "Zonas de frecuencia cardiaca",
  "gloss.hrZones.body":
    "Cinco franjas de esfuerzo a partir de tu frecuencia máxima, de suave (zona 1) a máximo (zona 5).\nCon la frecuencia en reposo usan tu reserva cardiaca (la diferencia entre reposo y máxima), que sigue mejor tu forma física.",
  "gloss.restDrop.title": "Bajada de pulsaciones en el descanso",
  "gloss.restDrop.body":
    "Cuántas pulsaciones por minuto baja tu frecuencia cardiaca en el primer minuto tras una serie, según tu pulsómetro. Una bajada mayor con los meses indica un corazón más en forma; una menor de lo habitual puede indicar cansancio.",
  "gloss.setTypes.title": "Series descendentes y rest-pause",
  "gloss.setTypes.body":
    "Series extra que puedes añadir entre series, una vez registrada la serie planificada.\nUna serie descendente baja el peso más o menos una cuarta parte y vuelve a empezar sin descanso. Una serie rest-pause mantiene el peso, descansa 15 segundos y saca unas pocas repeticiones más.\nAmbas suman trabajo para el músculo sin una serie completa más. Cuentan en tu volumen, pero los próximos pesos del plan solo leen tus series planificadas.",
  "gloss.stretching.title": "Calentamiento y vuelta a la calma",
  "gloss.stretching.body":
    "Los movimientos de calentamiento son estiramientos en movimiento y ejercicios suaves. Suben el pulso y llevan las articulaciones por todo su recorrido, así las primeras series se sienten mejor.\nLos estiramientos de vuelta a la calma se mantienen quietos 30 segundos o más, respirando despacio. Van bien al final del entrenamiento o en un día de descanso, con los músculos calientes. Estira hasta notar una tensión suave, nunca dolor.",
  "gloss.crate.title": "Cofres y la taquilla",
  "gloss.crate.body":
    "Cada entrenamiento terminado te da un cofre en la pantalla final. Trae un color de acento, un sonido del temporizador o un acabado de discos al azar: los comunes salen más a menudo y los legendarios menos.\nAlgunos niveles dan un objeto fijo y cada título nuevo da un cofre extra, así que hasta los objetos más raros tienen un camino seguro. Toca un objeto bloqueado para ver cómo conseguirlo.\nSi te toca algo que ya tienes, se convierte en 25 XP extra. Elige lo que usas aquí, en la taquilla.",
  "gloss.badges.title": "Logros e insignias",
  "gloss.badges.body":
    "Un logro es una meta, como terminar entrenamientos o batir marcas personales. Cada uno tiene hasta cuatro insignias, bronce, plata, oro y platino, que se ganan con cifras cada vez mayores.\nAlgunas insignias también desbloquean un tema de color para la app; la insignia dice cuál. Cada insignia da XP, que sube tu nivel.",
  "gloss.monthly.title": "El reto del mes",
  "gloss.monthly.body":
    "Todos reciben el mismo reto cada mes: un número de entrenamientos, series o minutos, que va cambiando de mes en mes. Cuentan tus entrenamientos terminados, así que funciona sin conexión.\nTermínalo antes de que acabe el mes para ganar la medalla de ese mes. Cada mes terminado cuenta para la insignia Reto del mes. Amigos › Clasificación muestra cómo van las personas que sigues.",
  "gloss.schoolTeams.title": "Equipos escolares",
  "gloss.schoolTeams.body":
    "Los entrenadores de secundaria tienen Pro gratis al confirmar una dirección de correo de su escuela o distrito. Sus atletas de 13 a 18 años también tienen Pro gratis mientras estén en el equipo.\nEl entrenador ve tus entrenamientos, no tus datos corporales. Tus compañeros solo ven tu nombre de pila y cuántos entrenamientos y series hiciste esta semana.",
  "gloss.strengthStandards.title": "Estándares de fuerza",
  "gloss.strengthStandards.body":
    "Máximos estimados típicos de personas entrenadas, según el peso corporal y ajustados por edad y sexo si los has añadido, a partir de estándares de fuerza publicados y coeficientes de veteranos.\nEl porcentaje es una idea aproximada de a cuántas personas entrenadas superas, no una clasificación de usuarios reales de Liftsmith. No se usan la altura ni el IMC.",
};

export const fr: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Trajectoire de la barre",
  "gloss.barPath.body":
    "La ligne que suit la barre à chaque répétition, vue de profil. Au squat, au soulevé de terre et au développé militaire, elle fonctionne le mieux en montant et descendant presque droit au-dessus du milieu du pied.\nAprès la série, la relecture montre la répétition qui vaut le coup d'œil : la ligne bleue est la barre, la ligne pointillée monte droit depuis son point de départ. Si la barre a dévié vers l'avant ou l'arrière sur un quart de vos répétitions ou plus, vous recevez un conseil. C'est une lecture approximative avec une seule caméra (vos épaules remplacent la barre au squat, vos mains pour les autres exercices), elle ne dit donc rien sauf si c'est net.",
  "gloss.formCheck.title": "Contrôle de la technique",
  "gloss.formCheck.body":
    "Pendant qu’elle compte les répétitions, la caméra regarde aussi comment chacune a bougé : au squat, si vos hanches sont descendues au niveau des genoux ; sur tous les exercices, si certaines répétitions étaient plus courtes que votre meilleure ; et au squat, au soulevé de terre et au développé au-dessus de la tête, si vous avez penché d’un côté.\nEntre les séries, elle donne la chose la plus utile à corriger, avec le nombre de répétitions concernées, et la silhouette la montre : où vos répétitions courtes se sont arrêtées, ou de quel côté vous avez penché. C’est un contrôle approximatif avec une seule caméra : elle ne dit rien tant que ce n’est pas net. De profil, on voit mieux la profondeur ; de face, l’inclinaison.",
  "gloss.speedMax.title": "Votre max du jour d'après la vitesse",
  "gloss.speedMax.body":
    "Plus la charge est lourde, plus elle monte lentement, et chaque exercice a une vitesse à laquelle une répétition est presque votre maximum. Votre échauffement donne quelques charges et leurs vitesses, et la droite qui les relie indique la charge que vous lèveriez à cette vitesse : votre max estimé du jour.\nS'il est nettement au-dessus ou en dessous de ce que prévoit le plan, nous proposons un petit changement, au plus 5 % de plus ou 10 % de moins. C'est une estimation de la caméra : votre première série a le dernier mot.\nCette vitesse varie un peu d'une personne à l'autre, et la caméra mesure votre corps plutôt que la barre. Quand vous menez une série de travail à l'échec pendant que la caméra compte (une répétition qui ne passe pas, plus aucune en réserve ou moins que prévu), la vitesse de sa dernière bonne répétition est gardée, et après trois séries de ce genre l'estimation utilise votre propre vitesse au lieu de la vitesse habituelle.",
  "gloss.barSpeed.title": "Vitesse de barre",
  "gloss.barSpeed.body":
    "La vitesse de montée de la barre à chaque répétition, mesurée par la caméra. Quand une série devient dure, la barre ralentit, même si les répétitions semblent encore faciles.\nQuand elle est environ un tiers plus lente que votre répétition la plus rapide, il vous reste à peu près une bonne répétition : finir là garde l’effort intense sans forcer. C’est une estimation : une vue de profil et une bonne lumière aident.",
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
    "La difficulté ressentie d’une série sur une échelle de 1 à 10, où 10 est tout ce que vous aviez. Un 8 signifie qu’il vous restait environ deux bonnes répétitions, comme 2 répétitions en réserve.",
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
  "gloss.experience.title": "Expérience",
  "gloss.experience.body":
    "Depuis combien de temps tu t’entraînes régulièrement. Débutant, c’est moins d’un an, Un peu, de 1 à 3 ans, et Confirmé, 3 ans ou plus.\nElle fixe le nombre de séries difficiles par muscle et par semaine (8 à 12 pour Débutant, 10 à 16 pour Un peu, 12 à 20 pour Confirmé) et la lourdeur des premières charges sur les exercices que tu n’as pas encore enregistrés. Une fois un exercice enregistré, ce sont tes propres séries qui fixent ses charges.\nElle choisit aussi l’étape de départ des programmes au poids du corps et la vitesse prévue de tes objectifs. Tu hésites ? Choisis le niveau le plus bas ; le plan rattrape vite.",
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
  "gloss.breathPattern.title": "Rythmes de respiration",
  "gloss.breathPattern.body":
    "Un guide pour le repos entre les séries : suivez le point autour du carré, et le carré qui grandit et rétrécit. Chaque changement d’étape donne un son doux et une légère vibration, pour le suivre les yeux fermés.\nRespiration carrée : inspirez, retenez, expirez et retenez, 4 secondes chacun. Régulière et apaisante.\n4-7-8 : inspirez 4, retenez 7, expirez 8. La longue expiration ralentit le plus le cœur.\nDouble soupir : une inspiration, une deuxième petite gorgée d’air, puis une longue expiration. Le moyen le plus rapide de se calmer.\nRespiration lente : inspirez 4, expirez 6.\nPersonnalisée : réglez vous-même chaque côté du carré. Une pause à 0 est retirée.",
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
  "gloss.liftScores.title": "DOTS, Wilks et IPF GL",
  "gloss.liftScores.body":
    "Trois façons de noter un total squat, développé couché et soulevé de terre selon le poids de corps, pour comparer un gabarit léger et un lourd.\nDOTS (2019) et IPF GL (2020) sont les formules récentes et plus justes ; Wilks est l'ancienne que beaucoup connaissent encore. Ne comparez un score qu'avec la même formule.",
  "gloss.ffmi.title": "FFMI : indice de masse non grasse",
  "gloss.ffmi.body":
    "Votre masse maigre (tout sauf le gras) divisée par votre taille au carré, ramenée à une taille standard de 1,8 m. Il montre combien de muscle vous portez, ce que l'IMC ne peut pas faire.\nLa plupart des hommes qui s'entraînent sont entre 19 et 23, les femmes environ 4 de moins. Une étude sur des pratiquants sans dopage en a trouvé peu au-dessus de 25.",
  "gloss.hrZones.title": "Zones de fréquence cardiaque",
  "gloss.hrZones.body":
    "Cinq niveaux d'effort calculés à partir de votre fréquence maximale, du plus facile (zone 1) au maximum (zone 5).\nAvec une fréquence au repos, elles utilisent votre réserve cardiaque (l'écart entre repos et maximum), qui suit mieux votre forme.",
  "gloss.restDrop.title": "Baisse du rythme cardiaque au repos",
  "gloss.restDrop.body":
    "De combien de battements par minute votre fréquence cardiaque baisse dans la première minute après une série, d’après votre cardiofréquencemètre. Une baisse plus grande au fil des mois signifie un cœur plus en forme ; une baisse plus faible que d’habitude peut signaler de la fatigue.",
  "gloss.setTypes.title": "Séries dégressives et rest-pause",
  "gloss.setTypes.body":
    "Des séries bonus à ajouter entre deux séries, une fois la série prévue enregistrée.\nUne série dégressive baisse la charge d’environ un quart et repart tout de suite. Une série rest-pause garde la même charge, fait une pause de 15 secondes, puis arrache quelques reps de plus.\nLes deux ajoutent du travail au muscle sans une série complète en plus. Elles comptent dans votre volume, mais les prochaines charges du plan ne lisent que vos séries prévues.",
  "gloss.stretching.title": "Échauffement et retour au calme",
  "gloss.stretching.body":
    "Les mouvements d’échauffement sont des étirements en mouvement et des exercices doux. Ils font monter le cœur et font travailler les articulations sur toute leur amplitude, pour que les premières séries passent mieux.\nLes étirements de retour au calme se tiennent immobiles 30 secondes ou plus, en respirant lentement. Ils conviennent à la fin d’une séance ou à un jour de repos, muscles chauds. Étirez jusqu’à une légère tension, jamais jusqu’à la douleur.",
  "gloss.crate.title": "Coffres et vestiaire",
  "gloss.crate.body":
    "Chaque séance terminée vous donne un coffre sur l’écran de fin. Il contient une couleur d’accent, un son de minuteur ou une finition de disques, au hasard : les communs sortent le plus souvent, les légendaires le moins.\nCertains niveaux donnent un objet précis et chaque nouveau titre un coffre bonus : même les objets les plus rares ont un chemin sûr. Touchez un objet verrouillé pour voir comment l’obtenir.\nSi vous obtenez un objet que vous avez déjà, il devient 25 XP bonus. Choisissez ce que vous utilisez ici, dans le vestiaire.",
  "gloss.badges.title": "Succès et badges",
  "gloss.badges.body":
    "Un succès est un objectif, comme terminer des séances ou battre des records personnels. Chacun a jusqu’à quatre badges, bronze, argent, or et platine, obtenus à des seuils de plus en plus hauts.\nCertains badges débloquent aussi un thème de couleur pour l’app ; le badge indique lequel. Chaque badge donne de l’XP, qui fait monter votre niveau.",
  "gloss.monthly.title": "Le défi du mois",
  "gloss.monthly.body":
    "Chaque mois, tout le monde a le même défi : un nombre de séances, de séries ou de minutes, qui change d’un mois à l’autre. Vos séances terminées comptent, donc ça marche hors ligne.\nRéussissez-le avant la fin du mois pour gagner la médaille du mois. Chaque mois réussi compte pour le badge Défi du mois. Amis › Classement montre où en sont les personnes que vous suivez.",
  "gloss.schoolTeams.title": "Équipes scolaires",
  "gloss.schoolTeams.body":
    "Les entraîneurs d’école secondaire ont Pro gratuitement après avoir confirmé une adresse courriel de leur école ou de leur district. Leurs athlètes de 13 à 18 ans ont aussi Pro gratuitement tant qu’ils font partie de l’équipe.\nL’entraîneur voit vos séances, pas vos données corporelles. Vos coéquipiers ne voient que votre prénom et le nombre de séances et de séries de la semaine.",
  "gloss.strengthStandards.title": "Normes de force",
  "gloss.strengthStandards.body":
    "Maxima estimés typiques de personnes entraînées, selon le poids de corps et ajustés pour l'âge et le sexe si tu les as ajoutés, d'après des normes de force publiées et des coefficients masters.\nLe pourcentage est une part approximative des personnes entraînées que tu dépasses, pas un classement de vrais utilisateurs de Liftsmith. La taille et l'IMC ne sont pas utilisés.",
};

export const de: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Stangenweg",
  "gloss.barPath.body":
    "Die Linie, die die Stange bei jeder Wiederholung nimmt, von der Seite gesehen. Bei Kniebeugen, Kreuzheben und Schulterdrücken läuft sie am besten fast gerade auf und ab über der Fußmitte.\nNach dem Satz zeigt die Wiedergabe die Wiederholung, die sich lohnt: Die blaue Linie ist die Stange, die gestrichelte geht gerade nach oben von dort, wo sie startete. Ist die Stange bei einem Viertel deiner Wiederholungen oder mehr nach vorn oder hinten abgewichen, bekommst du einen Tipp. Es ist eine grobe Messung mit einer Kamera (bei Kniebeugen stehen deine Schultern für die Stange, bei den anderen Übungen deine Hände), deshalb sagt sie nur etwas, wenn es eindeutig ist.",
  "gloss.formCheck.title": "Technik-Check",
  "gloss.formCheck.body":
    "Während sie Wiederholungen zählt, schaut die Kamera auch, wie jede Wiederholung lief: bei Kniebeugen, ob die Hüfte bis auf Kniehöhe kam; bei jeder Übung, ob manche Wiederholungen kürzer waren als deine beste; und bei Kniebeugen, Kreuzheben und Überkopfdrücken, ob du dich zu einer Seite geneigt hast.\nZwischen den Sätzen nennt sie das, was sich am meisten zu verbessern lohnt, mit der Zahl der betroffenen Wiederholungen, und die Figur zeigt es: wo deine kurzen Wiederholungen endeten oder wohin du dich geneigt hast. Es ist eine grobe Prüfung mit einer Kamera, daher meldet sie sich nur, wenn es eindeutig ist. Von der Seite sieht man die Tiefe am besten, von vorn eine Neigung.",
  "gloss.speedMax.title": "Tagesmaximum aus dem Stangentempo",
  "gloss.speedMax.body":
    "Je schwerer das Gewicht, desto langsamer bewegt es sich, und jede Übung hat ein Tempo, bei dem eine Wiederholung fast dein Maximum ist. Dein Aufwärmen liefert ein paar Gewichte mit ihrem Tempo, und die Linie durch sie zeigt auf das Gewicht, das du bei diesem Tempo bewegen würdest: dein geschätztes Maximum für heute.\nLiegt es deutlich über oder unter dem, was der Plan erwartet, schlagen wir eine kleine Änderung vor, höchstens 5 % schwerer oder 10 % leichter. Es ist eine Schätzung der Kamera, also hat dein erster Satz das letzte Wort.\nDieses Tempo ist von Mensch zu Mensch etwas verschieden, und die Kamera misst deinen Körper, nicht die Stange. Wenn du einen Arbeitssatz bis zum Muskelversagen gehst, während die Kamera zählt (eine Wiederholung, die nicht hochgeht, keine mehr im Tank oder weniger als geplant), wird das Tempo seiner letzten guten Wiederholung behalten, und nach drei solchen Sätzen nutzt die Schätzung dein eigenes Tempo statt des üblichen.",
  "gloss.barSpeed.title": "Stangengeschwindigkeit",
  "gloss.barSpeed.body":
    "Wie schnell die Stange bei jeder Wiederholung nach oben geht, gemessen von der Kamera. Wenn ein Satz schwer wird, wird die Stange langsamer, auch wenn sich die Wiederholungen noch gut anfühlen.\nIst sie etwa ein Drittel langsamer als deine schnellste Wiederholung, hast du ungefähr noch eine gute Wiederholung. Wer dort aufhört, trainiert hart, ohne sich zu quälen. Es ist eine Schätzung: Seitenansicht und gutes Licht helfen.",
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
    "Wie schwer sich ein Satz angefühlt hat, auf einer Skala von 1 bis 10, wobei 10 alles ist, was du hattest. Eine 8 heißt, dass noch etwa zwei saubere Wiederholungen drin waren, also dasselbe wie 2 Wiederholungen in Reserve.",
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
  "gloss.experience.title": "Erfahrung",
  "gloss.experience.body":
    "Wie lange du schon regelmäßig Krafttraining machst. Neu heißt unter einem Jahr, Etwas 1 bis 3 Jahre und Erfahren 3 Jahre oder mehr.\nSie legt fest, wie viele harte Sätze jeder Muskel pro Woche bekommt (8 bis 12 bei Neu, 10 bis 16 bei Etwas, 12 bis 20 bei Erfahren) und wie schwer die ersten Gewichte bei Übungen sind, die du noch nicht eingetragen hast. Sobald du eine Übung einträgst, bestimmen deine eigenen Sätze ihre Gewichte.\nSie wählt auch die Startstufe in Programmen mit Körpergewicht und wie schnell deine Ziele voraussichtlich vorankommen. Unsicher? Nimm die niedrigere Stufe; der Plan holt schnell auf.",
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
  "gloss.breathPattern.title": "Atemmuster",
  "gloss.breathPattern.body":
    "Eine Anleitung für die Pause zwischen den Sätzen: Folge dem Punkt um das Quadrat und dem Quadrat, das wächst und schrumpft. Jeder Schrittwechsel gibt einen leisen Ton und ein leichtes Vibrieren, so kannst du mit geschlossenen Augen folgen.\nBox-Atmung: einatmen, halten, ausatmen und halten, je 4 Sekunden. Gleichmäßig und beruhigend.\n4-7-8: 4 ein, 7 halten, 8 aus. Das lange Ausatmen verlangsamt das Herz am stärksten.\nDoppelseufzer: einatmen, kurz nachatmen, dann lange ausatmen. Der schnellste Weg zur Ruhe.\nLangsames Atmen: 4 ein, 6 aus.\nEigenes Muster: Stell jede Seite des Quadrats selbst ein. Eine Pause von 0 fällt weg.",
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
  "gloss.liftScores.title": "DOTS, Wilks und IPF GL",
  "gloss.liftScores.body":
    "Drei Arten, ein Total aus Kniebeuge, Bankdrücken und Kreuzheben nach Körpergewicht zu bewerten, damit Leichte und Schwere vergleichbar sind.\nDOTS (2019) und IPF GL (2020) sind die neueren, faireren Formeln; Wilks ist die ältere, die viele noch kennen. Vergleich einen Wert nur mit derselben Formel.",
  "gloss.ffmi.title": "FFMI: fettfreier Masseindex",
  "gloss.ffmi.body":
    "Deine Magermasse (alles außer Fett) geteilt durch die Körpergröße zum Quadrat, umgerechnet auf eine Standardgröße von 1,8 m. Er zeigt, wie viel Muskel du trägst, was der BMI nicht kann.\nDie meisten trainierenden Männer liegen zwischen 19 und 23, Frauen etwa 4 darunter. Eine Studie mit Athleten ohne Doping fand kaum jemanden über 25.",
  "gloss.hrZones.title": "Herzfrequenzzonen",
  "gloss.hrZones.body":
    "Fünf Belastungsbereiche aus deiner maximalen Herzfrequenz, von locker (Zone 1) bis Vollgas (Zone 5).\nMit Ruhepuls nutzen sie deine Herzfrequenzreserve (den Abstand zwischen Ruhe und Maximum), die deiner Fitness besser folgt.",
  "gloss.restDrop.title": "Herzfrequenzabfall in der Pause",
  "gloss.restDrop.body":
    "Um wie viele Schläge pro Minute deine Herzfrequenz in der ersten Minute nach einem Satz fällt, gemessen von deinem Herzfrequenzmesser. Ein größerer Abfall über die Monate bedeutet ein fitteres Herz; ein kleinerer als sonst kann heißen, dass du müde bist.",
  "gloss.setTypes.title": "Dropsätze und Rest-Pause",
  "gloss.setTypes.body":
    "Bonussätze, die du zwischen den Sätzen anhängen kannst, sobald der geplante Satz eingetragen ist.\nEin Dropsatz senkt das Gewicht um etwa ein Viertel und geht sofort weiter. Ein Rest-Pause-Satz behält das Gewicht, pausiert 15 Sekunden und holt noch ein paar Wiederholungen heraus.\nBeide geben dem Muskel mehr Arbeit ohne einen ganzen Extrasatz. Sie zählen zu deinem Volumen, aber die nächsten Gewichte im Plan lesen nur deine geplanten Sätze.",
  "gloss.stretching.title": "Aufwärmen und Cool-down",
  "gloss.stretching.body":
    "Aufwärmübungen sind Dehnungen in Bewegung und lockere Übungen. Sie bringen den Puls hoch und führen die Gelenke durch ihren Bewegungsumfang, damit sich die ersten Sätze besser anfühlen.\nBeim Cool-down hältst du Dehnungen 30 Sekunden oder länger still und atmest langsam. Das passt ans Ende des Trainings oder an einen Ruhetag, wenn die Muskeln warm sind. Dehn bis zu einer leichten Spannung, nie bis zum Schmerz.",
  "gloss.crate.title": "Kisten und Spind",
  "gloss.crate.body":
    "Jedes beendete Training gibt dir auf dem Abschlussbildschirm eine Kiste. Darin steckt zufällig eine Akzentfarbe, ein Pausentimer-Ton oder ein Scheiben-Finish: Gewöhnliches kommt am häufigsten, Legendäres am seltensten.\nManche Level geben ein festes Item und jeder neue Titel eine Bonuskiste, so haben auch die seltensten Items einen sicheren Weg. Tippe auf ein gesperrtes Item, um zu sehen, wie du es bekommst.\nBekommst du etwas, das du schon hast, wird es zu 25 Bonus-XP. Was du nutzt, wählst du hier im Spind.",
  "gloss.badges.title": "Erfolge und Abzeichen",
  "gloss.badges.body":
    "Ein Erfolg ist ein Ziel, zum Beispiel Trainings beenden oder persönliche Bestleistungen aufstellen. Jeder hat bis zu vier Abzeichen, Bronze, Silber, Gold und Platin, die du bei immer höheren Zahlen bekommst.\nManche Abzeichen schalten außerdem ein Farbdesign für die App frei; das Abzeichen sagt, welches. Jedes Abzeichen gibt XP, die dein Level erhöhen.",
  "gloss.monthly.title": "Die Challenge des Monats",
  "gloss.monthly.body":
    "Jeden Monat haben alle dieselbe Challenge: eine Zahl an Trainings, Sätzen oder Minuten, die von Monat zu Monat wechselt. Deine abgeschlossenen Trainings zählen, also klappt es auch offline.\nSchaffe sie vor Monatsende, um die Medaille des Monats zu bekommen. Jeder geschaffte Monat zählt für das Abzeichen Monatschallenge. Unter Freunde › Rangliste siehst du, wie es bei den Leuten läuft, denen du folgst.",
  "gloss.schoolTeams.title": "Schulteams",
  "gloss.schoolTeams.body":
    "Trainer an weiterführenden Schulen bekommen Pro kostenlos, sobald sie eine E-Mail-Adresse ihrer Schule oder ihres Schulträgers bestätigen. Ihre Sportler von 13 bis 18 Jahren bekommen Pro ebenfalls kostenlos, solange sie im Team sind.\nDer Trainer sieht deine Trainings, nicht deine Körperdaten. Teamkollegen sehen nur deinen Vornamen und wie viele Trainings und Sätze du diese Woche gemacht hast.",
  "gloss.strengthStandards.title": "Kraftstandards",
  "gloss.strengthStandards.body":
    "Typische geschätzte Maxima trainierter Menschen, nach Körpergewicht skaliert und nach Alter und Geschlecht angepasst, wenn du sie eingetragen hast, nach veröffentlichten Kraftstandards und Masters-Koeffizienten.\nDie Prozentzahl ist ein grober Anteil der Trainierten, die du übertriffst, keine Rangliste echter Liftsmith-Nutzer. Größe und BMI werden nicht verwendet.",
};

export const it: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Traiettoria del bilanciere",
  "gloss.barPath.body":
    "La linea che segue il bilanciere a ogni ripetizione, vista di lato. In squat, stacco e lento avanti funziona meglio se sale e scende quasi dritta sopra il centro del piede.\nDopo la serie, il replay mostra la ripetizione da guardare: la linea blu è il bilanciere, quella tratteggiata sale dritta da dove è partito. Se il bilanciere si è spostato in avanti o indietro in un quarto delle ripetizioni o più, ricevi un consiglio. È una lettura approssimativa da una sola fotocamera (nello squat le spalle fanno da bilanciere, negli altri esercizi le mani), quindi resta in silenzio se non è chiaro.",
  "gloss.formCheck.title": "Controllo della tecnica",
  "gloss.formCheck.body":
    "Mentre conta le ripetizioni, la fotocamera guarda anche come si è mossa ciascuna: nello squat, se le anche sono scese all’altezza delle ginocchia; in ogni esercizio, se alcune ripetizioni sono state più corte della migliore; e in squat, stacchi e distensioni sopra la testa, se hai inclinato il busto su un lato.\nTra una serie e l’altra ti dice la cosa più utile da correggere, con su quante ripetizioni l’ha vista, e la figura la mostra: dove si sono fermate le ripetizioni corte o da che parte hai inclinato il busto. È un controllo approssimativo con una sola fotocamera, quindi parla solo quando è chiaro. Di lato si vede meglio la profondità, di fronte l’inclinazione.",
  "gloss.speedMax.title": "Il massimale di oggi dalla velocità",
  "gloss.speedMax.body":
    "Più il peso è alto, più si muove lentamente, e ogni esercizio ha una velocità a cui una ripetizione è quasi il massimo che puoi fare. Il riscaldamento dà alcuni carichi con le loro velocità, e la linea che li unisce indica il carico che sposteresti a quella velocità: il tuo massimale stimato di oggi.\nSe è molto sopra o sotto quanto prevede il piano, suggeriamo un piccolo cambio, al massimo il 5% in più o il 10% in meno. È una stima della fotocamera, quindi l'ultima parola spetta alla prima serie.\nQuella velocità cambia un po' da persona a persona, e la fotocamera misura il tuo corpo, non il bilanciere. Quando porti una serie allenante a cedimento mentre la fotocamera conta (una ripetizione che non sale, nessuna in riserva o meno del previsto), si tiene la velocità della sua ultima ripetizione buona, e dopo tre serie così la stima usa la tua velocità invece di quella abituale.",
  "gloss.barSpeed.title": "Velocità del bilanciere",
  "gloss.barSpeed.body":
    "Quanto velocemente sale il bilanciere a ogni ripetizione, misurato dalla fotocamera. Quando la serie diventa dura, il bilanciere rallenta, anche se le ripetizioni sembrano ancora facili.\nQuando è circa un terzo più lento della tua ripetizione più veloce, ti resta più o meno una buona ripetizione: fermarti lì mantiene il lavoro intenso senza forzare. È una stima: una vista di lato e una buona luce aiutano.",
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
    "Quanto è stata dura una serie su una scala da 1 a 10, dove 10 è tutto quello che avevi. Un 8 significa che avevi ancora circa due buone ripetizioni, come 2 ripetizioni di riserva.",
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
  "gloss.experience.title": "Esperienza",
  "gloss.experience.body":
    "Da quanto tempo ti alleni con i pesi in modo regolare. Principiante è meno di un anno, Un po’ è da 1 a 3 anni ed Esperto è 3 anni o più.\nStabilisce quante serie impegnative riceve ogni muscolo a settimana (da 8 a 12 per Principiante, da 10 a 16 per Un po’, da 12 a 20 per Esperto) e quanto sono pesanti i primi carichi sugli esercizi che non hai ancora registrato. Quando registri un esercizio, sono le tue serie a fissarne i carichi.\nSceglie anche il passo di partenza nei programmi a corpo libero e la velocità prevista dei tuoi obiettivi. Non sei sicuro? Scegli il livello più basso; il piano si adegua in fretta.",
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
  "gloss.breathPattern.title": "Schemi di respirazione",
  "gloss.breathPattern.body":
    "Una guida per il riposo tra le serie: segui il punto lungo il quadrato e il quadrato che cresce e si restringe. Ogni cambio di fase dà un suono leggero e una breve vibrazione, così puoi seguirla a occhi chiusi.\nRespirazione quadrata: inspira, trattieni, espira e trattieni, 4 secondi ciascuno. Regolare e calmante.\n4-7-8: inspira 4, trattieni 7, espira 8. La lunga espirazione rallenta di più il cuore.\nDoppio sospiro: un’inspirazione, un secondo piccolo sorso d’aria, poi una lunga espirazione. Il modo più rapido per calmarti.\nRespiro lento: inspira 4, espira 6.\nPersonalizzata: imposta tu ogni lato del quadrato. Una pausa a 0 viene tolta.",
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
  "gloss.liftScores.title": "DOTS, Wilks e IPF GL",
  "gloss.liftScores.body":
    "Tre modi per valutare un totale di squat, panca e stacco in base al peso corporeo, per confrontare chi è leggero con chi è pesante.\nDOTS (2019) e IPF GL (2020) sono le formule più recenti ed eque; Wilks è quella vecchia che molti conoscono ancora. Confronta un punteggio solo con la stessa formula.",
  "gloss.ffmi.title": "FFMI: indice di massa magra",
  "gloss.ffmi.body":
    "La tua massa magra (tutto tranne il grasso) divisa per l'altezza al quadrato, riportata a un'altezza standard di 1,8 m. Mostra quanto muscolo hai, cosa che il BMI non sa fare.\nLa maggior parte degli uomini che si allenano sta tra 19 e 23, le donne circa 4 in meno. Uno studio su atleti senza doping ne ha trovati pochi sopra 25.",
  "gloss.hrZones.title": "Zone di frequenza cardiaca",
  "gloss.hrZones.body":
    "Cinque fasce di sforzo calcolate dalla frequenza massima, da facile (zona 1) a massimo (zona 5).\nCon la frequenza a riposo usano la riserva cardiaca (la differenza tra riposo e massima), che segue meglio la tua forma.",
  "gloss.restDrop.title": "Calo della frequenza cardiaca nel riposo",
  "gloss.restDrop.body":
    "Di quanti battiti al minuto scende la frequenza cardiaca nel primo minuto dopo una serie, dal tuo cardiofrequenzimetro. Un calo più ampio nel corso dei mesi indica un cuore più in forma; uno più piccolo del solito può voler dire che sei stanco.",
  "gloss.setTypes.title": "Drop set e rest-pause",
  "gloss.setTypes.body":
    "Serie bonus da aggiungere tra una serie e l’altra, dopo aver registrato la serie prevista.\nUn drop set abbassa il peso di circa un quarto e riparte subito. Una serie rest-pause tiene lo stesso peso, si ferma 15 secondi e poi tira fuori qualche ripetizione in più.\nEntrambe aggiungono lavoro al muscolo senza una serie intera in più. Contano nel tuo volume, ma i prossimi pesi del piano leggono solo le serie previste.",
  "gloss.stretching.title": "Riscaldamento e defaticamento",
  "gloss.stretching.body":
    "I movimenti di riscaldamento sono allungamenti in movimento ed esercizi leggeri. Alzano i battiti e portano le articolazioni lungo tutto il loro movimento, così le prime serie vanno meglio.\nGli allungamenti di defaticamento si tengono fermi per 30 secondi o più, respirando lentamente. Sono adatti alla fine dell’allenamento o a un giorno di riposo, con i muscoli caldi. Allunga fino a una leggera tensione, mai fino al dolore.",
  "gloss.crate.title": "Casse e armadietto",
  "gloss.crate.body":
    "Ogni allenamento finito ti dà una cassa nella schermata finale. Contiene a caso un colore d’accento, un suono del timer o una finitura dei dischi: i comuni escono più spesso, i leggendari meno.\nAlcuni livelli danno un oggetto preciso e ogni nuovo titolo una cassa bonus, così anche gli oggetti più rari hanno una strada sicura. Tocca un oggetto bloccato per vedere come ottenerlo.\nSe ricevi qualcosa che hai già, diventa 25 XP bonus. Scegli cosa usare qui, nell’armadietto.",
  "gloss.badges.title": "Traguardi e badge",
  "gloss.badges.body":
    "Un traguardo è un obiettivo, come finire allenamenti o battere record personali. Ognuno ha fino a quattro badge, bronzo, argento, oro e platino, che si ottengono con numeri sempre più alti.\nAlcuni badge sbloccano anche un tema di colore per l’app; il badge dice quale. Ogni badge dà XP, che fa salire il tuo livello.",
  "gloss.monthly.title": "La sfida del mese",
  "gloss.monthly.body":
    "Ogni mese tutti hanno la stessa sfida: un numero di allenamenti, serie o minuti, che cambia di mese in mese. Contano i tuoi allenamenti completati, quindi funziona anche offline.\nCompletala prima della fine del mese per vincere la medaglia del mese. Ogni mese completato conta per il badge Sfida del mese. Amici › Classifica mostra come vanno le persone che segui.",
  "gloss.schoolTeams.title": "Squadre scolastiche",
  "gloss.schoolTeams.body":
    "Gli allenatori delle superiori hanno Pro gratis dopo aver confermato un indirizzo email della loro scuola o del distretto. Anche i loro atleti dai 13 ai 18 anni hanno Pro gratis finché sono nella squadra.\nL’allenatore vede i tuoi allenamenti, non i tuoi dati corporei. I compagni vedono solo il tuo nome e quanti allenamenti e serie hai fatto questa settimana.",
  "gloss.strengthStandards.title": "Standard di forza",
  "gloss.strengthStandards.body":
    "Massimali stimati tipici di persone allenate, in base al peso corporeo e corretti per età e sesso se li hai inseriti, secondo standard di forza pubblicati e coefficienti master.\nLa percentuale è una quota approssimativa di persone allenate che superi, non una classifica di veri utenti di Liftsmith. Altezza e IMC non vengono usati.",
};

export const ja: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "バーの軌道",
  "gloss.barPath.body":
    "横から見た、各レップでバーが通るライン。スクワット、デッドリフト、ショルダープレスでは、足の中央の真上をほぼまっすぐ上下するのが理想です。\nセット後のリプレイでは、見ておきたいレップを再生します。青い線がバー、点線はスタート位置からの真上のラインです。レップの4分の1以上でバーが前か後ろにずれていれば、ひとこと助言します。カメラ1台での大まかな読み取りなので（スクワットでは肩、ほかの種目では手をバーとみなします）、はっきりしないときは何も言いません。",
  "gloss.formCheck.title": "フォームチェック",
  "gloss.formCheck.body":
    "レップを数えながら、カメラは各レップの動きも見ています。スクワットでは股関節が膝の高さまで下がったか、すべての種目でいちばん深いレップより短いレップがなかったか、スクワット・デッドリフト・オーバーヘッドプレスでは左右に傾いていないかです。\nセット間に、いちばん直す価値のあることを何レップで見つかったかと一緒に伝え、フィギュアで示します（短いレップが止まった位置や傾いた向き）。カメラ 1 台での大まかなチェックなので、はっきりしたときだけ知らせます。深さは横から、傾きは正面からがいちばん見やすくなります。",
  "gloss.speedMax.title": "バースピードから今日の最大重量",
  "gloss.speedMax.body":
    "重いほどバーはゆっくり動き、種目ごとに「これがほぼ限界」というスピードがあります。ウォームアップでいくつかの重量とそのスピードがわかり、それらを結ぶ線から、そのスピードになる重量、つまり今日の推定最大重量がわかります。\nプランの想定より大きく上か下なら、小さな変更（重くて最大 5%、軽くて最大 10%）を提案します。カメラによる推定なので、最終判断は最初のセットの感覚で。\nこのスピードは人によって少し違い、カメラはバーではなく体の動きを測っています。そのため、カメラでカウントしながらメインセットを限界まで行うと（上がらなかったレップ、余力ゼロ、予定より少ないレップ）、最後に成功したレップのスピードを記録し、そうしたセットが 3 つたまると、一般的な値ではなくあなた自身のスピードで推定します。",
  "gloss.barSpeed.title": "バースピード",
  "gloss.barSpeed.body":
    "各レップでバーが上がる速さを、カメラで測ったものです。セットがきつくなると、まだ楽に感じていてもバーは遅くなります。\nいちばん速いレップより 3 分の 1 ほど遅くなったら、余力はおよそ 1 レップ。そこでセットを終えれば、無理に粘らずしっかり追い込めます。目安の値なので、横から映し、明るい場所で使うと正確になります。",
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
    "セットのきつさを1〜10で表します。10は出し切った状態です。8なら、あと2回ほどきれいにできる余力があったという意味で、余力レップ数2と同じです。",
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
  "gloss.experience.title": "経験",
  "gloss.experience.body":
    "定期的に筋トレを続けている期間です。初心者は1年未満、少し経験ありは1〜3年、経験者は3年以上です。\n各筋肉の1週間のハードセット数（初心者は8〜12、少し経験ありは10〜16、経験者は12〜20）と、まだ記録していない種目の最初の重量を決めます。種目を記録すると、その後はご自身のセットから重量が決まります。\n自重プログラムの開始ステップと、目標の達成ペースの予測にも使われます。迷ったら低いほうを選んでください。プランはすぐに追いつきます。",
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
  "gloss.breathPattern.title": "呼吸パターン",
  "gloss.breathPattern.body":
    "セット間の休憩のガイドです。四角を回る点と、大きくなったり小さくなったりする四角に合わせて呼吸します。段階が変わるたびにやさしい音と軽い振動があるので、目を閉じても続けられます。\nボックス呼吸：吸う、止める、吐く、止めるを各4秒。一定のリズムで落ち着きます。\n4-7-8：4秒吸って、7秒止めて、8秒吐きます。長く吐くことが心拍を最も下げます。\n生理的ため息：吸ったあと、もう少しだけ吸い足し、長く吐きます。最も早く落ち着く方法です。\nゆっくり呼吸：4秒吸って、6秒吐きます。\nカスタム：四角の各辺を自分で決めます。止める時間を0にするとその段階はなくなります。",
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
  "gloss.liftScores.title": "DOTS・Wilks・IPF GL",
  "gloss.liftScores.body":
    "スクワット・ベンチプレス・デッドリフトのトータルを体重に合わせて採点する3つの方式です。体重の軽い人と重い人を比べられます。\nDOTS（2019年）とIPF GL（2020年）は新しく公平な式で、Wilksは今も知られている古い式です。スコアは同じ式どうしで比べてください。",
  "gloss.ffmi.title": "FFMI（除脂肪量指数）",
  "gloss.ffmi.body":
    "除脂肪量（脂肪以外のすべて）を身長の2乗で割り、標準身長1.8 mに補正した値です。BMIではわからない筋肉の量がわかります。\n筋トレをする男性の多くは19〜23、女性は約4低くなります。薬物を使わない人の研究では、25を超える人はほとんどいませんでした。",
  "gloss.hrZones.title": "心拍ゾーン",
  "gloss.hrZones.body":
    "最大心拍数から決める5段階の強度で、楽なゾーン1から全力のゾーン5まであります。\n安静時心拍数があると予備心拍数（安静時と最大の差）を使うため、体力の変化により合います。",
  "gloss.restDrop.title": "休憩中の心拍数の低下",
  "gloss.restDrop.body":
    "セット後の最初の1分間で心拍数が1分あたり何拍下がるかを、心拍計で測ったものです。数か月かけて下がり幅が大きくなれば心肺が鍛えられた証拠で、いつもより小さければ疲れているのかもしれません。",
  "gloss.setTypes.title": "ドロップセットとレストポーズ",
  "gloss.setTypes.body":
    "予定のセットを記録したあと、セットの合間に追加できるボーナスセットです。\nドロップセットは重さを約4分の1下げて、休まずにもう一度行います。レストポーズは同じ重さのまま15秒休み、あと数回だけ挙げます。\nどちらもセットを丸ごと増やさずに筋肉への刺激を増やせます。ボリュームには数えますが、プランの次の重さは予定のセットだけを見て決めます。",
  "gloss.stretching.title": "ウォームアップとクールダウン",
  "gloss.stretching.body":
    "ウォームアップの動きは、動きながら行うストレッチや軽いドリルです。心拍数を上げ、関節を大きく動かすので、最初のセットが楽になります。\nクールダウンのストレッチは、ゆっくり呼吸しながら30秒以上静止して保ちます。筋肉が温まっているワークアウトの最後や休養日に向いています。軽く張りを感じるところまでにして、痛みが出るほど伸ばさないでください。",
  "gloss.crate.title": "クレートとロッカー",
  "gloss.crate.body":
    "ワークアウトを終えるたびに、完了画面でクレートが1個もらえます。中身はアクセントカラー、休憩タイマーの音、プレートの仕上げのどれかがランダムに入っています。コモンが最も出やすく、レジェンダリーが最も出にくくなっています。\n一部のレベルでは決まったアイテムが、新しい称号ごとにボーナスクレートがもらえるので、いちばん珍しいアイテムにも確実な入手方法があります。ロック中のアイテムをタップすると入手方法がわかります。\nすでに持っているものが出た場合は、25ボーナス XP になります。使うものはこのロッカーで選べます。",
  "gloss.badges.title": "実績とバッジ",
  "gloss.badges.body":
    "実績はワークアウトを終える、自己ベストを出すといった目標です。それぞれにブロンズ、シルバー、ゴールド、プラチナの最大4つのバッジがあり、数字が大きくなるごとにもらえます。\n一部のバッジはアプリのカラーテーマも解除します。どのテーマかはバッジに表示されます。どのバッジも XP がもらえ、レベルが上がります。",
  "gloss.monthly.title": "今月のチャレンジ",
  "gloss.monthly.body":
    "毎月、全員に同じチャレンジが用意されます。ワークアウト回数、セット数、トレーニング時間のいずれかで、月ごとに入れ替わります。完了したワークアウトが加算されるので、オフラインでも使えます。\n月末までに達成するとその月のメダルがもらえます。達成した月はマンスリーチャレンジャーのバッジに加算されます。フレンド › ランキングで、フォローしている人の進み具合が見られます。",
  "gloss.schoolTeams.title": "学校のチーム",
  "gloss.schoolTeams.body":
    "高校のコーチは、学校や教育委員会のメールアドレスを確認すると Pro が無料になります。チームにいる13〜18歳の選手も、チームにいる間は Pro が無料です。\nコーチに見えるのはワークアウトだけで、体のデータは見えません。チームメイトに見えるのは下の名前と今週のワークアウト数・セット数だけです。",
  "gloss.strengthStandards.title": "筋力基準",
  "gloss.strengthStandards.body":
    "トレーニング経験者の典型的な推定最大重量を体重に合わせ、年齢と性別を入力していればそれも補正したもので、公表された筋力基準とマスターズ係数に基づきます。\nパーセンテージは、あなたの推定値が上回るトレーニング経験者のおおよその割合で、実際のLiftsmithユーザーの順位ではありません。身長とBMIは使いません。",
};

export const pt: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Trajetória da barra",
  "gloss.barPath.body":
    "A linha que a barra faz em cada rep, vista de lado. No agachamento, no levantamento terra e no desenvolvimento, o ideal é ela subir e descer quase reta sobre o meio do pé.\nDepois da série, o replay mostra a rep que vale a pena ver: a linha azul é a barra, e a tracejada sobe reta de onde ela começou. Se a barra foi para a frente ou para trás em um quarto das suas reps ou mais, você recebe uma dica. É uma leitura aproximada de uma câmera só (seus ombros fazem o papel da barra no agachamento, e suas mãos nos outros exercícios), então ela só fala quando está claro.",
  "gloss.formCheck.title": "Checagem de técnica",
  "gloss.formCheck.body":
    "Enquanto conta as reps, a câmera também observa como cada rep se moveu: no agachamento, se o quadril desceu até a altura dos joelhos; em todo exercício, se algumas reps ficaram mais curtas que a sua melhor; e no agachamento, no levantamento terra e no desenvolvimento, se você pendeu para um lado.\nEntre as séries, ela aponta a coisa que mais vale corrigir, em quantas reps viu isso, e a figura mostra: onde suas reps curtas pararam ou para que lado você pendeu. É uma checagem aproximada de uma câmera só, então ela só fala quando está claro. De lado mostra melhor a profundidade; de frente para a câmera mostra a inclinação.",
  "gloss.speedMax.title": "Máximo do dia pela velocidade da barra",
  "gloss.speedMax.body":
    "Quanto mais pesado, mais devagar a barra se move, e todo exercício tem uma velocidade em que a rep é quase o máximo que você aguenta. Seu aquecimento dá alguns pesos e suas velocidades, e a linha entre eles aponta o peso que você moveria nessa velocidade: o máximo estimado de hoje.\nQuando ele fica bem acima ou abaixo do que o plano de hoje espera, sugerimos uma pequena mudança, no máximo 5% mais pesado ou 10% mais leve. É uma estimativa da câmera, então deixe sua primeira série dar a palavra final.\nEssa velocidade muda um pouco de pessoa para pessoa, e a câmera mede seu corpo, não a barra. Por isso, quando você leva uma série de trabalho até a falha com a câmera contando (uma rep que não sobe, nenhuma rep sobrando ou menos reps que o planejado), a velocidade da última rep boa fica guardada, e depois de três séries assim a estimativa usa a sua própria velocidade em vez da padrão.",
  "gloss.barSpeed.title": "Velocidade da barra",
  "gloss.barSpeed.body":
    "A rapidez com que a barra sobe em cada rep, medida pela câmera. Quando a série fica difícil, a barra desacelera, mesmo que as reps ainda pareçam tranquilas.\nQuando ela está cerca de um terço mais lenta que a sua rep mais rápida, sobra mais ou menos uma rep boa, então parar a série ali mantém o trabalho pesado sem se arrastar. É uma estimativa: uma vista de lado e boa luz ajudam.",
  "gloss.fitnessAge.title": "Idade fitness",
  "gloss.fitnessAge.body":
    "A idade em que uma pessoa saudável típica do seu sexo tem o seu VO₂ máx., segundo um grande estudo norueguês com adultos saudáveis.\nÉ uma estimativa de condicionamento, não um exame de saúde. Cardio intenso a reduz em poucas semanas.",
  "gloss.deloadWeeks.title": "Semanas de construção antes do deload",
  "gloss.deloadWeeks.body":
    "Seu treino é dividido em blocos. Nas semanas de construção, o plano fica um pouco mais difícil a cada semana: mais séries e menos reps sobrando no tanque.\nDepois vem uma semana de deload: mais leve, com cerca de metade das séries. Ela deixa articulações e sistema nervoso se recuperarem, para você voltar mais forte. Escolha menos semanas de construção se você é iniciante ou está sem tempo, e mais se você se recupera bem.",
  "gloss.deload.title": "Semana de deload",
  "gloss.deload.body":
    "Uma semana mais leve depois de um bloco de treino pesado: pesos menores e cerca de metade das séries. Não é progresso perdido. É quando o corpo absorve o trabalho, e o próximo bloco começa mais forte.",
  "gloss.rir.title": "RIR: reps em reserva",
  "gloss.rir.body":
    "Quantas reps a mais você conseguiria fazer quando para a série. RIR 2 significa terminar a série sentindo que ainda tinha umas duas reps boas.\nO plano começa com mais sobrando no tanque e chega mais perto da falha ao longo do bloco.",
  "gloss.rpe.title": "RPE: percepção de esforço",
  "gloss.rpe.body":
    "O quanto uma série foi pesada numa escala de 1 a 10, em que 10 é tudo o que você tinha. Um 8 significa que ainda tinha umas duas reps boas, o mesmo que 2 reps em reserva.",
  "gloss.blockWeek.title": "Bloco de treino",
  "gloss.blockWeek.body":
    "Onde você está no seu bloco: qual semana de construção (ou o deload) e quantas reps deixar no tanque nesta semana. Você pode mudar a duração do bloco em Ajustes.",
  "gloss.readiness.title": "Prontidão",
  "gloss.readiness.body":
    "Uma nota de 0 a 100, em que 50 é um dia normal. Ela vem de quão recuperados estão seus músculos grandes, de como foram os treinos recentes (reps feitas, como as séries pareceram, velocidade das reps e frequência cardíaca) e dos dias de descanso.\n65 ou mais é dia de forçar, 35 ou menos é dia leve. Você sempre pode mudar.",
  "gloss.call.title": "Decisão do dia",
  "gloss.call.body":
    "Forçar: seu primeiro exercício grande vai uma rep mais perto da falha. Como planejado: o plano normal. Pegar leve: uma série a menos, um passo mais leve e uma rep a mais em reserva. Sua escolha fica salva.",
  "gloss.volume.title": "Volume",
  "gloss.volume.body":
    "Peso × reps, somado em todas as séries de trabalho. É uma medida aproximada de quanto trabalho total você fez. O aquecimento não conta.",
  "gloss.e1rm.title": "1RM estimado",
  "gloss.e1rm.body":
    "O máximo que você provavelmente levantaria uma vez, calculado a partir das suas séries somando as reps que sobraram. Usa as fórmulas que as pesquisas acharam mais precisas para cada faixa de reps (Brzycki e Epley até 10 reps até a falha, Mayhew e Wathan acima disso), cada uma com média junto a uma equação de 2026 baseada no peso, ajustada em mais de 300.000 séries. Séries recentes, pesadas e perto da falha contam mais, e séries acima de 20 reps são ignoradas. Assim dá para comparar uma série de 5 com uma de 8 e ver a evolução real da força sem testar um máximo de verdade.",
  "gloss.weeklySets.title": "Séries por músculo nesta semana",
  "gloss.weeklySets.body":
    "Séries pesadas que trabalharam cada músculo nesta semana. Músculos secundários contam meia série. A faixa verde, de 10 a 20, é o intervalo que a maioria das pesquisas indica para hipertrofia. O plano mira nos músculos mais abaixo dela.",
  "gloss.experience.title": "Experiência",
  "gloss.experience.body":
    "Há quanto tempo você treina com regularidade. Iniciante é menos de um ano, Intermediário é de 1 a 3 anos e Experiente é 3 anos ou mais.\nIsso define quantas séries pesadas cada músculo recebe por semana (8 a 12 para Iniciante, 10 a 16 para Intermediário, 12 a 20 para Experiente) e o peso inicial nos exercícios que você ainda não registrou. Depois que você registra um exercício, suas próprias séries definem os pesos.\nTambém escolhe o nível inicial nos programas com peso corporal e a velocidade prevista para suas metas de carga. Na dúvida? Escolha o menor; o plano se ajusta rápido.",
  "gloss.variety.title": "Variedade de exercícios",
  "gloss.variety.body":
    "Com que frequência o plano mantém o mesmo exercício para um músculo. Mais constante é melhor para acompanhar o progresso num exercício. Mais variedade deixa o treino mais fresco e distribui o estresse.",
  "gloss.recovery.title": "Recuperação",
  "gloss.recovery.body":
    "Cada série cansa os músculos que trabalha. Essa fadiga passa em 2 a 3 dias. Descansado é 90% ou mais, Pronto 70%, Recuperando 40%, e Cansado é abaixo de 40%. O plano evita músculos que ainda estão cansados.",
  "gloss.superset.title": "Bi-set",
  "gloss.superset.body":
    "Dois ou mais exercícios feitos em sequência: uma série do primeiro, direto para uma série do seguinte, e só então o descanso. Economiza tempo e funciona melhor com exercícios que não cansam os mesmos músculos, como uma remada com um supino.\nToque no elo entre dois exercícios para juntá-los, e de novo para separá-los.",
  "gloss.warmup.title": "Séries de aquecimento",
  "gloss.warmup.body":
    "Séries mais leves que vão subindo até o seu peso de trabalho. Elas não contam nas suas estatísticas nem no progresso. Pule se você já estiver aquecido.",
  "gloss.firstWeights.title": "Por que perguntamos",
  "gloss.firstWeights.body":
    "Só para sugerir um primeiro peso seguro para cada exercício. Começamos pelo lado leve e ajustamos depois do seu primeiro treino. Isso fica no seu celular.",
  "gloss.healthTwin.title": "Saúde",
  "gloss.healthTwin.body":
    "Os números do seu corpo num só lugar: peso, gordura corporal, energia, sono, coração e passos, do Liftsmith e do app de saúde do celular.\nCada um é comparado com o seu próprio normal dos últimos 30 dias, nunca com outras pessoas, e diz o que fazer. Não é orientação médica.",
  "gloss.hrv.title": "VFC: variabilidade da frequência cardíaca",
  "gloss.hrv.body":
    "As pequenas variações no tempo entre os batimentos, medidas por um relógio ou anel, quase sempre durante a noite. Acima do seu normal costuma indicar que você se recuperou; abaixo indica estresse do treino, sono ruim ou doença.\nSó a sua própria tendência importa: celulares e relógios medem de jeitos diferentes, então não compare seu número com o de ninguém.",
  "gloss.restingHr.title": "Frequência cardíaca de repouso",
  "gloss.restingHr.body":
    "Sua frequência cardíaca em repouso total, geralmente medida enquanto você dorme. Alguns batimentos acima do seu normal por um ou dois dias é um sinal precoce para ir mais devagar.",
  "gloss.breathingRate.title": "Frequência respiratória",
  "gloss.breathingRate.body":
    "Respirações por minuto enquanto você dorme, de um relógio ou anel. Ela é bem estável, então um salto de duas ou mais acima do seu normal costuma ser um dos primeiros sinais de que você está ficando doente.",
  "gloss.breathPattern.title": "Padrões de respiração",
  "gloss.breathPattern.body":
    "Um guia para o descanso entre séries: siga o ponto ao redor do quadrado e o quadrado enquanto ele cresce e diminui. Cada mudança de etapa faz um som suave e uma vibração leve, para você acompanhar de olhos fechados.\nRespiração quadrada: inspire, segure, expire e segure, 4 segundos cada. Estável e calmante.\n4-7-8: inspire por 4, segure por 7, expire por 8. A expiração longa é a que mais desacelera o coração.\nSuspiro duplo: uma inspiração, um segundo gole curto por cima, depois uma expiração longa. O jeito mais rápido de se acalmar.\nRespiração lenta: inspire por 4, expire por 6.\nPersonalizado: defina você mesmo cada lado do quadrado. Uma pausa de 0 a deixa de fora.",
  "gloss.vo2max.title": "VO₂ máx.",
  "gloss.vo2max.body":
    "Quanto oxigênio seu corpo consegue usar no esforço máximo, em mililitros por quilo por minuto. Relógios estimam a partir de caminhadas e corridas. É a melhor medida isolada de condicionamento cardiovascular.\nMusculação quase não mexe nele. Duas sessões de cardio intenso de 20 minutos por semana mexem.",
  "gloss.bodyFat.title": "Gordura corporal",
  "gloss.bodyFat.body":
    "A parte do seu peso que é gordura, de uma balança inteligente, um scanner corporal ou adipômetro. Cada método mede diferente, então fique com um só e meça no mesmo horário, de preferência de manhã, antes de comer.\nUma leitura sozinha diz pouco. Três ou mais ao longo de algumas semanas mostram a tendência, e as Notas do coach avisam quando ela vai no sentido errado para o seu objetivo.",
  "gloss.leanMass.title": "Massa magra",
  "gloss.leanMass.body":
    "Tudo no seu corpo que não é gordura: músculo, osso, órgãos e água. Seu peso vezes a parte que não é gordura. Massa magra subindo enquanto a gordura corporal se mantém ou cai significa que o treino está construindo músculo.",
  "gloss.bmi.title": "IMC: índice de massa corporal",
  "gloss.bmi.body":
    "Peso dividido pela altura ao quadrado. É uma referência aproximada para quem não treina: não diferencia músculo de gordura, então quem tem muito músculo costuma aparecer com sobrepeso. Quando você tiver uma leitura de gordura corporal, confie nela.",
  "gloss.liftScores.title": "DOTS, Wilks e IPF GL",
  "gloss.liftScores.body":
    "Três formas de pontuar o total de agachamento, supino e levantamento terra pelo peso corporal, para comparar um atleta leve com um pesado.\nDOTS (2019) e IPF GL (2020) são as fórmulas mais novas e justas; Wilks é a mais antiga, que muita gente ainda conhece. Compare uma pontuação só com a mesma fórmula.",
  "gloss.ffmi.title": "FFMI: índice de massa livre de gordura",
  "gloss.ffmi.body":
    "Sua massa magra (tudo menos gordura) dividida pela altura ao quadrado, ajustada para uma altura padrão de 1,8 m. Mostra quanto músculo você tem, o que o IMC não mostra.\nA maioria dos homens que treinam fica entre 19 e 23, e as mulheres cerca de 4 abaixo. Um estudo com atletas sem uso de drogas encontrou poucos acima de 25.",
  "gloss.hrZones.title": "Zonas de frequência cardíaca",
  "gloss.hrZones.body":
    "Cinco faixas de esforço definidas pela sua frequência cardíaca máxima, do leve (zona 1) ao máximo (zona 5).\nCom a frequência de repouso, elas usam sua reserva de frequência cardíaca (a diferença entre repouso e máxima), que acompanha melhor seu condicionamento.",
  "gloss.restDrop.title": "Queda da frequência no descanso",
  "gloss.restDrop.body":
    "Quantos batimentos por minuto sua frequência cardíaca cai no primeiro minuto depois de uma série, pelo seu monitor cardíaco. Uma queda maior ao longo dos meses indica um coração mais condicionado; uma menor que o normal pode indicar cansaço.",
  "gloss.setTypes.title": "Drop sets e rest-pause",
  "gloss.setTypes.body":
    "Séries extras que você pode adicionar entre as séries, depois de registrar a série planejada.\nUm drop set baixa o peso em cerca de um quarto e continua na hora. Um rest-pause mantém o mesmo peso, pausa por 15 segundos e espreme mais algumas reps.\nOs dois dão mais trabalho ao músculo sem uma série extra completa. Eles contam no seu volume, mas os próximos pesos do plano só leem suas séries planejadas.",
  "gloss.stretching.title": "Mobilidade de aquecimento e alongamentos finais",
  "gloss.stretching.body":
    "Os movimentos de aquecimento são alongamentos dinâmicos e exercícios de mobilidade. Eles aumentam a frequência cardíaca e levam as articulações pela amplitude, para as primeiras séries renderem melhor.\nOs alongamentos finais são estáticos, mantidos por 30 segundos ou mais com respiração lenta. Combinam com o fim do treino ou um dia de descanso, quando os músculos estão aquecidos. Alongue até uma tensão leve, nunca até a dor.",
  "gloss.crate.title": "Caixas e o Armário",
  "gloss.crate.body":
    "Cada treino concluído dá uma caixa na tela de Concluído. Ela traz uma cor de destaque, um som do timer de descanso ou um acabamento de anilha, sorteado: os comuns aparecem mais e os lendários, menos.\nAlguns níveis dão um item fixo, e cada novo título dá uma caixa bônus, então até os itens mais raros têm um caminho garantido. Toque num item bloqueado para ver como consegui-lo.\nSe vier algo que você já tem, vira 25 XP de bônus. Escolha o que usar aqui no Armário.",
  "gloss.badges.title": "Conquistas e medalhas",
  "gloss.badges.body":
    "Uma conquista é uma meta, como concluir treinos ou bater recordes pessoais. Cada uma tem até quatro medalhas, bronze, prata, ouro e platina, ganhas em números cada vez maiores.\nAlgumas medalhas também desbloqueiam um tema de cores para o app; a medalha diz qual. Toda medalha dá XP, que sobe seu nível.",
  "gloss.monthly.title": "O desafio do mês",
  "gloss.monthly.body":
    "Todo mundo recebe o mesmo desafio a cada mês: um número de treinos, séries ou minutos, que muda de mês para mês. Seus próprios treinos concluídos contam, então funciona offline.\nComplete antes do fim do mês para ganhar a medalha daquele mês. Cada mês completo conta para a medalha Desafiante mensal. Amigos › Placar mostra como estão as pessoas que você segue.",
  "gloss.schoolTeams.title": "Equipes escolares",
  "gloss.schoolTeams.body":
    "Treinadores de ensino médio ganham o Pro grátis depois de confirmar um e-mail da escola ou da secretaria de ensino. Os atletas deles de 13 a 18 anos também ganham o Pro grátis, enquanto estiverem na equipe.\nO treinador vê seus treinos, não seus dados corporais. Os colegas de equipe veem só seu primeiro nome e quantos treinos e séries você fez nesta semana.",
  "gloss.strengthStandards.title": "Padrões de força",
  "gloss.strengthStandards.body":
    "1RMs estimados típicos de quem treina, ajustados ao peso corporal e, se você informou, à idade e ao sexo, com base no formato de padrões de força publicados e de coeficientes master.\nA porcentagem é uma parte aproximada dos praticantes treinados que sua estimativa supera, não um ranking de usuários reais do Liftsmith. Altura e IMC não são usados.",
};

export const ko: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "바 경로",
  "gloss.barPath.body":
    "옆에서 본, 반복마다 바가 움직이는 선이에요. 스쿼트, 데드리프트, 오버헤드 프레스에서는 발 중앙 위로 거의 수직으로 오르내릴 때 가장 좋아요.\n세트가 끝나면 다시 볼 만한 반복을 재생해요. 파란 선이 바이고, 점선은 시작 지점에서 수직으로 올린 선이에요. 반복의 4분의 1 이상에서 바가 앞이나 뒤로 흐르면 팁을 하나 알려 드려요. 카메라 한 대로 대략 읽는 것이라(스쿼트에서는 어깨, 다른 리프트에서는 손을 바 대신 봐요) 확실할 때만 알려 드려요.",
  "gloss.formCheck.title": "자세 체크",
  "gloss.formCheck.body":
    "카메라가 반복을 세면서 각 반복의 움직임도 살펴봐요. 스쿼트에서는 엉덩이가 무릎 높이까지 내려갔는지, 모든 리프트에서는 가장 잘된 반복보다 짧게 끝난 반복이 있는지, 스쿼트, 데드리프트, 오버헤드 프레스에서는 한쪽으로 기울었는지를 봐요.\n세트 사이에 가장 고칠 만한 점 하나를 몇 번의 반복에서 보였는지와 함께 알려 드리고, 인체 모형으로도 보여 드려요. 짧은 반복이 멈춘 지점이나 기운 방향이에요. 카메라 한 대로 대략 확인하는 것이라 확실할 때만 알려 드려요. 옆에서 찍으면 깊이가, 정면에서 찍으면 기울기가 가장 잘 보여요.",
  "gloss.speedMax.title": "바 속도로 보는 오늘의 최대 중량",
  "gloss.speedMax.body":
    "무게가 무거울수록 천천히 움직이고, 리프트마다 그 속도면 거의 한계 무게가 되는 속도가 있어요. 워밍업으로 몇 가지 무게와 속도를 얻으면, 그 점들을 잇는 선이 그 속도로 들 수 있는 무게, 즉 오늘의 추정 최대 중량을 가리켜요.\n오늘 계획보다 많이 높거나 낮으면 작은 조정을 제안해요. 최대 5% 더 무겁게, 또는 10% 더 가볍게예요. 카메라 추정치라서 마지막 판단은 첫 세트에 맡기세요.\n그 속도는 사람마다 조금씩 다르고, 카메라는 바가 아닌 몸을 측정해요. 그래서 카메라가 세는 동안 본 세트를 한계까지 하면(실패한 반복, 남은 반복 없음, 계획보다 적은 반복) 마지막 성공 반복의 속도를 저장하고, 그런 세트가 세 번 쌓이면 일반적인 속도 대신 내 속도로 추정해요.",
  "gloss.barSpeed.title": "바 속도",
  "gloss.barSpeed.body":
    "반복마다 바가 올라가는 속도를 카메라로 측정해요. 세트가 힘들어지면 반복이 아직 괜찮게 느껴져도 바는 느려져요.\n가장 빠른 반복보다 약 3분의 1 느려지면 제대로 된 반복이 대략 한 번 남은 거예요. 거기서 세트를 끝내면 무리하지 않고도 충분히 힘들게 운동할 수 있어요. 추정치이니 옆에서 찍고 밝은 곳에서 하면 도움이 돼요.",
  "gloss.fitnessAge.title": "체력 나이",
  "gloss.fitnessAge.body":
    "나와 같은 성별의 평범한 건강한 사람이 내 VO₂ max를 갖는 나이로, 건강한 성인을 대상으로 한 대규모 노르웨이 연구를 바탕으로 해요.\n체력 추정치이지 건강 검진이 아니에요. 고강도 유산소 운동을 하면 몇 주 안에 낮아져요.",
  "gloss.deloadWeeks.title": "디로드 전 빌드 주간",
  "gloss.deloadWeeks.body":
    "운동은 블록 단위로 진행돼요. 빌드 주간에는 계획이 매주 조금씩 어려워져요. 세트는 늘고 남겨 두는 반복은 줄어요.\n그다음 디로드 주가 한 번 와요. 더 가볍게, 세트는 절반 정도예요. 관절과 신경이 회복할 시간을 줘서 더 강해져서 돌아오게 해요. 처음이거나 바쁘면 빌드 주간을 짧게, 회복이 잘되면 길게 고르세요.",
  "gloss.deload.title": "디로드 주",
  "gloss.deload.body":
    "힘든 운동 블록 뒤에 오는 쉬운 주예요. 무게는 가볍게, 세트는 절반 정도예요. 진행이 멈추는 게 아니에요. 몸이 그동안의 운동을 흡수하는 시기라서 다음 블록을 더 강하게 시작할 수 있어요.",
  "gloss.rir.title": "RIR: 남은 반복 수",
  "gloss.rir.body":
    "세트를 멈췄을 때 더 할 수 있었던 반복 수예요. RIR 2는 제대로 된 반복을 두 번 정도 더 할 수 있다고 느끼며 세트를 끝낸다는 뜻이에요.\n계획은 여유 있게 시작해서 블록이 진행될수록 한계에 가까워져요.",
  "gloss.rpe.title": "RPE: 운동 자각도",
  "gloss.rpe.body":
    "세트가 얼마나 힘들게 느껴졌는지를 1에서 10으로 나타낸 거예요. 10은 전력을 다한 거예요. 8은 제대로 된 반복을 두 번 정도 더 할 수 있었다는 뜻으로, RIR 2와 같아요.",
  "gloss.blockWeek.title": "트레이닝 블록",
  "gloss.blockWeek.body":
    "블록에서 지금 어디쯤인지 보여 줘요. 몇 번째 빌드 주간(또는 디로드)인지, 이번 주에 몇 회를 남겨 둘지예요. 블록 길이는 설정에서 바꿀 수 있어요.",
  "gloss.readiness.title": "컨디션",
  "gloss.readiness.body":
    "0에서 100까지의 점수로, 50이 평소 수준이에요. 큰 근육이 얼마나 회복됐는지, 최근 운동이 어땠는지(목표 반복 달성, 세트 체감, 반복 속도, 심박수), 휴식일을 바탕으로 해요.\n65 이상이면 강하게 하는 날, 35 이하면 가볍게 하는 날이에요. 언제든 직접 바꿀 수 있어요.",
  "gloss.call.title": "오늘의 판단",
  "gloss.call.body":
    "강하게: 첫 번째 큰 리프트를 한계에 1회 더 가깝게 해요. 계획대로: 평소 계획이에요. 가볍게: 세트 하나 적게, 한 단계 가볍게, 남은 반복은 1회 더 많게 해요. 선택은 저장돼요.",
  "gloss.volume.title": "볼륨",
  "gloss.volume.body": "본 세트마다 무게 × 반복을 모두 더한 값이에요. 총 운동량을 대략 보여 줘요. 워밍업은 포함하지 않아요.",
  "gloss.e1rm.title": "추정 1RM",
  "gloss.e1rm.body":
    "한 번에 들 수 있을 것으로 보이는 최대 무게로, 세트 기록에 남은 반복 수를 더해 계산해요. 연구에서 반복 범위별로 가장 정확하다고 나온 공식을 써요(한계까지 10회 이하는 Brzycki와 Epley, 그 이상은 Mayhew와 Wathan). 각 공식은 30만 개 이상의 세트로 맞춘 2026년 무게 기반 공식과 평균을 내요. 최근 세트, 무거운 세트, 한계에 가까운 세트일수록 비중이 크고, 20회를 넘는 세트는 제외해요. 5회 세트와 8회 세트를 비교할 수 있어서 실제 최대 중량을 테스트하지 않아도 근력 추세를 볼 수 있어요.",
  "gloss.weeklySets.title": "이번 주 근육별 세트",
  "gloss.weeklySets.body":
    "이번 주 각 근육을 자극한 고강도 세트 수예요. 보조 근육은 0.5세트로 세요. 초록색 구간인 10~20세트가 근성장에 대해 가장 많은 연구가 뒷받침하는 범위예요. 계획은 이 구간에서 가장 많이 모자란 근육을 우선해요.",
  "gloss.experience.title": "운동 경력",
  "gloss.experience.body":
    "규칙적으로 웨이트를 한 기간이에요. 입문은 1년 미만, 중급은 1~3년, 숙련은 3년 이상이에요.\n각 근육이 주당 받는 고강도 세트 수(입문 8~12, 중급 10~16, 숙련 12~20)와 아직 기록하지 않은 리프트의 첫 무게를 정해요. 리프트를 기록하고 나면 내 세트 기록으로 무게를 정해요.\n맨몸 운동 프로그램의 시작 단계와 리프트 목표가 얼마나 빨리 오를지 예측하는 데도 쓰여요. 잘 모르겠다면 낮은 쪽을 고르세요. 계획이 금방 따라잡아요.",
  "gloss.variety.title": "운동 동작 다양성",
  "gloss.variety.body":
    "계획이 한 근육에 같은 운동 동작을 얼마나 자주 유지할지예요. 일관될수록 리프트의 진행을 추적하기 좋아요. 다양할수록 새롭고 부담이 분산돼요.",
  "gloss.recovery.title": "회복",
  "gloss.recovery.body":
    "세트마다 자극한 근육이 피로해져요. 그 피로는 2~3일에 걸쳐 풀려요. 90% 이상은 충분히 회복, 70%는 준비됨, 40%는 회복 중, 40% 미만은 피로예요. 계획은 아직 피로한 근육을 피해요.",
  "gloss.superset.title": "슈퍼세트",
  "gloss.superset.body":
    "둘 이상의 운동 동작을 연달아 하는 거예요. 첫 번째 동작 한 세트, 바로 다음 동작 한 세트, 그다음 휴식이에요. 시간을 아낄 수 있고, 로우와 프레스처럼 같은 근육을 지치게 하지 않는 동작끼리 할 때 가장 좋아요.\n두 운동 동작 사이의 연결 버튼을 탭하면 묶이고, 다시 탭하면 풀려요.",
  "gloss.warmup.title": "워밍업 세트",
  "gloss.warmup.body":
    "본 세트 무게까지 점점 올려 가는 가벼운 세트예요. 통계나 진행에는 포함되지 않아요. 이미 몸이 풀렸다면 건너뛰어도 돼요.",
  "gloss.firstWeights.title": "묻는 이유",
  "gloss.firstWeights.body":
    "리프트마다 안전한 첫 무게를 제안하기 위해서예요. 가벼운 쪽에서 시작해 첫 운동 후에 조정해요. 정보는 휴대폰에만 저장돼요.",
  "gloss.healthTwin.title": "건강",
  "gloss.healthTwin.body":
    "몸의 수치를 한곳에 모았어요. 체중, 체지방, 에너지, 수면, 심장, 걸음 수를 Liftsmith와 휴대폰의 건강 앱에서 가져와요.\n각 수치는 다른 사람이 아니라 지난 30일간의 내 평소 수치와 비교하고, 어떻게 하면 좋을지 알려 줘요. 의학적 조언은 아니에요.",
  "gloss.hrv.title": "HRV: 심박 변이도",
  "gloss.hrv.body":
    "심장 박동 사이 간격의 미세한 변화로, 워치나 링이 주로 밤사이에 측정해요. 평소보다 높으면 대개 회복이 됐다는 뜻이고, 낮으면 운동, 수면 부족, 질병으로 인한 스트레스를 뜻해요.\n중요한 건 내 추세뿐이에요. 휴대폰과 워치마다 측정 방식이 달라서 다른 사람의 수치와 비교하지 마세요.",
  "gloss.restingHr.title": "안정 시 심박수",
  "gloss.restingHr.body":
    "완전히 쉬고 있을 때의 심박수로, 보통 자는 동안 측정해요. 하루 이틀 평소보다 몇 회 높다면 조금 쉬엄쉬엄하라는 초기 신호예요.",
  "gloss.breathingRate.title": "호흡수",
  "gloss.breathingRate.body":
    "자는 동안 1분에 쉬는 숨의 횟수로, 워치나 링이 측정해요. 매우 일정하게 유지되므로 평소보다 2회 이상 늘면 몸이 아프기 시작한다는 첫 신호인 경우가 많아요.",
  "gloss.breathPattern.title": "호흡 패턴",
  "gloss.breathPattern.body":
    "세트 사이 휴식을 위한 가이드예요. 상자 둘레를 도는 점과 커졌다 작아지는 사각형을 따라가세요. 단계가 바뀔 때마다 부드러운 소리와 가벼운 진동이 나서 눈을 감고도 따라 할 수 있어요.\n박스 호흡: 들이쉬고, 참고, 내쉬고, 참기를 각 4초씩. 안정되고 차분해져요.\n4-7-8: 4초 들이쉬고, 7초 참고, 8초 내쉬어요. 긴 날숨이 심박을 가장 많이 늦춰요.\n이중 한숨: 숨을 들이쉬고 짧게 한 번 더 들이쉰 다음 길게 내쉬어요. 가장 빨리 진정되는 방법이에요.\n느린 호흡: 4초 들이쉬고 6초 내쉬어요.\n내 패턴: 상자의 각 변을 직접 정해요. 참기를 0으로 하면 빠져요.",
  "gloss.vo2max.title": "VO₂ max",
  "gloss.vo2max.body":
    "최대 노력에서 몸이 쓸 수 있는 산소량으로, 1분에 체중 1킬로그램당 밀리리터로 나타내요. 워치가 걷기와 달리기로 추정해요. 심폐 체력을 보여 주는 가장 좋은 단일 지표예요.\n웨이트로는 거의 변하지 않아요. 주 2회 20분 고강도 유산소 운동이면 올라가요.",
  "gloss.bodyFat.title": "체지방",
  "gloss.bodyFat.body":
    "체중에서 지방이 차지하는 비율로, 스마트 체중계, 체성분 측정기, 캘리퍼 측정으로 알 수 있어요. 방법마다 수치가 다르게 나오니 한 가지만 쓰고, 같은 시간대에, 되도록 아침 식사 전에 재세요.\n한 번의 측정은 큰 의미가 없어요. 몇 주에 걸쳐 세 번 이상 재면 추세가 보이고, 목표와 반대로 움직이면 코치 노트가 알려 줘요.",
  "gloss.leanMass.title": "제지방량",
  "gloss.leanMass.body":
    "몸에서 지방을 뺀 전부예요. 근육, 뼈, 장기, 수분이에요. 체중에 지방이 아닌 비율을 곱한 값이에요. 체지방이 유지되거나 줄면서 제지방량이 늘면 운동으로 근육이 붙고 있다는 뜻이에요.",
  "gloss.bmi.title": "BMI: 체질량 지수",
  "gloss.bmi.body":
    "체중을 키의 제곱으로 나눈 값이에요. 웨이트를 하지 않는 사람을 위한 대략적인 기준이에요. 근육과 지방을 구분하지 못해서 근육이 많은 사람은 과체중으로 나오기도 해요. 체지방 측정값이 있다면 그쪽을 믿으세요.",
  "gloss.liftScores.title": "DOTS, Wilks, IPF GL",
  "gloss.liftScores.body":
    "스쿼트, 벤치 프레스, 데드리프트 합계를 체중에 맞춰 점수로 매기는 세 가지 방법이에요. 가벼운 사람과 무거운 사람을 비교할 수 있어요.\nDOTS(2019)와 IPF GL(2020)이 더 새롭고 공정한 공식이고, Wilks는 많은 사람이 아직 알고 있는 예전 공식이에요. 점수는 같은 공식끼리만 비교하세요.",
  "gloss.ffmi.title": "FFMI: 제지방 지수",
  "gloss.ffmi.body":
    "제지방량(지방을 뺀 전부)을 키의 제곱으로 나누고 표준 키 1.8m에 맞춰 보정한 값이에요. BMI로는 알 수 없는 근육량을 보여 줘요.\n웨이트를 하는 남성은 대부분 19~23, 여성은 그보다 4 정도 낮아요. 약물을 쓰지 않는 사람을 조사한 연구에서는 25를 넘는 경우가 드물었어요.",
  "gloss.hrZones.title": "심박수 구간",
  "gloss.hrZones.body":
    "최대 심박수를 기준으로 나눈 다섯 단계의 운동 강도로, 쉬운 강도(1구간)부터 전력(5구간)까지예요.\n안정 시 심박수가 있으면 여유 심박수(안정 시와 최대 사이의 차이)를 사용해서 체력 변화를 더 잘 반영해요.",
  "gloss.restDrop.title": "휴식 중 심박수 감소",
  "gloss.restDrop.body":
    "세트 후 첫 1분 동안 심박수가 분당 몇 회 떨어지는지로, 심박 모니터로 측정해요. 몇 달에 걸쳐 감소 폭이 커지면 심장이 튼튼해졌다는 뜻이고, 평소보다 작으면 피곤하다는 뜻일 수 있어요.",
  "gloss.setTypes.title": "드롭 세트와 레스트 포즈",
  "gloss.setTypes.body":
    "계획된 세트를 기록한 뒤 세트 사이에 추가할 수 있는 보너스 세트예요.\n드롭 세트는 무게를 4분의 1 정도 줄여 바로 다시 해요. 레스트 포즈 세트는 같은 무게로 15초 쉬고 몇 회를 더 짜내요.\n둘 다 세트를 하나 통째로 더하지 않고도 근육에 자극을 더해요. 볼륨에는 포함되지만, 다음 무게는 계획된 세트만 보고 정해요.",
  "gloss.stretching.title": "워밍업 동작과 쿨다운 스트레칭",
  "gloss.stretching.body":
    "워밍업 동작은 움직이면서 하는 스트레칭과 드릴이에요. 심박수를 올리고 관절을 가동 범위 전체로 움직여서 첫 세트가 더 편해져요.\n쿨다운 스트레칭은 천천히 숨 쉬면서 30초 이상 유지하는 정적 스트레칭이에요. 근육이 따뜻한 운동 마지막이나 휴식일에 잘 맞아요. 살짝 당기는 정도까지만, 절대 아플 때까지 하지 마세요.",
  "gloss.crate.title": "상자와 보관함",
  "gloss.crate.body":
    "운동을 마칠 때마다 완료 화면에서 상자를 하나 받아요. 상자에는 강조 색상, 휴식 타이머 소리, 원판 마감 중 하나가 무작위로 들어 있어요. 일반 아이템이 가장 자주, 전설 아이템이 가장 드물게 나와요.\n어떤 레벨에서는 정해진 아이템을 주고, 새 칭호마다 보너스 상자를 줘서 가장 희귀한 아이템도 확실히 얻을 방법이 있어요. 잠긴 아이템을 탭하면 얻는 방법을 볼 수 있어요.\n이미 가진 아이템이 나오면 보너스 25 XP로 바뀌어요. 쓸 아이템은 여기 보관함에서 고르세요.",
  "gloss.badges.title": "업적과 배지",
  "gloss.badges.body":
    "업적은 운동 완료나 개인 최고 기록 경신 같은 목표예요. 업적마다 브론즈, 실버, 골드, 플래티넘의 최대 네 개 배지가 있고, 숫자가 커질수록 다음 배지를 받아요.\n어떤 배지는 앱의 색상 테마도 열어 줘요. 배지에 표시돼 있어요. 모든 배지는 XP를 주고, XP가 쌓이면 레벨이 올라요.",
  "gloss.monthly.title": "월간 챌린지",
  "gloss.monthly.body":
    "매달 모든 사용자가 같은 챌린지를 받아요. 운동 횟수, 세트 수, 운동 시간 중 하나가 달마다 바뀌어요. 내가 마친 운동으로 세기 때문에 오프라인에서도 돼요.\n달이 끝나기 전에 완료하면 그달의 메달을 받아요. 완료한 달은 월간 챌린저 배지에 반영돼요. 친구 › 보드에서 팔로우하는 사람들의 현황을 볼 수 있어요.",
  "gloss.schoolTeams.title": "학교 팀",
  "gloss.schoolTeams.body":
    "고등학교 코치는 학교나 교육청 이메일 주소를 인증하면 Pro를 무료로 받아요. 13~18세 선수도 팀에 있는 동안 Pro를 무료로 받아요.\n코치는 내 운동은 보지만 신체 정보는 보지 못해요. 팀원은 내 이름과 이번 주 운동 및 세트 수만 볼 수 있어요.",
  "gloss.strengthStandards.title": "근력 기준",
  "gloss.strengthStandards.body":
    "훈련된 사람들의 일반적인 추정 1RM으로, 체중에 맞추고 입력한 경우 나이와 성별도 반영해요. 공개된 근력 기준과 마스터즈 계수의 형태를 바탕으로 해요.\n백분율은 내 추정치가 훈련된 사람 중 대략 몇 %보다 높은지를 나타내며, 실제 Liftsmith 사용자 순위가 아니에요. 키와 BMI는 쓰지 않아요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Bar yolu",
  "gloss.barPath.body":
    "Barın her tekrarda izlediği çizgi, yandan bakınca. Squat, deadlift ve overhead press'te en iyisi, ayağının ortası üzerinde aşağı yukarı dümdüz inip çıkmasıdır.\nSetten sonra tekrar oynatma, görülmeye değer tekrarı gösterir: mavi çizgi bar, kesikli çizgi ise başladığı yerden dümdüz yukarısıdır. Bar tekrarlarının dörtte birinde ya da daha fazlasında öne veya arkaya kaydıysa bir ipucu alırsın. Tek kameradan kaba bir okuma (squat'ta omuzların, diğer hareketlerde ellerin barın yerine geçer), bu yüzden net olmadıkça sessiz kalır.",
  "gloss.formCheck.title": "Form kontrolü",
  "gloss.formCheck.body":
    "Kamera tekrarları sayarken her tekrarın nasıl gittiğine de bakar: squat'ta kalçanın diz hizasına inip inmediğine; her harekette bazı tekrarların en iyinden kısa kesilip kesilmediğine; squat, deadlift ve overhead press'te de bir yana yatıp yatmadığına.\nSetler arasında düzeltmeye en çok değer tek şeyi, kaç tekrarda gördüğüyle birlikte söyler, figür de gösterir: kısa tekrarlarının nerede durduğunu ya da nasıl yattığını. Tek kameradan kaba bir kontrol, bu yüzden net olmadıkça sessiz kalır. Derinliği en iyi yandan, yana yatmayı ise kameraya dönük durunca görür.",
  "gloss.speedMax.title": "Bar hızından bugünkü maksimum",
  "gloss.speedMax.body":
    "Ağırlık arttıkça daha yavaş kalkar ve her hareketin, bir tekrarın neredeyse kaldırabileceğin en ağır olduğu bir hızı vardır. Isınmaların birkaç ağırlık ve hızlarını verir; bunlardan geçen çizgi o hızda kaldıracağın ağırlığı gösterir: bugünkü tahmini maksimum.\nBugünkü planın beklediğinden epey yukarı ya da aşağıdaysa küçük bir değişiklik öneririz: en fazla %5 ağır ya da %10 hafif. Bu bir kamera tahmini, son sözü ilk setin söylesin.\nO hız kişiden kişiye biraz değişir ve kamera barı değil vücudunu ölçer. Bu yüzden kamera sayarken bir çalışma setini tükenişe kadar götürdüğünde (çıkmayan bir tekrar, kalmayan tekrar ya da plandan az tekrar), son iyi tekrarının hızı saklanır ve bu tür üç setten sonra tahmin olağan hız yerine senin hızını kullanır.",
  "gloss.barSpeed.title": "Bar hızı",
  "gloss.barSpeed.body":
    "Barın her tekrarda ne kadar hızlı kalktığı, kamerayla ölçülür. Set zorlaştıkça tekrarlar iyi hissettirse bile bar yavaşlar.\nEn hızlı tekrarından yaklaşık üçte bir yavaşsa aşağı yukarı bir iyi tekrarın kalmıştır; seti orada bitirmek işi zor tutar ama zorlanmadan. Bu bir tahmin: yandan bakış ve iyi ışık yardımcı olur.",
  "gloss.fitnessAge.title": "Fitness yaşı",
  "gloss.fitnessAge.body":
    "Senin cinsiyetinden tipik sağlıklı birinin senin VO₂ max değerine sahip olduğu yaş; sağlıklı yetişkinlerle yapılmış büyük bir Norveç çalışmasına dayanır.\nBu bir kondisyon tahmini, sağlık kontrolü değil. Zorlu kardiyo onu birkaç hafta içinde düşürür.",
  "gloss.deloadWeeks.title": "Deload öncesi yükleme haftaları",
  "gloss.deloadWeeks.body":
    "Antrenmanın bloklar halinde ilerler. Yükleme haftalarında plan her hafta biraz zorlaşır: daha çok set ve yedekte daha az tekrar.\nSonra bir deload haftası gelir: daha hafif, setlerin yaklaşık yarısı. Eklemlerin ve sinirlerin toparlanır, daha güçlü dönersin. Yeniysen ya da yoğunsan daha az yükleme haftası, iyi toparlanıyorsan daha fazla seç.",
  "gloss.deload.title": "Deload haftası",
  "gloss.deload.body":
    "Zorlu bir antrenman bloğundan sonra daha kolay bir hafta: daha hafif ağırlıklar ve setlerin yaklaşık yarısı. Kaybedilmiş ilerleme değil. Vücudun yapılan işi o zaman sindirir, böylece sonraki blok daha güçlü başlar.",
  "gloss.rir.title": "RIR: yedekteki tekrar",
  "gloss.rir.body":
    "Seti bitirdiğinde kaç tekrar daha yapabilecek olduğun. RIR 2, seti yaklaşık iki iyi tekrarın daha kaldığını hissederek bitirmek demek.\nPlan yedekte daha çok tekrarla başlar ve blok boyunca tükenişe yaklaşır.",
  "gloss.rpe.title": "RPE: algılanan zorluk derecesi",
  "gloss.rpe.body":
    "Bir setin 1'den 10'a kadar bir ölçekte ne kadar zor hissettirdiği; 10, elindeki her şey demek. 8, yaklaşık iki iyi tekrarın daha kaldığı anlamına gelir, yani yedekte 2 tekrarla aynı.",
  "gloss.blockWeek.title": "Antrenman bloğu",
  "gloss.blockWeek.body":
    "Bloğunda nerede olduğun: hangi yükleme haftası (ya da deload) ve bu hafta yedekte kaç tekrar bırakacağın. Blok uzunluğunu Ayarlar'dan değiştirebilirsin.",
  "gloss.readiness.title": "Hazırlık",
  "gloss.readiness.body":
    "0 ile 100 arası bir puan; 50 normal bir gün. Büyük kaslarının ne kadar toparlandığından, son antrenmanların nasıl geçtiğinden (tutturulan tekrarlar, setlerin nasıl hissettirdiği, tekrar hızı ve nabız) ve dinlenme günlerinden gelir.\n65 ve üstü yüklenme günü, 35 ve altı hafif gün. İstediğin zaman geçersiz kılabilirsin.",
  "gloss.call.title": "Günün kararı",
  "gloss.call.body":
    "Yüklen: ilk büyük hareketin tükenişe bir tekrar daha yaklaşır. Plana göre: normal plan. Hafif tut: bir set eksik, bir kademe hafif ve yedekte bir tekrar fazla. Seçimin kaydedilir.",
  "gloss.volume.title": "Hacim",
  "gloss.volume.body": "Ağırlık × tekrar, tüm çalışma setlerinde toplanır. Yaptığın toplam işin kaba bir ölçüsü. Isınmalar sayılmaz.",
  "gloss.e1rm.title": "Tahmini 1RM",
  "gloss.e1rm.body":
    "Muhtemelen bir kez kaldırabileceğin en fazla ağırlık; setlerinden, kalan tekrarlar eklenerek hesaplanır. Araştırmaların her tekrar aralığı için en doğru bulduğu formülleri kullanır (tükenişe 10 tekrara kadar Brzycki ve Epley, üstünde Mayhew ve Wathan), her biri 300.000'den fazla sete uydurulmuş, ağırlığa dayalı 2026 tarihli bir denklemle ortalanır. Yakın tarihli, ağır, tükenişe yakın setler en çok sayılır, 20 tekrarı geçen setler yok sayılır. 5'lik bir seti 8'lik bir setle karşılaştırmanı sağlar; böylece gerçek maksimumunu test etmeden gerçek güç eğilimlerini görürsün.",
  "gloss.weeklySets.title": "Bu hafta kas başına set",
  "gloss.weeklySets.body":
    "Bu hafta her kası çalıştıran zor setler. Yardımcı kaslar yarım set sayılır. 10 ile 20 arasındaki yeşil bant, araştırmaların büyüme için en çok desteklediği aralık. Plan bunun en çok altında kalan kaslara yönelir.",
  "gloss.experience.title": "Deneyim",
  "gloss.experience.body":
    "Ne kadar süredir düzenli ağırlık çalıştığın. Yeni bir yıldan az, Biraz 1 ila 3 yıl, Deneyimli ise 3 yıl ya da daha fazla.\nHer kasın haftada kaç zor set alacağını (Yeni için 8–12, Biraz için 10–16, Deneyimli için 12–20) ve henüz kaydetmediğin hareketlerde ilk ağırlıkların ne kadar olacağını belirler. Bir hareketi kaydettikten sonra ağırlıklarını kendi setlerin belirler.\nAyrıca vücut ağırlığı programlarında başlangıç kademesini ve hareket hedeflerinin ne kadar hızlı ilerleyeceğinin tahminini seçer. Emin değil misin? Düşük olanı seç; plan çabucak yetişir.",
  "gloss.variety.title": "Egzersiz çeşitliliği",
  "gloss.variety.body":
    "Planın bir kas için aynı egzersizi ne sıklıkla koruduğu. Daha tutarlı, bir harekette ilerlemeyi takip etmek için daha iyi. Daha çok çeşitlilik işleri taze tutar ve yükü dağıtır.",
  "gloss.recovery.title": "Toparlanma",
  "gloss.recovery.body":
    "Her set çalıştırdığı kasları yorar. Bu yorgunluk 2–3 günde geçer. Dinç %90 ve üstü, Hazır %70, Toparlanıyor %40, Yorgun ise %40'ın altı. Plan hâlâ yorgun olan kaslardan kaçınır.",
  "gloss.superset.title": "Süperset",
  "gloss.superset.body":
    "Arka arkaya yapılan iki ya da daha fazla egzersiz: ilkinden bir set, ardından hemen sonrakinden bir set, sonra dinlenme. Zaman kazandırır ve aynı kasları yormayan egzersizlerde, örneğin bir row ile bir press'te, en iyi işler.\nEşleştirmek için iki egzersiz arasındaki bağlantıya dokun, ayırmak için yine dokun.",
  "gloss.warmup.title": "Isınma setleri",
  "gloss.warmup.body":
    "Çalışma ağırlığına doğru çıkan daha hafif setler. İstatistiklerine ya da ilerlemene sayılmazlar. Zaten ısındıysan atla.",
  "gloss.firstWeights.title": "Neden soruyoruz",
  "gloss.firstWeights.body":
    "Sadece her hareket için güvenli bir ilk ağırlık önermek için. Hafif taraftan başlar, ilk antrenmanından sonra ayarlarız. Telefonunda kalır.",
  "gloss.healthTwin.title": "Sağlık",
  "gloss.healthTwin.body":
    "Vücudunun sayıları tek yerde: kilo, vücut yağı, enerji, uyku, kalp ve adımlar; Liftsmith'ten ve telefonunun sağlık uygulamasından.\nHer biri başkalarıyla değil, son 30 gündeki kendi normalinle karşılaştırılır ve ne yapman gerektiğini söyler. Tıbbi tavsiye değildir.",
  "gloss.hrv.title": "HRV: kalp atış hızı değişkenliği",
  "gloss.hrv.body":
    "Kalp atışları arasındaki sürede olan minik değişimler; saat ya da yüzükle, çoğunlukla gece ölçülür. Kendi normalinden yüksek olması genelde toparlandığın, düşük olması ise antrenman, kötü uyku ya da hastalıktan gelen stres anlamına gelir.\nSadece kendi eğilimin önemli: telefonlar ve saatler bunu farklı ölçer, o yüzden sayını başkasınınkiyle karşılaştırma.",
  "gloss.restingHr.title": "Dinlenme nabzı",
  "gloss.restingHr.body":
    "Tamamen dinlenirkenki nabzın, genelde uyurken ölçülür. Bir iki gün kendi normalinin birkaç atım üstünde olması, biraz yavaşlaman için erken bir işaret.",
  "gloss.breathingRate.title": "Solunum hızı",
  "gloss.breathingRate.body":
    "Uyurken dakikadaki nefes sayısı, saat ya da yüzükten. Çok sabit kalır; bu yüzden normalinin iki ya da daha fazla üstüne sıçraması çoğu zaman hastalanmanın ilk işaretlerinden biridir.",
  "gloss.breathPattern.title": "Nefes kalıpları",
  "gloss.breathPattern.body":
    "Setler arası dinlenme için bir rehber: noktayı kutunun etrafında, kareyi de büyüyüp küçülürken takip et. Her adım değişiminde yumuşak bir ses ve hafif bir titreşim gelir, böylece gözlerin kapalı da takip edebilirsin.\nKutu nefesi: al, tut, ver ve tut, her biri 4 saniye. Dengeli ve sakinleştirici.\n4-7-8: 4'te al, 7 tut, 8'de ver. Uzun nefes verme kalbi en çok yavaşlatır.\nÇift iç çekiş: bir nefes al, üstüne kısa ikinci bir yudum, sonra uzun bir nefes ver. Sakinleşmenin en hızlı yolu.\nYavaş nefesler: 4'te al, 6'da ver.\nSenin kalıbın: kutunun her kenarını kendin ayarla. 0 tutma onu çıkarır.",
  "gloss.vo2max.title": "VO₂ max",
  "gloss.vo2max.body":
    "Vücudunun tam eforda kullanabildiği oksijen miktarı, kilogram başına dakikada mililitre olarak. Saatler bunu yürüyüş ve koşulardan tahmin eder. Kalp kondisyonunun en iyi tek ölçüsü.\nAğırlık çalışmak onu pek değiştirmez. Haftada iki kez 20 dakikalık zorlu kardiyo değiştirir.",
  "gloss.bodyFat.title": "Vücut yağı",
  "gloss.bodyFat.body":
    "Kilonun yağdan oluşan payı; akıllı tartı, vücut tarayıcı ya da kaliper ölçümünden. Her yöntem farklı okur, bu yüzden birine bağlı kal ve günün aynı saatinde, tercihen sabah yemekten önce ölç.\nTek bir ölçüm pek bir şey ifade etmez. Birkaç hafta içinde üç ya da daha fazlası eğilimi gösterir; hedefin için yanlış yöne gidiyorsa Koç notları sana söyler.",
  "gloss.leanMass.title": "Yağsız kütle",
  "gloss.leanMass.body":
    "Vücudunda yağ olmayan her şey: kas, kemik, organlar ve su. Kilonun, yağ olmayan payla çarpımı. Vücut yağı sabit kalırken ya da düşerken yağsız kütlenin artması, antrenmanın kas yaptığı anlamına gelir.",
  "gloss.bmi.title": "BMI: vücut kitle indeksi",
  "gloss.bmi.body":
    "Kilonun boyun karesine bölümü. Ağırlık çalışmayanlar için kaba bir rehber: kası yağdan ayıramaz, bu yüzden kaslı sporcular sık sık fazla kilolu görünür. Bir vücut yağı ölçümün varsa ona güven.",
  "gloss.liftScores.title": "DOTS, Wilks ve IPF GL",
  "gloss.liftScores.body":
    "Squat, bench press ve deadlift toplamını vücut ağırlığına göre puanlamanın üç yolu; böylece hafif ve ağır bir sporcu karşılaştırılabilir.\nDOTS (2019) ve IPF GL (2020) daha yeni ve daha adil formüller; Wilks ise pek çok sporcunun hâlâ bildiği eski formül. Bir puanı sadece aynı formülle karşılaştır.",
  "gloss.ffmi.title": "FFMI: yağsız kütle indeksi",
  "gloss.ffmi.body":
    "Yağsız kütlenin (yağ dışındaki her şey) boyunun karesine bölümü, 1,8 m standart boya göre ayarlanır. BMI'nin gösteremediği, ne kadar kas taşıdığını gösterir.\nAğırlık çalışan erkeklerin çoğu 19 ile 23 arasında, kadınlar yaklaşık 4 aşağıda. Doping kullanmayan sporcularla yapılan bir çalışma 25'in üstünde çok az kişi buldu.",
  "gloss.hrZones.title": "Nabız bölgeleri",
  "gloss.hrZones.body":
    "Maksimum nabzından belirlenen beş efor bandı; kolaydan (bölge 1) tam güce (bölge 5) kadar.\nDinlenme nabzın varsa, kondisyonunu daha iyi takip eden nabız rezervini (dinlenme ile maksimum arasındaki fark) kullanırlar.",
  "gloss.restDrop.title": "Dinlenmede nabız düşüşü",
  "gloss.restDrop.body":
    "Bir setten sonraki ilk dakikada nabzının dakikada kaç atım düştüğü, nabız ölçerinden. Aylar içinde daha büyük bir düşüş daha fit bir kalp demek; olağandan küçük bir düşüş yorgun olduğun anlamına gelebilir.",
  "gloss.setTypes.title": "Drop set ve rest-pause",
  "gloss.setTypes.body":
    "Planlanan set kaydedildikten sonra setler arasında ekleyebileceğin bonus setler.\nDrop set ağırlığı yaklaşık dörtte bir düşürür ve hemen tekrar yapar. Rest-pause seti aynı ağırlıkta kalır, 15 saniye durur, sonra birkaç tekrar daha sıkar.\nİkisi de tam bir ekstra set olmadan kasa iş ekler. Hacmine sayılırlar ama planın sonraki ağırlıkları sadece planlanan setlerine bakar.",
  "gloss.stretching.title": "Isınma hareketleri ve soğuma esneme",
  "gloss.stretching.body":
    "Isınma hareketleri, hareketli esnemeler ve drillerdir. Nabzını yükseltir ve eklemlerini hareket açıklıklarında gezdirir, böylece ilk setler daha iyi hissettirir.\nSoğuma esnemeleri, yavaş nefes alırken 30 saniye ya da daha uzun tuttuğun sabit esnemelerdir. Kaslar ısınmışken, antrenman sonuna ya da dinlenme gününe uyar. Hafif gerginliğe kadar esne, asla acıya kadar değil.",
  "gloss.crate.title": "Sandıklar ve Dolap",
  "gloss.crate.body":
    "Biten her antrenman Bitti ekranında sana bir sandık verir. İçinde rastgele seçilmiş bir vurgu rengi, dinlenme sayacı sesi ya da plaka kaplaması vardır: yaygınlar en sık, efsaneviler en seyrek çıkar.\nBazı seviyeler belirli bir eşya verir ve her yeni unvan bonus bir sandık verir; böylece en nadir eşyaların bile kesin bir yolu vardır. Nasıl alınacağını görmek için kilitli bir eşyaya dokun.\nZaten sahip olduğun bir şey çıkarsa 25 bonus XP'ye dönüşür. Kullandıklarını burada, Dolap'ta seç.",
  "gloss.badges.title": "Başarımlar ve rozetler",
  "gloss.badges.body":
    "Başarım bir hedeftir, antrenman bitirmek ya da kişisel rekor kırmak gibi. Her birinin en fazla dört rozeti vardır: bronz, gümüş, altın ve platin; giderek büyüyen sayılarda kazanılır.\nBazı rozetler uygulama için bir renk teması da açar; rozet hangisi olduğunu söyler. Her rozet XP verir, bu da seviyeni yükseltir.",
  "gloss.monthly.title": "Aylık meydan okuma",
  "gloss.monthly.body":
    "Her ay her sporcu aynı meydan okumayı alır: belli sayıda antrenman, set ya da dakika, aydan aya değişir. Kendi bitirdiğin antrenmanlar sayılır, bu yüzden çevrimdışı da çalışır.\nO ayın madalyasını kazanmak için ay bitmeden tamamla. Tamamlanan her ay Aylık meydan okuyucu rozetine sayılır. Arkadaşlar › Tablo, takip ettiklerinin nasıl gittiğini gösterir.",
  "gloss.schoolTeams.title": "Okul takımları",
  "gloss.schoolTeams.body":
    "Lise koçları, okullarından ya da eğitim bölgelerinden bir e-posta adresini doğruladıklarında Pro'yu ücretsiz alır. 13–18 yaş arası sporcuları da takımda oldukları sürece Pro'yu ücretsiz alır.\nKoç antrenmanlarını görür, vücut verilerini görmez. Takım arkadaşların sadece adını ve bu hafta kaç antrenman ve set yaptığını görür.",
  "gloss.strengthStandards.title": "Güç standartları",
  "gloss.strengthStandards.body":
    "Antrenmanlı sporcular için tipik tahmini 1RM değerleri; vücut ağırlığına göre ölçeklenir ve eklediysen yaş ile cinsiyete göre ayarlanır. Yayınlanmış güç standartlarının ve master katsayılarının şeklinden gelir.\nYüzde, tahmininin geçtiği antrenmanlı sporcuların kaba bir payıdır; gerçek Liftsmith kullanıcılarının sıralaması değildir. Boy ve BMI kullanılmaz.",
};

export const pl: Partial<Record<Key, Message>> = {
  "gloss.barPath.title": "Tor sztangi",
  "gloss.barPath.body":
    "Linia, którą sztanga pokonuje w każdym powtórzeniu, widziana z boku. W przysiadach, martwym ciągu i wyciskaniu nad głowę najlepiej, gdy idzie mniej więcej pionowo w górę i w dół nad środkiem stopy.\nPo serii powtórka pokazuje powtórzenie, które warto zobaczyć: niebieska linia to sztanga, a przerywana to pion od miejsca startu. Jeśli sztanga uciekła do przodu lub do tyłu w co najmniej jednej czwartej powtórzeń, dostaniesz jedną wskazówkę. To przybliżony odczyt z jednej kamery (w przysiadzie sztangę zastępują barki, w innych ćwiczeniach dłonie), więc odzywa się tylko, gdy wszystko jest jasne.",
  "gloss.formCheck.title": "Kontrola techniki",
  "gloss.formCheck.body":
    "Licząc powtórzenia, kamera sprawdza też, jak przebiegło każde z nich: w przysiadach, czy biodra zeszły do poziomu kolan; w każdym ćwiczeniu, czy niektóre powtórzenia były krótsze niż twoje najlepsze; a w przysiadach, martwym ciągu i wyciskaniu nad głowę, czy przechylałeś się na bok.\nMiędzy seriami podaje jedną rzecz, którą najbardziej warto poprawić, z liczbą powtórzeń, w których ją zauważyła, a sylwetka to pokazuje: gdzie zatrzymały się krótkie powtórzenia albo w którą stronę się przechylałeś. To przybliżona kontrola z jednej kamery, więc odzywa się tylko, gdy wszystko jest jasne. Z boku najlepiej widać głębokość; przodem do kamery widać przechył.",
  "gloss.speedMax.title": "Dzisiejsze maksimum z prędkości sztangi",
  "gloss.speedMax.body":
    "Im większy ciężar, tym wolniej się porusza, a każde ćwiczenie ma prędkość, przy której powtórzenie jest mniej więcej tak ciężkie, jak dasz radę. Rozgrzewka daje kilka ciężarów i ich prędkości, a linia przez nie wskazuje ciężar, który przesunąłbyś z tą prędkością: dzisiejsze szacowane maksimum.\nGdy wyraźnie odbiega od tego, czego oczekuje dzisiejszy plan, proponujemy małą zmianę: najwyżej 5% więcej lub 10% mniej. To szacunek z kamery, więc ostatnie słowo należy do pierwszej serii.\nTa prędkość różni się trochę między ludźmi, a kamera mierzy twoje ciało, a nie sztangę. Dlatego gdy zrobisz serię roboczą do upadku, kiedy kamera liczy (nieudane powtórzenie, brak zapasu albo mniej powtórzeń niż w planie), zapisujemy prędkość ostatniego dobrego powtórzenia, a po trzech takich seriach szacunek opiera się na twojej prędkości zamiast typowej.",
  "gloss.barSpeed.title": "Prędkość sztangi",
  "gloss.barSpeed.body":
    "Jak szybko sztanga idzie w górę w każdym powtórzeniu, mierzone kamerą. Gdy seria robi się ciężka, sztanga zwalnia, nawet jeśli powtórzenia wciąż wydają się w porządku.\nGdy jest mniej więcej o jedną trzecią wolniejsza niż twoje najszybsze powtórzenie, zostało ci około jednego dobrego powtórzenia, więc zakończenie serii w tym miejscu utrzymuje ciężką pracę bez mielenia. To szacunek: widok z boku i dobre światło pomagają.",
  "gloss.fitnessAge.title": "Wiek sprawnościowy",
  "gloss.fitnessAge.body":
    "Wiek, w którym typowa zdrowa osoba twojej płci ma twoje VO₂ max, według dużego norweskiego badania zdrowych dorosłych.\nTo szacunek sprawności, nie badanie zdrowia. Intensywne cardio obniża go w ciągu kilku tygodni.",
  "gloss.deloadWeeks.title": "Tygodnie budowania przed deloadem",
  "gloss.deloadWeeks.body":
    "Twój trening jest podzielony na bloki. W tygodniach budowania plan co tydzień robi się trochę trudniejszy: więcej serii i mniejszy zapas powtórzeń.\nPotem przychodzi jeden tydzień deloadu: lżej, około połowy serii. Pozwala stawom i układowi nerwowemu nadrobić zaległości, więc wracasz silniejszy. Wybierz mniej tygodni budowania, jeśli zaczynasz lub masz mało czasu, więcej, jeśli dobrze się regenerujesz.",
  "gloss.deload.title": "Tydzień deloadu",
  "gloss.deload.body":
    "Lżejszy tydzień po bloku ciężkiego treningu: mniejsze ciężary i około połowy serii. To nie strata postępów. To wtedy ciało przyswaja pracę, więc kolejny blok zaczynasz silniejszy.",
  "gloss.rir.title": "RIR: powtórzenia w zapasie",
  "gloss.rir.body":
    "Ile jeszcze powtórzeń dałbyś radę zrobić, kończąc serię. RIR 2 oznacza, że kończysz serię z poczuciem, że masz w sobie jeszcze około dwóch dobrych powtórzeń.\nPlan zaczyna z większym zapasem i w trakcie bloku zbliża się do upadku.",
  "gloss.rpe.title": "RPE: odczuwany wysiłek",
  "gloss.rpe.body":
    "Jak ciężka była seria w skali od 1 do 10, gdzie 10 to wszystko, co miałeś. 8 oznacza, że miałeś w sobie jeszcze około dwóch dobrych powtórzeń, czyli tyle samo co 2 powtórzenia w zapasie.",
  "gloss.blockWeek.title": "Blok treningowy",
  "gloss.blockWeek.body":
    "Gdzie jesteś w bloku: który tydzień budowania (albo deload) i ile powtórzeń zostawić w zapasie w tym tygodniu. Długość bloku zmienisz w Ustawieniach.",
  "gloss.readiness.title": "Gotowość",
  "gloss.readiness.body":
    "Wynik od 0 do 100, gdzie 50 to zwykły dzień. Bierze się z tego, jak zregenerowane są twoje duże mięśnie, jak poszły ostatnie treningi (zrobione powtórzenia, odczucia z serii, prędkość powtórzeń i tętno) oraz z dni odpoczynku.\n65 lub więcej to dzień na mocniej, 35 lub mniej to dzień na lżej. Zawsze możesz to zmienić.",
  "gloss.call.title": "Decyzja na dziś",
  "gloss.call.body":
    "Mocniej: pierwsze duże ćwiczenie idzie o jedno powtórzenie bliżej upadku. Zgodnie z planem: zwykły plan. Lżej: o jedną serię mniej, o stopień lżej i jedno powtórzenie więcej w zapasie. Twój wybór zostaje zapisany.",
  "gloss.volume.title": "Objętość",
  "gloss.volume.body":
    "Ciężar × powtórzenia, zsumowane ze wszystkich serii roboczych. To przybliżona miara całej wykonanej pracy. Rozgrzewka się nie liczy.",
  "gloss.e1rm.title": "Szacowany 1RM",
  "gloss.e1rm.body":
    "Najwięcej, ile prawdopodobnie podniósłbyś raz, wyliczone z twoich serii z doliczonym zapasem powtórzeń. Używa wzorów, które badania uznały za najdokładniejsze dla danego zakresu powtórzeń (Brzycki i Epley do 10 powtórzeń do upadku, Mayhew i Wathan powyżej), każdy uśredniony z równaniem z 2026 roku opartym na ciężarze, dopasowanym na ponad 300 000 serii. Najbardziej liczą się świeże, ciężkie serie blisko upadku, a serie powyżej 20 powtórzeń są pomijane. Pozwala porównać serię na 5 z serią na 8, więc widzisz prawdziwe trendy siły bez testowania prawdziwego maksimum.",
  "gloss.weeklySets.title": "Serie na mięsień w tym tygodniu",
  "gloss.weeklySets.body":
    "Ciężkie serie, które w tym tygodniu pracowały na dany mięsień. Mięśnie pomocnicze liczą się jako pół serii. Zielony pas, od 10 do 20, to zakres, który większość badań wspiera dla wzrostu mięśni. Plan celuje w mięśnie najbardziej poniżej niego.",
  "gloss.experience.title": "Doświadczenie",
  "gloss.experience.body":
    "Jak długo regularnie trenujesz z ciężarami. Początkujący to mniej niż rok, Średnio zaawansowany to 1 do 3 lat, a Doświadczony to 3 lata lub więcej.\nUstala, ile ciężkich serii tygodniowo dostaje każdy mięsień (8 do 12 dla Początkującego, 10 do 16 dla Średnio zaawansowanego, 12 do 20 dla Doświadczonego) i jak ciężkie są pierwsze ciężary w ćwiczeniach, których jeszcze nie zapisałeś. Po zapisaniu ćwiczenia ciężary ustalają twoje własne serie.\nWybiera też poziom startowy w programach z masą ciała i to, jak szybko według prognozy będą rosły twoje cele siłowe. Nie wiesz? Wybierz niższy; plan szybko nadrobi.",
  "gloss.variety.title": "Różnorodność ćwiczeń",
  "gloss.variety.body":
    "Jak często plan zostawia to samo ćwiczenie na dany mięsień. Większa stałość lepiej sprawdza się przy śledzeniu postępów w ćwiczeniu. Większa różnorodność daje świeżość i rozkłada obciążenie.",
  "gloss.recovery.title": "Regeneracja",
  "gloss.recovery.body":
    "Każda seria męczy mięśnie, które pracują. To zmęczenie mija w ciągu 2–3 dni. Świeży to 90% lub więcej, Gotowy 70%, W regeneracji 40%, a Zmęczony to poniżej 40%. Plan omija mięśnie, które są jeszcze zmęczone.",
  "gloss.superset.title": "Superseria",
  "gloss.superset.body":
    "Dwa lub więcej ćwiczeń jedno po drugim: jedna seria pierwszego, od razu jedna seria następnego, a potem przerwa. Oszczędza czas i najlepiej działa dla ćwiczeń, które nie męczą tych samych mięśni, na przykład wiosłowania z wyciskaniem.\nStuknij łącznik między dwoma ćwiczeniami, żeby je połączyć, i jeszcze raz, żeby je rozdzielić.",
  "gloss.warmup.title": "Serie rozgrzewkowe",
  "gloss.warmup.body":
    "Lżejsze serie, które prowadzą do ciężaru roboczego. Nie liczą się do statystyk ani postępów. Pomiń je, jeśli już jesteś rozgrzany.",
  "gloss.firstWeights.title": "Dlaczego pytamy",
  "gloss.firstWeights.body":
    "Tylko po to, żeby zaproponować bezpieczny pierwszy ciężar w każdym ćwiczeniu. Zaczynamy lżej i dostosowujemy po pierwszym treningu. Dane zostają na twoim telefonie.",
  "gloss.healthTwin.title": "Zdrowie",
  "gloss.healthTwin.body":
    "Liczby twojego ciała w jednym miejscu: waga, tkanka tłuszczowa, energia, sen, serce i kroki, z Liftsmith i aplikacji zdrowia w telefonie.\nKażda jest porównywana z twoją własną normą z ostatnich 30 dni, nigdy z innymi ludźmi, i mówi, co z tym zrobić. To nie jest porada medyczna.",
  "gloss.hrv.title": "HRV: zmienność rytmu serca",
  "gloss.hrv.body":
    "Drobne zmiany odstępów między uderzeniami serca, mierzone zegarkiem lub pierścieniem, głównie w nocy. Wyższa niż twoja norma zwykle oznacza, że się zregenerowałeś; niższa oznacza stres od treningu, słaby sen lub chorobę.\nLiczy się tylko twój własny trend: telefony i zegarki mierzą ją inaczej, więc nie porównuj swojej liczby z cudzą.",
  "gloss.restingHr.title": "Tętno spoczynkowe",
  "gloss.restingHr.body":
    "Twoje tętno w pełnym spoczynku, zwykle mierzone podczas snu. Kilka uderzeń powyżej twojej normy przez dzień lub dwa to wczesny sygnał, żeby trochę odpuścić.",
  "gloss.breathingRate.title": "Częstość oddechów",
  "gloss.breathingRate.body":
    "Oddechy na minutę podczas snu, z zegarka lub pierścienia. Jest bardzo stabilna, więc skok o dwa lub więcej ponad twoją normę jest często jednym z pierwszych objawów choroby.",
  "gloss.breathPattern.title": "Wzorce oddechu",
  "gloss.breathPattern.body":
    "Przewodnik na przerwę między seriami: śledź kropkę wokół kwadratu i kwadrat, gdy rośnie i maleje. Każda zmiana fazy daje cichy dźwięk i lekką wibrację, więc możesz oddychać z zamkniętymi oczami.\nOddech pudełkowy: wdech, wstrzymanie, wydech i wstrzymanie, po 4 sekundy. Równy i uspokajający.\n4-7-8: wdech na 4, wstrzymanie na 7, wydech na 8. Długi wydech najbardziej zwalnia serce.\nPodwójne westchnienie: wdech, krótki drugi wdech na wierzchu, potem długi wydech. Najszybszy sposób, żeby się uspokoić.\nSpokojne oddechy: wdech na 4, wydech na 6.\nWłasny: ustaw każdy bok kwadratu sam. Wstrzymanie 0 je pomija.",
  "gloss.vo2max.title": "VO₂ max",
  "gloss.vo2max.body":
    "Ile tlenu twoje ciało może wykorzystać przy pełnym wysiłku, w mililitrach na kilogram na minutę. Zegarki szacują je ze spacerów i biegów. To najlepsza pojedyncza miara wydolności serca.\nTrening siłowy prawie go nie zmienia. Dwie 20-minutowe intensywne sesje cardio w tygodniu już tak.",
  "gloss.bodyFat.title": "Tkanka tłuszczowa",
  "gloss.bodyFat.body":
    "Udział tłuszczu w twojej wadze, z inteligentnej wagi, skanera ciała lub pomiaru fałdomierzem. Każda metoda mierzy inaczej, więc trzymaj się jednej i mierz o tej samej porze dnia, najlepiej rano przed jedzeniem.\nJeden pomiar niewiele mówi. Trzy lub więcej w ciągu kilku tygodni pokazują trend, a notatki trenera powiedzą ci, gdy zmienia się w złą stronę dla twojego celu.",
  "gloss.leanMass.title": "Beztłuszczowa masa ciała",
  "gloss.leanMass.body":
    "Wszystko w twoim ciele, co nie jest tłuszczem: mięśnie, kości, narządy i woda. Twoja waga razy udział, który nie jest tłuszczem. Rosnąca masa beztłuszczowa przy stałej lub spadającej tkance tłuszczowej oznacza, że trening buduje mięśnie.",
  "gloss.bmi.title": "BMI: wskaźnik masy ciała",
  "gloss.bmi.body":
    "Waga podzielona przez wzrost do kwadratu. To przybliżona wskazówka dla osób, które nie trenują siłowo: nie odróżnia mięśni od tłuszczu, więc umięśnieni często wychodzą na osoby z nadwagą. Gdy masz pomiar tkanki tłuszczowej, ufaj jemu.",
  "gloss.liftScores.title": "DOTS, Wilks i IPF GL",
  "gloss.liftScores.body":
    "Trzy sposoby oceny sumy przysiadu, wyciskania i martwego ciągu względem masy ciała, żeby porównać lekkiego zawodnika z ciężkim.\nDOTS (2019) i IPF GL (2020) to nowsze, sprawiedliwsze wzory; Wilks to starszy, który wielu wciąż zna. Porównuj wynik tylko w obrębie tego samego wzoru.",
  "gloss.ffmi.title": "FFMI: wskaźnik beztłuszczowej masy ciała",
  "gloss.ffmi.body":
    "Twoja beztłuszczowa masa ciała (wszystko poza tłuszczem) podzielona przez wzrost do kwadratu, przeliczona na standardowy wzrost 1,8 m. Pokazuje, ile masz mięśni, czego BMI nie potrafi.\nWiększość trenujących mężczyzn mieści się między 19 a 23, a kobiety około 4 niżej. Badanie trenujących bez dopingu wykazało niewielu powyżej 25.",
  "gloss.hrZones.title": "Strefy tętna",
  "gloss.hrZones.body":
    "Pięć przedziałów wysiłku ustalonych z twojego tętna maksymalnego, od lekkiego (strefa 1) do maksymalnego (strefa 5).\nGdy znane jest tętno spoczynkowe, strefy używają rezerwy tętna (różnicy między spoczynkowym a maksymalnym), która lepiej odzwierciedla twoją formę.",
  "gloss.restDrop.title": "Spadek tętna w przerwie",
  "gloss.restDrop.body":
    "O ile uderzeń na minutę spada twoje tętno w pierwszej minucie po serii, według pulsometru. Większy spadek z miesiącami oznacza sprawniejsze serce; mniejszy niż zwykle może oznaczać zmęczenie.",
  "gloss.setTypes.title": "Drop sety i rest-pause",
  "gloss.setTypes.body":
    "Dodatkowe serie, które możesz dorzucić między seriami, gdy zaplanowana seria jest już zapisana.\nDrop set zmniejsza ciężar o mniej więcej jedną czwartą i od razu idzie dalej. Seria rest-pause zostaje przy tym samym ciężarze, robi 15 sekund pauzy, a potem wyciska jeszcze kilka powtórzeń.\nObie dokładają pracy mięśniowi bez pełnej dodatkowej serii. Liczą się do objętości, ale kolejne ciężary w planie biorą pod uwagę tylko zaplanowane serie.",
  "gloss.stretching.title": "Ruchy rozgrzewkowe i rozciąganie na koniec",
  "gloss.stretching.body":
    "Ruchy rozgrzewkowe to dynamiczne rozciąganie i ćwiczenia. Podnoszą tętno i przeprowadzają stawy przez pełny zakres, więc pierwsze serie idą lepiej.\nRozciąganie na koniec to statyczne pozycje trzymane 30 sekund lub dłużej przy spokojnym oddechu. Pasują na koniec treningu albo w dzień odpoczynku, gdy mięśnie są rozgrzane. Rozciągaj do lekkiego napięcia, nigdy do bólu.",
  "gloss.crate.title": "Skrzynki i Szafka",
  "gloss.crate.body":
    "Każdy ukończony trening daje skrzynkę na ekranie Gotowe. Zawiera jeden kolor akcentu, dźwięk minutnika przerwy albo wykończenie talerzy, wylosowane: zwykłe trafiają się najczęściej, a legendarne najrzadziej.\nNiektóre poziomy dają konkretny przedmiot, a każdy nowy tytuł daje dodatkową skrzynkę, więc nawet najrzadsze przedmioty mają pewną drogę. Stuknij zablokowany przedmiot, żeby zobaczyć, jak go zdobyć.\nJeśli dostaniesz coś, co już masz, zamienia się w 25 dodatkowych XP. Tutaj w Szafce wybierasz, czego używasz.",
  "gloss.badges.title": "Osiągnięcia i odznaki",
  "gloss.badges.body":
    "Osiągnięcie to cel, na przykład ukończone treningi albo rekordy życiowe. Każde ma do czterech odznak: brązową, srebrną, złotą i platynową, zdobywane przy coraz większych liczbach.\nNiektóre odznaki odblokowują też motyw kolorystyczny aplikacji; odznaka mówi który. Każda odznaka daje XP, które podnosi twój poziom.",
  "gloss.monthly.title": "Wyzwanie miesiąca",
  "gloss.monthly.body":
    "Każdy co miesiąc dostaje to samo wyzwanie: liczbę treningów, serii lub minut, zmieniane z miesiąca na miesiąc. Liczą się twoje ukończone treningi, więc działa offline.\nUkończ je przed końcem miesiąca, żeby zdobyć medal tego miesiąca. Każdy ukończony miesiąc liczy się do odznaki Miesięczny pretendent. Znajomi › Tablica pokazuje, jak radzą sobie osoby, które obserwujesz.",
  "gloss.schoolTeams.title": "Drużyny szkolne",
  "gloss.schoolTeams.body":
    "Trenerzy szkół średnich dostają Pro za darmo, gdy potwierdzą adres e-mail swojej szkoły lub okręgu. Ich zawodnicy w wieku od 13 do 18 lat też dostają Pro za darmo, dopóki są w drużynie.\nTrener widzi twoje treningi, ale nie dane o ciele. Koledzy z drużyny widzą tylko twoje imię i ile treningów i serii zrobiłeś w tym tygodniu.",
  "gloss.strengthStandards.title": "Normy siłowe",
  "gloss.strengthStandards.body":
    "Typowe szacowane 1RM trenujących osób, przeliczone na masę ciała i skorygowane o wiek i płeć, jeśli je podałeś, na podstawie opublikowanych norm siłowych i współczynników masters.\nProcent to przybliżony odsetek trenujących, których twój szacunek przewyższa, a nie ranking prawdziwych użytkowników Liftsmith. Wzrost i BMI nie są brane pod uwagę.",
};
