import type { Message } from "@/lib/i18n";

// Text for keys starting "now.", in every language: the Now playing control (src/lib/nowPlaying.ts,
// NowPlaying.tsx; docs/decisions/now-playing.md).

export const en = {
  "now.title": "Now playing",
  "now.playing": "Music playing",
  "now.paused": "Music paused",
  "now.play": "Play",
  "now.pause": "Pause",
  "now.next": "Next song",
  "now.previous": "Previous song",
  "now.setting": "Music controls",
  "now.hint": "Play, pause and skip your music app's songs from Today and during a workout.",
  "now.hintIos": "Play, pause and skip Apple Music from Today and during a workout. Apple doesn't let apps control other music apps.",
  "now.names":
    "To show the song and the app playing it, Android asks you to allow notification access for Liftsmith. It's only used to read what's playing, on this phone.",
  "now.allow": "Show song names",
  "now.namesIos": "Allow Apple Music so Liftsmith can show the song and control it.",
  "now.allowIos": "Allow Apple Music",
  "now.settingsIos": "Open Settings",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "now.title": "Reproduciendo",
  "now.playing": "Suena música",
  "now.paused": "Música en pausa",
  "now.play": "Reproducir",
  "now.pause": "Pausar",
  "now.next": "Siguiente canción",
  "now.previous": "Canción anterior",
  "now.setting": "Controles de música",
  "now.hint": "Reproduce, pausa y salta canciones de tu app de música desde Hoy y durante el entrenamiento.",
  "now.hintIos":
    "Reproduce, pausa y salta canciones de Apple Music desde Hoy y durante el entrenamiento. Apple no deja que las apps controlen otras apps de música.",
  "now.names":
    "Para mostrar la canción y la app que la reproduce, Android te pide permitir el acceso a las notificaciones para Liftsmith. Solo se usa para leer lo que suena, en este teléfono.",
  "now.allow": "Mostrar nombres de canciones",
  "now.namesIos": "Permite Apple Music para que Liftsmith muestre la canción y la controle.",
  "now.allowIos": "Permitir Apple Music",
  "now.settingsIos": "Abrir Ajustes",
};

export const fr: Partial<Record<Key, Message>> = {
  "now.title": "En cours de lecture",
  "now.playing": "Musique en cours",
  "now.paused": "Musique en pause",
  "now.play": "Lire",
  "now.pause": "Pause",
  "now.next": "Morceau suivant",
  "now.previous": "Morceau précédent",
  "now.setting": "Commandes de musique",
  "now.hint": "Lisez, mettez en pause et passez les morceaux de votre app de musique depuis Aujourd’hui et pendant la séance.",
  "now.hintIos":
    "Lisez, mettez en pause et passez les morceaux d’Apple Music depuis Aujourd’hui et pendant la séance. Apple ne permet pas aux apps de contrôler d’autres apps de musique.",
  "now.names":
    "Pour afficher le morceau et l’app qui le joue, Android vous demande d’autoriser l’accès aux notifications pour Liftsmith. Il sert seulement à lire ce qui joue, sur ce téléphone.",
  "now.allow": "Afficher les titres",
  "now.namesIos": "Autorisez Apple Music pour que Liftsmith affiche le morceau et le contrôle.",
  "now.allowIos": "Autoriser Apple Music",
  "now.settingsIos": "Ouvrir les Réglages",
};

export const de: Partial<Record<Key, Message>> = {
  "now.title": "Läuft gerade",
  "now.playing": "Musik läuft",
  "now.paused": "Musik pausiert",
  "now.play": "Abspielen",
  "now.pause": "Pausieren",
  "now.next": "Nächster Song",
  "now.previous": "Vorheriger Song",
  "now.setting": "Musiksteuerung",
  "now.hint": "Spiele, pausiere und überspringe Songs deiner Musik-App auf Heute und während des Trainings.",
  "now.hintIos":
    "Spiele, pausiere und überspringe Apple Music auf Heute und während des Trainings. Apple lässt Apps keine anderen Musik-Apps steuern.",
  "now.names":
    "Damit der Song und die App angezeigt werden, fragt Android nach Zugriff auf Benachrichtigungen für Liftsmith. Er wird nur genutzt, um zu lesen, was läuft, auf diesem Handy.",
  "now.allow": "Songtitel anzeigen",
  "now.namesIos": "Erlaube Apple Music, damit Liftsmith den Song anzeigen und steuern kann.",
  "now.allowIos": "Apple Music erlauben",
  "now.settingsIos": "Einstellungen öffnen",
};

export const it: Partial<Record<Key, Message>> = {
  "now.title": "In riproduzione",
  "now.playing": "Musica in riproduzione",
  "now.paused": "Musica in pausa",
  "now.play": "Riproduci",
  "now.pause": "Pausa",
  "now.next": "Brano successivo",
  "now.previous": "Brano precedente",
  "now.setting": "Controlli musica",
  "now.hint": "Riproduci, metti in pausa e salta i brani della tua app di musica da Oggi e durante l’allenamento.",
  "now.hintIos":
    "Riproduci, metti in pausa e salta Apple Music da Oggi e durante l’allenamento. Apple non permette alle app di controllare altre app di musica.",
  "now.names":
    "Per mostrare il brano e l’app che lo riproduce, Android ti chiede di consentire l’accesso alle notifiche per Liftsmith. Serve solo a leggere cosa suona, su questo telefono.",
  "now.allow": "Mostra i titoli",
  "now.namesIos": "Consenti Apple Music perché Liftsmith possa mostrare il brano e controllarlo.",
  "now.allowIos": "Consenti Apple Music",
  "now.settingsIos": "Apri Impostazioni",
};

export const ja: Partial<Record<Key, Message>> = {
  "now.title": "再生中",
  "now.playing": "音楽を再生中",
  "now.paused": "音楽を一時停止中",
  "now.play": "再生",
  "now.pause": "一時停止",
  "now.next": "次の曲",
  "now.previous": "前の曲",
  "now.setting": "音楽コントロール",
  "now.hint": "今日の画面とワークアウト中に、音楽アプリの曲を再生、一時停止、スキップできます。",
  "now.hintIos":
    "今日の画面とワークアウト中に、Apple Musicを再生、一時停止、スキップできます。Appleは他の音楽アプリの操作をアプリに許可していません。",
  "now.names":
    "曲名と再生中のアプリを表示するには、AndroidでLiftsmithに通知へのアクセスを許可してください。このスマホで再生中の曲を読むためだけに使います。",
  "now.allow": "曲名を表示",
  "now.namesIos": "Apple Musicを許可すると、Liftsmithで曲を表示して操作できます。",
  "now.allowIos": "Apple Musicを許可",
  "now.settingsIos": "設定を開く",
};

export const pt: Partial<Record<Key, Message>> = {
  "now.title": "Tocando agora",
  "now.playing": "Música tocando",
  "now.paused": "Música pausada",
  "now.play": "Tocar",
  "now.pause": "Pausar",
  "now.next": "Próxima música",
  "now.previous": "Música anterior",
  "now.setting": "Controles de música",
  "now.hint": "Toque, pause e pule as músicas do seu app de música em Hoje e durante o treino.",
  "now.hintIos":
    "Toque, pause e pule músicas do Apple Music em Hoje e durante o treino. A Apple não deixa apps controlarem outros apps de música.",
  "now.names":
    "Para mostrar a música e o app que está tocando, o Android pede que você permita o acesso às notificações para o Liftsmith. Ele só é usado para ler o que está tocando, neste celular.",
  "now.allow": "Mostrar nomes das músicas",
  "now.namesIos": "Permita o Apple Music para o Liftsmith mostrar a música e controlá-la.",
  "now.allowIos": "Permitir Apple Music",
  "now.settingsIos": "Abrir Ajustes",
};

export const ko: Partial<Record<Key, Message>> = {
  "now.title": "재생 중",
  "now.playing": "음악 재생 중",
  "now.paused": "음악 일시 정지됨",
  "now.play": "재생",
  "now.pause": "일시 정지",
  "now.next": "다음 곡",
  "now.previous": "이전 곡",
  "now.setting": "음악 컨트롤",
  "now.hint": "오늘 화면과 운동 중에 음악 앱의 곡을 재생, 일시 정지, 건너뛸 수 있어요.",
  "now.hintIos":
    "오늘 화면과 운동 중에 Apple Music을 재생, 일시 정지, 건너뛸 수 있어요. Apple은 앱이 다른 음악 앱을 제어하는 것을 허용하지 않아요.",
  "now.names":
    "곡과 재생 중인 앱을 표시하려면 Android에서 Liftsmith의 알림 접근을 허용해야 해요. 이 휴대폰에서 재생 중인 곡을 읽는 데만 써요.",
  "now.allow": "곡 이름 표시",
  "now.namesIos": "Apple Music을 허용하면 Liftsmith가 곡을 표시하고 제어할 수 있어요.",
  "now.allowIos": "Apple Music 허용",
  "now.settingsIos": "설정 열기",
};

export const tr: Partial<Record<Key, Message>> = {
  "now.title": "Şimdi çalıyor",
  "now.playing": "Müzik çalıyor",
  "now.paused": "Müzik duraklatıldı",
  "now.play": "Oynat",
  "now.pause": "Duraklat",
  "now.next": "Sonraki şarkı",
  "now.previous": "Önceki şarkı",
  "now.setting": "Müzik kontrolleri",
  "now.hint": "Müzik uygulamandaki şarkıları Bugün'den ve antrenman sırasında oynat, duraklat ve geç.",
  "now.hintIos":
    "Apple Music'i Bugün'den ve antrenman sırasında oynat, duraklat ve geç. Apple, uygulamaların başka müzik uygulamalarını kontrol etmesine izin vermiyor.",
  "now.names":
    "Şarkıyı ve onu çalan uygulamayı göstermek için Android, Liftsmith'e bildirim erişimi vermeni ister. Sadece bu telefonda neyin çaldığını okumak için kullanılır.",
  "now.allow": "Şarkı adlarını göster",
  "now.namesIos": "Liftsmith'in şarkıyı gösterip kontrol edebilmesi için Apple Music'e izin ver.",
  "now.allowIos": "Apple Music'e izin ver",
  "now.settingsIos": "Ayarlar'ı aç",
};

export const pl: Partial<Record<Key, Message>> = {
  "now.title": "Teraz gra",
  "now.playing": "Muzyka gra",
  "now.paused": "Muzyka wstrzymana",
  "now.play": "Odtwórz",
  "now.pause": "Pauza",
  "now.next": "Następny utwór",
  "now.previous": "Poprzedni utwór",
  "now.setting": "Sterowanie muzyką",
  "now.hint": "Odtwarzaj, pauzuj i przewijaj utwory z aplikacji muzycznej z ekranu Dziś i podczas treningu.",
  "now.hintIos":
    "Odtwarzaj, pauzuj i przewijaj Apple Music z ekranu Dziś i podczas treningu. Apple nie pozwala aplikacjom sterować innymi aplikacjami muzycznymi.",
  "now.names":
    "Żeby pokazać utwór i aplikację, która go odtwarza, Android prosi o dostęp do powiadomień dla Liftsmith. Służy tylko do odczytu tego, co gra, na tym telefonie.",
  "now.allow": "Pokazuj nazwy utworów",
  "now.namesIos": "Zezwól na Apple Music, żeby Liftsmith mógł pokazać utwór i nim sterować.",
  "now.allowIos": "Zezwól na Apple Music",
  "now.settingsIos": "Otwórz Ustawienia",
};
