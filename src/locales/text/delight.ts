import type { Message } from "@/lib/i18n";

// Text for keys starting "delight.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "delight.voice": "Voice coach",
  "delight.voiceHint":
    "Spoken cues between sets: the next weight and reps, the last set, ten seconds left, and new bests. Music dips while it talks.",
  "delight.ghost": "Ghost mode",
  "delight.ghostHint": "Race your last session of each exercise: its weights, reps and rests show on the rest timer.",
  "delight.plates": "Smart plate memory",
  "delight.platesHint": "Between sets, show only the plates to add or take off.",
  "delight.rest": "While you rest",
  "delight.breathe": "Breathing guide",
  "delight.game": "Plate math game",
  "delight.neither": "Neither",
  "delight.themes": "Themes",
  "delight.lightNote": "With Appearance set to light, a theme changes the accent colour only.",
  "delight.icon": "App icon",
  "delight.iconLocked": "{name}: {how} to unlock.",
  "delight.iconDone": "Done. On Android the home screen updates once you leave the app.",
  "delight.iconFailed": "Couldn't change the icon on this phone.",
  "delight.classic": "Classic",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "delight.voice": "Entrenador por voz",
  "delight.voiceHint":
    "Indicaciones habladas entre series: el siguiente peso y repeticiones, la última serie, los últimos diez segundos y los nuevos récords. La música baja mientras habla.",
  "delight.ghost": "Modo fantasma",
  "delight.ghostHint": "Compite con tu última sesión de cada ejercicio: sus pesos, repeticiones y descansos aparecen en el temporizador.",
  "delight.plates": "Memoria de discos",
  "delight.platesHint": "Entre series, muestra solo los discos que hay que poner o quitar.",
  "delight.rest": "Mientras descansas",
  "delight.breathe": "Guía de respiración",
  "delight.game": "Juego de cálculo de discos",
  "delight.neither": "Ninguno",
  "delight.themes": "Temas",
  "delight.lightNote": "Con la apariencia en claro, un tema solo cambia el color de acento.",
  "delight.icon": "Icono de la app",
  "delight.iconLocked": "{name}: {how} para desbloquearlo.",
  "delight.iconDone": "Hecho. En Android, la pantalla de inicio se actualiza al salir de la app.",
  "delight.iconFailed": "No se pudo cambiar el icono en este teléfono.",
  "delight.classic": "Clásico",
};

export const fr: Partial<Record<Key, Message>> = {
  "delight.voice": "Coach vocal",
  "delight.voiceHint":
    "Des indications parlées entre les séries : le prochain poids et les répétitions, la dernière série, les dix dernières secondes et les nouveaux records. La musique baisse pendant qu’il parle.",
  "delight.ghost": "Mode fantôme",
  "delight.ghostHint": "Affrontez votre dernière séance de chaque exercice : ses poids, répétitions et repos s’affichent sur le minuteur.",
  "delight.plates": "Mémoire des disques",
  "delight.platesHint": "Entre les séries, n’affiche que les disques à ajouter ou à retirer.",
  "delight.rest": "Pendant le repos",
  "delight.breathe": "Guide de respiration",
  "delight.game": "Jeu de calcul des disques",
  "delight.neither": "Aucun",
  "delight.themes": "Thèmes",
  "delight.lightNote": "Avec l’apparence en clair, un thème ne change que la couleur d’accent.",
  "delight.icon": "Icône de l’app",
  "delight.iconLocked": "{name} : {how} pour la débloquer.",
  "delight.iconDone": "C’est fait. Sur Android, l’écran d’accueil se met à jour quand vous quittez l’app.",
  "delight.iconFailed": "Impossible de changer l’icône sur ce téléphone.",
  "delight.classic": "Classique",
};

export const de: Partial<Record<Key, Message>> = {
  "delight.voice": "Sprachcoach",
  "delight.voiceHint":
    "Gesprochene Hinweise zwischen den Sätzen: das nächste Gewicht und die Wiederholungen, der letzte Satz, zehn Sekunden übrig und neue Bestleistungen. Die Musik wird leiser, während er spricht.",
  "delight.ghost": "Geistermodus",
  "delight.ghostHint":
    "Tritt gegen deine letzte Einheit jeder Übung an: Ihre Gewichte, Wiederholungen und Pausen erscheinen am Pausentimer.",
  "delight.plates": "Schlaues Scheiben-Gedächtnis",
  "delight.platesHint": "Zeigt zwischen den Sätzen nur die Scheiben, die du auflegen oder abnehmen musst.",
  "delight.rest": "Während der Pause",
  "delight.breathe": "Atemführung",
  "delight.game": "Scheiben-Rechenspiel",
  "delight.neither": "Keins",
  "delight.themes": "Designs",
  "delight.lightNote": "Wenn das Erscheinungsbild auf Hell steht, ändert ein Design nur die Akzentfarbe.",
  "delight.icon": "App-Symbol",
  "delight.iconLocked": "{name}: {how}, um es freizuschalten.",
  "delight.iconDone": "Erledigt. Unter Android aktualisiert sich der Startbildschirm, sobald du die App verlässt.",
  "delight.iconFailed": "Das Symbol ließ sich auf diesem Telefon nicht ändern.",
  "delight.classic": "Klassisch",
};

export const it: Partial<Record<Key, Message>> = {
  "delight.voice": "Coach vocale",
  "delight.voiceHint":
    "Indicazioni a voce tra le serie: il prossimo peso e le ripetizioni, l’ultima serie, dieci secondi alla fine e i nuovi record. La musica si abbassa mentre parla.",
  "delight.ghost": "Modalità fantasma",
  "delight.ghostHint": "Sfida l’ultima seduta di ogni esercizio: pesi, ripetizioni e riposi compaiono sul timer di riposo.",
  "delight.plates": "Memoria dischi intelligente",
  "delight.platesHint": "Tra le serie mostra solo i dischi da aggiungere o togliere.",
  "delight.rest": "Mentre riposi",
  "delight.breathe": "Guida al respiro",
  "delight.game": "Gioco del calcolo dischi",
  "delight.neither": "Nessuno",
  "delight.themes": "Temi",
  "delight.lightNote": "Con l’aspetto chiaro, un tema cambia solo il colore d’accento.",
  "delight.icon": "Icona dell’app",
  "delight.iconLocked": "{name}: {how} per sbloccarla.",
  "delight.iconDone": "Fatto. Su Android la schermata Home si aggiorna quando esci dall’app.",
  "delight.iconFailed": "Non è stato possibile cambiare l’icona su questo telefono.",
  "delight.classic": "Classica",
};

export const ja: Partial<Record<Key, Message>> = {
  "delight.voice": "音声コーチ",
  "delight.voiceHint":
    "セット間の音声ガイド：次の重量とレップ数、最後のセット、残り10秒、自己ベスト。話している間は音楽の音量が下がります。",
  "delight.ghost": "ゴーストモード",
  "delight.ghostHint": "各種目の前回の自分と競争。前回の重量、レップ数、休憩が休憩タイマーに表示されます。",
  "delight.plates": "スマートプレートメモリー",
  "delight.platesHint": "セット間に、付け外しが必要なプレートだけを表示します。",
  "delight.rest": "休憩中に",
  "delight.breathe": "呼吸ガイド",
  "delight.game": "プレート計算ゲーム",
  "delight.neither": "なし",
  "delight.themes": "テーマ",
  "delight.lightNote": "外観がライトのときは、テーマはアクセントカラーだけを変えます。",
  "delight.icon": "アプリアイコン",
  "delight.iconLocked": "{name}：解除するには「{how}」。",
  "delight.iconDone": "完了しました。Android ではアプリを閉じるとホーム画面に反映されます。",
  "delight.iconFailed": "この端末ではアイコンを変更できませんでした。",
  "delight.classic": "クラシック",
};
