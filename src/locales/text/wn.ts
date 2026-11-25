import type { Message } from "@/lib/i18n";

// Text for keys starting "wn.", What's new (src/lib/appNews.ts, WhatsNew.tsx), in every language. English is the
// source, and the website's /whats-new/ page reads the English. `wn.c.<id>` is one change in a release.

export const en = {
  "wn.c.stopCoach.title": "Stop coaching",
  "wn.c.stopCoach.body":
    "Coach, trainer and physio accounts can now choose Stop coaching in Coaching setup. It removes the coach role, live invite and coach-side links.",
  "wn.c.legCurlWeights.title": "Leg curls show the weight",
  "wn.c.legCurlWeights.body":
    "The how-to figures for leg curls and leg extensions now show the machine's weight stack and lever, and the lying, dumbbell and band curls lie face down.",
  "wn.c.coachCalendar.title": "Workout calendar",
  "wn.c.coachCalendar.body":
    "Assign workouts or rest days on a month calendar. Athletes see the scheduled day on Today. Invite assistant coaches to edit a calendar and check the roster’s training activity.",
  "wn.c.deleteWorkout.title": "Undo after deleting a workout",
  "wn.c.deleteWorkout.body":
    "Deleted a workout by mistake? Tap Undo for a few seconds after. A deleted workout now also leaves your Friends feed and Health Connect or Apple Health, and every stat is worked out again from what's left.",
  "wn.c.landmineEnd.title": "Landmine plates on one end",
  "wn.c.landmineEnd.body": "Landmine and T-bar moves show their plates on the one free end, and plate changes stop saying each side.",
  "wn.c.gymInsights.title": "Insights for gym owners",
  "wn.c.sonosVolume.title": "Sonos keeps your volume, and mutes in one tap",
  "wn.c.sonosVolume.body":
    "Turn the music up during a set and that becomes your set volume, the same for rest. Tap the speaker to mute, and again to bring it back.",
  "wn.c.gymInsights.body":
    "Own a gym on Liftsmith? Its page now shows how many lifters train there, the busy and quiet hours and the equipment they use, with one thing to do next. Totals only, never who. Turn off Count my gym visits in Settings if you'd rather not count.",
  "wn.title": "What's new",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Version {version}",
  "wn.count.new": { one: "{count} new", other: "{count} new" },
  "wn.count.better": { one: "{count} better", other: "{count} better" },
  "wn.count.fixed": { one: "{count} fixed", other: "{count} fixed" },
  "wn.kind.new": "New",
  "wn.kind.better": "Better",
  "wn.kind.fixed": "Fixed",
  "wn.go": "Let's go",
  "wn.row": "Version",
  "wn.open": "What's new",
  "wn.check": "Check for updates",
  "wn.checking": "Checking…",
  "wn.current": "You're up to date",
  "wn.install": "Install",
  "wn.checkFail": "Couldn't check. Try again when you're online.",
  "wn.note": "What's new in {brand}",
  "wn.see": "See all",
  "wn.c.seasons.title": "Training seasons",
  "wn.c.seasons.body":
    "Ten-week seasons with badges, themes and an app icon you can only earn then, paced to your own weekly goal. Every tier is free.",
  "wn.c.community.title": "Ideas, bugs and a roadmap",
  "wn.c.community.body": "Community, under Help in Settings: suggest ideas, report bugs, vote and follow each one from Planned to Shipped.",
  "wn.c.crew.title": "Club chat and crew sessions",
  "wn.c.crew.body": "Every club has a chat, and crew sessions let you pick a time, say you're in and get a reminder an hour before.",
  "wn.c.classes.title": "Class schedules at your gym",
  "wn.c.classes.body": "Gyms can post their weekly classes. See the next seven days on the gym's page and add one to your calendar.",
  "wn.c.faults.title": "Common mistakes and their fixes",
  "wn.c.faults.body": "Every exercise and stretch lists the mistakes people make most, and how to fix each one.",
  "wn.c.widgets.title": "This week and Recovery widgets",
  "wn.c.widgets.body": "Two new home screen widgets: your week's workouts at a glance, and which muscles are ready to train.",
  "wn.c.supersets.title": "Automatic supersets",
  "wn.c.supersets.body":
    "Adaptive workouts can pair exercises that don't share muscles, so more fits into the same time. Turn it on in Settings, and every pair says why.",
  "wn.c.fitTests.title": "Fitness tests on a number line",
  "wn.c.fitTests.body": "Dead hang, one-leg stand and chair stand results now sit on a coloured line beside the typical range.",
  "wn.c.getReady.title": "Time to get ready between stretches",
  "wn.c.getReady.body": "A short countdown before each stretch and each side, and the screen stays on for the whole routine.",
  "wn.c.machineSteps.title": "Machines step by 5 lb",
  "wn.c.machineSteps.body": "Machine and cable exercises now go up by 5 lb or 2.5 kg, on the buttons and in the suggested weights.",
  "wn.c.figures.title": "Smoother 3D figures",
  "wn.c.figures.body": "Drag any 3D figure to turn it, or flick it to spin. The how-to figure keeps moving while you rest.",
  "wn.c.languages.title": "Ten languages",
  "wn.c.languages.body":
    "Liftsmith now speaks Brazilian Portuguese, Korean, Polish and Turkish too, and you can pick your language on the welcome screen.",
  "wn.c.checkins.title": "Coach check-ins with weight and photos",
  "wn.c.checkins.body":
    "Coaches can ask for your weight and photos in a check-in, every one, two or four weeks, and see how each answer trends.",
  "wn.c.jumps.title": "Jumps leave the floor",
  "wn.c.jumps.body": "Ankle hops, squat jumps and the other jumps in the how-to figures now really leave the ground.",
  "wn.c.sides.title": "One-side stretches show the right side",
  "wn.c.sides.body": "A stretch for one side now shows the side it names, and mirrors for the other.",
  "wn.c.seasonPlan.title": "Five new training seasons for 2027",
  "wn.c.seasonPlan.body":
    "Tempest, Bloom, Solstice, Maple and Obsidian follow Ember back to back through 2027, each with its own themes, app icons, avatars, rare plates and three challenges of its own.",
  "wn.c.pregnancy.title": "Pregnancy and postpartum mode",
  "wn.c.pregnancy.body":
    "Settings › Body and units: tell us you're pregnant or have had a baby and every workout fits the week, with lighter loads, nothing on your back later in pregnancy and a gradual return after birth.",
  "wn.c.iconBadge.title": "A number on the app icon",
  "wn.c.iconBadge.body":
    "See how many messages, likes, comments and follow requests are waiting without opening the app. Inside, red counts on Friends and your coach show where they are.",
  "wn.c.formVideos.title": "Form videos for your coach",
  "wn.c.formVideos.body":
    "Film a set in the app and send it to your coach or physio. They slow it down and pin notes to the exact moments that matter.",
  "wn.c.routineLibrary.title": "A routine library",
  "wn.c.routineLibrary.body":
    "Find routines other lifters published, save one in a tap and rate it. Publish your own from its editor in your routines.",
  "wn.c.teamSession.title": "A team session for school coaches",
  "wn.c.teamSession.body":
    "High school coaches can run one workout for the whole team from one tablet. Each athlete taps their name to log their sets, and the board shows who hasn't started.",
  "wn.c.openNow.title": "Open now in the gym finder",
  "wn.c.openNow.body":
    "Every gym with its hours says whether it's open now and when it closes or opens, and an Open now chip shows only the open ones.",
  "wn.c.settingsSearch.title": "Search your settings",
  "wn.c.settingsSearch.body": "Type in the box at the top of Settings to find any setting, and it opens with that setting in view.",
  "wn.c.mapFinder.title": "A map-first gym finder",
  "wn.c.mapFinder.body": "The gym finder is now a tall map with each gym on a see-through card you can swipe through.",
  "wn.c.outsideWorkouts.title": "Workouts from other apps count",
  "wn.c.outsideWorkouts.body":
    "Turn on Count workouts from other apps in Connected apps, and runs, rides, sports and classes from Health shape your recovery and tomorrow's plan.",
  "wn.c.gymChains.title": "Every location of a gym chain",
  "wn.c.gymChains.body":
    "Gyms that belong to a chain show its logo and a link to a page with every one of its locations, nearest first, so you can find and add your branch in a tap.",
  "wn.c.rehabSelf.title": "Gentle rehab without a physio",
  "wn.c.rehabSelf.body":
    "Logged an injury? Injuries and a coach's note offer a short bodyweight routine you can do at home. It's a starting point, not a treatment.",
  "wn.c.rehabShape.title": "Shape a rehab routine",
  "wn.c.rehabShape.body":
    "Physios can set the reps or the seconds on each exercise, and a short cue, in the routine builder. You follow it as written.",
  "wn.c.rehabEnd.title": "When a program is taken back",
  "wn.c.rehabEnd.body": "If your physio takes a program back, Today asks you to stop it or keep doing it on your own.",
  "wn.c.campusClubs.title": "Pro for an active club",
  "wn.c.campusClubs.body":
    "Lead a club where 5 or more members, you included, each finish a workout in the last 14 days, and Pro is free while that stays true.",
  "wn.c.voiceAmy.title": "Amy for the voice coach",
  "wn.c.voiceAmy.body":
    "Pro unlocks Amy, a clear English voice built into the app. Pick Amy or your phone's text-to-speech in Settings › Workout; Amy falls back to the phone voice if she can't load.",
  "wn.c.checkUpdates.title": "Check for updates in Settings",
  "wn.c.checkUpdates.body": "On Android and iPhone, Settings › Version lets you check for a newer app and install it when one is ready.",
  "wn.c.coachRoles.title": "Tools that match how you coach",
  "wn.c.coachRoles.body":
    "Pick personal trainer, sports coach or physio under Coaching › Setup. Each role shows only its tools — sports coaches lead with season programs and teams; messaging stays for everyone.",
  "wn.c.assignProgram.title": "Assign a season program",
  "wn.c.assignProgram.body":
    "Coaches put Upper/Lower, Push/Pull/Legs or their own multi-day program on athletes or a school team for N weeks. Athletes follow once; Today shows that weekday’s workout. A program calendar shows Done and Not yet — first names only for school teams, never weights.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Dejar de entrenar",
  "wn.c.stopCoach.body":
    "Las cuentas de coach, entrenador y fisioterapeuta pueden elegir Dejar de entrenar en la configuración de Coaching. Se elimina el papel de coach, la invitación activa y los enlaces como coach.",
  "wn.c.legCurlWeights.title": "Los curls de piernas muestran el peso",
  "wn.c.legCurlWeights.body":
    "Las figuras de cómo hacerlo de los curls y extensiones de piernas ahora muestran la pila de pesas y la palanca de la máquina, y los curls tumbado, con mancuerna y con banda se hacen boca abajo.",
  "wn.c.coachCalendar.title": "Calendario de entrenamientos",
  "wn.c.coachCalendar.body":
    "Asigna entrenamientos o días de descanso en un calendario mensual. Los atletas ven lo programado en Hoy. Invita a entrenadores asistentes a editar un calendario y revisa la actividad del equipo.",
  "wn.c.deleteWorkout.title": "Deshacer al eliminar un entrenamiento",
  "wn.c.deleteWorkout.body":
    "¿Eliminaste un entrenamiento por error? Toca Deshacer durante unos segundos. Ahora un entrenamiento eliminado también sale de Amigos y de Health Connect o Salud, y todas las estadísticas se recalculan con lo que queda.",
  "wn.c.landmineEnd.title": "Discos del landmine en un extremo",
  "wn.c.landmineEnd.body":
    "Los ejercicios con landmine y la remada en T muestran los discos en el único extremo libre, y los cambios de discos ya no dicen por lado.",
  "wn.c.sonosVolume.title": "Sonos recuerda tu volumen y se silencia con un toque",
  "wn.c.sonosVolume.body":
    "Sube la música durante una serie y ese será tu volumen de series; lo mismo en el descanso. Toca el altavoz para silenciar y otra vez para recuperarlo.",
  "wn.c.gymInsights.title": "Datos para dueños de gimnasios",
  "wn.c.gymInsights.body":
    "¿Tienes un gimnasio en Liftsmith? Su página muestra cuántos atletas entrenan allí, las horas llenas y tranquilas y el equipo que usan, con un siguiente paso. Solo totales, nunca quién. Desactiva Contar mis visitas al gimnasio en Ajustes si prefieres no contar.",
  "wn.title": "Novedades",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Versión {version}",
  "wn.count.new": { one: "{count} novedad", other: "{count} novedades" },
  "wn.count.better": { one: "{count} mejora", other: "{count} mejoras" },
  "wn.count.fixed": { one: "{count} arreglo", other: "{count} arreglos" },
  "wn.kind.new": "Nuevo",
  "wn.kind.better": "Mejor",
  "wn.kind.fixed": "Arreglado",
  "wn.go": "¡Vamos!",
  "wn.row": "Versión",
  "wn.open": "Novedades",
  "wn.check": "Buscar actualizaciones",
  "wn.checking": "Buscando…",
  "wn.current": "Ya estás al día",
  "wn.install": "Instalar",
  "wn.checkFail": "No se pudo comprobar. Inténtalo de nuevo cuando tengas conexión.",
  "wn.note": "Novedades en {brand}",
  "wn.see": "Ver todo",
  "wn.c.seasons.title": "Temporadas de entrenamiento",
  "wn.c.seasons.body":
    "Temporadas de diez semanas con insignias, temas y un icono de la app que solo se ganan entonces, al ritmo de tu objetivo semanal. Todos los niveles son gratis.",
  "wn.c.community.title": "Ideas, errores y hoja de ruta",
  "wn.c.community.body":
    "Comunidad, en Ayuda dentro de Ajustes: propón ideas, informa de errores, vota y sigue cada una de Planificado a Publicado.",
  "wn.c.crew.title": "Chat del club y sesiones en grupo",
  "wn.c.crew.body":
    "Cada club tiene un chat, y las sesiones en grupo te dejan elegir una hora, apuntarte y recibir un aviso una hora antes.",
  "wn.c.classes.title": "Horario de clases de tu gimnasio",
  "wn.c.classes.body":
    "Los gimnasios pueden publicar sus clases semanales. Mira los próximos siete días en la página del gimnasio y añade una a tu calendario.",
  "wn.c.faults.title": "Errores comunes y cómo corregirlos",
  "wn.c.faults.body": "Cada ejercicio y estiramiento muestra los errores más habituales y cómo corregir cada uno.",
  "wn.c.widgets.title": "Widgets Esta semana y Recuperación",
  "wn.c.widgets.body":
    "Dos widgets nuevos para la pantalla de inicio: tus entrenamientos de la semana de un vistazo y qué músculos están listos.",
  "wn.c.supersets.title": "Superseries automáticas",
  "wn.c.supersets.body":
    "Los entrenamientos adaptativos pueden emparejar ejercicios que no comparten músculos, para hacer más en el mismo tiempo. Actívalo en Ajustes; cada pareja explica por qué.",
  "wn.c.fitTests.title": "Pruebas de forma en una línea de valores",
  "wn.c.fitTests.body":
    "Los resultados de colgarse de la barra, apoyo a una pierna y levantarse de la silla aparecen en una línea de colores junto al rango habitual.",
  "wn.c.getReady.title": "Tiempo para prepararte entre estiramientos",
  "wn.c.getReady.body": "Una breve cuenta atrás antes de cada estiramiento y cada lado, y la pantalla sigue encendida toda la rutina.",
  "wn.c.machineSteps.title": "Las máquinas suben de 2,5 kg en 2,5 kg",
  "wn.c.machineSteps.body": "Los ejercicios en máquina y polea suben de 2,5 kg o 5 lb, en los botones y en los pesos sugeridos.",
  "wn.c.figures.title": "Figuras 3D más fluidas",
  "wn.c.figures.body":
    "Arrastra cualquier figura 3D para girarla, o lánzala para que gire sola. La figura de la demostración sigue moviéndose mientras descansas.",
  "wn.c.languages.title": "Diez idiomas",
  "wn.c.languages.body":
    "Liftsmith ya habla también portugués de Brasil, coreano, polaco y turco, y puedes elegir el idioma en la pantalla de bienvenida.",
  "wn.c.checkins.title": "Revisiones del entrenador con peso y fotos",
  "wn.c.checkins.body":
    "Tu entrenador puede pedirte el peso y fotos en una revisión, cada una, dos o cuatro semanas, y ver la tendencia de cada respuesta.",
  "wn.c.jumps.title": "Los saltos despegan del suelo",
  "wn.c.jumps.body": "Los saltos de tobillo, sentadillas con salto y demás saltos de las figuras ya despegan de verdad del suelo.",
  "wn.c.sides.title": "Los estiramientos de un lado muestran el lado correcto",
  "wn.c.sides.body": "Un estiramiento para un lado muestra ahora el lado que nombra, y se refleja para el otro.",
  "wn.c.seasonPlan.title": "Cinco nuevas temporadas de entrenamiento para 2027",
  "wn.c.seasonPlan.body":
    "Tempestad, Floración, Solsticio, Arce y Obsidiana siguen a Brasa una tras otra durante 2027, cada una con sus temas, iconos, avatares, discos raros y tres retos propios.",
  "wn.c.pregnancy.title": "Modo embarazo y posparto",
  "wn.c.pregnancy.body":
    "Ajustes › Cuerpo y unidades: dinos que estás embarazada o que has tenido a tu bebé y cada entrenamiento se adapta a la semana, con cargas más ligeras, nada boca arriba al final del embarazo y una vuelta gradual después del parto.",
  "wn.c.iconBadge.title": "Un número en el icono de la app",
  "wn.c.iconBadge.body":
    "Mira cuántos mensajes, me gusta, comentarios y solicitudes de seguimiento te esperan sin abrir la app. Dentro, los números rojos en Amigos y en tu entrenador te dicen dónde están.",
  "wn.c.formVideos.title": "Vídeos de técnica para tu entrenador",
  "wn.c.formVideos.body":
    "Graba una serie en la app y envíasela a tu entrenador o fisio. La ve a cámara lenta y fija notas en los momentos exactos que importan.",
  "wn.c.routineLibrary.title": "Una biblioteca de rutinas",
  "wn.c.routineLibrary.body":
    "Encuentra rutinas que publicaron otros atletas, guarda una con un toque y valórala. Publica las tuyas desde su editor en tus rutinas.",
  "wn.c.teamSession.title": "Sesiones de equipo para entrenadores escolares",
  "wn.c.teamSession.body":
    "Los entrenadores de secundaria pueden dirigir un entrenamiento para todo el equipo desde una tableta. Cada atleta toca su nombre para anotar sus series, y el tablero muestra quién no ha empezado.",
  "wn.c.openNow.title": "Abierto ahora en el buscador de gimnasios",
  "wn.c.openNow.body":
    "Cada gimnasio con horario dice si está abierto ahora y cuándo cierra o abre, y el filtro Abierto ahora muestra solo los abiertos.",
  "wn.c.settingsSearch.title": "Busca en tus ajustes",
  "wn.c.settingsSearch.body":
    "Escribe en la casilla de arriba de Ajustes para encontrar cualquier ajuste, y se abre con ese ajuste a la vista.",
  "wn.c.mapFinder.title": "Un buscador de gimnasios con el mapa primero",
  "wn.c.mapFinder.body":
    "El buscador de gimnasios es ahora un mapa grande con cada gimnasio en una tarjeta transparente que puedes deslizar.",
  "wn.c.outsideWorkouts.title": "Cuentan los entrenamientos de otras apps",
  "wn.c.outsideWorkouts.body":
    "Activa Contar entrenamientos de otras apps en Apps conectadas y las carreras, salidas en bici, deportes y clases de Salud ajustan tu recuperación y el plan de mañana.",
  "wn.c.gymChains.title": "Todas las sedes de una cadena",
  "wn.c.gymChains.body":
    "Los gimnasios de una cadena muestran su logo y un enlace a una página con todas sus sedes, las más cercanas primero, para encontrar y añadir la tuya con un toque.",
  "wn.c.rehabSelf.title": "Rehabilitación suave sin fisioterapeuta",
  "wn.c.rehabSelf.body":
    "¿Has registrado una lesión? Lesiones y una nota del entrenador ofrecen una rutina corta con el peso del cuerpo para hacer en casa. Es un punto de partida, no un tratamiento.",
  "wn.c.rehabShape.title": "Da forma a una rutina de rehabilitación",
  "wn.c.rehabShape.body":
    "Los fisioterapeutas pueden fijar las repeticiones o los segundos de cada ejercicio, y una indicación breve, en el editor de rutinas. Tú la sigues tal como está escrita.",
  "wn.c.rehabEnd.title": "Cuando retiran un programa",
  "wn.c.rehabEnd.body": "Si tu fisioterapeuta retira un programa, Hoy te pregunta si lo paras o lo sigues por tu cuenta.",
  "wn.c.campusClubs.title": "Pro para un club activo",
  "wn.c.campusClubs.body":
    "Dirige un club en el que 5 o más miembros, tú incluido, terminen cada uno un entrenamiento en los últimos 14 días, y Pro es gratis mientras siga siendo así.",
  "wn.c.voiceAmy.title": "Amy para el entrenador por voz",
  "wn.c.voiceAmy.body":
    "Pro desbloquea Amy, una voz inglesa clara incluida en la app. Elige Amy o el texto a voz del teléfono en Ajustes › Entrenamiento; Amy vuelve a la voz del teléfono si no puede cargar.",
  "wn.c.checkUpdates.title": "Buscar actualizaciones en Ajustes",
  "wn.c.checkUpdates.body": "En Android e iPhone, Ajustes › Versión te deja buscar una app más nueva e instalarla cuando esté lista.",
  "wn.c.coachRoles.title": "Herramientas según cómo entrenas",
  "wn.c.coachRoles.body":
    "Elige entrenador personal, coach deportivo o fisio en Coaching › Ajustes. Cada rol muestra solo sus herramientas: los coaches deportivos empiezan por programas de temporada y equipos; los mensajes siguen para todos.",
  "wn.c.assignProgram.title": "Asigna un programa de temporada",
  "wn.c.assignProgram.body":
    "Los entrenadores ponen Upper/Lower, Push/Pull/Legs o su programa de varios días a clientes o un equipo escolar durante N semanas. Siguen una vez; Hoy muestra el entrenamiento de ese día. Un calendario muestra Hecho y Aún no — solo nombres de pila en equipos escolares, nunca pesos.",
};

export const fr: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Arrêter le coaching",
  "wn.c.stopCoach.body":
    "Les comptes coach, coach personnel et kinésithérapeute peuvent choisir Arrêter le coaching dans la configuration. Le rôle, l'invitation active et les liens comme coach sont supprimés.",
  "wn.c.legCurlWeights.title": "Les leg curls montrent la charge",
  "wn.c.legCurlWeights.body":
    "Les figures des leg curls et des extensions de jambes montrent maintenant la pile de poids et le levier de la machine, et les curls allongé, avec haltère et avec élastique se font à plat ventre.",
  "wn.c.coachCalendar.title": "Calendrier des entraînements",
  "wn.c.coachCalendar.body":
    "Planifiez les entraînements et les jours de repos sur un calendrier mensuel. Les athlètes voient leur programme dans Aujourd’hui. Invitez des coachs adjoints à modifier un calendrier et consultez l’activité de vos athlètes.",
  "wn.c.deleteWorkout.title": "Annuler après avoir supprimé une séance",
  "wn.c.deleteWorkout.body":
    "Une séance supprimée par erreur ? Touchez Annuler pendant quelques secondes. Une séance supprimée quitte aussi Amis et Health Connect ou Santé, et toutes les stats sont recalculées avec ce qui reste.",
  "wn.c.landmineEnd.title": "Disques du landmine sur une extrémité",
  "wn.c.landmineEnd.body":
    "Les mouvements au landmine et le rowing T-bar montrent leurs disques sur la seule extrémité libre, sans « de chaque côté ».",
  "wn.c.sonosVolume.title": "Sonos garde ton volume et se coupe d'un toucher",
  "wn.c.sonosVolume.body":
    "Monte la musique pendant une série et ce sera ton volume de série, pareil pour le repos. Touche le haut-parleur pour couper le son, et encore pour le rétablir.",
  "wn.c.gymInsights.title": "Des statistiques pour les propriétaires de salle",
  "wn.c.gymInsights.body":
    "Vous gérez une salle sur Liftsmith ? Sa page montre combien de sportifs s'y entraînent, les heures pleines et calmes et le matériel utilisé, avec une prochaine étape. Des totaux seulement, jamais qui. Désactivez Compter mes visites en salle dans Réglages si vous préférez.",
  "wn.title": "Nouveautés",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Version {version}",
  "wn.count.new": { one: "{count} nouveauté", other: "{count} nouveautés" },
  "wn.count.better": { one: "{count} amélioration", other: "{count} améliorations" },
  "wn.count.fixed": { one: "{count} correction", other: "{count} corrections" },
  "wn.kind.new": "Nouveau",
  "wn.kind.better": "Mieux",
  "wn.kind.fixed": "Corrigé",
  "wn.go": "C’est parti",
  "wn.row": "Version",
  "wn.open": "Nouveautés",
  "wn.check": "Rechercher des mises à jour",
  "wn.checking": "Recherche…",
  "wn.current": "Vous êtes à jour",
  "wn.install": "Installer",
  "wn.checkFail": "Impossible de vérifier. Réessayez quand vous serez en ligne.",
  "wn.note": "Nouveautés dans {brand}",
  "wn.see": "Tout voir",
  "wn.c.seasons.title": "Saisons d’entraînement",
  "wn.c.seasons.body":
    "Des saisons de dix semaines avec des badges, des thèmes et une icône d’app à gagner seulement pendant la saison, au rythme de votre objectif hebdomadaire. Tous les paliers sont gratuits.",
  "wn.c.community.title": "Idées, bugs et feuille de route",
  "wn.c.community.body":
    "Communauté, dans Aide des Réglages : proposez des idées, signalez des bugs, votez et suivez chacun de Prévu à Livré.",
  "wn.c.crew.title": "Discussion du club et séances en groupe",
  "wn.c.crew.body":
    "Chaque club a sa discussion, et les séances en groupe permettent de choisir une heure, de dire que vous venez et d’avoir un rappel une heure avant.",
  "wn.c.classes.title": "Le planning des cours de votre salle",
  "wn.c.classes.body":
    "Les salles peuvent publier leurs cours de la semaine. Voyez les sept prochains jours sur la page de la salle et ajoutez un cours à votre agenda.",
  "wn.c.faults.title": "Erreurs fréquentes et corrections",
  "wn.c.faults.body": "Chaque exercice et étirement liste les erreurs les plus courantes, et comment corriger chacune.",
  "wn.c.widgets.title": "Widgets Cette semaine et Récupération",
  "wn.c.widgets.body":
    "Deux nouveaux widgets d’écran d’accueil : vos séances de la semaine d’un coup d’œil, et les muscles prêts à travailler.",
  "wn.c.supersets.title": "Supersets automatiques",
  "wn.c.supersets.body":
    "Les séances adaptatives peuvent associer des exercices qui ne sollicitent pas les mêmes muscles, pour en faire plus dans le même temps. À activer dans les Réglages ; chaque paire dit pourquoi.",
  "wn.c.fitTests.title": "Tests de forme sur une échelle",
  "wn.c.fitTests.body":
    "Les résultats de la suspension, de l’équilibre sur une jambe et du lever de chaise s’affichent sur une ligne colorée à côté de la plage habituelle.",
  "wn.c.getReady.title": "Le temps de se préparer entre les étirements",
  "wn.c.getReady.body":
    "Un court compte à rebours avant chaque étirement et chaque côté, et l’écran reste allumé pendant toute la routine.",
  "wn.c.machineSteps.title": "Les machines montent par 2,5 kg",
  "wn.c.machineSteps.body":
    "Les exercices sur machine et à la poulie montent par 2,5 kg ou 5 lb, sur les boutons et dans les charges proposées.",
  "wn.c.figures.title": "Des figures 3D plus fluides",
  "wn.c.figures.body":
    "Faites glisser une figure 3D pour la tourner, ou lancez-la pour qu’elle pivote. La figure de démonstration continue de bouger pendant le repos.",
  "wn.c.languages.title": "Dix langues",
  "wn.c.languages.body":
    "Liftsmith parle désormais aussi le portugais du Brésil, le coréen, le polonais et le turc, et vous pouvez choisir la langue dès l’écran d’accueil.",
  "wn.c.checkins.title": "Bilans du coach avec poids et photos",
  "wn.c.checkins.body":
    "Votre coach peut demander votre poids et des photos dans un bilan, toutes les une, deux ou quatre semaines, et voir l’évolution de chaque réponse.",
  "wn.c.jumps.title": "Les sauts décollent du sol",
  "wn.c.jumps.body": "Les sauts de cheville, squats sautés et autres sauts des figures de démonstration quittent vraiment le sol.",
  "wn.c.sides.title": "Les étirements d’un côté montrent le bon côté",
  "wn.c.sides.body": "Un étirement d’un côté montre désormais le côté indiqué, et s’inverse pour l’autre.",
  "wn.c.seasonPlan.title": "Cinq nouvelles saisons d'entraînement pour 2027",
  "wn.c.seasonPlan.body":
    "Tempête, Floraison, Solstice, Érable et Obsidienne suivent Braise tout au long de 2027, chacune avec ses thèmes, icônes, avatars, disques rares et trois défis bien à elle.",
  "wn.c.pregnancy.title": "Mode grossesse et post-partum",
  "wn.c.pregnancy.body":
    "Réglages › Corps et unités : indiquez que vous êtes enceinte ou que vous avez eu votre bébé et chaque séance s'adapte à la semaine, avec des charges plus légères, rien sur le dos en fin de grossesse et une reprise progressive après l'accouchement.",
  "wn.c.iconBadge.title": "Un nombre sur l'icône de l'app",
  "wn.c.iconBadge.body":
    "Voyez combien de messages, j'aime, commentaires et demandes d'abonnement vous attendent sans ouvrir l'app. Dedans, des nombres rouges sur Amis et sur votre coach montrent où ils sont.",
  "wn.c.formVideos.title": "Des vidéos de technique pour votre coach",
  "wn.c.formVideos.body":
    "Filmez une série dans l'app et envoyez-la à votre coach ou kiné. Il la ralentit et épingle des notes aux moments précis qui comptent.",
  "wn.c.routineLibrary.title": "Une bibliothèque de routines",
  "wn.c.routineLibrary.body":
    "Trouvez des routines publiées par d'autres pratiquants, enregistrez-en une d'un geste et notez-la. Publiez les vôtres depuis leur éditeur dans vos routines.",
  "wn.c.teamSession.title": "Séances d'équipe pour les coachs scolaires",
  "wn.c.teamSession.body":
    "Les coachs de lycée peuvent mener une séance pour toute l'équipe depuis une tablette. Chaque athlète touche son prénom pour noter ses séries, et le tableau montre qui n'a pas commencé.",
  "wn.c.openNow.title": "Ouvert maintenant dans la recherche de salles",
  "wn.c.openNow.body":
    "Chaque salle avec ses horaires indique si elle est ouverte et quand elle ferme ou ouvre, et le filtre Ouvert maintenant ne montre que celles qui sont ouvertes.",
  "wn.c.settingsSearch.title": "Recherchez dans vos réglages",
  "wn.c.settingsSearch.body":
    "Tapez dans le champ en haut des Réglages pour trouver n’importe quel réglage : il s’ouvre avec ce réglage en vue.",
  "wn.c.mapFinder.title": "Une recherche de salles centrée sur la carte",
  "wn.c.mapFinder.body":
    "La recherche de salles est maintenant une grande carte, avec chaque salle sur une carte transparente à faire défiler.",
  "wn.c.outsideWorkouts.title": "Les séances d'autres apps comptent",
  "wn.c.outsideWorkouts.body":
    "Active Compter les séances d'autres apps dans Apps connectées : courses, vélo, sports et cours de Santé ajustent ta récupération et le plan de demain.",
  "wn.c.gymChains.title": "Toutes les adresses d'une chaîne",
  "wn.c.gymChains.body":
    "Les salles d'une chaîne affichent son logo et un lien vers une page avec toutes ses adresses, les plus proches d'abord, pour trouver et ajouter la vôtre d'un toucher.",
  "wn.c.rehabSelf.title": "Une rééducation douce sans kiné",
  "wn.c.rehabSelf.body":
    "Vous avez noté une blessure ? Blessures et une note du coach proposent une courte routine au poids du corps à faire chez vous. C’est un point de départ, pas un traitement.",
  "wn.c.rehabShape.title": "Façonner une routine de rééducation",
  "wn.c.rehabShape.body":
    "Les kinés peuvent fixer les répétitions ou les secondes de chaque exercice, et une courte consigne, dans l’éditeur de routines. Vous la suivez telle qu’elle est écrite.",
  "wn.c.rehabEnd.title": "Quand un programme est repris",
  "wn.c.rehabEnd.body": "Si votre kiné reprend un programme, Aujourd’hui vous demande de l’arrêter ou de le continuer de votre côté.",
  "wn.c.campusClubs.title": "Pro pour un club actif",
  "wn.c.campusClubs.body":
    "Animez un club où 5 membres ou plus, vous compris, terminent chacun une séance dans les 14 derniers jours, et Pro est gratuit tant que c’est le cas.",
  "wn.c.voiceAmy.title": "Amy pour le coach vocal",
  "wn.c.voiceAmy.body":
    "Pro débloque Amy, une voix anglaise claire intégrée à l’app. Choisissez Amy ou la synthèse du téléphone dans Réglages › Entraînement ; Amy revient à la voix du téléphone si elle ne charge pas.",
  "wn.c.checkUpdates.title": "Chercher les mises à jour dans Réglages",
  "wn.c.checkUpdates.body":
    "Sur Android et iPhone, Réglages › Version permet de chercher une app plus récente et de l'installer quand elle est prête.",
  "wn.c.coachRoles.title": "Des outils adaptés à votre façon de coach",
  "wn.c.coachRoles.body":
    "Choisissez coach personnel, entraîneur sportif ou kiné dans Coaching › Réglages. Chaque rôle n'affiche que ses outils — les entraîneurs sportifs commencent par les programmes de saison et les équipes ; la messagerie reste pour tout le monde.",
  "wn.c.assignProgram.title": "Assigner un programme de saison",
  "wn.c.assignProgram.body":
    "Les coachs mettent Upper/Lower, Push/Pull/Legs ou leur programme de plusieurs jours sur des clients ou une équipe scolaire pour N semaines. Suivre une fois ; Aujourd’hui montre l’entraînement du jour. Un calendrier montre Fait et Pas encore — prénoms seulement pour les équipes scolaires, jamais de poids.",
};

export const de: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Coaching beenden",
  "wn.c.stopCoach.body":
    "Coach-, Trainer- und Physiotherapie-Konten können jetzt Coaching beenden wählen. Rolle, aktive Einladung und Coach-Verknüpfungen werden entfernt.",
  "wn.c.legCurlWeights.title": "Beinbeuger zeigen das Gewicht",
  "wn.c.legCurlWeights.body":
    "Die Anleitungsfiguren für Beinbeuger und Beinstrecker zeigen jetzt den Gewichtsblock und den Hebel der Maschine, und liegende, Kurzhantel- und Band-Beinbeuger werden in Bauchlage gezeigt.",
  "wn.c.coachCalendar.title": "Trainingskalender",
  "wn.c.coachCalendar.body":
    "Plane Trainings und Ruhetage im Monatskalender. Athleten sehen den geplanten Tag unter Heute. Lade Assistenzcoaches zum Bearbeiten eines Kalenders ein und prüfe die Trainingsaktivität deiner Athleten.",
  "wn.c.deleteWorkout.title": "Rückgängig nach dem Löschen eines Trainings",
  "wn.c.deleteWorkout.body":
    "Ein Training aus Versehen gelöscht? Tippe ein paar Sekunden lang auf Rückgängig. Ein gelöschtes Training verschwindet jetzt auch aus Freunde und aus Health Connect oder Apple Health, und alle Werte werden aus dem Rest neu berechnet.",
  "wn.c.landmineEnd.title": "Landmine-Scheiben an einem Ende",
  "wn.c.landmineEnd.body": "Landmine-Übungen und T-Bar-Rudern zeigen die Scheiben am freien Ende, ohne „pro Seite“.",
  "wn.c.gymInsights.title": "Einblicke für Gym-Betreiber",
  "wn.c.sonosVolume.title": "Sonos merkt sich deine Lautstärke und schaltet mit einem Tippen stumm",
  "wn.c.sonosVolume.body":
    "Drehst du die Musik während eines Satzes lauter, wird das deine Satzlautstärke, genauso in der Pause. Tippe auf den Lautsprecher zum Stummschalten und noch einmal, um den Ton zurückzuholen.",
  "wn.c.gymInsights.body":
    "Du betreibst ein Gym auf Liftsmith? Seine Seite zeigt jetzt, wie viele Sportler dort trainieren, die vollen und ruhigen Stunden und die genutzten Geräte, mit einem nächsten Schritt. Nur Summen, nie wer. Schalte Meine Gym-Besuche mitzählen in den Einstellungen aus, wenn du nicht mitzählen willst.",
  "wn.title": "Neuigkeiten",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Version {version}",
  "wn.count.new": { one: "{count} neu", other: "{count} neu" },
  "wn.count.better": { one: "{count} besser", other: "{count} besser" },
  "wn.count.fixed": { one: "{count} behoben", other: "{count} behoben" },
  "wn.kind.new": "Neu",
  "wn.kind.better": "Besser",
  "wn.kind.fixed": "Behoben",
  "wn.go": "Los geht’s",
  "wn.row": "Version",
  "wn.open": "Neuigkeiten",
  "wn.check": "Nach Updates suchen",
  "wn.checking": "Suche…",
  "wn.current": "Du bist auf dem neuesten Stand",
  "wn.install": "Installieren",
  "wn.checkFail": "Prüfung fehlgeschlagen. Versuch es erneut, wenn du online bist.",
  "wn.note": "Neu in {brand}",
  "wn.see": "Alle ansehen",
  "wn.c.seasons.title": "Trainingssaisons",
  "wn.c.seasons.body":
    "Zehnwöchige Saisons mit Abzeichen, Designs und einem App-Symbol, die es nur dann gibt, im Tempo deines eigenen Wochenziels. Jede Stufe ist kostenlos.",
  "wn.c.community.title": "Ideen, Fehler und Roadmap",
  "wn.c.community.body":
    "Community, unter Hilfe in den Einstellungen: Ideen vorschlagen, Fehler melden, abstimmen und jeden Beitrag von Geplant bis Veröffentlicht verfolgen.",
  "wn.c.crew.title": "Club-Chat und Crew-Termine",
  "wn.c.crew.body":
    "Jeder Club hat einen Chat, und bei Crew-Terminen wählst du eine Zeit, sagst zu und bekommst eine Stunde vorher eine Erinnerung.",
  "wn.c.classes.title": "Kursplan deines Studios",
  "wn.c.classes.body":
    "Studios können ihre wöchentlichen Kurse eintragen. Sieh dir die nächsten sieben Tage auf der Seite des Studios an und trag einen in deinen Kalender ein.",
  "wn.c.faults.title": "Häufige Fehler und wie du sie behebst",
  "wn.c.faults.body": "Jede Übung und Dehnung zeigt die häufigsten Fehler und wie du jeden davon behebst.",
  "wn.c.widgets.title": "Widgets Diese Woche und Erholung",
  "wn.c.widgets.body":
    "Zwei neue Widgets für den Startbildschirm: deine Trainings der Woche auf einen Blick und welche Muskeln bereit sind.",
  "wn.c.supersets.title": "Automatische Supersätze",
  "wn.c.supersets.body":
    "Adaptive Trainings können Übungen ohne gemeinsame Muskeln paaren, damit mehr in dieselbe Zeit passt. Schalte es in den Einstellungen ein; jedes Paar sagt, warum.",
  "wn.c.fitTests.title": "Fitnesstests auf einer Skala",
  "wn.c.fitTests.body":
    "Ergebnisse von Hängen, Einbeinstand und Aufstehtest stehen jetzt auf einer farbigen Linie neben dem üblichen Bereich.",
  "wn.c.getReady.title": "Zeit zum Bereitmachen zwischen Dehnungen",
  "wn.c.getReady.body": "Ein kurzer Countdown vor jeder Dehnung und jeder Seite, und der Bildschirm bleibt die ganze Routine über an.",
  "wn.c.machineSteps.title": "Maschinen steigen um 2,5 kg",
  "wn.c.machineSteps.body":
    "Übungen an Maschine und Kabelzug steigen jetzt um 2,5 kg oder 5 lb, bei den Tasten und den vorgeschlagenen Gewichten.",
  "wn.c.figures.title": "Flüssigere 3D-Figuren",
  "wn.c.figures.body":
    "Zieh an einer 3D-Figur, um sie zu drehen, oder gib ihr Schwung. Die Anleitungsfigur bewegt sich auch in der Pause weiter.",
  "wn.c.languages.title": "Zehn Sprachen",
  "wn.c.languages.body":
    "Liftsmith spricht jetzt auch brasilianisches Portugiesisch, Koreanisch, Polnisch und Türkisch, und du kannst die Sprache schon auf dem Begrüßungsbildschirm wählen.",
  "wn.c.checkins.title": "Coach-Check-ins mit Gewicht und Fotos",
  "wn.c.checkins.body":
    "Coaches können in einem Check-in nach deinem Gewicht und Fotos fragen, alle ein, zwei oder vier Wochen, und den Verlauf jeder Antwort sehen.",
  "wn.c.jumps.title": "Sprünge heben ab",
  "wn.c.jumps.body": "Fußgelenksprünge, Sprungkniebeugen und die anderen Sprünge der Anleitungsfiguren verlassen jetzt wirklich den Boden.",
  "wn.c.sides.title": "Einseitige Dehnungen zeigen die richtige Seite",
  "wn.c.sides.body": "Eine Dehnung für eine Seite zeigt jetzt die genannte Seite und wird für die andere gespiegelt.",
  "wn.c.seasonPlan.title": "Fünf neue Trainingssaisons für 2027",
  "wn.c.seasonPlan.body":
    "Sturm, Blüte, Sonnwende, Ahorn und Obsidian folgen auf Glut, eine nach der anderen durch 2027, jede mit eigenen Designs, App-Symbolen, Avataren, seltenen Scheiben und drei eigenen Challenges.",
  "wn.c.pregnancy.title": "Modus für Schwangerschaft und Rückbildung",
  "wn.c.pregnancy.body":
    "Einstellungen › Körper und Einheiten: Sag uns, dass du schwanger bist oder dein Baby da ist, und jedes Training passt zur Woche, mit leichteren Lasten, später in der Schwangerschaft nichts in Rückenlage und einem schrittweisen Wiedereinstieg nach der Geburt.",
  "wn.c.iconBadge.title": "Eine Zahl auf dem App-Symbol",
  "wn.c.iconBadge.body":
    "Sieh, wie viele Nachrichten, Likes, Kommentare und Follower-Anfragen warten, ohne die App zu öffnen. In der App zeigen rote Zahlen bei Freunde und deinem Coach, wo sie sind.",
  "wn.c.formVideos.title": "Technikvideos für deinen Coach",
  "wn.c.formVideos.body":
    "Filme einen Satz in der App und schick ihn deinem Coach oder Physio. Er verlangsamt ihn und heftet Notizen genau an die wichtigen Momente.",
  "wn.c.routineLibrary.title": "Eine Routinen-Bibliothek",
  "wn.c.routineLibrary.body":
    "Finde Routinen, die andere veröffentlicht haben, speichere eine mit einem Tippen und bewerte sie. Deine eigenen veröffentlichst du in ihrem Editor in deinen Routinen.",
  "wn.c.teamSession.title": "Teamtraining für Schultrainer",
  "wn.c.teamSession.body":
    "Schultrainer können ein Training für das ganze Team von einem Tablet aus leiten. Alle tippen auf ihren Namen und tragen ihre Sätze ein, und die Tafel zeigt, wer noch nicht angefangen hat.",
  "wn.c.openNow.title": "Jetzt geöffnet in der Studiosuche",
  "wn.c.openNow.body":
    "Jedes Studio mit Öffnungszeiten zeigt, ob es gerade offen ist und wann es schließt oder öffnet, und der Filter Jetzt geöffnet zeigt nur die offenen.",
  "wn.c.settingsSearch.title": "Einstellungen durchsuchen",
  "wn.c.settingsSearch.body":
    "Tippe oben in den Einstellungen ins Suchfeld, um jede Einstellung zu finden. Sie öffnet sich mit dieser Einstellung im Blick.",
  "wn.c.mapFinder.title": "Studiosuche mit der Karte vorn",
  "wn.c.mapFinder.body": "Die Studiosuche ist jetzt eine große Karte, jedes Studio auf einer durchsichtigen Karte zum Durchwischen.",
  "wn.c.outsideWorkouts.title": "Trainings aus anderen Apps zählen",
  "wn.c.outsideWorkouts.body":
    "Schalte unter Verbundene Apps Trainings aus anderen Apps zählen ein, dann prägen Läufe, Radtouren, Sport und Kurse aus Health deine Erholung und den Plan für morgen.",
  "wn.c.gymChains.title": "Alle Standorte einer Studiokette",
  "wn.c.gymChains.body":
    "Studios einer Kette zeigen ihr Logo und einen Link zu einer Seite mit allen Standorten, die nächsten zuerst, damit du deinen mit einem Tippen findest und hinzufügst.",
  "wn.c.rehabSelf.title": "Sanfte Reha ohne Physiotherapie",
  "wn.c.rehabSelf.body":
    "Du hast eine Verletzung eingetragen? Verletzungen und ein Hinweis des Coaches bieten eine kurze Routine mit dem eigenen Körpergewicht für zu Hause. Es ist ein Anfang, keine Behandlung.",
  "wn.c.rehabShape.title": "Eine Reha-Routine formen",
  "wn.c.rehabShape.body":
    "Physiotherapie kann die Wiederholungen oder die Sekunden jeder Übung und einen kurzen Hinweis im Routine-Editor festlegen. Du folgst ihr so, wie sie geschrieben ist.",
  "wn.c.rehabEnd.title": "Wenn ein Programm zurückgenommen wird",
  "wn.c.rehabEnd.body": "Nimmt deine Physiotherapie ein Programm zurück, fragt Heute, ob du es beendest oder allein weiterführst.",
  "wn.c.campusClubs.title": "Pro für einen aktiven Club",
  "wn.c.campusClubs.body":
    "Leite einen Club, in dem 5 oder mehr Mitglieder, du eingeschlossen, in den letzten 14 Tagen je ein Training beendet haben, und Pro ist kostenlos, solange das so bleibt.",
  "wn.c.voiceAmy.title": "Amy für den Sprachcoach",
  "wn.c.voiceAmy.body":
    "Pro schaltet Amy frei, eine klare englische Stimme in der App. Wähle Amy oder die Telefon-Sprachausgabe unter Einstellungen › Training; Amy fällt auf die Telefonstimme zurück, wenn sie nicht lädt.",
  "wn.c.checkUpdates.title": "In den Einstellungen nach Updates suchen",
  "wn.c.checkUpdates.body":
    "Auf Android und iPhone kannst du unter Einstellungen › Version nach einer neueren App suchen und sie installieren, wenn eine bereit ist.",
  "wn.c.coachRoles.title": "Werkzeuge, die zu deiner Rolle passen",
  "wn.c.coachRoles.body":
    "Wähle Personal Trainer, Sportcoach oder Physio unter Coaching › Setup. Jede Rolle zeigt nur ihre Tools — Sportcoaches starten mit Saisonprogrammen und Teams; Nachrichten bleiben für alle.",
  "wn.c.assignProgram.title": "Saisonprogramm zuweisen",
  "wn.c.assignProgram.body":
    "Coaches setzen Upper/Lower, Push/Pull/Legs oder ihr mehrtägiges Programm für N Wochen auf Klienten oder ein Schulteam. Einmal folgen; Heute zeigt das Training des Wochentags. Ein Kalender zeigt Erledigt und Noch nicht — nur Vornamen bei Schulteams, nie Gewichte.",
};

export const it: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Smetti di fare coaching",
  "wn.c.stopCoach.body":
    "Gli account coach, personal trainer e fisioterapista possono scegliere Smetti di fare coaching in Configurazione. Ruolo, invito attivo e collegamenti come coach vengono rimossi.",
  "wn.c.legCurlWeights.title": "I leg curl mostrano il peso",
  "wn.c.legCurlWeights.body":
    "Le figure guida di leg curl e leg extension ora mostrano il pacco pesi e la leva della macchina, e i curl da sdraiato, con manubrio e con elastico si fanno a pancia in giù.",
  "wn.c.coachCalendar.title": "Calendario degli allenamenti",
  "wn.c.coachCalendar.body":
    "Assegna allenamenti o giorni di riposo sul calendario mensile. Gli atleti vedono il programma del giorno in Oggi. Invita gli assistenti a modificare un calendario e controlla l’attività degli atleti.",
  "wn.c.deleteWorkout.title": "Annulla dopo aver eliminato un allenamento",
  "wn.c.deleteWorkout.body":
    "Hai eliminato un allenamento per sbaglio? Tocca Annulla per qualche secondo. Ora un allenamento eliminato sparisce anche da Amici e da Health Connect o Apple Salute, e tutte le statistiche vengono ricalcolate da ciò che resta.",
  "wn.c.landmineEnd.title": "Dischi del landmine su un'estremità",
  "wn.c.landmineEnd.body": "Gli esercizi al landmine e il T-bar row mostrano i dischi sull'unica estremità libera, senza più «per lato».",
  "wn.c.gymInsights.title": "Dati per i titolari di palestre",
  "wn.c.sonosVolume.title": "Sonos ricorda il tuo volume e si silenzia con un tocco",
  "wn.c.sonosVolume.body":
    "Alza la musica durante una serie e diventa il tuo volume per le serie, lo stesso per il recupero. Tocca l'altoparlante per silenziare e di nuovo per riattivarlo.",
  "wn.c.gymInsights.body":
    "Hai una palestra su Liftsmith? La sua pagina ora mostra quanti atleti si allenano lì, gli orari pieni e tranquilli e l'attrezzatura usata, con un passo successivo. Solo totali, mai chi. Disattiva Conta le mie visite in palestra nelle Impostazioni se preferisci.",
  "wn.title": "Novità",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Versione {version}",
  "wn.count.new": { one: "{count} novità", other: "{count} novità" },
  "wn.count.better": { one: "{count} miglioramento", other: "{count} miglioramenti" },
  "wn.count.fixed": { one: "{count} correzione", other: "{count} correzioni" },
  "wn.kind.new": "Nuovo",
  "wn.kind.better": "Meglio",
  "wn.kind.fixed": "Corretto",
  "wn.go": "Andiamo",
  "wn.row": "Versione",
  "wn.open": "Novità",
  "wn.check": "Cerca aggiornamenti",
  "wn.checking": "Ricerca…",
  "wn.current": "Sei già aggiornato",
  "wn.install": "Installa",
  "wn.checkFail": "Impossibile controllare. Riprova quando sei online.",
  "wn.note": "Novità in {brand}",
  "wn.see": "Vedi tutto",
  "wn.c.seasons.title": "Stagioni di allenamento",
  "wn.c.seasons.body":
    "Stagioni di dieci settimane con badge, temi e un'icona dell'app che si ottengono solo allora, al ritmo del tuo obiettivo settimanale. Ogni livello è gratuito.",
  "wn.c.community.title": "Idee, bug e roadmap",
  "wn.c.community.body":
    "Community, in Aiuto nelle Impostazioni: proponi idee, segnala bug, vota e segui ognuno da Pianificato a Rilasciato.",
  "wn.c.crew.title": "Chat del club e sessioni di gruppo",
  "wn.c.crew.body":
    "Ogni club ha una chat, e le sessioni di gruppo ti fanno scegliere un orario, dire che ci sei e ricevere un promemoria un'ora prima.",
  "wn.c.classes.title": "Orario dei corsi della tua palestra",
  "wn.c.classes.body":
    "Le palestre possono pubblicare i corsi settimanali. Guarda i prossimi sette giorni nella pagina della palestra e aggiungine uno al calendario.",
  "wn.c.faults.title": "Errori comuni e come correggerli",
  "wn.c.faults.body": "Ogni esercizio e allungamento elenca gli errori più frequenti e come correggere ciascuno.",
  "wn.c.widgets.title": "Widget Questa settimana e Recupero",
  "wn.c.widgets.body":
    "Due nuovi widget per la schermata Home: gli allenamenti della settimana a colpo d'occhio e quali muscoli sono pronti.",
  "wn.c.supersets.title": "Superserie automatiche",
  "wn.c.supersets.body":
    "Gli allenamenti adattivi possono abbinare esercizi che non usano gli stessi muscoli, per fare di più nello stesso tempo. Attivalo nelle Impostazioni; ogni coppia dice perché.",
  "wn.c.fitTests.title": "Test di forma su una scala",
  "wn.c.fitTests.body":
    "I risultati di sospensione alla sbarra, equilibrio su una gamba e alzata dalla sedia ora stanno su una linea colorata accanto all'intervallo tipico.",
  "wn.c.getReady.title": "Il tempo di prepararsi tra gli allungamenti",
  "wn.c.getReady.body":
    "Un breve conto alla rovescia prima di ogni allungamento e di ogni lato, e lo schermo resta acceso per tutta la routine.",
  "wn.c.machineSteps.title": "Le macchine salgono di 2,5 kg",
  "wn.c.machineSteps.body": "Gli esercizi alle macchine e ai cavi ora salgono di 2,5 kg o 5 lb, sui pulsanti e nei pesi suggeriti.",
  "wn.c.figures.title": "Figure 3D più fluide",
  "wn.c.figures.body":
    "Trascina una figura 3D per girarla, o dalle una spinta per farla ruotare. La figura dimostrativa continua a muoversi durante il recupero.",
  "wn.c.languages.title": "Dieci lingue",
  "wn.c.languages.body":
    "Liftsmith ora parla anche portoghese brasiliano, coreano, polacco e turco, e puoi scegliere la lingua già dalla schermata di benvenuto.",
  "wn.c.checkins.title": "Check-in del coach con peso e foto",
  "wn.c.checkins.body":
    "Il coach può chiederti il peso e delle foto in un check-in, ogni una, due o quattro settimane, e vedere l'andamento di ogni risposta.",
  "wn.c.jumps.title": "I salti si staccano da terra",
  "wn.c.jumps.body": "Saltelli sulle caviglie, squat jump e gli altri salti delle figure dimostrative ora si staccano davvero da terra.",
  "wn.c.sides.title": "Gli allungamenti di un lato mostrano il lato giusto",
  "wn.c.sides.body": "Un allungamento per un lato ora mostra il lato indicato e si specchia per l'altro.",
  "wn.c.seasonPlan.title": "Cinque nuove stagioni di allenamento per il 2027",
  "wn.c.seasonPlan.body":
    "Tempesta, Fioritura, Solstizio, Acero e Ossidiana seguono Brace una dopo l'altra per tutto il 2027, ognuna con temi, icone, avatar, dischi rari e tre sfide tutte sue.",
  "wn.c.pregnancy.title": "Modalità gravidanza e post-parto",
  "wn.c.pregnancy.body":
    "Impostazioni › Corpo e unità: dicci che sei incinta o che hai avuto il tuo bambino e ogni allenamento si adatta alla settimana, con carichi più leggeri, niente supina a fine gravidanza e un ritorno graduale dopo il parto.",
  "wn.c.iconBadge.title": "Un numero sull'icona dell'app",
  "wn.c.iconBadge.body":
    "Vedi quanti messaggi, mi piace, commenti e richieste di follow ti aspettano senza aprire l'app. Dentro, numeri rossi su Amici e sul tuo coach ti dicono dove sono.",
  "wn.c.formVideos.title": "Video della tecnica per il tuo coach",
  "wn.c.formVideos.body":
    "Riprendi una serie nell'app e inviala al tuo coach o fisioterapista. La rallenta e fissa note nei momenti esatti che contano.",
  "wn.c.routineLibrary.title": "Una libreria di routine",
  "wn.c.routineLibrary.body":
    "Trova le routine pubblicate da altri atleti, salvane una con un tocco e votala. Pubblica le tue dal loro editor nelle tue routine.",
  "wn.c.teamSession.title": "Sessioni di squadra per gli allenatori scolastici",
  "wn.c.teamSession.body":
    "Gli allenatori scolastici possono guidare un allenamento per tutta la squadra da un tablet. Ogni atleta tocca il proprio nome per registrare le serie, e il tabellone mostra chi non ha iniziato.",
  "wn.c.openNow.title": "Aperto ora nella ricerca palestre",
  "wn.c.openNow.body":
    "Ogni palestra con gli orari dice se è aperta ora e quando chiude o apre, e il filtro Aperto ora mostra solo quelle aperte.",
  "wn.c.settingsSearch.title": "Cerca nelle impostazioni",
  "wn.c.settingsSearch.body":
    "Scrivi nella casella in cima a Impostazioni per trovare qualsiasi impostazione: si apre con quell'impostazione in vista.",
  "wn.c.mapFinder.title": "Ricerca palestre con la mappa in primo piano",
  "wn.c.mapFinder.body": "La ricerca palestre ora è una grande mappa, con ogni palestra su una scheda trasparente da scorrere.",
  "wn.c.outsideWorkouts.title": "Contano gli allenamenti di altre app",
  "wn.c.outsideWorkouts.body":
    "Attiva Conta gli allenamenti di altre app in App collegate: corse, bici, sport e corsi da Salute regolano il tuo recupero e il piano di domani.",
  "wn.c.gymChains.title": "Tutte le sedi di una catena",
  "wn.c.gymChains.body":
    "Le palestre di una catena mostrano il suo logo e un link a una pagina con tutte le sedi, prima le più vicine, così trovi e aggiungi la tua con un tocco.",
  "wn.c.rehabSelf.title": "Riabilitazione leggera senza fisioterapista",
  "wn.c.rehabSelf.body":
    "Hai registrato un infortunio? Infortuni e una nota del coach offrono una breve routine a corpo libero da fare a casa. È un punto di partenza, non una cura.",
  "wn.c.rehabShape.title": "Dai forma a una routine di riabilitazione",
  "wn.c.rehabShape.body":
    "I fisioterapisti possono fissare le ripetizioni o i secondi di ogni esercizio, e un breve spunto, nell’editor delle routine. La segui così com’è scritta.",
  "wn.c.rehabEnd.title": "Quando un programma viene ritirato",
  "wn.c.rehabEnd.body": "Se il tuo fisioterapista ritira un programma, Oggi ti chiede di fermarlo o di continuarlo per conto tuo.",
  "wn.c.campusClubs.title": "Pro per un club attivo",
  "wn.c.campusClubs.body":
    "Guida un club in cui 5 o più membri, tu compreso, finiscono ciascuno un allenamento negli ultimi 14 giorni, e Pro è gratis finché resta così.",
  "wn.c.voiceAmy.title": "Amy per il coach vocale",
  "wn.c.voiceAmy.body":
    "Pro sblocca Amy, una voce inglese chiara inclusa nell’app. Scegli Amy o la sintesi del telefono in Impostazioni › Allenamento; Amy torna alla voce del telefono se non si carica.",
  "wn.c.checkUpdates.title": "Cerca aggiornamenti in Impostazioni",
  "wn.c.checkUpdates.body":
    "Su Android e iPhone, Impostazioni › Versione ti permette di cercare un'app più recente e installarla quando è pronta.",
  "wn.c.coachRoles.title": "Strumenti adatti a come alleni",
  "wn.c.coachRoles.body":
    "Scegli personal trainer, coach sportivo o fisio in Coaching › Setup. Ogni ruolo mostra solo i suoi strumenti: i coach sportivi partono da programmi di stagione e squadre; i messaggi restano per tutti.",
  "wn.c.assignProgram.title": "Assegna un programma di stagione",
  "wn.c.assignProgram.body":
    "I coach mettono Upper/Lower, Push/Pull/Legs o il loro programma di più giorni su clienti o una squadra scolastica per N settimane. Seguono una volta; Oggi mostra l’allenamento del giorno. Un calendario mostra Fatto e Non ancora — solo nomi per le squadre scolastiche, mai i pesi.",
};

export const ja: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "コーチングをやめる",
  "wn.c.stopCoach.body":
    "コーチ、パーソナルトレーナー、理学療法士のアカウントは設定からコーチングを終了できます。役割、有効な招待、コーチとしてのリンクが削除されます。",
  "wn.c.legCurlWeights.title": "レッグカールに重りを表示",
  "wn.c.legCurlWeights.body":
    "レッグカールとレッグエクステンションの見本の人形に、マシンのウェイトスタックとレバーが表示されるようになりました。ライイング、ダンベル、バンドのレッグカールはうつ伏せで表示されます。",
  "wn.c.coachCalendar.title": "トレーニングカレンダー",
  "wn.c.coachCalendar.body":
    "月間カレンダーでトレーニングや休養日を設定できます。選手は「今日」でその日の予定を確認できます。アシスタントコーチをカレンダー編集に招待し、選手のトレーニング記録を確認できます。",
  "wn.c.deleteWorkout.title": "ワークアウト削除の取り消し",
  "wn.c.deleteWorkout.body":
    "間違えて削除しても、数秒間は「元に戻す」をタップできます。削除したワークアウトは友達のフィードやヘルスコネクト、Apple ヘルスケアからも消え、統計はすべて残りのデータから計算し直されます。",
  "wn.c.landmineEnd.title": "ランドマインのプレートは片端に",
  "wn.c.landmineEnd.body": "ランドマイン種目とTバーロウは、空いている片端だけにプレートを表示し、「片側」と言わなくなりました。",
  "wn.c.gymInsights.title": "ジムオーナー向けの分析",
  "wn.c.sonosVolume.title": "Sonosが音量を覚え、タップでミュート",
  "wn.c.sonosVolume.body":
    "セット中に音量を上げると、それがセットの音量になります。休憩中も同じです。スピーカーをタップするとミュート、もう一度で元に戻ります。",
  "wn.c.gymInsights.body":
    "Liftsmithでジムを運営していますか？ジムのページに、利用者数、混む時間と空いている時間、使われた器具が、次の一手とともに表示されます。合計のみで、誰かは表示されません。数えられたくない場合は設定の「ジムへの来館を数える」をオフに。",
  "wn.title": "新機能",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "バージョン {version}",
  "wn.count.new": { other: "新機能 {count}件" },
  "wn.count.better": { other: "改善 {count}件" },
  "wn.count.fixed": { other: "修正 {count}件" },
  "wn.kind.new": "新機能",
  "wn.kind.better": "改善",
  "wn.kind.fixed": "修正",
  "wn.go": "はじめる",
  "wn.row": "バージョン",
  "wn.open": "新機能",
  "wn.check": "アップデートを確認",
  "wn.checking": "確認中…",
  "wn.current": "最新です",
  "wn.install": "インストール",
  "wn.checkFail": "確認できませんでした。オンラインのときに再試行してください。",
  "wn.note": "{brand}の新機能",
  "wn.see": "すべて見る",
  "wn.c.seasons.title": "トレーニングシーズン",
  "wn.c.seasons.body":
    "10週間のシーズンで、その期間だけ手に入るバッジ、テーマ、アプリアイコンを獲得できます。ペースは自分の週間目標に合わせて決まり、すべてのティアが無料です。",
  "wn.c.community.title": "アイデア、不具合、ロードマップ",
  "wn.c.community.body":
    "設定のヘルプにあるコミュニティで、アイデアの提案、不具合の報告、投票ができ、それぞれが「予定」から「リリース済み」になるまで追えます。",
  "wn.c.crew.title": "クラブチャットとクルーセッション",
  "wn.c.crew.body": "どのクラブにもチャットがあり、クルーセッションでは時間を決めて参加を伝えると、1時間前にリマインダーが届きます。",
  "wn.c.classes.title": "ジムのクラススケジュール",
  "wn.c.classes.body": "ジムが毎週のクラスを掲載できるようになりました。ジムのページで今後7日間を確認し、カレンダーに追加できます。",
  "wn.c.faults.title": "よくある間違いと直し方",
  "wn.c.faults.body": "すべての種目とストレッチに、よくある間違いとそれぞれの直し方が載りました。",
  "wn.c.widgets.title": "今週と回復のウィジェット",
  "wn.c.widgets.body": "ホーム画面に新しいウィジェットが2つ。今週のワークアウトがひと目でわかり、どの筋肉が回復しているかもわかります。",
  "wn.c.supersets.title": "自動スーパーセット",
  "wn.c.supersets.body":
    "アダプティブワークアウトで、使う筋肉が重ならない種目をペアにして、同じ時間でより多くこなせます。設定でオンにでき、各ペアに理由が表示されます。",
  "wn.c.fitTests.title": "体力テストを数直線で表示",
  "wn.c.fitTests.body": "ぶら下がり、片脚立ち、椅子立ち上がりの結果を、一般的な範囲と並べて色付きの線の上に表示します。",
  "wn.c.getReady.title": "ストレッチの間に準備時間",
  "wn.c.getReady.body": "各ストレッチと左右それぞれの前に短いカウントダウンが入り、ルーティン中は画面がつきっぱなしになります。",
  "wn.c.machineSteps.title": "マシンは2.5 kgずつ",
  "wn.c.machineSteps.body": "マシンとケーブルの種目は、ボタンでも提案重量でも2.5 kg(5 lb)ずつ上がるようになりました。",
  "wn.c.figures.title": "なめらかな3Dフィギュア",
  "wn.c.figures.body": "3Dフィギュアはドラッグで回転し、はじくと回り続けます。お手本のフィギュアは休憩中も動き続けます。",
  "wn.c.languages.title": "10言語に対応",
  "wn.c.languages.body":
    "Liftsmithはブラジルポルトガル語、韓国語、ポーランド語、トルコ語にも対応し、ようこそ画面で言語を選べるようになりました。",
  "wn.c.checkins.title": "体重と写真つきのコーチチェックイン",
  "wn.c.checkins.body": "コーチはチェックインで体重と写真を1週、2週、4週ごとに尋ねられ、それぞれの回答の推移を確認できます。",
  "wn.c.jumps.title": "ジャンプがしっかり床を離れる",
  "wn.c.jumps.body": "アンクルホップ、スクワットジャンプなど、お手本フィギュアのジャンプが本当に床から離れるようになりました。",
  "wn.c.sides.title": "片側ストレッチが正しい側を表示",
  "wn.c.sides.body": "片側のストレッチは名前どおりの側を表示し、反対側では左右反転します。",
  "wn.c.seasonPlan.title": "2027年の新しいトレーニングシーズン5つ",
  "wn.c.seasonPlan.body":
    "テンペスト、ブルーム、ソルスティス、メープル、オブシディアンがエンバーに続いて2027年を通して開催。それぞれ専用のテーマ、アプリアイコン、アバター、レアプレート、3つのチャレンジがあります。",
  "wn.c.pregnancy.title": "妊娠中・産後モード",
  "wn.c.pregnancy.body":
    "設定 › 体と単位：妊娠中または出産後であることを伝えると、毎回のトレーニングがその週に合わせて変わります。重量を軽くし、妊娠後期は仰向けの種目をなくし、産後は少しずつ戻します。",
  "wn.c.iconBadge.title": "アプリアイコンに数字",
  "wn.c.iconBadge.body":
    "アプリを開かなくても、届いているメッセージ、いいね、コメント、フォローリクエストの数がわかります。アプリ内では「フレンド」とコーチの赤い数字で場所がわかります。",
  "wn.c.formVideos.title": "コーチにフォーム動画を",
  "wn.c.formVideos.body":
    "アプリでセットを撮影してコーチや理学療法士に送れます。スロー再生して、大事な瞬間にピンポイントでメモを付けてくれます。",
  "wn.c.routineLibrary.title": "ルーティンライブラリ",
  "wn.c.routineLibrary.body":
    "ほかのリフターが公開したルーティンを探して、ワンタップで保存して評価できます。自分のルーティンは編集画面から公開できます。",
  "wn.c.teamSession.title": "学校のコーチ向けチームセッション",
  "wn.c.teamSession.body":
    "高校のコーチがタブレット1台でチーム全員の練習を進められます。選手は名前をタップしてセットを記録し、ボードでまだ始めていない人がわかります。",
  "wn.c.openNow.title": "ジム検索に「営業中」",
  "wn.c.openNow.body":
    "営業時間のあるジムは、今開いているか、いつ閉まるか開くかを表示します。「営業中」チップで開いているジムだけを表示できます。",
  "wn.c.settingsSearch.title": "設定を検索",
  "wn.c.settingsSearch.body": "設定画面の上の検索ボックスに入力すると、どの設定でも見つかり、その設定が見える位置で開きます。",
  "wn.c.mapFinder.title": "地図が主役のジム検索",
  "wn.c.mapFinder.body": "ジム検索が大きな地図になり、各ジムは透けて見えるカードでスワイプして選べます。",
  "wn.c.outsideWorkouts.title": "他のアプリのワークアウトも反映",
  "wn.c.outsideWorkouts.body":
    "連携アプリで「他のアプリのワークアウトを反映」をオンにすると、ヘルスケアのランニング、サイクリング、スポーツ、クラスが回復と明日のプランに反映されます。",
  "wn.c.gymChains.title": "ジムチェーンの全店舗",
  "wn.c.gymChains.body":
    "チェーンのジムにはロゴと全店舗のページへのリンクが表示されます。近い順に並ぶので、自分の店舗をタップひとつで見つけて追加できます。",
  "wn.c.rehabSelf.title": "理学療法士がいなくても、やさしいリハビリ",
  "wn.c.rehabSelf.body":
    "ケガを記録しましたか。ケガの画面とコーチのメモが、家でできる短い自重ルーティンを提案します。出発点であり、治療ではありません。",
  "wn.c.rehabShape.title": "リハビリルーティンを形にする",
  "wn.c.rehabShape.body": "理学療法士はルーティン編集で、各種目の回数か秒数と短いキューを決められます。書かれたとおりに進めます。",
  "wn.c.rehabEnd.title": "プログラムが取り下げられたとき",
  "wn.c.rehabEnd.body": "理学療法士がプログラムを取り下げると、「今日」で止めるか自分で続けるかを選べます。",
  "wn.c.campusClubs.title": "活発なクラブにPro",
  "wn.c.campusClubs.body":
    "自分を含めてメンバー5人以上が、それぞれ直近14日以内にワークアウトを終えているクラブを運営しているあいだ、Proが無料です。",
  "wn.c.voiceAmy.title": "音声コーチのAmy",
  "wn.c.voiceAmy.body":
    "ProでAmyが使えます。アプリ内蔵の明瞭な英語ボイスです。設定 › ワークアウトでAmyか端末の音声を選べ、Amyが使えないときは端末の声に戻ります。",
  "wn.c.checkUpdates.title": "設定でアップデートを確認",
  "wn.c.checkUpdates.body": "AndroidとiPhoneでは、設定 › バージョンから新しいアプリを確認し、準備ができたらインストールできます。",
  "wn.c.coachRoles.title": "役割に合うツール",
  "wn.c.coachRoles.body":
    "コーチング › 設定でパーソナルトレーナー、スポーツコーチ、理学療法士を選べます。役割ごとのツールだけが表示され、スポーツコーチはシーズンプログラムとチームが先。メッセージはどの役割でも使えます。",
  "wn.c.assignProgram.title": "シーズンプログラムを割り当て",
  "wn.c.assignProgram.body":
    "コーチが Upper/Lower、Push/Pull/Legs、または自作の複数日プログラムをクライアントや学校チームに N 週間割り当てます。一度フォローすれば、今日にその曜日のワークアウトが出ます。カレンダーで完了／まだが分かり、学校チームは下の名前のみ、重量は出しません。",
};

export const pt: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Parar de fazer coaching",
  "wn.c.stopCoach.body":
    "Contas de coach, personal trainer e fisioterapeuta podem escolher Parar de fazer coaching nas configurações. O papel, o convite ativo e os links como coach serão removidos.",
  "wn.c.legCurlWeights.title": "Os flexores mostram o peso",
  "wn.c.legCurlWeights.body":
    "As figuras de como fazer da mesa flexora e da cadeira extensora agora mostram a pilha de pesos e a alavanca da máquina, e as flexões deitado, com halter e com elástico são feitas de bruços.",
  "wn.c.coachCalendar.title": "Calendário de treinos",
  "wn.c.coachCalendar.body":
    "Atribua treinos ou dias de descanso no calendário mensal. Os atletas veem a programação do dia em Hoje. Convide treinadores assistentes para editar um calendário e confira a atividade dos atletas.",
  "wn.c.deleteWorkout.title": "Desfazer ao excluir um treino",
  "wn.c.deleteWorkout.body":
    "Excluiu um treino sem querer? Toque em Desfazer por alguns segundos. Agora um treino excluído também sai de Amigos e do Health Connect ou Apple Saúde, e todas as estatísticas são recalculadas com o que sobrou.",
  "wn.c.landmineEnd.title": "Anilhas do landmine em uma ponta",
  "wn.c.landmineEnd.body": "Exercícios no landmine e a remada cavalinho mostram as anilhas na única ponta livre, sem dizer de cada lado.",
  "wn.c.gymInsights.title": "Dados para donos de academia",
  "wn.c.sonosVolume.title": "O Sonos guarda seu volume e silencia com um toque",
  "wn.c.sonosVolume.body":
    "Aumente a música durante uma série e esse vira seu volume de série; o mesmo no descanso. Toque no alto-falante para silenciar e de novo para voltar.",
  "wn.c.gymInsights.body":
    "Tem uma academia no Liftsmith? A página dela agora mostra quantos atletas treinam lá, os horários cheios e tranquilos e os equipamentos usados, com um próximo passo. Só totais, nunca quem. Desative Contar minhas visitas à academia em Ajustes se preferir não contar.",
  "wn.title": "Novidades",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Versão {version}",
  "wn.count.new": { one: "{count} novidade", other: "{count} novidades" },
  "wn.count.better": { one: "{count} melhoria", other: "{count} melhorias" },
  "wn.count.fixed": { one: "{count} correção", other: "{count} correções" },
  "wn.kind.new": "Novo",
  "wn.kind.better": "Melhor",
  "wn.kind.fixed": "Corrigido",
  "wn.go": "Bora!",
  "wn.row": "Versão",
  "wn.open": "Novidades",
  "wn.check": "Verificar atualizações",
  "wn.checking": "Verificando…",
  "wn.current": "Você está em dia",
  "wn.install": "Instalar",
  "wn.checkFail": "Não foi possível verificar. Tente de novo quando estiver online.",
  "wn.note": "Novidades no {brand}",
  "wn.see": "Ver tudo",
  "wn.c.seasons.title": "Temporadas de treino",
  "wn.c.seasons.body":
    "Temporadas de dez semanas com emblemas, temas e um ícone do app que só dá para ganhar nelas, no ritmo da sua meta semanal. Todos os níveis são grátis.",
  "wn.c.community.title": "Ideias, bugs e roadmap",
  "wn.c.community.body": "Comunidade, em Ajuda nos Ajustes: sugira ideias, relate bugs, vote e acompanhe cada um de Planejado a Lançado.",
  "wn.c.crew.title": "Chat do clube e sessões em grupo",
  "wn.c.crew.body":
    "Todo clube tem um chat, e as sessões em grupo deixam você escolher um horário, confirmar presença e receber um lembrete uma hora antes.",
  "wn.c.classes.title": "Horário das aulas da sua academia",
  "wn.c.classes.body":
    "As academias podem publicar as aulas da semana. Veja os próximos sete dias na página da academia e adicione uma à sua agenda.",
  "wn.c.faults.title": "Erros comuns e como corrigi-los",
  "wn.c.faults.body": "Cada exercício e alongamento mostra os erros mais comuns e como corrigir cada um.",
  "wn.c.widgets.title": "Widgets Esta semana e Recuperação",
  "wn.c.widgets.body": "Dois novos widgets para a tela inicial: os treinos da semana de relance e quais músculos estão prontos.",
  "wn.c.supersets.title": "Supersets automáticos",
  "wn.c.supersets.body":
    "Os treinos adaptativos podem juntar exercícios que não usam os mesmos músculos, para caber mais no mesmo tempo. Ative nos Ajustes; cada par explica o porquê.",
  "wn.c.fitTests.title": "Testes físicos numa escala",
  "wn.c.fitTests.body":
    "Os resultados de suspensão na barra, equilíbrio numa perna e levantar da cadeira agora aparecem numa linha colorida ao lado da faixa típica.",
  "wn.c.getReady.title": "Tempo para se preparar entre alongamentos",
  "wn.c.getReady.body": "Uma contagem curta antes de cada alongamento e de cada lado, e a tela fica ligada durante toda a rotina.",
  "wn.c.machineSteps.title": "Máquinas sobem de 2,5 kg em 2,5 kg",
  "wn.c.machineSteps.body": "Exercícios em máquina e polia agora sobem 2,5 kg ou 5 lb, nos botões e nos pesos sugeridos.",
  "wn.c.figures.title": "Figuras 3D mais suaves",
  "wn.c.figures.body":
    "Arraste qualquer figura 3D para girá-la, ou dê um impulso para ela rodar. A figura de demonstração continua se mexendo no descanso.",
  "wn.c.languages.title": "Dez idiomas",
  "wn.c.languages.body":
    "O Liftsmith agora também fala português do Brasil, coreano, polonês e turco, e você pode escolher o idioma na tela de boas-vindas.",
  "wn.c.checkins.title": "Check-ins do treinador com peso e fotos",
  "wn.c.checkins.body":
    "O treinador pode pedir seu peso e fotos num check-in, a cada uma, duas ou quatro semanas, e ver a tendência de cada resposta.",
  "wn.c.jumps.title": "Os saltos saem do chão",
  "wn.c.jumps.body": "Saltitos de tornozelo, agachamentos com salto e os outros saltos das figuras agora saem mesmo do chão.",
  "wn.c.sides.title": "Alongamentos de um lado mostram o lado certo",
  "wn.c.sides.body": "Um alongamento de um lado agora mostra o lado indicado e espelha para o outro.",
  "wn.c.seasonPlan.title": "Cinco novas temporadas de treino para 2027",
  "wn.c.seasonPlan.body":
    "Tempestade, Florada, Solstício, Bordo e Obsidiana seguem a Brasa uma após a outra em 2027, cada uma com seus temas, ícones, avatares, anilhas raras e três desafios próprios.",
  "wn.c.pregnancy.title": "Modo gravidez e pós-parto",
  "wn.c.pregnancy.body":
    "Ajustes › Corpo e unidades: conte que você está grávida ou já teve seu bebê e cada treino se ajusta à semana, com cargas mais leves, nada de costas no fim da gravidez e uma volta gradual depois do parto.",
  "wn.c.iconBadge.title": "Um número no ícone do app",
  "wn.c.iconBadge.body":
    "Veja quantas mensagens, curtidas, comentários e pedidos para seguir estão esperando sem abrir o app. Dentro dele, números vermelhos em Amigos e no seu treinador mostram onde estão.",
  "wn.c.formVideos.title": "Vídeos de execução para o seu treinador",
  "wn.c.formVideos.body":
    "Grave uma série no app e envie ao seu treinador ou fisio. Ele vê em câmera lenta e fixa notas nos momentos exatos que importam.",
  "wn.c.routineLibrary.title": "Uma biblioteca de rotinas",
  "wn.c.routineLibrary.body":
    "Encontre rotinas que outros atletas publicaram, salve uma com um toque e avalie. Publique as suas pelo editor delas nas suas rotinas.",
  "wn.c.teamSession.title": "Sessões do time para técnicos escolares",
  "wn.c.teamSession.body":
    "Técnicos do ensino médio podem conduzir um treino para o time todo em um tablet. Cada atleta toca no nome para registrar as séries, e o painel mostra quem não começou.",
  "wn.c.openNow.title": "Aberto agora na busca de academias",
  "wn.c.openNow.body":
    "Cada academia com horário mostra se está aberta agora e quando fecha ou abre, e o filtro Aberto agora mostra só as abertas.",
  "wn.c.settingsSearch.title": "Busque nas configurações",
  "wn.c.settingsSearch.body": "Digite na caixa no topo das Configurações para achar qualquer ajuste, que abre já com ele à vista.",
  "wn.c.mapFinder.title": "Busca de academias com o mapa em primeiro lugar",
  "wn.c.mapFinder.body": "A busca de academias agora é um mapa grande, com cada academia em um cartão transparente para deslizar.",
  "wn.c.outsideWorkouts.title": "Treinos de outros apps contam",
  "wn.c.outsideWorkouts.body":
    "Ligue Contar treinos de outros apps em Apps conectados e corridas, pedais, esportes e aulas do Saúde ajustam sua recuperação e o plano de amanhã.",
  "wn.c.gymChains.title": "Todas as unidades de uma rede",
  "wn.c.gymChains.body":
    "Academias de uma rede mostram o logo dela e um link para uma página com todas as unidades, as mais próximas primeiro, para você achar e adicionar a sua com um toque.",
  "wn.c.rehabSelf.title": "Reabilitação leve sem fisioterapeuta",
  "wn.c.rehabSelf.body":
    "Registrou uma lesão? Lesões e uma nota do coach oferecem uma rotina curta com o peso do corpo para fazer em casa. É um ponto de partida, não um tratamento.",
  "wn.c.rehabShape.title": "Modele uma rotina de reabilitação",
  "wn.c.rehabShape.body":
    "Fisioterapeutas podem definir as repetições ou os segundos de cada exercício, e uma dica curta, no editor de rotinas. Você segue como está escrito.",
  "wn.c.rehabEnd.title": "Quando um programa é retirado",
  "wn.c.rehabEnd.body": "Se o seu fisioterapeuta retira um programa, Hoje pergunta se você para ou continua por conta própria.",
  "wn.c.campusClubs.title": "Pro para um clube ativo",
  "wn.c.campusClubs.body":
    "Lidere um clube em que 5 ou mais membros, você incluído, terminem cada um um treino nos últimos 14 dias, e o Pro fica grátis enquanto isso continuar.",
  "wn.c.voiceAmy.title": "Amy no coach por voz",
  "wn.c.voiceAmy.body":
    "O Pro liberta a Amy, uma voz inglesa clara na app. Escolha Amy ou a síntese do telemóvel em Definições › Treino; a Amy volta à voz do telemóvel se não carregar.",
  "wn.c.checkUpdates.title": "Verificar atualizações em Ajustes",
  "wn.c.checkUpdates.body":
    "No Android e no iPhone, Ajustes › Versão deixa você procurar um app mais novo e instalá-lo quando estiver pronto.",
  "wn.c.coachRoles.title": "Ferramentas que combinam com como você treina",
  "wn.c.coachRoles.body":
    "Escolha personal trainer, coach esportivo ou fisio em Coaching › Ajustes. Cada papel mostra só as suas ferramentas — coaches esportivos começam por programas de temporada e equipes; as mensagens ficam para todos.",
  "wn.c.assignProgram.title": "Atribuir um programa de temporada",
  "wn.c.assignProgram.body":
    "Os treinadores põem Upper/Lower, Push/Pull/Legs ou o seu programa de vários dias em clientes ou numa equipa escolar por N semanas. Seguem uma vez; Hoje mostra o treino desse dia. Um calendário mostra Feito e Ainda não — só primeiros nomes em equipas escolares, nunca pesos.",
};

export const ko: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "코칭 종료",
  "wn.c.stopCoach.body":
    "코치, 퍼스널 트레이너, 물리치료사 계정은 설정에서 코칭 종료를 선택할 수 있습니다. 역할, 활성 초대와 코치 링크가 제거됩니다.",
  "wn.c.legCurlWeights.title": "레그 컬에 무게 표시",
  "wn.c.legCurlWeights.body":
    "레그 컬과 레그 익스텐션의 동작 안내 인형에 이제 머신의 웨이트 스택과 레버가 보입니다. 라잉, 덤벨, 밴드 레그 컬은 엎드린 자세로 보입니다.",
  "wn.c.coachCalendar.title": "운동 캘린더",
  "wn.c.coachCalendar.body":
    "월간 캘린더에서 운동이나 휴식일을 배정하세요. 선수는 오늘 화면에서 일정을 확인할 수 있습니다. 보조 코치를 초대해 캘린더를 편집하게 하고 선수들의 운동 활동을 확인하세요.",
  "wn.c.deleteWorkout.title": "운동 삭제 실행 취소",
  "wn.c.deleteWorkout.body":
    "실수로 운동을 삭제했나요? 몇 초 동안 실행 취소를 누를 수 있어요. 이제 삭제한 운동은 친구 피드와 헬스 커넥트나 Apple 건강에서도 사라지고, 모든 통계는 남은 기록으로 다시 계산돼요.",
  "wn.c.landmineEnd.title": "랜드마인 원판은 한쪽 끝에",
  "wn.c.landmineEnd.body": "랜드마인 운동과 T바 로우는 비어 있는 한쪽 끝에만 원판을 보여 주고, 더 이상 한쪽당이라고 하지 않아요.",
  "wn.c.gymInsights.title": "체육관 운영자를 위한 인사이트",
  "wn.c.sonosVolume.title": "Sonos가 볼륨을 기억하고 한 번에 음소거",
  "wn.c.sonosVolume.body":
    "세트 중에 볼륨을 올리면 그게 세트 볼륨이 됩니다. 휴식도 마찬가지예요. 스피커를 탭하면 음소거, 다시 탭하면 돌아옵니다.",
  "wn.c.gymInsights.body":
    "Liftsmith에 체육관이 있나요? 이제 체육관 페이지에 이용자 수, 붐비는 시간과 한산한 시간, 사용된 기구가 다음 할 일과 함께 표시됩니다. 합계만 보이고 누구인지는 보이지 않습니다. 집계를 원하지 않으면 설정에서 내 체육관 방문 집계를 끄세요.",
  "wn.title": "새로운 기능",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "버전 {version}",
  "wn.count.new": { other: "새 기능 {count}개" },
  "wn.count.better": { other: "개선 {count}개" },
  "wn.count.fixed": { other: "수정 {count}개" },
  "wn.kind.new": "새 기능",
  "wn.kind.better": "개선",
  "wn.kind.fixed": "수정",
  "wn.go": "시작하기",
  "wn.row": "버전",
  "wn.open": "새로운 기능",
  "wn.check": "업데이트 확인",
  "wn.checking": "확인 중…",
  "wn.current": "최신 버전이에요",
  "wn.install": "설치",
  "wn.checkFail": "확인할 수 없어요. 온라인일 때 다시 시도하세요.",
  "wn.note": "{brand}의 새로운 기능",
  "wn.see": "모두 보기",
  "wn.c.seasons.title": "트레이닝 시즌",
  "wn.c.seasons.body":
    "10주 시즌 동안만 얻을 수 있는 배지, 테마, 앱 아이콘이 있으며, 진행 속도는 나의 주간 목표에 맞춰집니다. 모든 단계가 무료입니다.",
  "wn.c.community.title": "아이디어, 버그, 로드맵",
  "wn.c.community.body":
    "설정의 도움말에 있는 커뮤니티에서 아이디어를 제안하고, 버그를 신고하고, 투표하고, 각 항목이 계획됨에서 출시됨까지 가는 과정을 볼 수 있습니다.",
  "wn.c.crew.title": "클럽 채팅과 크루 세션",
  "wn.c.crew.body": "모든 클럽에 채팅이 있고, 크루 세션에서 시간을 정해 참여를 알리면 한 시간 전에 알림을 받습니다.",
  "wn.c.classes.title": "내 헬스장의 수업 시간표",
  "wn.c.classes.body": "헬스장이 매주 수업을 올릴 수 있습니다. 헬스장 페이지에서 앞으로 7일을 확인하고 원하는 수업을 캘린더에 추가하세요.",
  "wn.c.faults.title": "흔한 실수와 고치는 법",
  "wn.c.faults.body": "모든 운동과 스트레칭에 가장 흔한 실수와 각각을 고치는 방법이 나옵니다.",
  "wn.c.widgets.title": "이번 주와 회복 위젯",
  "wn.c.widgets.body": "홈 화면용 새 위젯 2개: 이번 주 운동을 한눈에, 그리고 어떤 근육이 준비됐는지 보여 줍니다.",
  "wn.c.supersets.title": "자동 슈퍼세트",
  "wn.c.supersets.body":
    "적응형 운동이 같은 근육을 쓰지 않는 운동을 짝지어 같은 시간에 더 많이 할 수 있게 합니다. 설정에서 켤 수 있고, 각 짝마다 이유가 표시됩니다.",
  "wn.c.fitTests.title": "수직선으로 보는 체력 테스트",
  "wn.c.fitTests.body": "매달리기, 한 발 서기, 의자 일어서기 결과가 일반적인 범위와 함께 색깔 있는 선 위에 표시됩니다.",
  "wn.c.getReady.title": "스트레칭 사이 준비 시간",
  "wn.c.getReady.body": "각 스트레칭과 양쪽 각각의 시작 전에 짧은 카운트다운이 나오고, 루틴 내내 화면이 켜져 있습니다.",
  "wn.c.machineSteps.title": "머신은 2.5 kg씩",
  "wn.c.machineSteps.body": "머신과 케이블 운동이 버튼과 추천 무게 모두에서 2.5 kg(5 lb)씩 올라갑니다.",
  "wn.c.figures.title": "더 부드러운 3D 피규어",
  "wn.c.figures.body": "3D 피규어를 드래그해 돌리거나 튕겨서 회전시킬 수 있습니다. 동작 안내 피규어는 휴식 중에도 계속 움직입니다.",
  "wn.c.languages.title": "10개 언어",
  "wn.c.languages.body":
    "Liftsmith가 이제 브라질 포르투갈어, 한국어, 폴란드어, 튀르키예어도 지원하며, 시작 화면에서 언어를 고를 수 있습니다.",
  "wn.c.checkins.title": "체중과 사진이 있는 코치 체크인",
  "wn.c.checkins.body": "코치가 체크인에서 1주, 2주, 4주마다 체중과 사진을 요청하고 각 답변의 추세를 볼 수 있습니다.",
  "wn.c.jumps.title": "점프가 바닥을 떠나요",
  "wn.c.jumps.body": "앵클 홉, 스쿼트 점프 등 동작 안내 피규어의 점프가 이제 정말로 바닥에서 뜹니다.",
  "wn.c.sides.title": "한쪽 스트레칭이 맞는 쪽을 보여 줘요",
  "wn.c.sides.body": "한쪽 스트레칭은 이름에 있는 쪽을 보여 주고, 반대쪽은 좌우를 뒤집어 보여 줍니다.",
  "wn.c.seasonPlan.title": "2027년 새 트레이닝 시즌 5개",
  "wn.c.seasonPlan.body":
    "템페스트, 블룸, 솔스티스, 메이플, 옵시디언이 엠버에 이어 2027년 내내 차례로 열려요. 시즌마다 고유한 테마, 앱 아이콘, 아바타, 희귀 원판, 챌린지 3개가 있어요.",
  "wn.c.pregnancy.title": "임신·산후 모드",
  "wn.c.pregnancy.body":
    "설정 › 몸과 단위: 임신 중이거나 출산했다고 알려 주면 매 운동이 그 주에 맞게 바뀌어요. 무게는 가볍게, 임신 후기에는 바로 누운 자세 없이, 출산 후에는 천천히 돌아가요.",
  "wn.c.iconBadge.title": "앱 아이콘에 숫자",
  "wn.c.iconBadge.body":
    "앱을 열지 않아도 기다리는 메시지, 좋아요, 댓글, 팔로우 요청 수를 볼 수 있습니다. 앱 안에서는 친구와 코치의 빨간 숫자가 어디에 있는지 알려 줍니다.",
  "wn.c.formVideos.title": "코치에게 자세 영상을",
  "wn.c.formVideos.body": "앱에서 세트를 촬영해 코치나 물리치료사에게 보내세요. 느리게 돌려 보며 중요한 순간에 정확히 메모를 남겨 줘요.",
  "wn.c.routineLibrary.title": "루틴 라이브러리",
  "wn.c.routineLibrary.body": "다른 리프터가 공개한 루틴을 찾아 한 번에 저장하고 평가하세요. 내 루틴은 편집 화면에서 공개할 수 있어요.",
  "wn.c.teamSession.title": "학교 코치를 위한 팀 세션",
  "wn.c.teamSession.body":
    "고등학교 코치가 태블릿 하나로 팀 전체의 운동을 진행할 수 있습니다. 선수는 이름을 눌러 세트를 기록하고, 보드에서 아직 시작하지 않은 사람을 볼 수 있습니다.",
  "wn.c.openNow.title": "헬스장 찾기에 '영업 중'",
  "wn.c.openNow.body": "영업시간이 있는 헬스장은 지금 열었는지, 언제 닫거나 여는지 보여 주고, '영업 중' 칩으로 열린 곳만 볼 수 있습니다.",
  "wn.c.settingsSearch.title": "설정 검색",
  "wn.c.settingsSearch.body": "설정 맨 위 검색창에 입력하면 어떤 설정이든 찾을 수 있고, 그 설정이 보이는 위치로 열립니다.",
  "wn.c.mapFinder.title": "지도 중심의 헬스장 찾기",
  "wn.c.mapFinder.body": "헬스장 찾기가 큰 지도로 바뀌었고, 각 헬스장은 넘겨 볼 수 있는 반투명 카드에 있습니다.",
  "wn.c.outsideWorkouts.title": "다른 앱의 운동도 반영",
  "wn.c.outsideWorkouts.body":
    "연결된 앱에서 '다른 앱의 운동 반영'을 켜면 건강 앱의 달리기, 자전거, 스포츠, 수업이 회복과 내일 계획에 반영돼요.",
  "wn.c.gymChains.title": "헬스장 체인의 모든 지점",
  "wn.c.gymChains.body":
    "체인 헬스장에는 체인 로고와 모든 지점을 모은 페이지 링크가 나옵니다. 가까운 순으로 보여 주니 탭 한 번으로 내 지점을 찾아 추가하세요.",
  "wn.c.rehabSelf.title": "물리치료사 없이 하는 가벼운 재활",
  "wn.c.rehabSelf.body":
    "부상을 기록했나요? 부상 화면과 코치 메모가 집에서 할 수 있는 짧은 맨몸 루틴을 제안해요. 시작점일 뿐, 치료는 아니에요.",
  "wn.c.rehabShape.title": "재활 루틴을 다듬기",
  "wn.c.rehabShape.body": "물리치료사는 루틴 편집에서 동작마다 횟수나 초, 그리고 짧은 큐를 정할 수 있어요. 적힌 그대로 따라 해요.",
  "wn.c.rehabEnd.title": "프로그램이 거둬들여질 때",
  "wn.c.rehabEnd.body": "물리치료사가 프로그램을 거둬가면 오늘 화면에서 멈출지, 혼자 이어 갈지 물어봐요.",
  "wn.c.campusClubs.title": "활발한 클럽에 Pro",
  "wn.c.campusClubs.body": "나를 포함해 멤버 5명 이상이 각자 최근 14일 안에 운동을 마친 클럽을 이끄는 동안 Pro가 무료예요.",
  "wn.c.voiceAmy.title": "음성 코치 Amy",
  "wn.c.voiceAmy.body":
    "Pro로 Amy를 쓸 수 있어요. 앱에 들어 있는 또렷한 영어 음성이에요. 설정 › 운동에서 Amy 또는 휴대폰 음성을 고르고, Amy를 쓸 수 없으면 휴대폰 음성으로 돌아가요.",
  "wn.c.checkUpdates.title": "설정에서 업데이트 확인",
  "wn.c.checkUpdates.body": "Android와 iPhone에서는 설정 › 버전에서 새 앱이 있는지 확인하고, 준비되면 설치할 수 있어요.",
  "wn.c.coachRoles.title": "코칭 방식에 맞는 도구",
  "wn.c.coachRoles.body":
    "코칭 › 설정에서 퍼스널 트레이너, 스포츠 코치, 물리치료사를 고르세요. 역할마다 맞는 도구만 보이고, 스포츠 코치는 시즌 프로그램과 팀이 먼저 나옵니다. 메시지는 모두 쓸 수 있어요.",
  "wn.c.assignProgram.title": "시즌 프로그램 배정",
  "wn.c.assignProgram.body":
    "코치가 어퍼/로워, 푸시/풀/레그 또는 여러 날 프로그램을 클라이언트나 학교 팀에 N주 배정합니다. 한 번 따르면 오늘에 그날 운동이 나옵니다. 달력에서 완료/아직을 보고, 학교 팀은 이름만, 무게는 절대 안 보입니다.",
};

export const pl: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Zakończ coaching",
  "wn.c.stopCoach.body":
    "Konta trenera, trenera personalnego i fizjoterapeuty mogą wybrać Zakończ coaching w ustawieniach. Zostaną usunięte role, aktywne zaproszenie i powiązania trenerskie.",
  "wn.c.legCurlWeights.title": "Uginanie nóg pokazuje ciężar",
  "wn.c.legCurlWeights.body":
    "Postacie z instrukcją uginania i prostowania nóg pokazują teraz stos obciążenia i dźwignię maszyny, a uginanie leżąc, z hantlą i z gumą odbywa się na brzuchu.",
  "wn.c.coachCalendar.title": "Kalendarz treningów",
  "wn.c.coachCalendar.body":
    "Planuj treningi i dni odpoczynku w kalendarzu miesięcznym. Zawodnicy widzą plan dnia na ekranie Dzisiaj. Zaproś asystentów do edycji kalendarza i sprawdzaj aktywność zawodników.",
  "wn.c.deleteWorkout.title": "Cofnij po usunięciu treningu",
  "wn.c.deleteWorkout.body":
    "Usunięto trening przez pomyłkę? Przez kilka sekund możesz dotknąć Cofnij. Usunięty trening znika teraz także ze Znajomych i z Health Connect lub Apple Zdrowie, a wszystkie statystyki są przeliczane z tego, co zostało.",
  "wn.c.landmineEnd.title": "Talerze na landmine na jednym końcu",
  "wn.c.landmineEnd.body": "Ćwiczenia z landmine i wiosłowanie T-bar pokazują talerze na jedynym wolnym końcu, bez „z każdej strony”.",
  "wn.c.gymInsights.title": "Statystyki dla właścicieli siłowni",
  "wn.c.sonosVolume.title": "Sonos pamięta głośność i wycisza jednym dotknięciem",
  "wn.c.sonosVolume.body":
    "Podgłośnij muzykę w trakcie serii, a stanie się to Twoją głośnością serii; tak samo w przerwie. Dotknij głośnika, by wyciszyć, i jeszcze raz, by przywrócić.",
  "wn.c.gymInsights.body":
    "Masz siłownię w Liftsmith? Jej strona pokazuje teraz, ile osób tam trenuje, godziny tłoku i spokoju oraz używany sprzęt, z jednym następnym krokiem. Tylko sumy, nigdy kto. Wyłącz Licz moje wizyty na siłowni w Ustawieniach, jeśli wolisz nie być liczony.",
  "wn.title": "Co nowego",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Wersja {version}",
  "wn.count.new": { one: "{count} nowość", few: "{count} nowości", many: "{count} nowości", other: "{count} nowości" },
  "wn.count.better": { one: "{count} ulepszenie", few: "{count} ulepszenia", many: "{count} ulepszeń", other: "{count} ulepszenia" },
  "wn.count.fixed": { one: "{count} poprawka", few: "{count} poprawki", many: "{count} poprawek", other: "{count} poprawki" },
  "wn.kind.new": "Nowość",
  "wn.kind.better": "Lepiej",
  "wn.kind.fixed": "Naprawione",
  "wn.go": "Do dzieła",
  "wn.row": "Wersja",
  "wn.open": "Co nowego",
  "wn.check": "Sprawdź aktualizacje",
  "wn.checking": "Sprawdzanie…",
  "wn.current": "Masz najnowszą wersję",
  "wn.install": "Zainstaluj",
  "wn.checkFail": "Nie udało się sprawdzić. Spróbuj ponownie, gdy będziesz online.",
  "wn.note": "Co nowego w {brand}",
  "wn.see": "Zobacz wszystko",
  "wn.c.seasons.title": "Sezony treningowe",
  "wn.c.seasons.body":
    "Dziesięciotygodniowe sezony z odznakami, motywami i ikoną aplikacji, które zdobędziesz tylko wtedy, w tempie Twojego tygodniowego celu. Każdy poziom jest darmowy.",
  "wn.c.community.title": "Pomysły, błędy i plan rozwoju",
  "wn.c.community.body": "Społeczność, w Pomocy w Ustawieniach: zgłaszaj pomysły i błędy, głosuj i śledź każdy od Zaplanowane do Wydane.",
  "wn.c.crew.title": "Czat klubu i wspólne treningi",
  "wn.c.crew.body":
    "Każdy klub ma czat, a przy wspólnych treningach wybierasz godzinę, dajesz znać, że będziesz, i dostajesz przypomnienie godzinę wcześniej.",
  "wn.c.classes.title": "Grafik zajęć Twojej siłowni",
  "wn.c.classes.body":
    "Siłownie mogą publikować cotygodniowe zajęcia. Zobacz najbliższe siedem dni na stronie siłowni i dodaj zajęcia do kalendarza.",
  "wn.c.faults.title": "Częste błędy i jak je poprawić",
  "wn.c.faults.body": "Każde ćwiczenie i rozciąganie pokazuje najczęstsze błędy i sposób na poprawienie każdego z nich.",
  "wn.c.widgets.title": "Widżety Ten tydzień i Regeneracja",
  "wn.c.widgets.body": "Dwa nowe widżety na ekran główny: treningi z tego tygodnia w skrócie i które mięśnie są gotowe.",
  "wn.c.supersets.title": "Automatyczne superserie",
  "wn.c.supersets.body":
    "Treningi adaptacyjne mogą łączyć w pary ćwiczenia na różne mięśnie, żeby zmieścić więcej w tym samym czasie. Włącz to w Ustawieniach; każda para mówi dlaczego.",
  "wn.c.fitTests.title": "Testy sprawności na skali",
  "wn.c.fitTests.body":
    "Wyniki zwisu na drążku, stania na jednej nodze i wstawania z krzesła są teraz na kolorowej linii obok typowego zakresu.",
  "wn.c.getReady.title": "Czas na przygotowanie między rozciąganiami",
  "wn.c.getReady.body": "Krótkie odliczanie przed każdym rozciąganiem i każdą stroną, a ekran nie gaśnie przez całą sesję.",
  "wn.c.machineSteps.title": "Maszyny rosną o 2,5 kg",
  "wn.c.machineSteps.body": "Ćwiczenia na maszynach i wyciągach rosną teraz o 2,5 kg lub 5 lb, na przyciskach i w proponowanych ciężarach.",
  "wn.c.figures.title": "Płynniejsze postacie 3D",
  "wn.c.figures.body":
    "Przeciągnij postać 3D, żeby ją obrócić, albo pchnij, żeby się kręciła. Postać z instrukcją rusza się też w przerwie.",
  "wn.c.languages.title": "Dziesięć języków",
  "wn.c.languages.body":
    "Liftsmith mówi teraz także po portugalsku (Brazylia), koreańsku, polsku i turecku, a język wybierzesz już na ekranie powitalnym.",
  "wn.c.checkins.title": "Raporty dla trenera z wagą i zdjęciami",
  "wn.c.checkins.body":
    "Trener może poprosić w raporcie o Twoją wagę i zdjęcia, co jeden, dwa lub cztery tygodnie, i widzieć trend każdej odpowiedzi.",
  "wn.c.jumps.title": "Skoki odrywają się od ziemi",
  "wn.c.jumps.body": "Podskoki na kostkach, przysiady z wyskokiem i inne skoki w instrukcjach naprawdę odrywają się teraz od podłogi.",
  "wn.c.sides.title": "Rozciąganie jednej strony pokazuje właściwą stronę",
  "wn.c.sides.body": "Rozciąganie jednej strony pokazuje teraz stronę z nazwy, a dla drugiej odbija się lustrzanie.",
  "wn.c.seasonPlan.title": "Pięć nowych sezonów treningowych na 2027",
  "wn.c.seasonPlan.body":
    "Burza, Rozkwit, Przesilenie, Klon i Obsydian następują po Żarze jeden po drugim przez cały 2027, każdy z własnymi motywami, ikonami, awatarami, rzadkimi talerzami i trzema własnymi wyzwaniami.",
  "wn.c.pregnancy.title": "Tryb ciąży i połogu",
  "wn.c.pregnancy.body":
    "Ustawienia › Ciało i jednostki: powiedz nam, że jesteś w ciąży albo urodziłaś, a każdy trening dopasuje się do tygodnia: lżejsze ciężary, w późnej ciąży nic na plecach i stopniowy powrót po porodzie.",
  "wn.c.iconBadge.title": "Liczba na ikonie aplikacji",
  "wn.c.iconBadge.body":
    "Zobacz, ile wiadomości, polubień, komentarzy i próśb o obserwowanie czeka, bez otwierania aplikacji. W środku czerwone liczby przy Znajomych i Twoim trenerze pokazują, gdzie są.",
  "wn.c.formVideos.title": "Nagrania techniki dla trenera",
  "wn.c.formVideos.body":
    "Nagraj serię w aplikacji i wyślij ją trenerowi lub fizjoterapeucie. Zwolni nagranie i przypnie notatki dokładnie do ważnych momentów.",
  "wn.c.routineLibrary.title": "Biblioteka rutyn",
  "wn.c.routineLibrary.body":
    "Znajdź rutyny opublikowane przez innych, zapisz jedną jednym dotknięciem i oceń ją. Swoje opublikujesz w ich edytorze w rutynach.",
  "wn.c.teamSession.title": "Treningi drużyny dla trenerów szkolnych",
  "wn.c.teamSession.body":
    "Trenerzy szkolni mogą poprowadzić jeden trening dla całej drużyny z jednego tabletu. Każdy zawodnik stuka swoje imię, żeby zapisać serie, a tablica pokazuje, kto jeszcze nie zaczął.",
  "wn.c.openNow.title": "Otwarte teraz w wyszukiwarce siłowni",
  "wn.c.openNow.body":
    "Każda siłownia z godzinami pokazuje, czy jest teraz otwarta i kiedy się zamyka lub otwiera, a filtr Otwarte teraz pokazuje tylko otwarte.",
  "wn.c.settingsSearch.title": "Szukaj w ustawieniach",
  "wn.c.settingsSearch.body": "Wpisz w pole u góry Ustawień, aby znaleźć dowolne ustawienie. Otworzy się z tym ustawieniem na widoku.",
  "wn.c.mapFinder.title": "Wyszukiwarka siłowni z mapą na pierwszym planie",
  "wn.c.mapFinder.body": "Wyszukiwarka siłowni to teraz duża mapa, a każda siłownia jest na przezroczystej karcie do przewijania.",
  "wn.c.outsideWorkouts.title": "Liczą się treningi z innych aplikacji",
  "wn.c.outsideWorkouts.body":
    "Włącz Licz treningi z innych aplikacji w Połączonych aplikacjach, a biegi, rower, sporty i zajęcia ze Zdrowia wpłyną na regenerację i plan na jutro.",
  "wn.c.gymChains.title": "Wszystkie lokalizacje sieci siłowni",
  "wn.c.gymChains.body":
    "Siłownie należące do sieci pokazują jej logo i link do strony ze wszystkimi lokalizacjami, od najbliższych, więc znajdziesz i dodasz swoją jednym dotknięciem.",
  "wn.c.rehabSelf.title": "Łagodna rehabilitacja bez fizjoterapeuty",
  "wn.c.rehabSelf.body":
    "Zapisujesz kontuzję? Kontuzje i notatka coacha proponują krótką rutynę z ciężarem ciała do zrobienia w domu. To punkt wyjścia, nie leczenie.",
  "wn.c.rehabShape.title": "Ułóż rutynę rehabilitacji",
  "wn.c.rehabShape.body":
    "Fizjoterapeuci mogą ustawić powtórzenia albo sekundy każdego ćwiczenia i krótką wskazówkę w edytorze rutyn. Robisz ją tak, jak jest zapisana.",
  "wn.c.rehabEnd.title": "Gdy program zostaje zabrany",
  "wn.c.rehabEnd.body": "Jeśli fizjoterapeuta zabiera program, Dziś pyta, czy go zatrzymać, czy ćwiczyć dalej na własną rękę.",
  "wn.c.campusClubs.title": "Pro dla aktywnego klubu",
  "wn.c.campusClubs.body":
    "Prowadź klub, w którym 5 lub więcej członków, razem z Tobą, skończyło trening w ostatnich 14 dniach, a Pro jest za darmo, dopóki tak zostaje.",
  "wn.c.voiceAmy.title": "Amy w trenerze głosowym",
  "wn.c.voiceAmy.body":
    "Pro odblokowuje Amy, wyraźny angielski głos w aplikacji. Wybierz Amy lub syntezę telefonu w Ustawieniach › Trening; Amy wraca do głosu telefonu, gdy nie załaduje się.",
  "wn.c.checkUpdates.title": "Sprawdzanie aktualizacji w Ustawieniach",
  "wn.c.checkUpdates.body":
    "Na Androidzie i iPhonie w Ustawienia › Wersja możesz sprawdzić nowszą aplikację i zainstalować ją, gdy będzie gotowa.",
  "wn.c.coachRoles.title": "Narzędzia dopasowane do roli",
  "wn.c.coachRoles.body":
    "Wybierz trenera personalnego, trenera sportowego lub fizjo w Coaching › Ustawienia. Każda rola pokazuje tylko swoje narzędzia — trenerzy sportowi zaczynają od programów sezonowych i drużyn; wiadomości zostają dla wszystkich.",
  "wn.c.assignProgram.title": "Przypisz program sezonowy",
  "wn.c.assignProgram.body":
    "Trenerzy ustawiają Upper/Lower, Push/Pull/Legs lub własny wielodniowy program klientom albo drużynie szkolnej na N tygodni. Śledzą raz; Dziś pokazuje trening tego dnia. Kalendarz pokazuje Zrobione i Jeszcze nie — tylko imiona w drużynach szkolnych, nigdy ciężary.",
};

export const tr: Partial<Record<Key, Message>> = {
  "wn.c.stopCoach.title": "Koçluğu bırak",
  "wn.c.stopCoach.body":
    "Koç, kişisel antrenör ve fizyoterapist hesapları ayarlarda Koçluğu bırak seçebilir. Rol, aktif davet ve koç bağlantıları kaldırılır.",
  "wn.c.legCurlWeights.title": "Leg curl hareketleri ağırlığı gösteriyor",
  "wn.c.legCurlWeights.body":
    "Leg curl ve leg extension nasıl yapılır figürleri artık makinenin ağırlık yığınını ve kolunu gösteriyor; yüzüstü, dambıllı ve bantlı leg curl yüzüstü yatarak yapılıyor.",
  "wn.c.coachCalendar.title": "Antrenman takvimi",
  "wn.c.coachCalendar.body":
    "Aylık takvimde antrenman veya dinlenme günleri belirle. Sporcular günlük planı Bugün ekranında görür. Yardımcı antrenörleri takvimi düzenlemeye davet et ve sporcuların antrenman etkinliğini incele.",
  "wn.c.deleteWorkout.title": "Antrenman silmeyi geri al",
  "wn.c.deleteWorkout.body":
    "Bir antrenmanı yanlışlıkla mı sildin? Birkaç saniye boyunca Geri al'a dokunabilirsin. Silinen antrenman artık Arkadaşlar'dan ve Health Connect ya da Apple Sağlık'tan da kalkar; tüm istatistikler kalanlardan yeniden hesaplanır.",
  "wn.c.landmineEnd.title": "Landmine plakaları tek uçta",
  "wn.c.landmineEnd.body": "Landmine hareketleri ve T-bar row, plakaları yalnızca boştaki uçta gösterir ve artık her yana demez.",
  "wn.c.gymInsights.title": "Salon sahipleri için içgörüler",
  "wn.c.sonosVolume.title": "Sonos ses düzeyini hatırlar, tek dokunuşla susar",
  "wn.c.sonosVolume.body":
    "Set sırasında müziği açarsan bu senin set ses düzeyin olur, dinlenmede de aynısı. Sesi kapatmak için hoparlöre dokun, geri getirmek için yine dokun.",
  "wn.c.gymInsights.body":
    "Liftsmith'te bir salonun mu var? Salonun sayfası artık kaç sporcunun orada antrenman yaptığını, yoğun ve sakin saatleri ve kullanılan ekipmanı, bir sonraki adımla birlikte gösteriyor. Yalnızca toplamlar, asla kim olduğu değil. Sayılmak istemezsen Ayarlar'da Salon ziyaretlerimi say'ı kapat.",
  "wn.title": "Yenilikler",
  "wn.kicker": "{brand} · {date}",
  "wn.version": "Sürüm {version}",
  "wn.count.new": { one: "{count} yeni", other: "{count} yeni" },
  "wn.count.better": { one: "{count} iyileştirme", other: "{count} iyileştirme" },
  "wn.count.fixed": { one: "{count} düzeltme", other: "{count} düzeltme" },
  "wn.kind.new": "Yeni",
  "wn.kind.better": "Daha iyi",
  "wn.kind.fixed": "Düzeltildi",
  "wn.go": "Başlayalım",
  "wn.row": "Sürüm",
  "wn.open": "Yenilikler",
  "wn.check": "Güncellemeleri denetle",
  "wn.checking": "Denetleniyor…",
  "wn.current": "Güncelsin",
  "wn.install": "Yükle",
  "wn.checkFail": "Denetlenemedi. Çevrimiçiyken yeniden dene.",
  "wn.note": "{brand} yenilikleri",
  "wn.see": "Tümünü gör",
  "wn.c.seasons.title": "Antrenman sezonları",
  "wn.c.seasons.body":
    "Yalnızca o dönemde kazanılabilen rozetler, temalar ve uygulama simgesiyle on haftalık sezonlar; tempo kendi haftalık hedefine göre. Her kademe ücretsiz.",
  "wn.c.community.title": "Fikirler, hatalar ve yol haritası",
  "wn.c.community.body":
    "Ayarlar'daki Yardım altında Topluluk: fikir öner, hata bildir, oy ver ve her birini Planlandı'dan Yayınlandı'ya kadar takip et.",
  "wn.c.crew.title": "Kulüp sohbeti ve ekip seansları",
  "wn.c.crew.body":
    "Her kulübün bir sohbeti var; ekip seanslarında bir saat seçip katılacağını söylersin ve bir saat önce hatırlatma alırsın.",
  "wn.c.classes.title": "Spor salonunun ders programı",
  "wn.c.classes.body":
    "Salonlar haftalık derslerini paylaşabilir. Salonun sayfasında önümüzdeki yedi günü gör ve bir dersi takvimine ekle.",
  "wn.c.faults.title": "Sık yapılan hatalar ve düzeltmeleri",
  "wn.c.faults.body": "Her egzersiz ve esneme, en sık yapılan hataları ve her birinin nasıl düzeltileceğini gösteriyor.",
  "wn.c.widgets.title": "Bu hafta ve Toparlanma widget'ları",
  "wn.c.widgets.body": "Ana ekran için iki yeni widget: haftanın antrenmanlarına bir bakışta göz at ve hangi kasların hazır olduğunu gör.",
  "wn.c.supersets.title": "Otomatik süpersetler",
  "wn.c.supersets.body":
    "Uyarlanabilir antrenmanlar aynı kasları kullanmayan egzersizleri eşleyerek aynı sürede daha fazlasını sığdırabilir. Ayarlar'dan aç; her eşleşme nedenini söyler.",
  "wn.c.fitTests.title": "Bir sayı doğrusunda kondisyon testleri",
  "wn.c.fitTests.body": "Barfiks asılma, tek ayak duruş ve sandalyeden kalkma sonuçları artık tipik aralığın yanında renkli bir çizgide.",
  "wn.c.getReady.title": "Esnemeler arasında hazırlanma süresi",
  "wn.c.getReady.body": "Her esnemeden ve her taraftan önce kısa bir geri sayım var, ekran da rutin boyunca açık kalıyor.",
  "wn.c.machineSteps.title": "Makineler 2,5 kg artıyor",
  "wn.c.machineSteps.body": "Makine ve kablo egzersizleri artık hem düğmelerde hem önerilen ağırlıklarda 2,5 kg ya da 5 lb artıyor.",
  "wn.c.figures.title": "Daha akıcı 3D figürler",
  "wn.c.figures.body":
    "Herhangi bir 3D figürü sürükleyerek çevir ya da fırlatıp döndür. Nasıl yapılır figürü dinlenirken de hareket etmeye devam ediyor.",
  "wn.c.languages.title": "On dil",
  "wn.c.languages.body":
    "Liftsmith artık Brezilya Portekizcesi, Korece, Lehçe ve Türkçe de konuşuyor; dilini karşılama ekranında seçebilirsin.",
  "wn.c.checkins.title": "Kilo ve fotoğraflı koç check-in'leri",
  "wn.c.checkins.body":
    "Koçun bir check-in'de bir, iki ya da dört haftada bir kilonu ve fotoğraflarını isteyip her cevabın gidişatını görebilir.",
  "wn.c.jumps.title": "Sıçramalar yerden kalkıyor",
  "wn.c.jumps.body":
    "Ayak bileği sekmeleri, sıçramalı squat'lar ve nasıl yapılır figürlerindeki diğer sıçramalar artık gerçekten yerden kalkıyor.",
  "wn.c.sides.title": "Tek taraflı esnemeler doğru tarafı gösteriyor",
  "wn.c.sides.body": "Tek taraflı bir esneme artık adındaki tarafı gösteriyor, diğer taraf için de aynalanıyor.",
  "wn.c.seasonPlan.title": "2027 için beş yeni antrenman sezonu",
  "wn.c.seasonPlan.body":
    "Fırtına, Çiçek, Gündönümü, Akçaağaç ve Obsidyen, 2027 boyunca Kor'un ardından arka arkaya gelir; her birinin kendi temaları, uygulama simgeleri, avatarları, nadir plakaları ve üç kendi meydan okuması var.",
  "wn.c.pregnancy.title": "Hamilelik ve doğum sonrası modu",
  "wn.c.pregnancy.body":
    "Ayarlar › Vücut ve birimler: hamile olduğunu ya da bebeğini doğurduğunu söyle, her antrenman haftana uysun; daha hafif yükler, hamileliğin sonlarında sırtüstü hareket yok ve doğumdan sonra kademeli dönüş.",
  "wn.c.iconBadge.title": "Uygulama simgesinde bir sayı",
  "wn.c.iconBadge.body":
    "Uygulamayı açmadan kaç mesaj, beğeni, yorum ve takip isteği beklediğini gör. İçeride Arkadaşlar'daki ve koçundaki kırmızı sayılar nerede olduklarını gösterir.",
  "wn.c.formVideos.title": "Koçun için form videoları",
  "wn.c.formVideos.body":
    "Uygulamada bir set çek ve koçuna ya da fizyoterapistine gönder. Videoyu yavaşlatıp tam önemli anlara not iliştirir.",
  "wn.c.routineLibrary.title": "Rutin kütüphanesi",
  "wn.c.routineLibrary.body":
    "Diğer sporcuların yayınladığı rutinleri bul, birini tek dokunuşla kaydet ve puanla. Kendi rutinlerini düzenleyicilerinden yayınla.",
  "wn.c.teamSession.title": "Okul koçları için takım seansı",
  "wn.c.teamSession.body":
    "Lise koçları tüm takımın antrenmanını tek tabletten yönetebilir. Her sporcu setlerini kaydetmek için adına dokunur, pano kimin başlamadığını gösterir.",
  "wn.c.openNow.title": "Spor salonu bulucuda Şimdi açık",
  "wn.c.openNow.body":
    "Saatleri olan her salon şu an açık olup olmadığını ve ne zaman kapanıp açılacağını gösteriyor; Şimdi açık çipi yalnızca açık olanları listeliyor.",
  "wn.c.settingsSearch.title": "Ayarlarda ara",
  "wn.c.settingsSearch.body": "Ayarlar'ın üstündeki kutuya yazarak istediğin ayarı bul; o ayar görünür şekilde açılır.",
  "wn.c.mapFinder.title": "Haritayı öne çıkaran salon bulucu",
  "wn.c.mapFinder.body": "Salon bulucu artık büyük bir harita; her salon kaydırabileceğin yarı saydam bir kartta.",
  "wn.c.outsideWorkouts.title": "Diğer uygulamalardaki antrenmanlar sayılıyor",
  "wn.c.outsideWorkouts.body":
    "Bağlı uygulamalarda Diğer uygulamalardaki antrenmanları say seçeneğini aç; Sağlık'taki koşu, bisiklet, spor ve dersler toparlanmanı ve yarının planını şekillendirsin.",
  "wn.c.gymChains.title": "Bir zincirin tüm şubeleri",
  "wn.c.gymChains.body":
    "Bir zincire ait salonlar zincirin logosunu ve tüm şubelerinin olduğu sayfaya bir bağlantı gösterir; en yakınlar önce, böylece kendi şubeni tek dokunuşla bulup eklersin.",
  "wn.c.rehabSelf.title": "Fizyoterapist olmadan hafif rehabilitasyon",
  "wn.c.rehabSelf.body":
    "Bir sakatlık mı kaydettin? Sakatlıklar ve bir koç notu, evde yapabileceğin kısa bir vücut ağırlığı rutini sunar. Bu bir başlangıçtır, tedavi değildir.",
  "wn.c.rehabShape.title": "Bir rehabilitasyon rutinini şekillendir",
  "wn.c.rehabShape.body":
    "Fizyoterapistler rutin düzenleyicide her egzersize tekrar ya da saniye ve kısa bir ipucu koyabilir. Sen yazıldığı gibi uygularsın.",
  "wn.c.rehabEnd.title": "Bir program geri alındığında",
  "wn.c.rehabEnd.body": "Fizyoterapistin bir programı geri alırsa Bugün durdurmanı ya da kendi başına sürdürmeni sorar.",
  "wn.c.campusClubs.title": "Aktif bir kulüp için Pro",
  "wn.c.campusClubs.body":
    "Sen dahil 5 veya daha fazla üyenin son 14 günde birer antrenman bitirdiği bir kulübü yönetirken Pro ücretsiz kalır.",
  "wn.c.voiceAmy.title": "Sesli koç için Amy",
  "wn.c.voiceAmy.body":
    "Pro, uygulamaya gömülü net İngilizce ses Amy’yi açar. Ayarlar › Antrenman’da Amy veya telefon metin okumayı seç; Amy yüklenemezse telefon sesine döner.",
  "wn.c.checkUpdates.title": "Ayarlar'da güncelleme denetle",
  "wn.c.checkUpdates.body":
    "Android ve iPhone'da Ayarlar › Sürüm, daha yeni bir uygulama olup olmadığını denetlemeni ve hazır olduğunda yüklemeni sağlar.",
  "wn.c.coachRoles.title": "Koçluk biçiminize uyan araçlar",
  "wn.c.coachRoles.body":
    "Coaching › Kurulum’da kişisel antrenör, spor koçu veya fizyo seçin. Her rol yalnızca kendi araçlarını gösterir — spor koçları sezon programları ve takımlarla başlar; mesajlaşma herkes için kalır.",
  "wn.c.assignProgram.title": "Sezon programı ata",
  "wn.c.assignProgram.body":
    "Koçlar Upper/Lower, Push/Pull/Legs veya kendi çok günlük programlarını danışanlara ya da okul takımına N hafta atar. Bir kez takip; Bugün o günün antrenmanını gösterir. Takvim Yapıldı ve Henüz değil’i gösterir — okul takımlarında yalnızca adlar, asla ağırlık yok.",
};
