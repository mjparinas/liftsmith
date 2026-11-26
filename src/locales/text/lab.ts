import type { Message } from "@/lib/i18n";

// Text for keys starting "lab.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "lab.barPath.title": "Bar path replay",
  "lab.barPath.body":
    "After a camera-counted squat, deadlift or overhead press, replays one rep with the bar's path drawn over a stick figure, and gives one cue if the bar drifted. Side-on works best. Only the points the camera read are kept, until your next set; no video is recorded.",
  "lab.formCheck.title": "Camera form check",
  "lab.formCheck.body":
    "While the camera counts reps, it also watches how they move: squats that stop above parallel, reps cut short, and leaning to one side. Between sets it gives one tip and shows it on the figure. Side-on is best for depth; face the camera to check for a lean.",
  "lab.speedMax.title": "Today's max from warm-ups",
  "lab.speedMax.body":
    "Uses the bar speed of your warm-ups to estimate today's max, then suggests a slightly heavier or lighter working weight before your first hard set. Works on squats, hinges, presses, rows and pull-ups, and needs your height in Your stats. Sets you take to failure while the camera counts teach it your own end-of-set speed.",
  "lab.barSpeed.title": "Camera bar speed",
  "lab.barSpeed.body":
    "While the camera counts reps, it also shows how fast the bar moves, how much it has slowed since your fastest rep, and when it's time to end the set. Add your height in Your stats for speeds in m/s.",
  "lab.hrRest.title": "Heart-rate rest timer",
  "lab.hrRest.body":
    "With a heart rate monitor or watch connected, rest ends early once your heart rate is back near where it was when the set started. It never cuts more than 40% of the planned rest, and +30 s still adds time.",
  "lab.hrRest.cut": "Heart rate's back to {bpm}, near the {start} you started that set at, so rest is {saved} s shorter. Get ready.",
  "lab.row": "Labs",
  "lab.rowNote": "Try experimental features early",
  "lab.title": "Labs",
  "lab.intro": "Experiments that aren't quite ready for everyone. They may change, misbehave or go away. Switch on what you'd like to try.",
  "lab.pro": "Labs is part of Pro.",
  "lab.needs": "Needs {lab} on.",
  "lab.repCount.title": "Camera rep counting",
  "lab.repCount.body":
    "Adds Count reps to the exercise on the workout screen. The camera watches your set, draws the bones it sees over you and fills in your reps. Video stays on your phone.",
  "lab.repMotion.title": "Phone motion rep counting",
  "lab.repMotion.body": "Count reps from the phone's motion sensors instead of the camera. Less reliable.",
  "lab.watchReps.title": "Watch rep counting",
  "lab.watchReps.body":
    "Your Wear OS watch or Apple Watch counts reps from your wrist during each set and fills them in for Log set on your phone. Needs the Liftsmith watch app open on your wrist. Not for lifts where your hands stay still, like pull-ups.",
  "lab.voiceLog.title": "Voice set logging",
  "lab.voiceLog.body":
    'Adds a microphone above Log set on the workout screen. Tap it and say "100 for 8", "8 reps", "too easy" or "undo". Speech is recognized on your phone and never recorded or sent, so it needs a phone that can do that in your language.',
  "lab.machines.title": "Bluetooth gym machines",
  "lab.machines.body":
    "On cardio, connect a bike, rower, treadmill or cross trainer that shares its numbers over Bluetooth (the fitness machine standard most newer machines use). Time, distance and power fill in by themselves, ready for Log set, and the steppers still work if something's off. In the web app it needs Chrome.",
  "lab.machines.connect": "Connect machine",
  "lab.machines.device": "the machine",
  "lab.machines.live": "{name} is filling in this set.",
  "lab.machines.reconnecting": "Reconnecting to {name}… What it sent so far is kept.",
  "lab.machines.power": "{watts} W average",
  "lab.machines.disconnect": "Disconnect",
  "lab.machines.err.notFound":
    "No gym machine showed up. Start pedalling or rowing to wake it, keep your phone close, and check it isn't connected to another app.",
  "lab.machines.err.noService": "{name} doesn't share its numbers the standard way, so it can't connect.",
  "lab.machines.err.lost": "Lost {name}. What it sent so far is kept. Tap Connect machine to carry on.",
  "lab.machines.err.failed":
    "Couldn't connect to {name}. It may be connected to another app or watch: disconnect it there, keep it close, and try again.",
  "lab.scale.title": "Bluetooth smart scale",
  "lab.scale.body":
    "Under the weigh-in on Progress and Body, a button connects a scale that shares its reading over Bluetooth the standard way (the weight scale and body composition standards). Step on, and your weight and body fat fill in, ready to log. Many cheap scales use their own app's protocol instead and won't show up. In the web app it needs Chrome.",
  "lab.scale.button": "Weigh in on my scale",
  "lab.scale.which": "Which scales work?",
  "lab.scale.device": "the scale",
  "lab.scale.connecting": "Looking for your scale…",
  "lab.scale.waiting": "Step on {name} now.",
  "lab.scale.got": "{name} read it. Check it and tap {log}.",
  "lab.scale.err.notFound":
    "No scale showed up. Step on it to wake it, keep your phone close, and check it isn't connected to its own app right now.",
  "lab.scale.err.noService": "{name} doesn't share its reading the standard way, so it can't connect.",
  "lab.scale.err.timeout": "{name} didn't send a weight. Step on it again and stand still until it settles.",
  "lab.scale.err.failed": "Couldn't connect to {name}. Close its own app, keep your phone close, and try again.",
  "lab.handsFree.title": "Hands-free sets",
  "lab.handsFree.body":
    "While camera, phone motion or watch rep counting is counting, the set logs itself a few seconds after your last rep and rest starts: 4 seconds once your planned reps are in, 8 while you're short of them. Undo puts it back. Needs one of those rep counting labs on.",
  "lab.handsFree.soon": "Logging this set in {s} s. Do another rep to keep going.",
  "lab.watchAuto.title": "Hands-free watch sets",
  "lab.watchAuto.body":
    "With watch rep counting on, your watch runs the whole set for you. After the first 15 seconds of rest, start your next set and rest ends by itself once the watch has counted 3 reps. A few seconds after your last rep the set logs itself and rest starts. Your watch buzzes each time. Undo puts a set back.",
  "lab.tempo.title": "Tempo coach",
  "lab.tempo.body":
    "On tempo and paused lifts, like a tempo squat or a paused bench, adds Count tempo above Log set. Tap it as you take the weight: after 3, 2, 1 it counts every second of each rep in sound and buzzes, a falling note to lower, a steady one to hold and a rising one to lift, then stops after your reps. Log set is still one tap.",
  "lab.volumeLog.title": "Volume button logs a set",
  "lab.volumeLog.body":
    "During a workout, press volume up on your phone or Bluetooth earbuds to log the set as planned, the same as tapping Log set. Pressed during rest, it logs the next set. The volume goes straight back and your music keeps playing; volume down still turns it down. Works while Liftsmith is on screen.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Control a Sonos speaker from the workout: what's playing, skip, pause and volume. It can also follow the workout, turning the music up for sets and down for rest, starting a Sonos favourite and pausing at the end. Connect Sonos in Connected apps.",
};

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Repetición de la trayectoria de la barra",
  "lab.barPath.body":
    "Tras una sentadilla, un peso muerto o un press militar contados con la cámara, repite una repetición con la trayectoria de la barra dibujada sobre una figura, y te da un consejo si la barra se desvió. Funciona mejor de perfil. Solo se guardan los puntos que leyó la cámara, hasta tu siguiente serie; no se graba vídeo.",
  "lab.formCheck.title": "Revisión de técnica con la cámara",
  "lab.formCheck.body":
    "Mientras la cámara cuenta repeticiones, también mira cómo se mueven: sentadillas que se quedan por encima del paralelo, repeticiones cortas e inclinarse hacia un lado. Entre series da un consejo y lo muestra en la figura. De lado se ve mejor la profundidad; ponte de frente para revisar si te inclinas.",
  "lab.speedMax.title": "Tu máximo de hoy según el calentamiento",
  "lab.speedMax.body":
    "Usa la velocidad de la barra en tus series de calentamiento para estimar tu máximo de hoy y, antes de la primera serie dura, sugiere un peso de trabajo un poco más alto o más bajo. Funciona en sentadillas, bisagras, presses, remos y dominadas, y necesita tu altura en Tus datos. Las series que llevas al fallo mientras cuenta la cámara le enseñan tu propia velocidad de final de serie.",
  "lab.barSpeed.title": "Velocidad de la barra con la cámara",
  "lab.barSpeed.body":
    "Mientras la cámara cuenta repeticiones, también muestra lo rápido que sube la barra, cuánto se ha frenado desde tu repetición más rápida y cuándo conviene terminar la serie. Añade tu altura en Tus datos para ver la velocidad en m/s.",
  "lab.hrRest.title": "Descanso según el pulso",
  "lab.hrRest.body":
    "Con un pulsómetro o un reloj conectado, el descanso termina antes cuando tu pulso vuelve cerca del que tenías al empezar la serie. Nunca recorta más del 40 % del descanso previsto, y +30 s sigue añadiendo tiempo.",
  "lab.hrRest.cut":
    "Tu pulso ha vuelto a {bpm}, cerca de los {start} con los que empezaste la serie, así que el descanso es {saved} s más corto. Prepárate.",
  "lab.row": "Labs",
  "lab.rowNote": "Prueba funciones experimentales antes que nadie",
  "lab.title": "Labs",
  "lab.intro": "Experimentos que aún no están listos para todos. Pueden cambiar, fallar o desaparecer. Activa lo que quieras probar.",
  "lab.pro": "Labs es parte de Pro.",
  "lab.needs": "Necesita {lab} activado.",
  "lab.repCount.title": "Contar repeticiones con la cámara",
  "lab.repCount.body":
    "Añade Contar reps al ejercicio en la pantalla de entrenamiento. La cámara mira tu serie, dibuja los huesos que ve sobre ti y rellena tus repeticiones. El vídeo no sale de tu teléfono.",
  "lab.repMotion.title": "Contar repeticiones con el movimiento del teléfono",
  "lab.repMotion.body": "Cuenta repeticiones con los sensores de movimiento del teléfono en lugar de la cámara. Menos fiable.",
  "lab.watchReps.title": "Contar repeticiones con el reloj",
  "lab.watchReps.body":
    "Tu reloj Wear OS o Apple Watch cuenta las repeticiones con el movimiento de la muñeca en cada serie y las rellena en Registrar serie en el teléfono. Necesita la app de Liftsmith abierta en el reloj. No sirve para ejercicios en los que las manos no se mueven, como las dominadas.",
  "lab.voiceLog.title": "Registrar series con la voz",
  "lab.voiceLog.body":
    "Añade un micrófono encima de Registrar serie en la pantalla de entrenamiento. Tócalo y di «100 por 8», «8 repeticiones», «demasiado fácil» o «deshacer». La voz se reconoce en tu teléfono y nunca se graba ni se envía, así que necesita un teléfono que pueda hacerlo en tu idioma.",
  "lab.machines.title": "Máquinas de gimnasio por Bluetooth",
  "lab.machines.body":
    "En el cardio, conecta una bici, un remo, una cinta o una elíptica que comparta sus datos por Bluetooth (el estándar de máquinas de fitness que usan la mayoría de las máquinas nuevas). El tiempo, la distancia y la potencia se rellenan solos, listos para Registrar serie, y los botones siguen funcionando si algo no cuadra. En la app web necesita Chrome.",
  "lab.machines.connect": "Conectar máquina",
  "lab.machines.device": "la máquina",
  "lab.machines.live": "{name} está rellenando esta serie.",
  "lab.machines.reconnecting": "Reconectando con {name}… Se conserva lo que ha enviado hasta ahora.",
  "lab.machines.power": "{watts} W de media",
  "lab.machines.disconnect": "Desconectar",
  "lab.machines.err.notFound":
    "No apareció ninguna máquina. Empieza a pedalear o remar para activarla, mantén el teléfono cerca y comprueba que no esté conectada a otra app.",
  "lab.machines.err.noService": "{name} no comparte sus datos de la forma estándar, así que no se puede conectar.",
  "lab.machines.err.lost":
    "Se perdió la conexión con {name}. Se conserva lo que ha enviado hasta ahora. Toca Conectar máquina para seguir.",
  "lab.machines.err.failed":
    "No se pudo conectar con {name}. Puede que esté conectada a otra app o reloj: desconéctala ahí, mantenla cerca y vuelve a intentarlo.",
  "lab.scale.title": "Báscula inteligente Bluetooth",
  "lab.scale.body":
    "Bajo el registro de peso en Progreso y Cuerpo, un botón conecta una báscula que comparte su lectura por Bluetooth de la forma estándar (los estándares de báscula y de composición corporal). Súbete y tu peso y tu grasa corporal se rellenan, listos para registrar. Muchas básculas baratas usan el protocolo de su propia app y no aparecerán. En la app web necesita Chrome.",
  "lab.scale.button": "Pesarme en mi báscula",
  "lab.scale.which": "¿Qué básculas funcionan?",
  "lab.scale.device": "la báscula",
  "lab.scale.connecting": "Buscando tu báscula…",
  "lab.scale.waiting": "Súbete a {name} ahora.",
  "lab.scale.got": "{name} ha tomado la lectura. Revísala y toca {log}.",
  "lab.scale.err.notFound":
    "No apareció ninguna báscula. Súbete para despertarla, mantén el teléfono cerca y comprueba que no esté conectada ahora a su propia app.",
  "lab.scale.err.noService": "{name} no comparte su lectura de la forma estándar, así que no se puede conectar.",
  "lab.scale.err.timeout": "{name} no envió ningún peso. Vuelve a subirte y quédate quieto hasta que se estabilice.",
  "lab.scale.err.failed": "No se pudo conectar con {name}. Cierra su propia app, mantén el teléfono cerca y vuelve a intentarlo.",
  "lab.handsFree.title": "Series sin manos",
  "lab.handsFree.body":
    "Mientras se cuentan las repeticiones con la cámara, el movimiento del teléfono o el reloj, la serie se registra sola unos segundos después de tu última repetición y empieza el descanso: 4 segundos si ya hiciste las repeticiones previstas, 8 si te faltan. Deshacer la quita. Necesita uno de esos labs de conteo activado.",
  "lab.handsFree.soon": "Registrando esta serie en {s} s. Haz otra repetición para seguir.",
  "lab.watchAuto.title": "Series sin manos con el reloj",
  "lab.watchAuto.body":
    "Con el conteo de repeticiones con el reloj activado, tu reloj se encarga de toda la serie. Pasados los primeros 15 segundos de descanso, empieza tu siguiente serie y el descanso termina solo cuando el reloj cuenta 3 repeticiones. Unos segundos después de tu última repetición, la serie se registra sola y empieza el descanso. Tu reloj vibra cada vez. Deshacer recupera una serie.",
  "lab.tempo.title": "Entrenador de tempo",
  "lab.tempo.body":
    "En los ejercicios con tempo o con pausa, como la sentadilla con tempo o el press de banca con pausa, añade Marcar el tempo encima de Registrar serie. Tócalo al coger el peso: tras 3, 2, 1 cuenta cada segundo de cada repetición con sonidos y vibraciones, una nota que baja para bajar, una fija para aguantar y una que sube para subir, y se detiene al terminar tus repeticiones. Registrar la serie sigue siendo un solo toque.",
  "lab.volumeLog.title": "El botón de volumen registra la serie",
  "lab.volumeLog.body":
    "Durante un entrenamiento, pulsa subir volumen en el teléfono o en los auriculares Bluetooth para registrar la serie como estaba prevista, igual que al tocar Registrar serie. Si lo pulsas durante el descanso, registra la serie siguiente. El volumen vuelve enseguida a su nivel y tu música sigue sonando; bajar volumen sigue bajándolo. Funciona mientras Liftsmith está en pantalla.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Controla un altavoz Sonos desde el entrenamiento: qué suena, saltar, pausar y volumen. También puede seguir el entrenamiento, subiendo la música en las series y bajándola en el descanso, empezando un favorito de Sonos y pausando al final. Conecta Sonos en Apps conectadas.",
};

export const fr: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Rejouer la trajectoire de la barre",
  "lab.barPath.body":
    "Après un squat, un soulevé de terre ou un développé militaire comptés par la caméra, rejoue une répétition avec la trajectoire de la barre tracée sur une silhouette, et donne un conseil si la barre a dévié. De profil, c'est mieux. Seuls les points lus par la caméra sont gardés, jusqu'à votre série suivante ; aucune vidéo n'est enregistrée.",
  "lab.formCheck.title": "Contrôle de la technique par la caméra",
  "lab.formCheck.body":
    "Pendant que la caméra compte les répétitions, elle regarde aussi comment elles bougent : squats arrêtés au-dessus de la parallèle, répétitions écourtées et inclinaison d’un côté. Entre les séries, elle donne un conseil et le montre sur la silhouette. De profil, c’est mieux pour la profondeur ; de face, pour voir si vous penchez.",
  "lab.speedMax.title": "Votre max du jour d'après l'échauffement",
  "lab.speedMax.body":
    "Utilise la vitesse de barre de vos séries d'échauffement pour estimer votre max du jour, puis propose une charge de travail un peu plus lourde ou plus légère avant votre première série difficile. Fonctionne sur les squats, les charnières, les développés, les tirages et les tractions, et nécessite votre taille dans Vos mesures. Les séries menées à l'échec pendant que la caméra compte lui apprennent votre propre vitesse de fin de série.",
  "lab.barSpeed.title": "Vitesse de barre par la caméra",
  "lab.barSpeed.body":
    "Pendant que la caméra compte les répétitions, elle montre aussi la vitesse de la barre, son ralentissement depuis votre répétition la plus rapide et le moment de finir la série. Ajoutez votre taille dans Vos mesures pour des vitesses en m/s.",
  "lab.hrRest.title": "Repos selon le pouls",
  "lab.hrRest.body":
    "Avec une ceinture cardio ou une montre connectée, le repos se termine plus tôt dès que votre pouls revient près de celui du début de la série. Il ne retire jamais plus de 40 % du repos prévu, et +30 s ajoute toujours du temps.",
  "lab.hrRest.cut":
    "Votre pouls est revenu à {bpm}, proche des {start} du début de la série : le repos est raccourci de {saved} s. Préparez-vous.",
  "lab.row": "Labs",
  "lab.rowNote": "Essayez les fonctions expérimentales en avant-première",
  "lab.title": "Labs",
  "lab.intro":
    "Des expériences pas encore prêtes pour tout le monde. Elles peuvent changer, mal fonctionner ou disparaître. Activez ce que vous voulez essayer.",
  "lab.pro": "Labs fait partie de Pro.",
  "lab.needs": "Nécessite {lab} activé.",
  "lab.repCount.title": "Comptage des répétitions par la caméra",
  "lab.repCount.body":
    "Ajoute Compter à l'exercice sur l'écran d'entraînement. La caméra regarde votre série, dessine les os qu'elle voit sur vous et remplit vos répétitions. La vidéo reste sur votre téléphone.",
  "lab.repMotion.title": "Comptage des répétitions par les mouvements du téléphone",
  "lab.repMotion.body": "Compte les répétitions avec les capteurs de mouvement du téléphone au lieu de la caméra. Moins fiable.",
  "lab.watchReps.title": "Comptage des répétitions par la montre",
  "lab.watchReps.body":
    "Votre montre Wear OS ou Apple Watch compte les répétitions au mouvement du poignet à chaque série et les inscrit dans Valider la série sur le téléphone. Nécessite l'app Liftsmith ouverte sur la montre. Pas pour les exercices où les mains ne bougent pas, comme les tractions.",
  "lab.voiceLog.title": "Saisie des séries à la voix",
  "lab.voiceLog.body":
    "Ajoute un micro au-dessus de Valider la série sur l'écran d'entraînement. Touchez-le et dites « 100 pour 8 », « 8 répétitions », « trop facile » ou « annuler ». La parole est reconnue sur votre téléphone et n'est jamais enregistrée ni envoyée, il faut donc un téléphone qui sait le faire dans votre langue.",
  "lab.machines.title": "Machines de salle en Bluetooth",
  "lab.machines.body":
    "En cardio, connectez un vélo, un rameur, un tapis de course ou un vélo elliptique qui partage ses données en Bluetooth (la norme des machines de fitness qu'utilisent la plupart des machines récentes). Le temps, la distance et la puissance se remplissent tout seuls, prêts pour Valider la série, et les boutons fonctionnent toujours si quelque chose cloche. Dans l'app web, il faut Chrome.",
  "lab.machines.connect": "Connecter la machine",
  "lab.machines.device": "la machine",
  "lab.machines.live": "{name} remplit cette série.",
  "lab.machines.reconnecting": "Reconnexion à {name}… Ce qu'elle a envoyé est conservé.",
  "lab.machines.power": "{watts} W en moyenne",
  "lab.machines.disconnect": "Déconnecter",
  "lab.machines.err.notFound":
    "Aucune machine n'est apparue. Commencez à pédaler ou à ramer pour la réveiller, gardez le téléphone près d'elle et vérifiez qu'elle n'est pas connectée à une autre app.",
  "lab.machines.err.noService": "{name} ne partage pas ses données de la façon standard, la connexion est donc impossible.",
  "lab.machines.err.lost": "Connexion perdue avec {name}. Ce qu'elle a envoyé est conservé. Touchez Connecter la machine pour continuer.",
  "lab.machines.err.failed":
    "Impossible de se connecter à {name}. Elle est peut-être connectée à une autre app ou montre : déconnectez-la, restez à côté et réessayez.",
  "lab.scale.title": "Balance connectée Bluetooth",
  "lab.scale.body":
    "Sous la pesée dans Progrès et Corps, un bouton connecte une balance qui partage sa mesure en Bluetooth de façon standard (les normes de pèse-personne et de composition corporelle). Montez dessus : votre poids et votre masse grasse se remplissent, prêts à enregistrer. Beaucoup de balances bon marché utilisent le protocole de leur propre app et n’apparaîtront pas. Dans l’app web, il faut Chrome.",
  "lab.scale.button": "Me peser sur ma balance",
  "lab.scale.which": "Quelles balances fonctionnent ?",
  "lab.scale.device": "la balance",
  "lab.scale.connecting": "Recherche de votre balance…",
  "lab.scale.waiting": "Montez sur {name} maintenant.",
  "lab.scale.got": "{name} a pris la mesure. Vérifiez-la et touchez {log}.",
  "lab.scale.err.notFound":
    "Aucune balance n’est apparue. Montez dessus pour la réveiller, gardez le téléphone à proximité et vérifiez qu’elle n’est pas connectée à sa propre app en ce moment.",
  "lab.scale.err.noService": "{name} ne partage pas sa mesure de façon standard, la connexion est donc impossible.",
  "lab.scale.err.timeout": "{name} n’a envoyé aucun poids. Remontez dessus et restez immobile jusqu’à ce qu’elle se stabilise.",
  "lab.scale.err.failed": "Impossible de se connecter à {name}. Fermez sa propre app, gardez le téléphone à proximité et réessayez.",
  "lab.handsFree.title": "Séries sans les mains",
  "lab.handsFree.body":
    "Pendant que la caméra, le mouvement du téléphone ou la montre compte vos répétitions, la série s'enregistre seule quelques secondes après votre dernière répétition et le repos commence : 4 secondes une fois les répétitions prévues faites, 8 s'il vous en manque. Annuler la retire. Nécessite l'un de ces labs de comptage activé.",
  "lab.handsFree.soon": "Enregistrement de cette série dans {s} s. Faites une autre répétition pour continuer.",
  "lab.watchAuto.title": "Séries mains libres avec la montre",
  "lab.watchAuto.body":
    "Avec le comptage des répétitions par la montre activé, ta montre gère toute la série. Après les 15 premières secondes de repos, lance ta série suivante : le repos s'arrête tout seul dès que la montre a compté 3 répétitions. Quelques secondes après ta dernière répétition, la série s'enregistre seule et le repos commence. Ta montre vibre à chaque fois. Annuler remet une série.",
  "lab.tempo.title": "Coach de tempo",
  "lab.tempo.body":
    "Sur les exercices avec tempo ou avec pause, comme le squat tempo ou le développé couché avec pause, ajoute Compter le tempo au-dessus de Valider la série. Touche-le en prenant la charge : après 3, 2, 1, il compte chaque seconde de chaque répétition par des sons et des vibrations, une note qui descend pour descendre, une note fixe pour tenir et une note qui monte pour monter, puis s'arrête après tes répétitions. Valider la série reste une seule touche.",
  "lab.volumeLog.title": "Le bouton de volume valide la série",
  "lab.volumeLog.body":
    "Pendant une séance, appuyez sur volume + du téléphone ou des écouteurs Bluetooth pour valider la série comme prévu, comme en touchant Valider la série. Pendant le repos, il valide la série suivante. Le volume revient aussitôt et votre musique continue ; volume − baisse toujours le son. Fonctionne tant que Liftsmith est à l'écran.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Contrôlez une enceinte Sonos depuis la séance : ce qui joue, titre suivant, pause et volume. Elle peut aussi suivre la séance, monter le son pendant les séries et le baisser au repos, lancer un favori Sonos et se mettre en pause à la fin. Connectez Sonos dans Apps connectées.",
};

export const de: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Stangenweg als Wiedergabe",
  "lab.barPath.body":
    "Nach Kniebeugen, Kreuzheben oder Schulterdrücken, die die Kamera zählt, spielt sie eine Wiederholung mit dem Weg der Stange über einer Strichfigur ab und gibt dir einen Tipp, wenn die Stange abgewichen ist. Von der Seite klappt es am besten. Nur die Punkte, die die Kamera gelesen hat, bleiben bis zu deinem nächsten Satz; es wird kein Video aufgenommen.",
  "lab.formCheck.title": "Technik-Check per Kamera",
  "lab.formCheck.body":
    "Während die Kamera Wiederholungen zählt, achtet sie auch darauf, wie sie laufen: Kniebeugen über der Parallele, verkürzte Wiederholungen und Neigen zu einer Seite. Zwischen den Sätzen gibt sie einen Tipp und zeigt ihn an der Figur. Für die Tiefe ist die Seitenansicht am besten; stell dich frontal zur Kamera, um eine Neigung zu prüfen.",
  "lab.speedMax.title": "Tagesmaximum aus dem Aufwärmen",
  "lab.speedMax.body":
    "Schätzt aus dem Stangentempo deiner Aufwärmsätze dein heutiges Maximum und schlägt vor dem ersten harten Satz ein etwas schwereres oder leichteres Arbeitsgewicht vor. Funktioniert bei Kniebeugen, Hüftbeugen, Drücken, Rudern und Klimmzügen und braucht deine Größe in Deine Daten. Sätze bis zum Muskelversagen, während die Kamera zählt, bringen ihm dein eigenes Tempo am Satzende bei.",
  "lab.barSpeed.title": "Stangengeschwindigkeit per Kamera",
  "lab.barSpeed.body":
    "Während die Kamera Wiederholungen zählt, zeigt sie auch, wie schnell sich die Stange bewegt, wie stark sie seit deiner schnellsten Wiederholung langsamer wurde und wann du den Satz beenden solltest. Trag deine Größe unter Deine Daten ein, um Geschwindigkeiten in m/s zu sehen.",
  "lab.hrRest.title": "Pause nach Puls",
  "lab.hrRest.body":
    "Mit verbundenem Pulsgurt oder verbundener Uhr endet die Pause früher, sobald dein Puls wieder nahe am Wert vom Satzbeginn ist. Sie wird nie um mehr als 40 % der geplanten Pause gekürzt, und +30 s verlängert weiterhin.",
  "lab.hrRest.cut":
    "Dein Puls ist wieder bei {bpm}, nahe den {start} vom Satzbeginn, deshalb ist die Pause {saved} s kürzer. Mach dich bereit.",
  "lab.row": "Labs",
  "lab.rowNote": "Probiere experimentelle Funktionen früher aus",
  "lab.title": "Labs",
  "lab.intro":
    "Experimente, die noch nicht für alle bereit sind. Sie können sich ändern, haken oder wieder verschwinden. Schalte ein, was du ausprobieren möchtest.",
  "lab.pro": "Labs ist Teil von Pro.",
  "lab.needs": "Braucht {lab}.",
  "lab.repCount.title": "Wiederholungen per Kamera zählen",
  "lab.repCount.body":
    "Fügt der Übung im Trainingsbildschirm Wiederholungen zählen hinzu. Die Kamera beobachtet deinen Satz, zeichnet die erkannten Knochen über dich und trägt deine Wiederholungen ein. Das Video bleibt auf deinem Handy.",
  "lab.repMotion.title": "Wiederholungen per Bewegungssensor zählen",
  "lab.repMotion.body": "Zählt Wiederholungen mit den Bewegungssensoren des Handys statt mit der Kamera. Weniger zuverlässig.",
  "lab.watchReps.title": "Wiederholungen per Uhr zählen",
  "lab.watchReps.body":
    "Deine Wear-OS-Uhr oder Apple Watch zählt bei jedem Satz die Wiederholungen an der Bewegung deines Handgelenks und trägt sie auf dem Handy in Satz eintragen ein. Dafür muss die Liftsmith-App auf der Uhr offen sein. Nicht für Übungen, bei denen die Hände stillstehen, wie Klimmzüge.",
  "lab.voiceLog.title": "Sätze per Stimme eintragen",
  "lab.voiceLog.body":
    "Fügt auf dem Trainingsbildschirm über Satz eintragen ein Mikrofon hinzu. Tipp darauf und sag „100 für 8“, „8 Wiederholungen“, „zu leicht“ oder „rückgängig“. Die Sprache wird auf deinem Handy erkannt und nie aufgenommen oder gesendet, daher braucht es ein Handy, das das in deiner Sprache kann.",
  "lab.machines.title": "Fitnessgeräte über Bluetooth",
  "lab.machines.body":
    "Verbinde beim Cardio ein Rad, ein Rudergerät, ein Laufband oder einen Crosstrainer, der seine Werte über Bluetooth teilt (der Fitnessgeräte-Standard, den die meisten neueren Geräte nutzen). Zeit, Strecke und Leistung füllen sich von selbst aus, bereit für Satz eintragen, und die Tasten funktionieren weiter, falls etwas nicht stimmt. In der Web-App braucht es Chrome.",
  "lab.machines.connect": "Gerät verbinden",
  "lab.machines.device": "das Gerät",
  "lab.machines.live": "{name} füllt diesen Satz aus.",
  "lab.machines.reconnecting": "Verbindung zu {name} wird wiederhergestellt… Was bisher gesendet wurde, bleibt erhalten.",
  "lab.machines.power": "{watts} W im Schnitt",
  "lab.machines.disconnect": "Trennen",
  "lab.machines.err.notFound":
    "Kein Fitnessgerät gefunden. Fang an zu treten oder zu rudern, um es aufzuwecken, bleib mit dem Handy in der Nähe und prüf, dass es nicht mit einer anderen App verbunden ist.",
  "lab.machines.err.noService": "{name} teilt seine Werte nicht auf die übliche Weise und kann daher nicht verbunden werden.",
  "lab.machines.err.lost":
    "Verbindung zu {name} verloren. Was bisher gesendet wurde, bleibt erhalten. Tippe auf Gerät verbinden, um weiterzumachen.",
  "lab.machines.err.failed":
    "Keine Verbindung zu {name}. Vielleicht ist es mit einer anderen App oder Uhr verbunden: trenn es dort, bleib in der Nähe und versuch es noch einmal.",
  "lab.scale.title": "Bluetooth-Waage",
  "lab.scale.body":
    "Unter dem Wiegen bei Fortschritt und Körper verbindet ein Button eine Waage, die ihren Messwert standardmäßig über Bluetooth teilt (die Standards für Personenwaagen und Körperzusammensetzung). Stell dich drauf, und dein Gewicht und Körperfett werden eingetragen, bereit zum Speichern. Viele günstige Waagen nutzen stattdessen das Protokoll ihrer eigenen App und erscheinen nicht. In der Web-App braucht es Chrome.",
  "lab.scale.button": "Auf meiner Waage wiegen",
  "lab.scale.which": "Welche Waagen funktionieren?",
  "lab.scale.device": "die Waage",
  "lab.scale.connecting": "Suche deine Waage …",
  "lab.scale.waiting": "Stell dich jetzt auf {name}.",
  "lab.scale.got": "{name} hat gemessen. Prüf den Wert und tippe auf {log}.",
  "lab.scale.err.notFound":
    "Keine Waage gefunden. Stell dich drauf, um sie aufzuwecken, halte das Handy in der Nähe und prüfe, dass sie gerade nicht mit ihrer eigenen App verbunden ist.",
  "lab.scale.err.noService": "{name} teilt ihren Messwert nicht standardmäßig, deshalb klappt die Verbindung nicht.",
  "lab.scale.err.timeout": "{name} hat kein Gewicht geschickt. Stell dich noch einmal drauf und steh still, bis sie sich einpendelt.",
  "lab.scale.err.failed":
    "Verbindung zu {name} fehlgeschlagen. Schließ ihre eigene App, halte das Handy in der Nähe und versuch es noch einmal.",
  "lab.handsFree.title": "Sätze ohne Hände",
  "lab.handsFree.body":
    "Während Kamera, Handybewegung oder Uhr deine Wiederholungen zählen, wird der Satz ein paar Sekunden nach der letzten Wiederholung von selbst eingetragen und die Pause beginnt: 4 Sekunden, wenn die geplanten Wiederholungen geschafft sind, 8, solange noch welche fehlen. Rückgängig nimmt ihn zurück. Braucht eines dieser Labs zum Zählen.",
  "lab.handsFree.soon": "Satz wird in {s} s eingetragen. Mach noch eine Wiederholung, um weiterzumachen.",
  "lab.watchAuto.title": "Freihändige Sätze mit der Uhr",
  "lab.watchAuto.body":
    "Wenn das Zählen der Wiederholungen mit der Uhr an ist, übernimmt deine Uhr den ganzen Satz. Nach den ersten 15 Sekunden Pause startest du einfach deinen nächsten Satz, und die Pause endet von selbst, sobald die Uhr 3 Wiederholungen gezählt hat. Ein paar Sekunden nach deiner letzten Wiederholung trägt sich der Satz selbst ein und die Pause beginnt. Deine Uhr vibriert jedes Mal. Rückgängig holt einen Satz zurück.",
  "lab.tempo.title": "Tempo-Coach",
  "lab.tempo.body":
    "Bei Tempo- und Pausenübungen wie Tempo-Kniebeugen oder Bankdrücken mit Pause erscheint über „Satz eintragen“ die Schaltfläche Tempo zählen. Tippe sie an, wenn du das Gewicht aufnimmst: Nach 3, 2, 1 zählt sie jede Sekunde jeder Wiederholung mit Tönen und Vibration, ein fallender Ton zum Ablassen, ein gleichbleibender zum Halten und ein steigender zum Hochdrücken, und hört nach deinen Wiederholungen auf. Satz eintragen bleibt ein Tippen.",
  "lab.volumeLog.title": "Lautstärketaste trägt den Satz ein",
  "lab.volumeLog.body":
    "Drück während des Trainings am Handy oder an den Bluetooth-Kopfhörern auf „Lauter“, um den Satz wie geplant einzutragen, genau wie mit „Satz eintragen“. In der Pause trägt sie den nächsten Satz ein. Die Lautstärke springt sofort zurück und deine Musik läuft weiter; „Leiser“ macht weiterhin leiser. Funktioniert, solange Liftsmith auf dem Bildschirm ist.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Steuere einen Sonos-Lautsprecher aus dem Training: was läuft, überspringen, pausieren und Lautstärke. Die Musik kann auch dem Training folgen, lauter in den Sätzen und leiser in der Pause, einen Sonos-Favoriten starten und am Ende pausieren. Verbinde Sonos in Verbundene Apps.",
};

export const it: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Replay della traiettoria del bilanciere",
  "lab.barPath.body":
    "Dopo uno squat, uno stacco o una lento avanti contati con la fotocamera, riproduce una ripetizione con la traiettoria del bilanciere disegnata su una figura stilizzata, e ti dà un consiglio se il bilanciere si è spostato. Di lato funziona meglio. Si tengono solo i punti letti dalla fotocamera, fino alla serie successiva; nessun video viene registrato.",
  "lab.formCheck.title": "Controllo della tecnica con la fotocamera",
  "lab.formCheck.body":
    "Mentre la fotocamera conta le ripetizioni, guarda anche come si muovono: squat che si fermano sopra il parallelo, ripetizioni accorciate e inclinazioni su un lato. Tra una serie e l’altra dà un consiglio e lo mostra sulla figura. Di lato è meglio per la profondità; mettiti di fronte per controllare se ti inclini.",
  "lab.speedMax.title": "Il massimale di oggi dal riscaldamento",
  "lab.speedMax.body":
    "Usa la velocità del bilanciere nelle serie di riscaldamento per stimare il massimale di oggi e, prima della prima serie pesante, suggerisce un carico di lavoro un po' più alto o più basso. Funziona su squat, hip hinge, distensioni, rematori e trazioni, e richiede la tua altezza in I tuoi dati. Le serie portate a cedimento mentre la fotocamera conta le insegnano la tua velocità di fine serie.",
  "lab.barSpeed.title": "Velocità del bilanciere con la fotocamera",
  "lab.barSpeed.body":
    "Mentre la fotocamera conta le ripetizioni, mostra anche quanto velocemente si muove il bilanciere, quanto ha rallentato rispetto alla tua ripetizione più veloce e quando è il momento di chiudere la serie. Aggiungi la tua altezza in I tuoi dati per le velocità in m/s.",
  "lab.hrRest.title": "Recupero in base al battito",
  "lab.hrRest.body":
    "Con una fascia cardio o un orologio collegato, il recupero finisce prima quando la frequenza cardiaca torna vicina a quella di inizio serie. Non toglie mai più del 40% del recupero previsto, e +30 s aggiunge sempre tempo.",
  "lab.hrRest.cut":
    "La frequenza cardiaca è tornata a {bpm}, vicino ai {start} di inizio serie, quindi il recupero è più corto di {saved} s. Preparati.",
  "lab.row": "Labs",
  "lab.rowNote": "Prova in anteprima le funzioni sperimentali",
  "lab.title": "Labs",
  "lab.intro": "Esperimenti non ancora pronti per tutti. Possono cambiare, non funzionare bene o sparire. Attiva quello che vuoi provare.",
  "lab.pro": "Labs fa parte di Pro.",
  "lab.needs": "Richiede {lab} attivo.",
  "lab.repCount.title": "Conteggio delle ripetizioni con la fotocamera",
  "lab.repCount.body":
    "Aggiunge Conta ripetizioni all'esercizio nella schermata di allenamento. La fotocamera guarda la tua serie, disegna sopra di te le ossa che vede e inserisce le ripetizioni. Il video resta sul telefono.",
  "lab.repMotion.title": "Conteggio delle ripetizioni con il movimento del telefono",
  "lab.repMotion.body": "Conta le ripetizioni con i sensori di movimento del telefono invece della fotocamera. Meno affidabile.",
  "lab.watchReps.title": "Conteggio delle ripetizioni con l'orologio",
  "lab.watchReps.body":
    "Il tuo orologio Wear OS o Apple Watch conta le ripetizioni dal movimento del polso in ogni serie e le inserisce in Registra serie sul telefono. Serve l'app Liftsmith aperta sull'orologio. Non vale per gli esercizi in cui le mani restano ferme, come le trazioni.",
  "lab.voiceLog.title": "Registrare le serie con la voce",
  "lab.voiceLog.body":
    "Aggiunge un microfono sopra Registra serie nella schermata dell'allenamento. Toccalo e di' «100 per 8», «8 ripetizioni», «troppo facile» o «annulla». La voce viene riconosciuta sul telefono e non viene mai registrata né inviata, quindi serve un telefono che sappia farlo nella tua lingua.",
  "lab.machines.title": "Macchine da palestra via Bluetooth",
  "lab.machines.body":
    "Nel cardio, collega una bici, un vogatore, un tapis roulant o un'ellittica che condivide i suoi dati via Bluetooth (lo standard per macchine fitness usato dalla maggior parte delle macchine recenti). Tempo, distanza e potenza si compilano da soli, pronti per Registra serie, e i pulsanti funzionano comunque se qualcosa non torna. Nell'app web serve Chrome.",
  "lab.machines.connect": "Collega macchina",
  "lab.machines.device": "la macchina",
  "lab.machines.live": "{name} sta compilando questa serie.",
  "lab.machines.reconnecting": "Ricollegamento a {name}… Quello che ha inviato finora resta.",
  "lab.machines.power": "{watts} W di media",
  "lab.machines.disconnect": "Scollega",
  "lab.machines.err.notFound":
    "Non è comparsa nessuna macchina. Inizia a pedalare o remare per attivarla, tieni il telefono vicino e controlla che non sia collegata a un'altra app.",
  "lab.machines.err.noService": "{name} non condivide i suoi dati nel modo standard, quindi non si può collegare.",
  "lab.machines.err.lost": "Collegamento con {name} perso. Quello che ha inviato finora resta. Tocca Collega macchina per continuare.",
  "lab.machines.err.failed":
    "Impossibile collegarsi a {name}. Potrebbe essere collegata a un'altra app o a un orologio: scollegala lì, resta vicino e riprova.",
  "lab.scale.title": "Bilancia smart Bluetooth",
  "lab.scale.body":
    "Sotto la pesata in Progressi e Corpo, un pulsante collega una bilancia che condivide la sua misura via Bluetooth in modo standard (gli standard per bilance pesapersone e composizione corporea). Sali e il tuo peso e la massa grassa si compilano, pronti da registrare. Molte bilance economiche usano il protocollo della propria app e non compariranno. Nell’app web serve Chrome.",
  "lab.scale.button": "Pesami sulla mia bilancia",
  "lab.scale.which": "Quali bilance funzionano?",
  "lab.scale.device": "la bilancia",
  "lab.scale.connecting": "Cerco la tua bilancia…",
  "lab.scale.waiting": "Sali su {name} adesso.",
  "lab.scale.got": "{name} ha preso la misura. Controllala e tocca {log}.",
  "lab.scale.err.notFound":
    "Nessuna bilancia trovata. Salici sopra per svegliarla, tieni il telefono vicino e controlla che non sia collegata alla sua app in questo momento.",
  "lab.scale.err.noService": "{name} non condivide la sua misura in modo standard, quindi non si può collegare.",
  "lab.scale.err.timeout": "{name} non ha inviato nessun peso. Risali e resta fermo finché non si stabilizza.",
  "lab.scale.err.failed": "Impossibile collegarsi a {name}. Chiudi la sua app, tieni il telefono vicino e riprova.",
  "lab.handsFree.title": "Serie a mani libere",
  "lab.handsFree.body":
    "Mentre la fotocamera, il movimento del telefono o l'orologio contano le ripetizioni, la serie si registra da sola pochi secondi dopo l'ultima ripetizione e parte il recupero: 4 secondi quando hai fatto le ripetizioni previste, 8 se ne mancano. Annulla la toglie. Serve uno di questi lab di conteggio attivo.",
  "lab.handsFree.soon": "Registro questa serie tra {s} s. Fai un'altra ripetizione per continuare.",
  "lab.watchAuto.title": "Serie a mani libere con l'orologio",
  "lab.watchAuto.body":
    "Con il conteggio delle ripetizioni con l'orologio attivo, il tuo orologio gestisce l'intera serie. Dopo i primi 15 secondi di recupero, inizia la serie successiva e il recupero finisce da solo appena l'orologio conta 3 ripetizioni. Pochi secondi dopo l'ultima ripetizione la serie si registra da sola e parte il recupero. L'orologio vibra ogni volta. Annulla riporta indietro una serie.",
  "lab.tempo.title": "Coach del tempo",
  "lab.tempo.body":
    "Negli esercizi a tempo o con fermo, come lo squat a tempo o la panca con fermo, aggiunge Conta il tempo sopra Registra serie. Toccalo mentre prendi il peso: dopo 3, 2, 1 conta ogni secondo di ogni ripetizione con suoni e vibrazioni, una nota che scende per scendere, una ferma per tenere e una che sale per salire, poi si ferma dopo le tue ripetizioni. Registrare la serie resta un solo tocco.",
  "lab.volumeLog.title": "Il tasto del volume registra la serie",
  "lab.volumeLog.body":
    "Durante l'allenamento, premi volume su del telefono o degli auricolari Bluetooth per registrare la serie come prevista, come toccare Registra serie. Se lo premi durante il recupero, registra la serie successiva. Il volume torna subito com'era e la musica continua; volume giù continua ad abbassarlo. Funziona mentre Liftsmith è sullo schermo.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Controlla un altoparlante Sonos dall'allenamento: cosa suona, salta, pausa e volume. Può anche seguire l'allenamento, alzando la musica nelle serie e abbassandola nel recupero, avviando un preferito Sonos e mettendo in pausa alla fine. Collega Sonos in App collegate.",
};

export const ja: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "バーの軌道リプレイ",
  "lab.barPath.body":
    "カメラでカウントしたスクワット、デッドリフト、ショルダープレスのあと、棒人間の上にバーの軌道を描いて1レップを再生し、バーがずれていればひとこと助言します。横からの撮影がいちばんです。保存されるのはカメラが読んだ点だけで、次のセットまでです。動画は記録しません。",
  "lab.formCheck.title": "カメラでフォームチェック",
  "lab.formCheck.body":
    "カメラがレップを数えている間、動き方もチェックします。パラレルより浅いスクワット、短くなったレップ、左右への傾きです。セット間にひとつだけアドバイスを出し、フィギュアで示します。深さは横から、傾きはカメラの正面に立つと確認できます。",
  "lab.speedMax.title": "ウォームアップから今日の最大重量",
  "lab.speedMax.body":
    "ウォームアップのバースピードから今日の最大重量を推定し、最初のきついセットの前に少し重め・軽めのメイン重量を提案します。スクワット、ヒンジ、プレス、ロウ、懸垂に対応。「あなたのデータ」に身長の入力が必要です。カメラでカウントしながら限界まで行ったセットから、あなた自身のセット終盤スピードを学習します。",
  "lab.barSpeed.title": "カメラでバースピード",
  "lab.barSpeed.body":
    "カメラがレップを数えている間、バーの速さ、いちばん速いレップからどれだけ落ちたか、セットを終えるタイミングも表示します。m/s で表示するには「あなたのデータ」に身長を入力してください。",
  "lab.hrRest.title": "心拍数で休憩タイマー",
  "lab.hrRest.body":
    "心拍計やウォッチを接続していると、心拍数がセット開始時の近くまで戻った時点で休憩を早めに終えます。予定の休憩の40%より多くは短縮せず、+30秒でいつでも延長できます。",
  "lab.hrRest.cut": "心拍数が{bpm}まで戻り、セット開始時の{start}に近づいたので、休憩を{saved}秒短くしました。準備してください。",
  "lab.row": "Labs",
  "lab.rowNote": "試験中の機能をいち早く試せます",
  "lab.title": "Labs",
  "lab.intro":
    "まだ全員向けではない試験中の機能です。変更されたり、うまく動かなかったり、なくなったりすることがあります。試したいものをオンにしてください。",
  "lab.pro": "Labs は Pro の機能です。",
  "lab.needs": "{lab}をオンにする必要があります。",
  "lab.repCount.title": "カメラでレップをカウント",
  "lab.repCount.body":
    "ワークアウト画面の種目にレップカウントを追加します。カメラがセットを見て、認識した骨格をあなたの上に描き、レップ数を入力します。映像はスマートフォンの外に出ません。",
  "lab.repMotion.title": "端末のモーションでレップをカウント",
  "lab.repMotion.body": "カメラの代わりにスマートフォンのモーションセンサーでレップを数えます。精度は低めです。",
  "lab.watchReps.title": "ウォッチでレップをカウント",
  "lab.watchReps.body":
    "Wear OS ウォッチまたは Apple Watch が、各セットで手首の動きからレップを数え、スマートフォンの「セットを記録」に入力します。ウォッチで Liftsmith アプリを開いておく必要があります。懸垂のように手が動かない種目には使えません。",
  "lab.voiceLog.title": "声でセットを記録",
  "lab.voiceLog.body":
    "ワークアウト画面の「セットを記録」の上にマイクを追加します。タップして「100キロで8回」「8回」「簡単すぎ」「取り消し」のように言ってください。音声はスマートフォン上で認識され、録音や送信はされないため、お使いの言語でそれができるスマートフォンが必要です。",
  "lab.machines.title": "Bluetooth ジムマシン",
  "lab.machines.body":
    "有酸素運動で、Bluetooth でデータを共有するバイク、ローイングマシン、トレッドミル、クロストレーナー（最近のほとんどのマシンが使うフィットネスマシンの標準規格）を接続します。時間、距離、パワーが自動で入力され、そのまま「セットを記録」できます。値がずれていてもボタンで直せます。Web アプリでは Chrome が必要です。",
  "lab.machines.connect": "マシンを接続",
  "lab.machines.device": "マシン",
  "lab.machines.live": "{name}がこのセットを入力しています。",
  "lab.machines.reconnecting": "{name}に再接続しています… これまでに送られたデータは残ります。",
  "lab.machines.power": "平均 {watts} W",
  "lab.machines.disconnect": "切断",
  "lab.machines.err.notFound":
    "ジムマシンが見つかりませんでした。ペダルをこぐかローイングを始めてマシンを起動し、スマートフォンを近づけ、ほかのアプリに接続されていないか確認してください。",
  "lab.machines.err.noService": "{name}は標準の方法でデータを共有していないため、接続できません。",
  "lab.machines.err.lost": "{name}との接続が切れました。これまでに送られたデータは残ります。「マシンを接続」をタップして続けてください。",
  "lab.machines.err.failed":
    "{name}に接続できませんでした。ほかのアプリやウォッチに接続されている可能性があります。そちらで切断し、近くで再度お試しください。",
  "lab.scale.title": "Bluetooth 体重計",
  "lab.scale.body":
    "「進捗」と「からだ」の体重記録の下に、Bluetooth の標準規格（体重計と体組成の規格）で測定値を共有する体重計に接続するボタンが出ます。乗ると体重と体脂肪率が入力され、そのまま記録できます。安価な体重計の多くは独自アプリの方式を使うため表示されません。Web アプリでは Chrome が必要です。",
  "lab.scale.button": "体重計で測る",
  "lab.scale.which": "使える体重計",
  "lab.scale.device": "体重計",
  "lab.scale.connecting": "体重計を探しています…",
  "lab.scale.waiting": "{name}に乗ってください。",
  "lab.scale.got": "{name}で測定しました。確認して「{log}」をタップしてください。",
  "lab.scale.err.notFound":
    "体重計が見つかりません。乗って起動し、スマホを近くに置き、体重計の専用アプリにつながっていないか確認してください。",
  "lab.scale.err.noService": "{name}は標準の方式で測定値を共有しないため、接続できません。",
  "lab.scale.err.timeout": "{name}から体重が届きませんでした。もう一度乗り、表示が安定するまで動かないでください。",
  "lab.scale.err.failed": "{name}に接続できませんでした。専用アプリを閉じ、スマホを近くに置いてもう一度お試しください。",
  "lab.handsFree.title": "ハンズフリーセット",
  "lab.handsFree.body":
    "カメラ、スマホのモーション、またはウォッチでレップを数えている間、最後のレップから数秒後にセットが自動で記録され、休憩が始まります。予定のレップに届いていれば4秒、足りなければ8秒です。元に戻すで取り消せます。いずれかのレップカウントのラボをオンにしてください。",
  "lab.handsFree.soon": "{s}秒後にこのセットを記録します。続けるにはもう1レップ。",
  "lab.watchAuto.title": "ウォッチでハンズフリーセット",
  "lab.watchAuto.body":
    "ウォッチでのレップカウントがオンのとき、セット全体をウォッチが進めます。休憩の最初の15秒が過ぎたら次のセットを始めてください。ウォッチが3レップ数えると休憩が自動で終わります。最後のレップの数秒後にセットが自動で記録され、休憩が始まります。そのたびにウォッチが振動します。元に戻すでセットを戻せます。",
  "lab.tempo.title": "テンポコーチ",
  "lab.tempo.body":
    "テンポスクワットや一時停止ベンチプレスなど、テンポや停止のある種目で「セットを記録」の上に「テンポを数える」が出ます。重さを持つときにタップすると、3、2、1のあとに各レップの1秒ごとを音と振動で数えます。下ろすときは下がる音、止めるときは同じ音、上げるときは上がる音で、決めたレップ数が終わると止まります。セットの記録はこれまでどおりワンタップです。",
  "lab.volumeLog.title": "音量ボタンでセットを記録",
  "lab.volumeLog.body":
    "ワークアウト中にスマホまたはBluetoothイヤホンの音量アップを押すと、「セットを記録」をタップしたのと同じく予定どおりにセットを記録します。休憩中に押すと次のセットを記録します。音量はすぐ元に戻り、音楽はそのまま流れます。音量ダウンはこれまでどおり音量を下げます。Liftsmithが画面に表示されている間に使えます。",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "ワークアウト中に Sonos スピーカーを操作します。再生中の曲、スキップ、一時停止、音量。ワークアウトに合わせて、セット中は音楽を大きく、休憩中は小さくし、Sonos のお気に入りで始めて、終了時に一時停止することもできます。連携アプリで Sonos を接続してください。",
};

export const pt: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Replay do trajeto da barra",
  "lab.barPath.body":
    "Depois de um agachamento, levantamento terra ou desenvolvimento contado pela câmera, mostra de novo uma rep com o trajeto da barra desenhado sobre um boneco de palitos e dá uma dica se a barra saiu da linha. De lado funciona melhor. Só os pontos que a câmera leu ficam guardados, até a sua próxima série; nenhum vídeo é gravado.",
  "lab.formCheck.title": "Checagem de técnica pela câmera",
  "lab.formCheck.body":
    "Enquanto a câmera conta as reps, ela também observa como elas se movem: agachamentos que param acima da paralela, reps curtas e inclinação para um lado. Entre as séries, dá uma dica e mostra na figura. De lado é melhor para a profundidade; de frente para a câmera, para ver a inclinação.",
  "lab.speedMax.title": "Máximo do dia pelo aquecimento",
  "lab.speedMax.body":
    "Usa a velocidade da barra no aquecimento para estimar o máximo de hoje e sugere um peso de trabalho um pouco mais pesado ou mais leve antes da primeira série pesada. Funciona em agachamentos, levantamentos de quadril, empurradas, remadas e barras fixas, e precisa da sua altura em Seus dados. Séries levadas até a falha com a câmera contando ensinam a ela a sua própria velocidade de fim de série.",
  "lab.barSpeed.title": "Velocidade da barra pela câmera",
  "lab.barSpeed.body":
    "Enquanto a câmera conta as reps, ela também mostra a velocidade da barra, quanto ela desacelerou desde a sua rep mais rápida e a hora de terminar a série. Adicione sua altura em Seus dados para ver velocidades em m/s.",
  "lab.hrRest.title": "Timer de descanso pela frequência cardíaca",
  "lab.hrRest.body":
    "Com um monitor cardíaco ou relógio conectado, o descanso termina mais cedo quando sua frequência cardíaca volta perto de onde estava no início da série. Ele nunca corta mais de 40% do descanso planejado, e +30 s ainda adiciona tempo.",
  "lab.hrRest.cut":
    "A frequência voltou a {bpm}, perto dos {start} com que você começou a série, então o descanso ficou {saved} s mais curto. Prepare-se.",
  "lab.row": "Labs",
  "lab.rowNote": "Teste recursos experimentais antes",
  "lab.title": "Labs",
  "lab.intro":
    "Experimentos que ainda não estão prontos para todo mundo. Eles podem mudar, falhar ou sumir. Ative o que você quiser testar.",
  "lab.pro": "Labs faz parte do Pro.",
  "lab.needs": "Precisa de {lab} ativado.",
  "lab.repCount.title": "Contagem de reps pela câmera",
  "lab.repCount.body":
    "Adiciona Contar reps ao exercício na tela de treino. A câmera acompanha sua série, desenha sobre você o esqueleto que enxerga e preenche suas reps. O vídeo fica no seu celular.",
  "lab.repMotion.title": "Contagem de reps pelo movimento do celular",
  "lab.repMotion.body": "Conta as reps pelos sensores de movimento do celular em vez da câmera. Menos confiável.",
  "lab.watchReps.title": "Contagem de reps pelo relógio",
  "lab.watchReps.body":
    "Seu relógio Wear OS ou Apple Watch conta as reps pelo pulso em cada série e preenche para Registrar série no celular. Precisa do app Liftsmith aberto no relógio. Não serve para exercícios em que as mãos ficam paradas, como a barra fixa.",
  "lab.voiceLog.title": "Registro de séries por voz",
  "lab.voiceLog.body":
    "Adiciona um microfone acima de Registrar série na tela de treino. Toque nele e diga “100 por 8”, “8 reps”, “fácil demais” ou “desfazer”. A fala é reconhecida no seu celular e nunca é gravada nem enviada, então precisa de um celular que faça isso no seu idioma.",
  "lab.machines.title": "Aparelhos de academia Bluetooth",
  "lab.machines.body":
    "No cardio, conecte uma bike, remo, esteira ou elíptico que compartilhe os dados por Bluetooth (o padrão de aparelhos fitness que a maioria dos modelos novos usa). Tempo, distância e potência se preenchem sozinhos, prontos para Registrar série, e os ajustes manuais continuam funcionando se algo estiver errado. No app web, precisa do Chrome.",
  "lab.machines.connect": "Conectar aparelho",
  "lab.machines.device": "o aparelho",
  "lab.machines.live": "{name} está preenchendo esta série.",
  "lab.machines.reconnecting": "Reconectando a {name}… O que ele já enviou fica guardado.",
  "lab.machines.power": "{watts} W de média",
  "lab.machines.disconnect": "Desconectar",
  "lab.machines.err.notFound":
    "Nenhum aparelho apareceu. Comece a pedalar ou remar para ativá-lo, mantenha o celular perto e confira se ele não está conectado a outro app.",
  "lab.machines.err.noService": "{name} não compartilha os dados do jeito padrão, então não dá para conectar.",
  "lab.machines.err.lost": "Conexão com {name} perdida. O que ele já enviou fica guardado. Toque em Conectar aparelho para continuar.",
  "lab.machines.err.failed":
    "Não foi possível conectar a {name}. Ele pode estar conectado a outro app ou relógio: desconecte lá, mantenha perto e tente de novo.",
  "lab.scale.title": "Balança inteligente Bluetooth",
  "lab.scale.body":
    "Abaixo da pesagem em Progresso e Corpo, um botão conecta uma balança que compartilha a leitura por Bluetooth do jeito padrão (os padrões de balança e composição corporal). Suba nela, e seu peso e gordura corporal se preenchem, prontos para registrar. Muitas balanças baratas usam o protocolo do próprio app e não vão aparecer. No app web, precisa do Chrome.",
  "lab.scale.button": "Pesar na minha balança",
  "lab.scale.which": "Quais balanças funcionam?",
  "lab.scale.device": "a balança",
  "lab.scale.connecting": "Procurando sua balança…",
  "lab.scale.waiting": "Suba na {name} agora.",
  "lab.scale.got": "{name} fez a leitura. Confira e toque em {log}.",
  "lab.scale.err.notFound":
    "Nenhuma balança apareceu. Suba nela para ativá-la, mantenha o celular perto e confira se ela não está conectada ao próprio app agora.",
  "lab.scale.err.noService": "{name} não compartilha a leitura do jeito padrão, então não dá para conectar.",
  "lab.scale.err.timeout": "{name} não enviou um peso. Suba de novo e fique parado até estabilizar.",
  "lab.scale.err.failed": "Não foi possível conectar a {name}. Feche o app dela, mantenha o celular perto e tente de novo.",
  "lab.handsFree.title": "Séries sem as mãos",
  "lab.handsFree.body":
    "Enquanto a contagem de reps pela câmera, pelo movimento do celular ou pelo relógio estiver contando, a série se registra sozinha alguns segundos depois da sua última rep e o descanso começa: 4 segundos quando as reps planejadas estiverem feitas, 8 enquanto faltarem. Desfazer coloca de volta. Precisa de um desses labs de contagem de reps ativado.",
  "lab.handsFree.soon": "Registrando esta série em {s} s. Faça mais uma rep para continuar.",
  "lab.watchAuto.title": "Séries sem as mãos com o relógio",
  "lab.watchAuto.body":
    "Com a contagem de repetições pelo relógio ligada, seu relógio cuida da série inteira. Depois dos primeiros 15 segundos de descanso, comece a próxima série e o descanso termina sozinho quando o relógio contar 3 repetições. Alguns segundos depois da sua última repetição, a série é registrada sozinha e o descanso começa. Seu relógio vibra a cada vez. Desfazer traz uma série de volta.",
  "lab.tempo.title": "Coach de cadência",
  "lab.tempo.body":
    "Em exercícios com cadência ou pausa, como um agachamento com cadência ou um supino com pausa, adiciona Contar cadência acima de Registrar série. Toque quando pegar o peso: depois de 3, 2, 1, ele conta cada segundo de cada rep com sons e vibrações, uma nota descendo para baixar, uma constante para segurar e uma subindo para subir, e para depois das suas reps. Registrar série continua sendo um toque.",
  "lab.volumeLog.title": "Botão de volume registra a série",
  "lab.volumeLog.body":
    "Durante o treino, aperte o volume para cima no celular ou nos fones Bluetooth para registrar a série como planejado, igual a tocar em Registrar série. Apertado durante o descanso, registra a próxima série. O volume volta na hora e sua música continua tocando; o volume para baixo continua abaixando. Funciona com o Liftsmith na tela.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Controle uma caixa Sonos pelo treino: o que está tocando, pular, pausar e volume. Ela também pode acompanhar o treino, aumentando a música nas séries e abaixando no descanso, tocando um favorito do Sonos no início e pausando no fim. Conecte o Sonos em Apps conectados.",
};

export const ko: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "바 궤적 다시 보기",
  "lab.barPath.body":
    "카메라로 센 스쿼트, 데드리프트, 오버헤드 프레스 후에 반복 하나를 다시 재생하며 막대 인형 위에 바의 궤적을 그리고, 바가 흐르면 팁을 하나 알려 줘요. 옆에서 찍는 게 가장 좋아요. 카메라가 읽은 점만 다음 세트까지 보관하고, 영상은 녹화하지 않아요.",
  "lab.formCheck.title": "카메라 자세 체크",
  "lab.formCheck.body":
    "카메라가 반복을 세면서 움직임도 살펴봐요. 평행보다 위에서 멈추는 스쿼트, 짧게 끝난 반복, 한쪽으로 기우는 자세예요. 세트 사이에 팁을 하나 주고 인체 모형으로 보여 줘요. 깊이는 옆에서, 기울기는 카메라를 정면으로 보고 확인하는 게 가장 좋아요.",
  "lab.speedMax.title": "워밍업으로 보는 오늘의 최대 중량",
  "lab.speedMax.body":
    "워밍업의 바 속도로 오늘의 최대 중량을 추정하고, 첫 고강도 세트 전에 본 세트 무게를 조금 무겁게 또는 가볍게 제안해요. 스쿼트, 힌지, 프레스, 로우, 풀업에서 작동하며, 내 신체 정보에 키가 필요해요. 카메라가 세는 동안 한계까지 한 세트로 내 세트 마지막 속도를 학습해요.",
  "lab.barSpeed.title": "카메라 바 속도",
  "lab.barSpeed.body":
    "카메라가 반복을 세면서 바가 얼마나 빨리 움직이는지, 가장 빠른 반복보다 얼마나 느려졌는지, 언제 세트를 끝내면 좋을지도 보여 줘요. 내 신체 정보에 키를 추가하면 속도를 m/s로 볼 수 있어요.",
  "lab.hrRest.title": "심박수 휴식 타이머",
  "lab.hrRest.body":
    "심박 모니터나 워치를 연결하면, 심박수가 세트를 시작할 때 수준 가까이 돌아왔을 때 휴식이 일찍 끝나요. 계획된 휴식의 40% 넘게 줄이지는 않으며, +30초로 시간을 늘릴 수도 있어요.",
  "lab.hrRest.cut": "심박수가 {bpm}(으)로 돌아와 세트 시작 때의 {start}에 가까워져서 휴식을 {saved}초 줄였어요. 준비하세요.",
  "lab.row": "실험실",
  "lab.rowNote": "실험 기능을 먼저 써 보세요",
  "lab.title": "실험실",
  "lab.intro": "아직 모두에게 내놓기엔 이른 실험 기능이에요. 바뀌거나, 오작동하거나, 사라질 수 있어요. 써 보고 싶은 기능을 켜세요.",
  "lab.pro": "실험실은 Pro 기능이에요.",
  "lab.needs": "{lab}을(를) 켜야 해요.",
  "lab.repCount.title": "카메라 반복 세기",
  "lab.repCount.body":
    "운동 화면의 운동 동작에 반복 세기를 추가해요. 카메라가 세트를 보면서 인식한 뼈대를 몸 위에 그리고 반복 수를 채워 줘요. 영상은 휴대폰에만 남아요.",
  "lab.repMotion.title": "휴대폰 동작 감지 반복 세기",
  "lab.repMotion.body": "카메라 대신 휴대폰의 동작 센서로 반복을 세요. 정확도는 떨어져요.",
  "lab.watchReps.title": "워치 반복 세기",
  "lab.watchReps.body":
    "Wear OS 워치나 Apple Watch가 세트마다 손목 움직임으로 반복을 세서 휴대폰의 세트 기록에 채워 줘요. 손목에서 Liftsmith 워치 앱이 열려 있어야 해요. 풀업처럼 손이 움직이지 않는 리프트에는 맞지 않아요.",
  "lab.voiceLog.title": "음성 세트 기록",
  "lab.voiceLog.body":
    "운동 화면의 세트 기록 위에 마이크를 추가해요. 탭하고 “100에 8회”, “8회”, “너무 쉬워”, “취소”라고 말하세요. 음성은 휴대폰에서 인식하고 절대 녹음하거나 전송하지 않으므로, 내 언어로 음성 인식을 할 수 있는 휴대폰이 필요해요.",
  "lab.machines.title": "Bluetooth 운동 기구",
  "lab.machines.body":
    "유산소 운동에서 Bluetooth로 수치를 공유하는 실내 자전거, 로잉 머신, 러닝머신, 크로스 트레이너를 연결하세요(최신 기구 대부분이 쓰는 피트니스 기구 표준). 시간, 거리, 파워가 자동으로 채워져 바로 세트 기록을 할 수 있고, 무언가 맞지 않으면 직접 조절할 수도 있어요. 웹 앱에서는 Chrome이 필요해요.",
  "lab.machines.connect": "기구 연결",
  "lab.machines.device": "운동 기구",
  "lab.machines.live": "{name}이(가) 이 세트를 채우고 있어요.",
  "lab.machines.reconnecting": "{name}에 다시 연결하는 중… 지금까지 받은 값은 유지돼요.",
  "lab.machines.power": "평균 {watts}W",
  "lab.machines.disconnect": "연결 끊기",
  "lab.machines.err.notFound":
    "운동 기구를 찾지 못했어요. 페달을 밟거나 노를 저어 기구를 깨우고, 휴대폰을 가까이 두고, 다른 앱에 연결돼 있지 않은지 확인하세요.",
  "lab.machines.err.noService": "{name}은(는) 표준 방식으로 수치를 공유하지 않아서 연결할 수 없어요.",
  "lab.machines.err.lost": "{name} 연결이 끊겼어요. 지금까지 받은 값은 유지돼요. 기구 연결을 탭해서 계속하세요.",
  "lab.machines.err.failed":
    "{name}에 연결하지 못했어요. 다른 앱이나 워치에 연결돼 있을 수 있어요. 거기서 연결을 끊고 가까이 둔 다음 다시 시도하세요.",
  "lab.scale.title": "Bluetooth 스마트 체중계",
  "lab.scale.body":
    "진행과 몸 화면의 체중 기록 아래에 있는 버튼으로, Bluetooth 표준 방식(체중계 및 체성분 표준)으로 측정값을 공유하는 체중계를 연결해요. 올라서면 체중과 체지방이 채워져 바로 기록할 수 있어요. 저렴한 체중계 중에는 자체 앱 프로토콜을 써서 나타나지 않는 것이 많아요. 웹 앱에서는 Chrome이 필요해요.",
  "lab.scale.button": "체중계로 재기",
  "lab.scale.which": "어떤 체중계가 되나요?",
  "lab.scale.device": "체중계",
  "lab.scale.connecting": "체중계를 찾는 중…",
  "lab.scale.waiting": "지금 {name}에 올라서세요.",
  "lab.scale.got": "{name}이(가) 측정했어요. 확인하고 {log}을(를) 탭하세요.",
  "lab.scale.err.notFound":
    "체중계를 찾지 못했어요. 올라서서 체중계를 깨우고, 휴대폰을 가까이 두고, 지금 체중계 전용 앱에 연결돼 있지 않은지 확인하세요.",
  "lab.scale.err.noService": "{name}은(는) 표준 방식으로 측정값을 공유하지 않아서 연결할 수 없어요.",
  "lab.scale.err.timeout": "{name}이(가) 체중을 보내지 않았어요. 다시 올라서서 숫자가 멈출 때까지 가만히 서 계세요.",
  "lab.scale.err.failed": "{name}에 연결하지 못했어요. 체중계 전용 앱을 닫고, 휴대폰을 가까이 둔 다음 다시 시도하세요.",
  "lab.handsFree.title": "핸즈프리 세트",
  "lab.handsFree.body":
    "카메라, 휴대폰 동작 감지, 워치 반복 세기가 작동하는 동안 마지막 반복 몇 초 뒤에 세트가 자동으로 기록되고 휴식이 시작돼요. 계획한 반복을 채우면 4초, 모자라면 8초 뒤예요. 실행 취소로 되돌릴 수 있어요. 반복 세기 실험 기능 중 하나를 켜야 해요.",
  "lab.handsFree.soon": "{s}초 후 이 세트를 기록해요. 계속하려면 한 번 더 반복하세요.",
  "lab.watchAuto.title": "워치로 손 안 대는 세트",
  "lab.watchAuto.body":
    "워치 반복 횟수 세기가 켜져 있으면 워치가 세트 전체를 맡아요. 휴식의 처음 15초가 지나면 다음 세트를 시작하세요. 워치가 3회를 세면 휴식이 저절로 끝나요. 마지막 반복 몇 초 뒤에 세트가 저절로 기록되고 휴식이 시작돼요. 그때마다 워치가 진동해요. 실행 취소로 세트를 되돌릴 수 있어요.",
  "lab.tempo.title": "템포 코치",
  "lab.tempo.body":
    "템포 스쿼트나 포즈 벤치 프레스 같은 템포 및 정지 리프트에서 세트 기록 위에 템포 세기를 추가해요. 무게를 들 때 탭하세요. 3, 2, 1 뒤에 반복마다 매초를 소리와 진동으로 세어 줘요. 내릴 때는 내려가는 음, 버틸 때는 일정한 음, 올릴 때는 올라가는 음이고, 반복을 마치면 멈춰요. 세트 기록은 여전히 한 번 탭이에요.",
  "lab.volumeLog.title": "볼륨 버튼으로 세트 기록",
  "lab.volumeLog.body":
    "운동 중에 휴대폰이나 Bluetooth 이어폰의 볼륨 업 버튼을 누르면 세트 기록을 탭한 것처럼 계획대로 세트를 기록해요. 휴식 중에 누르면 다음 세트를 기록해요. 볼륨은 바로 원래대로 돌아가고 음악도 계속 재생돼요. 볼륨 다운은 그대로 볼륨을 줄여요. Liftsmith가 화면에 떠 있을 때 작동해요.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "운동 중에 Sonos 스피커를 조작하세요. 재생 중인 곡, 건너뛰기, 일시 정지, 볼륨이에요. 운동에 맞춰 세트 때는 음악을 키우고 휴식 때는 줄이며, 시작할 때 Sonos 즐겨찾기를 틀고 끝날 때 일시 정지할 수도 있어요. 연결된 앱에서 Sonos를 연결하세요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Bar yolu tekrarı",
  "lab.barPath.body":
    "Kamerayla sayılan bir squat, deadlift ya da overhead press'ten sonra bir tekrarı, barın yolu bir çöp adam üzerine çizilmiş olarak tekrar oynatır ve bar kaydıysa bir ipucu verir. En iyisi yandan. Sadece kameranın okuduğu noktalar bir sonraki setine kadar saklanır; video kaydedilmez.",
  "lab.formCheck.title": "Kamerayla form kontrolü",
  "lab.formCheck.body":
    "Kamera tekrarları sayarken nasıl hareket ettiklerini de izler: paralelin üstünde kalan squatlar, kısa kesilen tekrarlar ve bir yana yatma. Setler arasında bir ipucu verir ve figürde gösterir. Derinlik için en iyisi yandan; yana yatmayı kontrol etmek için kameraya dön.",
  "lab.speedMax.title": "Isınmalardan bugünkü maksimum",
  "lab.speedMax.body":
    "Bugünkü maksimumunu tahmin etmek için ısınmalarındaki bar hızını kullanır, sonra ilk zor setinden önce biraz daha ağır ya da hafif bir çalışma ağırlığı önerir. Squat, hinge, press, row ve barfikslerde çalışır ve Bilgilerin'de boyunun girilmiş olmasını ister. Kamera sayarken tükenişe kadar götürdüğün setler ona kendi set sonu hızını öğretir.",
  "lab.barSpeed.title": "Kamerayla bar hızı",
  "lab.barSpeed.body":
    "Kamera tekrarları sayarken barın ne kadar hızlı gittiğini, en hızlı tekrarından bu yana ne kadar yavaşladığını ve seti bitirme zamanının geldiğini de gösterir. Hızları m/s olarak görmek için Bilgilerin'e boyunu ekle.",
  "lab.hrRest.title": "Nabza göre dinlenme sayacı",
  "lab.hrRest.body":
    "Bir nabız ölçer ya da saat bağlıyken, nabzın set başladığındaki seviyeye yakın dönünce dinlenme erken biter. Planlanan dinlenmenin %40'ından fazlasını asla kesmez ve +30 s yine süre ekler.",
  "lab.hrRest.cut": "Nabzın {bpm} seviyesine döndü, o sete başladığın {start} değerine yakın; bu yüzden dinlenme {saved} s kısa. Hazırlan.",
  "lab.row": "Laboratuvar",
  "lab.rowNote": "Deneysel özellikleri erkenden dene",
  "lab.title": "Laboratuvar",
  "lab.intro": "Henüz herkese hazır olmayan deneyler. Değişebilir, tuhaf davranabilir ya da kaldırılabilirler. Denemek istediklerini aç.",
  "lab.pro": "Laboratuvar, Pro'nun bir parçası.",
  "lab.needs": "{lab} açık olmalı.",
  "lab.repCount.title": "Kamerayla tekrar sayma",
  "lab.repCount.body":
    "Antrenman ekranındaki egzersize Tekrarları say ekler. Kamera setini izler, gördüğü iskeleti üzerine çizer ve tekrarlarını doldurur. Video telefonunda kalır.",
  "lab.repMotion.title": "Telefon hareketiyle tekrar sayma",
  "lab.repMotion.body": "Tekrarları kamera yerine telefonun hareket sensörleriyle say. Daha az güvenilir.",
  "lab.watchReps.title": "Saatle tekrar sayma",
  "lab.watchReps.body":
    "Wear OS saatin ya da Apple Watch'ın her set boyunca bileğinden tekrarları sayar ve telefonundaki Seti kaydet için doldurur. Bileğinde Liftsmith saat uygulamasının açık olması gerekir. Barfiks gibi ellerin sabit kaldığı hareketler için değil.",
  "lab.voiceLog.title": "Sesle set kaydı",
  "lab.voiceLog.body":
    "Antrenman ekranında Seti kaydet'in üstüne bir mikrofon ekler. Dokun ve “100'e 8”, “8 tekrar”, “çok kolay” ya da “geri al” de. Konuşma telefonunda tanınır, asla kaydedilmez ya da gönderilmez; bu yüzden bunu senin dilinde yapabilen bir telefon gerekir.",
  "lab.machines.title": "Bluetooth spor aletleri",
  "lab.machines.body":
    "Kardiyoda, sayılarını Bluetooth üzerinden paylaşan bir bisiklet, kürek, koşu bandı ya da eliptik bağla (yeni aletlerin çoğunun kullandığı fitness aleti standardı). Süre, mesafe ve güç kendiliğinden dolar, Seti kaydet için hazır olur; bir şey yanlışsa ayarlayıcılar yine çalışır. Web uygulamasında Chrome gerekir.",
  "lab.machines.connect": "Alet bağla",
  "lab.machines.device": "alet",
  "lab.machines.live": "{name} bu seti dolduruyor.",
  "lab.machines.reconnecting": "{name} cihazına yeniden bağlanılıyor… Şimdiye kadar gönderdikleri saklanıyor.",
  "lab.machines.power": "Ortalama {watts} W",
  "lab.machines.disconnect": "Bağlantıyı kes",
  "lab.machines.err.notFound":
    "Hiç spor aleti görünmedi. Uyandırmak için pedal çevirmeye ya da kürek çekmeye başla, telefonunu yakın tut ve başka bir uygulamaya bağlı olmadığından emin ol.",
  "lab.machines.err.noService": "{name} sayılarını standart yolla paylaşmıyor, bu yüzden bağlanamıyor.",
  "lab.machines.err.lost": "{name} bağlantısı koptu. Şimdiye kadar gönderdikleri saklandı. Devam etmek için Alet bağla'ya dokun.",
  "lab.machines.err.failed":
    "{name} cihazına bağlanılamadı. Başka bir uygulamaya ya da saate bağlı olabilir: oradan bağlantısını kes, yakında tut ve tekrar dene.",
  "lab.scale.title": "Bluetooth akıllı tartı",
  "lab.scale.body":
    "İlerleme ve Vücut'taki tartı kaydının altında bir düğme, ölçümünü Bluetooth üzerinden standart yolla (tartı ve vücut kompozisyonu standartları) paylaşan bir tartıyı bağlar. Üstüne çık, kilon ve vücut yağın kaydetmeye hazır şekilde dolsun. Pek çok ucuz tartı bunun yerine kendi uygulamasının protokolünü kullanır ve görünmez. Web uygulamasında Chrome gerekir.",
  "lab.scale.button": "Tartımda tartıl",
  "lab.scale.which": "Hangi tartılar çalışır?",
  "lab.scale.device": "tartı",
  "lab.scale.connecting": "Tartın aranıyor…",
  "lab.scale.waiting": "Şimdi {name} üstüne çık.",
  "lab.scale.got": "{name} ölçtü. Kontrol et ve {log} seçeneğine dokun.",
  "lab.scale.err.notFound":
    "Hiç tartı görünmedi. Uyandırmak için üstüne çık, telefonunu yakın tut ve şu an kendi uygulamasına bağlı olmadığından emin ol.",
  "lab.scale.err.noService": "{name} ölçümünü standart yolla paylaşmıyor, bu yüzden bağlanamıyor.",
  "lab.scale.err.timeout": "{name} bir ağırlık göndermedi. Tekrar üstüne çık ve sabitlenene kadar kıpırdama.",
  "lab.scale.err.failed": "{name} cihazına bağlanılamadı. Kendi uygulamasını kapat, telefonunu yakın tut ve tekrar dene.",
  "lab.handsFree.title": "Eller serbest setler",
  "lab.handsFree.body":
    "Kamera, telefon hareketi ya da saatle tekrar sayma çalışırken set, son tekrarından birkaç saniye sonra kendini kaydeder ve dinlenme başlar: planlanan tekrarların tamamsa 4 saniye, eksikse 8 saniye. Geri al onu geri koyar. Bu tekrar sayma laboratuvarlarından birinin açık olması gerekir.",
  "lab.handsFree.soon": "Bu set {s} s içinde kaydediliyor. Devam etmek için bir tekrar daha yap.",
  "lab.watchAuto.title": "Saatle eller serbest setler",
  "lab.watchAuto.body":
    "Saatle tekrar sayma açıkken setin tamamını saatin yönetir. Dinlenmenin ilk 15 saniyesinden sonra bir sonraki setine başla; saat 3 tekrar saydığında dinlenme kendiliğinden biter. Son tekrarından birkaç saniye sonra set kendiliğinden kaydedilir ve dinlenme başlar. Saatin her seferinde titrer. Geri al bir seti geri getirir.",
  "lab.tempo.title": "Tempo koçu",
  "lab.tempo.body":
    "Tempo squat ya da duraklamalı bench press gibi tempolu ve duraklamalı hareketlerde Seti kaydet'in üstüne Tempoyu say ekler. Ağırlığı alırken dokun: 3, 2, 1'den sonra her tekrarın her saniyesini ses ve titreşimle sayar; indirmek için düşen bir nota, tutmak için sabit bir nota, kaldırmak için yükselen bir nota, tekrarların bitince de durur. Seti kaydet hâlâ tek dokunuş.",
  "lab.volumeLog.title": "Ses tuşu seti kaydeder",
  "lab.volumeLog.body":
    "Antrenman sırasında, seti plana göre kaydetmek için telefonunda ya da Bluetooth kulaklığında sesi açma tuşuna bas; Seti kaydet'e dokunmakla aynı. Dinlenmede basarsan sonraki seti kaydeder. Ses hemen eski haline döner ve müziğin çalmaya devam eder; ses kısma tuşu yine sesi kısar. Liftsmith ekrandayken çalışır.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Antrenmandan bir Sonos hoparlörünü kontrol et: çalan şarkı, geçme, duraklatma ve ses. Antrenmanı da takip edebilir: setlerde müziği açar, dinlenmede kısar, bir Sonos favorisini başlatır ve sonunda duraklatır. Sonos'u Bağlı uygulamalar'dan bağla.",
};

export const pl: Partial<Record<Key, Message>> = {
  "lab.barPath.title": "Powtórka toru sztangi",
  "lab.barPath.body":
    "Po przysiadzie, martwym ciągu lub wyciskaniu nad głowę liczonym kamerą odtwarza jedno powtórzenie z torem sztangi narysowanym na patyczkowej sylwetce i daje jedną wskazówkę, jeśli sztanga uciekła. Najlepiej z boku. Zachowywane są tylko punkty odczytane przez kamerę, do następnej serii; wideo nie jest nagrywane.",
  "lab.formCheck.title": "Kontrola techniki kamerą",
  "lab.formCheck.body":
    "Gdy kamera liczy powtórzenia, sprawdza też, jak przebiegają: przysiady kończone nad równoległą, skrócone powtórzenia i przechylanie się na bok. Między seriami daje jedną wskazówkę i pokazuje ją na sylwetce. Z boku najlepiej widać głębokość; stań przodem do kamery, żeby sprawdzić przechył.",
  "lab.speedMax.title": "Dzisiejsze maksimum z rozgrzewki",
  "lab.speedMax.body":
    "Na podstawie prędkości sztangi w rozgrzewce szacuje dzisiejsze maksimum, a potem proponuje trochę cięższy lub lżejszy ciężar roboczy przed pierwszą ciężką serią. Działa w przysiadach, ćwiczeniach z zawiasem biodrowym, wyciskaniach, wiosłowaniach i podciąganiach i wymaga podania wzrostu w Twoich danych. Serie do upadku liczone kamerą uczą go twojej prędkości z końca serii.",
  "lab.barSpeed.title": "Prędkość sztangi z kamery",
  "lab.barSpeed.body":
    "Gdy kamera liczy powtórzenia, pokazuje też, jak szybko porusza się sztanga, o ile zwolniła od najszybszego powtórzenia i kiedy czas zakończyć serię. Dodaj wzrost w Twoich danych, żeby widzieć prędkość w m/s.",
  "lab.hrRest.title": "Minutnik przerwy według tętna",
  "lab.hrRest.body":
    "Z podłączonym pulsometrem lub zegarkiem przerwa kończy się wcześniej, gdy tętno wróci blisko poziomu z początku serii. Nigdy nie skraca jej o więcej niż 40% planu, a +30 s nadal dodaje czas.",
  "lab.hrRest.cut": "Tętno wróciło do {bpm}, blisko {start} z początku serii, więc przerwa jest krótsza o {saved} s. Przygotuj się.",
  "lab.row": "Laboratorium",
  "lab.rowNote": "Wypróbuj eksperymentalne funkcje wcześniej",
  "lab.title": "Laboratorium",
  "lab.intro":
    "Eksperymenty, które nie są jeszcze gotowe dla wszystkich. Mogą się zmienić, działać dziwnie albo zniknąć. Włącz to, co chcesz wypróbować.",
  "lab.pro": "Laboratorium jest częścią Pro.",
  "lab.needs": "Wymaga włączenia: {lab}.",
  "lab.repCount.title": "Liczenie powtórzeń kamerą",
  "lab.repCount.body":
    "Dodaje Licz powtórzenia do ćwiczenia na ekranie treningu. Kamera obserwuje serię, rysuje na tobie wykryte kości i wpisuje powtórzenia. Wideo zostaje na telefonie.",
  "lab.repMotion.title": "Liczenie powtórzeń ruchem telefonu",
  "lab.repMotion.body": "Liczy powtórzenia z czujników ruchu telefonu zamiast kamery. Mniej niezawodne.",
  "lab.watchReps.title": "Liczenie powtórzeń zegarkiem",
  "lab.watchReps.body":
    "Zegarek z Wear OS lub Apple Watch liczy powtórzenia z nadgarstka w każdej serii i wpisuje je do Zapisz serię na telefonie. Wymaga otwartej aplikacji Liftsmith na zegarku. Nie dla ćwiczeń, w których dłonie się nie ruszają, jak podciąganie.",
  "lab.voiceLog.title": "Zapisywanie serii głosem",
  "lab.voiceLog.body":
    "Dodaje mikrofon nad Zapisz serię na ekranie treningu. Stuknij go i powiedz „100 na 8”, „8 powtórzeń”, „za łatwo” albo „cofnij”. Mowa jest rozpoznawana na telefonie i nigdy nie jest nagrywana ani wysyłana, więc telefon musi to umieć w twoim języku.",
  "lab.machines.title": "Maszyny na siłowni przez Bluetooth",
  "lab.machines.body":
    "W cardio połącz rower, wioślarz, bieżnię lub orbitrek, który udostępnia dane przez Bluetooth (standard maszyn fitness, którego używa większość nowszych maszyn). Czas, dystans i moc wpisują się same, gotowe do Zapisz serię, a przyciski +/− nadal działają, jeśli coś się nie zgadza. W aplikacji webowej wymaga Chrome.",
  "lab.machines.connect": "Połącz maszynę",
  "lab.machines.device": "maszyna",
  "lab.machines.live": "{name} wypełnia tę serię.",
  "lab.machines.reconnecting": "Ponowne łączenie: {name}… Dotychczas wysłane dane zostają.",
  "lab.machines.power": "Średnio {watts} W",
  "lab.machines.disconnect": "Rozłącz",
  "lab.machines.err.notFound":
    "Nie znaleziono maszyny. Zacznij pedałować lub wiosłować, żeby ją wybudzić, trzymaj telefon blisko i sprawdź, czy nie jest połączona z inną aplikacją.",
  "lab.machines.err.noService": "{name}: urządzenie nie udostępnia danych w standardowy sposób, więc nie można się połączyć.",
  "lab.machines.err.lost": "Utracono połączenie: {name}. Dotychczas wysłane dane zostają. Stuknij Połącz maszynę, żeby kontynuować.",
  "lab.machines.err.failed":
    "Nie udało się połączyć: {name}. Może być połączona z inną aplikacją lub zegarkiem: rozłącz ją tam, trzymaj blisko i spróbuj ponownie.",
  "lab.scale.title": "Inteligentna waga Bluetooth",
  "lab.scale.body":
    "Pod ważeniem w Postępach i Ciele przycisk łączy wagę, która udostępnia odczyt przez Bluetooth w standardowy sposób (standardy wagi i składu ciała). Stań na niej, a waga i tkanka tłuszczowa wpiszą się same, gotowe do zapisania. Wiele tanich wag używa zamiast tego protokołu własnej aplikacji i się nie pojawi. W aplikacji webowej wymaga Chrome.",
  "lab.scale.button": "Zważ się na mojej wadze",
  "lab.scale.which": "Które wagi działają?",
  "lab.scale.device": "waga",
  "lab.scale.connecting": "Szukam twojej wagi…",
  "lab.scale.waiting": "Stań teraz na wadze ({name}).",
  "lab.scale.got": "{name}: odczyt gotowy. Sprawdź go i stuknij {log}.",
  "lab.scale.err.notFound":
    "Nie znaleziono wagi. Stań na niej, żeby ją wybudzić, trzymaj telefon blisko i sprawdź, czy nie jest teraz połączona z własną aplikacją.",
  "lab.scale.err.noService": "{name}: urządzenie nie udostępnia odczytu w standardowy sposób, więc nie można się połączyć.",
  "lab.scale.err.timeout": "{name}: nie przesłano wagi. Stań na niej ponownie i stój nieruchomo, aż odczyt się ustabilizuje.",
  "lab.scale.err.failed": "Nie udało się połączyć: {name}. Zamknij jej własną aplikację, trzymaj telefon blisko i spróbuj ponownie.",
  "lab.handsFree.title": "Serie bez rąk",
  "lab.handsFree.body":
    "Gdy liczenie powtórzeń kamerą, ruchem telefonu lub zegarkiem działa, seria zapisuje się sama kilka sekund po ostatnim powtórzeniu i zaczyna się przerwa: 4 sekundy, gdy masz już zaplanowane powtórzenia, 8, gdy jeszcze ich brakuje. Cofnij przywraca serię. Wymaga włączenia jednego z tych eksperymentów z liczeniem powtórzeń.",
  "lab.handsFree.soon": "Zapisuję serię za {s} s. Zrób kolejne powtórzenie, żeby kontynuować.",
  "lab.watchAuto.title": "Serie bez rąk z zegarkiem",
  "lab.watchAuto.body":
    "Gdy liczenie powtórzeń zegarkiem jest włączone, zegarek prowadzi całą serię. Po pierwszych 15 sekundach przerwy zacznij kolejną serię, a przerwa skończy się sama, gdy zegarek policzy 3 powtórzenia. Kilka sekund po ostatnim powtórzeniu seria zapisze się sama i zacznie się przerwa. Zegarek za każdym razem zawibruje. Cofnij przywraca serię.",
  "lab.tempo.title": "Trener tempa",
  "lab.tempo.body":
    "W ćwiczeniach z tempem i pauzą, jak przysiad z tempem czy wyciskanie z pauzą, dodaje Licz tempo nad Zapisz serię. Stuknij, gdy bierzesz ciężar: po 3, 2, 1 odlicza każdą sekundę każdego powtórzenia dźwiękiem i wibracją, opadający ton przy opuszczaniu, równy przy zatrzymaniu i rosnący przy podnoszeniu, a po twoich powtórzeniach milknie. Zapisz serię to nadal jedno stuknięcie.",
  "lab.volumeLog.title": "Przycisk głośności zapisuje serię",
  "lab.volumeLog.body":
    "Podczas treningu naciśnij głośniej na telefonie lub słuchawkach Bluetooth, żeby zapisać serię zgodnie z planem, tak jak stuknięcie Zapisz serię. Naciśnięty w przerwie zapisuje następną serię. Głośność od razu wraca, a muzyka gra dalej; ciszej nadal ścisza. Działa, gdy Liftsmith jest na ekranie.",
  "lab.sonos.title": "Sonos",
  "lab.sonos.body":
    "Steruj głośnikiem Sonos z treningu: co gra, następny utwór, pauza i głośność. Może też podążać za treningiem: podgłaśniać muzykę w seriach i ściszać w przerwach, włączać ulubione z Sonos na start i pauzować na koniec. Połącz Sonos w Połączonych aplikacjach.",
};
