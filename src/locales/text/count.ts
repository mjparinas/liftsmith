import type { Message } from "@/lib/i18n";

// Text for keys starting "count.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "count.toggle": "Count reps with the camera",
  "count.start": "Count reps",
  "count.reps": "reps",
  "count.stop": "Stop",
  "count.off": "Stop counting reps",
  "count.opening": "Opening the camera…",
  "count.loading": "Getting the rep counter ready (first time only)…",
  "count.position": "Stand side-on with your whole body in the camera view.",
  "count.counting": "Counting. Your reps fill in Log set.",
  "count.resting": "Resting. Counting starts again with your next set.",
  "count.flipToBack": "Use the back camera",
  "count.flipToFront": "Use the front camera",
  "count.useMotion": "Use phone motion",
  "count.useCamera": "Use the camera",
  "count.err.denied": "Camera access is off. Allow it in your phone's settings for Liftsmith to count reps.",
  "count.err.noCamera": "No camera found for this.",
  "count.err.model": "Couldn't start the rep counter. Check your connection for the first run and try again.",
  "count.err.motion": "Motion access was declined, so reps can't be counted from the phone.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "count.toggle": "Contar repeticiones con la cámara",
  "count.start": "Contar reps",
  "count.reps": "reps",
  "count.stop": "Parar",
  "count.off": "Dejar de contar repeticiones",
  "count.opening": "Abriendo la cámara…",
  "count.loading": "Preparando el contador de repeticiones (solo la primera vez)…",
  "count.position": "Ponte de lado, con todo el cuerpo en la vista de la cámara.",
  "count.counting": "Contando. Tus repeticiones se rellenan en Registrar serie.",
  "count.resting": "Descansando. El conteo vuelve a empezar con tu próxima serie.",
  "count.flipToBack": "Usar la cámara trasera",
  "count.flipToFront": "Usar la cámara frontal",
  "count.useMotion": "Usar el movimiento del teléfono",
  "count.useCamera": "Usar la cámara",
  "count.err.denied":
    "El acceso a la cámara está desactivado. Permítelo en los ajustes del teléfono para que Liftsmith cuente tus repeticiones.",
  "count.err.noCamera": "No se encontró una cámara para esto.",
  "count.err.model": "No se pudo iniciar el contador. Revisa tu conexión la primera vez e inténtalo de nuevo.",
  "count.err.motion": "Se rechazó el acceso al movimiento, así que no se pueden contar repeticiones con el teléfono.",
};

export const fr: Partial<Record<Key, Message>> = {
  "count.toggle": "Compter les répétitions avec la caméra",
  "count.start": "Compter",
  "count.reps": "rép.",
  "count.stop": "Arrêter",
  "count.off": "Arrêter de compter les répétitions",
  "count.opening": "Ouverture de la caméra…",
  "count.loading": "Préparation du compteur de répétitions (la première fois seulement)…",
  "count.position": "Placez-vous de profil, tout le corps dans la vue de la caméra.",
  "count.counting": "Comptage en cours. Vos répétitions s’inscrivent dans Valider la série.",
  "count.resting": "Repos. Le comptage reprend à la prochaine série.",
  "count.flipToBack": "Utiliser la caméra arrière",
  "count.flipToFront": "Utiliser la caméra avant",
  "count.useMotion": "Utiliser les mouvements du téléphone",
  "count.useCamera": "Utiliser la caméra",
  "count.err.denied":
    "L’accès à la caméra est désactivé. Autorisez-le dans les réglages du téléphone pour que Liftsmith compte vos répétitions.",
  "count.err.noCamera": "Aucune caméra trouvée pour cela.",
  "count.err.model": "Impossible de lancer le compteur. Vérifiez votre connexion la première fois et réessayez.",
  "count.err.motion": "L’accès aux mouvements a été refusé, les répétitions ne peuvent donc pas être comptées avec le téléphone.",
};

export const de: Partial<Record<Key, Message>> = {
  "count.toggle": "Wiederholungen mit der Kamera zählen",
  "count.start": "Wdh. zählen",
  "count.reps": "Wdh.",
  "count.stop": "Stopp",
  "count.off": "Wiederholungen nicht mehr zählen",
  "count.opening": "Kamera wird geöffnet…",
  "count.loading": "Der Wiederholungszähler wird vorbereitet (nur beim ersten Mal)…",
  "count.position": "Stell dich seitlich hin, mit dem ganzen Körper im Kamerabild.",
  "count.counting": "Zählt. Deine Wiederholungen landen in Satz eintragen.",
  "count.resting": "Pause. Das Zählen beginnt mit deinem nächsten Satz wieder.",
  "count.flipToBack": "Rückkamera verwenden",
  "count.flipToFront": "Frontkamera verwenden",
  "count.useMotion": "Bewegungssensor des Telefons verwenden",
  "count.useCamera": "Kamera verwenden",
  "count.err.denied":
    "Der Kamerazugriff ist aus. Erlaube ihn in den Einstellungen deines Telefons, damit Liftsmith Wiederholungen zählen kann.",
  "count.err.noCamera": "Dafür wurde keine Kamera gefunden.",
  "count.err.model": "Der Wiederholungszähler ließ sich nicht starten. Prüfe beim ersten Mal deine Verbindung und versuch es noch einmal.",
  "count.err.motion": "Der Bewegungszugriff wurde abgelehnt, deshalb können Wiederholungen nicht über das Telefon gezählt werden.",
};

export const it: Partial<Record<Key, Message>> = {
  "count.toggle": "Conta le ripetizioni con la fotocamera",
  "count.start": "Conta ripetizioni",
  "count.reps": "rip.",
  "count.stop": "Stop",
  "count.off": "Smetti di contare le ripetizioni",
  "count.opening": "Apertura della fotocamera…",
  "count.loading": "Preparazione del contaripetizioni (solo la prima volta)…",
  "count.position": "Mettiti di lato, con tutto il corpo nell'inquadratura della fotocamera.",
  "count.counting": "Sto contando. Le ripetizioni compaiono in Registra serie.",
  "count.resting": "Riposo. Il conteggio riparte con la prossima serie.",
  "count.flipToBack": "Usa la fotocamera posteriore",
  "count.flipToFront": "Usa la fotocamera anteriore",
  "count.useMotion": "Usa il movimento del telefono",
  "count.useCamera": "Usa la fotocamera",
  "count.err.denied":
    "L’accesso alla fotocamera è disattivato. Consentilo nelle impostazioni del telefono perché Liftsmith possa contare le ripetizioni.",
  "count.err.noCamera": "Nessuna fotocamera trovata per questo.",
  "count.err.model": "Impossibile avviare il contaripetizioni. Al primo avvio controlla la connessione e riprova.",
  "count.err.motion": "L’accesso al movimento è stato negato, quindi le ripetizioni non si possono contare dal telefono.",
};

export const ja: Partial<Record<Key, Message>> = {
  "count.toggle": "カメラでレップを数える",
  "count.start": "レップを数える",
  "count.reps": "回",
  "count.stop": "停止",
  "count.off": "レップのカウントを止める",
  "count.opening": "カメラを起動しています…",
  "count.loading": "レップカウンターを準備しています（初回のみ）…",
  "count.position": "横向きに立ち、カメラの映像に全身が入るようにしてください。",
  "count.counting": "カウント中。レップ数は「セットを記録」に入ります。",
  "count.resting": "休憩中。次のセットでカウントを再開します。",
  "count.flipToBack": "背面カメラを使う",
  "count.flipToFront": "前面カメラを使う",
  "count.useMotion": "端末のモーションを使う",
  "count.useCamera": "カメラを使う",
  "count.err.denied": "カメラへのアクセスがオフです。Liftsmith がレップを数えられるよう、端末の設定で許可してください。",
  "count.err.noCamera": "使えるカメラが見つかりません。",
  "count.err.model": "レップカウンターを起動できませんでした。初回は通信状態を確認して、もう一度お試しください。",
  "count.err.motion": "モーションへのアクセスが拒否されたため、端末でレップを数えられません。",
};
