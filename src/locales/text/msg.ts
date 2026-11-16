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

export const pt: Partial<Record<Key, Message>> = {
  "msg.title": "Lembretes",
  "msg.intro":
    "Os lembretes seguem seus dias de treino ({days}) às {time}. Mude em Ajustes › Planejamento. Nada é enviado entre {quietFrom} e {quietTo}, e nunca mais de um por dia.",
  "msg.noDays": "nenhum escolhido",
  "msg.push": "Notificações no celular",
  "msg.pushOff": "As notificações do Liftsmith estão desligadas. Ativar uma pede permissão de novo, ou permita nos ajustes do celular.",
  "msg.pushDenied": "As notificações do Liftsmith estão desligadas. Você pode permiti-las nos ajustes do celular.",
  "msg.reminderPush": "Nos seus dias de treino, no seu horário de treino.",
  "msg.reminderEmail": "Um e-mail na segunda com a sua semana de treino.",
  "msg.webOnly": "As notificações no celular estão nos apps para Android e iPhone. Na web, use os lembretes por e-mail abaixo.",
  "msg.email": "E-mail",
  "msg.emailMe": "Receber por e-mail",
  "msg.emailTo":
    "Lembretes de treino e notas de progresso vão para {email}, o endereço com que você entrou. Todo e-mail tem um link para cancelar a inscrição, e as ofertas ficam desligadas a menos que você as ative.",
  "msg.signInFirst":
    "Entre para receber lembretes por e-mail. Eles vão para o endereço com que você entra, então não precisa digitar nada.",
  "msg.pending": "Aguardando você confirmar {email}. Todo e-mail tem um link para cancelar a inscrição.",
  "msg.sending": "Enviando para {email}. Todo e-mail tem um link para cancelar a inscrição.",
  "msg.resend": "Reenviar confirmação",
  "msg.offlineRetry": "Não foi possível falar com o servidor. Vamos tentar de novo quando você estiver online.",
  "msg.offline": "Não foi possível falar com o servidor. Tente de novo quando estiver online.",
  "msg.check": "Procure em {email} um link de confirmação. Nada é enviado até você tocar nele.",
  "msg.stopped": "E-mails parados, e seu endereço foi apagado do nosso servidor.",
};

export const ko: Partial<Record<Key, Message>> = {
  "msg.title": "알림",
  "msg.intro":
    "알림은 운동하는 날({days}) {time}에 보내요. 설정 › 트레이닝에서 바꿀 수 있어요. {quietFrom}부터 {quietTo}까지는 보내지 않고, 하루에 한 번을 넘지 않아요.",
  "msg.noDays": "선택 안 함",
  "msg.push": "휴대폰 알림",
  "msg.pushOff": "Liftsmith 알림이 꺼져 있어요. 하나를 켜면 다시 물어보거나, 휴대폰 설정에서 허용할 수 있어요.",
  "msg.pushDenied": "Liftsmith 알림이 꺼져 있어요. 휴대폰 설정에서 허용할 수 있어요.",
  "msg.reminderPush": "운동하는 날, 운동 시간에 보내요.",
  "msg.reminderEmail": "월요일에 한 주의 운동을 담은 이메일 한 통.",
  "msg.webOnly": "휴대폰 알림은 Android와 iPhone 앱에서 받을 수 있어요. 웹에서는 아래 이메일 알림을 사용하세요.",
  "msg.email": "이메일",
  "msg.emailMe": "이메일 받기",
  "msg.emailTo":
    "운동 알림과 진행 상황은 로그인한 주소인 {email}(으)로 보내요. 모든 이메일에는 수신 거부 링크가 있고, 혜택 안내는 직접 켜지 않으면 보내지 않아요.",
  "msg.signInFirst": "로그인하면 이메일로 알림을 받을 수 있어요. 로그인한 주소로 보내므로 따로 입력할 필요가 없어요.",
  "msg.pending": "{email} 확인을 기다리고 있어요. 모든 이메일에는 수신 거부 링크가 있어요.",
  "msg.sending": "{email}(으)로 보내고 있어요. 모든 이메일에는 수신 거부 링크가 있어요.",
  "msg.resend": "확인 메일 다시 보내기",
  "msg.offlineRetry": "서버에 연결하지 못했어요. 온라인이 되면 다시 시도할게요.",
  "msg.offline": "서버에 연결하지 못했어요. 온라인이 되면 다시 시도하세요.",
  "msg.check": "{email}에서 확인 링크를 확인하세요. 링크를 탭하기 전까지는 아무것도 보내지 않아요.",
  "msg.stopped": "이메일을 중지했고, 주소는 서버에서 삭제했어요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "msg.title": "Hatırlatıcılar",
  "msg.intro":
    "Hatırlatıcılar antrenman günlerini ({days}) saat {time} için izler. Bunları Ayarlar › Program altında değiştir. {quietFrom} ile {quietTo} arasında hiçbir şey gönderilmez ve günde birden fazla asla gönderilmez.",
  "msg.noDays": "seçilmedi",
  "msg.push": "Telefon bildirimleri",
  "msg.pushOff": "Liftsmith için bildirimler kapalı. Birini açmak tekrar sorar ya da telefonunun ayarlarından izin verebilirsin.",
  "msg.pushDenied": "Liftsmith için bildirimler kapalı. Telefonunun ayarlarından izin verebilirsin.",
  "msg.reminderPush": "Antrenman günlerinde, antrenman saatinde.",
  "msg.reminderEmail": "Pazartesi, antrenman haftanla birlikte tek bir e-posta.",
  "msg.webOnly": "Telefon bildirimleri Android ve iPhone uygulamalarında. Web'de aşağıdaki e-posta hatırlatıcılarını kullan.",
  "msg.email": "E-posta",
  "msg.emailMe": "Bana e-posta gönder",
  "msg.emailTo":
    "Antrenman hatırlatıcıları ve ilerleme notları giriş yaptığın adres olan {email} adresine gider. Her e-postada abonelikten çıkma bağlantısı vardır ve teklifler sen açmadıkça kapalı kalır.",
  "msg.signInFirst": "Hatırlatıcıları e-postayla almak için giriş yap. Giriş yaptığın adrese gider, yazacak bir şey yok.",
  "msg.pending": "{email} adresini onaylaman bekleniyor. Her e-postada abonelikten çıkma bağlantısı vardır.",
  "msg.sending": "{email} adresine gönderiliyor. Her e-postada abonelikten çıkma bağlantısı vardır.",
  "msg.resend": "Onayı tekrar gönder",
  "msg.offlineRetry": "Sunucuya ulaşılamadı. Çevrimiçi olduğunda tekrar deneyeceğiz.",
  "msg.offline": "Sunucuya ulaşılamadı. Çevrimiçi olduğunda tekrar dene.",
  "msg.check": "Onay bağlantısı için {email} adresini kontrol et. Ona dokunana kadar hiçbir şey gönderilmez.",
  "msg.stopped": "E-postalar durduruldu ve adresin sunucumuzdan silindi.",
};

export const pl: Partial<Record<Key, Message>> = {
  "msg.title": "Przypomnienia",
  "msg.intro":
    "Przypomnienia trzymają się twoich dni treningowych ({days}) o {time}. Zmienisz je w Ustawienia › Planowanie. Między {quietFrom} a {quietTo} nic nie wysyłamy i nigdy więcej niż jedno dziennie.",
  "msg.noDays": "nie wybrano",
  "msg.push": "Powiadomienia na telefonie",
  "msg.pushOff": "Powiadomienia dla Liftsmith są wyłączone. Włączenie któregoś zapyta ponownie albo zezwól na nie w ustawieniach telefonu.",
  "msg.pushDenied": "Powiadomienia dla Liftsmith są wyłączone. Możesz na nie zezwolić w ustawieniach telefonu.",
  "msg.reminderPush": "W dni treningowe o porze treningu.",
  "msg.reminderEmail": "Jeden e-mail w poniedziałek z twoim tygodniem treningowym.",
  "msg.webOnly": "Powiadomienia na telefonie są w aplikacjach na Androida i iPhone'a. W wersji webowej użyj przypomnień e-mail poniżej.",
  "msg.email": "E-mail",
  "msg.emailMe": "Wysyłaj mi e-maile",
  "msg.emailTo":
    "Przypomnienia o treningach i notatki o postępach trafiają na {email}, adres, którym się logujesz. Każdy e-mail ma link do wypisania się, a oferty pozostają wyłączone, dopóki ich nie włączysz.",
  "msg.signInFirst":
    "Zaloguj się, żeby dostawać przypomnienia e-mailem. Trafiają na adres, którym się logujesz, więc nic nie trzeba wpisywać.",
  "msg.pending": "Czekamy, aż potwierdzisz {email}. Każdy e-mail ma link do wypisania się.",
  "msg.sending": "Wysyłamy na {email}. Każdy e-mail ma link do wypisania się.",
  "msg.resend": "Wyślij potwierdzenie ponownie",
  "msg.offlineRetry": "Brak połączenia z serwerem. Spróbujemy ponownie, gdy będziesz online.",
  "msg.offline": "Brak połączenia z serwerem. Spróbuj ponownie, gdy będziesz online.",
  "msg.check": "Sprawdź {email}, tam jest link potwierdzający. Nic nie wyślemy, dopóki go nie stukniesz.",
  "msg.stopped": "E-maile wyłączone, a twój adres został usunięty z naszego serwera.",
};
