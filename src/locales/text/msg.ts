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

export const de: Partial<Record<Key, Message>> = {
  "msg.title": "Erinnerungen",
  "msg.intro":
    "Erinnerungen folgen deinen Trainingstagen ({days}) um {time}. Ändern kannst du sie unter Einstellungen › Trainingsplanung. Zwischen {quietFrom} und {quietTo} wird nichts gesendet, und nie mehr als eine pro Tag.",
  "msg.noDays": "keine gewählt",
  "msg.push": "Benachrichtigungen aufs Telefon",
  "msg.pushOff":
    "Benachrichtigungen für Liftsmith sind aus. Beim Einschalten wird erneut gefragt, oder erlaube sie in den Einstellungen deines Telefons.",
  "msg.pushDenied": "Benachrichtigungen für Liftsmith sind aus. Du kannst sie in den Einstellungen deines Telefons erlauben.",
  "msg.reminderPush": "An deinen Trainingstagen zu deiner Trainingszeit.",
  "msg.reminderEmail": "Eine E-Mail am Montag mit deiner Trainingswoche.",
  "msg.webOnly": "Benachrichtigungen aufs Telefon gibt es in den Apps für Android und iPhone. Im Web nutze unten die E-Mail-Erinnerungen.",
  "msg.email": "E-Mail",
  "msg.unsubscribed": "Du hast {email} abgemeldet. Schalte E-Mails unten wieder ein.",
  "msg.address": "E-Mail-Adresse",
  "msg.consent":
    "Schick mir Trainingserinnerungen und Fortschrittsnotizen von Liftsmith per E-Mail. Ich kann mich jederzeit abmelden. Angebote bleiben aus, außer ich schalte sie ein.",
  "msg.send": "Bestätigungs-E-Mail senden",
  "msg.pending": "Wir warten darauf, dass du {email} bestätigst. Jede E-Mail hat einen Abmeldelink.",
  "msg.sending": "Wird an {email} gesendet. Jede E-Mail hat einen Abmeldelink.",
  "msg.resend": "Bestätigung erneut senden",
  "msg.stop": "Alle E-Mails stoppen und meine Adresse löschen",
  "msg.badEmail": "Diese E-Mail-Adresse sieht nicht richtig aus.",
  "msg.offlineRetry": "Der Server war nicht erreichbar. Wir versuchen es wieder, wenn du online bist.",
  "msg.offline": "Der Server war nicht erreichbar. Versuch es wieder, wenn du online bist.",
  "msg.updated": "E-Mail aktualisiert.",
  "msg.check": "Schau in {email} nach einem Bestätigungslink. Bis du darauf tippst, wird nichts gesendet.",
  "msg.stopped": "E-Mails gestoppt, und deine Adresse ist von unserem Server gelöscht.",
};

export const it: Partial<Record<Key, Message>> = {
  "msg.title": "Promemoria",
  "msg.intro":
    "I promemoria seguono i tuoi giorni di allenamento ({days}) alle {time}. Puoi cambiarli in Impostazioni › Programmazione. Tra le {quietFrom} e le {quietTo} non arriva nulla, e mai più di uno al giorno.",
  "msg.noDays": "nessuno scelto",
  "msg.push": "Notifiche sul telefono",
  "msg.pushOff":
    "Le notifiche di Liftsmith sono disattivate. Attivandone una te lo chiederà di nuovo, oppure consentile nelle impostazioni del telefono.",
  "msg.pushDenied": "Le notifiche di Liftsmith sono disattivate. Puoi consentirle nelle impostazioni del telefono.",
  "msg.reminderPush": "Nei tuoi giorni di allenamento all’ora dell’allenamento.",
  "msg.reminderEmail": "Un’email il lunedì con la tua settimana di allenamento.",
  "msg.webOnly": "Le notifiche sul telefono sono nelle app per Android e iPhone. Sul web usa i promemoria via email qui sotto.",
  "msg.email": "Email",
  "msg.unsubscribed": "Hai annullato l’iscrizione di {email}. Riattiva le email qui sotto.",
  "msg.address": "Indirizzo email",
  "msg.consent":
    "Inviami via email promemoria di allenamento e note sui progressi da Liftsmith. Posso annullare l’iscrizione quando voglio. Le offerte restano disattivate se non le attivo.",
  "msg.send": "Invia email di conferma",
  "msg.pending": "In attesa che confermi {email}. Ogni email ha un link per annullare l’iscrizione.",
  "msg.sending": "Invio a {email}. Ogni email ha un link per annullare l’iscrizione.",
  "msg.resend": "Invia di nuovo la conferma",
  "msg.stop": "Interrompi tutte le email ed elimina il mio indirizzo",
  "msg.badEmail": "Questo indirizzo email non sembra corretto.",
  "msg.offlineRetry": "Impossibile raggiungere il server. Riproveremo quando sarai online.",
  "msg.offline": "Impossibile raggiungere il server. Riprova quando sei online.",
  "msg.updated": "Email aggiornata.",
  "msg.check": "Cerca in {email} un link di conferma. Non inviamo nulla finché non lo tocchi.",
  "msg.stopped": "Email interrotte, e il tuo indirizzo è stato eliminato dal nostro server.",
};

export const ja: Partial<Record<Key, Message>> = {
  "msg.title": "リマインダー",
  "msg.intro":
    "リマインダーはトレーニング日（{days}）の{time}に届きます。変更は「設定 › トレーニング」から。{quietFrom}〜{quietTo}は送信せず、1日1回までです。",
  "msg.noDays": "未選択",
  "msg.push": "スマホの通知",
  "msg.pushOff": "Liftsmith の通知はオフです。オンにすると再度確認が表示されます。端末の設定から許可することもできます。",
  "msg.pushDenied": "Liftsmith の通知はオフです。端末の設定で許可できます。",
  "msg.reminderPush": "トレーニング日のワークアウト時刻に。",
  "msg.reminderEmail": "月曜日に1週間のトレーニングをまとめたメールを1通。",
  "msg.webOnly": "スマホの通知は Android と iPhone のアプリで使えます。Web では下のメールのリマインダーをご利用ください。",
  "msg.email": "メール",
  "msg.unsubscribed": "{email}の配信を停止しました。下でメールを再びオンにできます。",
  "msg.address": "メールアドレス",
  "msg.consent":
    "Liftsmith からワークアウトのリマインダーと進捗のメモをメールで受け取ります。配信はいつでも停止できます。お得な情報は自分でオンにしない限り届きません。",
  "msg.send": "確認メールを送信",
  "msg.pending": "{email}の確認待ちです。すべてのメールに配信停止リンクがあります。",
  "msg.sending": "{email}に送信しています。すべてのメールに配信停止リンクがあります。",
  "msg.resend": "確認メールを再送",
  "msg.stop": "すべてのメールを停止してアドレスを削除",
  "msg.badEmail": "メールアドレスが正しくないようです。",
  "msg.offlineRetry": "サーバーに接続できませんでした。オンラインになったら再試行します。",
  "msg.offline": "サーバーに接続できませんでした。オンラインになってからもう一度お試しください。",
  "msg.updated": "メールを更新しました。",
  "msg.check": "{email}に届いた確認リンクをタップしてください。タップするまで何も送信されません。",
  "msg.stopped": "メールを停止し、アドレスをサーバーから削除しました。",
};
