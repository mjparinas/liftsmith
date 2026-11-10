import type { Message } from "@/lib/i18n";

// Text for keys starting "pol.", in every language: the polish pass (undo, heart-rate-ready rest, last
// set, what's next, tips, hands-free logging and the widget). English is the source: add a key here
// first, then its Spanish and French. A missing translation falls back to English.

export const en = {
  "pol.undo": "Undo",
  "pol.undoLabel": "Undo the set you just logged",
  "pol.undoWarm": "Undo the warm-up you just logged",
  "pol.undone": "Set taken back. Fix the numbers and log it again.",
  "pol.ready": "Heart rate's back to {bpm}, near the {start} you started that set at. Go when you're ready.",
  "pol.lastSet": "Last set",
  "pol.lastSetBody": "Last set of the workout. Finish strong.",
  "pol.next.title": "Next workout",
  "pol.next.when": "{day} at {time}",
  "pol.next.ready": "{muscles} will be ready again by then.",
  "pol.next.waiting": "{muscle} needs about {hours} h more, so it'll sit that one out.",
  "pol.next.fresh": "{muscles} will be fresh, so expect them to lead.",
  "pol.tip": "Tip",
  "pol.tip.gotIt": "Got it",
  "pol.tip.undo": "Logged the wrong reps? Tap Undo just above the big button, fix the numbers and log the set again.",
  "pol.tip.reorder": "Press and hold an exercise in Coming up, then drag it to change the order.",
  "pol.tip.superset": "Tap the chain between two exercises in Coming up to do them as a superset and save time.",
  "pol.tip.swap": "Machine taken? The swap button next to the exercise name finds one that works the same muscles.",
  "pol.tip.handsFree": "You can log a set without unlocking your phone. Settings › Workout shows how.",
  "pol.tip.voice": "Want the next set read out to you? Turn on the voice coach in Settings.",
  "pol.tip.oneHand": "Lifting one-handed? One-handed controls in Settings › Workout put everything under your thumb.",
  "pol.hf.title": "Log sets hands-free",
  "pol.hf.intro": "Log set and +30 s work without opening the app, so chalky hands can stay off the screen.",
  "pol.hf.notif": "The workout notification has Log set and +30 s buttons, right on the lock screen.",
  "pol.hf.androidTile":
    "Add the Liftsmith tile to Quick Settings: swipe down twice, tap the pencil, and drag Liftsmith in. It reads Log set while a workout runs.",
  "pol.hf.androidWidget": "The home screen widget has Start and Log set. Press and hold the home screen, tap Widgets, then Liftsmith.",
  "pol.hf.iosBackTap":
    "Double-tap the back of your iPhone to log a set: Settings › Accessibility › Touch › Back Tap › Double Tap, then pick Liftsmith’s Log set shortcut.",
  "pol.hf.iosAction": "On an iPhone with an Action button: Settings › Action Button › Shortcut, then pick Liftsmith’s Log set shortcut.",
  "pol.hf.web": "On the web, install the app to your home screen and press and hold its icon for Start and Log set.",
  "pol.move": "Move {name}",
  "pol.moveNumbered": "{n}. Move {name}",
  "pol.moveUp": "Move {name} up",
  "pol.moveDown": "Move {name} down",
  "pol.moveDone": "Done moving",
  "pol.reorderHint": "Press and hold an exercise to drag it into a new order.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pol.undo": "Deshacer",
  "pol.undoLabel": "Deshacer la serie que acabas de registrar",
  "pol.undoWarm": "Deshacer el calentamiento que acabas de registrar",
  "pol.undone": "Serie deshecha. Corrige los números y regístrala otra vez.",
  "pol.ready": "Tu pulso ha vuelto a {bpm}, cerca de los {start} con los que empezaste la serie. Sigue cuando quieras.",
  "pol.lastSet": "Última serie",
  "pol.lastSetBody": "Última serie del entrenamiento. Termina fuerte.",
  "pol.next.title": "Próximo entrenamiento",
  "pol.next.when": "{day} a las {time}",
  "pol.next.ready": "{muscles} estarán listos otra vez para entonces.",
  "pol.next.waiting": "{muscle} necesita unas {hours} h más, así que descansará en ese.",
  "pol.next.fresh": "{muscles} estarán frescos, así que llevarán la voz cantante.",
  "pol.tip": "Consejo",
  "pol.tip.gotIt": "Entendido",
  "pol.tip.undo":
    "¿Registraste mal las repeticiones? Toca Deshacer justo encima del botón grande, corrige los números y vuelve a registrar la serie.",
  "pol.tip.reorder": "Mantén pulsado un ejercicio en A continuación y arrástralo para cambiar el orden.",
  "pol.tip.superset": "Toca la cadena entre dos ejercicios en A continuación para hacerlos como superserie y ahorrar tiempo.",
  "pol.tip.swap": "¿Máquina ocupada? El botón de cambiar junto al nombre del ejercicio busca uno que trabaje los mismos músculos.",
  "pol.tip.handsFree": "Puedes registrar una serie sin desbloquear el teléfono. Ajustes › Entrenamiento te enseña cómo.",
  "pol.tip.voice": "¿Quieres que te lean la siguiente serie? Activa el entrenador de voz en Ajustes.",
  "pol.tip.oneHand": "¿Entrenas con una mano? Los controles a una mano en Ajustes › Entrenamiento lo ponen todo bajo tu pulgar.",
  "pol.hf.title": "Registra series sin manos",
  "pol.hf.intro": "Registrar serie y +30 s funcionan sin abrir la app, así las manos con magnesio no tocan la pantalla.",
  "pol.hf.notif": "La notificación del entrenamiento tiene botones de Registrar serie y +30 s, en la pantalla de bloqueo.",
  "pol.hf.androidTile":
    "Añade el icono de Liftsmith a Ajustes rápidos: desliza hacia abajo dos veces, toca el lápiz y arrastra Liftsmith. Muestra Registrar serie durante un entrenamiento.",
  "pol.hf.androidWidget":
    "El widget de la pantalla de inicio tiene Empezar y Registrar serie. Mantén pulsada la pantalla de inicio, toca Widgets y luego Liftsmith.",
  "pol.hf.iosBackTap":
    "Toca dos veces la parte trasera del iPhone para registrar una serie: Ajustes › Accesibilidad › Tocar › Toque posterior › Doble toque, y elige el atajo Log set de Liftsmith.",
  "pol.hf.iosAction": "En un iPhone con botón de Acción: Ajustes › Botón de Acción › Atajo, y elige el atajo Log set de Liftsmith.",
  "pol.hf.web": "En la web, instala la app en tu pantalla de inicio y mantén pulsado su icono para Empezar y Registrar serie.",
  "pol.move": "Mover {name}",
  "pol.moveNumbered": "{n}. Mover {name}",
  "pol.moveUp": "Subir {name}",
  "pol.moveDown": "Bajar {name}",
  "pol.moveDone": "Terminar de mover",
  "pol.reorderHint": "Mantén pulsado un ejercicio para arrastrarlo a otro lugar.",
};

export const fr: Partial<Record<Key, Message>> = {
  "pol.undo": "Annuler",
  "pol.undoLabel": "Annuler la série que vous venez d'enregistrer",
  "pol.undoWarm": "Annuler l'échauffement que vous venez d'enregistrer",
  "pol.undone": "Série annulée. Corrigez les chiffres et enregistrez-la à nouveau.",
  "pol.ready": "Votre pouls est revenu à {bpm}, proche des {start} du début de la série. Repartez quand vous voulez.",
  "pol.lastSet": "Dernière série",
  "pol.lastSetBody": "Dernière série de la séance. Finissez fort.",
  "pol.next.title": "Prochaine séance",
  "pol.next.when": "{day} à {time}",
  "pol.next.ready": "{muscles} seront de nouveau prêts d'ici là.",
  "pol.next.waiting": "{muscle} a besoin d'environ {hours} h de plus, il restera au repos cette fois.",
  "pol.next.fresh": "{muscles} seront frais, ils devraient mener la séance.",
  "pol.tip": "Astuce",
  "pol.tip.gotIt": "Compris",
  "pol.tip.undo":
    "Mauvais nombre de répétitions ? Touchez Annuler juste au-dessus du grand bouton, corrigez les chiffres et enregistrez à nouveau la série.",
  "pol.tip.reorder": "Maintenez un exercice dans À suivre, puis faites-le glisser pour changer l'ordre.",
  "pol.tip.superset": "Touchez la chaîne entre deux exercices dans À suivre pour les faire en superset et gagner du temps.",
  "pol.tip.swap": "Machine prise ? Le bouton d'échange à côté du nom de l'exercice en trouve un qui travaille les mêmes muscles.",
  "pol.tip.handsFree": "Vous pouvez enregistrer une série sans déverrouiller votre téléphone. Réglages › Séance explique comment.",
  "pol.tip.voice": "Envie qu'on vous lise la série suivante ? Activez le coach vocal dans les Réglages.",
  "pol.tip.oneHand": "Vous soulevez d'une main ? Les commandes à une main dans Réglages › Séance mettent tout sous votre pouce.",
  "pol.hf.title": "Enregistrer sans les mains",
  "pol.hf.intro":
    "Enregistrer la série et +30 s fonctionnent sans ouvrir l'app, pour garder les mains pleines de magnésie loin de l'écran.",
  "pol.hf.notif": "La notification de séance a des boutons Enregistrer la série et +30 s, directement sur l'écran verrouillé.",
  "pol.hf.androidTile":
    "Ajoutez la vignette Liftsmith aux Réglages rapides : balayez deux fois vers le bas, touchez le crayon et faites glisser Liftsmith. Elle affiche Enregistrer la série pendant une séance.",
  "pol.hf.androidWidget":
    "Le widget de l'écran d'accueil a Démarrer et Enregistrer la série. Maintenez l'écran d'accueil, touchez Widgets, puis Liftsmith.",
  "pol.hf.iosBackTap":
    "Touchez deux fois le dos de votre iPhone pour enregistrer une série : Réglages › Accessibilité › Toucher › Toucher le dos › Toucher deux fois, puis choisissez le raccourci Log set de Liftsmith.",
  "pol.hf.iosAction":
    "Sur un iPhone avec bouton Action : Réglages › Bouton Action › Raccourci, puis choisissez le raccourci Log set de Liftsmith.",
  "pol.hf.web": "Sur le web, installez l'app sur votre écran d'accueil et maintenez son icône pour Démarrer et Enregistrer la série.",
  "pol.move": "Déplacer {name}",
  "pol.moveNumbered": "{n}. Déplacer {name}",
  "pol.moveUp": "Monter {name}",
  "pol.moveDown": "Descendre {name}",
  "pol.moveDone": "Fin du déplacement",
  "pol.reorderHint": "Maintenez un exercice pour le faire glisser ailleurs.",
};
