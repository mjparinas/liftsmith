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
};
