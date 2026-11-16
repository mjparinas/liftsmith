import type { Message } from "@/lib/i18n";

// Text for keys starting "hr.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "hr.connect": "Connect",
  "hr.connecting": "Connecting…",
  "hr.reconnecting": "Reconnecting…",
  "hr.dismiss": "Dismiss",
  "hr.device": "the monitor",
  "hr.err.bluetoothOff": "Bluetooth is off. Turn it on and try again.",
  "hr.err.blocked": "Bluetooth isn't allowed here. Allow it in your browser or phone settings, then try again.",
  "hr.err.notFound": "No heart rate monitor showed up. Check that it's on, sharing heart rate and close to your phone.",
  "hr.err.lost": "Lost {name}. Tap Connect to try again.",
  "hr.err.unreachable":
    "Couldn't reach {name}. It may be connected to another app or machine: disconnect it there, keep it close, and try again.",
  "hr.err.noService": "{name} doesn't share heart rate the standard way, so it can't connect.",
  "hr.err.pairing": "{name} needs to pair first. Accept the pairing request on the device or your phone, then try again.",
  "hr.err.failed": "Couldn't start heart rate from {name}. Try again in a moment.",
  "hr.tip.reshare":
    "If it connected before, turn sharing off and on again: Google Health app › Connections › your device › Share heart rate.",
  "hr.tip.fitbit":
    "On a Fitbit, turn on sharing first: Google Health app › Connections › your device › Share heart rate › Get started. On a Pixel Watch, use Connected Fitness in quick settings.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "hr.connect": "Conectar",
  "hr.connecting": "Conectando…",
  "hr.reconnecting": "Reconectando…",
  "hr.dismiss": "Cerrar",
  "hr.device": "el pulsómetro",
  "hr.err.bluetoothOff": "El Bluetooth está desactivado. Actívalo y vuelve a intentarlo.",
  "hr.err.blocked": "El Bluetooth no está permitido aquí. Permítelo en los ajustes del navegador o del teléfono y vuelve a intentarlo.",
  "hr.err.notFound":
    "No apareció ningún pulsómetro. Comprueba que esté encendido, compartiendo la frecuencia cardiaca y cerca del teléfono.",
  "hr.err.lost": "Se perdió la conexión con {name}. Toca Conectar para volver a intentarlo.",
  "hr.err.unreachable":
    "No se pudo conectar con {name}. Puede que esté conectado a otra app o máquina: desconéctalo allí, mantenlo cerca y vuelve a intentarlo.",
  "hr.err.noService": "{name} no comparte la frecuencia cardiaca de forma estándar, así que no se puede conectar.",
  "hr.err.pairing":
    "{name} tiene que vincularse primero. Acepta la solicitud de vinculación en el dispositivo o en el teléfono y vuelve a intentarlo.",
  "hr.err.failed": "No se pudo leer la frecuencia cardiaca de {name}. Vuelve a intentarlo en un momento.",
  "hr.tip.reshare":
    "Si ya se conectó antes, desactiva y vuelve a activar el uso compartido: app Google Health › Conexiones › tu dispositivo › Compartir frecuencia cardiaca.",
  "hr.tip.fitbit":
    "En un Fitbit, activa primero el uso compartido: app Google Health › Conexiones › tu dispositivo › Compartir frecuencia cardiaca › Empezar. En un Pixel Watch, usa Connected Fitness en los ajustes rápidos.",
};

export const fr: Partial<Record<Key, Message>> = {
  "hr.connect": "Connecter",
  "hr.connecting": "Connexion…",
  "hr.reconnecting": "Reconnexion…",
  "hr.dismiss": "Fermer",
  "hr.device": "le cardiofréquencemètre",
  "hr.err.bluetoothOff": "Le Bluetooth est désactivé. Activez-le et réessayez.",
  "hr.err.blocked": "Le Bluetooth n'est pas autorisé ici. Autorisez-le dans les réglages du navigateur ou du téléphone, puis réessayez.",
  "hr.err.notFound":
    "Aucun cardiofréquencemètre trouvé. Vérifiez qu'il est allumé, qu'il partage la fréquence cardiaque et qu'il est près du téléphone.",
  "hr.err.lost": "Connexion perdue avec {name}. Touchez Connecter pour réessayer.",
  "hr.err.unreachable":
    "Impossible de joindre {name}. Il est peut-être connecté à une autre app ou machine : déconnectez-le, gardez-le à proximité et réessayez.",
  "hr.err.noService": "{name} ne partage pas la fréquence cardiaque de façon standard, il ne peut donc pas se connecter.",
  "hr.err.pairing": "{name} doit d'abord être associé. Acceptez la demande d'association sur l'appareil ou le téléphone, puis réessayez.",
  "hr.err.failed": "Impossible de lire la fréquence cardiaque de {name}. Réessayez dans un instant.",
  "hr.tip.reshare":
    "S'il s'est déjà connecté, désactivez puis réactivez le partage : app Google Health › Connexions › votre appareil › Partager la fréquence cardiaque.",
  "hr.tip.fitbit":
    "Sur un Fitbit, activez d'abord le partage : app Google Health › Connexions › votre appareil › Partager la fréquence cardiaque › Commencer. Sur une Pixel Watch, utilisez Connected Fitness dans les réglages rapides.",
};

export const de: Partial<Record<Key, Message>> = {
  "hr.connect": "Verbinden",
  "hr.connecting": "Wird verbunden…",
  "hr.reconnecting": "Wird neu verbunden…",
  "hr.dismiss": "Schließen",
  "hr.device": "der Sensor",
  "hr.err.bluetoothOff": "Bluetooth ist aus. Schalte es ein und versuch es noch einmal.",
  "hr.err.blocked":
    "Bluetooth ist hier nicht erlaubt. Erlaube es in den Einstellungen deines Browsers oder Telefons und versuch es dann noch einmal.",
  "hr.err.notFound": "Kein Herzfrequenzsensor gefunden. Prüfe, ob er an ist, die Herzfrequenz teilt und nah an deinem Telefon ist.",
  "hr.err.lost": "Verbindung zu {name} verloren. Tippe auf Verbinden, um es noch einmal zu versuchen.",
  "hr.err.unreachable":
    "{name} ist nicht erreichbar. Vielleicht ist es mit einer anderen App oder einem Gerät verbunden: Trenne es dort, halte es in der Nähe und versuch es noch einmal.",
  "hr.err.noService": "{name} teilt die Herzfrequenz nicht auf dem Standardweg und kann sich deshalb nicht verbinden.",
  "hr.err.pairing":
    "{name} muss zuerst gekoppelt werden. Bestätige die Kopplungsanfrage am Gerät oder Telefon und versuch es dann noch einmal.",
  "hr.err.failed": "Die Herzfrequenz von {name} ließ sich nicht starten. Versuch es gleich noch einmal.",
  "hr.tip.reshare":
    "Wenn es schon einmal verbunden war, schalte das Teilen aus und wieder ein: Google Health-App › Verbindungen › dein Gerät › Herzfrequenz teilen.",
  "hr.tip.fitbit":
    "Schalte bei einem Fitbit zuerst das Teilen ein: Google Health-App › Verbindungen › dein Gerät › Herzfrequenz teilen › Los geht’s. Auf einer Pixel Watch nutze Connected Fitness in den Schnelleinstellungen.",
};

export const it: Partial<Record<Key, Message>> = {
  "hr.connect": "Collega",
  "hr.connecting": "Collegamento…",
  "hr.reconnecting": "Ricollegamento…",
  "hr.dismiss": "Ignora",
  "hr.device": "il sensore",
  "hr.err.bluetoothOff": "Il Bluetooth è spento. Accendilo e riprova.",
  "hr.err.blocked": "Il Bluetooth non è consentito qui. Consentilo nelle impostazioni del browser o del telefono, poi riprova.",
  "hr.err.notFound":
    "Nessun cardiofrequenzimetro trovato. Controlla che sia acceso, che condivida la frequenza cardiaca e che sia vicino al telefono.",
  "hr.err.lost": "Persa la connessione con {name}. Tocca Collega per riprovare.",
  "hr.err.unreachable":
    "Impossibile raggiungere {name}. Potrebbe essere collegato a un’altra app o macchina: scollegalo lì, tienilo vicino e riprova.",
  "hr.err.noService": "{name} non condivide la frequenza cardiaca nel modo standard, quindi non può collegarsi.",
  "hr.err.pairing": "{name} deve prima essere associato. Accetta la richiesta di associazione sul dispositivo o sul telefono, poi riprova.",
  "hr.err.failed": "Impossibile avviare la frequenza cardiaca da {name}. Riprova tra poco.",
  "hr.tip.reshare":
    "Se si era già collegato, disattiva e riattiva la condivisione: app Google Health › Connessioni › il tuo dispositivo › Condividi frequenza cardiaca.",
  "hr.tip.fitbit":
    "Su un Fitbit attiva prima la condivisione: app Google Health › Connessioni › il tuo dispositivo › Condividi frequenza cardiaca › Inizia. Su un Pixel Watch usa Connected Fitness nelle impostazioni rapide.",
};

export const ja: Partial<Record<Key, Message>> = {
  "hr.connect": "接続",
  "hr.connecting": "接続中…",
  "hr.reconnecting": "再接続中…",
  "hr.dismiss": "閉じる",
  "hr.device": "心拍計",
  "hr.err.bluetoothOff": "Bluetooth がオフです。オンにしてもう一度お試しください。",
  "hr.err.blocked": "ここでは Bluetooth が許可されていません。ブラウザか端末の設定で許可してから、もう一度お試しください。",
  "hr.err.notFound": "心拍計が見つかりません。電源が入っていて、心拍数を共有していて、端末の近くにあるか確認してください。",
  "hr.err.lost": "{name}との接続が切れました。「接続」をタップしてもう一度お試しください。",
  "hr.err.unreachable":
    "{name}に接続できません。別のアプリや機器につながっている可能性があります。そちらで切断し、近くに置いてもう一度お試しください。",
  "hr.err.noService": "{name}は標準の方法で心拍数を共有しないため、接続できません。",
  "hr.err.pairing": "{name}は先にペアリングが必要です。機器か端末でペアリングを許可してから、もう一度お試しください。",
  "hr.err.failed": "{name}から心拍数を取得できませんでした。少ししてからもう一度お試しください。",
  "hr.tip.reshare":
    "以前は接続できていた場合は、共有をオフにしてからオンに戻してください：Google Health アプリ › 接続 › お使いの端末 › 心拍数を共有。",
  "hr.tip.fitbit":
    "Fitbit では、まず共有をオンにしてください：Google Health アプリ › 接続 › お使いの端末 › 心拍数を共有 › 開始。Pixel Watch ではクイック設定の Connected Fitness を使ってください。",
};

export const pt: Partial<Record<Key, Message>> = {
  "hr.connect": "Conectar",
  "hr.connecting": "Conectando…",
  "hr.reconnecting": "Reconectando…",
  "hr.dismiss": "Dispensar",
  "hr.device": "o monitor",
  "hr.err.bluetoothOff": "O Bluetooth está desligado. Ligue e tente de novo.",
  "hr.err.blocked": "O Bluetooth não está permitido aqui. Permita nos ajustes do navegador ou do celular e tente de novo.",
  "hr.err.notFound":
    "Nenhum monitor cardíaco apareceu. Confira se ele está ligado, compartilhando a frequência cardíaca e perto do celular.",
  "hr.err.lost": "Conexão com {name} perdida. Toque em Conectar para tentar de novo.",
  "hr.err.unreachable":
    "Não foi possível alcançar {name}. Ele pode estar conectado a outro app ou aparelho: desconecte lá, mantenha perto e tente de novo.",
  "hr.err.noService": "{name} não compartilha a frequência cardíaca do jeito padrão, então não dá para conectar.",
  "hr.err.pairing": "{name} precisa ser pareado primeiro. Aceite o pedido de pareamento no aparelho ou no celular e tente de novo.",
  "hr.err.failed": "Não foi possível iniciar a frequência cardíaca de {name}. Tente de novo daqui a pouco.",
  "hr.tip.reshare":
    "Se já conectou antes, desligue e ligue o compartilhamento de novo: app Google Health › Conexões › seu aparelho › Compartilhar frequência cardíaca.",
  "hr.tip.fitbit":
    "Num Fitbit, ative o compartilhamento primeiro: app Google Health › Conexões › seu aparelho › Compartilhar frequência cardíaca › Começar. Num Pixel Watch, use Connected Fitness nas configurações rápidas.",
};

export const ko: Partial<Record<Key, Message>> = {
  "hr.connect": "연결",
  "hr.connecting": "연결하는 중…",
  "hr.reconnecting": "다시 연결하는 중…",
  "hr.dismiss": "닫기",
  "hr.device": "심박 모니터",
  "hr.err.bluetoothOff": "Bluetooth가 꺼져 있어요. 켜고 다시 시도하세요.",
  "hr.err.blocked": "여기서는 Bluetooth가 허용되지 않아요. 브라우저나 휴대폰 설정에서 허용한 다음 다시 시도하세요.",
  "hr.err.notFound": "심박 모니터를 찾지 못했어요. 켜져 있는지, 심박수를 공유하는지, 휴대폰 가까이에 있는지 확인하세요.",
  "hr.err.lost": "{name} 연결이 끊겼어요. 연결을 탭해서 다시 시도하세요.",
  "hr.err.unreachable":
    "{name}에 연결하지 못했어요. 다른 앱이나 기기에 연결돼 있을 수 있어요. 거기서 연결을 끊고 가까이 둔 다음 다시 시도하세요.",
  "hr.err.noService": "{name}은(는) 표준 방식으로 심박수를 공유하지 않아서 연결할 수 없어요.",
  "hr.err.pairing": "{name}을(를) 먼저 페어링해야 해요. 기기나 휴대폰에서 페어링 요청을 수락한 다음 다시 시도하세요.",
  "hr.err.failed": "{name}에서 심박수를 시작하지 못했어요. 잠시 후 다시 시도하세요.",
  "hr.tip.reshare": "전에 연결된 적이 있다면 공유를 껐다가 다시 켜세요: Google Health 앱 › 연결 › 내 기기 › 심박수 공유.",
  "hr.tip.fitbit":
    "Fitbit에서는 먼저 공유를 켜세요: Google Health 앱 › 연결 › 내 기기 › 심박수 공유 › 시작하기. Pixel Watch에서는 빠른 설정의 연결된 피트니스를 사용하세요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "hr.connect": "Bağlan",
  "hr.connecting": "Bağlanıyor…",
  "hr.reconnecting": "Yeniden bağlanıyor…",
  "hr.dismiss": "Kapat",
  "hr.device": "nabız ölçer",
  "hr.err.bluetoothOff": "Bluetooth kapalı. Aç ve tekrar dene.",
  "hr.err.blocked": "Burada Bluetooth'a izin verilmiyor. Tarayıcı ya da telefon ayarlarından izin ver, sonra tekrar dene.",
  "hr.err.notFound": "Hiç nabız ölçer görünmedi. Açık olduğundan, nabzı paylaştığından ve telefonuna yakın olduğundan emin ol.",
  "hr.err.lost": "{name} bağlantısı koptu. Tekrar denemek için Bağlan'a dokun.",
  "hr.err.unreachable":
    "{name} cihazına ulaşılamadı. Başka bir uygulamaya ya da makineye bağlı olabilir: oradan bağlantısını kes, yakında tut ve tekrar dene.",
  "hr.err.noService": "{name} nabzı standart yolla paylaşmıyor, bu yüzden bağlanamıyor.",
  "hr.err.pairing": "{name} önce eşleşmeli. Cihazda ya da telefonunda eşleme isteğini kabul et, sonra tekrar dene.",
  "hr.err.failed": "{name} cihazından nabız başlatılamadı. Birazdan tekrar dene.",
  "hr.tip.reshare": "Daha önce bağlandıysa paylaşımı kapatıp tekrar aç: Google Health uygulaması › Bağlantılar › cihazın › Nabzı paylaş.",
  "hr.tip.fitbit":
    "Fitbit'te önce paylaşımı aç: Google Health uygulaması › Bağlantılar › cihazın › Nabzı paylaş › Başla. Pixel Watch'ta hızlı ayarlardaki Connected Fitness'ı kullan.",
};

export const pl: Partial<Record<Key, Message>> = {
  "hr.connect": "Połącz",
  "hr.connecting": "Łączenie…",
  "hr.reconnecting": "Ponowne łączenie…",
  "hr.dismiss": "Zamknij",
  "hr.device": "pulsometr",
  "hr.err.bluetoothOff": "Bluetooth jest wyłączony. Włącz go i spróbuj ponownie.",
  "hr.err.blocked": "Bluetooth nie jest tu dozwolony. Zezwól na niego w ustawieniach przeglądarki lub telefonu i spróbuj ponownie.",
  "hr.err.notFound": "Nie znaleziono pulsometru. Sprawdź, czy jest włączony, udostępnia tętno i jest blisko telefonu.",
  "hr.err.lost": "Utracono połączenie: {name}. Stuknij Połącz, żeby spróbować ponownie.",
  "hr.err.unreachable":
    "Brak połączenia: {name}. Może być połączony z inną aplikacją lub maszyną: rozłącz go tam, trzymaj blisko i spróbuj ponownie.",
  "hr.err.noService": "{name}: urządzenie nie udostępnia tętna w standardowy sposób, więc nie można się połączyć.",
  "hr.err.pairing": "{name}: najpierw trzeba sparować. Zaakceptuj prośbę o parowanie na urządzeniu lub telefonie i spróbuj ponownie.",
  "hr.err.failed": "Nie udało się uruchomić odczytu tętna: {name}. Spróbuj ponownie za chwilę.",
  "hr.tip.reshare":
    "Jeśli wcześniej działało, wyłącz i włącz udostępnianie: aplikacja Google Health › Połączenia › twoje urządzenie › Udostępniaj tętno.",
  "hr.tip.fitbit":
    "Na Fitbicie najpierw włącz udostępnianie: aplikacja Google Health › Połączenia › twoje urządzenie › Udostępniaj tętno › Rozpocznij. Na Pixel Watch użyj Connected Fitness w szybkich ustawieniach.",
};
