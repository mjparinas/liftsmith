import type { Message } from "@/lib/i18n";

// Text for keys starting "count.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "count.toggle": "Count reps with the camera",
  "count.start": "Count reps",
  "count.reps": "reps",
  "count.stop": "Stop",
  "count.off": "Stop counting reps",
  "count.opening": "Opening the camera…",
  "count.loading": "Getting the rep counter ready (first time only)…",
  "count.position": "Stand side-on with your whole body in the camera view.",
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
  "count.toggle": "Contar repeticiones con la cámara",
  "count.start": "Contar reps",
  "count.reps": "reps",
  "count.stop": "Parar",
  "count.off": "Dejar de contar repeticiones",
  "count.opening": "Abriendo la cámara…",
  "count.loading": "Preparando el contador de repeticiones (solo la primera vez)…",
  "count.position": "Ponte de lado, con todo el cuerpo en la vista de la cámara.",
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
  "count.toggle": "Compter les répétitions avec la caméra",
  "count.start": "Compter",
  "count.reps": "rép.",
  "count.stop": "Arrêter",
  "count.off": "Arrêter de compter les répétitions",
  "count.opening": "Ouverture de la caméra…",
  "count.loading": "Préparation du compteur de répétitions (la première fois seulement)…",
  "count.position": "Placez-vous de profil, tout le corps dans la vue de la caméra.",
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
