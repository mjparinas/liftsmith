import type { Message } from "@/lib/i18n";

// Text for keys starting "count.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "count.form.depth": {
    one: "Your rep stopped above parallel. Sit until your hips are level with your knees, and lighten the bar if you need to.",
    other:
      "{hit} of {count} reps stopped above parallel. Sit until your hips are level with your knees, and lighten the bar if you need to.",
  },
  "count.form.rom": {
    one: "Your rep was shorter than your best. Take every rep through the same full range, even if it means fewer reps.",
    other: "{hit} of {count} reps were shorter than your best. Take every rep through the same full range, even if it means fewer reps.",
  },
  "count.form.leanLeft": {
    one: "You leaned about {deg}° to your left. Keep your weight even on both feet and your chest square.",
    other: "You leaned about {deg}° to your left on {hit} of {count} reps. Keep your weight even on both feet and your chest square.",
  },
  "count.form.leanRight": {
    one: "You leaned about {deg}° to your right. Keep your weight even on both feet and your chest square.",
    other: "You leaned about {deg}° to your right on {hit} of {count} reps. Keep your weight even on both feet and your chest square.",
  },
  "count.path.forwardBottom": {
    one: "The bar drifted about {cm} cm forward at the bottom. Keep it over the middle of your foot: brace hard and stay tight at the bottom.",
    other:
      "The bar drifted about {cm} cm forward at the bottom on {hit} of {count} reps. Keep it over the middle of your foot: brace hard and stay tight at the bottom.",
  },
  "count.path.forwardUp": {
    one: "The bar drifted about {cm} cm forward on the way up. Keep it over the middle of your foot and drive straight up.",
    other:
      "The bar drifted about {cm} cm forward on the way up on {hit} of {count} reps. Keep it over the middle of your foot and drive straight up.",
  },
  "count.path.back": {
    one: "The bar drifted about {cm} cm back. Keep your weight over the middle of your foot, not your heels.",
    other: "The bar drifted about {cm} cm back on {hit} of {count} reps. Keep your weight over the middle of your foot, not your heels.",
  },
  "count.path.good": {
    one: "Bar path: it stayed within {cm} cm of where it started on that rep.",
    other: "Bar path: it stayed within {cm} cm of where it started on those {count} reps.",
  },
  "count.form.good": { one: "Form check: nothing to fix on that rep.", other: "Form check: nothing to fix on those {count} reps." },
  "count.max.own": {
    one: "Measured against your own end-of-set speed for this lift, {speed} m/s, learned from {count} set you took to failure.",
    other: "Measured against your own end-of-set speed for this lift, {speed} m/s, learned from {count} sets you took to failure.",
  },
  "count.max.book": {
    one: "Measured against the usual end-of-set speed for this lift, {speed} m/s. Take {count} more set to failure while the camera counts and it learns your own.",
    other:
      "Measured against the usual end-of-set speed for this lift, {speed} m/s. Take {count} more sets to failure while the camera counts and it learns your own.",
  },
  "count.max.title": "Warm-up speed",
  "count.max.up":
    "Your warm-ups moved fast: today's max looks like about {max}, {pct}% above what the plan expects. Try {weight} for your working sets.",
  "count.max.down":
    "Your warm-ups moved slowly: today's max looks like about {max}, {pct}% below what the plan expects. Try {weight} for your working sets.",
  "count.max.hold": "Your warm-ups moved as expected: today's max looks like about {max}. Stay with {weight}.",
  "count.max.use": "Use {weight}",
  "count.max.used": "Working weight set to {weight}.",
  "count.speed.label": "Bar speed",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct}% of best",
  "count.speed.stop": "Bar speed is down {loss}% from your fastest rep. A good place to end the set.",
  "count.speed.left": {
    one: "About {count} rep left in the tank: bar speed is down {loss}%.",
    other: "About {count} reps left in the tank: bar speed is down {loss}%.",
  },
  "count.toggle": "Count reps with the camera",
  "count.toggleMotion": "Count reps with phone motion",
  "count.start": "Count reps",
  "count.reps": "reps",
  "count.stop": "Stop",
  "count.off": "Stop counting reps",
  "count.opening": "Opening the camera…",
  "count.loading": "Getting the rep counter ready (first time only)…",
  "count.position": "Stand side-on with your whole body in the camera view.",
  "count.watch": { one: "Watch: {count} rep", other: "Watch: {count} reps" },
  "count.counting": "Counting. Your reps fill in Log set.",
  "count.resting": "Resting. Counting starts again with your next set.",
  "count.flipToBack": "Use the back camera",
  "count.flipToFront": "Use the front camera",
  "count.useMotion": "Use phone motion",
  "count.useCamera": "Use the camera",
  "count.err.denied": "Camera access is off. Allow it in your phone's settings for Liftsmith to count reps.",
  "count.err.noCamera": "No camera found for this.",
  "count.err.model": "Couldn't start the rep counter. Check your connection for the first run and try again.",
  "count.err.motion": "Motion access was declined, so reps can't be counted from the phone.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "Tu repetición se quedó por encima del paralelo. Baja hasta que la cadera quede a la altura de las rodillas y quita peso si hace falta.",
    other:
      "{hit} de {count} repeticiones se quedaron por encima del paralelo. Baja hasta que la cadera quede a la altura de las rodillas y quita peso si hace falta.",
  },
  "count.form.rom": {
    one: "Tu repetición fue más corta que tu mejor. Haz cada repetición con el mismo recorrido completo, aunque salgan menos.",
    other:
      "{hit} de {count} repeticiones fueron más cortas que tu mejor. Haz cada repetición con el mismo recorrido completo, aunque salgan menos.",
  },
  "count.form.leanLeft": {
    one: "Te inclinaste unos {deg}° hacia tu izquierda. Reparte el peso por igual en los dos pies y mantén el pecho de frente.",
    other:
      "Te inclinaste unos {deg}° hacia tu izquierda en {hit} de {count} repeticiones. Reparte el peso por igual en los dos pies y mantén el pecho de frente.",
  },
  "count.form.leanRight": {
    one: "Te inclinaste unos {deg}° hacia tu derecha. Reparte el peso por igual en los dos pies y mantén el pecho de frente.",
    other:
      "Te inclinaste unos {deg}° hacia tu derecha en {hit} de {count} repeticiones. Reparte el peso por igual en los dos pies y mantén el pecho de frente.",
  },
  "count.path.forwardBottom": {
    one: "La barra se fue unos {cm} cm hacia delante abajo. Mantenla sobre el centro del pie: aprieta el abdomen y mantente firme abajo.",
    other:
      "La barra se fue unos {cm} cm hacia delante abajo en {hit} de {count} repeticiones. Mantenla sobre el centro del pie: aprieta el abdomen y mantente firme abajo.",
  },
  "count.path.forwardUp": {
    one: "La barra se fue unos {cm} cm hacia delante al subir. Mantenla sobre el centro del pie y empuja recto hacia arriba.",
    other:
      "La barra se fue unos {cm} cm hacia delante al subir en {hit} de {count} repeticiones. Mantenla sobre el centro del pie y empuja recto hacia arriba.",
  },
  "count.path.back": {
    one: "La barra se fue unos {cm} cm hacia atrás. Mantén el peso sobre el centro del pie, no sobre los talones.",
    other:
      "La barra se fue unos {cm} cm hacia atrás en {hit} de {count} repeticiones. Mantén el peso sobre el centro del pie, no sobre los talones.",
  },
  "count.path.good": {
    one: "Trayectoria de la barra: se mantuvo a menos de {cm} cm de donde empezó en esa repetición.",
    other: "Trayectoria de la barra: se mantuvo a menos de {cm} cm de donde empezó en esas {count} repeticiones.",
  },
  "count.form.good": {
    one: "Revisión de técnica: nada que corregir en esa repetición.",
    other: "Revisión de técnica: nada que corregir en esas {count} repeticiones.",
  },
  "count.max.own": {
    one: "Comparado con tu propia velocidad de final de serie en este ejercicio, {speed} m/s, aprendida de {count} serie que llevaste al fallo.",
    other:
      "Comparado con tu propia velocidad de final de serie en este ejercicio, {speed} m/s, aprendida de {count} series que llevaste al fallo.",
  },
  "count.max.book": {
    one: "Comparado con la velocidad habitual de final de serie en este ejercicio, {speed} m/s. Lleva {count} serie más al fallo mientras cuenta la cámara y aprenderá la tuya.",
    other:
      "Comparado con la velocidad habitual de final de serie en este ejercicio, {speed} m/s. Lleva {count} series más al fallo mientras cuenta la cámara y aprenderá la tuya.",
  },
  "count.max.title": "Velocidad del calentamiento",
  "count.max.up":
    "Tu calentamiento fue rápido: tu máximo de hoy ronda {max}, un {pct} % más de lo que espera el plan. Prueba {weight} en las series de trabajo.",
  "count.max.down":
    "Tu calentamiento fue lento: tu máximo de hoy ronda {max}, un {pct} % menos de lo que espera el plan. Prueba {weight} en las series de trabajo.",
  "count.max.hold": "Tu calentamiento fue como se esperaba: tu máximo de hoy ronda {max}. Sigue con {weight}.",
  "count.max.use": "Usar {weight}",
  "count.max.used": "Peso de trabajo cambiado a {weight}.",
  "count.speed.label": "Velocidad",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct} % del mejor",
  "count.speed.stop": "La velocidad ha bajado un {loss} % desde tu repetición más rápida. Buen momento para terminar la serie.",
  "count.speed.left": {
    one: "Te queda más o menos {count} repetición: la velocidad ha bajado un {loss} %.",
    other: "Te quedan unas {count} repeticiones: la velocidad ha bajado un {loss} %.",
  },
  "count.toggle": "Contar repeticiones con la cámara",
  "count.toggleMotion": "Contar repeticiones con el movimiento del teléfono",
  "count.start": "Contar reps",
  "count.reps": "reps",
  "count.stop": "Parar",
  "count.off": "Dejar de contar repeticiones",
  "count.opening": "Abriendo la cámara…",
  "count.loading": "Preparando el contador de repeticiones (solo la primera vez)…",
  "count.position": "Ponte de lado, con todo el cuerpo en la vista de la cámara.",
  "count.watch": { one: "Reloj: {count} repetición", other: "Reloj: {count} repeticiones" },
  "count.counting": "Contando. Tus repeticiones se rellenan en Registrar serie.",
  "count.resting": "Descansando. El conteo vuelve a empezar con tu próxima serie.",
  "count.flipToBack": "Usar la cámara trasera",
  "count.flipToFront": "Usar la cámara frontal",
  "count.useMotion": "Usar el movimiento del teléfono",
  "count.useCamera": "Usar la cámara",
  "count.err.denied":
    "El acceso a la cámara está desactivado. Permítelo en los ajustes del teléfono para que Liftsmith cuente tus repeticiones.",
  "count.err.noCamera": "No se encontró una cámara para esto.",
  "count.err.model": "No se pudo iniciar el contador. Revisa tu conexión la primera vez e inténtalo de nuevo.",
  "count.err.motion": "Se rechazó el acceso al movimiento, así que no se pueden contar repeticiones con el teléfono.",
};

export const fr: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "Votre répétition s’est arrêtée au-dessus de la parallèle. Descendez jusqu’à ce que les hanches soient au niveau des genoux, et allégez la barre si besoin.",
    other:
      "{hit} répétitions sur {count} se sont arrêtées au-dessus de la parallèle. Descendez jusqu’à ce que les hanches soient au niveau des genoux, et allégez la barre si besoin.",
  },
  "count.form.rom": {
    one: "Votre répétition était plus courte que votre meilleure. Faites chaque répétition sur la même amplitude complète, quitte à en faire moins.",
    other:
      "{hit} répétitions sur {count} étaient plus courtes que votre meilleure. Faites chaque répétition sur la même amplitude complète, quitte à en faire moins.",
  },
  "count.form.leanLeft": {
    one: "Vous avez penché d’environ {deg}° vers la gauche. Répartissez le poids sur les deux pieds et gardez la poitrine de face.",
    other:
      "Vous avez penché d’environ {deg}° vers la gauche sur {hit} répétitions sur {count}. Répartissez le poids sur les deux pieds et gardez la poitrine de face.",
  },
  "count.form.leanRight": {
    one: "Vous avez penché d’environ {deg}° vers la droite. Répartissez le poids sur les deux pieds et gardez la poitrine de face.",
    other:
      "Vous avez penché d’environ {deg}° vers la droite sur {hit} répétitions sur {count}. Répartissez le poids sur les deux pieds et gardez la poitrine de face.",
  },
  "count.path.forwardBottom": {
    one: "La barre a dévié d'environ {cm} cm vers l'avant en bas. Gardez-la au-dessus du milieu du pied : gainez fort et restez serré en bas.",
    other:
      "La barre a dévié d'environ {cm} cm vers l'avant en bas sur {hit} répétitions sur {count}. Gardez-la au-dessus du milieu du pied : gainez fort et restez serré en bas.",
  },
  "count.path.forwardUp": {
    one: "La barre a dévié d'environ {cm} cm vers l'avant en montant. Gardez-la au-dessus du milieu du pied et poussez droit vers le haut.",
    other:
      "La barre a dévié d'environ {cm} cm vers l'avant en montant sur {hit} répétitions sur {count}. Gardez-la au-dessus du milieu du pied et poussez droit vers le haut.",
  },
  "count.path.back": {
    one: "La barre a dévié d'environ {cm} cm vers l'arrière. Gardez le poids sur le milieu du pied, pas sur les talons.",
    other:
      "La barre a dévié d'environ {cm} cm vers l'arrière sur {hit} répétitions sur {count}. Gardez le poids sur le milieu du pied, pas sur les talons.",
  },
  "count.path.good": {
    one: "Trajectoire de la barre : elle est restée à moins de {cm} cm de son départ sur cette répétition.",
    other: "Trajectoire de la barre : elle est restée à moins de {cm} cm de son départ sur ces {count} répétitions.",
  },
  "count.form.good": {
    one: "Contrôle de la technique : rien à corriger sur cette répétition.",
    other: "Contrôle de la technique : rien à corriger sur ces {count} répétitions.",
  },
  "count.max.own": {
    one: "Comparé à votre propre vitesse de fin de série sur cet exercice, {speed} m/s, apprise de {count} série menée à l'échec.",
    other: "Comparé à votre propre vitesse de fin de série sur cet exercice, {speed} m/s, apprise de {count} séries menées à l'échec.",
  },
  "count.max.book": {
    one: "Comparé à la vitesse habituelle de fin de série sur cet exercice, {speed} m/s. Menez encore {count} série à l'échec pendant que la caméra compte, et elle apprendra la vôtre.",
    other:
      "Comparé à la vitesse habituelle de fin de série sur cet exercice, {speed} m/s. Menez encore {count} séries à l'échec pendant que la caméra compte, et elle apprendra la vôtre.",
  },
  "count.max.title": "Vitesse de l'échauffement",
  "count.max.up":
    "Votre échauffement est allé vite : votre max du jour tourne autour de {max}, {pct} % au-dessus de ce que prévoit le plan. Essayez {weight} pour vos séries de travail.",
  "count.max.down":
    "Votre échauffement est allé lentement : votre max du jour tourne autour de {max}, {pct} % en dessous de ce que prévoit le plan. Essayez {weight} pour vos séries de travail.",
  "count.max.hold": "Votre échauffement est allé comme prévu : votre max du jour tourne autour de {max}. Restez à {weight}.",
  "count.max.use": "Passer à {weight}",
  "count.max.used": "Charge de travail réglée sur {weight}.",
  "count.speed.label": "Vitesse",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct} % du meilleur",
  "count.speed.stop": "La vitesse a baissé de {loss} % depuis votre répétition la plus rapide. C’est le bon moment pour finir la série.",
  "count.speed.left": {
    one: "Il vous reste environ {count} répétition : la vitesse a baissé de {loss} %.",
    other: "Il vous reste environ {count} répétitions : la vitesse a baissé de {loss} %.",
  },
  "count.toggle": "Compter les répétitions avec la caméra",
  "count.toggleMotion": "Compter les répétitions avec les mouvements du téléphone",
  "count.start": "Compter",
  "count.reps": "rép.",
  "count.stop": "Arrêter",
  "count.off": "Arrêter de compter les répétitions",
  "count.opening": "Ouverture de la caméra…",
  "count.loading": "Préparation du compteur de répétitions (la première fois seulement)…",
  "count.position": "Placez-vous de profil, tout le corps dans la vue de la caméra.",
  "count.watch": { one: "Montre : {count} répétition", other: "Montre : {count} répétitions" },
  "count.counting": "Comptage en cours. Vos répétitions s’inscrivent dans Valider la série.",
  "count.resting": "Repos. Le comptage reprend à la prochaine série.",
  "count.flipToBack": "Utiliser la caméra arrière",
  "count.flipToFront": "Utiliser la caméra avant",
  "count.useMotion": "Utiliser les mouvements du téléphone",
  "count.useCamera": "Utiliser la caméra",
  "count.err.denied":
    "L’accès à la caméra est désactivé. Autorisez-le dans les réglages du téléphone pour que Liftsmith compte vos répétitions.",
  "count.err.noCamera": "Aucune caméra trouvée pour cela.",
  "count.err.model": "Impossible de lancer le compteur. Vérifiez votre connexion la première fois et réessayez.",
  "count.err.motion": "L’accès aux mouvements a été refusé, les répétitions ne peuvent donc pas être comptées avec le téléphone.",
};

export const de: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "Deine Wiederholung endete über der Parallele. Geh tief, bis die Hüfte auf Kniehöhe ist, und nimm notfalls Gewicht runter.",
    other:
      "{hit} von {count} Wiederholungen endeten über der Parallele. Geh tief, bis die Hüfte auf Kniehöhe ist, und nimm notfalls Gewicht runter.",
  },
  "count.form.rom": {
    one: "Deine Wiederholung war kürzer als deine beste. Mach jede Wiederholung über den gleichen vollen Bewegungsumfang, auch wenn es weniger werden.",
    other:
      "{hit} von {count} Wiederholungen waren kürzer als deine beste. Mach jede Wiederholung über den gleichen vollen Bewegungsumfang, auch wenn es weniger werden.",
  },
  "count.form.leanLeft": {
    one: "Du hast dich um etwa {deg}° nach links geneigt. Verteil das Gewicht gleichmäßig auf beide Füße und halte die Brust gerade.",
    other:
      "Du hast dich bei {hit} von {count} Wiederholungen um etwa {deg}° nach links geneigt. Verteil das Gewicht gleichmäßig auf beide Füße und halte die Brust gerade.",
  },
  "count.form.leanRight": {
    one: "Du hast dich um etwa {deg}° nach rechts geneigt. Verteil das Gewicht gleichmäßig auf beide Füße und halte die Brust gerade.",
    other:
      "Du hast dich bei {hit} von {count} Wiederholungen um etwa {deg}° nach rechts geneigt. Verteil das Gewicht gleichmäßig auf beide Füße und halte die Brust gerade.",
  },
  "count.path.forwardBottom": {
    one: "Die Stange ist unten etwa {cm} cm nach vorn gewandert. Halte sie über der Fußmitte: spann den Rumpf fest an und bleib unten stabil.",
    other:
      "Die Stange ist bei {hit} von {count} Wiederholungen unten etwa {cm} cm nach vorn gewandert. Halte sie über der Fußmitte: spann den Rumpf fest an und bleib unten stabil.",
  },
  "count.path.forwardUp": {
    one: "Die Stange ist auf dem Weg nach oben etwa {cm} cm nach vorn gewandert. Halte sie über der Fußmitte und drück gerade nach oben.",
    other:
      "Die Stange ist bei {hit} von {count} Wiederholungen auf dem Weg nach oben etwa {cm} cm nach vorn gewandert. Halte sie über der Fußmitte und drück gerade nach oben.",
  },
  "count.path.back": {
    one: "Die Stange ist etwa {cm} cm nach hinten gewandert. Halte dein Gewicht über der Fußmitte, nicht auf den Fersen.",
    other:
      "Die Stange ist bei {hit} von {count} Wiederholungen etwa {cm} cm nach hinten gewandert. Halte dein Gewicht über der Fußmitte, nicht auf den Fersen.",
  },
  "count.path.good": {
    one: "Stangenweg: Bei dieser Wiederholung blieb die Stange innerhalb von {cm} cm um ihren Startpunkt.",
    other: "Stangenweg: Bei diesen {count} Wiederholungen blieb die Stange innerhalb von {cm} cm um ihren Startpunkt.",
  },
  "count.form.good": {
    one: "Technik-Check: an dieser Wiederholung gibt es nichts zu verbessern.",
    other: "Technik-Check: an diesen {count} Wiederholungen gibt es nichts zu verbessern.",
  },
  "count.max.own": {
    one: "Gemessen an deinem eigenen Tempo am Satzende bei dieser Übung, {speed} m/s, gelernt aus {count} Satz bis zum Muskelversagen.",
    other: "Gemessen an deinem eigenen Tempo am Satzende bei dieser Übung, {speed} m/s, gelernt aus {count} Sätzen bis zum Muskelversagen.",
  },
  "count.max.book": {
    one: "Gemessen am üblichen Tempo am Satzende bei dieser Übung, {speed} m/s. Geh noch {count} Satz bis zum Muskelversagen, während die Kamera zählt, dann lernt sie dein eigenes.",
    other:
      "Gemessen am üblichen Tempo am Satzende bei dieser Übung, {speed} m/s. Geh noch {count} Sätze bis zum Muskelversagen, während die Kamera zählt, dann lernt sie dein eigenes.",
  },
  "count.max.title": "Tempo beim Aufwärmen",
  "count.max.up":
    "Dein Aufwärmen ging schnell: Dein Maximum liegt heute bei etwa {max}, {pct} % über dem, was der Plan erwartet. Versuch {weight} für deine Arbeitssätze.",
  "count.max.down":
    "Dein Aufwärmen ging langsam: Dein Maximum liegt heute bei etwa {max}, {pct} % unter dem, was der Plan erwartet. Versuch {weight} für deine Arbeitssätze.",
  "count.max.hold": "Dein Aufwärmen lief wie erwartet: Dein Maximum liegt heute bei etwa {max}. Bleib bei {weight}.",
  "count.max.use": "{weight} nehmen",
  "count.max.used": "Arbeitsgewicht auf {weight} gesetzt.",
  "count.speed.label": "Tempo",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct} % vom besten",
  "count.speed.stop": "Das Tempo ist {loss} % unter deiner schnellsten Wiederholung. Ein guter Moment, den Satz zu beenden.",
  "count.speed.left": {
    one: "Noch etwa {count} Wiederholung im Tank: Das Tempo ist {loss} % gesunken.",
    other: "Noch etwa {count} Wiederholungen im Tank: Das Tempo ist {loss} % gesunken.",
  },
  "count.toggle": "Wiederholungen mit der Kamera zählen",
  "count.toggleMotion": "Wiederholungen mit dem Bewegungssensor zählen",
  "count.start": "Wdh. zählen",
  "count.reps": "Wdh.",
  "count.stop": "Stopp",
  "count.off": "Wiederholungen nicht mehr zählen",
  "count.opening": "Kamera wird geöffnet…",
  "count.loading": "Der Wiederholungszähler wird vorbereitet (nur beim ersten Mal)…",
  "count.position": "Stell dich seitlich hin, mit dem ganzen Körper im Kamerabild.",
  "count.watch": { one: "Uhr: {count} Wiederholung", other: "Uhr: {count} Wiederholungen" },
  "count.counting": "Zählt. Deine Wiederholungen landen in Satz eintragen.",
  "count.resting": "Pause. Das Zählen beginnt mit deinem nächsten Satz wieder.",
  "count.flipToBack": "Rückkamera verwenden",
  "count.flipToFront": "Frontkamera verwenden",
  "count.useMotion": "Bewegungssensor des Telefons verwenden",
  "count.useCamera": "Kamera verwenden",
  "count.err.denied":
    "Der Kamerazugriff ist aus. Erlaube ihn in den Einstellungen deines Telefons, damit Liftsmith Wiederholungen zählen kann.",
  "count.err.noCamera": "Dafür wurde keine Kamera gefunden.",
  "count.err.model": "Der Wiederholungszähler ließ sich nicht starten. Prüfe beim ersten Mal deine Verbindung und versuch es noch einmal.",
  "count.err.motion": "Der Bewegungszugriff wurde abgelehnt, deshalb können Wiederholungen nicht über das Telefon gezählt werden.",
};

export const it: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "La tua ripetizione si è fermata sopra il parallelo. Scendi finché le anche sono all’altezza delle ginocchia, e alleggerisci il bilanciere se serve.",
    other:
      "{hit} ripetizioni su {count} si sono fermate sopra il parallelo. Scendi finché le anche sono all’altezza delle ginocchia, e alleggerisci il bilanciere se serve.",
  },
  "count.form.rom": {
    one: "La tua ripetizione è stata più corta della migliore. Porta ogni ripetizione sullo stesso arco completo, anche se ne farai meno.",
    other:
      "{hit} ripetizioni su {count} sono state più corte della migliore. Porta ogni ripetizione sullo stesso arco completo, anche se ne farai meno.",
  },
  "count.form.leanLeft": {
    one: "Hai inclinato il busto di circa {deg}° verso sinistra. Tieni il peso uguale su entrambi i piedi e il petto dritto.",
    other:
      "Hai inclinato il busto di circa {deg}° verso sinistra in {hit} ripetizioni su {count}. Tieni il peso uguale su entrambi i piedi e il petto dritto.",
  },
  "count.form.leanRight": {
    one: "Hai inclinato il busto di circa {deg}° verso destra. Tieni il peso uguale su entrambi i piedi e il petto dritto.",
    other:
      "Hai inclinato il busto di circa {deg}° verso destra in {hit} ripetizioni su {count}. Tieni il peso uguale su entrambi i piedi e il petto dritto.",
  },
  "count.path.forwardBottom": {
    one: "Il bilanciere si è spostato di circa {cm} cm in avanti in basso. Tienilo sopra il centro del piede: contrai bene il core e resta compatto in basso.",
    other:
      "Il bilanciere si è spostato di circa {cm} cm in avanti in basso in {hit} ripetizioni su {count}. Tienilo sopra il centro del piede: contrai bene il core e resta compatto in basso.",
  },
  "count.path.forwardUp": {
    one: "Il bilanciere si è spostato di circa {cm} cm in avanti in salita. Tienilo sopra il centro del piede e spingi dritto verso l'alto.",
    other:
      "Il bilanciere si è spostato di circa {cm} cm in avanti in salita in {hit} ripetizioni su {count}. Tienilo sopra il centro del piede e spingi dritto verso l'alto.",
  },
  "count.path.back": {
    one: "Il bilanciere si è spostato di circa {cm} cm indietro. Tieni il peso sul centro del piede, non sui talloni.",
    other:
      "Il bilanciere si è spostato di circa {cm} cm indietro in {hit} ripetizioni su {count}. Tieni il peso sul centro del piede, non sui talloni.",
  },
  "count.path.good": {
    one: "Traiettoria del bilanciere: è rimasto entro {cm} cm dal punto di partenza in quella ripetizione.",
    other: "Traiettoria del bilanciere: è rimasto entro {cm} cm dal punto di partenza in quelle {count} ripetizioni.",
  },
  "count.form.good": {
    one: "Controllo della tecnica: niente da correggere in quella ripetizione.",
    other: "Controllo della tecnica: niente da correggere in quelle {count} ripetizioni.",
  },
  "count.max.own": {
    one: "Confrontato con la tua velocità di fine serie in questo esercizio, {speed} m/s, imparata da {count} serie portata a cedimento.",
    other: "Confrontato con la tua velocità di fine serie in questo esercizio, {speed} m/s, imparata da {count} serie portate a cedimento.",
  },
  "count.max.book": {
    one: "Confrontato con la velocità di fine serie abituale in questo esercizio, {speed} m/s. Porta a cedimento ancora {count} serie mentre la fotocamera conta e imparerà la tua.",
    other:
      "Confrontato con la velocità di fine serie abituale in questo esercizio, {speed} m/s. Porta a cedimento ancora {count} serie mentre la fotocamera conta e imparerà la tua.",
  },
  "count.max.title": "Velocità del riscaldamento",
  "count.max.up":
    "Il riscaldamento è andato veloce: il massimale di oggi è circa {max}, il {pct}% sopra quanto prevede il piano. Prova {weight} per le serie allenanti.",
  "count.max.down":
    "Il riscaldamento è andato lento: il massimale di oggi è circa {max}, il {pct}% sotto quanto prevede il piano. Prova {weight} per le serie allenanti.",
  "count.max.hold": "Il riscaldamento è andato come previsto: il massimale di oggi è circa {max}. Resta su {weight}.",
  "count.max.use": "Usa {weight}",
  "count.max.used": "Carico di lavoro impostato su {weight}.",
  "count.speed.label": "Velocità",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct}% del migliore",
  "count.speed.stop": "La velocità è scesa del {loss}% rispetto alla ripetizione più veloce. Buon momento per chiudere la serie.",
  "count.speed.left": {
    one: "Ti resta circa {count} ripetizione: la velocità è scesa del {loss}%.",
    other: "Ti restano circa {count} ripetizioni: la velocità è scesa del {loss}%.",
  },
  "count.toggle": "Conta le ripetizioni con la fotocamera",
  "count.toggleMotion": "Conta le ripetizioni con il movimento del telefono",
  "count.start": "Conta ripetizioni",
  "count.reps": "rip.",
  "count.stop": "Stop",
  "count.off": "Smetti di contare le ripetizioni",
  "count.opening": "Apertura della fotocamera…",
  "count.loading": "Preparazione del contaripetizioni (solo la prima volta)…",
  "count.position": "Mettiti di lato, con tutto il corpo nell'inquadratura della fotocamera.",
  "count.watch": { one: "Orologio: {count} ripetizione", other: "Orologio: {count} ripetizioni" },
  "count.counting": "Sto contando. Le ripetizioni compaiono in Registra serie.",
  "count.resting": "Riposo. Il conteggio riparte con la prossima serie.",
  "count.flipToBack": "Usa la fotocamera posteriore",
  "count.flipToFront": "Usa la fotocamera anteriore",
  "count.useMotion": "Usa il movimento del telefono",
  "count.useCamera": "Usa la fotocamera",
  "count.err.denied":
    "L’accesso alla fotocamera è disattivato. Consentilo nelle impostazioni del telefono perché Liftsmith possa contare le ripetizioni.",
  "count.err.noCamera": "Nessuna fotocamera trovata per questo.",
  "count.err.model": "Impossibile avviare il contaripetizioni. Al primo avvio controlla la connessione e riprova.",
  "count.err.motion": "L’accesso al movimento è stato negato, quindi le ripetizioni non si possono contare dal telefono.",
};

export const ja: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    other:
      "{count} レップ中 {hit} レップがパラレルより浅めでした。股関節が膝の高さに来るまでしゃがみましょう。必要なら重量を下げてください。",
  },
  "count.form.rom": {
    other: "{count} レップ中 {hit} レップがいちばん深いレップより短めでした。回数が減っても、毎回同じフルレンジで動かしましょう。",
  },
  "count.form.leanLeft": {
    other: "{count} レップ中 {hit} レップで左に約 {deg}° 傾いていました。両足に均等に体重を乗せ、胸を正面に向けましょう。",
  },
  "count.form.leanRight": {
    other: "{count} レップ中 {hit} レップで右に約 {deg}° 傾いていました。両足に均等に体重を乗せ、胸を正面に向けましょう。",
  },
  "count.path.forwardBottom": {
    other:
      "{count} レップ中 {hit} レップで、ボトムでバーが約 {cm} cm 前にずれました。体幹をしっかり固め、ボトムで力を抜かずに、バーを足の中央の上に保ちましょう。",
  },
  "count.path.forwardUp": {
    other:
      "{count} レップ中 {hit} レップで、上げる途中でバーが約 {cm} cm 前にずれました。バーを足の中央の上に保ち、まっすぐ上に押し上げましょう。",
  },
  "count.path.back": {
    other: "{count} レップ中 {hit} レップで、バーが約 {cm} cm 後ろにずれました。かかとではなく足の中央に体重を乗せましょう。",
  },
  "count.path.good": { other: "バーの軌道：この {count} レップは、スタート位置から {cm} cm 以内に収まりました。" },
  "count.form.good": { other: "フォームチェック：この {count} レップに直すところはありません。" },
  "count.max.own": {
    other: "この種目でのあなた自身のセット終盤スピード {speed} m/s を基準にしています（限界まで行った {count} セットから学習）。",
  },
  "count.max.book": {
    other:
      "この種目の一般的なセット終盤スピード {speed} m/s を基準にしています。カメラでカウントしながらあと {count} セット限界まで行うと、あなた自身の値を学習します。",
  },
  "count.max.title": "ウォームアップのスピード",
  "count.max.up":
    "ウォームアップのバーが速く動いています。今日の最大重量は約 {max} で、プランの想定より {pct}% 上です。メインセットは {weight} を試してみましょう。",
  "count.max.down":
    "ウォームアップのバーがゆっくりです。今日の最大重量は約 {max} で、プランの想定より {pct}% 下です。メインセットは {weight} を試してみましょう。",
  "count.max.hold": "ウォームアップは想定どおりです。今日の最大重量は約 {max}。{weight} のままで進めましょう。",
  "count.max.use": "{weight} にする",
  "count.max.used": "メイン重量を {weight} にしました。",
  "count.speed.label": "バースピード",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "最速の {pct}%",
  "count.speed.stop": "いちばん速いレップよりバースピードが {loss}% 落ちています。ここでセットを終えるのがおすすめです。",
  "count.speed.left": { other: "あと {count} レップほど余力があります（バースピードは {loss}% 低下）。" },
  "count.toggle": "カメラでレップを数える",
  "count.toggleMotion": "端末のモーションでレップを数える",
  "count.start": "レップを数える",
  "count.reps": "回",
  "count.stop": "停止",
  "count.off": "レップのカウントを止める",
  "count.opening": "カメラを起動しています…",
  "count.loading": "レップカウンターを準備しています（初回のみ）…",
  "count.position": "横向きに立ち、カメラの映像に全身が入るようにしてください。",
  "count.watch": { other: "ウォッチ：{count} 回" },
  "count.counting": "カウント中。レップ数は「セットを記録」に入ります。",
  "count.resting": "休憩中。次のセットでカウントを再開します。",
  "count.flipToBack": "背面カメラを使う",
  "count.flipToFront": "前面カメラを使う",
  "count.useMotion": "端末のモーションを使う",
  "count.useCamera": "カメラを使う",
  "count.err.denied": "カメラへのアクセスがオフです。Liftsmith がレップを数えられるよう、端末の設定で許可してください。",
  "count.err.noCamera": "使えるカメラが見つかりません。",
  "count.err.model": "レップカウンターを起動できませんでした。初回は通信状態を確認して、もう一度お試しください。",
  "count.err.motion": "モーションへのアクセスが拒否されたため、端末でレップを数えられません。",
};

export const pt: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "Sua rep parou acima da paralela. Desça até o quadril ficar na altura dos joelhos e tire peso da barra se precisar.",
    other:
      "{hit} de {count} reps pararam acima da paralela. Desça até o quadril ficar na altura dos joelhos e tire peso da barra se precisar.",
  },
  "count.form.rom": {
    one: "Sua rep foi mais curta que a sua melhor. Faça toda rep com a mesma amplitude completa, mesmo que isso signifique menos reps.",
    other:
      "{hit} de {count} reps foram mais curtas que a sua melhor. Faça toda rep com a mesma amplitude completa, mesmo que isso signifique menos reps.",
  },
  "count.form.leanLeft": {
    one: "Você inclinou cerca de {deg}° para a esquerda. Mantenha o peso igual nos dois pés e o peito reto.",
    other: "Você inclinou cerca de {deg}° para a esquerda em {hit} de {count} reps. Mantenha o peso igual nos dois pés e o peito reto.",
  },
  "count.form.leanRight": {
    one: "Você inclinou cerca de {deg}° para a direita. Mantenha o peso igual nos dois pés e o peito reto.",
    other: "Você inclinou cerca de {deg}° para a direita em {hit} de {count} reps. Mantenha o peso igual nos dois pés e o peito reto.",
  },
  "count.path.forwardBottom": {
    one: "A barra foi cerca de {cm} cm para a frente embaixo. Mantenha-a sobre o meio do pé: contraia o core com força e fique firme embaixo.",
    other:
      "A barra foi cerca de {cm} cm para a frente embaixo em {hit} de {count} reps. Mantenha-a sobre o meio do pé: contraia o core com força e fique firme embaixo.",
  },
  "count.path.forwardUp": {
    one: "A barra foi cerca de {cm} cm para a frente na subida. Mantenha-a sobre o meio do pé e empurre reto para cima.",
    other:
      "A barra foi cerca de {cm} cm para a frente na subida em {hit} de {count} reps. Mantenha-a sobre o meio do pé e empurre reto para cima.",
  },
  "count.path.back": {
    one: "A barra foi cerca de {cm} cm para trás. Mantenha o peso sobre o meio do pé, não nos calcanhares.",
    other: "A barra foi cerca de {cm} cm para trás em {hit} de {count} reps. Mantenha o peso sobre o meio do pé, não nos calcanhares.",
  },
  "count.path.good": {
    one: "Trajetória da barra: ficou a até {cm} cm de onde começou nessa rep.",
    other: "Trajetória da barra: ficou a até {cm} cm de onde começou nessas {count} reps.",
  },
  "count.form.good": {
    one: "Checagem de execução: nada a corrigir nessa rep.",
    other: "Checagem de execução: nada a corrigir nessas {count} reps.",
  },
  "count.max.own": {
    one: "Medido contra sua própria velocidade de fim de série neste exercício, {speed} m/s, aprendida de {count} série que você levou até a falha.",
    other:
      "Medido contra sua própria velocidade de fim de série neste exercício, {speed} m/s, aprendida de {count} séries que você levou até a falha.",
  },
  "count.max.book": {
    one: "Medido contra a velocidade de fim de série típica deste exercício, {speed} m/s. Leve mais {count} série até a falha com a câmera contando e ele aprende a sua.",
    other:
      "Medido contra a velocidade de fim de série típica deste exercício, {speed} m/s. Leve mais {count} séries até a falha com a câmera contando e ele aprende a sua.",
  },
  "count.max.title": "Velocidade no aquecimento",
  "count.max.up":
    "Seus aquecimentos foram rápidos: o máximo de hoje parece ser cerca de {max}, {pct}% acima do que o plano espera. Tente {weight} nas séries de trabalho.",
  "count.max.down":
    "Seus aquecimentos foram lentos: o máximo de hoje parece ser cerca de {max}, {pct}% abaixo do que o plano espera. Tente {weight} nas séries de trabalho.",
  "count.max.hold": "Seus aquecimentos foram como esperado: o máximo de hoje parece ser cerca de {max}. Fique com {weight}.",
  "count.max.use": "Usar {weight}",
  "count.max.used": "Peso de trabalho definido em {weight}.",
  "count.speed.label": "Velocidade da barra",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct}% da melhor",
  "count.speed.stop": "A velocidade da barra caiu {loss}% em relação à sua rep mais rápida. Um bom momento para encerrar a série.",
  "count.speed.left": {
    one: "Cerca de {count} rep no tanque: a velocidade da barra caiu {loss}%.",
    other: "Cerca de {count} reps no tanque: a velocidade da barra caiu {loss}%.",
  },
  "count.toggle": "Contar reps com a câmera",
  "count.toggleMotion": "Contar reps com o movimento do celular",
  "count.start": "Contar reps",
  "count.reps": "reps",
  "count.stop": "Parar",
  "count.off": "Parar de contar reps",
  "count.opening": "Abrindo a câmera…",
  "count.loading": "Preparando o contador de reps (só da primeira vez)…",
  "count.position": "Fique de lado com o corpo inteiro na câmera.",
  "count.watch": {
    one: "Relógio: {count} rep",
    other: "Relógio: {count} reps",
  },
  "count.counting": "Contando. Suas reps preenchem Registrar série.",
  "count.resting": "Descansando. A contagem recomeça na próxima série.",
  "count.flipToBack": "Usar a câmera traseira",
  "count.flipToFront": "Usar a câmera frontal",
  "count.useMotion": "Usar o movimento do celular",
  "count.useCamera": "Usar a câmera",
  "count.err.denied": "O acesso à câmera está desativado. Permita-o nos ajustes do celular para o Liftsmith contar reps.",
  "count.err.noCamera": "Nenhuma câmera encontrada para isto.",
  "count.err.model": "Não foi possível iniciar o contador de reps. Verifique sua conexão na primeira vez e tente de novo.",
  "count.err.motion": "O acesso ao movimento foi recusado, então não dá para contar reps pelo celular.",
};

export const ko: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    other: "{count}회 중 {hit}회가 평행보다 위에서 멈췄어요. 엉덩이가 무릎 높이까지 오도록 앉고, 필요하면 무게를 줄이세요.",
  },
  "count.form.rom": {
    other: "{count}회 중 {hit}회가 최고 기록 때보다 가동 범위가 짧았어요. 횟수가 줄더라도 매 회를 같은 전체 범위로 하세요.",
  },
  "count.form.leanLeft": {
    other: "{count}회 중 {hit}회에서 왼쪽으로 약 {deg}° 기울었어요. 양발에 체중을 고르게 싣고 가슴을 정면으로 유지하세요.",
  },
  "count.form.leanRight": {
    other: "{count}회 중 {hit}회에서 오른쪽으로 약 {deg}° 기울었어요. 양발에 체중을 고르게 싣고 가슴을 정면으로 유지하세요.",
  },
  "count.path.forwardBottom": {
    other:
      "{count}회 중 {hit}회에서 바가 바닥 지점에서 약 {cm} cm 앞으로 밀렸어요. 바를 발 중앙 위에 두세요. 바닥에서 코어에 힘을 꽉 주고 긴장을 유지하세요.",
  },
  "count.path.forwardUp": {
    other: "{count}회 중 {hit}회에서 바가 올라가면서 약 {cm} cm 앞으로 밀렸어요. 바를 발 중앙 위에 두고 곧장 위로 밀어 올리세요.",
  },
  "count.path.back": {
    other: "{count}회 중 {hit}회에서 바가 약 {cm} cm 뒤로 밀렸어요. 뒤꿈치가 아니라 발 중앙에 체중을 실으세요.",
  },
  "count.path.good": {
    other: "바 경로: {count}회 동안 시작 위치에서 {cm} cm 이내를 유지했어요.",
  },
  "count.form.good": {
    other: "자세 체크: {count}회 모두 고칠 게 없어요.",
  },
  "count.max.own": {
    other: "한계까지 한 {count}세트에서 배운 이 운동의 내 세트 막바지 속도 {speed} m/s를 기준으로 측정했어요.",
  },
  "count.max.book": {
    other:
      "이 운동의 일반적인 세트 막바지 속도 {speed} m/s를 기준으로 측정했어요. 카메라로 횟수를 세면서 {count}세트를 더 한계까지 하면 내 속도를 배워요.",
  },
  "count.max.title": "워밍업 속도",
  "count.max.up":
    "워밍업 속도가 빨랐어요. 오늘 최대 중량은 약 {max}로, 계획 예상보다 {pct}% 높아 보여요. 본 세트는 {weight}(으)로 해 보세요.",
  "count.max.down":
    "워밍업 속도가 느렸어요. 오늘 최대 중량은 약 {max}로, 계획 예상보다 {pct}% 낮아 보여요. 본 세트는 {weight}(으)로 해 보세요.",
  "count.max.hold": "워밍업 속도가 예상대로였어요. 오늘 최대 중량은 약 {max}로 보여요. {weight}을(를) 유지하세요.",
  "count.max.use": "{weight} 사용",
  "count.max.used": "본 세트 무게를 {weight}(으)로 설정했어요.",
  "count.speed.label": "바 속도",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "최고의 {pct}%",
  "count.speed.stop": "바 속도가 가장 빠른 회보다 {loss}% 떨어졌어요. 세트를 끝내기 좋은 지점이에요.",
  "count.speed.left": {
    other: "약 {count}회 더 할 힘이 남았어요. 바 속도가 {loss}% 떨어졌어요.",
  },
  "count.toggle": "카메라로 횟수 세기",
  "count.toggleMotion": "휴대폰 움직임으로 횟수 세기",
  "count.start": "횟수 세기",
  "count.reps": "회",
  "count.stop": "중지",
  "count.off": "횟수 세기 중지",
  "count.opening": "카메라 여는 중…",
  "count.loading": "횟수 카운터 준비 중 (처음 한 번만)…",
  "count.position": "몸 전체가 카메라에 보이도록 옆으로 서세요.",
  "count.watch": {
    other: "워치: {count}회",
  },
  "count.counting": "세는 중이에요. 횟수가 세트 기록에 채워져요.",
  "count.resting": "휴식 중이에요. 다음 세트에서 다시 세기 시작해요.",
  "count.flipToBack": "후면 카메라 사용",
  "count.flipToFront": "전면 카메라 사용",
  "count.useMotion": "휴대폰 움직임 사용",
  "count.useCamera": "카메라 사용",
  "count.err.denied": "카메라 접근이 꺼져 있어요. Liftsmith가 횟수를 셀 수 있도록 휴대폰 설정에서 허용하세요.",
  "count.err.noCamera": "사용할 카메라를 찾지 못했어요.",
  "count.err.model": "횟수 카운터를 시작하지 못했어요. 처음 실행할 때는 인터넷 연결을 확인하고 다시 시도하세요.",
  "count.err.motion": "동작 접근이 거부되어 휴대폰으로 횟수를 셀 수 없어요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "Tekrarın paralelin üstünde kaldı. Kalçan dizlerinle aynı hizaya gelene kadar in; gerekirse barı hafiflet.",
    other: "{count} tekrarın {hit} tanesi paralelin üstünde kaldı. Kalçan dizlerinle aynı hizaya gelene kadar in; gerekirse barı hafiflet.",
  },
  "count.form.rom": {
    one: "Tekrarın en iyi tekrarından kısaydı. Daha az tekrar anlamına gelse bile her tekrarı aynı tam açıyla yap.",
    other: "{count} tekrarın {hit} tanesi en iyi tekrarından kısaydı. Daha az tekrar anlamına gelse bile her tekrarı aynı tam açıyla yap.",
  },
  "count.form.leanLeft": {
    one: "Yaklaşık {deg}° soluna eğildin. Ağırlığını iki ayağına eşit ver, göğsünü düz tut.",
    other: "{count} tekrarın {hit} tanesinde yaklaşık {deg}° soluna eğildin. Ağırlığını iki ayağına eşit ver, göğsünü düz tut.",
  },
  "count.form.leanRight": {
    one: "Yaklaşık {deg}° sağına eğildin. Ağırlığını iki ayağına eşit ver, göğsünü düz tut.",
    other: "{count} tekrarın {hit} tanesinde yaklaşık {deg}° sağına eğildin. Ağırlığını iki ayağına eşit ver, göğsünü düz tut.",
  },
  "count.path.forwardBottom": {
    one: "Bar en altta yaklaşık {cm} cm öne kaydı. Onu ayağının ortasının üstünde tut: sıkıca karnını kilitle ve altta gergin kal.",
    other:
      "{count} tekrarın {hit} tanesinde bar en altta yaklaşık {cm} cm öne kaydı. Onu ayağının ortasının üstünde tut: sıkıca karnını kilitle ve altta gergin kal.",
  },
  "count.path.forwardUp": {
    one: "Bar yukarı çıkarken yaklaşık {cm} cm öne kaydı. Onu ayağının ortasının üstünde tut ve dümdüz yukarı it.",
    other:
      "{count} tekrarın {hit} tanesinde bar yukarı çıkarken yaklaşık {cm} cm öne kaydı. Onu ayağının ortasının üstünde tut ve dümdüz yukarı it.",
  },
  "count.path.back": {
    one: "Bar yaklaşık {cm} cm geriye kaydı. Ağırlığını topuklarına değil, ayağının ortasına ver.",
    other: "{count} tekrarın {hit} tanesinde bar yaklaşık {cm} cm geriye kaydı. Ağırlığını topuklarına değil, ayağının ortasına ver.",
  },
  "count.path.good": {
    one: "Bar yolu: o tekrarda başladığı yerden en fazla {cm} cm uzaklaştı.",
    other: "Bar yolu: o {count} tekrarda başladığı yerden en fazla {cm} cm uzaklaştı.",
  },
  "count.form.good": {
    one: "Form kontrolü: o tekrarda düzeltilecek bir şey yok.",
    other: "Form kontrolü: o {count} tekrarda düzeltilecek bir şey yok.",
  },
  "count.max.own": {
    one: "Tükenişe kadar götürdüğün {count} setten öğrenilen, bu hareket için kendi set sonu hızın olan {speed} m/s ile karşılaştırıldı.",
    other: "Tükenişe kadar götürdüğün {count} setten öğrenilen, bu hareket için kendi set sonu hızın olan {speed} m/s ile karşılaştırıldı.",
  },
  "count.max.book": {
    one: "Bu hareket için olağan set sonu hızı olan {speed} m/s ile karşılaştırıldı. Kamera sayarken {count} set daha tükenişe kadar git, o da senin hızını öğrensin.",
    other:
      "Bu hareket için olağan set sonu hızı olan {speed} m/s ile karşılaştırıldı. Kamera sayarken {count} set daha tükenişe kadar git, o da senin hızını öğrensin.",
  },
  "count.max.title": "Isınma hızı",
  "count.max.up":
    "Isınmaların hızlı geçti: bugünkü maksimumun yaklaşık {max}, planın beklediğinden %{pct} fazla görünüyor. Çalışma setlerin için {weight} dene.",
  "count.max.down":
    "Isınmaların yavaş geçti: bugünkü maksimumun yaklaşık {max}, planın beklediğinden %{pct} az görünüyor. Çalışma setlerin için {weight} dene.",
  "count.max.hold": "Isınmaların beklendiği gibi geçti: bugünkü maksimumun yaklaşık {max} görünüyor. {weight} ile devam et.",
  "count.max.use": "{weight} kullan",
  "count.max.used": "Çalışma ağırlığı {weight} olarak ayarlandı.",
  "count.speed.label": "Bar hızı",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "En iyinin %{pct}'i",
  "count.speed.stop": "Bar hızı en hızlı tekrarından %{loss} düştü. Seti bitirmek için iyi bir an.",
  "count.speed.left": {
    one: "Depoda yaklaşık {count} tekrar kaldı: bar hızı %{loss} düştü.",
    other: "Depoda yaklaşık {count} tekrar kaldı: bar hızı %{loss} düştü.",
  },
  "count.toggle": "Tekrarları kamerayla say",
  "count.toggleMotion": "Tekrarları telefon hareketiyle say",
  "count.start": "Tekrarları say",
  "count.reps": "tekrar",
  "count.stop": "Durdur",
  "count.off": "Tekrar saymayı durdur",
  "count.opening": "Kamera açılıyor…",
  "count.loading": "Tekrar sayacı hazırlanıyor (yalnızca ilk sefer)…",
  "count.position": "Yan dur ve tüm vücudun kamera görüntüsünde olsun.",
  "count.watch": {
    one: "Saat: {count} tekrar",
    other: "Saat: {count} tekrar",
  },
  "count.counting": "Sayılıyor. Tekrarların Seti kaydet'e işlenir.",
  "count.resting": "Dinleniyorsun. Sayım sonraki setinle yeniden başlar.",
  "count.flipToBack": "Arka kamerayı kullan",
  "count.flipToFront": "Ön kamerayı kullan",
  "count.useMotion": "Telefon hareketini kullan",
  "count.useCamera": "Kamerayı kullan",
  "count.err.denied": "Kamera erişimi kapalı. Liftsmith'in tekrar sayabilmesi için telefonunun ayarlarından izin ver.",
  "count.err.noCamera": "Bunun için kamera bulunamadı.",
  "count.err.model": "Tekrar sayacı başlatılamadı. İlk çalıştırma için bağlantını kontrol et ve yeniden dene.",
  "count.err.motion": "Hareket erişimi reddedildi, bu yüzden tekrarlar telefondan sayılamıyor.",
};

export const pl: Partial<Record<Key, Message>> = {
  "count.form.depth": {
    one: "Twoje powtórzenie skończyło się nad równoległą. Schodź, aż biodra będą na wysokości kolan, a w razie potrzeby odciąż sztangę.",
    few: "W {hit} z {count} powtórzeń zejście skończyło się nad równoległą. Schodź, aż biodra będą na wysokości kolan, a w razie potrzeby odciąż sztangę.",
    many: "W {hit} z {count} powtórzeń zejście skończyło się nad równoległą. Schodź, aż biodra będą na wysokości kolan, a w razie potrzeby odciąż sztangę.",
    other:
      "W {hit} z {count} powtórzeń zejście skończyło się nad równoległą. Schodź, aż biodra będą na wysokości kolan, a w razie potrzeby odciąż sztangę.",
  },
  "count.form.rom": {
    one: "Twoje powtórzenie było krótsze niż Twoje najlepsze. Rób każde powtórzenie w tym samym pełnym zakresie, nawet kosztem liczby powtórzeń.",
    few: "W {hit} z {count} powtórzeń zakres był krótszy niż Twój najlepszy. Rób każde powtórzenie w tym samym pełnym zakresie, nawet kosztem liczby powtórzeń.",
    many: "W {hit} z {count} powtórzeń zakres był krótszy niż Twój najlepszy. Rób każde powtórzenie w tym samym pełnym zakresie, nawet kosztem liczby powtórzeń.",
    other:
      "W {hit} z {count} powtórzeń zakres był krótszy niż Twój najlepszy. Rób każde powtórzenie w tym samym pełnym zakresie, nawet kosztem liczby powtórzeń.",
  },
  "count.form.leanLeft": {
    one: "Przechył o około {deg}° w lewo. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
    few: "Przechył o około {deg}° w lewo w {hit} z {count} powtórzeń. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
    many: "Przechył o około {deg}° w lewo w {hit} z {count} powtórzeń. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
    other: "Przechył o około {deg}° w lewo w {hit} z {count} powtórzeń. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
  },
  "count.form.leanRight": {
    one: "Przechył o około {deg}° w prawo. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
    few: "Przechył o około {deg}° w prawo w {hit} z {count} powtórzeń. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
    many: "Przechył o około {deg}° w prawo w {hit} z {count} powtórzeń. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
    other: "Przechył o około {deg}° w prawo w {hit} z {count} powtórzeń. Rozkładaj ciężar równo na obie stopy i trzymaj klatkę prosto.",
  },
  "count.path.forwardBottom": {
    one: "Sztanga uciekła w dole o około {cm} cm do przodu. Trzymaj ją nad środkiem stopy: mocno się usztywnij i bądź spięty na dole.",
    few: "Sztanga uciekła w dole o około {cm} cm do przodu w {hit} z {count} powtórzeń. Trzymaj ją nad środkiem stopy: mocno się usztywnij i bądź spięty na dole.",
    many: "Sztanga uciekła w dole o około {cm} cm do przodu w {hit} z {count} powtórzeń. Trzymaj ją nad środkiem stopy: mocno się usztywnij i bądź spięty na dole.",
    other:
      "Sztanga uciekła w dole o około {cm} cm do przodu w {hit} z {count} powtórzeń. Trzymaj ją nad środkiem stopy: mocno się usztywnij i bądź spięty na dole.",
  },
  "count.path.forwardUp": {
    one: "Sztanga uciekła o około {cm} cm do przodu w drodze w górę. Trzymaj ją nad środkiem stopy i pchaj prosto w górę.",
    few: "Sztanga uciekła o około {cm} cm do przodu w drodze w górę w {hit} z {count} powtórzeń. Trzymaj ją nad środkiem stopy i pchaj prosto w górę.",
    many: "Sztanga uciekła o około {cm} cm do przodu w drodze w górę w {hit} z {count} powtórzeń. Trzymaj ją nad środkiem stopy i pchaj prosto w górę.",
    other:
      "Sztanga uciekła o około {cm} cm do przodu w drodze w górę w {hit} z {count} powtórzeń. Trzymaj ją nad środkiem stopy i pchaj prosto w górę.",
  },
  "count.path.back": {
    one: "Sztanga uciekła o około {cm} cm do tyłu. Trzymaj ciężar nad środkiem stopy, nie na piętach.",
    few: "Sztanga uciekła o około {cm} cm do tyłu w {hit} z {count} powtórzeń. Trzymaj ciężar nad środkiem stopy, nie na piętach.",
    many: "Sztanga uciekła o około {cm} cm do tyłu w {hit} z {count} powtórzeń. Trzymaj ciężar nad środkiem stopy, nie na piętach.",
    other: "Sztanga uciekła o około {cm} cm do tyłu w {hit} z {count} powtórzeń. Trzymaj ciężar nad środkiem stopy, nie na piętach.",
  },
  "count.path.good": {
    one: "Tor sztangi: w tym powtórzeniu nie odszedł dalej niż {cm} cm od punktu startu.",
    few: "Tor sztangi: w tych {count} powtórzeniach nie odszedł dalej niż {cm} cm od punktu startu.",
    many: "Tor sztangi: w tych {count} powtórzeniach nie odszedł dalej niż {cm} cm od punktu startu.",
    other: "Tor sztangi: w tych {count} powtórzeniach nie odszedł dalej niż {cm} cm od punktu startu.",
  },
  "count.form.good": {
    one: "Kontrola techniki: w tym powtórzeniu nie ma nic do poprawy.",
    few: "Kontrola techniki: w tych {count} powtórzeniach nie ma nic do poprawy.",
    many: "Kontrola techniki: w tych {count} powtórzeniach nie ma nic do poprawy.",
    other: "Kontrola techniki: w tych {count} powtórzeniach nie ma nic do poprawy.",
  },
  "count.max.own": {
    one: "W porównaniu z Twoją własną prędkością na końcu serii w tym ćwiczeniu, {speed} m/s, wyuczoną z {count} serii do upadku.",
    few: "W porównaniu z Twoją własną prędkością na końcu serii w tym ćwiczeniu, {speed} m/s, wyuczoną z {count} serii do upadku.",
    many: "W porównaniu z Twoją własną prędkością na końcu serii w tym ćwiczeniu, {speed} m/s, wyuczoną z {count} serii do upadku.",
    other: "W porównaniu z Twoją własną prędkością na końcu serii w tym ćwiczeniu, {speed} m/s, wyuczoną z {count} serii do upadku.",
  },
  "count.max.book": {
    one: "W porównaniu z typową prędkością na końcu serii w tym ćwiczeniu, {speed} m/s. Zrób jeszcze {count} serię do upadku, gdy kamera liczy, a pozna Twoją własną.",
    few: "W porównaniu z typową prędkością na końcu serii w tym ćwiczeniu, {speed} m/s. Zrób jeszcze {count} serie do upadku, gdy kamera liczy, a pozna Twoją własną.",
    many: "W porównaniu z typową prędkością na końcu serii w tym ćwiczeniu, {speed} m/s. Zrób jeszcze {count} serii do upadku, gdy kamera liczy, a pozna Twoją własną.",
    other:
      "W porównaniu z typową prędkością na końcu serii w tym ćwiczeniu, {speed} m/s. Zrób jeszcze {count} serii do upadku, gdy kamera liczy, a pozna Twoją własną.",
  },
  "count.max.title": "Prędkość na rozgrzewce",
  "count.max.up":
    "Rozgrzewka szła szybko: dzisiejsze maksimum to około {max}, {pct}% więcej, niż zakłada plan. Spróbuj {weight} w seriach roboczych.",
  "count.max.down":
    "Rozgrzewka szła wolno: dzisiejsze maksimum to około {max}, {pct}% mniej, niż zakłada plan. Spróbuj {weight} w seriach roboczych.",
  "count.max.hold": "Rozgrzewka szła zgodnie z oczekiwaniami: dzisiejsze maksimum to około {max}. Zostań przy {weight}.",
  "count.max.use": "Użyj {weight}",
  "count.max.used": "Ciężar roboczy ustawiony na {weight}.",
  "count.speed.label": "Prędkość sztangi",
  "count.speed.ms": "{speed} m/s",
  "count.speed.pct": "{pct}% najlepszej",
  "count.speed.stop": "Prędkość sztangi spadła o {loss}% względem najszybszego powtórzenia. Dobry moment, by zakończyć serię.",
  "count.speed.left": {
    one: "Zostało około {count} powtórzenie w zapasie: prędkość sztangi spadła o {loss}%.",
    few: "Zostały około {count} powtórzenia w zapasie: prędkość sztangi spadła o {loss}%.",
    many: "Zostało około {count} powtórzeń w zapasie: prędkość sztangi spadła o {loss}%.",
    other: "Zostało około {count} powtórzenia w zapasie: prędkość sztangi spadła o {loss}%.",
  },
  "count.toggle": "Licz powtórzenia kamerą",
  "count.toggleMotion": "Licz powtórzenia ruchem telefonu",
  "count.start": "Licz powtórzenia",
  "count.reps": "powt.",
  "count.stop": "Stop",
  "count.off": "Przestań liczyć powtórzenia",
  "count.opening": "Otwieram kamerę…",
  "count.loading": "Przygotowuję licznik powtórzeń (tylko za pierwszym razem)…",
  "count.position": "Stań bokiem, tak by cała sylwetka była w kadrze.",
  "count.watch": {
    one: "Zegarek: {count} powtórzenie",
    few: "Zegarek: {count} powtórzenia",
    many: "Zegarek: {count} powtórzeń",
    other: "Zegarek: {count} powtórzenia",
  },
  "count.counting": "Liczę. Twoje powtórzenia trafią do Zapisz serię.",
  "count.resting": "Przerwa. Liczenie zacznie się znowu w następnej serii.",
  "count.flipToBack": "Użyj tylnego aparatu",
  "count.flipToFront": "Użyj przedniego aparatu",
  "count.useMotion": "Użyj ruchu telefonu",
  "count.useCamera": "Użyj kamery",
  "count.err.denied": "Dostęp do kamery jest wyłączony. Zezwól na niego w ustawieniach telefonu, by Liftsmith mógł liczyć powtórzenia.",
  "count.err.noCamera": "Nie znaleziono kamery.",
  "count.err.model": "Nie udało się uruchomić licznika powtórzeń. Przy pierwszym uruchomieniu sprawdź połączenie i spróbuj ponownie.",
  "count.err.motion": "Odmówiono dostępu do czujników ruchu, więc telefon nie może liczyć powtórzeń.",
};
