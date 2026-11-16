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

export const pt: Partial<Record<Key, Message>> = {
  "a11y.hand": "Controles para uma mão",
  "a11y.hand.right": "Mão direita",
  "a11y.hand.left": "Mão esquerda",
  "a11y.hand.note":
    "Durante o treino, os botões de peso e reps descem para perto de Registrar série, com Registrar série sob o polegar da mão que segura o celular. Segure um botão + ou − para continuar mudando.",
  "a11y.big": "Números grandes",
  "a11y.big.note":
    "Durante a série, o peso e as reps ficam bem maiores e Registrar série fica mais alto. Música, o que vem a seguir e Igual à última vez esperam até o descanso.",
  "a11y.text": "Tamanho do texto",
  "a11y.text.system": "Igual ao celular",
  "a11y.text.100": "Padrão",
  "a11y.text.115": "Grande",
  "a11y.text.130": "Maior",
  "a11y.text.150": "O maior",
  "a11y.text.note": "Igual ao celular segue o tamanho do texto nos ajustes do seu celular. Todas as telas se ajustam ao texto maior.",
  "a11y.colours": "Cores",
  "a11y.colours.standard": "Padrão",
  "a11y.colours.cvd": "Seguro para daltônicos",
  "a11y.colours.note":
    "Seguro para daltônicos usa azul, laranja e rosa em vez de verde, âmbar e vermelho para recuperação e status, para que continuem distintos com daltonismo vermelho-verde ou azul-amarelo. O mapa de recuperação também marca músculos em recuperação com pontos e os cansados com listras.",
  "a11y.contrast": "Contraste",
  "a11y.contrast.more": "Mais",
  "a11y.contrast.note":
    "Mais deixa o texto secundário e os contornos mais fortes e tira os brilhos do fundo. Para menos movimento, use o Modo enxuto abaixo ou o ajuste de reduzir movimento do celular.",
};

export const ko: Partial<Record<Key, Message>> = {
  "a11y.hand": "한 손 조작",
  "a11y.hand.right": "오른손",
  "a11y.hand.left": "왼손",
  "a11y.hand.note":
    "운동 중에 무게와 횟수 버튼이 세트 기록 옆 아래쪽으로 내려오고, 세트 기록은 휴대폰을 든 손의 엄지 아래에 놓여요. + 또는 − 버튼을 길게 누르면 계속 바뀌어요.",
  "a11y.big": "큰 숫자",
  "a11y.big.note":
    "세트 중에는 무게와 횟수가 훨씬 커지고 세트 기록 버튼이 더 길어져요. 음악, 다음 순서, 지난번과 같게는 휴식할 때 나타나요.",
  "a11y.text": "글자 크기",
  "a11y.text.system": "휴대폰 설정 따르기",
  "a11y.text.100": "기본",
  "a11y.text.115": "크게",
  "a11y.text.130": "더 크게",
  "a11y.text.150": "가장 크게",
  "a11y.text.note": "휴대폰 설정 따르기는 휴대폰 설정의 글자 크기를 따라가요. 모든 화면이 큰 글자에 맞게 다시 배치돼요.",
  "a11y.colours": "색상",
  "a11y.colours.standard": "표준",
  "a11y.colours.cvd": "색각 이상 친화",
  "a11y.colours.note":
    "색각 이상 친화 모드는 회복과 상태 표시에 초록, 주황, 빨강 대신 파랑, 주황, 분홍을 써서 적록 색약이나 청황 색약이 있어도 서로 구분돼요. 회복 맵에서는 회복 중인 근육에 점을, 피로한 근육에 줄무늬를 표시해요.",
  "a11y.contrast": "대비",
  "a11y.contrast.more": "높게",
  "a11y.contrast.note":
    "높게는 보조 텍스트와 테두리를 더 진하게 하고 배경 빛 효과를 없애요. 움직임을 줄이려면 아래의 간결 모드나 휴대폰의 동작 줄이기 설정을 쓰세요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "a11y.hand": "Tek elle kullanım",
  "a11y.hand.right": "Sağ el",
  "a11y.hand.left": "Sol el",
  "a11y.hand.note":
    "Antrenman sırasında ağırlık ve tekrar düğmeleri aşağıya, Seti kaydet'in yanına iner; Seti kaydet de telefonu tutan elin başparmağının altına gelir. Değiştirmeye devam etmek için + veya − düğmesini basılı tut.",
  "a11y.big": "Büyük sayılar",
  "a11y.big.note":
    "Set sırasında ağırlık ve tekrarlar çok daha büyük görünür, Seti kaydet de uzar. Müzik, sıradakiler ve Geçen seferki gibi dinlenmeye geçene kadar bekler.",
  "a11y.text": "Yazı boyutu",
  "a11y.text.system": "Telefonuma uy",
  "a11y.text.100": "Varsayılan",
  "a11y.text.115": "Büyük",
  "a11y.text.130": "Daha büyük",
  "a11y.text.150": "En büyük",
  "a11y.text.note":
    "Telefonuma uy, telefonunun ayarlarındaki yazı boyutunu izler. Her ekran büyük yazıya sığacak şekilde yeniden düzenlenir.",
  "a11y.colours": "Renkler",
  "a11y.colours.standard": "Standart",
  "a11y.colours.cvd": "Renk körlüğüne uygun",
  "a11y.colours.note":
    "Renk körlüğüne uygun mod, toparlanma ve durum için yeşil, sarı ve kırmızı yerine mavi, turuncu ve pembe kullanır; böylece kırmızı-yeşil veya mavi-sarı renk körlüğünde de birbirinden ayrılırlar. Toparlanma haritası ayrıca toparlanan kasları noktalarla, yorgun olanları çizgilerle işaretler.",
  "a11y.contrast": "Kontrast",
  "a11y.contrast.more": "Daha fazla",
  "a11y.contrast.note":
    "Daha fazla, ikincil yazıları ve kenar çizgilerini güçlendirir, arka plandaki parıltıları kaldırır. Daha az hareket için aşağıdaki Sade modu ya da telefonunun hareketi azaltma ayarını kullan.",
};

export const pl: Partial<Record<Key, Message>> = {
  "a11y.hand": "Obsługa jedną ręką",
  "a11y.hand.right": "Prawa ręka",
  "a11y.hand.left": "Lewa ręka",
  "a11y.hand.note":
    "Podczas treningu przyciski ciężaru i powtórzeń przesuwają się w dół obok Zapisz serię, a Zapisz serię trafia pod kciuk ręki, w której trzymasz telefon. Przytrzymaj + lub −, by zmieniać dalej.",
  "a11y.big": "Duże liczby",
  "a11y.big.note":
    "Podczas serii ciężar i powtórzenia są dużo większe, a Zapisz serię jest wyższy. Muzyka, to, co dalej, i Jak ostatnio czekają do przerwy.",
  "a11y.text": "Rozmiar tekstu",
  "a11y.text.system": "Jak w telefonie",
  "a11y.text.100": "Domyślny",
  "a11y.text.115": "Duży",
  "a11y.text.130": "Większy",
  "a11y.text.150": "Największy",
  "a11y.text.note": "Jak w telefonie oznacza rozmiar tekstu z ustawień telefonu. Każdy ekran dopasowuje się do większego tekstu.",
  "a11y.colours": "Kolory",
  "a11y.colours.standard": "Standardowe",
  "a11y.colours.cvd": "Dla daltonistów",
  "a11y.colours.note":
    "Tryb dla daltonistów używa niebieskiego, pomarańczowego i różowego zamiast zielonego, bursztynowego i czerwonego dla regeneracji i statusu, więc pozostają odróżnialne przy daltonizmie czerwono-zielonym lub niebiesko-żółtym. Mapa regeneracji oznacza też regenerujące się mięśnie kropkami, a zmęczone paskami.",
  "a11y.contrast": "Kontrast",
  "a11y.contrast.more": "Wyższy",
  "a11y.contrast.note":
    "Wyższy kontrast wzmacnia drugorzędny tekst i obramowania oraz usuwa poświatę tła. Aby ograniczyć ruch, użyj Trybu oszczędnego poniżej lub ustawienia ograniczenia ruchu w telefonie.",
};
