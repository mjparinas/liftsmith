import type { Message } from "@/lib/i18n";

// Text for keys starting "lab.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "lab.formCheck.title": "Camera form check",
  "lab.formCheck.body":
    "While the camera counts reps, it also watches how they move: squats that stop above parallel, reps cut short, and leaning to one side. Between sets it gives one tip and shows it on the figure. Side-on is best for depth; face the camera to check for a lean.",
  "lab.speedMax.title": "Today's max from warm-ups",
  "lab.speedMax.body":
    "Uses the bar speed of your warm-ups to estimate today's max, then suggests a slightly heavier or lighter working weight before your first hard set. Works on squats, hinges, presses, rows and pull-ups, and needs your height in Your stats.",
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
  "lab.trainer.title": "Trainer mode",
  "lab.trainer.body":
    "Coach other lifters: make an invite code in Settings › Coaching, then see each client's workouts with what to act on first. Your clients don't need Pro.",
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
  "lab.handsFree.title": "Hands-free sets",
  "lab.handsFree.body":
    "While camera, phone motion or watch rep counting is counting, the set logs itself a few seconds after your last rep and rest starts: 4 seconds once your planned reps are in, 8 while you're short of them. Undo puts it back. Needs one of those rep counting labs on.",
  "lab.handsFree.soon": "Logging this set in {s} s. Do another rep to keep going.",
};

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Revisión de técnica con la cámara",
  "lab.formCheck.body":
    "Mientras la cámara cuenta repeticiones, también mira cómo se mueven: sentadillas que se quedan por encima del paralelo, repeticiones cortas e inclinarse hacia un lado. Entre series da un consejo y lo muestra en la figura. De lado se ve mejor la profundidad; ponte de frente para revisar si te inclinas.",
  "lab.speedMax.title": "Tu máximo de hoy según el calentamiento",
  "lab.speedMax.body":
    "Usa la velocidad de la barra en tus series de calentamiento para estimar tu máximo de hoy y, antes de la primera serie dura, sugiere un peso de trabajo un poco más alto o más bajo. Funciona en sentadillas, bisagras, presses, remos y dominadas, y necesita tu altura en Tus datos.",
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
  "lab.trainer.title": "Modo entrenador",
  "lab.trainer.body":
    "Entrena a otras personas: crea un código de invitación en Ajustes › Entrenador y mira los entrenamientos de cada cliente con lo primero que conviene atender. Tus clientes no necesitan Pro.",
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
  "lab.handsFree.title": "Series sin manos",
  "lab.handsFree.body":
    "Mientras se cuentan las repeticiones con la cámara, el movimiento del teléfono o el reloj, la serie se registra sola unos segundos después de tu última repetición y empieza el descanso: 4 segundos si ya hiciste las repeticiones previstas, 8 si te faltan. Deshacer la quita. Necesita uno de esos labs de conteo activado.",
  "lab.handsFree.soon": "Registrando esta serie en {s} s. Haz otra repetición para seguir.",
};

export const fr: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Contrôle de la technique par la caméra",
  "lab.formCheck.body":
    "Pendant que la caméra compte les répétitions, elle regarde aussi comment elles bougent : squats arrêtés au-dessus de la parallèle, répétitions écourtées et inclinaison d’un côté. Entre les séries, elle donne un conseil et le montre sur la silhouette. De profil, c’est mieux pour la profondeur ; de face, pour voir si vous penchez.",
  "lab.speedMax.title": "Votre max du jour d'après l'échauffement",
  "lab.speedMax.body":
    "Utilise la vitesse de barre de vos séries d'échauffement pour estimer votre max du jour, puis propose une charge de travail un peu plus lourde ou plus légère avant votre première série difficile. Fonctionne sur les squats, les charnières, les développés, les tirages et les tractions, et nécessite votre taille dans Vos mesures.",
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
  "lab.trainer.title": "Mode coach",
  "lab.trainer.body":
    "Coachez d'autres pratiquants : créez un code d'invitation dans Réglages › Coaching, puis voyez les séances de chaque client avec ce qu'il faut traiter en premier. Vos clients n'ont pas besoin de Pro.",
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
  "lab.handsFree.title": "Séries sans les mains",
  "lab.handsFree.body":
    "Pendant que la caméra, le mouvement du téléphone ou la montre compte vos répétitions, la série s'enregistre seule quelques secondes après votre dernière répétition et le repos commence : 4 secondes une fois les répétitions prévues faites, 8 s'il vous en manque. Annuler la retire. Nécessite l'un de ces labs de comptage activé.",
  "lab.handsFree.soon": "Enregistrement de cette série dans {s} s. Faites une autre répétition pour continuer.",
};

export const de: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Technik-Check per Kamera",
  "lab.formCheck.body":
    "Während die Kamera Wiederholungen zählt, achtet sie auch darauf, wie sie laufen: Kniebeugen über der Parallele, verkürzte Wiederholungen und Neigen zu einer Seite. Zwischen den Sätzen gibt sie einen Tipp und zeigt ihn an der Figur. Für die Tiefe ist die Seitenansicht am besten; stell dich frontal zur Kamera, um eine Neigung zu prüfen.",
  "lab.speedMax.title": "Tagesmaximum aus dem Aufwärmen",
  "lab.speedMax.body":
    "Schätzt aus dem Stangentempo deiner Aufwärmsätze dein heutiges Maximum und schlägt vor dem ersten harten Satz ein etwas schwereres oder leichteres Arbeitsgewicht vor. Funktioniert bei Kniebeugen, Hüftbeugen, Drücken, Rudern und Klimmzügen und braucht deine Größe in Deine Daten.",
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
  "lab.trainer.title": "Trainermodus",
  "lab.trainer.body":
    "Betreue andere: Erstell unter Einstellungen › Coaching einen Einladungscode und sieh die Trainings jedes Kunden, mit dem, was zuerst zu tun ist. Deine Kunden brauchen kein Pro.",
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
  "lab.handsFree.title": "Sätze ohne Hände",
  "lab.handsFree.body":
    "Während Kamera, Handybewegung oder Uhr deine Wiederholungen zählen, wird der Satz ein paar Sekunden nach der letzten Wiederholung von selbst eingetragen und die Pause beginnt: 4 Sekunden, wenn die geplanten Wiederholungen geschafft sind, 8, solange noch welche fehlen. Rückgängig nimmt ihn zurück. Braucht eines dieser Labs zum Zählen.",
  "lab.handsFree.soon": "Satz wird in {s} s eingetragen. Mach noch eine Wiederholung, um weiterzumachen.",
};

export const it: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Controllo della tecnica con la fotocamera",
  "lab.formCheck.body":
    "Mentre la fotocamera conta le ripetizioni, guarda anche come si muovono: squat che si fermano sopra il parallelo, ripetizioni accorciate e inclinazioni su un lato. Tra una serie e l’altra dà un consiglio e lo mostra sulla figura. Di lato è meglio per la profondità; mettiti di fronte per controllare se ti inclini.",
  "lab.speedMax.title": "Il massimale di oggi dal riscaldamento",
  "lab.speedMax.body":
    "Usa la velocità del bilanciere nelle serie di riscaldamento per stimare il massimale di oggi e, prima della prima serie pesante, suggerisce un carico di lavoro un po' più alto o più basso. Funziona su squat, hip hinge, distensioni, rematori e trazioni, e richiede la tua altezza in I tuoi dati.",
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
  "lab.trainer.title": "Modalità coach",
  "lab.trainer.body":
    "Segui altre persone: crea un codice d'invito in Impostazioni › Coaching e guarda gli allenamenti di ogni cliente con la prima cosa da fare. I tuoi clienti non hanno bisogno di Pro.",
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
  "lab.handsFree.title": "Serie a mani libere",
  "lab.handsFree.body":
    "Mentre la fotocamera, il movimento del telefono o l'orologio contano le ripetizioni, la serie si registra da sola pochi secondi dopo l'ultima ripetizione e parte il recupero: 4 secondi quando hai fatto le ripetizioni previste, 8 se ne mancano. Annulla la toglie. Serve uno di questi lab di conteggio attivo.",
  "lab.handsFree.soon": "Registro questa serie tra {s} s. Fai un'altra ripetizione per continuare.",
};

export const ja: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "カメラでフォームチェック",
  "lab.formCheck.body":
    "カメラがレップを数えている間、動き方もチェックします。パラレルより浅いスクワット、短くなったレップ、左右への傾きです。セット間にひとつだけアドバイスを出し、フィギュアで示します。深さは横から、傾きはカメラの正面に立つと確認できます。",
  "lab.speedMax.title": "ウォームアップから今日の最大重量",
  "lab.speedMax.body":
    "ウォームアップのバースピードから今日の最大重量を推定し、最初のきついセットの前に少し重め・軽めのメイン重量を提案します。スクワット、ヒンジ、プレス、ロウ、懸垂に対応。「あなたのデータ」に身長の入力が必要です。",
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
  "lab.trainer.title": "トレーナーモード",
  "lab.trainer.body":
    "ほかの人を指導できます。「設定 › コーチング」で招待コードを作成すると、各クライアントのワークアウトと、まず取り組むべきことが表示されます。クライアントに Pro は必要ありません。",
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
  "lab.handsFree.title": "ハンズフリーセット",
  "lab.handsFree.body":
    "カメラ、スマホのモーション、またはウォッチでレップを数えている間、最後のレップから数秒後にセットが自動で記録され、休憩が始まります。予定のレップに届いていれば4秒、足りなければ8秒です。元に戻すで取り消せます。いずれかのレップカウントのラボをオンにしてください。",
  "lab.handsFree.soon": "{s}秒後にこのセットを記録します。続けるにはもう1レップ。",
};
