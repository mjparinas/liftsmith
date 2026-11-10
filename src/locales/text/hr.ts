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
