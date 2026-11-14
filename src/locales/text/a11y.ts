import type { Message } from "@/lib/i18n";

// Text for keys starting "a11y.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "a11y.hand": "One-handed controls",
  "a11y.hand.right": "Right hand",
  "a11y.hand.left": "Left hand",
  "a11y.hand.note":
    "During a workout, the weight and rep buttons move down next to Log set, with Log set under the thumb of the hand holding the phone. Hold a + or − button to keep changing.",
  "a11y.big": "Big numbers",
  "a11y.big.note":
    "During a set, the weight and reps get much bigger and Log set gets taller. Music, what's next and Same as last time wait until you rest.",
  "a11y.text": "Text size",
  "a11y.text.system": "Match my phone",
  "a11y.text.100": "Default",
  "a11y.text.115": "Large",
  "a11y.text.130": "Larger",
  "a11y.text.150": "Largest",
  "a11y.text.note": "Match my phone follows the text size in your phone's settings. Every screen reflows to fit larger text.",
  "a11y.colours": "Colours",
  "a11y.colours.standard": "Standard",
  "a11y.colours.cvd": "Colour-blind safe",
  "a11y.colours.note":
    "Colour-blind safe uses blue, orange and pink instead of green, amber and red for recovery and status, so they stay apart with red-green or blue-yellow colour blindness. The recovery map also marks recovering muscles with dots and fatigued ones with stripes.",
  "a11y.contrast": "Contrast",
  "a11y.contrast.more": "More",
  "a11y.contrast.note":
    "More makes secondary text and outlines stronger and removes background glows. For less motion, use Lean mode below or your phone's reduce motion setting.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "a11y.hand": "Controles a una mano",
  "a11y.hand.right": "Mano derecha",
  "a11y.hand.left": "Mano izquierda",
  "a11y.hand.note":
    "Durante el entrenamiento, los botones de peso y repeticiones bajan junto a Registrar serie, con Registrar serie bajo el pulgar de la mano que sujeta el teléfono. Mantén pulsado + o − para seguir cambiando.",
  "a11y.big": "Números grandes",
  "a11y.big.note":
    "Durante una serie, el peso y las repeticiones se ven mucho más grandes y Registrar serie es más alto. La música, lo siguiente y Igual que la última vez esperan al descanso.",
  "a11y.text": "Tamaño del texto",
  "a11y.text.system": "Igual que el teléfono",
  "a11y.text.100": "Normal",
  "a11y.text.115": "Grande",
  "a11y.text.130": "Más grande",
  "a11y.text.150": "El más grande",
  "a11y.text.note":
    "«Igual que el teléfono» usa el tamaño de texto de los ajustes del teléfono. Todas las pantallas se adaptan al texto más grande.",
  "a11y.colours": "Colores",
  "a11y.colours.standard": "Estándar",
  "a11y.colours.cvd": "Aptos para daltonismo",
  "a11y.colours.note":
    "«Aptos para daltonismo» usa azul, naranja y rosa en lugar de verde, ámbar y rojo para la recuperación y los estados, para que se distingan con daltonismo rojo-verde o azul-amarillo. El mapa de recuperación marca además con puntos los músculos que se recuperan y con rayas los fatigados.",
  "a11y.contrast": "Contraste",
  "a11y.contrast.more": "Más",
  "a11y.contrast.note":
    "«Más» refuerza el texto secundario y los contornos y quita los brillos de fondo. Para menos movimiento, usa el modo sobrio más abajo o la opción de reducir movimiento del teléfono.",
};

export const fr: Partial<Record<Key, Message>> = {
  "a11y.hand": "Commandes à une main",
  "a11y.hand.right": "Main droite",
  "a11y.hand.left": "Main gauche",
  "a11y.hand.note":
    "Pendant la séance, les boutons de charge et de répétitions descendent à côté de Enregistrer la série, sous le pouce de la main qui tient le téléphone. Maintenez + ou − pour continuer à changer.",
  "a11y.big": "Grands chiffres",
  "a11y.big.note":
    "Pendant une série, le poids et les répétitions sont bien plus grands et Valider la série est plus haut. La musique, la suite et Comme la dernière fois attendent le repos.",
  "a11y.text": "Taille du texte",
  "a11y.text.system": "Comme mon téléphone",
  "a11y.text.100": "Par défaut",
  "a11y.text.115": "Grand",
  "a11y.text.130": "Plus grand",
  "a11y.text.150": "Très grand",
  "a11y.text.note":
    "« Comme mon téléphone » suit la taille du texte réglée sur votre téléphone. Chaque écran s’adapte au texte plus grand.",
  "a11y.colours": "Couleurs",
  "a11y.colours.standard": "Standard",
  "a11y.colours.cvd": "Adaptées au daltonisme",
  "a11y.colours.note":
    "« Adaptées au daltonisme » utilise le bleu, l’orange et le rose au lieu du vert, de l’ambre et du rouge pour la récupération et les états, afin qu’ils restent distincts en cas de daltonisme rouge-vert ou bleu-jaune. La carte de récupération marque aussi de points les muscles en récupération et de rayures les muscles fatigués.",
  "a11y.contrast": "Contraste",
  "a11y.contrast.more": "Renforcé",
  "a11y.contrast.note":
    "« Renforcé » accentue le texte secondaire et les contours et retire les halos d’arrière-plan. Pour moins d’animations, utilisez le mode sobre plus bas ou l’option Réduire les animations du téléphone.",
};

export const de: Partial<Record<Key, Message>> = {
  "a11y.hand": "Einhandbedienung",
  "a11y.hand.right": "Rechte Hand",
  "a11y.hand.left": "Linke Hand",
  "a11y.hand.note":
    "Während des Trainings wandern die Gewichts- und Wiederholungstasten neben Satz eintragen, mit Satz eintragen unter dem Daumen der Hand, die das Telefon hält. Halte eine +- oder −-Taste gedrückt, um weiter zu ändern.",
  "a11y.big": "Große Zahlen",
  "a11y.big.note":
    "Während eines Satzes werden Gewicht und Wiederholungen viel größer und Satz eintragen höher. Musik, was als Nächstes kommt und Wie beim letzten Mal warten bis zur Pause.",
  "a11y.text": "Textgröße",
  "a11y.text.system": "Wie mein Telefon",
  "a11y.text.100": "Standard",
  "a11y.text.115": "Groß",
  "a11y.text.130": "Größer",
  "a11y.text.150": "Am größten",
  "a11y.text.note":
    "„Wie mein Telefon“ folgt der Textgröße in den Einstellungen deines Telefons. Jeder Bildschirm passt sich an größeren Text an.",
  "a11y.colours": "Farben",
  "a11y.colours.standard": "Standard",
  "a11y.colours.cvd": "Für Farbenblinde",
  "a11y.colours.note":
    "„Für Farbenblinde“ nutzt Blau, Orange und Rosa statt Grün, Gelb und Rot für Erholung und Status, damit sie bei Rot-Grün- oder Blau-Gelb-Schwäche unterscheidbar bleiben. Die Erholungskarte markiert sich erholende Muskeln außerdem mit Punkten und ermüdete mit Streifen.",
  "a11y.contrast": "Kontrast",
  "a11y.contrast.more": "Mehr",
  "a11y.contrast.note":
    "„Mehr“ macht Nebentexte und Umrisse kräftiger und entfernt Hintergrundleuchten. Für weniger Bewegung nutze unten den Schlank-Modus oder die Einstellung „Bewegung reduzieren“ deines Telefons.",
};

export const it: Partial<Record<Key, Message>> = {
  "a11y.hand": "Comandi a una mano",
  "a11y.hand.right": "Mano destra",
  "a11y.hand.left": "Mano sinistra",
  "a11y.hand.note":
    "Durante l’allenamento, i pulsanti di peso e ripetizioni scendono accanto a Registra serie, con Registra serie sotto il pollice della mano che tiene il telefono. Tieni premuto + o − per continuare a cambiare.",
  "a11y.big": "Numeri grandi",
  "a11y.big.note":
    "Durante una serie, peso e ripetizioni diventano molto più grandi e Registra serie più alto. Musica, il prossimo esercizio e Come l’ultima volta aspettano il recupero.",
  "a11y.text": "Dimensione del testo",
  "a11y.text.system": "Come il mio telefono",
  "a11y.text.100": "Predefinita",
  "a11y.text.115": "Grande",
  "a11y.text.130": "Più grande",
  "a11y.text.150": "Massima",
  "a11y.text.note":
    "«Come il mio telefono» segue la dimensione del testo nelle impostazioni del telefono. Ogni schermata si adatta al testo più grande.",
  "a11y.colours": "Colori",
  "a11y.colours.standard": "Standard",
  "a11y.colours.cvd": "Adatti al daltonismo",
  "a11y.colours.note":
    "«Adatti al daltonismo» usa blu, arancione e rosa invece di verde, ambra e rosso per recupero e stato, così restano distinguibili con daltonismo rosso-verde o blu-giallo. La mappa del recupero segna anche i muscoli in recupero con punti e quelli affaticati con righe.",
  "a11y.contrast": "Contrasto",
  "a11y.contrast.more": "Maggiore",
  "a11y.contrast.note":
    "«Maggiore» rende più marcati testi secondari e contorni e toglie i bagliori di sfondo. Per meno animazioni usa la modalità Essenziale qui sotto o l’opzione riduci movimento del telefono.",
};

export const ja: Partial<Record<Key, Message>> = {
  "a11y.hand": "片手操作",
  "a11y.hand.right": "右手",
  "a11y.hand.left": "左手",
  "a11y.hand.note":
    "ワークアウト中、重量と回数のボタンが「セットを記録」の横に移動し、「セットを記録」がスマホを持つ手の親指の下に来ます。＋や−を長押しすると連続で変わります。",
  "a11y.big": "大きな数字",
  "a11y.big.note":
    "セット中は重量と回数が大きく表示され、「セットを記録」ボタンも高くなります。音楽、次の種目、「前回と同じ」は休憩まで表示されません。",
  "a11y.text": "文字サイズ",
  "a11y.text.system": "端末に合わせる",
  "a11y.text.100": "標準",
  "a11y.text.115": "大",
  "a11y.text.130": "特大",
  "a11y.text.150": "最大",
  "a11y.text.note": "「端末に合わせる」は端末の設定の文字サイズに従います。どの画面も大きな文字に合わせてレイアウトが変わります。",
  "a11y.colours": "色",
  "a11y.colours.standard": "標準",
  "a11y.colours.cvd": "色覚多様性に配慮",
  "a11y.colours.note":
    "「色覚多様性に配慮」では、回復と状態の表示に緑・黄・赤の代わりに青・オレンジ・ピンクを使い、赤緑や青黄の色覚特性でも区別できるようにします。回復マップでは回復中の筋肉をドット、疲労した筋肉をストライプでも示します。",
  "a11y.contrast": "コントラスト",
  "a11y.contrast.more": "高",
  "a11y.contrast.note":
    "「高」では補足テキストと輪郭を濃くし、背景の光彩をなくします。動きを減らすには、下のリーンモードか端末の「視差効果を減らす」設定を使ってください。",
};
