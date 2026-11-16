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

export const pt: Partial<Record<Key, Message>> = {
  "share.title": "Resumo de treino compartilhado",
  "share.anon": "Alguém que treina com o {brand}",
  "share.weekStreak": "Sequência de semanas",
  "share.badges": "Insígnias",
  "share.last12": "Últimas 12 semanas",
  "share.bestLifts": "Melhores marcas (1RM estimado)",
  "share.made": "Feito em {date}",
  "share.copied": "Link copiado.",
  "share.copyFail": "Não foi possível copiar. Selecione o link e copie.",
  "share.myTraining": "Meus treinos no {brand}",
  "share.intro":
    "Envie aos amigos um link para o resumo dos seus treinos: nível, treinos, sequência, insígnias, melhores marcas e os dias em que você treinou nas últimas 12 semanas.",
  "share.privacy":
    "Ele nunca inclui frequência cardíaca, peso corporal, dados do ciclo, suas academias ou onde elas ficam. O resumo fica no próprio link, então nada é enviado; qualquer pessoa com o link pode ver.",
  "share.withName": "Mostrar meu nome ({name})",
  "share.noName": "Mostrar meu nome (adicione um nos Ajustes do app)",
  "share.yourLink": "Seu link",
  "share.copy": "Copiar link",
  "share.share": "Compartilhar…",
  "share.friends": "Seguir amigos e um feed compartilhado vêm com as contas.",
  "share.broken": "Este link não funciona",
  "share.brokenBody": "Ele pode ter sido cortado ao ser copiado. Peça para seu amigo enviar de novo.",
  "share.try": "Experimente o {brand}",
};

export const ko: Partial<Record<Key, Message>> = {
  "share.title": "공유된 트레이닝 요약",
  "share.anon": "{brand} 사용자",
  "share.weekStreak": "주간 연속 기록",
  "share.badges": "배지",
  "share.last12": "최근 12주",
  "share.bestLifts": "최고 기록(추정 1RM)",
  "share.made": "{date}에 만듦",
  "share.copied": "링크를 복사했어요.",
  "share.copyFail": "복사하지 못했어요. 링크를 선택해서 복사하세요.",
  "share.myTraining": "나의 {brand} 트레이닝",
  "share.intro": "친구에게 트레이닝 요약 링크를 보내세요: 레벨, 운동, 연속 기록, 배지, 최고 기록, 최근 12주 동안 운동한 날.",
  "share.privacy":
    "심박수, 체중, 생리 주기 데이터, 헬스장과 그 위치는 절대 포함되지 않아요. 요약은 링크 자체에 담겨 있어서 아무것도 업로드되지 않고, 링크가 있으면 누구나 볼 수 있어요.",
  "share.withName": "내 이름 표시({name})",
  "share.noName": "내 이름 표시(앱 설정에서 추가하세요)",
  "share.yourLink": "내 링크",
  "share.copy": "링크 복사",
  "share.share": "공유…",
  "share.friends": "친구 팔로우와 공유 피드는 계정이 있으면 쓸 수 있어요.",
  "share.broken": "이 링크는 작동하지 않아요",
  "share.brokenBody": "복사할 때 잘렸을 수 있어요. 친구에게 다시 보내 달라고 하세요.",
  "share.try": "{brand} 써 보기",
};

export const tr: Partial<Record<Key, Message>> = {
  "share.title": "Paylaşılan antrenman özeti",
  "share.anon": "Bir {brand} sporcusu",
  "share.weekStreak": "Haftalık seri",
  "share.badges": "Rozetler",
  "share.last12": "Son 12 hafta",
  "share.bestLifts": "En iyi kaldırışlar (tahmini 1RM)",
  "share.made": "Oluşturulma: {date}",
  "share.copied": "Bağlantı kopyalandı.",
  "share.copyFail": "Kopyalanamadı. Bağlantıyı seçip kopyala.",
  "share.myTraining": "{brand} antrenmanım",
  "share.intro":
    "Arkadaşlarına antrenman özetinin bağlantısını gönder: seviye, antrenmanlar, seri, rozetler, en iyi kaldırışlar ve son 12 haftada antrenman yaptığın günler.",
  "share.privacy":
    "Nabız, vücut ağırlığı, döngü verileri, salonların ya da konumları asla dahil edilmez. Özet bağlantının kendisinde yer alır, yani hiçbir şey yüklenmez; bağlantıya sahip herkes onu görebilir.",
  "share.withName": "Adımı göster ({name})",
  "share.noName": "Adımı göster (uygulamanın Ayarlar bölümünden ekle)",
  "share.yourLink": "Bağlantın",
  "share.copy": "Bağlantıyı kopyala",
  "share.share": "Paylaş…",
  "share.friends": "Arkadaş takibi ve ortak akış hesaplarla gelir.",
  "share.broken": "Bu bağlantı çalışmıyor",
  "share.brokenBody": "Kopyalanırken kesilmiş olabilir. Arkadaşından yeniden göndermesini iste.",
  "share.try": "{brand} uygulamasını dene",
};

export const pl: Partial<Record<Key, Message>> = {
  "share.title": "Udostępnione podsumowanie treningów",
  "share.anon": "Użytkownik {brand}",
  "share.weekStreak": "Passa tygodni",
  "share.badges": "Odznaki",
  "share.last12": "Ostatnie 12 tygodni",
  "share.bestLifts": "Najlepsze wyniki (szacowany 1RM)",
  "share.made": "Utworzono {date}",
  "share.copied": "Link skopiowany.",
  "share.copyFail": "Nie udało się skopiować. Zaznacz link i skopiuj go.",
  "share.myTraining": "Mój trening w {brand}",
  "share.intro":
    "Wyślij znajomym link do podsumowania treningów: poziom, treningi, passa, odznaki, najlepsze wyniki i dni, w które trenowałeś w ostatnich 12 tygodniach.",
  "share.privacy":
    "Nigdy nie zawiera tętna, masy ciała, danych o cyklu, twoich siłowni ani ich położenia. Podsumowanie jest zapisane w samym linku, więc nic nie jest wysyłane; każdy, kto ma link, może je zobaczyć.",
  "share.withName": "Pokaż moje imię ({name})",
  "share.noName": "Pokaż moje imię (dodaj je w Ustawieniach aplikacji)",
  "share.yourLink": "Twój link",
  "share.copy": "Kopiuj link",
  "share.share": "Udostępnij…",
  "share.friends": "Obserwowanie znajomych i wspólny kanał są dostępne z kontem.",
  "share.broken": "Ten link nie działa",
  "share.brokenBody": "Mógł zostać ucięty przy kopiowaniu. Poproś znajomego, żeby wysłał go jeszcze raz.",
  "share.try": "Wypróbuj {brand}",
};
