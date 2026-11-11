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
