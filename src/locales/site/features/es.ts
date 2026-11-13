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
    adaptive: {
      name: "Entrenamientos adaptativos diarios",
      body: "Elige ejercicios que tu gimnasio permite y para los que tus músculos están listos, y fija cada peso y repetición a partir de tus últimos entrenamientos.",
      proPart: "Sin Pro tienes un entrenamiento adaptativo a la semana junto a tu programa gratuito; Pro planifica todos los días.",
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
    cycle: { name: "Preparación según el ciclo", body: "Si quieres, registra tu ciclo y la decisión de hoy lo tiene en cuenta." },
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
      body: "Arranca solo tras cada serie y cuenta atrás en la pantalla de bloqueo con la siguiente serie, los discos, el pulso y botones Registrar serie y +30 s que funcionan con la app cerrada.",
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
    stretching: {
      name: "Estiramientos",
      body: "48 estiramientos con demostraciones en 3D: un calentamiento opcional antes, una vuelta a la calma después o una rutina de estiramientos cualquier día.",
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
      body: "Corrige una serie, añade una nota, ponle nombre a un entrenamiento o repítelo, y cada ejercicio tiene su página con su historial.",
    },
    "log-past": {
      name: "Registrar un entrenamiento pasado",
      body: "¿Olvidaste el teléfono? Registra el entrenamiento después y cuenta como cualquier otro.",
    },
    recap: { name: "Resumen mensual", body: "Un breve repaso de tu mes, listo para compartir." },
    body: {
      name: "Peso, grasa corporal y fotos",
      body: "Registra peso y grasa corporal, o deja que lleguen de tu báscula a través de la app de salud del teléfono, y guarda fotos de progreso en tu teléfono.",
    },
    measurements: {
      name: "Medidas con cinta",
      body: "Nueve zonas en centímetros o pulgadas. Una cintura que crece o se reduce se convierte en una nota del entrenador cuando no hay datos de grasa corporal.",
    },
    "body-figure": {
      name: "Una figura 3D con tu forma",
      body: "Actívala y la figura de Salud toma tu complexión a partir de tu altura, peso, grasa corporal y medidas.",
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
      body: "Las calorías y proteínas que registras en una app de comida llegan a Liftsmith a través de la app de salud del teléfono y se convierten en notas como «te falta proteína tres días seguidos». La app no registra comida.",
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
      body: "Encuentra gimnasios cerca de ti, los oficiales primero, cada uno con su página: equipo, horario, mapa y miembros. Los dueños pueden reclamar su gimnasio y añadir su logo y fotos. ¿Falta un gimnasio? Añádelo. Los dueños ven cuántos atletas lo añadieron o escanearon el cartel, y qué hacer después. Los gimnasios oficiales pueden tener un club con clasificación semanal.",
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
    challenges: {
      name: "Retos, clubes y clasificaciones",
      body: "Reta a un amigo, únete a un club o al grupo de tu gimnasio con una tabla semanal y acepta el reto mensual con todos.",
    },
    profiles: { name: "Perfiles públicos", body: "Una página pública opcional con tus mejores marcas y entrenamientos." },
    share: {
      name: "Tarjetas y enlaces para compartir",
      body: "Comparte un entrenamiento, un nuevo récord o un hito como imagen, o como un enlace público con vista previa.",
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
    awards: {
      name: "Logros, niveles y rachas",
      body: "Insignias por niveles, 50 niveles con recompensas, misiones semanales, protectores de racha y ligas honestas.",
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
    widgets: {
      name: "Widget en la pantalla de inicio",
      body: "La decisión de hoy, tu meta semanal, una nota del entrenador y Empezar o Registrar serie en la pantalla de inicio.",
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
    cloud: {
      name: "Conexiones con servicios de fitness",
      body: "Oura envía sueño, VFC, pulso en reposo y pasos, con una cuenta gratuita. Estamos estudiando Strava, WHOOP, Withings, Polar y Concept2.",
    },
    "health-save": {
      name: "Entrenamientos guardados en tu app de salud",
      body: "Cada entrenamiento terminado se guarda en Health Connect o Apple Salud como entrenamiento de fuerza, con calorías y pulso.",
    },
    offline: {
      name: "Funciona sin conexión",
      body: "Todo funciona en tu dispositivo, así que no pasa nada si no hay señal en el gimnasio del sótano.",
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
    languages: {
      name: "Seis idiomas",
      body: "Inglés, español, francés, alemán, italiano y japonés, según el idioma de tu teléfono.",
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
      does: "Entran peso, grasa corporal, sueño, VFC, pulso, pasos y comida; salen los entrenamientos terminados",
    },
    "apple-health": {
      name: "Apple Salud",
      does: "Entran peso, grasa corporal, sueño, VFC, pulso, pasos, comida, altura, edad y sexo; salen los entrenamientos terminados",
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
    whoop: { does: "Entran sueño, recuperación, VFC y pulso en reposo" },
    withings: { does: "Entran peso, grasa corporal, sueño y pasos" },
    polar: { does: "Entran recuperación nocturna, VFC y sueño" },
    concept2: { does: "Las sesiones de RowErg, SkiErg y BikeErg entran como entrenamientos de cardio" },
    sonos: { does: "Reproducir, pausar, saltar y volumen desde el entrenamiento; la música sigue las series y el descanso" },
    calendar: {
      name: "Calendario del teléfono (Google, iCloud, Outlook)",
      does: "Días de entrenamiento en tu calendario y entrenamientos ajustados a tus horas ocupadas",
    },
    ics: { name: "Cualquier calendario (archivo .ics)", does: "Días de entrenamiento como archivo de calendario" },
    import: { does: "Tu historial de entrenamientos importado desde su archivo de exportación", link: "Cómo cambiarte" },
  },
};
