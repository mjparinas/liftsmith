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
  "cal.eventTitle": "Liftsmith workout",
  "cal.eventNote": "Open Liftsmith to start today's workout.",
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
  "cal.eventTitle": "Entrenamiento de Liftsmith",
  "cal.eventNote": "Abre Liftsmith para empezar el entrenamiento de hoy.",
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
  "cal.eventTitle": "Séance Liftsmith",
  "cal.eventNote": "Ouvrez Liftsmith pour commencer la séance du jour.",
};

export const de: Partial<Record<Key, Message>> = {
  "cal.days": "Trainingstage",
  "cal.time": "Uhrzeit",
  "cal.download": "Kalenderdatei herunterladen",
  "cal.update": "Meinen Kalender aktualisieren",
  "cal.add": "Zu meinem Kalender hinzufügen",
  "cal.remove": "Aus meinem Kalender entfernen",
  "cal.fit": "Trainings an meinen Kalender anpassen",
  "cal.fitNote":
    "Wenn bald etwas ansteht, bietet Heute ein kürzeres Training an, das passt. Liftsmith sieht nur, wann du beschäftigt bist, nie, was die Termine sind, und das bleibt auf diesem Telefon.",
  "cal.onOff": "An · Ausschalten",
  "cal.turnOn": "Einschalten",
  "cal.downloaded": "Kalenderdatei heruntergeladen. Öffne sie, um deine Trainingstage hinzuzufügen.",
  "cal.denied": "Der Kalenderzugriff ist aus. Du kannst ihn in den Einstellungen deines Telefons erlauben.",
  "cal.saved": "Deine Trainingstage sind in deinem Kalender.",
  "cal.failed": "Das hat nicht geklappt. Prüfe, ob dieses Telefon einen Kalender hat, in den du eintragen kannst.",
  "cal.removed": "Aus deinem Kalender entfernt.",
  "cal.eventTitle": "Liftsmith-Training",
  "cal.eventNote": "Öffne Liftsmith, um das heutige Training zu starten.",
};

export const it: Partial<Record<Key, Message>> = {
  "cal.days": "Giorni di allenamento",
  "cal.time": "Ora",
  "cal.download": "Scarica il file del calendario",
  "cal.update": "Aggiorna il mio calendario",
  "cal.add": "Aggiungi al mio calendario",
  "cal.remove": "Rimuovi dal mio calendario",
  "cal.fit": "Adatta gli allenamenti al mio calendario",
  "cal.fitNote":
    "Quando hai un impegno a breve, Oggi propone un allenamento più corto che ci sta. Liftsmith vede solo quando sei occupato, mai di cosa si tratta, e tutto resta su questo telefono.",
  "cal.onOff": "Attivo · Disattiva",
  "cal.turnOn": "Attiva",
  "cal.downloaded": "File del calendario scaricato. Aprilo per aggiungere i tuoi giorni di allenamento.",
  "cal.denied": "L’accesso al calendario è disattivato. Puoi consentirlo nelle impostazioni del telefono.",
  "cal.saved": "I tuoi giorni di allenamento sono nel calendario.",
  "cal.failed": "Non ha funzionato. Controlla che sul telefono ci sia un calendario a cui aggiungere eventi.",
  "cal.removed": "Rimosso dal calendario.",
  "cal.eventTitle": "Allenamento Liftsmith",
  "cal.eventNote": "Apri Liftsmith per iniziare l’allenamento di oggi.",
};

export const ja: Partial<Record<Key, Message>> = {
  "cal.days": "トレーニング日",
  "cal.time": "時刻",
  "cal.download": "カレンダーファイルをダウンロード",
  "cal.update": "カレンダーを更新",
  "cal.add": "カレンダーに追加",
  "cal.remove": "カレンダーから削除",
  "cal.fit": "予定に合わせてワークアウトを調整",
  "cal.fitNote":
    "もうすぐ予定があるときは、「今日」で収まる短めのワークアウトを提案します。Liftsmith が見るのは予定がある時間だけで、内容は見ません。情報はこの端末から出ません。",
  "cal.onOff": "オン · オフにする",
  "cal.turnOn": "オンにする",
  "cal.downloaded": "カレンダーファイルをダウンロードしました。開くとトレーニング日が追加されます。",
  "cal.denied": "カレンダーへのアクセスがオフです。端末の設定で許可できます。",
  "cal.saved": "トレーニング日をカレンダーに追加しました。",
  "cal.failed": "うまくいきませんでした。この端末に追加できるカレンダーがあるか確認してください。",
  "cal.removed": "カレンダーから削除しました。",
  "cal.eventTitle": "Liftsmith ワークアウト",
  "cal.eventNote": "Liftsmith を開いて今日のワークアウトを始めましょう。",
};
