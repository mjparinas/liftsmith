import type { Message } from "@/lib/i18n";

// Text for keys starting "share.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "share.title": "Shared training summary",
  "share.anon": "A {brand} lifter",
  "share.weekStreak": "Week streak",
  "share.badges": "Badges",
  "share.last12": "Last 12 weeks",
  "share.bestLifts": "Best lifts (estimated one-rep max)",
  "share.made": "Made {date}",
  "share.copied": "Link copied.",
  "share.copyFail": "Couldn’t copy. Select the link and copy it.",
  "share.myTraining": "My {brand} training",
  "share.intro":
    "Send friends a link to your training summary: level, workouts, streak, badges, best lifts and the days you trained in the last 12 weeks.",
  "share.privacy":
    "It never includes heart rate, body weight, cycle data, your gyms or where they are. The summary lives in the link itself, so nothing is uploaded; anyone with the link can see it.",
  "share.withName": "Show my name ({name})",
  "share.noName": "Show my name (add one in the app’s Settings)",
  "share.yourLink": "Your link",
  "share.copy": "Copy link",
  "share.share": "Share…",
  "share.friends": "Following friends and a shared feed come with accounts.",
  "share.broken": "This link doesn’t work",
  "share.brokenBody": "It may have been cut short when it was copied. Ask your friend to send it again.",
  "share.try": "Try {brand}",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "share.title": "Resumen de entrenamiento compartido",
  "share.anon": "Un atleta de {brand}",
  "share.weekStreak": "Racha semanal",
  "share.badges": "Insignias",
  "share.last12": "Últimas 12 semanas",
  "share.bestLifts": "Mejores levantamientos (1RM estimado)",
  "share.made": "Creado el {date}",
  "share.copied": "Enlace copiado.",
  "share.copyFail": "No se pudo copiar. Selecciona el enlace y cópialo.",
  "share.myTraining": "Mi entrenamiento en {brand}",
  "share.intro":
    "Envía a tus amigos un enlace a tu resumen de entrenamiento: nivel, entrenamientos, racha, insignias, mejores levantamientos y los días que entrenaste en las últimas 12 semanas.",
  "share.privacy":
    "Nunca incluye frecuencia cardiaca, peso corporal, datos del ciclo, tus gimnasios ni dónde están. El resumen va dentro del propio enlace, así que no se sube nada; cualquiera con el enlace puede verlo.",
  "share.withName": "Mostrar mi nombre ({name})",
  "share.noName": "Mostrar mi nombre (añade uno en los Ajustes de la app)",
  "share.yourLink": "Tu enlace",
  "share.copy": "Copiar enlace",
  "share.share": "Compartir…",
  "share.friends": "Seguir a amigos y un feed compartido llegarán con las cuentas.",
  "share.broken": "Este enlace no funciona",
  "share.brokenBody": "Puede que se cortara al copiarlo. Pide a tu amigo que lo envíe de nuevo.",
  "share.try": "Prueba {brand}",
};

export const fr: Partial<Record<Key, Message>> = {
  "share.title": "Résumé d’entraînement partagé",
  "share.anon": "Un sportif {brand}",
  "share.weekStreak": "Série de semaines",
  "share.badges": "Badges",
  "share.last12": "12 dernières semaines",
  "share.bestLifts": "Meilleurs mouvements (1RM estimé)",
  "share.made": "Créé le {date}",
  "share.copied": "Lien copié.",
  "share.copyFail": "Copie impossible. Sélectionnez le lien et copiez-le.",
  "share.myTraining": "Mon entraînement {brand}",
  "share.intro":
    "Envoyez à vos amis un lien vers votre résumé : niveau, séances, série, badges, meilleurs mouvements et les jours d’entraînement des 12 dernières semaines.",
  "share.privacy":
    "Il n’inclut jamais la fréquence cardiaque, le poids, les données de cycle, vos salles ni leur emplacement. Le résumé est contenu dans le lien, donc rien n’est envoyé ; toute personne ayant le lien peut le voir.",
  "share.withName": "Afficher mon nom ({name})",
  "share.noName": "Afficher mon nom (ajoutez-en un dans les Réglages de l’app)",
  "share.yourLink": "Votre lien",
  "share.copy": "Copier le lien",
  "share.share": "Partager…",
  "share.friends": "Suivre des amis et un fil partagé arriveront avec les comptes.",
  "share.broken": "Ce lien ne fonctionne pas",
  "share.brokenBody": "Il a peut-être été coupé lors de la copie. Demandez à votre ami de le renvoyer.",
  "share.try": "Essayer {brand}",
};

export const de: Partial<Record<Key, Message>> = {
  "share.title": "Geteilte Trainingsübersicht",
  "share.anon": "Ein {brand}-Lifter",
  "share.weekStreak": "Wochenserie",
  "share.badges": "Abzeichen",
  "share.last12": "Letzte 12 Wochen",
  "share.bestLifts": "Beste Leistungen (geschätztes Einerwiederholungsmaximum)",
  "share.made": "Erstellt am {date}",
  "share.copied": "Link kopiert.",
  "share.copyFail": "Kopieren fehlgeschlagen. Markiere den Link und kopiere ihn.",
  "share.myTraining": "Mein {brand}-Training",
  "share.intro":
    "Schick Freunden einen Link zu deiner Trainingsübersicht: Level, Trainings, Serie, Abzeichen, beste Leistungen und die Tage, an denen du in den letzten 12 Wochen trainiert hast.",
  "share.privacy":
    "Sie enthält nie Herzfrequenz, Körpergewicht, Zyklusdaten, deine Studios oder ihre Lage. Die Übersicht steckt im Link selbst, also wird nichts hochgeladen; jeder mit dem Link kann sie sehen.",
  "share.withName": "Meinen Namen zeigen ({name})",
  "share.noName": "Meinen Namen zeigen (in den Einstellungen der App hinzufügen)",
  "share.yourLink": "Dein Link",
  "share.copy": "Link kopieren",
  "share.share": "Teilen…",
  "share.friends": "Freunden folgen und ein gemeinsamer Feed kommen mit Konten.",
  "share.broken": "Dieser Link funktioniert nicht",
  "share.brokenBody": "Er wurde beim Kopieren vielleicht abgeschnitten. Bitte deinen Freund, ihn noch einmal zu schicken.",
  "share.try": "{brand} ausprobieren",
};

export const it: Partial<Record<Key, Message>> = {
  "share.title": "Riepilogo allenamento condiviso",
  "share.anon": "Un atleta di {brand}",
  "share.weekStreak": "Serie di settimane",
  "share.badges": "Badge",
  "share.last12": "Ultime 12 settimane",
  "share.bestLifts": "Migliori alzate (massimale stimato)",
  "share.made": "Creato il {date}",
  "share.copied": "Link copiato.",
  "share.copyFail": "Impossibile copiare. Seleziona il link e copialo.",
  "share.myTraining": "Il mio allenamento con {brand}",
  "share.intro":
    "Invia agli amici un link al tuo riepilogo: livello, allenamenti, serie, badge, migliori alzate e i giorni in cui ti sei allenato nelle ultime 12 settimane.",
  "share.privacy":
    "Non include mai frequenza cardiaca, peso corporeo, dati del ciclo, le tue palestre o dove si trovano. Il riepilogo è dentro il link stesso, quindi non si carica nulla; chiunque abbia il link può vederlo.",
  "share.withName": "Mostra il mio nome ({name})",
  "share.noName": "Mostra il mio nome (aggiungilo nelle Impostazioni dell’app)",
  "share.yourLink": "Il tuo link",
  "share.copy": "Copia link",
  "share.share": "Condividi…",
  "share.friends": "Seguire gli amici e un feed condiviso arriveranno con gli account.",
  "share.broken": "Questo link non funziona",
  "share.brokenBody": "Potrebbe essere stato troncato durante la copia. Chiedi al tuo amico di inviarlo di nuovo.",
  "share.try": "Prova {brand}",
};

export const ja: Partial<Record<Key, Message>> = {
  "share.title": "共有されたトレーニングのまとめ",
  "share.anon": "{brand}ユーザー",
  "share.weekStreak": "連続週数",
  "share.badges": "バッジ",
  "share.last12": "直近12週",
  "share.bestLifts": "ベスト記録（推定1RM）",
  "share.made": "{date}作成",
  "share.copied": "リンクをコピーしました。",
  "share.copyFail": "コピーできませんでした。リンクを選択してコピーしてください。",
  "share.myTraining": "私の{brand}トレーニング",
  "share.intro":
    "トレーニングのまとめへのリンクを友だちに送れます。レベル、ワークアウト、連続記録、バッジ、ベスト記録、直近12週のトレーニング日が含まれます。",
  "share.privacy":
    "心拍数、体重、周期のデータ、ジムやその場所は含まれません。まとめはリンク自体に入っているので何もアップロードされませんが、リンクを知っている人なら誰でも見られます。",
  "share.withName": "名前を表示（{name}）",
  "share.noName": "名前を表示（アプリの設定で追加してください）",
  "share.yourLink": "あなたのリンク",
  "share.copy": "リンクをコピー",
  "share.share": "共有…",
  "share.friends": "友だちのフォローや共有フィードはアカウント機能と一緒に追加予定です。",
  "share.broken": "このリンクは使えません",
  "share.brokenBody": "コピーの際に途中で切れた可能性があります。もう一度送ってもらってください。",
  "share.try": "{brand}を試す",
};
