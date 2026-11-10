import type { Message } from "@/lib/i18n";

// Text for keys starting "msg.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "msg.title": "Reminders",
  "msg.intro":
    "Reminders follow your training days ({days}) at {time}. Change them under Settings › Training. Nothing is sent between {quietFrom} and {quietTo}, and never more than one a day.",
  "msg.noDays": "none picked",
  "msg.push": "Phone notifications",
  "msg.pushOff": "Notifications are off for Liftsmith. Turning one on asks again, or allow them in your phone's settings.",
  "msg.pushDenied": "Notifications are off for Liftsmith. You can allow them in your phone's settings.",
  "msg.reminderPush": "On your training days at your workout time.",
  "msg.reminderEmail": "One email on Monday with your training week.",
  "msg.webOnly": "Phone notifications are in the Android and iPhone apps. On the web, use email reminders below.",
  "msg.email": "Email",
  "msg.unsubscribed": "You unsubscribed from {email}. Turn email on again below.",
  "msg.address": "Email address",
  "msg.consent":
    "Email me workout reminders and progress notes from Liftsmith. I can unsubscribe at any time. Offers stay off unless I turn them on.",
  "msg.send": "Send confirmation email",
  "msg.pending": "Waiting for you to confirm {email}. Every email has an unsubscribe link.",
  "msg.sending": "Sending to {email}. Every email has an unsubscribe link.",
  "msg.resend": "Resend confirmation",
  "msg.stop": "Stop all email and delete my address",
  "msg.badEmail": "That email address doesn't look right.",
  "msg.offlineRetry": "Couldn't reach the server. We'll try again when you're online.",
  "msg.offline": "Couldn't reach the server. Try again when you're online.",
  "msg.updated": "Email updated.",
  "msg.check": "Check {email} for a confirmation link. Nothing is sent until you tap it.",
  "msg.stopped": "Email stopped, and your address is deleted from our server.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "msg.title": "Recordatorios",
  "msg.intro":
    "Los recordatorios siguen tus días de entrenamiento ({days}) a las {time}. Cámbialos en Ajustes › Entrenamiento. No se envía nada entre las {quietFrom} y las {quietTo}, y nunca más de uno al día.",
  "msg.noDays": "ninguno elegido",
  "msg.push": "Notificaciones del teléfono",
  "msg.pushOff":
    "Las notificaciones de Liftsmith están desactivadas. Al activar una se vuelve a preguntar, o permítelas en los ajustes del teléfono.",
  "msg.pushDenied": "Las notificaciones de Liftsmith están desactivadas. Puedes permitirlas en los ajustes del teléfono.",
  "msg.reminderPush": "En tus días de entrenamiento, a la hora de tu entrenamiento.",
  "msg.reminderEmail": "Un correo el lunes con tu semana de entrenamiento.",
  "msg.webOnly": "Las notificaciones están en las apps de Android y iPhone. En la web, usa los recordatorios por correo de abajo.",
  "msg.email": "Correo",
  "msg.unsubscribed": "Cancelaste la suscripción de {email}. Vuelve a activar el correo abajo.",
  "msg.address": "Dirección de correo",
  "msg.consent":
    "Envíame recordatorios de entrenamiento y notas de progreso de Liftsmith. Puedo darme de baja en cualquier momento. Las ofertas siguen desactivadas salvo que las active.",
  "msg.send": "Enviar correo de confirmación",
  "msg.pending": "Esperando a que confirmes {email}. Cada correo incluye un enlace para darse de baja.",
  "msg.sending": "Enviando a {email}. Cada correo incluye un enlace para darse de baja.",
  "msg.resend": "Reenviar confirmación",
  "msg.stop": "Dejar de enviar correos y borrar mi dirección",
  "msg.badEmail": "Esa dirección de correo no parece correcta.",
  "msg.offlineRetry": "No se pudo conectar con el servidor. Lo volveremos a intentar cuando tengas conexión.",
  "msg.offline": "No se pudo conectar con el servidor. Inténtalo de nuevo cuando tengas conexión.",
  "msg.updated": "Correo actualizado.",
  "msg.check": "Busca en {email} un enlace de confirmación. No se envía nada hasta que lo pulses.",
  "msg.stopped": "Correos detenidos, y tu dirección se ha borrado de nuestro servidor.",
};

export const fr: Partial<Record<Key, Message>> = {
  "msg.title": "Rappels",
  "msg.intro":
    "Les rappels suivent vos jours d’entraînement ({days}) à {time}. Modifiez-les dans Réglages › Entraînement. Rien n’est envoyé entre {quietFrom} et {quietTo}, et jamais plus d’un par jour.",
  "msg.noDays": "aucun choisi",
  "msg.push": "Notifications du téléphone",
  "msg.pushOff":
    "Les notifications de Liftsmith sont désactivées. En activer une redemande l’autorisation, ou autorisez-les dans les réglages du téléphone.",
  "msg.pushDenied": "Les notifications de Liftsmith sont désactivées. Vous pouvez les autoriser dans les réglages du téléphone.",
  "msg.reminderPush": "Vos jours d’entraînement, à l’heure de votre séance.",
  "msg.reminderEmail": "Un e-mail le lundi avec votre semaine d’entraînement.",
  "msg.webOnly": "Les notifications sont dans les apps Android et iPhone. Sur le web, utilisez les rappels par e-mail ci-dessous.",
  "msg.email": "E-mail",
  "msg.unsubscribed": "Vous vous êtes désabonné de {email}. Réactivez l’e-mail ci-dessous.",
  "msg.address": "Adresse e-mail",
  "msg.consent":
    "Envoyez-moi des rappels d’entraînement et des notes de progrès de Liftsmith. Je peux me désabonner à tout moment. Les offres restent désactivées sauf si je les active.",
  "msg.send": "Envoyer l’e-mail de confirmation",
  "msg.pending": "En attente de la confirmation de {email}. Chaque e-mail contient un lien de désabonnement.",
  "msg.sending": "Envoi à {email}. Chaque e-mail contient un lien de désabonnement.",
  "msg.resend": "Renvoyer la confirmation",
  "msg.stop": "Arrêter tous les e-mails et supprimer mon adresse",
  "msg.badEmail": "Cette adresse e-mail ne semble pas correcte.",
  "msg.offlineRetry": "Impossible de joindre le serveur. Nous réessaierons quand vous serez en ligne.",
  "msg.offline": "Impossible de joindre le serveur. Réessayez quand vous serez en ligne.",
  "msg.updated": "E-mail mis à jour.",
  "msg.check": "Cherchez un lien de confirmation dans {email}. Rien n’est envoyé avant que vous ne l’ouvriez.",
  "msg.stopped": "E-mails arrêtés, et votre adresse est supprimée de notre serveur.",
};
