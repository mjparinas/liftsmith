import type { Message } from "@/lib/i18n";

// Text for keys starting "cal.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cal.days": "Training days",
  "cal.time": "Time",
  "cal.download": "Download calendar file",
  "cal.update": "Update my calendar",
  "cal.add": "Add to my calendar",
  "cal.remove": "Remove from my calendar",
  "cal.fit": "Fit workouts around my calendar",
  "cal.fitNote":
    "When something's coming up soon, Today offers a shorter workout that fits. Liftsmith only sees when you're busy, never what the events are, and it stays on this phone.",
  "cal.onOff": "On · Turn off",
  "cal.turnOn": "Turn on",
  "cal.downloaded": "Calendar file downloaded. Open it to add your training days.",
  "cal.denied": "Calendar access is off. You can allow it in your phone's settings.",
  "cal.saved": "Your training days are in your calendar.",
  "cal.failed": "That didn't work. Check that this phone has a calendar you can add to.",
  "cal.removed": "Removed from your calendar.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cal.days": "Días de entrenamiento",
  "cal.time": "Hora",
  "cal.download": "Descargar archivo de calendario",
  "cal.update": "Actualizar mi calendario",
  "cal.add": "Añadir a mi calendario",
  "cal.remove": "Quitar de mi calendario",
  "cal.fit": "Adaptar los entrenamientos a mi calendario",
  "cal.fitNote":
    "Cuando tienes algo pronto, Hoy te ofrece un entrenamiento más corto que encaje. Liftsmith solo ve cuándo estás ocupado, nunca qué son los eventos, y no sale de este teléfono.",
  "cal.onOff": "Activado · Desactivar",
  "cal.turnOn": "Activar",
  "cal.downloaded": "Archivo de calendario descargado. Ábrelo para añadir tus días de entrenamiento.",
  "cal.denied": "El acceso al calendario está desactivado. Puedes permitirlo en los ajustes del teléfono.",
  "cal.saved": "Tus días de entrenamiento están en tu calendario.",
  "cal.failed": "No ha funcionado. Comprueba que este teléfono tenga un calendario donde añadir eventos.",
  "cal.removed": "Quitado de tu calendario.",
};

export const fr: Partial<Record<Key, Message>> = {
  "cal.days": "Jours d’entraînement",
  "cal.time": "Heure",
  "cal.download": "Télécharger le fichier de calendrier",
  "cal.update": "Mettre à jour mon calendrier",
  "cal.add": "Ajouter à mon calendrier",
  "cal.remove": "Retirer de mon calendrier",
  "cal.fit": "Adapter les séances à mon calendrier",
  "cal.fitNote":
    "Quand quelque chose arrive bientôt, Aujourd’hui propose une séance plus courte qui tient. Liftsmith voit seulement quand vous êtes occupé, jamais le contenu des événements, et rien ne quitte ce téléphone.",
  "cal.onOff": "Activé · Désactiver",
  "cal.turnOn": "Activer",
  "cal.downloaded": "Fichier de calendrier téléchargé. Ouvrez-le pour ajouter vos jours d’entraînement.",
  "cal.denied": "L’accès au calendrier est désactivé. Vous pouvez l’autoriser dans les réglages du téléphone.",
  "cal.saved": "Vos jours d’entraînement sont dans votre calendrier.",
  "cal.failed": "Ça n’a pas marché. Vérifiez que ce téléphone a un calendrier où ajouter des événements.",
  "cal.removed": "Retiré de votre calendrier.",
};
