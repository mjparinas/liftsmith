import type { FeaturesText } from "./types";

// The features page in Spanish (tú). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.

export const es: FeaturesText = {
  chrome: {
    title: "Funciones de {name} y con qué funciona",
    description:
      "Todas las funciones de {name}, cuáles son gratis, las más nuevas y una tabla de los relojes, apps de salud, básculas y servicios con los que funciona en Android, iPhone y la web.",
    crumb: "Funciones",
    h1: "Todas las funciones de {name}",
    intro:
      "Las {count} funciones, cuáles son gratis, qué funciona con qué y qué hay de nuevo. Casi todo es gratis; mira los {pricing} para ver lo que añade Pro.",
    pricing: "precios",
    onThisPage: "En esta página",
    newestNav: "Lo más nuevo",
    worksWithNav: "Funciona con",
    newestH: "Funciones más nuevas",
    newestIntro: "Añadidas hace poco, por categoría. Cada cambio, arreglos incluidos, está en {whatsNew}.",
    whatsNew: "Novedades",
    midTitle: "Compruébalo tú mismo",
    midBody: "Gratis y sin cuenta. Tu primer entrenamiento queda planificado en menos de un minuto.",
    midButton: "Empezar gratis",
    worksH: "Con qué funciona {name}",
    worksIntro:
      "Apps, relojes y dispositivos, y dónde funciona cada uno. «Vía Salud» significa que llega a {name} a través de Health Connect en Android o Apple Salud en iPhone. «Chrome» significa la app web en Chrome, que tiene Web Bluetooth.",
    tableLabel: "Tabla de compatibilidad",
    cols: { connection: "Conexión", does: "Qué hace", android: "Android", iphone: "iPhone", web: "Web", plan: "Plan" },
    footnote:
      "«Muy pronto» significa que está hecho y espera su ficha en la tienda. «En estudio» significa que trabajamos en ello pero aún no podemos prometerlo, porque depende de la aprobación de la otra empresa. Los servicios de fitness se conectan con una cuenta gratuita de {name}. Labs son experimentos de Pro que activas en Ajustes › Labs. Los nombres de productos son marcas de sus dueños.",
    endTitle: "Empieza gratis, sin cuenta",
    endBody: "Tu primer entrenamiento queda planificado en menos de un minuto. Sin anuncios, nunca.",
  },
  tiers: { free: "Gratis", pro: "Pro", both: "Gratis + Pro", lab: "Labs (Pro)" },
  where: { all: "Android, iPhone y web", phones: "Apps de Android y iPhone" },
  support: { yes: "Sí", no: "No", soon: "Muy pronto", investigating: "En estudio", chrome: "Chrome", health: "Vía Salud" },
  groups: {
    plan: {
      title: "Un plan que se adapta",
      intro: "El entrenamiento de hoy se arma con tu gimnasio, tu recuperación y tu bloque de entrenamiento, y cada número dice por qué.",
    },
    workout: {
      title: "El entrenamiento",
      intro: "Un toque registra una serie tal como estaba planificada. Todo lo demás espera a que descanses.",
    },
    progress: { title: "Progreso y coaching", intro: "Primero, qué hacer después. Los números aparecen cuando puedes actuar sobre ellos." },
    body: {
      title: "Cuerpo y salud",
      intro: "El peso, la grasa corporal y los datos de salud llegan solos donde pueden, y se convierten en consejos.",
    },
    programs: {
      title: "Programas, rutinas y ejercicios",
      intro: "Sigue un programa clásico, crea tus propias rutinas o deja que la app planifique. Todo desde una misma biblioteca.",
    },
    gyms: { title: "Gimnasios y equipo", intro: "Cada plan parte del equipo que de verdad tienes." },
    friends: { title: "Amigos y compartir", intro: "Entrena con gente, no para un público. Amigos es gratis." },
    coaches: { title: "Para entrenadores", intro: "Ser cliente de alguien es gratis para todos." },
    fun: { title: "Recompensas", intro: "Un poco de diversión que nunca estorba una serie." },
    phone: { title: "En tu teléfono y tu muñeca", intro: "Liftsmith aprovecha lo mejor de cada teléfono." },
    data: { title: "Tus datos", intro: "Funciona sin conexión, no necesita cuenta y tus datos son tuyos." },
    access: {
      title: "Aspecto, sensación e idiomas",
      intro: "Cómodo para cualquiera, con una mano en el gimnasio o en una pantalla grande en casa.",
    },
    labs: { title: "Labs", intro: "Experimentos que quien tiene Pro puede activar en Ajustes › Labs. Pueden cambiar o desaparecer." },
  },
  features: {
    "gym-widgets": {
      name: "Widgets para la web de tu gimnasio",
      body: "Los gimnasios oficiales ponen su horario de clases, su equipamiento o una insignia de Encuéntranos en Liftsmith en su propia web con una línea de código. Se actualizan solos, en el idioma y el aspecto que elijas, y enlazan a la página del gimnasio.",
      note: "Sin scripts, cookies ni seguimiento en la web del gimnasio.",
    },
    "gym-insights": {
      name: "Datos para dueños de gimnasios",
      body: "Los dueños y el personal de gimnasios oficiales ven cuántos atletas entrenaron allí en las últimas cuatro semanas, las horas llenas y tranquilas, el equipo usado y los problemas abiertos, con un siguiente paso.",
      note: "Solo totales y porcentajes, de atletas que cuentan sus visitas, y solo cuando ya entrenaron allí cinco.",
    },
    adaptive: {
      name: "Entrenamientos adaptativos diarios",
      body: "Elige ejercicios que tu gimnasio permite y para los que tus músculos están listos, y fija cada peso y repetición a partir de tus últimos entrenamientos.",
      proPart: "Sin Pro tienes un entrenamiento adaptativo a la semana junto a tu programa gratuito; Pro planifica todos los días.",
    },
    "auto-supersets": {
      name: "Superseries automáticas",
      body: "Activa las superseries y el plan adaptativo junta ejercicios que no comparten músculos, como un press y un remo, con menos descanso tras cada ronda, para que quepa más en tu tiempo. Las sentadillas y los pesos muertos pesados van solos, y también puedes quitar las series de calentamiento.",
    },
    "pick-weights": {
      name: "Aprende qué ejercicios te gustan",
      body: "Los ejercicios populares se eligen más a menudo. Marca uno con estrella y saldrá mucho más; cámbialo por otro y saldrá menos, durante unos meses.",
    },
    splits: {
      name: "Rutinas divididas adaptativas",
      body: "Empuje, tirón y pierna o torso y pierna, ajustadas igualmente a tu recuperación cada día.",
    },
    readiness: {
      name: "La decisión de hoy",
      body: "A tope, según lo previsto o suave, según tu recuperación, las repeticiones fallidas y lo duras que se sintieron tus últimas series. Siempre puedes cambiarla.",
    },
    "health-readiness": {
      name: "El sueño y la VFC mueven la decisión",
      body: "El sueño, la variabilidad de la frecuencia cardiaca, el pulso en reposo y la frecuencia respiratoria de la app de salud de tu teléfono suben o bajan la decisión de hoy.",
    },
    blocks: {
      name: "Bloques de entrenamiento y descargas",
      body: "Bloques de cuatro semanas con un objetivo de repeticiones en reserva que terminan en una semana más ligera, para que sigas progresando sin quemarte.",
    },
    why: {
      name: "Cada recomendación dice por qué",
      body: "Cada ejercicio, número de series, objetivo de repeticiones y peso lleva un motivo breve, a la vista, nunca detrás de un toque.",
    },
    "short-on-time": {
      name: "Con poco tiempo",
      body: "Dile al entrenamiento que tienes menos tiempo y recorta lo que menos importa.",
      proPart: "Adaptarte cuando otra persona usa el banco o el rack es de Pro.",
    },
    injury: {
      name: "Modo lesión",
      body: "Dile qué te duele y deja fuera lo que lo agravaría, te avisa de los ejercicios de riesgo y sigue un nivel de dolor de 0 a 10 a lo largo del tiempo.",
    },
    "rehab-done": {
      name: "Rehabilitación de tu fisioterapeuta, hecha",
      body: "Un programa de tu fisioterapeuta espera en Hoy para guardarlo con un toque y registra la lesión para la que es. Sigue las veces por semana que pidió, aparece en los días de descanso y pregunta por el dolor solo de esa lesión.",
      note: "Los recordatorios de rehabilitación y el aviso de programa nuevo son para Android y iPhone.",
    },
    "rehab-self": {
      name: "Rehabilitación suave sin fisioterapeuta",
      body: "¿Has registrado una lesión y no tienes fisioterapeuta? Lesiones y una nota del entrenador ofrecen una rutina corta con el peso del cuerpo para hacer en casa. Es un punto de partida, no un tratamiento.",
    },
    "rehab-end": {
      name: "Cuando tu fisioterapeuta retira un programa",
      body: "Si tu fisioterapeuta retira un programa, Hoy te pregunta si lo paras o lo sigues por tu cuenta. Pararlo quita la rutina y sus recordatorios.",
    },
    cycle: { name: "Preparación según el ciclo", body: "Si quieres, registra tu ciclo y la decisión de hoy lo tiene en cuenta." },
    pregnancy: {
      name: "Modo embarazo y posparto",
      body: "Dile que estás embarazada o que has tenido a tu bebé y cada entrenamiento se adapta a la semana: cargas más ligeras, ninguna serie al límite, nada boca arriba al final del embarazo y una vuelta gradual de unas 16 semanas después del parto.",
    },
    "goal-planner": {
      name: "Planificador de metas",
      body: "Elige un ejercicio y un objetivo, y calcula una fecha realista y el camino para llegar.",
    },
    logger: {
      name: "Registrar una serie con un toque",
      body: "La siguiente serie siempre está rellenada. Los botones que se repiten al mantenerlos cambian peso y repeticiones; escribir es solo una alternativa.",
    },
    "rest-timer": {
      name: "Temporizador de descanso en la pantalla de bloqueo",
      body: "Arranca solo tras cada serie y cuenta atrás en la pantalla de bloqueo con la siguiente serie, los discos, el pulso y botones Registrar serie y +30 s que funcionan con la app cerrada. Una vibración suave 10 segundos antes del final te da tiempo para prepararte, en el móvil y en el reloj.",
      note: "Android: una notificación fija, una Live Update en Android 16 y la Now Bar de Samsung. iPhone: una Actividad en Vivo en la pantalla de bloqueo y en la Dynamic Island. Web: una notificación mientras la página está abierta.",
    },
    plates: {
      name: "Cálculo de discos",
      body: "Muestra qué discos van en cada lado, calculado con los discos que tiene tu gimnasio, cada tamaño en su color.",
    },
    warmups: {
      name: "Series de calentamiento",
      body: "Series de aproximación calculadas para cada ejercicio pesado, para que llegues listo a tu peso de trabajo.",
    },
    demos: {
      name: "Demostraciones de ejercicios en 3D",
      body: "Cada ejercicio tiene una figura 3D que muestra el movimiento con su propio equipo, con pasos de preparación y claves.",
    },
    "form-mistakes": {
      name: "Errores comunes y cómo corregirlos",
      body: "Cada ejercicio y estiramiento muestra sus dos o tres errores de técnica más comunes junto a la figura 3D, cada uno con su corrección y por qué importa, y el temporizador de descanso te enseña uno para la próxima serie. Funciona sin conexión.",
    },
    "set-types": { name: "Series descendentes y rest-pause", body: "Añade una serie descendente o una rest-pause entre series." },
    "timed-sets": {
      name: "Temporizador para isométricos, cargadas y cardio",
      body: "Los ejercicios por tiempo, como planchas, cargadas, colgarse y cardio, tienen un temporizador de serie, también en la pantalla de bloqueo y en los relojes.",
    },
    "each-side": {
      name: "Por lado y por mano",
      body: "Los ejercicios que se hacen de un lado cada vez lo indican, y el peso de las mancuernas se muestra por mano.",
    },
    swaps: {
      name: "Cambiar ejercicios",
      body: "Cambia cualquier ejercicio por otro que trabaje los mismos músculos con lo que tiene tu gimnasio.",
    },
    "heart-rate": {
      name: "Pulso en directo",
      body: "Conecta una banda de pulso Bluetooth o tu reloj y mira tu pulso en cada serie y descanso.",
      note: "Web: solo Chrome.",
    },
    breathing: {
      name: "Respiración cuadrada al descansar",
      body: "Una guía de respiración en la pantalla de descanso, con ajustes predefinidos o tu propio patrón.",
    },
    "voice-coach": {
      name: "Entrenador por voz",
      body: "Te habla durante el entrenamiento, por ejemplo cuando termina el descanso, para que no tengas que mirar el teléfono.",
      note: "Android avisa del fin del descanso con la pantalla bloqueada; iPhone y la web mientras la app está abierta.",
    },
    "voice-amy": {
      name: "Voz Amy",
      body: "Una voz inglesa clara incluida en la app para el entrenador por voz. Elige Amy o el texto a voz del teléfono en Ajustes › Entrenamiento; Amy vuelve a la voz del teléfono si no puede cargar.",
    },
    stretching: {
      name: "Estiramientos",
      body: "61 estiramientos con demostraciones en 3D: un calentamiento opcional antes, una vuelta a la calma después o una rutina de estiramientos cualquier día. Unos segundos para colocarte antes de cada estiramiento y cada lado, y la pantalla sigue encendida.",
    },
    "workout-parts": {
      name: "Entrenamientos por partes",
      body: "Un entrenamiento puede hacer un calentamiento, las pesas y una vuelta a la calma en orden, con Saltar entre ellas. La pantalla de bloqueo y tu reloj muestran en qué parte estás, el historial muestra cada parte y los días de estiramientos de 10 minutos o más mantienen tu racha. Las rutinas pueden llevar su propio calentamiento y vuelta a la calma, también en enlaces compartidos y de tu entrenador. Las notas del coach leen cada parte: el dolor tras la rehabilitación que baja o sube, y un pulso que sigue alto en la vuelta a la calma. La rehabilitación de tu fisioterapeuta puede ir junto a las pesas en el mismo entrenamiento los días que toca, y el cardio puede ir después de las pesas, con la máquina y los minutos elegidos con un toque.",
    },
    "workout-length": {
      name: "La duración cubre todas las partes",
      body: "El control de duración en Hoy fija el entrenamiento entero. Un calentamiento, cardio, rehabilitación o vuelta a la calma toma sus minutos de las pesas, y una barra fina bajo el control muestra adónde va el tiempo. Las pesas mantienen al menos 15 minutos: primero se acorta el cardio, con una línea que dice por qué. En un día de cardio y estiramientos, apaga las pesas y el cardio se queda con su tiempo.",
    },
    notes: {
      name: "Notas del entrenador",
      body: "Señala fatiga acumulada, un ejercicio estancado, un músculo con pocas series, una meta semanal en riesgo o grasa corporal en aumento, cada una con algo que hacer, a menudo con un solo toque.",
    },
    plateau: {
      name: "Detective de estancamientos",
      body: "Cuando un ejercicio se estanca, te da la causa probable y un arreglo de tres semanas en un toque, y luego te dice si funcionó.",
    },
    "recovery-map": {
      name: "Mapa de recuperación",
      body: "Tus músculos brillan en una figura 3D según lo recuperados que están. Toca uno para ver qué significa para hoy.",
    },
    "advanced-stats": {
      name: "Estadísticas avanzadas",
      body: "Series semanales por músculo frente al objetivo, tendencias de la repetición máxima y hacia dónde va cada ejercicio.",
    },
    bests: {
      name: "Récords personales e historial",
      body: "Cada récord, repetición máxima estimada, puntuación de fuerza y entrenamiento pasado, sin límite de historial.",
    },
    "calendar-history": {
      name: "Calendario de entrenamientos",
      body: "Un calendario mensual de entrenamientos pasados en Progreso, con el nombre de cada día.",
    },
    "edit-history": {
      name: "Editar entrenamientos pasados y repetirlos",
      body: "Corrige una serie, añade una nota, ponle nombre a un entrenamiento o repítelo, y cada ejercicio tiene su página con su historial. Elimina uno con opción de deshacer y todas las estadísticas se recalculan.",
    },
    "exercise-stats": {
      name: "Estadísticas de cada ejercicio",
      body: "Toca cualquier ejercicio de la biblioteca para ver tus series, el peso total levantado, tu máximo estimado y cómo te comparas con personas entrenadas de tu peso, edad y sexo según estándares de fuerza publicados.",
      proPart:
        "Las estadísticas avanzadas de Pro añaden los gráficos, de una semana a todo el historial: toca cualquier sesión para ver su número, con los récords marcados.",
    },
    "log-past": {
      name: "Registrar un entrenamiento pasado",
      body: "¿Olvidaste el teléfono? Registra el entrenamiento después y cuenta como cualquier otro.",
    },
    recap: { name: "Resumen mensual", body: "Un breve repaso de tu mes, listo para compartir." },
    anniversary: {
      name: "Aniversario de entrenamiento",
      body: "Cada año, el día de tu primer entrenamiento, Hoy pone el día uno junto a hoy: entrenamientos, series, peso total y el ejercicio que más ha crecido, con una tarjeta para compartir. Se queda una semana.",
    },
    body: {
      name: "Peso, grasa corporal y fotos",
      body: "Registra peso y grasa corporal, o deja que lleguen de tu báscula a través de la app de salud del teléfono, y guarda fotos de progreso en tu teléfono.",
    },
    "photo-compare": {
      name: "Fotos de progreso que se alinean",
      body: "La cámara muestra tu última foto como un contorno tenue para alinearte, con temporizador para alejarte. Compara dos fechas cualquiera con un deslizador o lado a lado, cada una con lo que pesabas ese día. Las fotos se quedan en tu teléfono; una copia de seguridad puede llevarlas a uno nuevo.",
    },
    measurements: {
      name: "Medidas con cinta",
      body: "Nueve zonas en centímetros o pulgadas. Una cintura que crece o se reduce se convierte en una nota del entrenador cuando no hay datos de grasa corporal.",
    },
    "body-figure": {
      name: "Una figura 3D con tu forma",
      body: "Actívala y las figuras de Salud, del mapa de recuperación y de las demostraciones toman tu complexión a partir de tu altura, peso, grasa corporal y medidas.",
    },
    "health-twin": {
      name: "Gemelo de salud y edad física",
      body: "Sueño, VFC, pulso en reposo, pasos, frecuencia respiratoria y VO₂ máx en un solo lugar, con tu tendencia y una edad física a partir de tu VO₂ máx.",
      note: "Los datos de salud vienen de Health Connect en Android y de Apple Salud en iPhone. La app web muestra peso, grasa corporal, IMC y calorías.",
    },
    "fitness-tests": {
      name: "Pruebas de forma física",
      body: "Colgarse de la barra, equilibrio a una pierna y levantarse de la silla en 30 segundos, cada una con temporizador, un rango típico y qué ayuda.",
    },
    food: {
      name: "Notas del entrenador desde tu app de comida",
      body: "Las calorías, proteínas, carbohidratos y grasas que registras en una app de comida llegan a Liftsmith a través de la app de salud del teléfono y se convierten en notas como «te falta proteína tres días seguidos», según un único conjunto de objetivos para tu meta. Registrar solo la proteína también cuenta. La app no registra comida.",
    },
    "measured-maintenance": {
      name: "Mantenimiento medido con lo que comes",
      body: "Dos semanas de comida y pesajes miden tus calorías diarias reales, que luego usan Macros, el GET y tus notas de comida. Una tarjeta de Comida en Cuerpo muestra tu semana frente a tus objetivos.",
      note: "Los menores de 18 solo reciben consejos de proteína: sin objetivo de perder grasa ni notas de calorías.",
    },
    "your-stats": {
      name: "Tus datos personales",
      body: "Un solo lugar para sexo, edad y altura que leen todas las herramientas, rellenado desde Apple Salud en iPhone.",
    },
    "fixed-programs": {
      name: "Programas clásicos",
      body: "5×5 clásico, 3×5 para principiantes, 5×5 con brazos, 5×5 progresivo, progresión por niveles, ondas de máximo de entrenamiento, habilidades con peso corporal y cuerpo completo con mancuernas. El programa gratuito se adapta a tu gimnasio.",
    },
    routines: {
      name: "Tus propias rutinas",
      body: "Crea rutinas desde el buscador de ejercicios, sin límite de cantidad, y compártelas con un enlace.",
    },
    "routine-library": {
      name: "Biblioteca de rutinas",
      body: "Busca rutinas que otros publicaron por objetivo, palabras y lo que tiene tu gimnasio, guarda una con un toque y puntúala con estrellas. Publica la tuya desde su editor, con o sin tu nombre, y tendrá su propia página en la web. Solo salen los ejercicios y las series, nunca tus pesos ni tus notas.",
      note: "Para publicar necesitas una cuenta y tener 18 años. Cualquiera puede explorar.",
    },
    library: {
      name: "1000 ejercicios",
      body: "Fuerza, peso corporal, máquinas, bandas, pesas rusas y cardio, con búsqueda, filtros por músculo y un filtro de este gimnasio. El cardio registra tiempo y distancia.",
    },
    remix: {
      name: "Enlaces para compartir entrenamientos",
      body: "Envía un entrenamiento a un amigo como un enlace que puede hacer él mismo.",
    },
    gyms: {
      name: "Tus gimnasios y su equipo",
      body: "Configura cada gimnasio una vez: barras, discos, mancuernas y pesas rusas tal como son, y las máquinas con sus ajustes.",
    },
    "gym-location": { name: "Gimnasio por ubicación", body: "Elige el gimnasio correcto cuando llegas." },
    "gym-share": {
      name: "Compartir el equipo de un gimnasio",
      body: "Envía el equipo de tu gimnasio como un enlace, para que tu compañero de entrenamiento empiece con lo mismo.",
    },
    "gym-finder": {
      name: "Buscador y páginas de gimnasios",
      body: "Encuentra gimnasios cerca de ti en un mapa grande con cada gimnasio en una tarjeta translúcida encima, los oficiales primero, cada uno con su página: equipo, horario, mapa y miembros. Los dueños pueden reclamar su gimnasio y añadir su logo y fotos. ¿Falta un gimnasio? Añádelo. Los dueños ven cuántos atletas lo añadieron o escanearon el cartel, y qué hacer después. Los gimnasios oficiales pueden tener un club con clasificación semanal. ¿Algo mal en una página? Avísanos y nuestro equipo lo corrige.",
    },
    "gym-amenities": {
      name: "Servicios y precios en las páginas de gimnasios",
      body: "Los dueños indican lo que hay además del equipo (duchas, aparcamiento, acceso 24/7, zona para mujeres y más) y cuánto cuesta un pase de día, de semana o la cuota.",
    },
    "gym-news": {
      name: "Anuncios de tu gimnasio",
      body: "Los gimnasios oficiales publican horarios de festivos, equipo nuevo o cambios de clase en su página, y los miembros de su club reciben un aviso.",
    },
    "gym-problems": {
      name: "Avisa de equipo roto",
      body: "Dile a tu gimnasio que una máquina está rota o falta. Todos los que entrenan allí reciben un plan que se adapta, y el dueño lo ve con un botón de Arreglado.",
    },
    "gym-trainers": {
      name: "Entrenadores en las páginas de gimnasios",
      body: "Los entrenadores aparecen en los gimnasios donde entrenan a sus clientes, con una línea sobre ellos y un botón para entrenar con ellos. En un gimnasio oficial, el dueño los aprueba antes.",
    },
    "gym-staff": {
      name: "Cuentas de personal para gimnasios",
      body: "El propietario de un gimnasio oficial invita a gerentes y personal de recepción con un enlace de un solo uso. Cada uno usa su propia cuenta para mantener al día la página, los avisos y los problemas reportados.",
    },
    "gym-classes": {
      name: "Horarios de clases en las páginas de gimnasios",
      body: "Los gimnasios oficiales publican las clases que dan cada semana, con instructor y sala, y marcan los días que no hay clase. Quienes entrenan allí ven la semana en la página del gimnasio en la app y la web, y añaden la próxima clase a su calendario con un toque.",
    },
    "gym-chains": {
      name: "Todas las sedes de una cadena",
      body: "Los gimnasios de una cadena muestran su logo y enlazan a una página con todas sus sedes, en la app las más cercanas primero. En la web, cada cadena tiene su propia página.",
      note: "Reconocemos las cadenas por la marca del mapa o por un nombre que comparten gimnasios de varias ciudades. Los gimnasios reclamados conservan su propio logo.",
    },
    "gym-open-now": {
      name: "Abierto ahora en el buscador de gimnasios",
      body: "Los gimnasios cercanos dicen si están abiertos ahora y cuándo cierran o vuelven a abrir, y un toque en Abierto ahora muestra solo los que puedes visitar ya.",
      note: "Se calcula con el horario de cada gimnasio y tu propia hora, para gimnasios cerca de ti.",
    },
    "gym-starter": {
      name: "Programas de inicio de los gimnasios",
      body: "Los gimnasios oficiales sugieren un programa a quienes empiezan en su página de la app y la web, y se guarda con un toque. Liftsmith pone los pesos de cada persona.",
    },
    "buy-next": {
      name: "Qué comprar después",
      body: "Para gimnasios en casa: la pieza de equipo que abriría más ejercicios.",
    },
    feed: {
      name: "Muro de amigos",
      body: "Sigue a gente y mira sus entrenamientos, con me gusta, comentarios, respuestas y @menciones, y elige quién ve cada uno de los tuyos.",
    },
    cheers: {
      name: "Entrenando ahora y ánimos",
      body: "Mira quién está entrenando ahora mismo y envía un ánimo que sube flotando por su pantalla de entrenamiento.",
    },
    "invite-friends": {
      name: "Invita a amigos y gana Pro",
      body: "Comparte tu enlace de invitación desde Amigos, al terminar un entrenamiento o en cualquier tarjeta. Un amigo que se une con él te sigue también, y cuando completa tres entrenamientos los dos recibís un mes de Pro. Tus invitaciones muestra cuánto le falta a cada uno.",
      note: "Hasta 12 meses al año. Los menores de 18 años pueden invitar a amigos, pero no se les ofrece la recompensa.",
    },
    "check-in": {
      name: "Avisa desde el gimnasio",
      body: "Un toque en Hoy avisa a los amigos que elijas de que estás en el gimnasio. Reciben una notificación y un aviso en la app hasta que lo cierren.",
      note: "Para mayores de 18 años. Las notificaciones son para Android y iPhone; la app web muestra el aviso cuando está abierta.",
    },
    challenges: {
      name: "Retos, clubes y clasificaciones",
      body: "Reta a un amigo, únete a un club o al grupo de tu gimnasio con una tabla semanal y acepta el reto mensual con todos.",
    },
    "club-chat": {
      name: "Chat del club y sesiones en grupo",
      body: "Habla con tu club entre entrenamientos, propón una hora y un sitio para entrenar juntos y mira quién se apunta. Quien se apunte recibe un recordatorio una hora antes, y al publicar tu entrenamiento después apareces como que entrenaste, con los amigos que entrenaron contigo etiquetados.",
      note: "Para mayores de 18 años. Las notificaciones son para Android y iPhone; la app web muestra los mensajes nuevos mientras el chat está abierto.",
    },
    "campus-clubs": {
      name: "Pro para quien lleva un club activo",
      body: "Dirige un club en el que 5 o más miembros, tú incluido, terminen cada uno un entrenamiento en los últimos 14 días, y Pro es gratis para ti mientras siga siendo así.",
      note: "Unirte al club de otra persona no cuenta, y dos clubes no se suman.",
    },
    profiles: { name: "Perfiles públicos", body: "Una página pública opcional con tus mejores marcas y entrenamientos." },
    "tagline-gym": {
      name: "Lema y gimnasio habitual",
      body: "Añade una frase corta bajo tu nombre y elige tu gimnasio habitual en el buscador de gimnasios, para que tus amigos sepan dónde entrenas. Lo ve quien ve tus entrenamientos, y sale en tu página pública.",
      note: "El gimnasio habitual es para mayores de 18 años.",
    },
    safety: {
      name: "Bloquear, silenciar y denunciar",
      body: "Bloquea o silencia a quien quieras y denuncia una publicación, un comentario o un perfil con un toque en el motivo. Nuestro equipo revisa cada denuncia y puede avisar, suspender o expulsar.",
    },
    share: {
      name: "Tarjetas y enlaces para compartir",
      body: "Comparte un entrenamiento, un nuevo récord o un hito como imagen, o como un enlace público con vista previa. Un nuevo récord brilla en dorado y se puede compartir desde el descanso al momento.",
    },
    "screenshot-share": {
      name: "Tarjetas al hacer una captura de pantalla",
      body: "Haz una captura y aparece una hoja con tarjetas de tu entrenamiento: el último mes, tres meses, seis meses, el año o desde siempre, como totales, en qué se fueron tus series o tus mejores levantamientos. Desliza entre ellas, oculta los pesos con el ojo y compártelas con tu enlace de invitación impreso en la tarjeta. Las mismas tarjetas están en Compartir mi entrenamiento, en Progreso. Cada enlace que compartes lleva ahora tu invitación, en un enlace que lo dice.",
      note: "Las capturas la abren en Android 14 o posterior y en iPhone, y se puede desactivar. En otros sitios, ábrela desde Progreso. Los menores de 18 años comparten sin enlace de invitación.",
    },
    coaching: {
      name: "Entrena a clientes",
      body: "Vincula clientes, mira sus resultados y asígnales rutinas, en el teléfono o en una pantalla grande.",
    },
    "coach-chat": {
      name: "Chat, avisos y datos corporales",
      body: "Escribe a cada cliente, recibe una notificación cuando entrena o lleva una semana sin entrenar, y ve sus pesajes, medidas y una figura 3D con su forma cuando decide compartirlos.",
      note: "Las notificaciones son para Android y iPhone. La app web muestra los mensajes nuevos cuando está abierta.",
    },
    physio: {
      name: "Para fisioterapeutas y rehabilitación",
      body: "Asigna programas de rehabilitación suaves con veces por semana, mira con qué frecuencia los cumplen tus clientes y ve el dolor y las lesiones que deciden compartir, ejercicio a ejercicio, con un aviso cuando el dolor es alto.",
      note: "Liftsmith muestra lo que registran tus clientes. No diagnostica ni trata nada.",
    },
    "rehab-phases": {
      name: "Protocolos de rehabilitación por fases, guiados por el dolor",
      body: "Cada programa de rehabilitación tiene tres fases, de calmar la zona al uso normal. Una regla del dolor sencilla lee las valoraciones tras cada ejercicio y al día siguiente, dice cuándo un cliente está listo para la siguiente fase o debe volver una, y el fisioterapeuta la envía con un toque.",
      note: "Los clientes lo siguen gratis. Liftsmith muestra lo que registran tus clientes. No diagnostica ni trata nada.",
    },
    "rehab-shape": {
      name: "Da forma a una rutina de rehabilitación",
      body: "Los fisioterapeutas fijan las repeticiones o los segundos de cada ejercicio de una rutina de rehabilitación y añaden una indicación breve, en el editor de rutinas. Los clientes la siguen tal como está escrita.",
      note: "Los clientes lo siguen gratis. Liftsmith muestra lo que registran tus clientes. No diagnostica ni trata nada.",
    },
    "coach-nutrition": {
      name: "Objetivos de nutrición para clientes",
      body: "Fija las calorías, proteína, carbohidratos y grasa diarios de cada cliente, con otras calorías para los días de descanso si quieres, rellenados con sus propios datos en un toque. Sus notas del entrenador comparan su semana de comida con ellos, y ves cómo come cuando lo comparte.",
    },
    "school-teams": {
      name: "Gratis para equipos de secundaria",
      body: "Los entrenadores de secundaria que confirman un correo escolar tienen Pro gratis, igual que los atletas de 13 a 18 años de sus equipos, con una tabla semanal del equipo. La grasa corporal y los perfiles públicos siguen desactivados para menores de 18.",
    },
    "my-team": {
      name: "Mi equipo para atletas escolares",
      body: "Un atleta de un equipo escolar abre Coaching en la casa de su equipo: el equipo y su entrenador, los programas asignados con Seguir, un chat del equipo con el entrenador dentro, un chat con el entrenador y la semana del equipo. El entrenador puede añadir a un equipo a los atletas que se unieron con su invitación; cada uno indica su edad y acepta antes.",
    },
    "team-session": {
      name: "Sesiones de equipo en una tableta",
      body: "Un entrenador de secundaria dirige un entrenamiento para todo el equipo desde una tableta: cada atleta toca su nombre y anota sus series, con el peso donde lo dejó, y el tablero muestra quién no ha empezado. Al terminar, las series de cada atleta se guardan en su propia cuenta. Funciona sin cobertura.",
    },
    "coach-checkins": {
      name: "Formularios de revisión y cuestionarios",
      body: "Envía a tus clientes una revisión semanal, un cuestionario inicial o tu propio formulario, una vez o cada semana. Responden con unos toques, y una puntuación baja o una respuesta tardía aparece arriba en su informe.",
    },
    "coach-checkin-trends": {
      name: "Revisiones de progreso con peso, fotos y tendencias",
      body: "Añade preguntas de peso corporal y de foto a cualquier formulario y envíalo cada semana, cada 2 semanas o cada 4. El peso se rellena con el último pesaje del cliente, las fotos solo las ves tú y la tendencia de cada respuesta aparece en su informe. A los menores de 18 nunca se les piden fotos.",
    },
    "coach-form-videos": {
      name: "Vídeos de técnica con notas en el vídeo",
      body: "Tus clientes graban una serie en la app y te la envían. Mírala a cámara lenta, fija notas en los momentos exactos y responden en las mismas notas. Solo lo ven ustedes dos; los menores de 18 no pueden enviar vídeos.",
      note: "Enviar un vídeo es gratis para los clientes. Android, iPhone y web.",
    },
    "coach-roles": {
      name: "Para entrenadores personales y coaches",
      body: "Indica si eres entrenador personal, coach deportivo o fisioterapeuta. Tus clientes ven la palabra correcta y solo se muestran las herramientas de ese rol; los mensajes siguen para todos.",
    },
    "coach-booking": {
      name: "Reserva y agenda de sesiones",
      body: "Abre las horas que tienes libres, una vez o cada semana, y tus clientes las reservan en la app, o resérvalos tú. Tu agenda es un calendario mensual: toca un día para ver quién ha reservado y qué sigue libre. Ambos reciben una notificación, una sesión del día siguiente aparece en Hoy y pasa a su calendario con un toque.",
    },
    "coach-payments": {
      name: "Cobros a clientes con Stripe",
      body: "Conecta tu propia cuenta de Stripe y fija el precio de cada cliente, por sesión o mensual. Pagan en la página segura de Stripe, el dinero te llega directamente y un pago mensual fallido aparece arriba en su informe.",
    },
    "coach-sharing": {
      name: "Los clientes eligen lo que ve su entrenador",
      body: "El entrenamiento siempre se comparte. Frecuencia cardiaca, notas de entrenamiento, preparación y recuperación, datos corporales, dolor y lesiones, y ciclo son interruptores que el cliente activa para cada entrenador, al aceptar o cuando quiera. Las fotos y los gimnasios nunca salen.",
      proPart: "Ser cliente es gratis; entrenar a clientes es Pro.",
    },
    "coach-chat-dock": {
      name: "Panel de chat, estados y stickers",
      body: "En el ordenador, el chat con tu entrenador vive en un panel abajo a la derecha, como un mensajero: todas las personas con las que puedes hablar, hasta dos ventanas que se pliegan, y un sonido y un contador en la pestaña cuando llega un mensaje. Los dos lados ponen un estado (en línea, con un cliente, entrenando, ausente, no molestar, de vacaciones o aparecer desconectado), ven cuándo el otro escribe y cuándo ha visto tu mensaje, y envían emojis y stickers de gimnasio, también en el teléfono.",
      proPart: "Ser cliente es gratis; entrenar a clientes es Pro.",
    },
    "coach-programs": {
      name: "Programas de entrenadores",
      body: "Los entrenadores y entrenadores personales convierten sus rutinas en un programa, con nivel, objetivo y cuántas semanas seguirlo, gratis o con precio, y comparten su enlace. Guardas sus días en tus rutinas con un toque y tu propia progresión elige los pesos. Los programas de pago se pagan al entrenador a través de su propia cuenta de Stripe. Una vista de semana pone cada rutina en sus días con descansos, una vista de mes muestra cómo transcurre y Organizar solo reparte las rutinas por ti.",
      note: "Los programas de pago se compran en la web; las apps de Android e iPhone muestran los programas gratis y los que ya tienes.",
      proPart: "Conseguir programas es gratis; crearlos forma parte del coaching, que es Pro.",
    },
    "program-phases": {
      name: "Fases de programa y repeticiones del entrenador",
      body: "El programa de un entrenador puede ir por fases, cada una repitiendo su propia semana: Construcción, una semana de Descarga con menos series y pesos más ligeros, y un Pico con menos series para llegar fresco. Añade una descarga con un toque, ve cada fase en el mes y fija las repeticiones de un ejercicio (por ejemplo, de 8 a 12) o déjalas en Auto para que el historial de cada persona las elija. Quien lo sigue ve en qué fase y semana está bajo el plan de Hoy.",
      proPart: "Seguir un programa es gratis; crearlo forma parte del coaching, que es Pro.",
    },
    "client-program-copy": {
      name: "Ajusta un programa para un cliente",
      body: "Cambia un día del programa de un entrenador solo para un cliente, por ejemplo un ejercicio cambiado por una lesión. El día queda marcado como cambiado para esa persona y un toque recupera el día del programa. Lo que cambies en el programa sigue llegando a todos y a cada día que no cambiaste, y la app de cada persona lo recoge sola.",
      proPart: "Ser cliente es gratis; entrenar a clientes es Pro.",
    },
    "coach-program-today": {
      name: "De tu entrenador, en Hoy",
      body: "Quien sigue el programa de un entrenador lo ve en Hoy: de quién es, el día de hoy, la semana y la fase, y lo siguiente con su día. Un deportista de un equipo escolar también ve el mes en Mi equipo, con los días hechos, perdidos y por venir.",
    },
    "program-in-order": {
      name: "Programas que van en orden",
      body: "Un entrenador puede hacer que un programa vaya en orden: cada persona hace el día siguiente cuando entrena, en lugar de en días fijos de la semana, y la semana queda como ritmo sugerido. Hoy dice lo que viene.",
      proPart: "Ser cliente es gratis; entrenar a clientes es Pro.",
    },
    "coach-pages": {
      name: "Una página para cada lado",
      body: "Los clientes solo ven a su entrenador: le escriben con un toque, responden seguimientos, reservan sesiones y eligen qué compartir. Los entrenadores tienen una página para cada tarea, con clientes, mensajes, agenda, seguimientos y pagos en pestañas, en la web y en el teléfono.",
      proPart: "Ser cliente es gratis; entrenar a clientes es Pro.",
    },
    "coach-calendar": {
      name: "Calendario de entrenamientos",
      body: "Asigna entrenamientos o días de descanso en un calendario mensual. Los atletas ven lo programado en Hoy. Invita a entrenadores asistentes a editar un calendario y revisa la actividad del equipo.",
    },
    "coach-assign-program": {
      name: "Asignar un programa de temporada a clientes o a un equipo",
      body: "Los entrenadores asignan un programa de varios días (Upper/Lower, Push/Pull/Legs o el suyo) como plan fijo por días de la semana durante N semanas. Los atletas lo siguen una vez; Hoy muestra el entrenamiento de ese día. Un calendario del programa muestra quién ha hecho cada día y quién aún no — solo nombres de pila en equipos escolares, nunca pesos.",
      proPart: "Seguir un programa es gratis; asignarlo forma parte del coaching, que es Pro.",
    },
    "trainer-directory": {
      name: "En el directorio de entrenadores",
      body: "Apúntate como entrenador personal, coach o fisioterapeuta en tu gimnasio y aparecerás en la página del gimnasio y en el directorio de entrenadores de su ciudad en la web, con tu presentación y un enlace para que nuevos clientes entrenen contigo. Solo aparecen adultos.",
    },
    "coach-reviews": {
      name: "Valoraciones y reseñas de clientes reales",
      body: "Los clientes valoran a su entrenador, entrenador personal o fisioterapeuta con estrellas y una reseña breve tras cuatro semanas o dos sesiones juntos. La valoración aparece cuando tiene tres reseñas, junto a cuántos de sus clientes entrenaron en las últimas dos semanas, en su invitación y en el directorio de entrenadores. El entrenador responde una vez a cada una y cualquiera puede denunciar una reseña. Solo los adultos pueden dejar una.",
      proPart: "Dejar una reseña es gratis; entrenar a clientes es Pro.",
    },
    "program-pages": {
      name: "Programas de entrenadores en la web, con valoraciones",
      body: "Cada programa publicado por un entrenador tiene su propia página en la web, con su nivel, objetivo, semanas y días, y los ejercicios de los gratuitos, para que la gente lo encuentre en buscadores. Quien tiene un programa desde hace dos semanas lo valora con estrellas y una reseña corta; las valoraciones se muestran cuando un programa tiene tres, y su entrenador responde una vez a cada una.",
      proPart: "Valorar un programa es gratis; crearlos es parte del coaching, que es Pro.",
    },
    "coach-plans": {
      name: "Planes de entrenador que crecen con tu lista de clientes",
      body: "Pro cubre hasta 3 clientes. Coach da espacio para 25 y Coach Plus no tiene límite fijo, con todas las herramientas de entrenador en cada plan. Tus clientes siempre entrenan gratis, y con Coach y Coach Plus Liftsmith no se queda nada de lo que te pagan. Con Pro se queda un 2 %.",
    },
    awards: {
      name: "Logros, niveles y rachas",
      body: "Insignias por niveles, 50 niveles con recompensas, misiones semanales, protectores de racha y ligas honestas.",
    },
    seasons: {
      name: "Temporadas de entrenamiento",
      body: "Temporadas de diez semanas con un recorrido de 20 niveles que subes entrenando hacia tu propio objetivo semanal: dos días a la semana avanzan igual que cinco y los días de más no suman. Los niveles dan insignias, un avatar, un color de acento y un tema con su icono exclusivos de la temporada, tuyos para siempre. Retos de temporada, un botín raro por nuevas marcas, estrellas de prestigio, una semana de recuperación tras un fallo, un final con puntos dobles y un resumen para compartir. Hay seis temporadas planeadas una tras otra hasta finales de 2027 (Brasa, Tempestad, Floración, Solsticio, Arce y Obsidiana), cada una con su estilo y sus tres retos propios.",
      proPart: "Todos los niveles y sus premios son gratis; Pro añade un premio extra en tres niveles.",
      note: "Los iconos de temporada están en Android y iPhone; la web recibe el tema. Las temporadas se pueden desactivar en Ajustes.",
    },
    locker: {
      name: "Temas, colores e iconos de la app",
      body: "Gana temas y colores de acento y, en los teléfonos, un icono de la app con los colores de tu tema.",
      note: "Los iconos de la app ganados son solo para Android y iPhone.",
    },
    watch: {
      name: "Apps para reloj",
      body: "El entrenamiento en Wear OS y Apple Watch: la serie o la cuenta atrás del descanso, el pulso del reloj, Registrar serie y +30 s, y una vibración al terminar el descanso.",
    },
    "watch-today": {
      name: "El entrenamiento de hoy en tu reloj",
      body: "Un mosaico y una complicación de esfera en Wear OS, una complicación en Apple Watch y un vistazo en Garmin muestran la propuesta de hoy, cuánto dura y cómo estás de preparado, como «Empuje · 45 min · Preparación 82». En Wear OS, Empezar en el móvil lo abre en tu teléfono.",
      note: "El Apple Watch no puede abrir la app del iPhone, así que su complicación abre la app del reloj.",
    },
    "watch-adjust": {
      name: "Cambia y valora una serie en el reloj",
      body: "Gira la corona o el bisel, o pulsa − y +, para cambiar el peso y las repeticiones desde la muñeca, con los mismos saltos que en el teléfono: tus discos, mancuernas o la pila de la máquina. Tras la última serie de un ejercicio, el reloj pregunta qué tal fue y tu respuesta fija el siguiente peso.",
      note: "Wear OS, Apple Watch y Garmin (botones UP y DOWN).",
    },
    "machine-taken": {
      name: "Máquina ocupada",
      body: "¿Alguien en la máquina? Un toque en tu reloj o en Cambiar el plan pone el mejor ejercicio de tu gimnasio que no la necesita, con su peso y por qué.",
      note: "Wear OS, Apple Watch y Garmin (el botón UP), y Cambiar el plan en el teléfono y la web.",
    },
    "watch-alone": {
      name: "Entrenos en el reloj, sin el móvil",
      body: "El plan de hoy viaja en tu reloj. Toca Empezar en el reloj, registra cada serie con su peso y repeticiones en la muñeca, y el entreno se guarda, récords incluidos, cuando el móvil vuelve a estar cerca.",
      note: "Wear OS, Apple Watch y Garmin.",
    },
    widgets: {
      name: "Widgets en la pantalla de inicio",
      body: "Tres widgets: Hoy (la decisión del día, tu meta semanal, una nota del entrenador y Empezar o Registrar serie), Esta semana (días entrenados, tu racha y qué la mantiene) y Recuperación (qué músculos están listos para entrenar y cuándo lo estará el resto).",
      note: "La app web tiene accesos directos en su icono de inicio en su lugar.",
    },
    shortcuts: {
      name: "Ajustes rápidos, Siri y atajos",
      body: "Empieza un entrenamiento desde un botón de Ajustes rápidos en Android o desde el Centro de control y Siri en iPhone.",
    },
    calendar: {
      name: "Calendario",
      body: "Pone tus días de entrenamiento en tu calendario y puede acortar un entrenamiento para que quepa antes de tu siguiente reunión.",
      note: "La app web descarga un archivo .ics en su lugar.",
    },
    reminders: {
      name: "Recordatorios",
      body: "Recordatorios suaves los días de entrenamiento, como notificaciones en los teléfonos y por correo.",
    },
    emails: {
      name: "Correos que te mantienen en marcha",
      body: "Ocho consejos para empezar con pantallas reales, un resumen semanal y mensual, tus nuevos récords, qué amigos entrenaron un empujón para volver tras una pausa y, después, un consejo semanal sobre una función que quizá aún no hayas descubierto. Cada tipo tiene su propio interruptor.",
      note: "Activados con una cuenta; desactivados para menores de 18 salvo que los activen. Cada correo tiene baja con un clic.",
    },
    cloud: {
      name: "Conexiones con servicios de fitness",
      body: "Oura envía sueño, VFC, pulso en reposo y pasos, con una cuenta gratuita. Estamos estudiando Strava, Garmin Connect, WHOOP, Withings, Polar y Concept2.",
    },
    "health-save": {
      name: "Entrenamientos guardados en tu app de salud",
      body: "Cada entrenamiento terminado se guarda en Health Connect o Apple Salud como entrenamiento de fuerza, con calorías y pulso.",
    },
    "outside-workouts": {
      name: "Cuentan los entrenamientos de otras apps",
      body: "Si lo activas, las carreras, salidas en bici, deportes y clases que otras apps guardan en tu app de salud cuentan en tu mapa de recuperación y en el plan de mañana. Un partido largo ayer deja las piernas en recuperación y el plan lo tiene en cuenta.",
    },
    offline: {
      name: "Funciona sin conexión",
      body: "Todo funciona en tu dispositivo y se sincroniza en segundo plano, así que no pasa nada si no hay señal en el gimnasio del sótano.",
    },
    sync: {
      name: "Cuentas y sincronización",
      body: "Entrar si quieres con Google, Apple o un código por correo mantiene al día tu teléfono, tu tableta y la app web.",
    },
    backup: {
      name: "Copia de seguridad y exportación",
      body: "Guarda una copia de seguridad o exporta tus entrenamientos como hoja de cálculo cuando quieras.",
    },
    import: {
      name: "Importar desde otra app",
      body: "Trae tu historial desde Strong, Hevy, Fitbod, StrongLifts, JEFIT o FitNotes con su archivo de exportación, cardio incluido.",
    },
    importExtras: {
      name: "Rutinas y datos corporales de otra app",
      body: "Una importación convierte en rutinas los entrenamientos que repetiste con el mismo nombre y trae peso, grasa corporal y medidas desde Hevy, FitNotes o una app de báscula.",
    },
    "strength-standards": {
      name: "Estándares de fuerza de levantadores reales",
      body: "La web muestra cuánto levantan de verdad en sentadilla, press de banca, peso muerto y press militar, por sexo y peso corporal, calculado cada día con quienes cuentan. Solo se muestran grupos de 30 o más, en percentiles, nunca los números de nadie. Un interruptor en Ajustes › Tus datos y privacidad decide si cuentas; los menores de 18 nunca cuentan.",
    },
    community: {
      name: "Comunidad: ideas, errores y hoja de ruta",
      body: "Sugiere lo próximo que debería hacer Liftsmith, vota las ideas que quieres, informa de errores con una captura que solo ve el equipo, y comenta o menciona a otros con @. Cada una muestra en qué punto está, de en revisión a publicada, y te avisamos cuando sale una idea que votaste. La hoja de ruta y el registro de cambios también están en la web.",
    },
    whatsNew: {
      name: "Novedades en la app",
      body: "Ajustes muestra tu versión con un botón Novedades: lo nuevo, lo mejorado y lo arreglado, en palabras sencillas. Tras una actualización, Hoy lo menciona una vez, y solo lista lo que ya puedes usar.",
    },
    "icon-badge": {
      name: "Un número en el icono de la app",
      body: "El icono de la app muestra cuántos mensajes, me gusta, comentarios y solicitudes de seguimiento te esperan. Dentro de la app, números rojos en Amigos y en tu entrenador dicen dónde están, y el número se va cuando los ves. Un interruptor en Ajustes › Recordatorios lo apaga.",
      note: "Android y iPhone. La app web lo muestra si la instalas desde Chrome, Edge o Safari.",
    },
    languages: {
      name: "Diez idiomas",
      body: "Inglés, español, francés, alemán, italiano, japonés, portugués de Brasil, coreano, polaco y turco, según el idioma de tu teléfono o navegador, o el que elijas en la pantalla de bienvenida y en Ajustes.",
    },
    "settings-search": {
      name: "Buscar en ajustes",
      body: "Escribe una palabra arriba en Ajustes y aparece cada ajuste que coincide, con dónde está. Tócalo y se abre con ese ajuste a la vista.",
    },
    appearance: {
      name: "Oscuro, claro o como tu teléfono",
      body: "Un aspecto oscuro por defecto, uno claro o el que use tu teléfono.",
    },
    a11y: {
      name: "Accesibilidad",
      body: "Texto más grande hasta el 150 %, colores aptos para daltonismo, más contraste, lector de pantalla y uso completo con teclado, comprobado según WCAG 2.2 AA.",
    },
    "one-hand": {
      name: "Controles a una mano",
      body: "Mueve los botones de peso y repeticiones junto a Registrar serie, bajo tu pulgar izquierdo o derecho.",
    },
    "big-numbers": {
      name: "Números grandes",
      body: "Durante una serie, el peso y las repeticiones se ven mucho más grandes y Registrar serie es más alto, y la música y lo siguiente esperan al descanso. Fácil de leer con el brazo estirado, en plena serie.",
    },
    lean: {
      name: "Modo ligero, sonidos y vibración",
      body: "Desactiva animaciones y confeti, sonidos o vibración, cada uno con un interruptor.",
    },
    "lite-demos": {
      name: "Ahorro de batería en las figuras 3D",
      body: "Muestra las demostraciones de ejercicios y el mapa de recuperación con menos resolución y fotogramas, para teléfonos antiguos y más batería.",
    },
    desktop: {
      name: "Diseño para ordenador",
      body: "En un ordenador la app web tiene barra lateral, páginas anchas, atajos de teclado durante el entrenamiento (L registra la serie) y un editor de rutinas amplio.",
      note: "App web en una ventana ancha con ratón; los teléfonos y tabletas mantienen el diseño de teléfono.",
    },
    "lab-rep-count": {
      name: "Conteo de repeticiones con la cámara",
      body: "Apoya el teléfono y la cámara cuenta tus repeticiones, con el esqueleto dibujado sobre la imagen. Nada sale de tu teléfono.",
    },
    "lab-bar-speed": {
      name: "Velocidad de la barra con la cámara",
      body: "Muestra lo rápido que se mueve la barra y cuándo se ha frenado lo suficiente para terminar la serie.",
    },
    "lab-form": {
      name: "Revisión de técnica con la cámara",
      body: "Detecta sentadillas por encima del paralelo, repeticiones recortadas e inclinarse hacia un lado, y da un consejo entre series.",
    },
    "lab-speed-max": {
      name: "El máximo de hoy desde el calentamiento",
      body: "Usa la velocidad de la barra en tu calentamiento para sugerir un primer peso de trabajo algo más alto o más bajo.",
    },
    "lab-bar-path": {
      name: "Repetición de la trayectoria de la barra",
      body: "Vuelve a mostrar una repetición de sentadilla, peso muerto o press militar con la trayectoria de la barra dibujada, y una clave si se desvió.",
    },
    "lab-motion": {
      name: "Conteo de repeticiones con el movimiento del teléfono",
      body: "Cuenta repeticiones con los sensores de movimiento del propio teléfono cuando se mueve contigo.",
      note: "Teléfonos y tabletas con sensores de movimiento.",
    },
    "lab-watch-reps": {
      name: "Conteo de repeticiones con el reloj",
      body: "Tu reloj Wear OS o Apple Watch cuenta las repeticiones desde tu muñeca.",
    },
    "lab-hands-free": {
      name: "Series manos libres",
      body: "Mientras un contador de repeticiones cuenta, la serie se registra sola unos segundos después de tu última repetición.",
    },
    "lab-watch-auto": {
      name: "Series sin manos con el reloj",
      body: "Empieza tu siguiente serie y tu reloj termina el descanso, cuenta las repeticiones y registra la serie solo, con una vibración en cada paso.",
      note: "Wear OS y Apple Watch, con el conteo de repeticiones con el reloj activado.",
    },
    "lab-watch-speed": {
      name: "Velocidad desde la muñeca",
      body: "Tu reloj mide lo rápido que levantas cada repetición y vibra cuando la serie se ha frenado lo suficiente para terminarla. Las velocidades del calentamiento ajustan tu primer peso de trabajo, sin cámara.",
      note: "Wear OS y Apple Watch, con el conteo de repeticiones con el reloj activado.",
    },
    "lab-voice": {
      name: "Registrar series por voz",
      body: "Di «100 por 8» o «demasiado fácil» para registrar una serie. Se reconoce en tu dispositivo; ningún audio sale de él.",
      note: "Web: Chrome 139 o posterior.",
    },
    "lab-volume": {
      name: "El botón de volumen registra una serie",
      body: "Pulsa subir volumen en el teléfono o en tus auriculares para registrar la serie.",
    },
    "lab-tempo": {
      name: "Entrenador de tempo",
      body: "En ejercicios con tempo o pausa, cuenta la bajada, la pausa y la subida de cada repetición con sonido y vibración.",
    },
    "lab-hr-rest": {
      name: "Descanso según el pulso",
      body: "Termina el descanso antes cuando tu pulso ha bajado, nunca por debajo del 60 % del descanso previsto.",
    },
    "lab-machines": {
      name: "Máquinas de gimnasio Bluetooth",
      body: "Bicis, remos, cintas y elípticas rellenan el tiempo, la distancia y la potencia de una serie de cardio.",
      note: "Web: solo Chrome.",
    },
    "lab-scale": {
      name: "Báscula inteligente Bluetooth",
      body: "Súbete a una báscula compatible y el registro de peso se rellena con tu peso y grasa corporal para que lo revises y lo guardes.",
      note: "Web: solo Chrome.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Controla un altavoz Sonos desde el entrenamiento, con un volumen para las series y otro para el descanso.",
    },
    "now-playing": {
      name: "Controles de música",
      body: "Reproduce, pausa y salta tu música desde Hoy y durante el entrenamiento, con la canción y la app que la reproduce. Puedes desactivarlo en Ajustes.",
      note: "iPhone: solo Apple Music, porque Apple no deja que las apps controlen otras apps de música.",
    },
  },
  connectionGroups: {
    health: "Apps de salud",
    watches: "Relojes y pulso",
    bluetooth: "Equipos Bluetooth (Labs)",
    services: "Servicios de fitness (necesitan una cuenta gratuita)",
    music: "Música y altavoces",
    other: "Calendarios y otras apps",
  },
  connections: {
    "health-connect": {
      does: "Entran peso, grasa corporal, sueño, VFC, pulso, pasos y comida; salen los entrenamientos terminados; y, si lo activas, entrenamientos de otras apps",
    },
    "apple-health": {
      name: "Apple Salud",
      does: "Entran peso, grasa corporal, sueño, VFC, pulso, pasos, comida, altura, edad y sexo; salen los entrenamientos terminados; y, si lo activas, entrenamientos de otras apps",
    },
    "samsung-health": { does: "Sus datos, cuando los compartes con Health Connect" },
    "health-devices": {
      name: "Fitbit, Garmin Connect, básculas inteligentes, Hume Body Pod",
      does: "Lo que escriban en la app de salud de tu teléfono",
    },
    "wear-os": { name: "Relojes Wear OS", does: "El entrenamiento en tu muñeca, pulso, Registrar serie y +30 s" },
    "apple-watch": { does: "El entrenamiento en tu muñeca, pulso, Registrar serie y +30 s" },
    garmin: { name: "Relojes Garmin (Connect IQ)", does: "El entrenamiento en tu muñeca con la app de reloj de Liftsmith" },
    "hr-strap": {
      name: "Bandas de pulso Bluetooth",
      does: "Pulso en directo en series y descansos (cualquier banda o brazalete que comparta pulso por Bluetooth estándar)",
    },
    scale: {
      name: "Básculas inteligentes Bluetooth",
      does: "Peso y grasa corporal en el registro de peso (básculas que comparten el servicio estándar Weight Scale o Body Composition)",
      link: "Básculas compatibles",
    },
    machines: {
      name: "Máquinas de gimnasio Bluetooth",
      does: "Tiempo, distancia y potencia de bicis, remos, cintas y elípticas que comparten el servicio estándar Fitness Machine",
    },
    oura: { does: "Entran sueño, VFC, pulso en reposo y pasos" },
    strava: { does: "Cada entrenamiento terminado se publica en Strava" },
    "garmin-connect": {
      does: "Entran el sueño, la VFC, el pulso en reposo, los pasos y los pesajes de la báscula Index, y las carreras, salidas en bici y sesiones de remo como entrenamientos de cardio",
    },
    whoop: { does: "Entran sueño, recuperación, VFC y pulso en reposo" },
    withings: { does: "Entran peso, grasa corporal, sueño y pasos" },
    polar: { does: "Entran recuperación nocturna, VFC y sueño" },
    concept2: { does: "Las sesiones de RowErg, SkiErg y BikeErg entran como entrenamientos de cardio" },
    "music-apps": {
      name: "Spotify, YouTube Music y otras apps de música",
      does: "Reproducir, pausar y saltar desde Hoy y el entrenamiento, con el nombre de la canción",
    },
    "apple-music": { does: "Reproducir, pausar y saltar desde Hoy y el entrenamiento, con el nombre de la canción" },
    sonos: { does: "Reproducir, pausar, saltar y volumen desde el entrenamiento; la música sigue las series y el descanso" },
    calendar: {
      name: "Calendario del teléfono (Google, iCloud, Outlook)",
      does: "Días de entrenamiento en tu calendario y entrenamientos ajustados a tus horas ocupadas",
    },
    ics: { name: "Cualquier calendario (archivo .ics)", does: "Días de entrenamiento como archivo de calendario" },
    import: { does: "Tu historial de entrenamientos importado desde su archivo de exportación", link: "Cómo cambiarte" },
  },
};
