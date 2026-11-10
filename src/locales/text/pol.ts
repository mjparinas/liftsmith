import type { Message } from "@/lib/i18n";

// Text for keys starting "pol.", in every language: the polish pass (undo, heart-rate-ready rest, last
// set, what's next, tips, hands-free logging and the widget). English is the source: add a key here
// first, then its Spanish and French. A missing translation falls back to English.

export const en = {
  "pol.undo": "Undo",
  "pol.undoLabel": "Undo the set you just logged",
  "pol.undoWarm": "Undo the warm-up you just logged",
  "pol.undone": "Set taken back. Fix the numbers and log it again.",
  "pol.ready": "Heart rate's back to {bpm}, near the {start} you started that set at. Go when you're ready.",
  "pol.lastSet": "Last set",
  "pol.lastSetBody": "Last set of the workout. Finish strong.",
  "pol.next.title": "Next workout",
  "pol.next.when": "{day} at {time}",
  "pol.next.ready": "{muscles} will be ready again by then.",
  "pol.next.waiting": "{muscle} needs about {hours} h more, so it'll sit that one out.",
  "pol.next.fresh": "{muscles} will be fresh, so expect them to lead.",
  "pol.tip": "Tip",
  "pol.tip.gotIt": "Got it",
  "pol.tip.undo": "Logged the wrong reps? Tap Undo just above the big button, fix the numbers and log the set again.",
  "pol.tip.reorder": "Press and hold an exercise in Coming up, then drag it to change the order.",
  "pol.tip.superset": "Tap the chain between two exercises in Coming up to do them as a superset and save time.",
  "pol.tip.swap": "Machine taken? The swap button next to the exercise name finds one that works the same muscles.",
  "pol.tip.handsFree": "You can log a set without unlocking your phone. Settings › Workout shows how.",
  "pol.tip.voice": "Want the next set read out to you? Turn on the voice coach in Settings.",
  "pol.tip.oneHand": "Lifting one-handed? One-handed controls in Settings › Workout put everything under your thumb.",
  "pol.hf.title": "Log sets hands-free",
  "pol.hf.intro": "Log set and +30 s work without opening the app, so chalky hands can stay off the screen.",
  "pol.hf.notif": "The workout notification has Log set and +30 s buttons, right on the lock screen.",
  "pol.hf.androidTile":
    "Add the Liftsmith tile to Quick Settings: swipe down twice, tap the pencil, and drag Liftsmith in. It reads Log set while a workout runs.",
  "pol.hf.androidWidget": "The home screen widget has Start and Log set. Press and hold the home screen, tap Widgets, then Liftsmith.",
  "pol.hf.iosBackTap":
    "Double-tap the back of your iPhone to log a set: Settings › Accessibility › Touch › Back Tap › Double Tap, then pick Liftsmith’s Log set shortcut.",
  "pol.hf.iosAction": "On an iPhone with an Action button: Settings › Action Button › Shortcut, then pick Liftsmith’s Log set shortcut.",
  "pol.hf.web": "On the web, install the app to your home screen and press and hold its icon for Start and Log set.",
  "pol.move": "Move {name}",
  "pol.moveNumbered": "{n}. Move {name}",
  "pol.moveUp": "Move {name} up",
  "pol.moveDown": "Move {name} down",
  "pol.moveDone": "Done moving",
  "pol.reorderHint": "Press and hold an exercise to drag it into a new order.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pol.undo": "Deshacer",
  "pol.undoLabel": "Deshacer la serie que acabas de registrar",
  "pol.undoWarm": "Deshacer el calentamiento que acabas de registrar",
  "pol.undone": "Serie deshecha. Corrige los números y regístrala otra vez.",
  "pol.ready": "Tu pulso ha vuelto a {bpm}, cerca de los {start} con los que empezaste la serie. Sigue cuando quieras.",
  "pol.lastSet": "Última serie",
  "pol.lastSetBody": "Última serie del entrenamiento. Termina fuerte.",
  "pol.next.title": "Próximo entrenamiento",
  "pol.next.when": "{day} a las {time}",
  "pol.next.ready": "{muscles} estarán listos otra vez para entonces.",
  "pol.next.waiting": "{muscle} necesita unas {hours} h más, así que descansará en ese.",
  "pol.next.fresh": "{muscles} estarán frescos, así que llevarán la voz cantante.",
  "pol.tip": "Consejo",
  "pol.tip.gotIt": "Entendido",
  "pol.tip.undo":
    "¿Registraste mal las repeticiones? Toca Deshacer justo encima del botón grande, corrige los números y vuelve a registrar la serie.",
  "pol.tip.reorder": "Mantén pulsado un ejercicio en A continuación y arrástralo para cambiar el orden.",
  "pol.tip.superset": "Toca la cadena entre dos ejercicios en A continuación para hacerlos como superserie y ahorrar tiempo.",
  "pol.tip.swap": "¿Máquina ocupada? El botón de cambiar junto al nombre del ejercicio busca uno que trabaje los mismos músculos.",
  "pol.tip.handsFree": "Puedes registrar una serie sin desbloquear el teléfono. Ajustes › Entrenamiento te enseña cómo.",
  "pol.tip.voice": "¿Quieres que te lean la siguiente serie? Activa el entrenador de voz en Ajustes.",
  "pol.tip.oneHand": "¿Entrenas con una mano? Los controles a una mano en Ajustes › Entrenamiento lo ponen todo bajo tu pulgar.",
  "pol.hf.title": "Registra series sin manos",
  "pol.hf.intro": "Registrar serie y +30 s funcionan sin abrir la app, así las manos con magnesio no tocan la pantalla.",
  "pol.hf.notif": "La notificación del entrenamiento tiene botones de Registrar serie y +30 s, en la pantalla de bloqueo.",
  "pol.hf.androidTile":
    "Añade el icono de Liftsmith a Ajustes rápidos: desliza hacia abajo dos veces, toca el lápiz y arrastra Liftsmith. Muestra Registrar serie durante un entrenamiento.",
  "pol.hf.androidWidget":
    "El widget de la pantalla de inicio tiene Empezar y Registrar serie. Mantén pulsada la pantalla de inicio, toca Widgets y luego Liftsmith.",
  "pol.hf.iosBackTap":
    "Toca dos veces la parte trasera del iPhone para registrar una serie: Ajustes › Accesibilidad › Tocar › Toque posterior › Doble toque, y elige el atajo Log set de Liftsmith.",
  "pol.hf.iosAction": "En un iPhone con botón de Acción: Ajustes › Botón de Acción › Atajo, y elige el atajo Log set de Liftsmith.",
  "pol.hf.web": "En la web, instala la app en tu pantalla de inicio y mantén pulsado su icono para Empezar y Registrar serie.",
  "pol.move": "Mover {name}",
  "pol.moveNumbered": "{n}. Mover {name}",
  "pol.moveUp": "Subir {name}",
  "pol.moveDown": "Bajar {name}",
  "pol.moveDone": "Terminar de mover",
  "pol.reorderHint": "Mantén pulsado un ejercicio para arrastrarlo a otro lugar.",
};

export const fr: Partial<Record<Key, Message>> = {
  "pol.undo": "Annuler",
  "pol.undoLabel": "Annuler la série que vous venez d'enregistrer",
  "pol.undoWarm": "Annuler l'échauffement que vous venez d'enregistrer",
  "pol.undone": "Série annulée. Corrigez les chiffres et enregistrez-la à nouveau.",
  "pol.ready": "Votre pouls est revenu à {bpm}, proche des {start} du début de la série. Repartez quand vous voulez.",
  "pol.lastSet": "Dernière série",
  "pol.lastSetBody": "Dernière série de la séance. Finissez fort.",
  "pol.next.title": "Prochaine séance",
  "pol.next.when": "{day} à {time}",
  "pol.next.ready": "{muscles} seront de nouveau prêts d'ici là.",
  "pol.next.waiting": "{muscle} a besoin d'environ {hours} h de plus, il restera au repos cette fois.",
  "pol.next.fresh": "{muscles} seront frais, ils devraient mener la séance.",
  "pol.tip": "Astuce",
  "pol.tip.gotIt": "Compris",
  "pol.tip.undo":
    "Mauvais nombre de répétitions ? Touchez Annuler juste au-dessus du grand bouton, corrigez les chiffres et enregistrez à nouveau la série.",
  "pol.tip.reorder": "Maintenez un exercice dans À suivre, puis faites-le glisser pour changer l'ordre.",
  "pol.tip.superset": "Touchez la chaîne entre deux exercices dans À suivre pour les faire en superset et gagner du temps.",
  "pol.tip.swap": "Machine prise ? Le bouton d'échange à côté du nom de l'exercice en trouve un qui travaille les mêmes muscles.",
  "pol.tip.handsFree": "Vous pouvez enregistrer une série sans déverrouiller votre téléphone. Réglages › Séance explique comment.",
  "pol.tip.voice": "Envie qu'on vous lise la série suivante ? Activez le coach vocal dans les Réglages.",
  "pol.tip.oneHand": "Vous soulevez d'une main ? Les commandes à une main dans Réglages › Séance mettent tout sous votre pouce.",
  "pol.hf.title": "Enregistrer sans les mains",
  "pol.hf.intro":
    "Enregistrer la série et +30 s fonctionnent sans ouvrir l'app, pour garder les mains pleines de magnésie loin de l'écran.",
  "pol.hf.notif": "La notification de séance a des boutons Enregistrer la série et +30 s, directement sur l'écran verrouillé.",
  "pol.hf.androidTile":
    "Ajoutez la vignette Liftsmith aux Réglages rapides : balayez deux fois vers le bas, touchez le crayon et faites glisser Liftsmith. Elle affiche Enregistrer la série pendant une séance.",
  "pol.hf.androidWidget":
    "Le widget de l'écran d'accueil a Démarrer et Enregistrer la série. Maintenez l'écran d'accueil, touchez Widgets, puis Liftsmith.",
  "pol.hf.iosBackTap":
    "Touchez deux fois le dos de votre iPhone pour enregistrer une série : Réglages › Accessibilité › Toucher › Toucher le dos › Toucher deux fois, puis choisissez le raccourci Log set de Liftsmith.",
  "pol.hf.iosAction":
    "Sur un iPhone avec bouton Action : Réglages › Bouton Action › Raccourci, puis choisissez le raccourci Log set de Liftsmith.",
  "pol.hf.web": "Sur le web, installez l'app sur votre écran d'accueil et maintenez son icône pour Démarrer et Enregistrer la série.",
  "pol.move": "Déplacer {name}",
  "pol.moveNumbered": "{n}. Déplacer {name}",
  "pol.moveUp": "Monter {name}",
  "pol.moveDown": "Descendre {name}",
  "pol.moveDone": "Fin du déplacement",
  "pol.reorderHint": "Maintenez un exercice pour le faire glisser ailleurs.",
};

export const de: Partial<Record<Key, Message>> = {
  "pol.undo": "Rückgängig",
  "pol.undoLabel": "Gerade eingetragenen Satz rückgängig machen",
  "pol.undoWarm": "Gerade eingetragenen Aufwärmsatz rückgängig machen",
  "pol.undone": "Satz zurückgenommen. Korrigiere die Zahlen und trag ihn erneut ein.",
  "pol.ready":
    "Deine Herzfrequenz ist wieder bei {bpm}, nah an den {start}, mit denen du den Satz begonnen hast. Leg los, wenn du bereit bist.",
  "pol.lastSet": "Letzter Satz",
  "pol.lastSetBody": "Letzter Satz des Trainings. Stark abschließen.",
  "pol.next.title": "Nächstes Training",
  "pol.next.when": "{day} um {time}",
  "pol.next.ready": "{muscles} sind bis dahin wieder bereit.",
  "pol.next.waiting": "{muscle} braucht noch etwa {hours} h und setzt dieses Mal aus.",
  "pol.next.fresh": "{muscles} sind dann frisch, also rechne damit, dass sie im Mittelpunkt stehen.",
  "pol.tip": "Tipp",
  "pol.tip.gotIt": "Verstanden",
  "pol.tip.undo":
    "Falsche Wiederholungen eingetragen? Tippe auf Rückgängig direkt über dem großen Knopf, korrigiere die Zahlen und trag den Satz erneut ein.",
  "pol.tip.reorder": "Halte eine Übung unter Als Nächstes gedrückt und zieh sie, um die Reihenfolge zu ändern.",
  "pol.tip.superset": "Tippe unter Als Nächstes auf die Kette zwischen zwei Übungen, um sie als Supersatz zu machen und Zeit zu sparen.",
  "pol.tip.swap": "Gerät belegt? Der Tauschen-Knopf neben dem Übungsnamen findet eins, das dieselben Muskeln trainiert.",
  "pol.tip.handsFree": "Du kannst einen Satz eintragen, ohne dein Telefon zu entsperren. Einstellungen › Training zeigt dir, wie.",
  "pol.tip.voice": "Soll dir der nächste Satz vorgelesen werden? Schalte den Sprachcoach in den Einstellungen ein.",
  "pol.tip.oneHand": "Trainierst du einhändig? Die Einhandbedienung unter Einstellungen › Training legt alles unter deinen Daumen.",
  "pol.hf.title": "Sätze freihändig eintragen",
  "pol.hf.intro": "Satz eintragen und +30 s funktionieren, ohne die App zu öffnen, damit Hände voller Magnesia vom Bildschirm bleiben.",
  "pol.hf.notif": "Die Trainingsbenachrichtigung hat die Knöpfe Satz eintragen und +30 s, direkt auf dem Sperrbildschirm.",
  "pol.hf.androidTile":
    "Füge die Liftsmith-Kachel zu den Schnelleinstellungen hinzu: zweimal nach unten wischen, auf den Stift tippen und Liftsmith hineinziehen. Während eines Trainings zeigt sie Satz eintragen.",
  "pol.hf.androidWidget":
    "Das Widget auf dem Startbildschirm hat Start und Satz eintragen. Halte den Startbildschirm gedrückt, tippe auf Widgets und dann auf Liftsmith.",
  "pol.hf.iosBackTap":
    "Tippe zweimal auf die Rückseite deines iPhones, um einen Satz einzutragen: Einstellungen › Bedienungshilfen › Tippen › Auf Rückseite tippen › Doppeltippen, dann den Liftsmith-Kurzbefehl Satz eintragen wählen.",
  "pol.hf.iosAction":
    "Auf einem iPhone mit Aktionstaste: Einstellungen › Aktionstaste › Kurzbefehl, dann den Liftsmith-Kurzbefehl Satz eintragen wählen.",
  "pol.hf.web": "Im Web installierst du die App auf deinem Startbildschirm und hältst ihr Symbol gedrückt für Start und Satz eintragen.",
  "pol.move": "{name} verschieben",
  "pol.moveNumbered": "{n}. {name} verschieben",
  "pol.moveUp": "{name} nach oben",
  "pol.moveDown": "{name} nach unten",
  "pol.moveDone": "Verschieben beendet",
  "pol.reorderHint": "Halte eine Übung gedrückt, um sie an eine neue Stelle zu ziehen.",
};

export const it: Partial<Record<Key, Message>> = {
  "pol.undo": "Annulla",
  "pol.undoLabel": "Annulla la serie appena registrata",
  "pol.undoWarm": "Annulla il riscaldamento appena registrato",
  "pol.undone": "Serie annullata. Correggi i numeri e registrala di nuovo.",
  "pol.ready": "La frequenza cardiaca è tornata a {bpm}, vicino ai {start} con cui hai iniziato la serie. Vai quando sei pronto.",
  "pol.lastSet": "Ultima serie",
  "pol.lastSetBody": "Ultima serie dell’allenamento. Chiudi in forza.",
  "pol.next.title": "Prossimo allenamento",
  "pol.next.when": "{day} alle {time}",
  "pol.next.ready": "{muscles} saranno di nuovo pronti per allora.",
  "pol.next.waiting": "{muscle} ha bisogno di circa {hours} h in più, quindi salterà quello.",
  "pol.next.fresh": "{muscles} saranno freschi, quindi aspettati che siano protagonisti.",
  "pol.tip": "Suggerimento",
  "pol.tip.gotIt": "Ho capito",
  "pol.tip.undo":
    "Hai registrato le ripetizioni sbagliate? Tocca Annulla appena sopra il pulsante grande, correggi i numeri e registra di nuovo la serie.",
  "pol.tip.reorder": "Tieni premuto un esercizio in In arrivo, poi trascinalo per cambiare l’ordine.",
  "pol.tip.superset": "Tocca la catena tra due esercizi in In arrivo per farli in superserie e risparmiare tempo.",
  "pol.tip.swap": "Macchina occupata? Il pulsante Sostituisci accanto al nome dell’esercizio ne trova uno che allena gli stessi muscoli.",
  "pol.tip.handsFree": "Puoi registrare una serie senza sbloccare il telefono. Impostazioni › Allenamento ti mostra come.",
  "pol.tip.voice": "Vuoi che la prossima serie ti venga letta? Attiva il coach vocale nelle Impostazioni.",
  "pol.tip.oneHand": "Ti alleni con una mano? I comandi a una mano in Impostazioni › Allenamento mettono tutto sotto il pollice.",
  "pol.hf.title": "Registra le serie a mani libere",
  "pol.hf.intro": "Registra serie e +30 s funzionano senza aprire l’app, così le mani con la magnesia restano lontane dallo schermo.",
  "pol.hf.notif": "La notifica dell’allenamento ha i pulsanti Registra serie e +30 s, direttamente sulla schermata di blocco.",
  "pol.hf.androidTile":
    "Aggiungi il riquadro di Liftsmith alle Impostazioni rapide: scorri due volte verso il basso, tocca la matita e trascina dentro Liftsmith. Durante un allenamento mostra Registra serie.",
  "pol.hf.androidWidget":
    "Il widget della schermata Home ha Inizia e Registra serie. Tieni premuto sulla schermata Home, tocca Widget, poi Liftsmith.",
  "pol.hf.iosBackTap":
    "Tocca due volte il retro dell’iPhone per registrare una serie: Impostazioni › Accessibilità › Tocco › Tocco posteriore › Tocco doppio, poi scegli il comando rapido Registra serie di Liftsmith.",
  "pol.hf.iosAction":
    "Su un iPhone con tasto Azione: Impostazioni › Tasto Azione › Comando rapido, poi scegli il comando rapido Registra serie di Liftsmith.",
  "pol.hf.web": "Sul web, installa l’app nella schermata Home e tieni premuta la sua icona per Inizia e Registra serie.",
  "pol.move": "Sposta {name}",
  "pol.moveNumbered": "{n}. Sposta {name}",
  "pol.moveUp": "Sposta {name} su",
  "pol.moveDown": "Sposta {name} giù",
  "pol.moveDone": "Fine spostamento",
  "pol.reorderHint": "Tieni premuto un esercizio per trascinarlo in un nuovo ordine.",
};

export const ja: Partial<Record<Key, Message>> = {
  "pol.undo": "取り消す",
  "pol.undoLabel": "記録したセットを取り消す",
  "pol.undoWarm": "記録したウォームアップを取り消す",
  "pol.undone": "セットを取り消しました。数値を直してもう一度記録してください。",
  "pol.ready": "心拍数が{bpm}まで戻り、セット開始時の{start}に近づきました。準備ができたらどうぞ。",
  "pol.lastSet": "最後のセット",
  "pol.lastSetBody": "ワークアウト最後のセット。力強く締めくくりましょう。",
  "pol.next.title": "次のワークアウト",
  "pol.next.when": "{day} {time}",
  "pol.next.ready": "それまでに{muscles}は回復します。",
  "pol.next.waiting": "{muscle}はあと約{hours}時間必要なので、次回は休ませます。",
  "pol.next.fresh": "{muscles}は万全なので、次回のメインになりそうです。",
  "pol.tip": "ヒント",
  "pol.tip.gotIt": "わかりました",
  "pol.tip.undo": "回数を間違えて記録しましたか？大きなボタンのすぐ上の「取り消す」をタップし、数値を直してもう一度記録してください。",
  "pol.tip.reorder": "「この後」の種目を長押ししてドラッグすると、順番を変えられます。",
  "pol.tip.superset": "「この後」の2つの種目の間のチェーンをタップすると、スーパーセットにして時間を短縮できます。",
  "pol.tip.swap": "マシンが使用中？種目名の横の「替える」ボタンで、同じ筋肉を鍛える種目が見つかります。",
  "pol.tip.handsFree": "スマホのロックを解除せずにセットを記録できます。方法は「設定 › ワークアウト」で確認できます。",
  "pol.tip.voice": "次のセットを読み上げてほしいですか？設定で音声コーチをオンにしましょう。",
  "pol.tip.oneHand": "片手でトレーニングしますか？「設定 › ワークアウト」の片手操作で、すべてが親指の下に来ます。",
  "pol.hf.title": "ハンズフリーでセットを記録",
  "pol.hf.intro": "「セットを記録」と「+30秒」はアプリを開かずに使えるので、チョークの付いた手で画面を触らずに済みます。",
  "pol.hf.notif": "ワークアウトの通知には、ロック画面上に「セットを記録」と「+30秒」のボタンがあります。",
  "pol.hf.androidTile":
    "Liftsmith のタイルをクイック設定に追加しましょう。2回下にスワイプし、鉛筆アイコンをタップして Liftsmith をドラッグします。ワークアウト中は「セットを記録」になります。",
  "pol.hf.androidWidget":
    "ホーム画面のウィジェットには「開始」と「セットを記録」があります。ホーム画面を長押しし、「ウィジェット」から Liftsmith を選びます。",
  "pol.hf.iosBackTap":
    "iPhone の背面をダブルタップしてセットを記録：設定 › アクセシビリティ › タッチ › 背面タップ › ダブルタップで、Liftsmith の「セットを記録」ショートカットを選びます。",
  "pol.hf.iosAction":
    "アクションボタンのある iPhone では：設定 › アクションボタン › ショートカットで、Liftsmith の「セットを記録」ショートカットを選びます。",
  "pol.hf.web": "Web ではアプリをホーム画面にインストールし、アイコンを長押しすると「開始」と「セットを記録」が使えます。",
  "pol.move": "{name}を移動",
  "pol.moveNumbered": "{n}. {name}を移動",
  "pol.moveUp": "{name}を上へ",
  "pol.moveDown": "{name}を下へ",
  "pol.moveDone": "移動を終了",
  "pol.reorderHint": "種目を長押しすると、ドラッグで順番を変えられます。",
};
