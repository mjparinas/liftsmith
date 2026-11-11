import type { Message } from "@/lib/i18n";

// Text for keys starting "lab.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "lab.formCheck.title": "Camera form check",
  "lab.formCheck.body":
    "While the camera counts reps, it also watches how they move: squats that stop above parallel, reps cut short, and leaning to one side. Between sets it gives one tip and shows it on the figure. Side-on is best for depth; face the camera to check for a lean.",
  "lab.speedMax.title": "Today's max from warm-ups",
  "lab.speedMax.body":
    "Uses the bar speed of your warm-ups to estimate today's max, then suggests a slightly heavier or lighter working weight before your first hard set. Works on squats, hinges, presses, rows and pull-ups, and needs your height in Your stats.",
  "lab.barSpeed.title": "Camera bar speed",
  "lab.barSpeed.body":
    "While the camera counts reps, it also shows how fast the bar moves, how much it has slowed since your fastest rep, and when it's time to end the set. Add your height in Your stats for speeds in m/s.",
  "lab.hrRest.title": "Heart-rate rest timer",
  "lab.hrRest.body":
    "With a heart rate monitor or watch connected, rest ends early once your heart rate is back near where it was when the set started. It never cuts more than 40% of the planned rest, and +30 s still adds time.",
  "lab.hrRest.cut": "Heart rate's back to {bpm}, near the {start} you started that set at, so rest is {saved} s shorter. Get ready.",
  "lab.row": "Labs",
  "lab.rowNote": "Try experimental features early",
  "lab.title": "Labs",
  "lab.intro": "Experiments that aren't quite ready for everyone. They may change, misbehave or go away. Switch on what you'd like to try.",
  "lab.pro": "Labs is part of Pro.",
  "lab.needs": "Needs {lab} on.",
  "lab.repCount.title": "Camera rep counting",
  "lab.repCount.body":
    "Adds Count reps to the exercise on the workout screen. The camera watches your set, draws the bones it sees over you and fills in your reps. Video stays on your phone.",
  "lab.repMotion.title": "Phone motion rep counting",
  "lab.repMotion.body": "Count reps from the phone's motion sensors instead of the camera. Less reliable.",
  "lab.watchReps.title": "Watch rep counting",
  "lab.watchReps.body":
    "Your Wear OS watch or Apple Watch counts reps from your wrist during each set and fills them in for Log set on your phone. Needs the Liftsmith watch app open on your wrist. Not for lifts where your hands stay still, like pull-ups.",
  "lab.trainer.title": "Trainer mode",
  "lab.trainer.body":
    "Coach other lifters: make an invite code in Settings › Coaching, then see each client's workouts with what to act on first. Your clients don't need Pro.",
  "lab.voiceLog.title": "Voice set logging",
  "lab.voiceLog.body":
    'Adds a microphone above Log set on the workout screen. Tap it and say "100 for 8", "8 reps", "too easy" or "undo". Speech is recognized on your phone and never recorded or sent, so it needs a phone that can do that in your language.',
};

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Revisión de técnica con la cámara",
  "lab.formCheck.body":
    "Mientras la cámara cuenta repeticiones, también mira cómo se mueven: sentadillas que se quedan por encima del paralelo, repeticiones cortas e inclinarse hacia un lado. Entre series da un consejo y lo muestra en la figura. De lado se ve mejor la profundidad; ponte de frente para revisar si te inclinas.",
  "lab.speedMax.title": "Tu máximo de hoy según el calentamiento",
  "lab.speedMax.body":
    "Usa la velocidad de la barra en tus series de calentamiento para estimar tu máximo de hoy y, antes de la primera serie dura, sugiere un peso de trabajo un poco más alto o más bajo. Funciona en sentadillas, bisagras, presses, remos y dominadas, y necesita tu altura en Tus datos.",
  "lab.barSpeed.title": "Velocidad de la barra con la cámara",
  "lab.barSpeed.body":
    "Mientras la cámara cuenta repeticiones, también muestra lo rápido que sube la barra, cuánto se ha frenado desde tu repetición más rápida y cuándo conviene terminar la serie. Añade tu altura en Tus datos para ver la velocidad en m/s.",
  "lab.hrRest.title": "Descanso según el pulso",
  "lab.hrRest.body":
    "Con un pulsómetro o un reloj conectado, el descanso termina antes cuando tu pulso vuelve cerca del que tenías al empezar la serie. Nunca recorta más del 40 % del descanso previsto, y +30 s sigue añadiendo tiempo.",
  "lab.hrRest.cut":
    "Tu pulso ha vuelto a {bpm}, cerca de los {start} con los que empezaste la serie, así que el descanso es {saved} s más corto. Prepárate.",
  "lab.row": "Labs",
  "lab.rowNote": "Prueba funciones experimentales antes que nadie",
  "lab.title": "Labs",
  "lab.intro": "Experimentos que aún no están listos para todos. Pueden cambiar, fallar o desaparecer. Activa lo que quieras probar.",
  "lab.pro": "Labs es parte de Pro.",
  "lab.needs": "Necesita {lab} activado.",
  "lab.repCount.title": "Contar repeticiones con la cámara",
  "lab.repCount.body":
    "Añade Contar reps al ejercicio en la pantalla de entrenamiento. La cámara mira tu serie, dibuja los huesos que ve sobre ti y rellena tus repeticiones. El vídeo no sale de tu teléfono.",
  "lab.repMotion.title": "Contar repeticiones con el movimiento del teléfono",
  "lab.repMotion.body": "Cuenta repeticiones con los sensores de movimiento del teléfono en lugar de la cámara. Menos fiable.",
  "lab.watchReps.title": "Contar repeticiones con el reloj",
  "lab.watchReps.body":
    "Tu reloj Wear OS o Apple Watch cuenta las repeticiones con el movimiento de la muñeca en cada serie y las rellena en Registrar serie en el teléfono. Necesita la app de Liftsmith abierta en el reloj. No sirve para ejercicios en los que las manos no se mueven, como las dominadas.",
  "lab.trainer.title": "Modo entrenador",
  "lab.trainer.body":
    "Entrena a otras personas: crea un código de invitación en Ajustes › Entrenador y mira los entrenamientos de cada cliente con lo primero que conviene atender. Tus clientes no necesitan Pro.",
  "lab.voiceLog.title": "Registrar series con la voz",
  "lab.voiceLog.body":
    "Añade un micrófono encima de Registrar serie en la pantalla de entrenamiento. Tócalo y di «100 por 8», «8 repeticiones», «demasiado fácil» o «deshacer». La voz se reconoce en tu teléfono y nunca se graba ni se envía, así que necesita un teléfono que pueda hacerlo en tu idioma.",
};

export const fr: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Contrôle de la technique par la caméra",
  "lab.formCheck.body":
    "Pendant que la caméra compte les répétitions, elle regarde aussi comment elles bougent : squats arrêtés au-dessus de la parallèle, répétitions écourtées et inclinaison d’un côté. Entre les séries, elle donne un conseil et le montre sur la silhouette. De profil, c’est mieux pour la profondeur ; de face, pour voir si vous penchez.",
  "lab.speedMax.title": "Votre max du jour d'après l'échauffement",
  "lab.speedMax.body":
    "Utilise la vitesse de barre de vos séries d'échauffement pour estimer votre max du jour, puis propose une charge de travail un peu plus lourde ou plus légère avant votre première série difficile. Fonctionne sur les squats, les charnières, les développés, les tirages et les tractions, et nécessite votre taille dans Vos mesures.",
  "lab.barSpeed.title": "Vitesse de barre par la caméra",
  "lab.barSpeed.body":
    "Pendant que la caméra compte les répétitions, elle montre aussi la vitesse de la barre, son ralentissement depuis votre répétition la plus rapide et le moment de finir la série. Ajoutez votre taille dans Vos mesures pour des vitesses en m/s.",
  "lab.hrRest.title": "Repos selon le pouls",
  "lab.hrRest.body":
    "Avec une ceinture cardio ou une montre connectée, le repos se termine plus tôt dès que votre pouls revient près de celui du début de la série. Il ne retire jamais plus de 40 % du repos prévu, et +30 s ajoute toujours du temps.",
  "lab.hrRest.cut":
    "Votre pouls est revenu à {bpm}, proche des {start} du début de la série : le repos est raccourci de {saved} s. Préparez-vous.",
  "lab.row": "Labs",
  "lab.rowNote": "Essayez les fonctions expérimentales en avant-première",
  "lab.title": "Labs",
  "lab.intro":
    "Des expériences pas encore prêtes pour tout le monde. Elles peuvent changer, mal fonctionner ou disparaître. Activez ce que vous voulez essayer.",
  "lab.pro": "Labs fait partie de Pro.",
  "lab.needs": "Nécessite {lab} activé.",
  "lab.repCount.title": "Comptage des répétitions par la caméra",
  "lab.repCount.body":
    "Ajoute Compter à l'exercice sur l'écran d'entraînement. La caméra regarde votre série, dessine les os qu'elle voit sur vous et remplit vos répétitions. La vidéo reste sur votre téléphone.",
  "lab.repMotion.title": "Comptage des répétitions par les mouvements du téléphone",
  "lab.repMotion.body": "Compte les répétitions avec les capteurs de mouvement du téléphone au lieu de la caméra. Moins fiable.",
  "lab.watchReps.title": "Comptage des répétitions par la montre",
  "lab.watchReps.body":
    "Votre montre Wear OS ou Apple Watch compte les répétitions au mouvement du poignet à chaque série et les inscrit dans Valider la série sur le téléphone. Nécessite l'app Liftsmith ouverte sur la montre. Pas pour les exercices où les mains ne bougent pas, comme les tractions.",
  "lab.trainer.title": "Mode coach",
  "lab.trainer.body":
    "Coachez d'autres pratiquants : créez un code d'invitation dans Réglages › Coaching, puis voyez les séances de chaque client avec ce qu'il faut traiter en premier. Vos clients n'ont pas besoin de Pro.",
  "lab.voiceLog.title": "Saisie des séries à la voix",
  "lab.voiceLog.body":
    "Ajoute un micro au-dessus de Valider la série sur l'écran d'entraînement. Touchez-le et dites « 100 pour 8 », « 8 répétitions », « trop facile » ou « annuler ». La parole est reconnue sur votre téléphone et n'est jamais enregistrée ni envoyée, il faut donc un téléphone qui sait le faire dans votre langue.",
};

export const de: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Technik-Check per Kamera",
  "lab.formCheck.body":
    "Während die Kamera Wiederholungen zählt, achtet sie auch darauf, wie sie laufen: Kniebeugen über der Parallele, verkürzte Wiederholungen und Neigen zu einer Seite. Zwischen den Sätzen gibt sie einen Tipp und zeigt ihn an der Figur. Für die Tiefe ist die Seitenansicht am besten; stell dich frontal zur Kamera, um eine Neigung zu prüfen.",
  "lab.speedMax.title": "Tagesmaximum aus dem Aufwärmen",
  "lab.speedMax.body":
    "Schätzt aus dem Stangentempo deiner Aufwärmsätze dein heutiges Maximum und schlägt vor dem ersten harten Satz ein etwas schwereres oder leichteres Arbeitsgewicht vor. Funktioniert bei Kniebeugen, Hüftbeugen, Drücken, Rudern und Klimmzügen und braucht deine Größe in Deine Daten.",
  "lab.barSpeed.title": "Stangengeschwindigkeit per Kamera",
  "lab.barSpeed.body":
    "Während die Kamera Wiederholungen zählt, zeigt sie auch, wie schnell sich die Stange bewegt, wie stark sie seit deiner schnellsten Wiederholung langsamer wurde und wann du den Satz beenden solltest. Trag deine Größe unter Deine Daten ein, um Geschwindigkeiten in m/s zu sehen.",
  "lab.hrRest.title": "Pause nach Puls",
  "lab.hrRest.body":
    "Mit verbundenem Pulsgurt oder verbundener Uhr endet die Pause früher, sobald dein Puls wieder nahe am Wert vom Satzbeginn ist. Sie wird nie um mehr als 40 % der geplanten Pause gekürzt, und +30 s verlängert weiterhin.",
  "lab.hrRest.cut":
    "Dein Puls ist wieder bei {bpm}, nahe den {start} vom Satzbeginn, deshalb ist die Pause {saved} s kürzer. Mach dich bereit.",
  "lab.row": "Labs",
  "lab.rowNote": "Probiere experimentelle Funktionen früher aus",
  "lab.title": "Labs",
  "lab.intro":
    "Experimente, die noch nicht für alle bereit sind. Sie können sich ändern, haken oder wieder verschwinden. Schalte ein, was du ausprobieren möchtest.",
  "lab.pro": "Labs ist Teil von Pro.",
  "lab.needs": "Braucht {lab}.",
  "lab.repCount.title": "Wiederholungen per Kamera zählen",
  "lab.repCount.body":
    "Fügt der Übung im Trainingsbildschirm Wiederholungen zählen hinzu. Die Kamera beobachtet deinen Satz, zeichnet die erkannten Knochen über dich und trägt deine Wiederholungen ein. Das Video bleibt auf deinem Handy.",
  "lab.repMotion.title": "Wiederholungen per Bewegungssensor zählen",
  "lab.repMotion.body": "Zählt Wiederholungen mit den Bewegungssensoren des Handys statt mit der Kamera. Weniger zuverlässig.",
  "lab.watchReps.title": "Wiederholungen per Uhr zählen",
  "lab.watchReps.body":
    "Deine Wear-OS-Uhr oder Apple Watch zählt bei jedem Satz die Wiederholungen an der Bewegung deines Handgelenks und trägt sie auf dem Handy in Satz eintragen ein. Dafür muss die Liftsmith-App auf der Uhr offen sein. Nicht für Übungen, bei denen die Hände stillstehen, wie Klimmzüge.",
  "lab.trainer.title": "Trainermodus",
  "lab.trainer.body":
    "Betreue andere: Erstell unter Einstellungen › Coaching einen Einladungscode und sieh die Trainings jedes Kunden, mit dem, was zuerst zu tun ist. Deine Kunden brauchen kein Pro.",
  "lab.voiceLog.title": "Sätze per Stimme eintragen",
  "lab.voiceLog.body":
    "Fügt auf dem Trainingsbildschirm über Satz eintragen ein Mikrofon hinzu. Tipp darauf und sag „100 für 8“, „8 Wiederholungen“, „zu leicht“ oder „rückgängig“. Die Sprache wird auf deinem Handy erkannt und nie aufgenommen oder gesendet, daher braucht es ein Handy, das das in deiner Sprache kann.",
};

export const it: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "Controllo della tecnica con la fotocamera",
  "lab.formCheck.body":
    "Mentre la fotocamera conta le ripetizioni, guarda anche come si muovono: squat che si fermano sopra il parallelo, ripetizioni accorciate e inclinazioni su un lato. Tra una serie e l’altra dà un consiglio e lo mostra sulla figura. Di lato è meglio per la profondità; mettiti di fronte per controllare se ti inclini.",
  "lab.speedMax.title": "Il massimale di oggi dal riscaldamento",
  "lab.speedMax.body":
    "Usa la velocità del bilanciere nelle serie di riscaldamento per stimare il massimale di oggi e, prima della prima serie pesante, suggerisce un carico di lavoro un po' più alto o più basso. Funziona su squat, hip hinge, distensioni, rematori e trazioni, e richiede la tua altezza in I tuoi dati.",
  "lab.barSpeed.title": "Velocità del bilanciere con la fotocamera",
  "lab.barSpeed.body":
    "Mentre la fotocamera conta le ripetizioni, mostra anche quanto velocemente si muove il bilanciere, quanto ha rallentato rispetto alla tua ripetizione più veloce e quando è il momento di chiudere la serie. Aggiungi la tua altezza in I tuoi dati per le velocità in m/s.",
  "lab.hrRest.title": "Recupero in base al battito",
  "lab.hrRest.body":
    "Con una fascia cardio o un orologio collegato, il recupero finisce prima quando la frequenza cardiaca torna vicina a quella di inizio serie. Non toglie mai più del 40% del recupero previsto, e +30 s aggiunge sempre tempo.",
  "lab.hrRest.cut":
    "La frequenza cardiaca è tornata a {bpm}, vicino ai {start} di inizio serie, quindi il recupero è più corto di {saved} s. Preparati.",
  "lab.row": "Labs",
  "lab.rowNote": "Prova in anteprima le funzioni sperimentali",
  "lab.title": "Labs",
  "lab.intro": "Esperimenti non ancora pronti per tutti. Possono cambiare, non funzionare bene o sparire. Attiva quello che vuoi provare.",
  "lab.pro": "Labs fa parte di Pro.",
  "lab.needs": "Richiede {lab} attivo.",
  "lab.repCount.title": "Conteggio delle ripetizioni con la fotocamera",
  "lab.repCount.body":
    "Aggiunge Conta ripetizioni all'esercizio nella schermata di allenamento. La fotocamera guarda la tua serie, disegna sopra di te le ossa che vede e inserisce le ripetizioni. Il video resta sul telefono.",
  "lab.repMotion.title": "Conteggio delle ripetizioni con il movimento del telefono",
  "lab.repMotion.body": "Conta le ripetizioni con i sensori di movimento del telefono invece della fotocamera. Meno affidabile.",
  "lab.watchReps.title": "Conteggio delle ripetizioni con l'orologio",
  "lab.watchReps.body":
    "Il tuo orologio Wear OS o Apple Watch conta le ripetizioni dal movimento del polso in ogni serie e le inserisce in Registra serie sul telefono. Serve l'app Liftsmith aperta sull'orologio. Non vale per gli esercizi in cui le mani restano ferme, come le trazioni.",
  "lab.trainer.title": "Modalità coach",
  "lab.trainer.body":
    "Segui altre persone: crea un codice d'invito in Impostazioni › Coaching e guarda gli allenamenti di ogni cliente con la prima cosa da fare. I tuoi clienti non hanno bisogno di Pro.",
  "lab.voiceLog.title": "Registrare le serie con la voce",
  "lab.voiceLog.body":
    "Aggiunge un microfono sopra Registra serie nella schermata dell'allenamento. Toccalo e di' «100 per 8», «8 ripetizioni», «troppo facile» o «annulla». La voce viene riconosciuta sul telefono e non viene mai registrata né inviata, quindi serve un telefono che sappia farlo nella tua lingua.",
};

export const ja: Partial<Record<Key, Message>> = {
  "lab.formCheck.title": "カメラでフォームチェック",
  "lab.formCheck.body":
    "カメラがレップを数えている間、動き方もチェックします。パラレルより浅いスクワット、短くなったレップ、左右への傾きです。セット間にひとつだけアドバイスを出し、フィギュアで示します。深さは横から、傾きはカメラの正面に立つと確認できます。",
  "lab.speedMax.title": "ウォームアップから今日の最大重量",
  "lab.speedMax.body":
    "ウォームアップのバースピードから今日の最大重量を推定し、最初のきついセットの前に少し重め・軽めのメイン重量を提案します。スクワット、ヒンジ、プレス、ロウ、懸垂に対応。「あなたのデータ」に身長の入力が必要です。",
  "lab.barSpeed.title": "カメラでバースピード",
  "lab.barSpeed.body":
    "カメラがレップを数えている間、バーの速さ、いちばん速いレップからどれだけ落ちたか、セットを終えるタイミングも表示します。m/s で表示するには「あなたのデータ」に身長を入力してください。",
  "lab.hrRest.title": "心拍数で休憩タイマー",
  "lab.hrRest.body":
    "心拍計やウォッチを接続していると、心拍数がセット開始時の近くまで戻った時点で休憩を早めに終えます。予定の休憩の40%より多くは短縮せず、+30秒でいつでも延長できます。",
  "lab.hrRest.cut": "心拍数が{bpm}まで戻り、セット開始時の{start}に近づいたので、休憩を{saved}秒短くしました。準備してください。",
  "lab.row": "Labs",
  "lab.rowNote": "試験中の機能をいち早く試せます",
  "lab.title": "Labs",
  "lab.intro":
    "まだ全員向けではない試験中の機能です。変更されたり、うまく動かなかったり、なくなったりすることがあります。試したいものをオンにしてください。",
  "lab.pro": "Labs は Pro の機能です。",
  "lab.needs": "{lab}をオンにする必要があります。",
  "lab.repCount.title": "カメラでレップをカウント",
  "lab.repCount.body":
    "ワークアウト画面の種目にレップカウントを追加します。カメラがセットを見て、認識した骨格をあなたの上に描き、レップ数を入力します。映像はスマートフォンの外に出ません。",
  "lab.repMotion.title": "端末のモーションでレップをカウント",
  "lab.repMotion.body": "カメラの代わりにスマートフォンのモーションセンサーでレップを数えます。精度は低めです。",
  "lab.watchReps.title": "ウォッチでレップをカウント",
  "lab.watchReps.body":
    "Wear OS ウォッチまたは Apple Watch が、各セットで手首の動きからレップを数え、スマートフォンの「セットを記録」に入力します。ウォッチで Liftsmith アプリを開いておく必要があります。懸垂のように手が動かない種目には使えません。",
  "lab.trainer.title": "トレーナーモード",
  "lab.trainer.body":
    "ほかの人を指導できます。「設定 › コーチング」で招待コードを作成すると、各クライアントのワークアウトと、まず取り組むべきことが表示されます。クライアントに Pro は必要ありません。",
  "lab.voiceLog.title": "声でセットを記録",
  "lab.voiceLog.body":
    "ワークアウト画面の「セットを記録」の上にマイクを追加します。タップして「100キロで8回」「8回」「簡単すぎ」「取り消し」のように言ってください。音声はスマートフォン上で認識され、録音や送信はされないため、お使いの言語でそれができるスマートフォンが必要です。",
};
