# Google Play store listing: translations

The [English listing](PLAY_LISTING.md) in the app's other five languages, for Play Console › Grow users › Store presence › Store listings › Manage translations › **Add your own translations**. Paste each language's name, short description and full description, and upload its phone screenshots. Tablet and Chromebook screenshots, the feature graphic and the video stay the English ones, which Play shows for any language that has none of its own.

Which Play languages get which text:

| Text | Play languages |
| --- | --- |
| Español | Spanish (Spain) es-ES, Spanish (Latin America) es-419, Spanish (United States) es-US |
| Français | French (France) fr-FR, French (Canada) fr-CA |
| Deutsch | German de-DE |
| Italiano | Italian it-IT |
| 日本語 | Japanese ja-JP |

Same rules as the English listing: only what ships on Android today, no other apps' names, no "best" or "#1" in any language, no emoji, no all caps, no prices, and every URL uses `www`. The app's own fixed terms are used (Log set, readiness, deload and the rest; see Languages in [Borrowed from Gradelings](decisions/borrowed-from-gradelings.md)), and the register matches the app: Spanish *tú*, French *vous*, German *du*, Italian *tu*, Japanese です・ます. `src/lib/playListing.test.ts` checks the limits and rules for every language here.

The screenshots are the English set's eight phone shots with the app and the captions in each language. Make them with:

```bash
npm run build:static
for l in es fr de it ja; do PLAY_LANG=$l node scripts/play-capture.mjs; done   # about 3 minutes each; they can run side by side
PLAY_LANG=es,fr,de,it,ja node scripts/play-compose.mjs                            # only the translations
```

The Japanese shots need a Japanese font on the machine (`fonts-noto-cjk` on Linux), or the kanji come out in Chinese shapes. The gym preset name ("Commercial gym") stays English in every language, as it does in the app.

The captions live in `scripts/play-captions.json` (what `play-compose.mjs` draws) and in the tables below; the test checks they match.

## Español

### App name

**Liftsmith: Rutinas de gimnasio**

### Short description

**Entrenos de gimnasio adaptativos que explican cada peso. Una serie, un toque.**

### Full description

```text
Liftsmith planifica tu entrenamiento de fuerza de hoy según el equipo de tu gimnasio, lo recuperado que está cada músculo y la semana de tu bloque de entrenamiento. Después se aparta mientras levantas.

TU ENTRENAMIENTO, YA PLANIFICADO
• Elige una duración de 15 a 90 minutos, con calentamiento y descansos incluidos, y Liftsmith la llena con ejercicios que tu gimnasio puede hacer de verdad.
• Bloques de entrenamiento con repeticiones en reserva que se ajustan semana a semana, y después una semana de descarga.
• Doble progresión: completa tus repeticiones y la siguiente sesión suma una repetición o sube el peso.
• Una decisión diaria a partir de tus propios datos: día para apretar, según el plan o suave. Siempre puedes cambiarla.
• O sigue un programa clásico, como 5×5 o empuje/tirón/pierna, o tus propias rutinas guardadas.

CADA NÚMERO DICE POR QUÉ
• Cada ejercicio, número de series, peso y objetivo de repeticiones lleva una razón corta en palabras sencillas.
• Las notas del entrenador detectan lo que hay que hacer: un ejercicio estancado, un músculo por debajo de sus series semanales, fatiga acumulada, la última semana dura de un bloque. Casi todo se arregla con un toque.

HECHA PARA LA SALA DE PESAS
• Un toque registra la serie según lo planificado. La siguiente serie siempre está rellenada.
• El temporizador de descanso arranca solo y muestra los discos de la siguiente serie, para que cargues la barra mientras descansas.
• Cálculo de discos para cada serie con barra, con los discos que tu gimnasio tiene de verdad.
• Cuenta atrás del descanso, siguiente serie y botón Registrar serie en la pantalla de bloqueo y en la notificación.
• Una demostración en 3D de cada ejercicio, con los músculos que trabaja.
• El modo lesión omite o aligera los ejercicios que cargan una zona dolorida y te ayuda a volver poco a poco.

RECUPERACIÓN Y PROGRESO
• Un mapa del cuerpo con lo recuperado que está cada músculo, a partir de tus propias series.
• 1RM estimado de cada ejercicio, puntuación DOTS, puntuación de fuerza y récords personales.
• Calculadora de TDEE que se ajusta a tus pesajes y a lo a menudo que entrenas.

CONSTANCIA
• Las rachas cuentan semanas que cumplen tu objetivo, así que los días de descanso nunca las rompen.
• Niveles, misiones semanales, más de 150 insignias y un cofre después de cada entrenamiento.
• Amigos si los quieres: publica un entrenamiento para los seguidores que apruebes.

EN TU MUÑECA
• Una app para Wear OS muestra la serie, el peso y las repeticiones o la cuenta atrás del descanso, lee el pulso del reloj y registra la serie con un toque.

TUS DATOS, EN TU TELÉFONO
• Funciona sin conexión. No necesitas cuenta.
• Inicia sesión con Google o con tu correo para hacer copias de seguridad y sincronizar con la app web, si quieres.
• Lee el peso, la altura y la grasa corporal de Health Connect, y guarda ahí las calorías activas de cada entrenamiento.
• Sin anuncios, nunca.

PARA CADA PERSONA QUE ENTRENA
• Controles para una mano, izquierda o derecha, con botones que se mantienen pulsados en vez de escribir.
• Tamaño de texto que sigue al de tu teléfono, colores aptos para daltonismo, opción de alto contraste y compatibilidad con lectores de pantalla.
• En español, inglés, francés, alemán, italiano y japonés.

LIFTSMITH PRO
El registro, el cálculo de discos, el temporizador de descanso, los controles en la pantalla de bloqueo, los programas fijos, un entrenamiento adaptativo a la semana y las razones del entrenador son gratis. Pro añade programación adaptativa diaria, divisiones, el mapa de recuperación, estadísticas avanzadas, conexiones en la nube, el detective de estancamientos y el planificador de objetivos. Pruébalo gratis 14 días.

Liftsmith no es una app médica. Habla con un médico antes de empezar un programa de entrenamiento nuevo, sobre todo después de una lesión.

¿Preguntas o ideas? Envía tus comentarios desde Ajustes o escribe a hello@getliftsmith.com.
```

### Phone screenshots

`store/play/phone-es/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Tu entrenamiento, ya planificado | Hecho con tu gimnasio, tu recuperación y tu bloque de entrenamiento |
| 2 | 02-today-plan.jpg | Cada ejercicio dice por qué | Recuperación, series semanales y la última vez, en palabras sencillas |
| 3 | 03-workout.jpg | Un toque registra la serie | Peso objetivo, discos por lado y una demo en 3D de cada ejercicio |
| 4 | 04-why.jpg | ¿Por qué este peso? | Toca para ver la regla detrás de cada número |
| 5 | 05-rest.jpg | El descanso se cronometra solo | Carga los discos de la siguiente serie mientras descansas |
| 6 | 06-recovery.jpg | Mira qué está recuperado | Cada músculo, a partir de tus propias series |
| 7 | 07-progress.jpg | Tu entrenador te dice qué hacer | Detecta estancamientos y músculos cortos de series, y arréglalos con un toque |
| 8 | 08-done.jpg | Récords, niveles e insignias | Cada entrenamiento te hace avanzar |

## Français

### App name

**Liftsmith : programme de muscu**

### Short description

**Séances de muscu adaptatives qui expliquent chaque charge. Un geste par série.**

### Full description

```text
Liftsmith prépare votre séance de musculation du jour selon le matériel de votre salle, la récupération de chaque muscle et la semaine de votre bloc d’entraînement. Ensuite, l’appli s’efface pendant que vous soulevez.

VOTRE SÉANCE, DÉJÀ PRÊTE
• Choisissez une durée de 15 à 90 minutes, échauffement et repos compris, et Liftsmith la remplit d’exercices que votre salle permet vraiment.
• Des blocs d’entraînement avec des répétitions en réserve qui se resserrent semaine après semaine, puis une semaine de décharge.
• Double progression : faites toutes vos répétitions et la séance suivante ajoute une répétition ou augmente la charge.
• Un avis quotidien tiré de vos propres données : jour pour pousser, comme prévu ou en douceur. Vous pouvez toujours le changer.
• Ou suivez un programme classique, comme le 5×5 ou push/pull/jambes, ou vos propres routines.

CHAQUE CHIFFRE DIT POURQUOI
• Chaque exercice, nombre de séries, charge et objectif de répétitions s’accompagne d’une courte raison en mots simples.
• Les notes du coach repèrent ce qu’il faut faire : un exercice qui stagne, un muscle qui manque de séries, une fatigue qui s’accumule. La plupart se règlent d’un geste.

FAITE POUR LA SALLE
• Un geste enregistre la série comme prévu. La série suivante est toujours remplie.
• Le minuteur de repos démarre tout seul et affiche les disques de la série suivante, pour charger la barre pendant le repos.
• Le calcul des disques pour chaque série à la barre, avec les disques que votre salle possède vraiment.
• Compte à rebours du repos, série suivante et bouton Enregistrer la série sur l’écran de verrouillage et dans la notification.
• Une démonstration en 3D de chaque exercice, avec les muscles sollicités.
• Le mode blessure évite ou allège les exercices qui sollicitent une zone douloureuse.

RÉCUPÉRATION ET PROGRÈS
• Une carte du corps qui montre la récupération de chaque muscle, d’après vos propres séries.
• 1RM estimé pour chaque exercice, score DOTS, score de force et records personnels.
• Un calculateur de dépense énergétique (TDEE) qui suit vos pesées et votre fréquence d’entraînement.

RESTER RÉGULIER
• Votre série compte les semaines où vous atteignez votre objectif, donc les jours de repos ne la cassent jamais.
• Niveaux, quêtes de la semaine, plus de 150 badges et un coffre après chaque séance.
• Des amis si vous le souhaitez : publiez une séance pour les abonnés que vous acceptez.

À VOTRE POIGNET
• Une appli Wear OS affiche la série, la charge et les répétitions ou le compte à rebours du repos, lit la fréquence cardiaque de la montre et enregistre la série d’un geste.

VOS DONNÉES, SUR VOTRE TÉLÉPHONE
• Fonctionne entièrement hors ligne. Aucun compte nécessaire.
• Connexion facultative avec Google ou par e-mail pour sauvegarder et synchroniser avec l’appli web.
• Lit le poids, la taille et la masse grasse depuis Health Connect, et y enregistre les calories actives de chaque séance.
• Aucune publicité, jamais.

POUR TOUS LES PRATIQUANTS
• Commandes à une main, gauche ou droite, avec des boutons à maintenir au lieu de taper.
• Taille du texte qui suit votre téléphone, couleurs adaptées au daltonisme, option de contraste élevé et prise en charge des lecteurs d’écran.
• En français, anglais, espagnol, allemand, italien et japonais.

LIFTSMITH PRO
Le journal, le calcul des disques, le minuteur de repos, les commandes sur l’écran de verrouillage, les programmes fixes, une séance adaptative par semaine et les explications du coach sont gratuits. Pro ajoute la programmation adaptative quotidienne, les répartitions, la carte de récupération, les statistiques avancées, les connexions cloud, le détective des plateaux et le planificateur d’objectifs. Essai gratuit de 14 jours.

Liftsmith n’est pas une appli médicale. Parlez-en à un médecin avant de commencer un nouveau programme, surtout après une blessure.

Des questions ou des idées ? Envoyez un avis depuis Réglages ou écrivez à hello@getliftsmith.com.
```

### Phone screenshots

`store/play/phone-fr/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Votre séance, déjà prête | Construite d’après votre salle, votre récupération et votre bloc |
| 2 | 02-today-plan.jpg | Chaque exercice dit pourquoi | Récupération, séries de la semaine et dernière fois, en mots simples |
| 3 | 03-workout.jpg | Un geste enregistre la série | Charge cible, disques par côté et une démo 3D de chaque exercice |
| 4 | 04-why.jpg | Pourquoi cette charge ? | Touchez pour voir la règle derrière chaque chiffre |
| 5 | 05-rest.jpg | Le repos se chronomètre seul | Chargez les disques de la série suivante pendant le repos |
| 6 | 06-recovery.jpg | Voyez ce qui a récupéré | Chaque muscle, d’après vos propres séries |
| 7 | 07-progress.jpg | Votre coach dit quoi faire | Repérez tôt les plateaux et les muscles en retard, réglez-les d’un geste |
| 8 | 08-done.jpg | Records, niveaux et badges | Chaque séance vous fait avancer |

## Deutsch

### App name

**Liftsmith: Trainingsplan Gym**

### Short description

**Adaptive Gym-Workouts, die jedes Gewicht erklären. Jeder Satz mit einem Tipp.**

### Full description

```text
Liftsmith plant dein heutiges Krafttraining nach den Geräten in deinem Studio, danach, wie erholt jeder Muskel ist, und nach der Woche deines Trainingsblocks. Dann hält sich die App zurück, während du trainierst.

DEIN TRAINING, SCHON GEPLANT
• Wähl eine Dauer von 15 bis 90 Minuten, Aufwärmen und Pausen inklusive, und Liftsmith füllt sie mit Übungen, die dein Studio wirklich hergibt.
• Trainingsblöcke mit Wiederholungen in Reserve, die von Woche zu Woche enger werden, danach eine Deload-Woche.
• Doppelte Progression: Schaffst du deine Wiederholungen, kommt beim nächsten Mal eine Wiederholung oder mehr Gewicht dazu.
• Eine tägliche Empfehlung aus deinen eigenen Daten: Gas geben, wie geplant oder locker. Du kannst sie jederzeit ändern.
• Oder folge einem klassischen Programm wie 5×5 oder Push/Pull/Beine, oder deinen eigenen Routinen.

JEDE ZAHL SAGT, WARUM
• Jede Übung, jede Satzzahl, jedes Gewicht und jedes Wiederholungsziel hat einen kurzen Grund in einfachen Worten.
• Coach-Notizen erkennen, was zu tun ist: eine Übung, die stagniert, ein Muskel unter seinen Wochensätzen, wachsende Ermüdung, die letzte harte Woche eines Blocks. Das meiste löst du mit einem Tipp.

GEMACHT FÜR DIE TRAININGSFLÄCHE
• Ein Tipp trägt den Satz wie geplant ein. Der nächste Satz ist immer schon ausgefüllt.
• Der Pausentimer startet von selbst und zeigt die Scheiben für den nächsten Satz, damit du in der Pause die Stange beladen kannst.
• Scheibenrechner für jeden Langhantelsatz, mit den Scheiben, die dein Studio wirklich hat.
• Pausen-Countdown, nächster Satz und die Schaltfläche Satz eintragen auf dem Sperrbildschirm und in der Benachrichtigung.
• Eine 3D-Demo jeder Übung mit den Muskeln, die sie trainiert.
• Der Verletzungsmodus lässt Übungen weg oder macht sie leichter, wenn sie eine schmerzende Stelle belasten, und führt dich schrittweise zurück.

ERHOLUNG UND FORTSCHRITT
• Eine Körperkarte, die zeigt, wie erholt jeder Muskel ist, aus deinen eigenen Sätzen.
• Geschätztes Einwiederholungsmaximum für jede Übung, DOTS-Wert, Kraftwert und persönliche Rekorde.
• Ein TDEE-Rechner, der mit deinen Wiegungen und deiner Trainingshäufigkeit Schritt hält.

DRANBLEIBEN
• Deine Serie zählt Wochen, in denen du dein Ziel erreichst, deshalb unterbrechen Ruhetage sie nie.
• Level, Wochenquests, über 150 Abzeichen und eine Kiste nach jedem Training.
• Freunde, wenn du willst: Teile ein Training mit Followern, die du bestätigst.

AM HANDGELENK
• Eine Wear-OS-App zeigt Satz, Gewicht und Wiederholungen oder den Pausen-Countdown, liest die Herzfrequenz der Uhr und trägt den Satz mit einem Tipp ein.

DEINE DATEN, AUF DEINEM HANDY
• Funktioniert komplett offline. Kein Konto nötig.
• Melde dich mit Google oder per E-Mail an, um zu sichern und mit der Web-App zu synchronisieren, wenn du möchtest.
• Liest Gewicht, Größe und Körperfett aus Health Connect und speichert dort die aktiven Kalorien jedes Trainings.
• Keine Werbung, niemals.

FÜR ALLE, DIE TRAINIEREN
• Einhandbedienung für links oder rechts, mit Tasten zum Gedrückthalten statt Tippen.
• Textgröße, die deinem Handy folgt, farbenblindfreundliche Farben, eine Option für hohen Kontrast und Unterstützung für Screenreader.
• Auf Deutsch, Englisch, Spanisch, Französisch, Italienisch und Japanisch.

LIFTSMITH PRO
Das Trainingslog, der Scheibenrechner, der Pausentimer, die Steuerung auf dem Sperrbildschirm, feste Programme, ein adaptives Training pro Woche und die Begründungen des Coachs sind kostenlos. Pro bringt tägliche adaptive Planung, Splits, die Erholungskarte, erweiterte Statistiken, Cloud-Verbindungen, den Plateau-Detektiv und den Zielplaner. Teste es 14 Tage kostenlos.

Liftsmith ist keine medizinische App. Sprich mit einer Ärztin oder einem Arzt, bevor du ein neues Trainingsprogramm beginnst, vor allem nach einer Verletzung.

Fragen oder Ideen? Schick Feedback aus den Einstellungen oder schreib an hello@getliftsmith.com.
```

### Phone screenshots

`store/play/phone-de/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Dein Training, schon geplant | Aus deinem Studio, deiner Erholung und deinem Trainingsblock |
| 2 | 02-today-plan.jpg | Jede Übung sagt, warum | Erholung, Wochensätze und das letzte Mal, in einfachen Worten |
| 3 | 03-workout.jpg | Ein Tipp trägt den Satz ein | Zielgewicht, Scheiben pro Seite und eine 3D-Demo jeder Übung |
| 4 | 04-why.jpg | Warum dieses Gewicht? | Tippe, um die Regel hinter jeder Zahl zu sehen |
| 5 | 05-rest.jpg | Die Pause läuft von selbst | Belade in der Pause die Scheiben für den nächsten Satz |
| 6 | 06-recovery.jpg | Sieh, was erholt ist | Jeder Muskel, aus deinen eigenen Sätzen |
| 7 | 07-progress.jpg | Dein Coach sagt, was als Nächstes kommt | Plateaus und zu kurz gekommene Muskeln früh erkennen und mit einem Tipp lösen |
| 8 | 08-done.jpg | Rekorde, Level und Abzeichen | Jedes Training bringt dich weiter |

## Italiano

### App name

**Liftsmith: Schede palestra**

### Short description

**Allenamenti in palestra adattivi che spiegano ogni carico. Una serie, un tocco.**

### Full description

```text
Liftsmith prepara l’allenamento di forza di oggi in base all’attrezzatura della tua palestra, a quanto è recuperato ogni muscolo e alla settimana del tuo blocco di allenamento. Poi si fa da parte mentre ti alleni.

IL TUO ALLENAMENTO, GIÀ PRONTO
• Scegli una durata da 15 a 90 minuti, riscaldamento e riposi inclusi, e Liftsmith la riempie con esercizi che la tua palestra permette davvero.
• Blocchi di allenamento con ripetizioni di riserva che si stringono settimana dopo settimana, poi una settimana di scarico.
• Doppia progressione: completa le ripetizioni e la sessione dopo aggiunge una ripetizione o aumenta il carico.
• Un consiglio quotidiano dai tuoi dati: spingi, come previsto o leggero. Puoi sempre cambiarlo.
• Oppure segui un programma classico, come il 5×5 o spinta/trazione/gambe, o le tue routine salvate.

OGNI NUMERO DICE PERCHÉ
• Ogni esercizio, numero di serie, carico e obiettivo di ripetizioni ha una breve spiegazione in parole semplici.
• Le note del coach notano cosa fare: un esercizio fermo, un muscolo sotto le sue serie settimanali, la fatica che si accumula, l’ultima settimana dura di un blocco. Quasi tutto si sistema con un tocco.

FATTA PER LA SALA PESI
• Un tocco registra la serie come previsto. La serie successiva è sempre già compilata.
• Il timer di riposo parte da solo e mostra i dischi della serie successiva, così carichi il bilanciere mentre riposi.
• Calcolo dei dischi per ogni serie al bilanciere, con i dischi che la tua palestra ha davvero.
• Conto alla rovescia del riposo, serie successiva e pulsante Registra serie sulla schermata di blocco e nella notifica.
• Una demo in 3D di ogni esercizio, con i muscoli che allena.
• La modalità infortunio salta o alleggerisce gli esercizi che caricano una zona dolorante e ti fa tornare gradualmente.

RECUPERO E PROGRESSI
• Una mappa del corpo che mostra quanto è recuperato ogni muscolo, dalle tue serie.
• Massimale stimato per ogni esercizio, punteggio DOTS, punteggio di forza e record personali.
• Un calcolatore del TDEE che segue le tue pesate e quanto spesso ti alleni.

COSTANZA
• La tua serie conta le settimane in cui raggiungi l’obiettivo, quindi i giorni di riposo non la interrompono mai.
• Livelli, missioni settimanali, oltre 150 badge e una cassa dopo ogni allenamento.
• Amici, se vuoi: pubblica un allenamento per i follower che approvi.

AL POLSO
• Un’app per Wear OS mostra la serie, il carico e le ripetizioni o il conto alla rovescia del riposo, legge la frequenza cardiaca dall’orologio e registra la serie con un tocco.

I TUOI DATI, SUL TUO TELEFONO
• Funziona completamente offline. Nessun account necessario.
• Accedi con Google o con l’email per fare il backup e sincronizzare con l’app web, se vuoi.
• Legge peso, altezza e grasso corporeo da Health Connect e ci salva le calorie attive di ogni allenamento.
• Nessuna pubblicità, mai.

PER CHIUNQUE SI ALLENI
• Comandi a una mano, sinistra o destra, con pulsanti da tenere premuti invece di scrivere.
• Dimensione del testo che segue il telefono, colori adatti al daltonismo, opzione ad alto contrasto e supporto per lettori di schermo.
• In italiano, inglese, spagnolo, francese, tedesco e giapponese.

LIFTSMITH PRO
Il registro, il calcolo dei dischi, il timer di riposo, i comandi sulla schermata di blocco, i programmi fissi, un allenamento adattivo a settimana e le spiegazioni del coach sono gratis. Pro aggiunge la programmazione adattiva quotidiana, gli split, la mappa del recupero, le statistiche avanzate, le connessioni cloud, il detective degli stalli e il pianificatore di obiettivi. Provalo gratis per 14 giorni.

Liftsmith non è un’app medica. Parla con un medico prima di iniziare un nuovo programma di allenamento, soprattutto dopo un infortunio.

Domande o idee? Invia un feedback dalle Impostazioni o scrivi a hello@getliftsmith.com.
```

### Phone screenshots

`store/play/phone-it/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Il tuo allenamento, già pronto | Costruito sulla tua palestra, sul tuo recupero e sul tuo blocco |
| 2 | 02-today-plan.jpg | Ogni esercizio dice perché | Recupero, serie settimanali e l’ultima volta, in parole semplici |
| 3 | 03-workout.jpg | Un tocco registra la serie | Carico obiettivo, dischi per lato e una demo 3D di ogni esercizio |
| 4 | 04-why.jpg | Perché questo carico? | Tocca per vedere la regola dietro ogni numero |
| 5 | 05-rest.jpg | Il riposo si cronometra da solo | Carica i dischi della serie successiva mentre riposi |
| 6 | 06-recovery.jpg | Guarda cosa è recuperato | Ogni muscolo, dalle tue serie |
| 7 | 07-progress.jpg | Il tuo coach ti dice cosa fare | Nota presto stalli e muscoli indietro, sistemali con un tocco |
| 8 | 08-done.jpg | Record, livelli e badge | Ogni allenamento ti porta avanti |

## 日本語

### App name

**Liftsmith：ジムの筋トレメニュー**

### Short description

**使える器具と回復に合わせた筋トレメニュー。重量の理由がわかり、記録はワンタップ。**

### Full description

```text
Liftsmith は、ジムにある器具、筋肉ごとの回復具合、トレーニングブロックの何週目かをもとに、今日の筋トレメニューを組み立てます。トレーニング中は邪魔をしません。

今日のメニューは、もうできています
• 15〜90分から時間を選ぶと、ウォームアップと休憩を含めて、あなたのジムで本当にできる種目でメニューを埋めます。
• 余力レップ数（RIR）が週ごとに締まっていくトレーニングブロックと、その後のディロード週。
• ダブルプログレッション：目標レップを達成すると、次回はレップが1回増えるか重量が上がります。
• あなた自身のデータから毎日の判断：攻める、予定どおり、軽めに。いつでも変更できます。
• クラシックなプログラムもあります：5×5、3×5、段階的なプログレッション、トレーニングマックスのウェーブ、プッシュ・プル・脚、上半身・下半身、自重スキル、保存した自分のルーティン。

すべての数字に理由があります
• 種目、セット数、重量、目標レップには、それぞれ短くわかりやすい理由がつきます。
• どのセットでも「なぜ？」をタップすると、その根拠がわかります：前回のトレーニング、あなたのフィードバック、ブロックの週、手持ちのプレートでの丸め方。
• コーチのメモが、やるべきことを見つけます：伸び悩んでいる種目、週のセット数が足りない筋肉、たまってきた疲労、ブロック最後のきつい週。ほとんどはワンタップで対処できます。

ジムのフロアのために
• ワンタップで予定どおりにセットを記録。次のセットは常に入力済みです。
• 休憩タイマーは自動で始まり、次のセットのプレートを表示するので、休憩中にバーを準備できます。
• あなたのジムに実際にあるプレートで、バーベルの全セットのプレート計算。
• 休憩のカウントダウン、次のセット、「セットを記録」ボタンをロック画面と通知に表示。
• すべての種目に3Dデモと、鍛えられる筋肉の表示。
• スーパーセット、ウォームアップセット、種目の入れ替え、メモ、自分で作った種目。
• ケガモードは、痛む部位に負担がかかる種目を外すか軽くして、少しずつ元に戻します。

回復と進捗
• あなたのセットから、筋肉ごとの回復具合を示すボディマップ。
• すべての種目の推定1RM、DOTSスコア、筋力スコア、自己ベスト。
• 研究にもとづく目安と比べた、筋肉ごとの週のセット数。
• 体重の測定とトレーニング頻度に合わせて更新されるTDEE計算。
• 体重の記録と、スマホから外に出ないプライベートな進捗写真。

続けるために
• 連続記録は目標を達成した週を数えるので、休みの日で途切れることはありません。
• レベル、週ごとのクエスト、150以上のバッジ、毎回のトレーニング後の宝箱。
• トレーニング日のリマインダー、ワークアウトを始めるためのホーム画面ウィジェットとクイック設定タイル。
• フレンド機能もお好みで：承認したフォロワーにワークアウトを投稿できます。

手首でも
• Wear OS アプリでセット、重量、レップまたは休憩のカウントダウンを表示。ウォッチで心拍数を測り、ワンタップでセットを記録できます。

データはあなたのスマホに
• 完全にオフラインで使えます。アカウントは不要です。
• お好みで Google またはメールでログインすると、バックアップとウェブアプリとの同期ができます。
• ヘルスコネクトから体重、身長、体脂肪率を読み込み、各ワークアウトのアクティブカロリーを保存します。
• 心拍数を共有する Bluetooth の心拍計やウォッチから、リアルタイムの心拍数。
• 他のアプリの CSV から履歴を取り込み、セットや完全なバックアップをいつでも書き出せます。
• 広告は一切ありません。

すべての人のために
• 左右どちらの手にも対応した片手操作。文字入力の代わりに長押しで連続で動くボタン。
• スマホに合わせた文字サイズ、色覚に配慮した配色、ハイコントラスト、スクリーンリーダー対応。
• ライトとダークのテーマ、動きを抑えたシンプルモード。
• 日本語、英語、スペイン語、フランス語、ドイツ語、イタリア語に対応。

LIFTSMITH PRO
記録、プレート計算、休憩タイマー、ロック画面の操作、固定プログラム、週1回のアダプティブなワークアウト、コーチの理由は無料です。Pro では、毎日のアダプティブなプログラム、分割法、回復マップ、詳しい統計、クラウド連携、停滞探偵、目標プランナーが使えます。14日間無料でお試しいただけます。

Liftsmith は医療用アプリではありません。新しいトレーニングを始める前、特にケガのあとは、医師に相談してください。

ご質問やご意見は、設定からフィードバックを送るか、hello@getliftsmith.com までお寄せください。
```

### Phone screenshots

`store/play/phone-ja/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | 今日のメニューは、もうできています | ジムの器具、回復具合、トレーニングブロックから |
| 2 | 02-today-plan.jpg | すべての種目に理由があります | 回復、週のセット数、前回の内容をわかりやすく |
| 3 | 03-workout.jpg | ワンタップでセットを記録 | 目標重量、片側のプレート、全種目の3Dデモ |
| 4 | 04-why.jpg | なぜこの重量？ | タップすると、すべての数字の根拠がわかります |
| 5 | 05-rest.jpg | 休憩タイマーは自動で | 休憩中に次のセットのプレートを準備 |
| 6 | 06-recovery.jpg | 回復した筋肉がわかる | あなたのセットから、筋肉ごとに |
| 7 | 07-progress.jpg | 次にやることをコーチが提案 | 伸び悩みや不足を早めに見つけて、ワンタップで対処 |
| 8 | 08-done.jpg | 自己ベスト、レベル、バッジ | トレーニングのたびに前進 |
