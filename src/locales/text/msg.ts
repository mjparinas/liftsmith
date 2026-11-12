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
  "msg.emailMe": "Email me",
  "msg.emailTo":
    "Workout reminders and progress notes go to {email}, the address you signed in with. Every email has an unsubscribe link, and offers stay off unless you turn them on.",
  "msg.signInFirst": "Sign in to get reminders by email. They go to the address you sign in with, so there is nothing to type.",
  "msg.pending": "Waiting for you to confirm {email}. Every email has an unsubscribe link.",
  "msg.sending": "Sending to {email}. Every email has an unsubscribe link.",
  "msg.resend": "Resend confirmation",
  "msg.offlineRetry": "Couldn't reach the server. We'll try again when you're online.",
  "msg.offline": "Couldn't reach the server. Try again when you're online.",
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
  "msg.emailMe": "Enviarme correos",
  "msg.emailTo":
    "Los recordatorios de entrenamiento y las notas de progreso llegan a {email}, la dirección con la que iniciaste sesión. Cada correo incluye un enlace para darse de baja, y las ofertas siguen desactivadas salvo que las actives.",
  "msg.signInFirst":
    "Inicia sesión para recibir recordatorios por correo. Llegan a la dirección con la que inicias sesión, así que no hay nada que escribir.",
  "msg.pending": "Esperando a que confirmes {email}. Cada correo incluye un enlace para darse de baja.",
  "msg.sending": "Enviando a {email}. Cada correo incluye un enlace para darse de baja.",
  "msg.resend": "Reenviar confirmación",
  "msg.offlineRetry": "No se pudo conectar con el servidor. Lo volveremos a intentar cuando tengas conexión.",
  "msg.offline": "No se pudo conectar con el servidor. Inténtalo de nuevo cuando tengas conexión.",
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
  "msg.emailMe": "M’envoyer des e-mails",
  "msg.emailTo":
    "Les rappels d’entraînement et les notes de progrès arrivent à {email}, l’adresse de votre compte. Chaque e-mail contient un lien de désabonnement, et les offres restent désactivées sauf si vous les activez.",
  "msg.signInFirst": "Connectez-vous pour recevoir les rappels par e-mail. Ils arrivent à l’adresse de votre compte, donc rien à saisir.",
  "msg.pending": "En attente de la confirmation de {email}. Chaque e-mail contient un lien de désabonnement.",
  "msg.sending": "Envoi à {email}. Chaque e-mail contient un lien de désabonnement.",
  "msg.resend": "Renvoyer la confirmation",
  "msg.offlineRetry": "Impossible de joindre le serveur. Nous réessaierons quand vous serez en ligne.",
  "msg.offline": "Impossible de joindre le serveur. Réessayez quand vous serez en ligne.",
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
  "msg.emailMe": "E-Mails an mich",
  "msg.emailTo":
    "Trainingserinnerungen und Fortschrittsnotizen gehen an {email}, die Adresse deiner Anmeldung. Jede E-Mail hat einen Abmeldelink, und Angebote bleiben aus, außer du schaltest sie ein.",
  "msg.signInFirst":
    "Melde dich an, um Erinnerungen per E-Mail zu bekommen. Sie gehen an die Adresse deiner Anmeldung, du musst also nichts eintippen.",
  "msg.pending": "Wir warten darauf, dass du {email} bestätigst. Jede E-Mail hat einen Abmeldelink.",
  "msg.sending": "Wird an {email} gesendet. Jede E-Mail hat einen Abmeldelink.",
  "msg.resend": "Bestätigung erneut senden",
  "msg.offlineRetry": "Der Server war nicht erreichbar. Wir versuchen es wieder, wenn du online bist.",
  "msg.offline": "Der Server war nicht erreichbar. Versuch es wieder, wenn du online bist.",
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
  "msg.emailMe": "Inviami email",
  "msg.emailTo":
    "Promemoria di allenamento e note sui progressi arrivano a {email}, l’indirizzo con cui hai effettuato l’accesso. Ogni email ha un link per annullare l’iscrizione, e le offerte restano disattivate se non le attivi.",
  "msg.signInFirst": "Accedi per ricevere i promemoria via email. Arrivano all’indirizzo con cui accedi, quindi non c’è nulla da scrivere.",
  "msg.pending": "In attesa che confermi {email}. Ogni email ha un link per annullare l’iscrizione.",
  "msg.sending": "Invio a {email}. Ogni email ha un link per annullare l’iscrizione.",
  "msg.resend": "Invia di nuovo la conferma",
  "msg.offlineRetry": "Impossibile raggiungere il server. Riproveremo quando sarai online.",
  "msg.offline": "Impossibile raggiungere il server. Riprova quando sei online.",
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
  "msg.emailMe": "メールで受け取る",
  "msg.emailTo":
    "トレーニングのリマインダーと進捗メモは、サインインしたアドレス {email} に届きます。すべてのメールに配信停止リンクがあり、お得な情報はオンにしない限り届きません。",
  "msg.signInFirst": "サインインすると、リマインダーをメールで受け取れます。サインインしたアドレスに届くので、入力は不要です。",
  "msg.pending": "{email}の確認待ちです。すべてのメールに配信停止リンクがあります。",
  "msg.sending": "{email}に送信しています。すべてのメールに配信停止リンクがあります。",
  "msg.resend": "確認メールを再送",
  "msg.offlineRetry": "サーバーに接続できませんでした。オンラインになったら再試行します。",
  "msg.offline": "サーバーに接続できませんでした。オンラインになってからもう一度お試しください。",
  "msg.check": "{email}に届いた確認リンクをタップしてください。タップするまで何も送信されません。",
  "msg.stopped": "メールを停止し、アドレスをサーバーから削除しました。",
};
