# Google Play store listing: translations

The [English listing](PLAY_LISTING.md) in the app's other nine languages, for Play Console › Grow users › Store presence › Store listings › Manage translations › **Add your own translations**. Paste each language's name, short description and full description, and upload its phone screenshots. Tablet and Chromebook screenshots, the feature graphic and the video stay the English ones, which Play shows for any language that has none of its own.

Which Play languages get which text:

| Text | Play languages |
| --- | --- |
| Español | Spanish (Spain) es-ES, Spanish (Latin America) es-419, Spanish (United States) es-US |
| Français | French (France) fr-FR, French (Canada) fr-CA |
| Deutsch | German de-DE |
| Italiano | Italian it-IT |
| 日本語 | Japanese ja-JP |
| Português (Brasil) | Portuguese (Brazil) pt-BR, Portuguese (Portugal) pt-PT |
| 한국어 | Korean ko-KR |
| Polski | Polish pl-PL |
| Türkçe | Turkish tr-TR |

Same rules as the English listing: only what ships on Android today, no other apps' names, no "best" or "#1" in any language, no emoji, no all caps, no prices, and every URL uses `www`. The app's own fixed terms are used (Log set, readiness, deload and the rest; see Languages in [Borrowed from Gradelings](decisions/borrowed-from-gradelings.md)), and the register matches the app: Spanish *tú*, French *vous*, German *du*, Italian *tu*, Japanese です・ます, Brazilian Portuguese *você*, Korean 해요체, Polish *ty*, Turkish *sen*. `src/lib/playListing.test.ts` checks the limits and rules for every language here.

The screenshots are the English set's eight phone shots with the app and the captions in each language. Make them with:

```bash
npm run build:static
for l in es fr de it ja pt ko pl tr; do PLAY_LANG=$l node scripts/play-capture.mjs; done   # about 3 minutes each; they can run side by side
PLAY_LANG=es,fr,de,it,ja,pt,ko,pl,tr node scripts/play-compose.mjs                            # only the translations
```

The Japanese and Korean shots need a CJK font on the machine (`fonts-noto-cjk` on Linux), or the kanji come out in Chinese shapes. The gym preset name ("Commercial gym") stays English in every language, as it does in the app.

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
• En español, inglés, francés, alemán, italiano, japonés, portugués, coreano, polaco y turco.

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
• En français, anglais, espagnol, allemand, italien, japonais, portugais, coréen, polonais et turc.

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
• Auf Deutsch, Englisch, Spanisch, Französisch, Italienisch, Japanisch, Portugiesisch, Koreanisch, Polnisch und Türkisch.

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
• In italiano, inglese, spagnolo, francese, tedesco, giapponese, portoghese, coreano, polacco e turco.

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
• 日本語、英語、スペイン語、フランス語、ドイツ語、イタリア語、ポルトガル語、韓国語、ポーランド語、トルコ語に対応。

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

## Português (Brasil)

### App name

**Liftsmith: Treino de academia**

### Short description

**Treinos adaptativos que explicam cada peso. Registre cada série com um toque.**

### Full description

```text
O Liftsmith monta o treino de força de hoje com base no equipamento da sua academia, no quanto cada músculo está recuperado e em que ponto do bloco de treino você está. Depois sai do caminho enquanto você treina.

SEU TREINO, JÁ PLANEJADO
• Escolha uma duração de 15 a 90 minutos, com aquecimento e descanso incluídos, e o Liftsmith preenche com exercícios que sua academia realmente permite.
• Blocos de treino com repetições na reserva que apertam semana a semana, depois um deload.
• Progressão dupla: bata suas reps e a próxima sessão soma uma rep ou aumenta o peso.
• Uma decisão do dia a partir dos seus próprios dados: forçar, como planejado ou pegar leve. Você sempre pode mudar.
• Ou siga um programa clássico, como 5×5 ou push/pull/legs, ou suas próprias rotinas salvas.

CADA NÚMERO DIZ O PORQUÊ
• Cada exercício, número de séries, peso e meta de reps vem com um motivo curto, em palavras simples.
• As Notas do coach apontam o que fazer: um exercício estagnado, um músculo abaixo das séries semanais, cansaço acumulando, a última semana pesada de um bloco. Quase tudo se resolve com um toque.

FEITO PARA A ACADEMIA
• Um toque registra a série como planejado. A próxima série já vem preenchida.
• O timer de descanso começa sozinho e mostra as anilhas da próxima série, para você montar a barra enquanto descansa.
• Cálculo de anilhas para cada série com barra, usando as anilhas que sua academia realmente tem.
• Contagem do descanso, próxima série e botão Registrar série na tela de bloqueio e na notificação.
• Uma demonstração em 3D de cada exercício, com os músculos que ele trabalha.
• O modo lesão pula ou alivia exercícios que forçam uma área dolorida e ajuda você a voltar aos poucos.

RECUPERAÇÃO E PROGRESSO
• Um mapa do corpo com o quanto cada músculo está recuperado, a partir das suas séries.
• 1RM estimado para cada exercício, pontuação DOTS, pontuação de força e recordes pessoais.
• Calculadora de TDEE que acompanha suas pesagens e a frequência dos seus treinos.

MANTENHA A CONSTÂNCIA
• A sequência conta as semanas em que você bate a meta, então os dias de descanso nunca a quebram.
• Níveis, missões semanais, mais de 150 medalhas e uma caixa depois de cada treino.
• Amigos, se você quiser: publique um treino para seguidores que você aprovar.

NO SEU PULSO
• Um app para Wear OS mostra a série, o peso e as reps ou a contagem do descanso, lê a frequência cardíaca do relógio e registra a série com um toque.

SEUS DADOS, NO SEU CELULAR
• Funciona totalmente offline. Não precisa de conta.
• Entre com o Google ou com seu e-mail para fazer backup e sincronizar com o app web, se quiser.
• Lê peso, altura e gordura corporal do Health Connect e salva lá as calorias ativas de cada treino.
• Importe seu histórico do CSV de outro app e exporte suas séries ou um backup completo quando quiser.
• Sem anúncios, nunca.

PARA TODO MUNDO QUE TREINA
• Controles para uma mão, esquerda ou direita, com botões de segurar para repetir em vez de digitar.
• Tamanho do texto que segue o celular, cores seguras para daltônicos, opção de alto contraste e suporte a leitores de tela.
• Temas claro e escuro e um Modo enxuto com menos animação.
• Em português, inglês, espanhol, francês, alemão, italiano, japonês, coreano, polonês e turco.

LIFTSMITH PRO
O registro de treinos, o cálculo de anilhas, o timer de descanso, os controles na tela de bloqueio, os programas fixos, um treino adaptativo por semana e as explicações do coach são grátis. O Pro adiciona programação adaptativa diária, divisões de treino, o mapa de recuperação, estatísticas avançadas, conexões na nuvem, o detetive de estagnação e o planejador de metas. Experimente grátis por 14 dias.

O Liftsmith não é um app médico. Converse com um médico antes de começar um novo programa de treino, principalmente depois de uma lesão.

Dúvidas ou ideias? Envie um feedback em Ajustes ou escreva para hello@getliftsmith.com.
```

### Phone screenshots

`store/play/phone-pt/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Seu treino, já planejado | Feito com sua academia, sua recuperação e seu bloco de treino |
| 2 | 02-today-plan.jpg | Cada exercício diz o porquê | Recuperação, séries semanais e a última vez, em palavras simples |
| 3 | 03-workout.jpg | Um toque registra a série | Peso-alvo, anilhas por lado e uma demo 3D de cada exercício |
| 4 | 04-why.jpg | Por que este peso? | Toque para ver a regra por trás de cada número |
| 5 | 05-rest.jpg | O descanso se cronometra sozinho | Monte as anilhas da próxima série enquanto descansa |
| 6 | 06-recovery.jpg | Veja o que está recuperado | Cada músculo, a partir das suas próprias séries |
| 7 | 07-progress.jpg | Seu coach diz o que fazer | Encontre estagnações e músculos atrasados cedo e resolva com um toque |
| 8 | 08-done.jpg | Recordes, níveis e medalhas | Cada treino faz você avançar |

## 한국어

### App name

**Liftsmith: 헬스장 운동 플래너**

### Short description

**무게마다 이유를 알려 주는 맞춤 헬스 운동. 세트 기록은 탭 한 번으로.**

### Full description

```text
Liftsmith는 헬스장에 있는 장비, 근육별 회복 상태, 트레이닝 블록의 진행 단계를 바탕으로 오늘의 근력 운동을 짜 줘요. 그리고 운동하는 동안에는 방해하지 않아요.

내 운동, 이미 준비 완료
• 워밍업과 휴식을 포함해 15분에서 90분 사이로 길이를 고르면, 내 헬스장에서 실제로 할 수 있는 운동 동작으로 채워 줘요.
• 여유 반복 수(RIR)가 주마다 줄어드는 트레이닝 블록, 그리고 이어지는 디로드.
• 더블 프로그레션: 목표 반복을 채우면 다음 운동에서 1회가 늘거나 무게가 올라가요.
• 내 데이터로 내리는 오늘의 판단: 강하게, 계획대로, 가볍게. 언제든 바꿀 수 있어요.
• 클래식 프로그램도 있어요: 5×5, 3×5, 단계별 프로그레션, 트레이닝 맥스 웨이브, 밀기/당기기/하체, 상체/하체, 맨몸 스킬, 직접 저장한 루틴.

모든 숫자에 이유가 있어요
• 운동 동작, 세트 수, 무게, 목표 반복마다 쉬운 말로 짧은 이유가 붙어요.
• 어느 세트에서든 "왜?"를 탭하면 그 뒤의 규칙을 볼 수 있어요: 지난 운동, 내 피드백, 블록의 몇 주 차인지, 가진 원판에 맞춘 반올림.
• 코치 노트가 해야 할 일을 짚어 줘요: 정체된 운동, 주간 세트가 부족한 근육, 쌓이는 피로, 블록의 마지막 고강도 주간. 대부분 탭 한 번으로 해결돼요.

헬스장 현장을 위해 만들었어요
• 탭 한 번으로 세트를 계획대로 기록해요. 다음 세트는 항상 미리 채워져 있어요.
• 휴식 타이머가 알아서 시작되고 다음 세트의 원판을 보여 줘서, 쉬는 동안 바벨을 준비할 수 있어요.
• 헬스장에 실제로 있는 원판으로 모든 바벨 세트의 원판 계산.
• 잠금 화면과 알림에 휴식 카운트다운, 다음 세트, 세트 기록 버튼.
• 모든 운동 동작의 3D 시범과 쓰이는 근육.
• 슈퍼세트, 워밍업 세트, 운동 교체, 메모, 나만의 운동 동작.
• 부상 모드는 아픈 부위에 부담을 주는 운동을 빼거나 가볍게 하고, 천천히 복귀하도록 도와요.

회복과 진행
• 내 세트로 계산한 근육별 회복 상태를 보여 주는 몸 지도.
• 모든 운동의 추정 1RM, DOTS 점수, 근력 점수, 개인 최고 기록.
• 연구 기반 목표와 비교한 근육별 주간 세트.
• 체중 기록과 운동 빈도에 맞춰 갱신되는 TDEE 계산기.
• 체중 기록, 그리고 휴대폰 밖으로 나가지 않는 비공개 진행 사진.

꾸준함 유지
• 연속 기록은 주간 목표를 채운 주를 세기 때문에, 쉬는 날이 연속 기록을 끊지 않아요.
• 레벨, 주간 퀘스트, 150개 이상의 배지, 운동할 때마다 받는 상자.
• 운동하는 날 알림, 그리고 홈 화면 위젯과 빠른 설정 타일로 바로 운동 시작.
• 원한다면 친구 기능도: 내가 승인한 팔로워에게 운동을 공유해요.

손목 위에서
• Wear OS 앱이 세트, 무게, 반복 또는 휴식 카운트다운을 보여 주고, 워치로 심박수를 측정하며, 탭 한 번으로 세트를 기록해요.

내 데이터는 내 휴대폰에
• 완전히 오프라인으로 작동해요. 계정이 필요 없어요.
• 원하면 Google이나 이메일로 로그인해 백업하고 웹 앱과 동기화할 수 있어요.
• 헬스 커넥트에서 체중, 키, 체지방을 읽고, 운동마다 활동 칼로리를 저장해요.
• 심박수를 공유하는 Bluetooth 심박 모니터나 워치로 실시간 심박수 확인.
• 다른 앱의 CSV로 기록을 가져오고, 세트 기록이나 전체 백업을 언제든 내보낼 수 있어요.
• 광고는 절대 없어요.

모든 운동하는 사람을 위해
• 왼손이나 오른손에 맞춘 한 손 조작, 타이핑 대신 길게 누르면 반복되는 버튼.
• 휴대폰 설정을 따르는 글자 크기, 색약 친화 색상, 고대비 옵션, 화면 낭독기 지원.
• 라이트 테마와 다크 테마, 움직임을 줄인 간결 모드.
• 한국어, 영어, 스페인어, 프랑스어, 독일어, 이탈리아어, 일본어, 포르투갈어, 폴란드어, 튀르키예어 지원.

LIFTSMITH PRO
기록, 원판 계산, 휴식 타이머, 잠금 화면 조작, 고정 프로그램, 주 1회 맞춤 운동, 코칭 이유는 무료예요. Pro는 매일 맞춤 프로그래밍, 분할 루틴, 회복 맵, 고급 통계, 클라우드 연결, 정체 탐정, 목표 플래너를 더해 줘요. 14일 동안 무료로 체험해 보세요.

Liftsmith는 의료용 앱이 아니에요. 새 트레이닝 프로그램을 시작하기 전에, 특히 부상 이후라면 의사와 상담하세요.

질문이나 아이디어가 있나요? 설정에서 피드백을 보내거나 hello@getliftsmith.com으로 메일을 보내 주세요.
```

### Phone screenshots

`store/play/phone-ko/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | 내 운동, 이미 준비 완료 | 내 헬스장, 회복 상태, 트레이닝 블록에 맞춰 짰어요 |
| 2 | 02-today-plan.jpg | 운동마다 이유를 알려 줘요 | 회복, 주간 세트, 지난 기록을 쉬운 말로 |
| 3 | 03-workout.jpg | 탭 한 번으로 세트 기록 | 목표 무게, 한쪽 원판, 모든 운동의 3D 시범 |
| 4 | 04-why.jpg | 왜 이 무게일까요? | 탭해서 모든 숫자 뒤의 규칙을 확인하세요 |
| 5 | 05-rest.jpg | 휴식 타이머가 알아서 | 쉬는 동안 다음 세트 원판을 끼우세요 |
| 6 | 06-recovery.jpg | 회복된 근육 한눈에 | 내 세트로 계산한 모든 근육 |
| 7 | 07-progress.jpg | 다음 할 일을 코치가 알려 줘요 | 정체와 부족한 근육을 일찍 찾아 탭 한 번으로 해결 |
| 8 | 08-done.jpg | 개인 최고 기록, 레벨, 배지 | 운동할 때마다 한 걸음 앞으로 |

## Polski

### App name

**Liftsmith: Trening na siłowni**

### Short description

**Adaptacyjne treningi, które wyjaśniają każdy ciężar. Seria jednym stuknięciem.**

### Full description

```text
Liftsmith planuje dzisiejszy trening siłowy na podstawie sprzętu na twojej siłowni, regeneracji każdego mięśnia i tygodnia twojego bloku treningowego. A potem nie przeszkadza, kiedy ćwiczysz.

TWÓJ TRENING, JUŻ ZAPLANOWANY
• Wybierz długość od 15 do 90 minut, z rozgrzewką i przerwami, a Liftsmith wypełni ją ćwiczeniami, które naprawdę zrobisz na swojej siłowni.
• Bloki treningowe z RIR, czyli powtórzeniami w zapasie, które z tygodnia na tydzień się zmniejszają, a potem deload.
• Podwójna progresja: zrób wszystkie powtórzenia, a na następnym treningu dojdzie powtórzenie albo wzrośnie ciężar.
• Codzienna decyzja na dziś z twoich własnych danych: Mocniej, Zgodnie z planem albo Lżej. Zawsze możesz ją zmienić.
• Albo trzymaj się klasycznego programu, jak 5×5 czy push/pull/nogi, albo swoich zapisanych planów.

KAŻDA LICZBA MÓWI DLACZEGO
• Każde ćwiczenie, liczba serii, ciężar i cel powtórzeń mają krótkie uzasadnienie prostymi słowami.
• Notatki trenera wychwytują, co trzeba zrobić: zastój w ćwiczeniu, mięsień z za małą liczbą serii w tygodniu, narastające zmęczenie, ostatni ciężki tydzień bloku. Większość naprawisz jednym stuknięciem.

STWORZONY NA SIŁOWNIĘ
• Jedno stuknięcie zapisuje serię zgodnie z planem. Następna seria jest zawsze już wypełniona.
• Minutnik przerwy włącza się sam i pokazuje talerze na następną serię, więc ładujesz sztangę w czasie przerwy.
• Obliczanie talerzy dla każdej serii ze sztangą, z talerzy, które twoja siłownia naprawdę ma.
• Odliczanie przerwy, następna seria i przycisk Zapisz serię na ekranie blokady i w powiadomieniu.
• Pokaz 3D każdego ćwiczenia, z mięśniami, które pracują.
• Tryb kontuzji pomija albo odciąża ćwiczenia, które obciążają bolące miejsce, i stopniowo wprowadza cię z powrotem.

REGENERACJA I POSTĘPY
• Mapa ciała pokazująca regenerację każdego mięśnia, na podstawie twoich serii.
• Szacowany 1RM w każdym ćwiczeniu, wynik DOTS, wynik siły i rekordy życiowe.
• Kalkulator TDEE, który nadąża za twoimi ważeniami i tym, jak często trenujesz.
• Dziennik masy ciała i prywatne zdjęcia postępów, które nigdy nie opuszczają telefonu.

REGULARNOŚĆ
• Passa liczy tygodnie, w których osiągasz cel, więc dni odpoczynku nigdy jej nie przerywają.
• Poziomy, cotygodniowe zadania, ponad 150 odznak i skrzynka po każdym treningu.
• Znajomi, jeśli chcesz: publikuj treningi dla obserwujących, których zaakceptujesz.

NA NADGARSTKU
• Aplikacja na Wear OS pokazuje serię, ciężar i powtórzenia albo odliczanie przerwy, odczytuje tętno z zegarka i zapisuje serię jednym stuknięciem.

TWOJE DANE, TWÓJ TELEFON
• Działa w pełni offline. Konto nie jest potrzebne.
• Jeśli chcesz, zaloguj się przez Google lub e-mail, żeby robić kopię zapasową i synchronizować z aplikacją internetową.
• Odczytuje wagę, wzrost i tkankę tłuszczową z Health Connect i zapisuje tam aktywne kalorie z każdego treningu.
• Tętno na żywo z dowolnego pulsometru Bluetooth lub zegarka, który udostępnia tętno.
• Bez reklam. Nigdy.

DLA KAŻDEGO, KTO TRENUJE
• Sterowanie jedną ręką, lewą lub prawą, z przyciskami do przytrzymania zamiast wpisywania.
• Rozmiar tekstu zgodny z telefonem, kolory bezpieczne dla daltonistów, opcja wysokiego kontrastu i obsługa czytników ekranu.
• Po polsku, angielsku, hiszpańsku, francusku, niemiecku, włosku, japońsku, portugalsku, koreańsku i turecku.

LIFTSMITH PRO
Dziennik treningów, obliczanie talerzy, minutnik przerwy, sterowanie z ekranu blokady, stałe programy, jeden adaptacyjny trening w tygodniu i uzasadnienia trenera są za darmo. Pro dodaje codzienne adaptacyjne planowanie, podziały treningowe, mapę regeneracji, zaawansowane statystyki, połączenia z chmurą, detektyw zastojów i planer celów. Wypróbuj za darmo przez 14 dni.

Liftsmith nie jest aplikacją medyczną. Porozmawiaj z lekarzem, zanim zaczniesz nowy program treningowy, zwłaszcza po kontuzji.

Pytania lub pomysły? Wyślij opinię z Ustawień albo napisz na hello@getliftsmith.com.
```

### Phone screenshots

`store/play/phone-pl/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Twój trening, już zaplanowany | Na podstawie twojej siłowni, regeneracji i bloku treningowego |
| 2 | 02-today-plan.jpg | Każde ćwiczenie mówi dlaczego | Regeneracja, serie w tygodniu i ostatni raz, prostymi słowami |
| 3 | 03-workout.jpg | Jedno stuknięcie zapisuje serię | Docelowy ciężar, talerze na stronę i pokaz 3D każdego ćwiczenia |
| 4 | 04-why.jpg | Dlaczego ten ciężar? | Stuknij, żeby zobaczyć regułę za każdą liczbą |
| 5 | 05-rest.jpg | Przerwa odmierza się sama | Ładuj talerze na następną serię w czasie przerwy |
| 6 | 06-recovery.jpg | Zobacz, co się zregenerowało | Każdy mięsień, na podstawie twoich serii |
| 7 | 07-progress.jpg | Trener mówi, co robić dalej | Wcześnie wyłapuj zastoje i zaległe mięśnie, napraw jednym stuknięciem |
| 8 | 08-done.jpg | Rekordy, poziomy i odznaki | Każdy trening to krok naprzód |

## Türkçe

### App name

**Liftsmith: Salon Antrenmanı**

### Short description

**Her ağırlığı açıklayan uyarlanabilir salon antrenmanları. Her set tek dokunuşla.**

### Full description

```text
Liftsmith bugünün kuvvet antrenmanını salonundaki ekipmana, her kasının ne kadar toparlandığına ve antrenman bloğunda nerede olduğuna göre planlar. Sonra sen kaldırırken araya girmez.

ANTRENMANIN ZATEN HAZIR
• 15 ile 90 dakika arasında bir süre seç; ısınma ve dinlenme dahil. Liftsmith bu süreyi salonunda gerçekten yapılabilen egzersizlerle doldurur.
• Yedekte kalan tekrarların haftadan haftaya azaldığı antrenman blokları, ardından bir deload haftası.
• Çift yönlü ilerleme: tekrarlarını tamamla, sonraki seansta bir tekrar eklensin ya da ağırlık artsın.
• Kendi verilerinden günlük bir hazırlık kararı: yüklen, plana göre ya da hafif tut. İstediğin zaman değiştirebilirsin.
• Ya da klasik bir program izle: 5×5, 3×5, itme/çekme/bacak, üst/alt vücut, vücut ağırlığı becerileri ya da kendi kayıtlı rutinlerin.

HER SAYI NEDENİNİ SÖYLER
• Her egzersiz, set sayısı, ağırlık ve tekrar hedefi sade sözlerle kısa bir gerekçeyle gelir.
• Herhangi bir sette “Neden?” düğmesine dokun ve ardındaki kuralı gör: geçen seans, geri bildirimin, bloğun haftası ve plakalarının ağırlığı nasıl yuvarladığı.
• Koç notları yapılması gerekeni yakalar: ilerlemeyen bir hareket, haftalık setlerinin gerisinde kalan bir kas, biriken yorgunluk, bir bloğun son zor haftası. Çoğu tek dokunuşla düzelir.

SALON İÇİN YAPILDI
• Tek dokunuş seti planlandığı gibi kaydeder. Sıradaki set her zaman hazır doldurulmuştur.
• Dinlenme sayacı kendiliğinden başlar ve sıradaki setin plakalarını gösterir; dinlenirken barı yükleyebilirsin.
• Her barbell seti için plaka hesabı, salonunda gerçekten olan plakalarla.
• Kilit ekranında ve bildirimde dinlenme geri sayımı, sıradaki set ve Seti kaydet düğmesi.
• Her egzersizin, çalıştırdığı kaslarla birlikte 3D demosu.
• Sakatlık modu ağrıyan bir bölgeyi yükleyen egzersizleri atlar ya da hafifletir, seni yavaş yavaş geri getirir.

TOPARLANMA VE İLERLEME
• Kendi setlerinden, her kasının ne kadar toparlandığını gösteren bir vücut haritası.
• Her hareket için tahmini 1RM, DOTS puanı, kuvvet puanı ve kişisel rekorlar.
• Tartılarına ve ne sıklıkla antrenman yaptığına ayak uyduran bir TDEE hesaplayıcısı.

İSTİKRARLI KAL
• Seriler hedefini tutturduğun haftaları sayar, dinlenme günleri seriyi asla bozmaz.
• Seviyeler, haftalık görevler, 150'den fazla rozet ve her antrenmandan sonra bir sandık.
• Antrenman günlerinde hatırlatıcılar, antrenman başlatmak için ana ekran widget'ı ve hızlı ayar kutucuğu.
• İstersen arkadaşlar: onayladığın takipçiler için antrenman paylaş.

BİLEĞİNDE
• Wear OS uygulaması seti, ağırlığı ve tekrarları ya da dinlenme geri sayımını gösterir, nabzı saatten okur ve seti tek dokunuşla kaydeder.

VERİLERİN, TELEFONUNDA
• Tamamen çevrimdışı çalışır. Hesap gerekmez.
• İstersen yedeklemek ve web uygulamasıyla eşitlemek için Google ya da e-postayla giriş yap.
• Kilo, boy ve vücut yağını Health Connect'ten okur, her antrenmanın aktif kalorisini oraya kaydeder.
• Geçmişini başka bir uygulamanın CSV dosyasından içe aktar, setlerini ya da tam yedeği istediğin zaman dışa aktar.
• Asla reklam yok.

HER SPORCU İÇİN
• Sol ya da sağ el için tek elle kullanım, yazmak yerine basılı tutunca tekrarlayan düğmeler.
• Telefonuna uyan yazı boyutu, renk körlüğüne uygun renkler, yüksek kontrast seçeneği ve ekran okuyucu desteği.
• Türkçe, İngilizce, İspanyolca, Fransızca, Almanca, İtalyanca, Japonca, Portekizce, Korece ve Lehçe.

LIFTSMITH PRO
Kayıt, plaka hesabı, dinlenme sayacı, kilit ekranı kontrolleri, sabit programlar, haftada bir uyarlanabilir antrenman ve koç gerekçeleri ücretsiz. Pro günlük uyarlanabilir programlama, bölünmüş programlar, toparlanma haritası, gelişmiş istatistikler, bulut bağlantıları, durağanlık dedektifi ve hedef planlayıcıyı ekler. 14 gün ücretsiz dene.

Liftsmith tıbbi bir uygulama değildir. Yeni bir antrenman programına başlamadan önce, özellikle bir sakatlıktan sonra, bir doktorla konuş.

Soruların ya da fikirlerin mi var? Ayarlar'dan geri bildirim gönder ya da hello@getliftsmith.com adresine yaz.
```

### Phone screenshots

`store/play/phone-tr/`

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Antrenmanın zaten hazır | Salonuna, toparlanmana ve antrenman bloğuna göre |
| 2 | 02-today-plan.jpg | Her egzersiz nedenini söyler | Toparlanma, haftalık setler ve geçen sefer, sade sözlerle |
| 3 | 03-workout.jpg | Tek dokunuş seti kaydeder | Hedef ağırlık, taraf başına plakalar ve her hareketin 3D demosu |
| 4 | 04-why.jpg | Neden bu ağırlık? | Her sayının ardındaki kuralı görmek için dokun |
| 5 | 05-rest.jpg | Dinlenme sayacı kendi çalışır | Dinlenirken sıradaki setin plakalarını tak |
| 6 | 06-recovery.jpg | Neyin toparlandığını gör | Her kas, kendi setlerinden |
| 7 | 07-progress.jpg | Koçun sıradakini söyler | Durağanlıkları ve geride kalan kasları erken gör, tek dokunuşla düzelt |
| 8 | 08-done.jpg | Rekorlar, seviyeler ve rozetler | Her antrenman seni ileri taşır |
